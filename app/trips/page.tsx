'use client';

import { useEffect, useMemo, useState } from 'react';

type TripStatus = 'Planned' | 'In progress' | 'Recorded' | 'Shipped';

type TripAsset = {
  kind: 'loop' | 'event';
  category: string; // wind / water / birds / interior / etc
  assetId: string;  // filename without extension (or your final id)
  note?: string;
};

type Trip = {
  id: string;
  title: string;        // Wadden Sea
  subtitle: string;     // Quiet island coast...
  window: string;       // Spring (approx)
  locationLine: string; // Schiermonnikoog, Netherlands
  status: TripStatus;
  focusTags: string[];
  targets: TripAsset[];
  notes: string[];
  theme: 'frost' | 'forest' | 'coast' | 'cabin' | 'city';

  // optional card image (path under /public)
  image?: string;
};

const STATUS_STYLE: Record<TripStatus, string> = {
  Planned: 'border-white/15 bg-white/[0.03] text-app',
  'In progress': 'border-white/20 bg-white/[0.12] text-app',
  Recorded: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
  Shipped: 'border-emerald-400/40 bg-emerald-400/15 text-emerald-100',
};

function themeBg(theme: Trip['theme']) {
  switch (theme) {
    case 'frost':
      return 'bg-gradient-to-br from-white/10 via-white/[0.04] to-black';
    case 'forest':
      return 'bg-gradient-to-br from-emerald-500/15 via-white/[0.04] to-black';
    case 'coast':
      return 'bg-gradient-to-br from-sky-500/15 via-white/[0.04] to-black';
    case 'cabin':
      return 'bg-gradient-to-br from-amber-500/15 via-white/[0.04] to-black';
    case 'city':
      return 'bg-gradient-to-br from-fuchsia-500/15 via-white/[0.04] to-black';
    default:
      return 'bg-gradient-to-br from-white/10 via-white/[0.04] to-black';
  }
}

