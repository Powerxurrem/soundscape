'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { TrackType } from './assets';
import { createAudioEngine, type AudioEngine } from './audio/audioengine';

type LibraryItem = {
  id: string;
  name: string;
  type: TrackType;
  assets: { id: string; label: string }[];
  defaultAssetId: string;
};

type MixTrack = {
  id: string;
  libraryId: string;
  name: string;
  type: TrackType;
  assetId: string;
  volume: number; // 0..1

  // event-only
  ratePreset?: 'Rare' | 'Medium' | 'Often' | 'Very Often';
  rateSpeed?: 0.5 | 1 | 2;

  // thunder-only (for now)
  randomizeVariants?: boolean;
};

const LIBRARY: LibraryItem[] = [
  {
    id: "rain",
    name: "Rain",
    type: "loop",
    defaultAssetId: "rain_soft_loop_01",
    assets: [
      { id: "rain_soft_loop_01", label: "Rain" },
    ],
  },
  {
    id: "fireplace",
    name: "Fireplace",
    type: "loop",
    defaultAssetId: "fireplace_cozy_loop_01",
    assets: [
      { id: "fireplace_cozy_loop_01", label: "Cozy Fireplace (Loop)" },
      { id: "fireplace_cozy_open_01", label: "Open Fireplace (Loop)" },
    ],
  },
  {
    id: "wind", // folder name
    name: "Dunes Wind",
    type: "loop",
    defaultAssetId: "dunes_wind",
    assets: [
      { id: "dunes_wind", label: "Dunes Wind" },
    ],
  },
  {
    id: "sea",
    name: "Sea",
    type: "loop",
    defaultAssetId: "sea_loop_01",
    assets: [
      { id: "sea_loop_01", label: "Sea" },
    ],
  },
  {
    id: "water",
    name: "Water Stream",
    type: "loop",
    defaultAssetId: "water_stream_with_distant_birds_01",
    assets: [
      { id: "water_stream_with_distant_birds_01", label: "Water Stream" },
    ],
  },
  {
    id: "forest",
    name: "Forest",
    type: "loop",
    defaultAssetId: "Forest_birds_01", // match exact casing
    assets: [
      { id: "Forest_birds_01", label: "Forest Birds" },
    ],
  },


];



