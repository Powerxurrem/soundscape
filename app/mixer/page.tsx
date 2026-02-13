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

// UI Library (MINIMAL SHIP SET)
const LIBRARY: LibraryItem[] = [
  // --- LOOPS ---
  {
    id: 'rain',
    name: 'Rain',
    type: 'loop',
    defaultAssetId: 'rain_soft_loop_01',
    assets: [
      { id: 'rain_soft_loop_01', label: 'Soft Rain' },
      { id: 'rain_medium_loop_01', label: 'Medium Rain' },
    ],
  },
  {
    id: 'wind',
    name: 'Wind',
    type: 'loop',
    defaultAssetId: 'wind_soft_trees_loop_01',
    assets: [{ id: 'wind_soft_trees_loop_01', label: 'Soft Trees Wind' }],
  },
  {
    id: 'fireplace',
    name: 'Fireplace',
    type: 'loop',
    defaultAssetId: 'fireplace_cozy_loop_01',
    assets: [{ id: 'fireplace_cozy_loop_01', label: 'Cozy Fireplace' }],
  },
  {
    id: 'water',
    name: 'Water',
    type: 'loop',
    defaultAssetId: 'water_stream_with_distant_birds_01',
    assets: [{ id: 'water_stream_with_distant_birds_01', label: 'Stream + Distant Birds' }],
  },
  {
    id: 'birds',
    name: 'Birds',
    type: 'loop',
    defaultAssetId: 'birds_morning_chirp_01',
    assets: [{ id: 'birds_morning_chirp_01', label: 'Morning Chirps' }],
  },
  {
    id: 'insects',
    name: 'Insects',
    type: 'loop',
    defaultAssetId: 'insects_soft_night_loop_01',
    assets: [{ id: 'insects_soft_night_loop_01', label: 'Soft Night Insects' }],
  },

  // --- EVENTS ---
  {
    id: 'thunder',
    name: 'Thunder',
    type: 'event',
    defaultAssetId: 'thunder_distant_roll_01',
    assets: [{ id: 'thunder_distant_roll_01', label: 'Distant Roll' }],
  },
];

