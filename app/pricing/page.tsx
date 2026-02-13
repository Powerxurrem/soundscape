'use client';

export default function PricingPage() {
  async function goToCheckout(pack: "trial" | "starter" | "creator" | "studio") {
  try {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pack }),
    });

    const data = await res.json();

    if (data?.url) {
      window.location.href = data.url;
    } else {
      alert(data?.error ?? "Checkout failed.");
    }
  } catch (err) {
    alert("Checkout error.");
  }
}

  return (
    <main className="min-h-screen bg-transparent text-strong">
      {/* background glow */}
      <div className="pointer-events-none fixed inset-0 opacity-60">
        <div className="absolute -top-24 left-1/2 h-[420px] w-[820px] rounded-full bg-white/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 py-14">
        {/* HERO */}
        <section className="glass-panel elev-3 rounded-3xl p-8 ,0_40px_120">
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
                <div className="glass-panel rounded-2xl p-4">
                  <div className="text-sm font-medium">1 credit</div>
                  <div className="mt-1 text-xs text-muted">= 5 minutes export</div>
                </div>
                <div className="glass-panel rounded-2xl p-4">
                  <div className="text-sm font-medium">Exports</div>
                  <div className="mt-1 text-xs text-muted">Always work</div>
                </div>
                <div className="glass-panel rounded-2xl p-4">
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
              <div className="glass-panel rounded-2xl p-4">
                <div className="text-sm font-medium">Includes</div>
                <div className="mt-3 space-y-2 text-sm text-app">
                  <div className="glass-panel rounded-xl px-4 py-2">✅ WAV exports</div>
                  <div className="glass-panel rounded-xl px-4 py-2">✅ Recipe export (deterministic)</div>
                  <div className="glass-panel rounded-xl px-4 py-2">✅ Commercial use license</div>
                </div>

                <div className="glass-panel mt-4 rounded-xl p-3 text-xs text-faint">
                  Note: exporting creates a licensed audio file. Playback remains free.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PACKS */}
        <section className="glass-panel elev-3 mt-10 rounded-3xl p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Credit packs</h2>
              <p className="mt-2 text-sm text-muted">Choose a pack.</p>
            </div>
          </div>

          {/* changed to 4 cols on large screens */}
          <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {/* Trial / 1 */}
            <div className="glass-panel rounded-2xl p-6 flex h-full flex-col">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted">Trial</div>
                <span className="glass-surface rounded-full px-3 py-1 text-xs text-app">
                  Low friction
                </span>
              </div>

              <div className="mt-2 text-3xl font-semibold tracking-tight">1 credit</div>
              <div className="mt-1 text-xs text-faint">= 5 minutes export total</div>

              <div className="mt-4 text-2xl font-semibold">€3</div>
              <div className="mt-1 text-xs text-faint">Try exports once</div>

              <button
                className="mt-3 btn-glass rounded-xl px-4 py-2 text-sm self-start"
                onClick={() => goToCheckout("trial")}
              >
                Buy 1 credit
              </button>
            </div>

            {/* 5 */}
            <div className="glass-panel rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted">Starter</div>
                <div className="h-6" />
              </div>

              <div className="mt-2 text-3xl font-semibold tracking-tight">5 credits</div>
              <div className="mt-1 text-xs text-faint">= 25 minutes export total</div>

              <div className="mt-4 text-2xl font-semibold">€10</div>
              <div className="mt-1 text-xs text-faint">Good for first project</div>

              <button
                className="mt-3 btn-glass rounded-xl px-4 py-2 text-sm self-start"
                onClick={() => goToCheckout("starter")}
              >
                Buy 5 credits
              </button>
            </div>

{/* 10 (highlight) */}
<div className="glass-panel rounded-2xl p-6 flex h-full flex-col ring-1 ring-white/10">
  {/* header row */}
  <div className="flex items-center justify-between">
    <div className="text-sm text-muted">Creator</div>

    <span className="glass-surface rounded-full px-3 py-1 text-xs text-app">
      Most common
    </span>
  </div>

  {/* title */}
  <div className="mt-2 text-3xl font-semibold tracking-tight">10 credits</div>
  <div className="mt-1 text-xs text-faint">= 50 minutes export total</div>

  {/* price */}
  <div className="mt-4 text-2xl font-semibold py-1  text-strong leading-none">€18</div>
  <div className="mt-1 text-xs text-faint">Best starting point</div>

  {/* CTA */}
  <button
    className="mt-3 btn-glass rounded-xl px-4 py-2 text-sm self-start"
    onClick={() => goToCheckout("creator")}
  >
    Buy 10 credits
  </button>
</div>


            {/* 25 */}
            <div className="glass-panel rounded-2xl p-6 flex h-full flex-col">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted">Studio</div>
                <div className="glass-surface rounded-full px-6 py-1 text-xs text-app">
                  Best value
                </div>
              </div>

              <div className="mt-2 text-3xl font-semibold tracking-tight">25 credits</div>
              <div className="mt-1 text-xs text-faint">= 125 minutes export total</div>

              <div className="mt-4 text-2xl font-semibold">€35</div>
              <div className="mt-1 text-xs text-faint">For ongoing projects</div>

              <button
                className="mt-3 btn-glass rounded-xl px-4 py-2 text-sm self-start"
                onClick={() => goToCheckout("studio")}
              >
                Buy 25 credits
              </button>
            </div>
          </div>

          {/* FAQ / terms-lite */}
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            <div className="glass-panel rounded-2xl p-6">
              <div className="text-sm font-medium">What do I get when I export?</div>
              <p className="mt-2 text-sm text-muted">
                A downloadable audio file (WAV) plus a recipe file that describes the mix deterministically.
              </p>
            </div>

            <div className="glass-panel rounded-2xl p-6">
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