function makeId(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

// Seed format like autopilot
function makeSeed() {
  return `${Date.now()}_${Math.floor(Math.random() * 1_000_000_000)}`;
}

async function fetchCreditsBalance() {
  const res = await fetch("/api/credits", { cache: "no-store" });

  const text = await res.text();
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {}

  if (!res.ok) throw new Error(data?.error ?? text ?? "Credits failed");
  return Number(data?.credits ?? 0);
}


// Map UI library IDs to folder names.
function folderIdFor(track: { type: TrackType; libraryId: string }) {
  if (track.type !== 'event') return track.libraryId;
  return track.libraryId.endsWith('_events') ? track.libraryId.replace(/_events$/, '') : track.libraryId;
}

function assetUrlFor(track: { type: TrackType; libraryId: string }, assetId: string) {
  const base = track.type === 'loop' ? 'loops' : 'events';
  const folder = folderIdFor(track);
  return `/assets/${base}/${folder}/${assetId}.mp3`;
}
// ---------- Export helpers (chunked offline WAV) ----------
const decodedCache: Record<string, Promise<AudioBuffer>> = {};
let decodeCtx: AudioContext | null = null;

async function loadAndDecodeCached(url: string) {
  if (!decodeCtx) decodeCtx = new AudioContext();

  if (!decodedCache[url]) {
    decodedCache[url] = (async () => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch ${url}`);
      const arr = await res.arrayBuffer();
      return await decodeCtx!.decodeAudioData(arr);
    })();
  }

  return decodedCache[url];
}

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedToInt(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function eventsPerMinute(p: MixTrack["ratePreset"]) {
  switch (p) {
    case "Rare": return 1;
    case "Medium": return 2;
    case "Often": return 4;
    case "Very Often": return 8;
    default: return 1;
  }
}

function buildEventTimes(seed: string, trackId: string, durationSec: number, ratePreset: MixTrack["ratePreset"]) {
  const rng = mulberry32(seedToInt(`${seed}:${trackId}`));
  const epm = eventsPerMinute(ratePreset);
  const interval = 60 / epm;
  const times: number[] = [];
  let t = rng() * interval;

  while (t < durationSec) {
    const jitter = (rng() - 0.5) * interval * 0.6;
    t += Math.max(2, interval + jitter);
    if (t < durationSec) times.push(t);
  }
  return times;
}

async function loadAndDecode(ctx: BaseAudioContext, url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  const arr = await res.arrayBuffer();
  return await ctx.decodeAudioData(arr);
}

function writeWavHeader(view: DataView, sampleRate: number, numChannels: number, numSamples: number) {
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;

  const writeStr = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };

  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, dataSize, true);
}

function audioBufferToPCM16(buffer: AudioBuffer) {
  const numChannels = buffer.numberOfChannels;
  const length = buffer.length;
  const out = new Int16Array(length * numChannels);

  for (let i = 0; i < length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      let s = buffer.getChannelData(ch)[i];
      s = Math.max(-1, Math.min(1, s));
      out[i * numChannels + ch] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
  }
  return out;
}

async function renderChunk({
  tracks,
  seed,
  masterVol,
  durationSec,
  chunkStartSec,
  chunkSec,
}: {
  tracks: MixTrack[];
  seed: string;
  masterVol: number;
  durationSec: number;
  chunkStartSec: number;
  chunkSec: number;
}) {
  const sampleRate = 44100;
  const chunkLenSec = Math.min(chunkSec, durationSec - chunkStartSec);
  const offline = new OfflineAudioContext(2, Math.ceil(chunkLenSec * sampleRate), sampleRate);

  const master = offline.createGain();
  master.gain.value = masterVol;
  master.connect(offline.destination);

  const buffers: Record<string, AudioBuffer> = {};
  for (const t of tracks) {
    const url = assetUrlFor(t, t.assetId);
    const key = `${t.type}:${t.libraryId}:${t.assetId}`;
    if (!buffers[key]) buffers[key] = await loadAndDecodeCached(url);
  }


  for (const t of tracks) {
    const gain = offline.createGain();
    gain.gain.value = t.volume;
    gain.connect(master);

    const key = `${t.type}:${t.libraryId}:${t.assetId}`;
    const buf = buffers[key];

    if (t.type === "loop") {
      const src = offline.createBufferSource();
      src.buffer = buf;
      src.loop = true;

      const offset = (chunkStartSec % buf.duration);
      src.connect(gain);
      src.start(0, offset);
    } else {
      const times = buildEventTimes(seed, t.id, durationSec, t.ratePreset ?? "Rare");
      for (const atSec of times) {
        if (atSec < chunkStartSec || atSec >= chunkStartSec + chunkLenSec) continue;
        const src = offline.createBufferSource();
        src.buffer = buf;
        src.connect(gain);
        src.start(atSec - chunkStartSec);
      }
    }
  }

  return await offline.startRendering();
}

async function exportWavChunked({
  tracks,
  seed,
  masterVol,
  durationMin,
  info,
  onProgress,
}: {
  tracks: MixTrack[];
  seed: string;
  masterVol: number;
  durationMin: number;
  info?: WavInfoTags;
  onProgress?: (done: number, total: number) => void;
}) {
  const durationSec = durationMin * 60;
  const chunkSec = 60; // keep 60s chunks
  const sampleRate = 44100;
  const numChannels = 2;

  const totalChunks = Math.ceil(durationSec / chunkSec);

  // total frames = durationSec * sampleRate, interleaved stereo => * numChannels
  const totalFrames = Math.ceil(durationSec * sampleRate);
  const pcmAll = new Int16Array(totalFrames * numChannels);

  let writeOffset = 0;

  for (let i = 0; i < totalChunks; i++) {
    const chunkStartSec = i * chunkSec;

    const buf = await renderChunk({
      tracks,
      seed,
      masterVol,
      durationSec,
      chunkStartSec,
      chunkSec,
    });

    const pcm = audioBufferToPCM16(buf);
    pcmAll.set(pcm, writeOffset);
    writeOffset += pcm.length;

    onProgress?.(i + 1, totalChunks);
  }

  const pcmBytes = new Uint8Array(pcmAll.buffer, 0, writeOffset * 2); // int16 => 2 bytes
  return makeWavBlobPCM16({ pcmBytes, sampleRate, numChannels, info });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function buildCertificateText(opts: {
  jobId: string;
  seed: string;
  durationMin: number;
  createdAtIso: string;
  tracks: MixTrack[];
  mood?: string; // optional (autopilot)
  
}) {

  const { jobId, seed, durationMin, createdAtIso, tracks } = opts;

  const lines = [
    "SOUNDSCAPE EXPORT LICENSE CERTIFICATE",
    "soundscape.run",
    "",
    `Certificate ID: ${jobId}`,
    `Issued (UTC): ${createdAtIso}`,
    "",
    "LICENSE GRANT",
    "Soundscape grants a non-exclusive, perpetual, worldwide license",
    "to use the exported audio for commercial and non-commercial purposes,",
    "including videos, games, applications, podcasts, and client work.",
    "Attribution is not required.",
    "",
    "IMPORTANT RESTRICTIONS",
    "- Exported audio may not be resold or redistributed as a standalone sound library.",
    "- Exported audio may not be sublicensed on a standalone basis.",
    "- Exported audio may not be registered with YouTube Content ID",
    "  or any other fingerprinting or rights-management system.",
    "- No ownership or exclusivity may be claimed.",
    "",
    "DETERMINISTIC OUTPUT NOTICE",
    "Soundscape uses deterministic systems.",
    "Similar or identical exports may be generated by different users.",
    "No exclusivity is granted.",
    "",
    `Seed: ${seed}`,
    `Duration: ${durationMin} minutes`,
    "",
    "Tracks:",
    ...tracks.map((t) => {
      const vol = `${Math.round(t.volume * 100)}%`;
      return `- ${t.name} (${t.type}) • ${t.libraryId}/${t.assetId}.mp3 • vol ${vol}`;
    }),
    "",
    "This certificate is issued subject to the Soundscape Terms & Conditions",
    "available at soundscape.run.",
    "",
    "Governing Law: Netherlands",
    "",
    "© 2026 Soundscape. All rights reserved.",
  ];

  return lines.join("\r\n");
}
type WavInfoTags = Partial<{
  INAM: string; // Title
  IART: string; // Artist
  IPRD: string; // Product
  ICMT: string; // Comment
  ICRD: string; // Date
  ISFT: string; // Software
}>;

function u32le(n: number) {
  const b = new ArrayBuffer(4);
  new DataView(b).setUint32(0, n, true);
  return new Uint8Array(b);
}

function fourcc(s: string) {
  return new TextEncoder().encode(s);
}

function pad2(len: number) {
  return len % 2 === 1 ? 1 : 0;
}

function concatU8(chunks: Uint8Array[]) {
  const total = chunks.reduce((s, c) => s + c.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) {
    out.set(c, off);
    off += c.length;
  }
  return out;
}

function makeListInfoChunk(info: WavInfoTags) {
  const enc = new TextEncoder();

  const subChunks: Uint8Array[] = [];
  const entries = Object.entries(info).filter(([, v]) => typeof v === "string" && v.length > 0);

  for (const [tag, value] of entries) {
    const payload = enc.encode(value);
    // each subchunk: TAG(4) + size(4) + payload + pad
    subChunks.push(
      fourcc(tag),
      u32le(payload.length),
      payload,
      new Uint8Array(pad2(payload.length))
    );
  }

  // LIST payload = "INFO" + subchunks
  const payload = concatU8([fourcc("INFO"), ...subChunks]);

  // LIST chunk = "LIST" + size + payload (+ pad on payload size)
  const size = payload.length;
  return concatU8([
    fourcc("LIST"),
    u32le(size),
    payload,
    new Uint8Array(pad2(size)),
  ]);
}

function makeWavBlobPCM16(opts: {
  pcmBytes: Uint8Array; // interleaved PCM16 LE
  sampleRate: number;
  numChannels: number;
  info?: WavInfoTags;
}) {
  const { pcmBytes, sampleRate, numChannels, info } = opts;

  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = pcmBytes.length;

  const fmtPayload = new Uint8Array(16);
  const fmtView = new DataView(fmtPayload.buffer);
  fmtView.setUint16(0, 1, true); // PCM
  fmtView.setUint16(2, numChannels, true);
  fmtView.setUint32(4, sampleRate, true);
  fmtView.setUint32(8, byteRate, true);
  fmtView.setUint16(12, blockAlign, true);
  fmtView.setUint16(14, 16, true); // bits

  const fmtChunk = concatU8([
    fourcc("fmt "),
    u32le(16),
    fmtPayload,
    new Uint8Array(pad2(16)),
  ]);

  const listChunk = info ? makeListInfoChunk(info) : new Uint8Array(0);

  const dataChunk = concatU8([
    fourcc("data"),
    u32le(dataSize),
    pcmBytes,
    new Uint8Array(pad2(dataSize)),
  ]);

  // RIFF size = 4 ("WAVE") + all subchunks
  const riffSize = 4 + fmtChunk.length + listChunk.length + dataChunk.length;

  const header = concatU8([
    fourcc("RIFF"),
    u32le(riffSize),
    fourcc("WAVE"),
  ]);

  const wav = concatU8([header, fmtChunk, listChunk, dataChunk]);
  return new Blob([wav], { type: "audio/wav" });
}


export default function MixerPage() {
  // Audio (runtime-only)
  const audioRef = useRef<AudioEngine | null>(null);
  const [audioOn, setAudioOn] = useState(false);
  const [masterVol, setMasterVol] = useState(0.8);
  async function refreshCredits() {
    try {
      setCreditsLoading(true);
      const c = await fetchCreditsBalance();
      setCredits(c);
    } catch (e) {
      console.warn("Failed to load credits", e);
    } finally {
      setCreditsLoading(false);
    }
  }

  const [assetStatus, setAssetStatus] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState('');

  // Export / Scene
  const [seed, setSeed] = useState<string>(() => makeSeed());
  type DurationMin = 5 | 15 | 30 | 60;
  const [durationMin, setDurationMin] = useState<DurationMin>(5);

  const [exportFormat, setExportFormat] = useState<'wav' | 'recipe'>('wav');

  // UI-only placeholder credits (we’ll wire real credits later)
  const [credits, setCredits] = useState<number>(0);
  const [creditsLoading, setCreditsLoading] = useState<boolean>(true);
  const [exporting, setExporting] = useState(false);
const [exportProg, setExportProg] = useState<{ done: number; total: number } | null>(null);



  const creditsCost = useMemo(() => Math.max(1, Math.round(durationMin / 5)), [durationMin]);

  const [tracks, setTracks] = useState<MixTrack[]>([


  ]);

  // Cleanup
  useEffect(() => {
    return () => {
      audioRef.current?.stopAll();
    };
  }, []);

  useEffect(() => {
  let alive = true;

  (async () => {
    try {
      setCreditsLoading(true);
      const c = await fetchCreditsBalance();
      if (alive) setCredits(c);
    } catch (e) {
      console.warn("Failed to load credits", e);
      if (alive) setCredits(0);
    } finally {
      if (alive) setCreditsLoading(false);
    }
  })();

  return () => {
    alive = false;
  };
}, []);

  async function activateAudio() {
    if (!audioRef.current) audioRef.current = createAudioEngine();
    await audioRef.current.activate();
    audioRef.current.setMaster(masterVol);
    setAudioOn(true);
    await audioRef.current.syncMix(tracks, assetUrlFor);
  }

  function stopAudio() {
    audioRef.current?.stopAll();
    setAudioOn(false);
  }

  // Keep audio synced with state
  useEffect(() => {
    if (!audioOn) return;
    if (!audioRef.current?.isActive()) return;
    audioRef.current.syncMix(tracks, assetUrlFor);
  }, [audioOn, tracks]);

  useEffect(() => {
    if (!audioOn) return;
    audioRef.current?.setMaster(masterVol);
  }, [audioOn, masterVol]);

  const filteredLibrary = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return LIBRARY;
    return LIBRARY.filter((i) => i.name.toLowerCase().includes(q));
  }, [query]);

  const loopsList = useMemo(() => filteredLibrary.filter((i) => i.type === 'loop'), [filteredLibrary]);
  const eventsList = useMemo(() => filteredLibrary.filter((i) => i.type === 'event'), [filteredLibrary]);

  function addToMix(item: LibraryItem) {
    // only one instance of each loop
    if (item.type === 'loop' && tracks.some((t) => t.type === 'loop' && t.libraryId === item.id)) return;

    const next: MixTrack = {
      id: makeId('t'),
      libraryId: item.id,
      name: item.name,
      type: item.type,
      assetId: item.defaultAssetId,
      volume: item.type === 'loop' ? 0.5 : 0.35,
      ...(item.type === 'event'
        ? {
            ratePreset: 'Rare' as const,
            rateSpeed: 1 as const,
            randomizeVariants: false,
          }
        : {}),
    };

    setTracks((prev) => [...prev, next]);
  }

  function removeTrack(id: string) {
    setTracks((prev) => prev.filter((t) => t.id !== id));
  }

  function updateTrack(id: string, patch: Partial<MixTrack>) {
    setTracks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  // Asset HEAD validation
  useEffect(() => {
    let alive = true;

    async function checkAll() {
      const entries: [string, boolean][] = await Promise.all(
        tracks.map(async (t) => {
          const url = assetUrlFor(t, t.assetId);
          try {
            const res = await fetch(url, { method: 'HEAD' });
            return [t.id, res.ok] as [string, boolean];
          } catch {
            return [t.id, false] as [string, boolean];
          }
        })
      );

      if (!alive) return;
      const next: Record<string, boolean> = {};
      for (const [id, ok] of entries) next[id] = ok;
      setAssetStatus(next);
    }

    checkAll();
    return () => {
      alive = false;
    };
  }, [tracks]);

  // placeholder actions
async function exportMix() {
  let jobId: string | null = null;
  if (tracks.length === 0) {
  alert("Add at least one track before exporting.");
  return;
}


  try {
    setExporting(true);
    setExportProg(null);

  // 1) reserve credits server-side (idempotent)
  const idempotencyKey =
    globalThis.crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random()}`;

  const startRes = await fetch("/api/export/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({ durationMin, seed, idempotencyKey }),
  });

  const startJson = await startRes.json().catch(() => ({} as any));

  if (!startRes.ok) {
    alert(startJson?.error ?? "Could not start export");
    return;
  }

  jobId = typeof startJson?.jobId === "string" ? startJson.jobId : null;
  if (!jobId) {
    alert("Could not start export (missing jobId).");
    return;
  }
const info: WavInfoTags = {
  INAM: "Soundscape Export",
  IART: "Soundscape",
  IPRD: "Soundscape Web",
  ISFT: "Soundscape Web",
  ICRD: new Date().toISOString(),
  ICMT: [
    `Certificate ID: ${jobId}`,
    `Seed: ${seed}`,
    `Duration: ${durationMin} minutes`,
    `Terms: soundscape.run`,
  ].join("\n"),
};


    // 2) render locally
const wav = await exportWavChunked({
  tracks,
  seed,
  masterVol,
  durationMin,
  info,
  onProgress: (done, total) => setExportProg({ done, total }),
});


    // 3) mark completed
    await fetch("/api/export/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({ jobId }),
    });

const baseName = `soundscape_${durationMin}m_${seed}`;

// WAV
downloadBlob(wav, `${baseName}.wav`);

// Certificate
const createdAtIso = new Date().toISOString();
const certText = buildCertificateText({
  jobId,
  seed,
  durationMin,
  createdAtIso,
  tracks,
});

downloadBlob(new Blob([certText], { type: "text/plain" }), `${baseName}_certificate.txt`);

    // refresh credits UI
    refreshCredits();
  } catch (e: any) {
    console.error(e);

    // 4) cancel reservation on failure
    if (jobId) {
      await fetch("/api/export/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ jobId }),
      }).catch(() => {});
      refreshCredits();
    }

    alert(`Export failed: ${e?.message ?? "unknown error"}`);
  } finally {
    setExporting(false);
    setExportProg(null);
  }
}