export default function TripsPage() {
  const trips: Trip[] = useMemo(
    () => [
{
  id: 'wadden-schiermonnikoog',
  title: 'Wadden Sea',
  subtitle: 'Quiet island coast with minimal human noise',
  window: 'Spring (approx)',
  locationLine: 'Schiermonnikoog, Netherlands',
  status: 'Planned',
  theme: 'coast',
  focusTags: ['wind', 'water', 'dunes', 'coast'],
  image: '/trips/schiermonnikoog.jpg',

  targets: [
    { kind: 'loop', category: 'wind', assetId: 'dunes_wind_bed_loop_01' },
    { kind: 'loop', category: 'water', assetId: 'coast_soft_waves_loop_01' },
    { kind: 'loop', category: 'water', assetId: 'distant_surf_loop_01' },
    { kind: 'loop', category: 'texture', assetId: 'coastal_grass_movement_loop_01' },
    { kind: 'event', category: 'birds', assetId: 'seabirds_sparse_event_01' },
    { kind: 'event', category: 'water', assetId: 'wave_hit_event_01' },
  ],

  notes: [
    'Intent: clean, loopable coastal ambience with minimal human presence.',
    'Focus: wind beds (dunes/grass) + soft wave textures + sparse seabird events.',
    'Out of scope: dense bird choruses, people/tourism, storms, interiors.',
    'Goal output: 3–4 loop beds + 5–8 short events. Multiple takes; ship best only.',
  ],
}

    ],
    []
  );

  const [openId, setOpenId] = useState<string | null>(null);
  const activeTrip = useMemo(() => trips.find((t) => t.id === openId) ?? null, [openId, trips]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpenId(null);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <main className="min-h-screen bg-transparent text-strong">
      {/* page glow */}
      <div className="pointer-events-none fixed inset-0 opacity-60">
        <div className="absolute -top-24 left-1/2 h-[420px] w-[820px] -translate-x-1/2 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl px-6 py-14">
        <section className="glass-panel rounded-3xl p-8 elev-3">


          <h1 className="mt-4 text-4xl font-semibold tracking-tight">Trips</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
            Planned recording sessions and what they’re intended to add to the library.
            Dates are approximate. Assets ship when they’re ready.
          </p>
        </section>

        <section className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {trips.map((t) => {
            const isActive = openId === t.id;

            return (
              <button
                key={t.id}
                onClick={() => setOpenId(t.id)}
                className={['glass-panel relative overflow-hidden text-left rounded-2xl p-5',
                  'cursor-pointer transition hover:ring-1 hover:ring-white/20 active:ring-white/30',
                  themeBg(t.theme),].join(' ')}

              >
                {/* ✅ SINGLE image layer block (inactive vs active brightness) */}
                {t.image && (
                  <>
                    <div
                      aria-hidden
                      className={['absolute inset-0 bg-cover bg-center scale-105 transition-opacity duration-300',
                        isActive ? 'opacity-45' : 'opacity-28',].join(' ')}
                      style={{ backgroundImage: `url(${t.image})` }}
                    />
                    <div
                      aria-hidden
                      className={['absolute inset-0 transition-colors duration-300',
                        isActive ? 'bg-black/35' : 'bg-black/55',].join(' ')}
                    />
                    <div
                      aria-hidden
                      className={['absolute inset-0 transition-opacity duration-300',
                        isActive ? 'bg-white/[0.06]' : 'bg-white/[0.03]',].join(' ')}
                    />
                  </>
                )}

                {/* Content layer */}
                <div className="relative">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm text-app">{t.subtitle}</div>
                      <div className="mt-1 text-2xl font-semibold tracking-tight">{t.title}</div>
                      <div className="mt-1 text-xs text-faint">{t.locationLine}</div>
                    </div>

                    <div className={`shrink-0 rounded-full border border-white/15 px-3 py-1 text-xs${STATUS_STYLE[t.status]}`}>
                      {t.status}
                    </div>
                  </div>

                  <div className="mt-4 text-xs text-faint">{t.window}</div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {t.focusTags.map((tag) => (
                      <span
                        key={tag}
                        className="glass-panel rounded-full bg-black/30 px-2.5 py-1 text-xs text-muted"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 text-xs text-faint">
                    Targets: <span className="text-app">{t.targets.length}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </section>

        <div className="mt-8 text-xs text-faint">
        </div>
      </div>

      {/* MODAL */}
      {activeTrip && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Trip details: ${activeTrip.title}`}
        >
          <button
            className="absolute inset-0 bg-black/70"
            onClick={() => setOpenId(null)}
            aria-label="Close"
          />

          <div className="glass-panel relative w-full max-w-3xl overflow-hidden rounded-3xl bg-black/80 p-6 elev-3">
            {activeTrip.image && (
              <>
                <div
                  aria-hidden
                  className="absolute inset-0 bg-cover bg-center opacity-90 scale-100" 
                  style={{ backgroundImage: `url(${activeTrip.image})` }}
                />
                <div aria-hidden className="absolute inset-0 bg-black/70" />
              </>
            )}

            <div className="relative">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm text-muted">{activeTrip.subtitle}</div>
                  <div className="mt-1 text-3xl font-semibold tracking-tight">{activeTrip.title}</div>
                  <div className="mt-2 text-sm text-faint">
                    {activeTrip.locationLine} • {activeTrip.window}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`rounded-full border border-white/15 px-3 py-1 text-xs${STATUS_STYLE[activeTrip.status]}`}>
                    {activeTrip.status}
                  </div>

                  <button
                    onClick={() => setOpenId(null)}
                    className="glass-surface rounded-xl px-3 py-2 text-sm hover:bg-white/[0.10]"
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <div className="glass-panel rounded-2xl p-5">
                  <div className="text-sm font-medium text-app">Focus</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {activeTrip.focusTags.map((tag) => (
                      <span
                        key={tag}
                        className="glass-panel rounded-full bg-black/30 px-2.5 py-1 text-xs text-muted"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="glass-panel rounded-2xl p-5">
                  <div className="text-sm font-medium text-app">Notes</div>
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted">
                    {activeTrip.notes.map((n, i) => (
                      <li key={i}>{n}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="glass-panel mt-5 rounded-2xl p-5">
                <div className="text-sm font-medium text-app">Target assets</div>
                <div className="glass-panel mt-3 overflow-hidden rounded-xl">
                  <div className="grid grid-cols-12 bg-black/30 px-4 py-2 text-xs text-faint">
                    <div className="col-span-2">Type</div>
                    <div className="col-span-3">Category</div>
                    <div className="col-span-4">assetId</div>
                    <div className="col-span-3">Note</div>
                  </div>

                  {activeTrip.targets.map((a, idx) => (
                    <div
                      key={`${a.assetId}-${idx}`}
                      className="grid grid-cols-12 px-4 py-2 text-sm text-app border-t border-white/10"
                    >
                      <div className="col-span-2 text-muted">{a.kind}</div>
                      <div className="col-span-3">{a.category}</div>
                      <div className="col-span-4 font-mono text-xs md:text-sm">{a.assetId}</div>
                      <div className="col-span-3 text-faint text-xs md:text-sm">
                        {a.note ?? '—'}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 text-xs text-faint">
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}



