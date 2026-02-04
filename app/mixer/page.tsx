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

// Map UI library IDs to folder names.
// - loops: folder == libraryId
// - events: allow ids like "birds_events" but folder is "birds"
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

  const [assetStatus, setAssetStatus] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState('');

  // UI-only placeholders for export panel
  const [credits] = useState(0);
  const [exportFormat, setExportFormat] = useState<'wav' | 'recipe'>('wav');

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
  function exportMix() {
    // hook later
    // eslint-disable-next-line no-console
    console.log('Export clicked', { exportFormat, credits, tracks });
  }

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

          {/* Library list (single scroll) */}
          <div className="mt-4 max-h-[calc(100vh-260px)] overflow-y-auto pr-1">
            {/* Loops */}
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

            {/* Events */}
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
                          updateTrack(t.id, {
                            rateSpeed: Number(e.target.value) as MixTrack['rateSpeed'],
                          })
                        }
                      >
                        <option value={0.5} className="text-app">
                          0.5×
                        </option>
                        <option value={1} className="text-app">
                          1×
                        </option>
                        <option value={2} className="text-app">
                          2×
                        </option>
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
            <p className="mt-1 text-xs text-faint">5 minutes per export • costs 1 credit</p>
          </div>
          <div className="pill-glass px-3 py-1 text-xs text-app">0 credits</div>
        </div>

        <button className="btn-glass btn-gold mt-4 w-full rounded-xl px-4 py-3 text-sm">
          Export 5 min
        </button>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button className="btn-glass rounded-lg px-3 py-2 text-sm">Buy credits</button>
          <a href="/pricing" className="btn-glass rounded-lg px-3 py-2 text-sm text-center">Pricing</a>
        </div>

        <div className="mt-4">
          <div className="text-xs text-faint">Format</div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button className="btn-glass glass-active rounded-lg px-3 py-2 text-sm">WAV</button>
            <button className="btn-glass hover:glass-hover rounded-lg px-3 py-2 text-sm">Recipe</button>
          </div>
        </div>

        <div className="mt-4">
          <div className="text-xs text-faint">Includes</div>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <span className="pill-glass px-2.5 py-1 text-muted">WAV + recipe</span>
            <span className="pill-glass px-2.5 py-1 text-muted">License cert</span>
            <span className="pill-glass px-2.5 py-1 text-muted">Deterministic</span>
          </div>
        </div>
      </aside>
    </div>
  </main>
);
}