function makeId(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

// Seed format like autopilot
function makeSeed() {
  return `${Date.now()}_${Math.floor(Math.random() * 1_000_000_000)}`;
}
function getOrCreateDeviceId() {
  const key = "soundscape_device_id";
  let v = localStorage.getItem(key);
  if (!v) {
    v = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
    localStorage.setItem(key, v);
  }
  return v;
}

async function fetchCreditsBalance() {
  const deviceId = getOrCreateDeviceId();

  const res = await fetch("/api/credits/balance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deviceId }),
    cache: "no-store",
  });


  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? "Balance failed");

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
  const [durationMin, setDurationMin] = useState<5 | 15 | 30>(5);
  const [exportFormat, setExportFormat] = useState<'wav' | 'recipe'>('wav');

  // UI-only placeholder credits (we’ll wire real credits later)
  const [credits, setCredits] = useState<number>(0);
  const [creditsLoading, setCreditsLoading] = useState<boolean>(true);


  const creditsCost = useMemo(() => Math.max(1, Math.round(durationMin / 5)), [durationMin]);

  const [tracks, setTracks] = useState<MixTrack[]>([
    {
      id: makeId('t'),
      libraryId: 'rain',
      name: 'Rain',
      type: 'loop',
      assetId: 'rain_soft_loop_01',
      volume: 0.5,
    },
    {
      id: makeId('t'),
      libraryId: 'thunder',
      name: 'Thunder',
      type: 'event',
      assetId: 'thunder_distant_roll_01',
      volume: 0.35,
      ratePreset: 'Rare',
      rateSpeed: 1,
      randomizeVariants: false,
    },
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

  function buildSceneObject() {
    return {
      version: 1,
      kind: 'soundscape_scene',
      seed,
      durationMin,
      masterVol,
      tracks: tracks.map((t) => ({
        libraryId: t.libraryId,
        name: t.name,
        type: t.type,
        assetId: t.assetId,
        volume: t.volume,
        ratePreset: t.ratePreset,
        rateSpeed: t.rateSpeed,
        randomizeVariants: t.randomizeVariants,
      })),
      createdAt: new Date().toISOString(),
    };
  }

  async function copyScene() {
    try {
      const scene = buildSceneObject();
      await navigator.clipboard.writeText(JSON.stringify(scene, null, 2));
      // eslint-disable-next-line no-console
      console.log('Scene copied');
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Clipboard failed', e);
      alert('Could not copy scene.');
    }
  }

  // placeholder actions
  function exportMix() {
    // hook later (consume credit + render WAV / output recipe)
    // eslint-disable-next-line no-console
    console.log('Export clicked', {
      exportFormat,
      credits,
      creditsCost,
      durationMin,
      seed,
      masterVol,
      scene: buildSceneObject(),
    });
  }

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
              <div className="text-sm font-semibold">Events</div>
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
          <p className="mt-1 text-sm text-faint">Ugly is correct. Logic first.</p>

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
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Export</h2>
              <p className="mt-1 text-xs text-faint">1 credit = 5 minutes • cost updates by duration</p>
            </div>
<div className="flex items-center gap-2">
  <div className="pill-glass px-3 py-1 text-xs text-app">
    {creditsLoading ? "…" : `${credits} credits`}
  </div>
  <button
    onClick={refreshCredits}
    className="btn-glass rounded-lg px-2.5 py-1 text-xs"
    title="Refresh credits" 
  >
    ↻
  </button>
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
            <div className="mt-2 flex gap-2">
              <button onClick={copyScene} className="btn-glass w-full rounded-lg px-3 py-2 text-sm">
                Copy scene
              </button>
            </div>
          </div>

          {/* Duration */}
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <div className="text-xs text-faint">Duration</div>
              <div className="text-xs text-faint">Cost: {creditsCost} credit{creditsCost === 1 ? '' : 's'}</div>
            </div>

            <div className="mt-2 grid grid-cols-3 gap-2">
              <button
                className={`btn-glass rounded-lg px-3 py-2 text-sm ${durationMin === 5 ? 'glass-active' : ''}`}
                onClick={() => setDurationMin(5)}
              >
                5m
              </button>
              <button
                className={`btn-glass rounded-lg px-3 py-2 text-sm ${durationMin === 15 ? 'glass-active' : ''}`}
                onClick={() => setDurationMin(15)}
              >
                15m
              </button>
              <button
                className={`btn-glass rounded-lg px-3 py-2 text-sm ${durationMin === 30 ? 'glass-active' : ''}`}
                onClick={() => setDurationMin(30)}
              >
                30m
              </button>
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

          {!canExport && (
            <div className="mt-2 text-xs text-faint">
              Need {Math.max(0, creditsCost - credits)} more credit{creditsCost - credits === 1 ? '' : 's'}.
            </div>
          )}

          <div className="mt-3 grid grid-cols-2 gap-2">
            <a href="/pricing" className="btn-glass rounded-lg px-3 py-2 text-sm text-center">
              Buy credits
            </a>

            <a href="/pricing" className="btn-glass rounded-lg px-3 py-2 text-sm text-center">
              Pricing
            </a>
          </div>

          {/* Format */}
          <div className="mt-4">
            <div className="text-xs text-faint">Format</div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                onClick={() => setExportFormat('wav')}
                className={`btn-glass rounded-lg px-3 py-2 text-sm ${exportFormat === 'wav' ? 'glass-active' : ''}`}
              >
                WAV
              </button>
              <button
                onClick={() => setExportFormat('recipe')}
                className={`btn-glass rounded-lg px-3 py-2 text-sm ${
                  exportFormat === 'recipe' ? 'glass-active' : ''
                }`}
              >
                Scene
              </button>
            </div>
          </div>

          <div className="mt-4">
            <div className="text-xs text-faint">Includes</div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <span className="pill-glass px-2.5 py-1 text-muted">WAV + scene</span>
              <span className="pill-glass px-2.5 py-1 text-muted">License cert</span>
              <span className="pill-glass px-2.5 py-1 text-muted">Seeded</span>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
