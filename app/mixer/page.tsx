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
  return track.libraryId.endsWith('_events')
    ? track.libraryId.replace(/_events$/, '')
    : track.libraryId;
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

  const loopsList = useMemo(
    () => filteredLibrary.filter((i) => i.type === 'loop'),
    [filteredLibrary]
  );
  const eventsList = useMemo(
    () => filteredLibrary.filter((i) => i.type === 'event'),
    [filteredLibrary]
  );

  function addToMix(item: LibraryItem) {
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

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="grid grid-cols-12 gap-6">
        {/* LEFT: Library */}
        <aside className="glass-panel col-span-12 md:col-span-4 rounded-3xl p-6">
          <h2 className="text-lg font-semibold">Library</h2>
          <input
            className="glass-surface mt-3 w-full rounded-lg px-3 py-2 text-sm text-white/80 placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
            placeholder="Search…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          {/* Two segments: Loops + Events, each scrolls */}
          <div className="mt-4 flex h-[calc(100vh-260px)] flex-col gap-4 min-h-0">
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="mb-2 flex items-baseline justify-between">
                <div className="text-sm font-semibold">Loops</div>
                <div className="text-xs text-white/55">Total {loopsList.length}</div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                <div className="space-y-2">
                  {loopsList.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => addToMix(item)}
                      className="btn-glass"
                    >
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-white/55">Loop</div>
                    </button>
                  ))}
                  {loopsList.length === 0 && (
                    <div className="text-xs text-white/55">No loop items.</div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col">
              <div className="mb-2 flex items-baseline justify-between">
                <div className="text-sm font-semibold">Events</div>
                <div className="text-xs text-white/55">Total {eventsList.length}</div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                <div className="space-y-2">
                  {eventsList.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => addToMix(item)}
                      className="btn-glass"
                    >
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-white/55">Event</div>
                    </button>
                  ))}
                  {eventsList.length === 0 && (
                    <div className="text-xs text-white/55">No event items.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* CENTER: Mixer */}
        <section className="glass-panel col-span-12 md:col-span-5 rounded-3xl p-6">
          <h1 className="text-lg font-semibold">Mixer</h1>
          <p className="mt-1 text-sm text-white/55">Ugly is correct. Logic first.</p>

          <div className="mt-4 space-y-3">
            {tracks.map((t) => (
              <div key={t.id} className="glass-panel rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="font-medium">{t.name}</div>
                      <span className="text-xs text-white/55">({t.type})</span>
                      <span className="text-xs">{assetStatus[t.id] ? '🟢' : '🔴'}</span>
                    </div>
                    <div className="mt-1 text-xs text-white/55">
                      {folderIdFor(t)}/{t.assetId}.mp3
                    </div>
                  </div>

                  <button
                    onClick={() => removeTrack(t.id)}
                    className="btn-glass"
                  >
                    Remove
                  </button>
                </div>

                {/* Asset selector */}
                <div className="mt-3">
                  <label className="text-xs text-white/55">Asset</label>
                  <select
                    className="glass-surface mt-1 w-full rounded-lg px-3 py-2 text-sm text-white/80 focus:outline-none focus:ring-2 focus:ring-white/20"
                    value={t.assetId}
                    onChange={(e) => updateTrack(t.id, { assetId: e.target.value })}
                  >
                    {LIBRARY.find((x) => x.id === t.libraryId)?.assets.map((a) => (
                      <option key={a.id} value={a.id} className="bg-white/[0.06] text-white/80">
                        {a.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Volume */}
                <div className="mt-3 flex items-center gap-3">
                  <span className="text-xs text-white/55 w-14">Vol</span>
                  <input
                    type="range"
                    className="flex-1"
                    min={0}
                    max={1}
                    step={0.01}
                    value={t.volume}
                    onChange={(e) => updateTrack(t.id, { volume: Number(e.target.value) })}
                  />
                  <span className="text-xs text-white/55 w-10 text-right">
                    {Math.round(t.volume * 100)}%
                  </span>
                </div>

                {/* Event controls */}
                {t.type === 'event' && (
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-white/55">Rate</label>
                      <select
                        className="glass-surface mt-1 w-full rounded-lg px-3 py-2 text-sm text-white/80 focus:outline-none focus:ring-2 focus:ring-white/20"
                        value={t.ratePreset}
                        onChange={(e) =>
                          updateTrack(t.id, { ratePreset: e.target.value as MixTrack['ratePreset'] })
                        }
                      >
                        <option className="bg-white/[0.06] text-white/80">Rare</option>
                        <option className="bg-white/[0.06] text-white/80">Medium</option>
                        <option className="bg-white/[0.06] text-white/80">Often</option>
                        <option className="bg-white/[0.06] text-white/80">Very Often</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-white/55">Speed</label>
                      <select
                        className="glass-surface mt-1 w-full rounded-lg px-3 py-2 text-sm text-white/80 focus:outline-none focus:ring-2 focus:ring-white/20"
                        value={t.rateSpeed}
                        onChange={(e) =>
                          updateTrack(t.id, { rateSpeed: Number(e.target.value) as MixTrack['rateSpeed'] })
                        }
                      >
                        <option value={0.5} className="bg-white/[0.06] text-white/80">0.5×</option>
                        <option value={1} className="bg-white/[0.06] text-white/80">1×</option>
                        <option value={2} className="bg-white/[0.06] text-white/80">2×</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* AUDIO CONTROLS */}
          <div className="mt-6 flex gap-3">
            <button onClick={activateAudio} className="btn-glass">
              {audioOn ? 'Audio Active' : 'Activate Audio'}
            </button>

            <button onClick={stopAudio} className="btn-glass">
              Stop
            </button>

            <div className="ml-auto flex items-center gap-3">
              <span className="text-xs text-white/55">Master</span>
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
        </section>

        {/* RIGHT: Export */}
        <aside className="glass-panel col-span-12 md:col-span-3 rounded-3xl p-6">
          <h2 className="text-lg font-semibold">Export</h2>
          <p className="mt-1 text-sm text-white/55">Export is locked on Personal.</p>

          <div className="mt-4 space-y-3">
            <div>
              <label className="text-xs text-white/55">Duration</label>
              <select className="glass-surface mt-1 w-full rounded-lg px-3 py-2 text-sm text-white/80 focus:outline-none focus:ring-2 focus:ring-white/20">
                <option className="bg-white/[0.06] text-white/80">10 min</option>
                <option className="bg-white/[0.06] text-white/80">30 min</option>
                <option className="bg-white/[0.06] text-white/80">60 min (max)</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-white/55">Format</label>
              <div className="mt-1 grid grid-cols-2 gap-2">
                <button className="glass-panel rounded-lg px-3 py-2 text-sm text-white/45" disabled>
                  MP3
                </button>
                <button className="glass-panel rounded-lg px-3 py-2 text-sm text-white/45" disabled>
                  WAV
                </button>
              </div>
              <div className="mt-2 text-xs text-white/55">🔒 Commercial license required to export.</div>
            </div>

            <button className="w-full rounded-lg border border-white/15 px-4 py-2 text-sm text-white/45" disabled>
              Export (Locked)
            </button>

            <div className="glass-panel rounded-xl border-dashed p-4 text-xs text-white/55">
              <div className="font-medium">Commercial unlock includes:</div>
              <ul className="mt-2 list-disc pl-4 space-y-1">
                <li>MP3 + WAV exports</li>
                <li>License certificate per export</li>
                <li>Monthly export minutes</li>
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
