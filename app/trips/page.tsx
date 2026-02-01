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
  title: string;        // Finland
  subtitle: string;     // Winter field recording
  window: string;       // Feb 2026 (approx)
  locationLine: string; // Lapland, Finland (or similar)
  status: TripStatus;
  focusTags: string[];
  targets: TripAsset[];
  notes: string[];
  theme: 'frost' | 'forest' | 'coast' | 'cabin' | 'city';
};

const STATUS_STYLE: Record<TripStatus, string> = {
  Planned: 'border-white/15 bg-white/[0.03] text-white/70',
  'In progress': 'border-white/20 bg-white/[0.06] text-white/80',
  Recorded: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
  Shipped: 'border-emerald-400/40 bg-emerald-400/15 text-emerald-100',
};

function themeBg(theme: Trip['theme']) {
  // Simple, stable “backgrounds” without needing images yet.
  // Later: swap to `style={{ backgroundImage: `url(...)` }}` per trip.
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
        id: 'finland-winter',
        title: 'Finland',
        subtitle: 'Winter field recording',
        window: 'Feb 2026 (approx)',
        locationLine: 'Lapland, Finland',
        status: 'Planned',
        theme: 'frost',
        focusTags: ['wind', 'snow', 'forest', 'interior', 'ice'],
        targets: [
          { kind: 'loop', category: 'wind', assetId: 'wind_open_lake_loop_01', note: 'steady wide wind, minimal gusts' },
          { kind: 'loop', category: 'wind', assetId: 'wind_soft_trees_loop_02', note: 'tree movement texture' },
          { kind: 'event', category: 'interior', assetId: 'cabin_wood_creak_event_01', note: 'rare, non-rhythmic' },
          { kind: 'event', category: 'water', assetId: 'ice_crack_event_01', note: 'short mono events' },
          { kind: 'event', category: 'forest', assetId: 'snow_steps_event_01', note: 'footsteps in snow (mono)' },
        ],
        notes: [
          'Focus on believable winter silence (no aggressive cleanup).',
          'Events should be mono and short. Loops should be seamless.',
          'Ship only what passes the “does it feel real” test.',
        ],
      },
      {
        id: 'local-forest',
        title: 'Local forest',
        subtitle: 'Quick capture session',
        window: 'Next available weekend',
        locationLine: 'Nearby woodland',
        status: 'Planned',
        theme: 'forest',
        focusTags: ['birds', 'wind', 'insects'],
        targets: [
          { kind: 'loop', category: 'birds', assetId: 'birds_distant_canopy_loop_01' },
          { kind: 'loop', category: 'wind', assetId: 'wind_soft_leaves_loop_01' },
          { kind: 'event', category: 'insects', assetId: 'insects_nearby_tick_event_01' },
        ],
        notes: [
          'Short session: prioritize clean, loopable beds.',
          'Avoid heavy noise reduction; prefer minimal processing.',
        ],
      },
      {
        id: 'coast-waves',
        title: 'Coast',
        subtitle: 'Waves + wind textures',
        window: 'Spring (approx)',
        locationLine: 'North Sea coast',
        status: 'Planned',
        theme: 'coast',
        focusTags: ['water', 'wind'],
        targets: [
          { kind: 'loop', category: 'water', assetId: 'water_soft_waves_loop_01' },
          { kind: 'loop', category: 'water', assetId: 'water_rocky_shore_loop_01' },
          { kind: 'event', category: 'water', assetId: 'water_wave_hit_event_01' },
        ],
        notes: [
          'Capture both “soft bed” and “textured detail”.',
          'Events should not pile up; keep them sparse and distinct.',
        ],
      },
    ],
    []
  );

  const [openId, setOpenId] = useState<string | null>(null);
  const activeTrip = useMemo(() => trips.find((t) => t.id === openId) ?? null, [openId, trips]);

  // ESC to close
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpenId(null);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <main className="min-h-screen bg-black text-white">
      {/* background glow */}
      <div className="pointer-events-none fixed inset-0 opacity-60">
        <div className="absolute -top-24 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute top-[35%] left-[10%] h-[360px] w-[360px] rounded-full bg-white/5 blur-3xl" />
        <div className="absolute top-[55%] right-[12%] h-[420px] w-[420px] rounded-full bg-white/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl px-6 py-14">
        <section className="rounded-3xl border border-white/15 bg-white/[0.03] p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_40px_120px_rgba(0,0,0,0.65)] backdrop-blur">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.02] px-3 py-1 text-xs text-white/70">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400/90" />
            Trips • field recording plan
          </div>

          <h1 className="mt-4 text-4xl font-semibold tracking-tight">Trips</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/65">
            Planned recording sessions and what they’re intended to add to the library.
            Dates are approximate. Assets ship when they’re ready.
          </p>
        </section>

        <section className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {trips.map((t) => (
            <button
              key={t.id}
              onClick={() => setOpenId(t.id)}
              className={[
                'text-left rounded-2xl border border-white/15 p-5 backdrop-blur',
                'shadow-[0_0_0_1px_rgba(255,255,255,0.03)] hover:border-white/25 hover:bg-white/[0.04]',
                themeBg(t.theme),
              ].join(' ')}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm text-white/70">{t.subtitle}</div>
                  <div className="mt-1 text-2xl font-semibold tracking-tight">{t.title}</div>
                  <div className="mt-1 text-xs text-white/50">{t.locationLine}</div>
                </div>

                <div className={`shrink-0 rounded-full border px-3 py-1 text-xs ${STATUS_STYLE[t.status]}`}>
                  {t.status}
                </div>
              </div>

              <div className="mt-4 text-xs text-white/55">{t.window}</div>

              <div className="mt-4 flex flex-wrap gap-2">
                {t.focusTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-xs text-white/60"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-4 text-xs text-white/55">
                Targets: <span className="text-white/70">{t.targets.length}</span>
              </div>
            </button>
          ))}
        </section>

        <div className="mt-8 text-xs text-white/45">
          Tip: this page is a logbook. It’s allowed to be incomplete.
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
          {/* backdrop */}
          <button
            className="absolute inset-0 bg-black/70"
            onClick={() => setOpenId(null)}
            aria-label="Close"
          />

          {/* panel */}
          <div className="relative w-full max-w-3xl rounded-3xl border border-white/15 bg-black/80 p-6 shadow-[0_40px_160px_rgba(0,0,0,0.85)] backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm text-white/65">{activeTrip.subtitle}</div>
                <div className="mt-1 text-3xl font-semibold tracking-tight">{activeTrip.title}</div>
                <div className="mt-2 text-sm text-white/55">
                  {activeTrip.locationLine} • {activeTrip.window}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className={`rounded-full border px-3 py-1 text-xs ${STATUS_STYLE[activeTrip.status]}`}>
                  {activeTrip.status}
                </div>

                <button
                  onClick={() => setOpenId(null)}
                  className="rounded-xl border border-white/15 bg-white/[0.06] px-3 py-2 text-sm hover:bg-white/[0.10]"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {/* Focus */}
              <div className="rounded-2xl border border-white/15 bg-white/[0.03] p-5">
                <div className="text-sm font-medium text-white/80">Focus</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {activeTrip.focusTags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-xs text-white/60"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="rounded-2xl border border-white/15 bg-white/[0.03] p-5">
                <div className="text-sm font-medium text-white/80">Notes</div>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-white/65">
                  {activeTrip.notes.map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Targets */}
            <div className="mt-5 rounded-2xl border border-white/15 bg-white/[0.03] p-5">
              <div className="text-sm font-medium text-white/80">Target assets</div>
              <div className="mt-3 overflow-hidden rounded-xl border border-white/10">
                <div className="grid grid-cols-12 bg-black/30 px-4 py-2 text-xs text-white/55">
                  <div className="col-span-2">Type</div>
                  <div className="col-span-3">Category</div>
                  <div className="col-span-4">assetId</div>
                  <div className="col-span-3">Note</div>
                </div>

                {activeTrip.targets.map((a, idx) => (
                  <div
                    key={`${a.assetId}-${idx}`}
                    className="grid grid-cols-12 px-4 py-2 text-sm text-white/70 border-t border-white/10"
                  >
                    <div className="col-span-2 text-white/60">{a.kind}</div>
                    <div className="col-span-3">{a.category}</div>
                    <div className="col-span-4 font-mono text-xs md:text-sm">{a.assetId}</div>
                    <div className="col-span-3 text-white/55 text-xs md:text-sm">
                      {a.note ?? '—'}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 text-xs text-white/45">
                Reminder: filenames == assetId, mp3 only, events mono, loops seamless.
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
