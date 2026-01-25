'use client';

import { useMemo, useState } from 'react';

type TrackType = 'loop' | 'event';

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
  ratePreset?: 'Rare' | 'Medium' | 'Often' | 'Very Often'; // event-only
};

const EVENT_RATE_SECONDS: Record<
  NonNullable<MixTrack['ratePreset']>,
  { min: number; max: number }
> = {
  Rare: { min: 45, max: 90 },
  Medium: { min: 20, max: 45 },
  Often: { min: 10, max: 20 },
  'Very Often': { min: 5, max: 10 },
};


const LIBRARY: LibraryItem[] = [
  {
    id: 'rain',
    name: 'Rain',
    type: 'loop',
    defaultAssetId: 'rain_soft_loop_01',
    assets: [
      { id: 'rain_soft_loop_01', label: 'Soft Rain' },
      { id: 'rain_medium_loop_01', label: 'Medium Rain' },
      { id: 'rain_on_window_loop_01', label: 'Rain on Window' },
    ],
  },
  {
    id: 'fireplace',
    name: 'Fireplace',
    type: 'loop',
    defaultAssetId: 'fireplace_cozy_loop_01',
    assets: [
      { id: 'fireplace_cozy_loop_01', label: 'Cozy Fireplace' },
      { id: 'fireplace_crackle_loop_01', label: 'Crackle Focus' },
      { id: 'fireplace_roomy_loop_01', label: 'Roomy Fireplace' },
    ],
  },
  {
    id: 'wind',
    name: 'Wind',
    type: 'loop',
    defaultAssetId: 'wind_gentle_loop_01',
    assets: [
      { id: 'wind_gentle_loop_01', label: 'Gentle Wind' },
      { id: 'wind_forest_loop_01', label: 'Forest Wind' },
      { id: 'wind_stormy_loop_01', label: 'Stormy Wind' },
    ],
  },
  {
    id: 'thunder',
    name: 'Thunder',
    type: 'event',
    defaultAssetId: 'thunder_distant_02',
    assets: [
      { id: 'thunder_distant_02', label: 'Distant Roll' },
      { id: 'thunder_close_01', label: 'Close Strike' },
      { id: 'thunder_rolling_03', label: 'Rolling Thunder' },
    ],
  },
  {
    id: 'cafe',
    name: 'Cafe',
    type: 'loop',
    defaultAssetId: 'cafe_murmur_loop_01',
    assets: [
      { id: 'cafe_murmur_loop_01', label: 'Murmur' },
      { id: 'cafe_busy_loop_01', label: 'Busy Cafe' },
      { id: 'cafe_soft_jazz_loop_01', label: 'Soft Jazz Cafe' },
    ],
  },
];


