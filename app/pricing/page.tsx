'use client';

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-transparent text-strong">
      {/* background glow */}
      <div className="pointer-events-none fixed inset-0 opacity-60">
        <div className="absolute -top-24 left-1/2 h-[420px] w-[820px] rounded-full bg-white/10 blur-3xl" />

      </div>

      <div className="relative mx-auto max-w-5xl px-6 py-14">
        {/* HERO */}
        <section className="glass-panel rounded-3xl p-8 ,0_40px_120">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="max-w-2xl">

              <h1 className="mt-4 text-4xl font-semibold tracking-tight">Pricing</h1>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Buy credits. Export when you need. No subscriptions.
              </p>
              <p className="mt-2 text-xs text-faint">
                Prices are shown in EUR. Your card provider may display the final charge in your local currency.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="glass-panel rounded-2xl bg-white/[0.02] p-4">
                  <div className="text-sm font-medium">1 credit</div>
                  <div className="mt-1 text-xs text-muted">= 5 minutes export</div>
                </div>
                <div className="glass-panel rounded-2xl bg-white/[0.02] p-4">
                  <div className="text-sm font-medium">Exports</div>
                  <div className="mt-1 text-xs text-muted">5 min = 1 credit • 10 min = 2 credits</div>
                </div>
                <div className="glass-panel rounded-2xl bg-white/[0.02] p-4">
                  <div className="text-sm font-medium">Credits</div>
                  <div className="mt-1 text-xs text-muted">Never expire</div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <a href="/autopilot" className="btn-glass rounded-xl px-4 py-2 text-sm">
                  Try Autopilot
                </a>
                <a href="/mixer" className="btn-glass rounded-xl px-4 py-2 text-sm">
                  Open Mixer
                </a>
              </div>

            </div>

            <div className="w-full md:w-[320px]">
              <div className="glass-panel rounded-2xl bg-white/[0.02] p-4">
                <div className="text-sm font-medium">Includes</div>
                <div className="mt-3 space-y-2 text-sm text-app">
                  <div className="glass-panel rounded-xl bg-white/[0.02] px-4 py-2">
                    ✅ WAV exports
                  </div>
                  <div className="glass-panel rounded-xl bg-white/[0.02] px-4 py-2">
                    ✅ Recipe export (deterministic)
                  </div>
                  <div className="glass-panel rounded-xl bg-white/[0.02] px-4 py-2">
                    ✅ Commercial use license
                  </div>
                </div>

                <div className="glass-panel mt-4 rounded-xl  p-3 text-xs text-faint">
                  Note: exporting creates a licensed audio file. Playback remains free.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PACKS */}
        <section className="glass-panel mt-10 rounded-3xl p-8 elev-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Credit packs</h2>
              <p className="mt-2 text-sm text-muted">
                Choose a pack. Export 5 or 10 minute clips.
              </p>
            </div>
            <div className="glass-panel hidden md:block rounded-2xl bg-white/[0.02] px-4 py-3 text-xs text-muted">
              10 min export = 2 credits
            </div>
          </div>

          <div className="mt-7 grid gap-5 lg:grid-cols-3">
            {/* 5 */}
            <div className="glass-panel rounded-2xl bg-white/[0.02] p-6">
              <div className="flex items-center justify-between">
  <div className="text-sm text-muted">Starter</div>
  {/* spacer to align with badge cards */}
  <div className="h-6" />
</div>

              <div className="mt-2 text-3xl font-semibold tracking-tight">5 credits</div>
              <div className="mt-1 text-xs text-faint">= 25 minutes export total</div>

              <div className="mt-4 text-2xl font-semibold">€5</div>
              <div className="mt-1 text-xs text-faint">Validation pricing</div>

              <button
                className="btn-glass"
                onClick={() => alert('Checkout not wired yet.')}
              >
                Buy 5 credits
              </button>
            </div>

            {/* 10 (highlight) */}
            <div className="glass-panel rounded-2xl p-6 flex h-full flex-col">
              {/* header row */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm text-muted">Creator</div>
                  <div className="mt-2 text-3xl font-semibold text-strong leading-none">
                    10 credits
                  </div>
                  <div className="mt-2 text-xs text-muted">= 50 minutes export total</div>
                </div>

                <span className="pill-glass rounded-full px-3 py-1 text-xs text-muted self-start">
                  Most common
                </span>
              </div>

              {/* price */}
              <div className="mt-4 text-2xl font-semibold text-strong leading-none">€9</div>
              <div className="mt-2 text-xs text-muted">Best starting point</div>

              {/* CTA pinned to bottom */}
              <button className="btn-glass rounded-xl px-4 py-2 text-sm mt-auto self-start">
                Buy 10 credits
              </button>
            </div>


            {/* 25 */}
            <div className="glass-panel rounded-2xl bg-white/[0.02] p-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted">Studio</div>
                <div className="glass-surface rounded-full px-3 py-1 text-xs text-app">
                  Best value
                </div>
              </div>

              <div className="mt-2 text-3xl font-semibold tracking-tight">25 credits</div>
              <div className="mt-1 text-xs text-faint">= 125 minutes export total</div>

              <div className="mt-4 text-2xl font-semibold">€19</div>
              <div className="mt-1 text-xs text-faint">For ongoing projects</div>

              <button
                className="btn-glass"
                onClick={() => alert('Checkout not wired yet.')}
              >
                Buy 25 credits
              </button>
            </div>
          </div>

          {/* FAQ / terms-lite */}
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            <div className="glass-panel rounded-2xl bg-white/[0.02] p-6">
              <div className="text-sm font-medium">What do I get when I export?</div>
              <p className="mt-2 text-sm text-muted">
                A downloadable audio file (WAV) plus a recipe file that describes the mix deterministically.
              </p>
            </div>

            <div className="glass-panel rounded-2xl bg-white/[0.02] p-6">
              <div className="text-sm font-medium">Commercial usage</div>
              <p className="mt-2 text-sm text-muted">
                Paid exports include a commercial license for your projects (videos, apps, games, podcasts).
                Redistribution as a sound library is not allowed.
              </p>
            </div>
          </div>

        </section>
      </div>
    </main>
  );
}