const exportPct = useMemo(() => {
  if (!exportProg || exportProg.total <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((exportProg.done / exportProg.total) * 100)));
}, [exportProg]);

  
  const canExport = credits >= creditsCost; // placeholder until we wire credits

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="grid grid-cols-12 gap-6">
        {/* LEFT: Library */}
        <aside className="glass-panel col-span-12 md:col-span-4 rounded-3xl p-6">
          <h2 className="text-lg font-semibold">Library</h2>
          <input
            className="glass-surface mt-3 w-full rounded-lg px-3 py-2 text-sm text-app placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-white/20"
            placeholder="Search…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <div className="mt-4 max-h-[calc(100vh-260px)] overflow-y-auto pr-1">
            <div className="mb-2 flex items-baseline justify-between">
              <div className="text-sm font-semibold">Loops</div>
              <div className="text-xs text-faint">Total {loopsList.length}</div>
            </div>

            <div className="space-y-2">
              {loopsList.map((item) => (
                <button
                  key={item.id}
                  onClick={() => addToMix(item)}
                  className="btn-glass w-full rounded-lg px-3 py-2 text-left"
                >
                  <div className="font-medium text-strong">{item.name}</div>
                  <div className="text-xs text-muted">Loop</div>
                </button>
              ))}
              {loopsList.length === 0 && <div className="text-xs text-faint">No loop items.</div>}
            </div>

            <div className="my-5 h-px opacity-40" style={{ background: 'var(--glass-border-soft)' }} />

            <div className="mb-2 flex items-baseline justify-between">
              <div className="text-sm font-semibold">Events (WIP)</div>
              <div className="text-xs text-faint">Total {eventsList.length}</div>
            </div>

            <div className="space-y-2">
              {eventsList.map((item) => (
                <button
                  key={item.id}
                  onClick={() => addToMix(item)}
                  className="btn-glass w-full rounded-lg px-3 py-2 text-left"
                >
                  <div className="font-medium text-strong">{item.name}</div>
                  <div className="text-xs text-muted">Event</div>
                </button>
              ))}
              {eventsList.length === 0 && <div className="text-xs text-faint">No event items.</div>}
            </div>
          </div>
        </aside>

        {/* CENTER: Mixer */}
        <section className="glass-panel col-span-12 md:col-span-5 rounded-3xl p-6">
          <h1 className="text-lg font-semibold">Mixer</h1>
          <p className="mt-1 text-sm text-faint">Build your own soundscape.</p>


          <div className="mt-4 space-y-3">
            {tracks.map((t) => (
              <div key={t.id} className="glass-panel rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="font-medium">{t.name}</div>
                      <span className="text-xs text-faint">({t.type})</span>
                      <span className="text-xs">{assetStatus[t.id] ? '🟢' : '🔴'}</span>
                    </div>
                    <div className="mt-1 text-xs text-faint">
                      {folderIdFor(t)}/{t.assetId}.mp3
                    </div>
                  </div>

                  <button onClick={() => removeTrack(t.id)} className="btn-glass rounded-lg px-3 py-2 text-left">
                    Remove
                  </button>
                </div>

                <div className="mt-3">
                  <label className="text-xs text-faint">Asset</label>
                  <select
                    className="glass-surface mt-2 w-full rounded-lg px-3 py-2 text-sm text-app focus:outline-none focus:ring-2 focus:ring-white/20"
                    value={t.assetId}
                    onChange={(e) => updateTrack(t.id, { assetId: e.target.value })}
                  >
                    {LIBRARY.find((x) => x.id === t.libraryId)?.assets.map((a) => (
                      <option key={a.id} value={a.id} className="text-app">
                        {a.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-3 flex items-center gap-3">
                  <span className="w-14 text-xs text-faint">Vol</span>
                  <input
                    type="range"
                    className="range-gold flex-1"
                    min={0}
                    max={1}
                    step={0.01}
                    value={t.volume}
                    onChange={(e) => updateTrack(t.id, { volume: Number(e.target.value) })}
                  />
                  <span className="w-10 text-right text-xs text-faint">{Math.round(t.volume * 100)}%</span>
                </div>

                {t.type === 'event' && (
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-faint">Rate</label>
                      <select
                        className="glass-surface mt-1 w-full rounded-lg px-3 py-2 text-sm text-app focus:outline-none focus:ring-2 focus:ring-white/20"
                        value={t.ratePreset}
                        onChange={(e) =>
                          updateTrack(t.id, { ratePreset: e.target.value as MixTrack['ratePreset'] })
                        }
                      >
                        <option className="text-app">Rare</option>
                        <option className="text-app">Medium</option>
                        <option className="text-app">Often</option>
                        <option className="text-app">Very Often</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-faint">Speed</label>
                      <select
                        className="glass-surface mt-1 w-full rounded-lg px-3 py-2 text-sm text-app focus:outline-none focus:ring-2 focus:ring-white/20"
                        value={t.rateSpeed}
                        onChange={(e) =>
                          updateTrack(t.id, { rateSpeed: Number(e.target.value) as MixTrack['rateSpeed'] })
                        }
                      >
                        <option value={0.5} className="text-app">0.5×</option>
                        <option value={1} className="text-app">1×</option>
                        <option value={2} className="text-app">2×</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 flex gap-3">
            <button onClick={activateAudio} className="btn-glass w-full rounded-lg px-3 py-2 text-left">
              {audioOn ? 'Audio Active' : 'Activate Audio'}
            </button>

            <button onClick={stopAudio} className="btn-glass w-full rounded-lg px-3 py-2 text-left">
              Stop
            </button>

            <div className="ml-auto flex items-center gap-3">
              <span className="text-xs text-faint">Master</span>
              <input
                type="range"
                className="range-gold w-40"
                min={0}
                max={1}
                step={0.01}
                value={masterVol}
                onChange={(e) => setMasterVol(Number(e.target.value))}
              />
            </div>
          </div>
        </section>

        {/* RIGHT: Export */}
        <aside className="glass-panel col-span-12 md:col-span-3 rounded-3xl p-5">
          <div className="flex items-start gap-4">

            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold">Export</h2>


            </div>

            <div className="flex items-center gap-2">

              <div className="glass-panel rounded-xl px-3 py-2 text-xs text-faint whitespace-nowrap">
                Credits:{' '}
                <span className="text-app ml-1">
                  {creditsLoading ? '—' : credits}
                </span>
              </div>

              <a
                href="/pricing"
                className="btn-glass rounded-xl px-3 py-2 text-xs whitespace-nowrap"
              >
                Buy
              </a>
            </div>
          </div>

          {/* Seed */}
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <div className="text-xs text-faint">Seed</div>
              <button
                onClick={() => setSeed(makeSeed())}
                className="btn-glass rounded-lg px-2.5 py-1 text-xs"
                title="New seed"
              >
                🎲 New
              </button>
            </div>
            <input
              className="glass-surface mt-2 w-full rounded-lg px-3 py-2 text-sm text-app placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-white/20"
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              placeholder="Seed…"
            />
          </div>

          {/* Duration */}
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <div className="text-xs text-faint">Duration</div>
              <div className="text-xs text-faint">
                Cost: {creditsCost} credit{creditsCost === 1 ? '' : 's'}
              </div>
            </div>

            <div className="mt-2">
              <select
                className="glass-surface w-full rounded-lg px-3 py-2 text-sm text-app focus:outline-none focus:ring-2 focus:ring-white/20"
                value={durationMin}
                onChange={(e) => setDurationMin(Number(e.target.value) as DurationMin)}
              >
                <option value={5} className="text-app">5 min</option>
                <option value={15} className="text-app">15 min</option>
                <option value={30} className="text-app">30 min</option>
                <option value={60} className="text-app">60 min</option>
              </select>

              <div className="mt-2 text-[11px] text-faint">
                Tip: longer exports take longer to render.
              </div>
            </div>


            <div className="mt-2 text-[11px] text-faint">
              (We’ll unlock 60m after stability tests.)
            </div>
          </div>

          {/* Export button */}
          <button
            onClick={exportMix}
            disabled={!canExport}
            className="btn-glass btn-gold mt-4 w-full rounded-xl px-4 py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Export {durationMin} min
          </button>

          {exporting && (
            <div className="mt-3">
              <div className="mb-1 flex items-center justify-between text-[11px] text-faint">
                <span>Rendering</span>
                <span>{exportPct}%</span>
              </div>

              <div className="h-2 w-full overflow-hidden rounded-full border border-white/10 bg-white/5">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${exportPct}%`,
                    background: "linear-gradient(90deg, rgba(245, 190, 80, 0.2), rgba(245, 190, 80, 0.7))",
                  }}
                />
              </div>

              <div className="mt-1 text-[11px] text-faint">
                Chunk {exportProg ? `${exportProg.done}/${exportProg.total}` : "…"}
              </div>
            </div>
          )}

          {!canExport && (
            <div className="mt-2 text-xs text-faint">
              Need {Math.max(0, creditsCost - credits)} more credit{creditsCost - credits === 1 ? '' : 's'}.
            </div>
          )}

          {/* Format */}
          <div className="mt-4">
            <div className="text-xs text-faint">Format</div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <span className="pill-glass pointer-events-none select-none cursor-default px-2.5 py-1 text-muted">
                WAV
              </span>
              <span className="pill-glass pointer-events-none select-none cursor-default px-2.5 py-1 text-muted">
                Scene
              </span>
            </div>
          </div>

          {/* Includes */}
          <div className="mt-4">
            <div className="text-xs text-faint">Includes</div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <span className="pill-glass pointer-events-none select-none cursor-default px-2.5 py-1 text-muted">
                WAV + scene
              </span>
              <span className="pill-glass pointer-events-none select-none cursor-default px-2.5 py-1 text-muted">
                License cert
              </span>
              <span className="pill-glass pointer-events-none select-none cursor-default px-2.5 py-1 text-muted">
                Seeded
              </span>
            </div>
          </div>
        </aside>

      </div>
    </main>
  );
}
