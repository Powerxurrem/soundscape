'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { TrackType } from '../mixer/assets';
import { createAudioEngine, type AudioEngine } from '../mixer/audio/audioengine';

type MixTrack = {
  id: string;
  libraryId: string; // folder name
  name: string;
  type: TrackType;
  assetId: string;
  volume: number; // 0..1

  // event-only
  ratePreset?: 'Rare' | 'Medium' | 'Often' | 'Very Often';
  rateSpeed?: 0.5 | 1 | 2;
  randomizeVariants?: boolean; // unused here, but compatible
};

type Mood = 'Sleep' | 'Focus' | 'Cozy' | 'Nature';

const EXPORT_TEMPORARILY_UNLOCKED = true;

// ---- tiny utils ----
function clamp01(v: number) {
  if (Number.isNaN(v)) return 0;
  return Math.max(0, Math.min(1, v));
}

function makeId(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

// deterministic RNG
function fnv1a32(str: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickOne<T>(rand: () => number, arr: T[]) {
  return arr[Math.floor(rand() * arr.length)];
}

function chance(rand: () => number, p: number) {
  return rand() < p;
}

async function headOk(url: string) {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return res.ok;
  } catch {
    return false;
  }
}

// ---- URL rules (locked) ----
function assetUrlFor(track: { type: TrackType; libraryId: string }, assetId: string) {
  const base = track.type === 'loop' ? 'loops' : 'events';
  return `/assets/${base}/${track.libraryId}/${assetId}.mp3`;
}

// ---- WAV export helpers ----
async function fetchAudioBuffer(ctx: BaseAudioContext, url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch: ${url}`);
  const arr = await res.arrayBuffer();
  return await ctx.decodeAudioData(arr);
}

function encodeWav16(audioBuffer: AudioBuffer) {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const length = audioBuffer.length;

  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = length * blockAlign;

  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');

  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // 16-bit

  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  const channels: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) channels.push(audioBuffer.getChannelData(c));

  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let c = 0; c < numChannels; c++) {
      let s = channels[c][i];
      s = Math.max(-1, Math.min(1, s));
      const int16 = s < 0 ? s * 0x8000 : s * 0x7fff;
      view.setInt16(offset, int16, true);
      offset += 2;
    }
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const EVENT_RATE_SECONDS: Record<'Rare' | 'Medium' | 'Often' | 'Very Often', { min: number; max: number }> = {
  Rare: { min: 45, max: 90 },
  Medium: { min: 20, max: 45 },
  Often: { min: 10, max: 20 },
  'Very Often': { min: 5, max: 10 },
};

export default function AutopilotPage() {
  const audioRef = useRef<AudioEngine | null>(null);

  const [audioOn, setAudioOn] = useState(false);
  const [masterVol, setMasterVol] = useState(0.8);

  const [mood, setMood] = useState<Mood>('Focus');
  const [lengthMin, setLengthMin] = useState<10 | 30 | 60>(10);
  const [seed, setSeed] = useState<string>(() => `${Date.now()}`);

  const [tracks, setTracks] = useState<MixTrack[]>([]);
  const [trackStatus, setTrackStatus] = useState<Record<string, boolean>>({});
  const [recipe, setRecipe] = useState<string>('');

  // export control plane
  const [exportKind, setExportKind] = useState<'wav' | 'mp3' | 'recipe'>('recipe');
  const [isExporting, setIsExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState('');

  // cleanup
  useEffect(() => {
    return () => {
      audioRef.current?.stopAll();
    };
  }, []);

  async function activateAudio() {
    if (!audioRef.current) audioRef.current = createAudioEngine();
    await audioRef.current.activate();
    audioRef.current.setMaster(masterVol);
    setAudioOn(true);
    if (tracks.length > 0) {
      await audioRef.current.syncMix(tracks, assetUrlFor);
    }
  }

  function stopAudio() {
    audioRef.current?.stopAll();
    setAudioOn(false);
  }

  useEffect(() => {
    if (!audioOn) return;
    if (!audioRef.current?.isActive()) return;
    audioRef.current.syncMix(tracks, assetUrlFor);
  }, [audioOn, tracks]);

  useEffect(() => {
    if (!audioOn) return;
    audioRef.current?.setMaster(masterVol);
  }, [audioOn, masterVol]);

  // HEAD status for UI confidence
  useEffect(() => {
    let alive = true;
    async function check() {
      const entries = await Promise.all(
        tracks.map(async (t) => {
          const ok = await headOk(assetUrlFor(t, t.assetId));
          return [t.id, ok] as const;
        })
      );
      if (!alive) return;
      const next: Record<string, boolean> = {};
      for (const [id, ok] of entries) next[id] = ok;
      setTrackStatus(next);
    }
    check();
    return () => {
      alive = false;
    };
  }, [tracks]);

  function randomizeSeed() {
    setSeed(`${Date.now()}_${Math.floor(Math.random() * 1e9)}`);
  }

  async function generate() {
    const s = seed.trim() || `${Date.now()}`;
    const rand = mulberry32(fnv1a32(`${mood}|${lengthMin}|${s}`));

    // minimal buckets (your current reality)
    const beds = ['rain', 'water', 'wind', 'fireplace'] as const;
    const textures = ['birds', 'insects'] as const;

    const allowThunder = mood === 'Nature' && chance(rand, 0.6);
    const includeTexture = mood !== 'Cozy' && chance(rand, mood === 'Sleep' ? 0.25 : 0.6);
    const includeSecondBed = chance(rand, mood === 'Cozy' ? 0.35 : 0.55);

    let primaryBed: (typeof beds)[number];
    if (mood === 'Cozy') primaryBed = 'fireplace';
    else if (mood === 'Focus') primaryBed = pickOne(rand, ['rain', 'water'] as const);
    else if (mood === 'Sleep') primaryBed = pickOne(rand, ['rain', 'wind'] as const);
    else primaryBed = pickOne(rand, ['water', 'wind', 'rain'] as const);

    let secondaryBed: (typeof beds)[number] | null = null;
    if (includeSecondBed) {
      const options = beds.filter((b) => b !== primaryBed);
      secondaryBed = mood === 'Sleep'
        ? (pickOne(rand, options.filter((b) => b !== 'fireplace')) || null)
        : (pickOne(rand, options) || null);
    }

    let texture: (typeof textures)[number] | null = null;
    if (includeTexture) {
      texture = mood === 'Sleep'
        ? (chance(rand, 0.7) ? 'insects' : 'birds')
        : pickOne(rand, [...textures]);
    }
    if (mood === 'Cozy') texture = null;

    const next: MixTrack[] = [];

    async function addLoop(libraryId: string, assetId: string, volume: number) {
      const url = assetUrlFor({ type: 'loop', libraryId }, assetId);
      if (!(await headOk(url))) return false;
      next.push({
        id: makeId('t'),
        libraryId,
        name:
          libraryId === 'rain'
            ? 'Rain'
            : libraryId === 'wind'
              ? 'Wind'
              : libraryId === 'water'
                ? 'Water'
                : libraryId === 'fireplace'
                  ? 'Fireplace'
                  : libraryId === 'birds'
                    ? 'Birds'
                    : 'Insects',
        type: 'loop',
        assetId,
        volume: clamp01(volume),
      });
      return true;
    }

    async function addThunder() {
      const libraryId = 'thunder';
      const assetId = 'thunder_distant_roll_01';
      const url = assetUrlFor({ type: 'event', libraryId }, assetId);
      if (!(await headOk(url))) return false;
      next.push({
        id: makeId('t'),
        libraryId,
        name: 'Thunder',
        type: 'event',
        assetId,
        volume: 0.28,
        ratePreset: 'Rare',
        rateSpeed: 1,
        randomizeVariants: false,
      });
      return true;
    }

    const base = mood === 'Sleep' ? 0.42 : mood === 'Cozy' ? 0.55 : 0.5;

    // primary bed
    if (primaryBed === 'rain') {
      const rainVariant = chance(rand, 0.5) ? 'rain_soft_loop_01' : 'rain_medium_loop_01';
      await addLoop('rain', rainVariant, base);
    } else if (primaryBed === 'water') {
      await addLoop('water', 'water_stream_with_distant_birds_01', base);
    } else if (primaryBed === 'wind') {
      await addLoop('wind', 'wind_soft_trees_loop_01', base);
    } else {
      await addLoop('fireplace', 'fireplace_cozy_loop_01', mood === 'Sleep' ? 0.38 : 0.58);
    }

    // secondary bed
    if (secondaryBed) {
      if (secondaryBed === 'rain') {
        const rainVariant = chance(rand, 0.5) ? 'rain_soft_loop_01' : 'rain_medium_loop_01';
        await addLoop('rain', rainVariant, base * 0.65);
      } else if (secondaryBed === 'water') {
        await addLoop('water', 'water_stream_with_distant_birds_01', base * 0.65);
      } else if (secondaryBed === 'wind') {
        await addLoop('wind', 'wind_soft_trees_loop_01', base * 0.65);
      } else {
        await addLoop('fireplace', 'fireplace_cozy_loop_01', base * 0.5);
      }
    }

    // texture
    if (texture === 'birds') {
      await addLoop('birds', 'birds_morning_chirp_01', mood === 'Sleep' ? 0.18 : 0.28);
    } else if (texture === 'insects') {
      // temp placeholder you mentioned
      await addLoop('insects', 'insects_soft_night_loop_01', mood === 'Sleep' ? 0.22 : 0.25);
    }

    if (allowThunder) await addThunder();

    if (next.length === 0) {
      next.push({
        id: makeId('t'),
        libraryId: 'rain',
        name: 'Rain',
        type: 'loop',
        assetId: 'rain_soft_loop_01',
        volume: 0.5,
      });
    }

    setTracks(next);

    const lines = [
      `Mood=${mood} • Length=${lengthMin}m • Seed=${s}`,
      ...next.map((t) => {
        const vol = `${Math.round(t.volume * 100)}%`;
        const ev = t.type === 'event' ? ` • ${t.ratePreset ?? 'Rare'} @ ${t.rateSpeed ?? 1}×` : '';
        return `- ${t.name} (${t.type}) • ${t.libraryId}/${t.assetId}.mp3 • vol ${vol}${ev}`;
      }),
    ];
    setRecipe(lines.join('\n'));

    if (audioOn && audioRef.current?.isActive()) {
      audioRef.current.syncMix(next, assetUrlFor);
    }
  }

  function buildRecipeText() {
    const s = seed.trim() || `${Date.now()}`;
    const lines = [
      `Mood=${mood} • Length=${lengthMin}m • Seed=${s}`,
      ...tracks.map((t) => {
        const vol = `${Math.round(t.volume * 100)}%`;
        const ev = t.type === 'event' ? ` • ${t.ratePreset ?? 'Rare'} @ ${t.rateSpeed ?? 1}×` : '';
        return `- ${t.name} (${t.type}) • ${t.libraryId}/${t.assetId}.mp3 • vol ${vol}${ev}`;
      }),
    ];
    return lines.join('\n');
  }

  async function onExportRecipe() {
    if (!EXPORT_TEMPORARILY_UNLOCKED) return;
    if (isExporting) return;
    if (tracks.length === 0) return alert('Generate a mix first.');

    setExportMsg('');
    setIsExporting(true);
    try {
      const text = buildRecipeText();
      downloadBlob(
        new Blob([text], { type: 'text/plain' }),
        `soundscape_${mood.toLowerCase()}_${lengthMin}m_${seed}.txt`
      );
      setExportMsg('Downloaded recipe.');
    } finally {
      setIsExporting(false);
    }
  }

  function onExportMp3() {
    alert('MP3 export not implemented yet. Use WAV for now.');
  }

  function urlForTrack(t: MixTrack) {
    return assetUrlFor(t, t.assetId);
  }

  async function onExportWav() {
    if (!EXPORT_TEMPORARILY_UNLOCKED) return;
    if (isExporting) return;
    if (tracks.length === 0) return alert('Generate a mix first.');

    setExportMsg('');
    setIsExporting(true);

    try {
      const durationSec = lengthMin * 60;
      const sampleRate = 44100;
      const frames = Math.floor(durationSec * sampleRate);

      const off = new OfflineAudioContext(2, frames, sampleRate);

      const master = off.createGain();
      master.gain.value = clamp01(masterVol);
      master.connect(off.destination);

      // load buffers (skip missing)
      const urls = Array.from(new Set(tracks.map((t) => urlForTrack(t))));
      const buffers = new Map<string, AudioBuffer>();
      await Promise.all(
        urls.map(async (u) => {
          try {
            buffers.set(u, await fetchAudioBuffer(off, u));
          } catch {
            console.warn('Missing audio for export:', u);
          }
        })
      );

      // loops
      for (const t of tracks.filter((x) => x.type === 'loop')) {
        const u = urlForTrack(t);
        const buf = buffers.get(u);
        if (!buf) continue;

        const src = off.createBufferSource();
        src.buffer = buf;
        src.loop = true;

// avoid mp3 padding / decode edge artifacts
const LOOP_PAD = 0.02; // 20 ms
src.loopStart = LOOP_PAD;
src.loopEnd = Math.max(LOOP_PAD, buf.duration - LOOP_PAD);


        const g = off.createGain();
        g.gain.value = clamp01(t.volume);

        src.connect(g);
        g.connect(master);
        src.start(0);
      }

      // events (deterministic schedule)
      const rand = mulberry32(fnv1a32(`export|${mood}|${lengthMin}|${seed}`));
      for (const t of tracks.filter((x) => x.type === 'event')) {
        const u = urlForTrack(t);
        const buf = buffers.get(u);
        if (!buf) continue;

        const preset = (t.ratePreset ?? 'Rare') as 'Rare' | 'Medium' | 'Often' | 'Very Often';
        const speed = t.rateSpeed ?? 1;

        const base = EVENT_RATE_SECONDS[preset];
        const min = base.min / speed;
        const max = base.max / speed;

        let at = 0.8 + rand() * 1.2;
        while (at < durationSec) {
          const src = off.createBufferSource();
          src.buffer = buf;

          const g = off.createGain();
          g.gain.value = clamp01(t.volume);

          src.connect(g);
          g.connect(master);
          src.start(at);

          at += min + rand() * (max - min);
        }
      }

      const rendered = await off.startRendering();
      const wav = encodeWav16(rendered);

      downloadBlob(wav, `soundscape_${mood.toLowerCase()}_${lengthMin}m_${seed}.wav`);
      setExportMsg('Downloaded WAV.');
    } catch (e) {
      console.error(e);
      setExportMsg('WAV export failed. Check console.');
    } finally {
      setIsExporting(false);
    }
  }

  const nowPlaying = useMemo(() => {
    if (tracks.length === 0) return 'Generate a mix to start.';
    return `${tracks.length} track(s) loaded.`;
  }, [tracks]);

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="glass-panel elev-3 rounded-3xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">Autopilot</h1>
            <p className="mt-1 text-sm text-faint">
              Deterministic mix generator using only available assets. No AI.
            </p>
          </div>

          <div className="flex gap-2">
            <button onClick={generate} className="btn-glass rounded-xl px-4 py-2 text-sm">
              Generate
            </button>
            <button
              onClick={activateAudio}
              className="btn-glass rounded-xl px-4 py-2 text-sm"
            >
              {audioOn ? 'Audio Active' : 'Activate Audio'}
            </button>
            <button onClick={stopAudio} className="btn-glass rounded-xl px-4 py-2 text-sm">
              Stop
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="text-xs text-faint">Mood</label>
            <select
              className="glass-panel mt-1 w-full rounded-lg px-2 py-2 text-sm"
              value={mood}
              onChange={(e) => setMood(e.target.value as Mood)}
            >
              <option>Sleep</option>
              <option>Focus</option>
              <option>Cozy</option>
              <option>Nature</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-faint">Length</label>
            <select
              className="glass-panel mt-1 w-full rounded-lg px-2 py-2 text-sm"
              value={lengthMin}
              onChange={(e) => setLengthMin(Number(e.target.value) as 10 | 30 | 60)}
            >
              <option value={10}>10 min</option>
              <option value={30}>30 min</option>
              <option value={60}>60 min</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-faint">Seed</label>
            <div className="mt-1 flex gap-2">
              <input
                className="glass-panel w-full rounded-lg px-2 py-2 text-sm"
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
              />
              <button
                onClick={randomizeSeed}
                className="btn-glass"
                title="New seed"
              >
                ↻
              </button>
            </div>
          </div>
        </div>

        <div className="glass-panel mt-5 rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <div className="font-medium">Now Playing</div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-faint">Master</span>
              <input
                type="range"
                className="w-40"
                min={0}
                max={1}
                step={0.01}
                value={masterVol}
                onChange={(e) => setMasterVol(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="mt-3 text-sm text-faint">{nowPlaying}</div>

          {tracks.length > 0 && (
            <div className="mt-3 space-y-2">
              {tracks.map((t) => (
                <div key={t.id} className="glass-panel flex items-center justify-between rounded-lg px-3 py-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-medium">{t.name}</div>
                      <span className="text-xs text-faint">({t.type})</span>
                      <span className="text-xs">{trackStatus[t.id] ? '🟢' : '🔴'}</span>
                    </div>
                    <div className="mt-1 text-xs text-faint truncate">{assetUrlFor(t, t.assetId)}</div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-xs text-faint w-10 text-right">{Math.round(t.volume * 100)}%</div>
                    <input
                      type="range"
                      className="w-36"
                      min={0}
                      max={1}
                      step={0.01}
                      value={t.volume}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setTracks((prev) => prev.map((x) => (x.id === t.id ? { ...x, volume: v } : x)));
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {recipe && (
          <div className="mt-5">
            <div className="font-medium">Recipe</div>
            <pre className="glass-panel mt-2 whitespace-pre-wrap rounded-xl p-4 text-xs text-app">
              {recipe}
            </pre>
          </div>
        )}

        {/* EXPORT */}
        <div className="glass-panel mt-5 rounded-3xl p-6">
          <h2 className="text-lg font-semibold">Export</h2>
          <p className="mt-1 text-sm text-faint">
            {EXPORT_TEMPORARILY_UNLOCKED
              ? 'Export temporarily unlocked for testing.'
              : 'Export is locked on Personal.'}
          </p>

          <div className="mt-4 space-y-3">
            <div>
              <label className="text-xs text-faint">Duration</label>
              <select
                className="glass-surface mt-1 w-full rounded-lg px-3 py-2 text-sm text-app focus:outline-none focus:ring-2 focus:ring-white/20"
                value={lengthMin}
                onChange={(e) => setLengthMin(Number(e.target.value) as 10 | 30 | 60)}
              >
                <option value={10} className="text-app">5 min</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-faint">Format</label>
              <div className="mt-1 grid grid-cols-3 gap-2">
                <button
                  className={`glass-panel rounded-lg border  px-3 py-2 text-sm${
                    exportKind === 'wav' ? 'glass-inset' : ''
                  }${EXPORT_TEMPORARILY_UNLOCKED ? 'hover:glass-inset' : 'text-faint'}`}
                  disabled={!EXPORT_TEMPORARILY_UNLOCKED || isExporting}
                  onClick={() => setExportKind('wav')}
                >
                  WAV
                </button>
                <button
                  className={`glass-panel rounded-lg border  px-3 py-2 text-sm${
                    exportKind === 'mp3' ? 'glass-inset' : ''
                  }${EXPORT_TEMPORARILY_UNLOCKED ? 'hover:glass-inset' : 'text-faint'}`}
                  disabled={!EXPORT_TEMPORARILY_UNLOCKED || isExporting}
                  onClick={() => setExportKind('mp3')}
                >
                  MP3
                </button>
                <button
                  className={`glass-panel rounded-lg border  px-3 py-2 text-sm${
                    exportKind === 'recipe' ? 'glass-inset' : ''
                  }${EXPORT_TEMPORARILY_UNLOCKED ? 'hover:glass-inset' : 'text-faint'}`}
                  disabled={!EXPORT_TEMPORARILY_UNLOCKED || isExporting}
                  onClick={() => setExportKind('recipe')}
                >
                  Recipe
                </button>
              </div>

              <div className="mt-2 text-xs text-faint">
                {exportKind === 'wav'
                  ? 'WAV renders offline in-browser.'
                  : exportKind === 'mp3'
                    ? 'MP3 is not implemented yet.'
                    : 'Downloads a text recipe of the mix.'}
              </div>
            </div>

            <div className="mt-2 text-xs text-faint">
              🔒 Commercial license required to export.
            </div>

            <button
              className={`glass-panel w-full rounded-lg border  px-4 py-2 text-sm${
                EXPORT_TEMPORARILY_UNLOCKED ? 'hover:glass-inset' : 'text-faint'
              }`}
              disabled={!EXPORT_TEMPORARILY_UNLOCKED || isExporting}
              onClick={() => {
                if (exportKind === 'recipe') return onExportRecipe();
                if (exportKind === 'wav') return onExportWav();
                return onExportMp3();
              }}
            >
              {isExporting
                ? 'Exporting…'
                : exportKind === 'recipe'
                  ? 'Download Recipe'
                  : exportKind === 'wav'
                    ? 'Export WAV'
                    : 'Export MP3'}
            </button>

            {exportMsg && <div className="text-xs text-faint">{exportMsg}</div>}

            <div className="glass-panel mt-5 rounded-3xl p-6 text-xs text-faint">
              <div className="font-medium">Commercial unlock includes:</div>
              <ul className="mt-2 list-disc pl-4 space-y-1">
                <li>MP3 + WAV exports</li>
                <li>License certificate per export</li>
                <li>Monthly export minutes</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-5 text-xs text-faint">
          Notes: Autopilot only uses assets that respond to HEAD checks. Missing files are skipped.
        </div>
      </div>
    </main>
  );
}