function makeId(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function generateEventTimes(durationSec: number, minSec: number, maxSec: number) {
  const times: number[] = [];
  let t = 0;

  while (true) {
    const gap = minSec + Math.random() * (maxSec - minSec);
    t += gap;
    if (t >= durationSec) break;
    times.push(Math.round(t * 10) / 10);
  }

  return times;
}

function estimateEvents(durationSec: number, minSec: number, maxSec: number) {
  const avg = (minSec + maxSec) / 2;
  return Math.floor(durationSec / avg);
}


export default function MixerPage() {
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
      assetId: 'thunder_distant_02',
      volume: 0.35,
      ratePreset: 'Rare',
    },
  ]);

  const filteredLibrary = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return LIBRARY;
    return LIBRARY.filter((i) => i.name.toLowerCase().includes(q));
  }, [query]);

  function addToMix(item: LibraryItem) {
    // For loops: only allow one instance per libraryId (keeps it simple for v1)
    if (item.type === 'loop' && tracks.some((t) => t.libraryId === item.id)) return;

    setTracks((prev) => [
      ...prev,
      {
        id: makeId('t'),
        libraryId: item.id,
        name: item.name,
        type: item.type,
        assetId: item.defaultAssetId,
        volume: 0.5,
        ...(item.type === 'event' ? { ratePreset: 'Rare' as const } : {}),
      },
    ]);
  }

  function removeTrack(trackId: string) {
    setTracks((prev) => prev.filter((t) => t.id !== trackId));
  }

  function setVolume(trackId: string, vol: number) {
    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, volume: vol } : t))
    );
  }

  function setRate(trackId: string, rate: MixTrack['ratePreset']) {
    setTracks((prev) =>
      prev.map((t) =>
        t.id === trackId ? { ...t, ratePreset: rate } : t
      )
    );
  }

  function setAsset(trackId: string, assetId: string) {
  setTracks((prev) =>
    prev.map((t) => (t.id === trackId ? { ...t, assetId } : t))
  );
}

  return (
    <main className="min-h-[calc(100vh-57px)]">
      <div className="grid h-full grid-cols-12 gap-4 p-4">
        {/* LEFT: Library */}
        <section className="col-span-12 md:col-span-3 rounded-xl border p-4">
          <h1 className="text-lg font-semibold">Library</h1>
          <p className="mt-1 text-sm text-gray-600">
            Click to add. Loops are single-instance (for now).
          </p>

          <div className="mt-4">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search sounds..."
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>

          <div className="mt-4 space-y-2">
            {filteredLibrary.map((item) => {
              const alreadyAdded =
                item.type === 'loop' && tracks.some((t) => t.libraryId === item.id);

              return (
                <button
                  key={item.id}
                  onClick={() => addToMix(item)}
                  disabled={alreadyAdded}
                  className={[
                    'w-full rounded-lg border px-3 py-2 text-left text-sm',
                    alreadyAdded ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-50',
                  ].join(' ')}
                >
                  <div className="flex items-center justify-between">
                    <span>
                      {item.name}{' '}
                      <span className="text-xs text-gray-600">
                        ({item.type === 'loop' ? 'Loop' : 'Event'})
                      </span>
                    </span>
                    {alreadyAdded ? (
                      <span className="text-xs text-gray-600">Added</span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* MIDDLE: Mix */}
        <section className="col-span-12 md:col-span-6 rounded-xl border p-4">
          <h2 className="text-lg font-semibold">Current Mix</h2>
          <p className="mt-1 text-sm text-gray-600">
            Loops + Events. This is state-only (audio later).
          </p>

          <div className="mt-4 space-y-3">
            {tracks.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-gray-600">
                Add items from the Library to build your mix.
              </div>
            ) : (
              tracks.map((t) => (
                <div key={t.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">
                        {t.name} ({t.type === 'loop' ? 'Loop' : 'Event'})
                      </div>
                      <div className="mt-1 flex items-center gap-2">
  <span className="text-xs text-gray-600 w-10">Asset</span>

  <select
    value={t.assetId}
    onChange={(e) => setAsset(t.id, e.target.value)}
    className="w-full rounded-lg border bg-black text-white px-2 py-2 text-sm"

  >
    {(LIBRARY.find((x) => x.id === t.libraryId)?.assets ?? []).map((a) => (
      <option key={a.id} value={a.id}>
        {a.label}
      </option>
    ))}
  </select>
</div>

                    </div>
                    <button
                      onClick={() => removeTrack(t.id)}
                      className="text-sm text-gray-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div className="flex items-center gap-3">
                      <div className="text-xs text-gray-600 w-12">Vol</div>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={t.volume}
                        onChange={(e) => setVolume(t.id, Number(e.target.value))}
                        className="w-full"
                      />
                      <div className="w-10 text-right text-xs text-gray-600">
                        {Math.round(t.volume * 100)}
                      </div>
                    </div>

                    {t.type === 'event' ? (
<div className="flex items-start gap-3">
  <div className="text-xs text-gray-600 w-12 pt-2">Rate</div>

  <div className="flex-1">
    <select
      value={t.ratePreset ?? 'Rare'}
      onChange={(e) =>
        setRate(t.id, e.target.value as MixTrack['ratePreset'])
      }
      className="w-full rounded-lg border bg-black text-white px-2 py-2 text-sm"
      style={{ colorScheme: 'dark' }}
    >
      <option>Rare</option>
      <option>Medium</option>
      <option>Often</option>
      <option>Very Often</option>
    </select>

    {(() => {
      const r = EVENT_RATE_SECONDS[t.ratePreset ?? 'Rare'];
      const n = estimateEvents(10 * 60, r.min, r.max); // per 10 minutes (for now)
      return (
        <div className="mt-1 text-xs text-gray-600">
          ~{n} events per 10 min • {r.min}–{r.max}s
        </div>
      );
    })()}
  </div>
</div>

                    ) : (
                      <div className="flex items-center gap-3 opacity-50">
                        <div className="text-xs text-gray-600 w-12">Rate</div>
                        <div className="text-sm text-gray-600">—</div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-6 flex gap-3">
            <button className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50">
              Play (later)
            </button>
            <button className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50">
              Stop (later)
            </button>
            <div className="ml-auto flex items-center gap-3">
              <span className="text-xs text-gray-600">Master</span>
              <input type="range" className="w-40" />
            </div>
          </div>
        </section>

        {/* RIGHT: Export */}
        <aside className="col-span-12 md:col-span-3 rounded-xl border p-4">
          <h2 className="text-lg font-semibold">Export</h2>
          <p className="mt-1 text-sm text-gray-600">Export is locked on Personal.</p>

          <div className="mt-4 space-y-3">
            <div>
              <label className="text-xs text-gray-600">Duration</label>
              <select className="mt-1 w-full rounded-lg border px-2 py-2 text-sm">
                <option>10 min</option>
                <option>30 min</option>
                <option>60 min (max)</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-600">Format</label>
              <div className="mt-1 grid grid-cols-2 gap-2">
                <button className="rounded-lg border px-3 py-2 text-sm text-gray-400" disabled>
                  MP3
                </button>
                <button className="rounded-lg border px-3 py-2 text-sm text-gray-400" disabled>
                  WAV
                </button>
              </div>
              <div className="mt-2 text-xs text-gray-600">
                🔒 Commercial license required to export.
              </div>
            </div>

            <button className="w-full rounded-lg border px-4 py-2 text-sm text-gray-400" disabled>
              Export (Locked)
            </button>

            <div className="rounded-lg border border-dashed p-3 text-xs text-gray-600">
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
