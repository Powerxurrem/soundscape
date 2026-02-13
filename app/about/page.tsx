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
        <section className="glass-panel elev-3 elev-3 elev-3 elev-3 rounded-3xl p-8 ,0_40px_120px_rgba(0,0,0,0.65)]">


          <h1 className="mt-4 text-4xl font-semibold tracking-tight">
            Built to be quiet, reliable, and real
          </h1>

          <p className="mt-4 text-sm leading-relaxed text-muted max-w-2xl">
            Soundscape is a deterministic ambient sound generator.
            It creates calm, realistic soundscapes from real recordings — without accounts,
            subscriptions, or attention-seeking features.
          </p>
        </section>

        {/* WHAT IT IS */}
        <section className="glass-panel elev-3 elev-3 elev-3 elev-3 mt-10 rounded-3xl p-8">
          <h2 className="text-2xl font-semibold tracking-tight">What Soundscape is</h2>

          <p className="mt-4 text-sm text-muted leading-relaxed">
            Soundscape is a utility. You choose a mood, generate a mix, and export what you need.
            The system behaves the same every time, and nothing changes unless you change it.
          </p>

          <p className="mt-4 text-sm text-muted leading-relaxed">
            Playback is free. Exporting creates a licensed audio file you can use in your projects.
            No profiles, no subscriptions, no hidden behavior.
          </p>
        </section>

        {/* PRINCIPLES */}
        <section className="glass-panel elev-3 elev-3 elev-3 elev-3 mt-10 rounded-3xl p-8">
          <h2 className="text-2xl font-semibold tracking-tight">Design principles</h2>

          <ul className="mt-6 space-y-4 text-sm text-muted">
            <li>
              <span className="font-medium text-app">Low effort over cleverness</span><br />
              The system should work without configuration or explanation.
            </li>
            <li>
              <span className="font-medium text-app">Determinism over randomness</span><br />
              The same inputs always produce the same result.
            </li>
            <li>
              <span className="font-medium text-app">Silence over dashboards</span><br />
              No accounts to manage. No metrics to watch.
            </li>
            <li>
              <span className="font-medium text-app">Shipping over optimizing</span><br />
              Real output matters more than theoretical perfection.
            </li>
          </ul>
        </section>

        {/* REAL RECORDINGS */}
        <section className="glass-panel elev-3 elev-3 elev-3 mt-10 rounded-3xl p-8">
          <h2 className="text-2xl font-semibold tracking-tight">Real recordings first</h2>

          <p className="mt-4 text-sm text-muted leading-relaxed">
            Many ambient tools rely entirely on generated audio.
            Soundscape does not.
          </p>

          <p className="mt-4 text-sm text-muted leading-relaxed">
            Real-world recordings — wind, water, fire, insects — carry imperfections that synthetic
            audio often removes. Those imperfections are part of what makes a soundscape feel believable.
          </p>

          <p className="mt-4 text-sm text-muted leading-relaxed">
            Soundscape curates reality instead of sterilizing it.
          </p>
        </section>

        {/* DETERMINISM */}
        <section className="glass-panel elev-3 elev-3 elev-3 mt-10 rounded-3xl p-8">
          <h2 className="text-2xl font-semibold tracking-tight">Deterministic by design</h2>

          <p className="mt-4 text-sm text-muted leading-relaxed">
            When you generate a soundscape, the system produces a specific result — not a suggestion.
          </p>

          <p className="mt-4 text-sm text-muted leading-relaxed">
            Exports include a small recipe file that describes the mix.
            This makes soundscapes reproducible, debuggable, and stable over time.
          </p>
        </section>

        {/* WHAT IT IS NOT */}
        <section className="glass-panel elev-3 elev-3 elev-3 mt-10 rounded-3xl p-8">
          <h2 className="text-2xl font-semibold tracking-tight">What Soundscape is not</h2>

          <ul className="mt-6 space-y-2 text-sm text-muted">
            <li>• A DAW or music production tool</li>
            <li>• A generative music feed</li>
            <li>• A subscription platform</li>
            <li>• A social or content network</li>
            <li>• A constantly changing system</li>
          </ul>
        </section>

        {/* PRIVACY & GROWTH */}
        <section className="glass-panel elev-3 elev-3 elev-3 mt-10 rounded-3xl p-8">
          <h2 className="text-2xl font-semibold tracking-tight">Privacy and growth</h2>

          <p className="mt-4 text-sm text-muted leading-relaxed">
            Soundscape does not track usage and does not require a traditional account.
          </p>

          <p className="mt-4 text-sm text-muted leading-relaxed">
            When purchasing credits, payments are processed securely by Stripe. Stripe may collect information such as name, email address, and payment details to complete the transaction. Soundscape does not store full payment details on its own servers.
          </p>

          <p className="mt-4 text-sm text-muted leading-relaxed">
            Purchases are associated with an email address through Stripe to allow receipt delivery and purchase support.
          </p>
          <p className="mt-4 text-sm text-muted leading-relaxed">
            The asset library grows over time as new real-world recordings are added. Growth is intentional and curated, not algorithmic.
          </p>
        </section>


      </div>
    </main>
  );
}


