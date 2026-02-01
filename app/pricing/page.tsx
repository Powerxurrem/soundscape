'use client';

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      {/* background glow */}
      <div className="pointer-events-none fixed inset-0 opacity-60">
        <div className="absolute -top-24 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute top-[35%] left-[10%] h-[360px] w-[360px] rounded-full bg-white/5 blur-3xl" />
        <div className="absolute top-[55%] right-[12%] h-[420px] w-[420px] rounded-full bg-white/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl px-6 py-14">
        {/* HERO */}
        <section className="rounded-3xl border border-white/15 bg-white/[0.03] p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_40px_120px_rgba(0,0,0,0.65)] backdrop-blur">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.02] px-3 py-1 text-xs text-white/70">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400/90" />
                Credits model • locked
              </div>

              <h1 className="mt-4 text-4xl font-semibold tracking-tight">Pricing</h1>
              <p className="mt-3 text-sm leading-relaxed text-white/65">
                Buy credits. Export when you need. No subscriptions.
              </p>
              <p className="mt-2 text-xs text-white/45">
                Prices are shown in EUR. Your card provider may display the final charge in your local currency.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/15 bg-white/[0.02] p-4">
                  <div className="text-sm font-medium">1 credit</div>
                  <div className="mt-1 text-xs text-white/60">= 5 minutes export</div>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/[0.02] p-4">
                  <div className="text-sm font-medium">Exports</div>
                  <div className="mt-1 text-xs text-white/60">5 min = 1 credit • 10 min = 2 credits</div>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/[0.02] p-4">
                  <div className="text-sm font-medium">Credits</div>
                  <div className="mt-1 text-xs text-white/60">Never expire</div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="/autopilot"
                  className="rounded-xl border border-white/15 bg-white/10 px-5 py-2.5 text-sm hover:bg-white/15"
                >
                  Try Autopilot
                </a>
                <a
                  href="/mixer"
                  className="rounded-xl border border-white/15 bg-white/[0.03] px-5 py-2.5 text-sm hover:bg-white/[0.06]"
                >
                  Open Mixer
                </a>
              </div>
            </div>

            <div className="w-full md:w-[320px]">
              <div className="rounded-2xl border border-white/15 bg-white/[0.02] p-4">
                <div className="text-sm font-medium">Includes</div>
                <div className="mt-3 space-y-2 text-sm text-white/70">
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2">
                    ✅ WAV exports
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2">
                    ✅ Recipe export (deterministic)
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2">
                    ✅ Commercial use license
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-white/55">
                  Note: exporting creates a licensed audio file. Playback remains free.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PACKS */}
        <section className="mt-10 rounded-3xl border border-white/15 bg-white/[0.03] p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_40px_120px_rgba(0,0,0,0.65)] backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Credit packs</h2>
              <p className="mt-2 text-sm text-white/65">
                Choose a pack. Export 5 or 10 minute clips.
              </p>
            </div>
            <div className="hidden md:block rounded-2xl border border-white/15 bg-white/[0.02] px-4 py-3 text-xs text-white/60">
              10 min export = 2 credits
            </div>
          </div>

          <div className="mt-7 grid gap-5 lg:grid-cols-3">
            {/* 5 */}
            <div className="rounded-2xl border border-white/15 bg-white/[0.02] p-6">
              <div className="flex items-center justify-between">
  <div className="text-sm text-white/60">Starter</div>
  {/* spacer to align with badge cards */}
  <div className="h-6" />
</div>

              <div className="mt-2 text-3xl font-semibold tracking-tight">5 credits</div>
              <div className="mt-1 text-xs text-white/55">= 25 minutes export total</div>

              <div className="mt-4 text-2xl font-semibold">€5</div>
              <div className="mt-1 text-xs text-white/45">Validation pricing</div>

              <div className="mt-5 rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-white/70">
                <div>Examples</div>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-white/60">
                  <li>5 × 5-minute clips</li>
                  <li>2 × 10-minute clips + 1 × 5-minute</li>
                </ul>
              </div>

              <button
                className="mt-5 w-full rounded-xl border border-white/15 bg-white/10 px-5 py-2.5 text-sm hover:bg-white/15"
                onClick={() => alert('Checkout not wired yet.')}
              >
                Buy 5 credits
              </button>
            </div>

            {/* 10 (highlight) */}
            <div className="rounded-2xl border border-white/25 bg-white/[0.04] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
              <div className="flex items-center justify-between">
                <div className="text-sm text-white/60">Creator</div>
                <div className="rounded-full border border-white/20 bg-white/[0.06] px-3 py-1 text-xs text-white/70">
                  Most common
                </div>
              </div>

              <div className="mt-2 text-3xl font-semibold tracking-tight">10 credits</div>
              <div className="mt-1 text-xs text-white/55">= 50 minutes export total</div>

              <div className="mt-4 text-2xl font-semibold">€9</div>
              <div className="mt-1 text-xs text-white/45">Best starting point</div>

              <div className="mt-5 rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-white/70">
                <div>Examples</div>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-white/60">
                  <li>10 × 5-minute clips</li>
                  <li>5 × 10-minute clips</li>
                </ul>
              </div>

              <button
                className="mt-5 w-full rounded-xl border border-white/15 bg-white/10 px-5 py-2.5 text-sm hover:bg-white/15"
                onClick={() => alert('Checkout not wired yet.')}
              >
                Buy 10 credits
              </button>
            </div>

            {/* 25 */}
            <div className="rounded-2xl border border-white/15 bg-white/[0.02] p-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-white/60">Studio</div>
                <div className="rounded-full border border-white/20 bg-white/[0.06] px-3 py-1 text-xs text-white/70">
                  Best value
                </div>
              </div>

              <div className="mt-2 text-3xl font-semibold tracking-tight">25 credits</div>
              <div className="mt-1 text-xs text-white/55">= 125 minutes export total</div>

              <div className="mt-4 text-2xl font-semibold">€19</div>
              <div className="mt-1 text-xs text-white/45">For ongoing projects</div>

              <div className="mt-5 rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-white/70">
                <div>Examples</div>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-white/60">
                  <li>25 × 5-minute clips</li>
                  <li>12 × 10-minute clips + 1 × 5-minute</li>
                </ul>
              </div>

              <button
                className="mt-5 w-full rounded-xl border border-white/15 bg-white/10 px-5 py-2.5 text-sm hover:bg-white/15"
                onClick={() => alert('Checkout not wired yet.')}
              >
                Buy 25 credits
              </button>
            </div>
          </div>

          {/* FAQ / terms-lite */}
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/15 bg-white/[0.02] p-6">
              <div className="text-sm font-medium">What do I get when I export?</div>
              <p className="mt-2 text-sm text-white/65">
                A downloadable audio file (WAV) plus a recipe file that describes the mix deterministically.
              </p>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/[0.02] p-6">
              <div className="text-sm font-medium">Commercial usage</div>
              <p className="mt-2 text-sm text-white/65">
                Paid exports include a commercial license for your projects (videos, apps, games, podcasts).
                Redistribution as a sound library is not allowed.
              </p>
            </div>
          </div>

          <div className="mt-6 text-xs text-white/45">
            Tip: start with 5 credits. If you come back, 10 is usually the sweet spot.
          </div>
        </section>
      </div>
    </main>
  );
}
