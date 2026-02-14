'use client';

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-transparent text-strong">
      {/* background glow */}
      <div className="pointer-events-none fixed inset-0 opacity-60">
        <div className="absolute -top-24 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute top-[35%] left-[10%] h-[360px] w-[360px] rounded-full bg-white/5 blur-3xl" />
        <div className="absolute top-[55%] right-[12%] h-[420px] w-[420px] rounded-full bg-white/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-4xl px-6 py-14">
        {/* HERO */}
        <section className="glass-panel elev-3 rounded-3xl p-8">
          <h1 className="text-4xl font-semibold tracking-tight">
            Built to be quiet, reliable, and real
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">
            Soundscape is a deterministic ambient sound engine built from real-world recordings.
            It generates calm, realistic soundscapes without accounts, subscriptions, or algorithmic feeds.
          </p>

          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
            You choose a mood. You generate a mix. You export exactly what you need.
            Nothing changes unless you change it.
          </p>
        </section>

        {/* WHAT IT IS */}
        <section className="glass-panel elev-3 mt-10 rounded-3xl p-8">
          <h2 className="text-2xl font-semibold tracking-tight">What Soundscape is</h2>

          <p className="mt-4 text-sm text-muted leading-relaxed">
            Soundscape is a focused utility. Playback is free. Exports create licensed audio files you can use
            in videos, games, applications, podcasts, or client work.
          </p>

          <p className="mt-4 text-sm text-muted leading-relaxed">
            There are no profiles to manage and no dashboards to monitor. The system behaves predictably and
            consistently.
          </p>
        </section>

        {/* PRINCIPLES */}
        <section className="glass-panel elev-3 mt-10 rounded-3xl p-8">
          <h2 className="text-2xl font-semibold tracking-tight">Design principles</h2>

          <ul className="mt-6 space-y-4 text-sm text-muted">
            <li>
              <span className="font-medium text-app">Low effort over cleverness</span>
              <br />
              The system should work without configuration or explanation.
            </li>
            <li>
              <span className="font-medium text-app">Determinism over randomness</span>
              <br />
              The same inputs always produce the same result.
            </li>
            <li>
              <span className="font-medium text-app">Signal over features</span>
              <br />
              Remove friction. Remove noise. Keep what matters.
            </li>
            <li>
              <span className="font-medium text-app">Shipping over optimizing</span>
              <br />
              Real output matters more than theoretical perfection.
            </li>
          </ul>
        </section>

        {/* REAL RECORDINGS */}
        <section className="glass-panel elev-3 mt-10 rounded-3xl p-8">
          <h2 className="text-2xl font-semibold tracking-tight">Real recordings first</h2>

          <p className="mt-4 text-sm text-muted leading-relaxed">
            Soundscape uses real-world field recordings.
          </p>

          <p className="mt-4 text-sm text-muted leading-relaxed">
            Wind moves unevenly. Fire crackles imperfectly. Water shifts and drifts. Synthetic systems often
            smooth these details away. We keep them.
          </p>

          <p className="mt-4 text-sm text-muted leading-relaxed">
            Soundscape curates reality instead of sterilizing it.
          </p>
        </section>

        {/* DETERMINISM */}
        <section className="glass-panel elev-3 mt-10 rounded-3xl p-8">
          <h2 className="text-2xl font-semibold tracking-tight">Deterministic by design</h2>

          <p className="mt-4 text-sm text-muted leading-relaxed">
            Every generated mix is reproducible. Exports include a small recipe description so mixes can be
            recreated and verified later.
          </p>

          <p className="mt-4 text-sm text-muted leading-relaxed">
            No hidden variation. No silent updates to past results.
          </p>
        </section>

        {/* WHAT IT IS NOT */}
        <section className="glass-panel elev-3 mt-10 rounded-3xl p-8">
          <h2 className="text-2xl font-semibold tracking-tight">What Soundscape is not</h2>

          <ul className="mt-6 space-y-2 text-sm text-muted">
            <li>• A DAW or music production suite</li>
            <li>• A generative music feed</li>
            <li>• A subscription content platform</li>
            <li>• A social or content network</li>
            <li>• An infinite, constantly changing system</li>
          </ul>
        </section>

        {/* PRIVACY & PAYMENTS */}
        <section className="glass-panel elev-3 mt-10 rounded-3xl p-8">
          <h2 className="text-2xl font-semibold tracking-tight">Privacy and payments</h2>

          <p className="mt-4 text-sm text-muted leading-relaxed">
            Soundscape does not track usage and does not require accounts.
          </p>

          <p className="mt-4 text-sm text-muted leading-relaxed">
            When purchasing credits, payments are securely processed by Stripe. Stripe may collect necessary
            information (such as name and email) to complete the transaction. Soundscape does not store full
            payment details.
          </p>

          <p className="mt-4 text-sm text-muted leading-relaxed">
            Purchases are associated with Stripe transaction data for receipt delivery and support.
          </p>
        </section>

        {/* GROWTH */}
        <section className="glass-panel elev-3 mt-10 rounded-3xl p-8">
          <h2 className="text-2xl font-semibold tracking-tight">Growth philosophy</h2>

          <p className="mt-4 text-sm text-muted leading-relaxed">
            The asset library grows intentionally. New recordings are added through curated real-world capture
            — not algorithmic generation. Expansion is deliberate. Quality comes before quantity.
          </p>
        </section>
      </div>
    </main>
  );
}
