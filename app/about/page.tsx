'use client';

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-transparent text-zinc-100">
      {/* background glow */}
      <div className="pointer-events-none fixed inset-0 opacity-60">
        <div className="absolute -top-24 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute top-[35%] left-[10%] h-[360px] w-[360px] rounded-full bg-white/5 blur-3xl" />
        <div className="absolute top-[55%] right-[12%] h-[420px] w-[420px] rounded-full bg-white/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-4xl px-6 py-14">
        {/* HERO */}
        <section className="rounded-3xl border border-white/15 bg-white/[0.03] p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_40px_120px_rgba(0,0,0,0.65)] backdrop-blur">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.02] px-3 py-1 text-xs text-white/70">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400/90" />
            About Soundscape
          </div>

          <h1 className="mt-4 text-4xl font-semibold tracking-tight">
            Built to be quiet, reliable, and real
          </h1>

          <p className="mt-4 text-sm leading-relaxed text-white/65 max-w-2xl">
            Soundscape is a deterministic ambient sound generator.
            It creates calm, realistic soundscapes from real recordings — without accounts,
            subscriptions, or attention-seeking features.
          </p>
        </section>

        {/* WHAT IT IS */}
        <section className="mt-10 rounded-3xl border border-white/15 bg-white/[0.03] p-8 backdrop-blur">
          <h2 className="text-2xl font-semibold tracking-tight">What Soundscape is</h2>

          <p className="mt-4 text-sm text-white/65 leading-relaxed">
            Soundscape is a utility. You choose a mood, generate a mix, and export what you need.
            The system behaves the same every time, and nothing changes unless you change it.
          </p>

          <p className="mt-4 text-sm text-white/65 leading-relaxed">
            Playback is free. Exporting creates a licensed audio file you can use in your projects.
            No profiles, no subscriptions, no hidden behavior.
          </p>
        </section>

        {/* PRINCIPLES */}
        <section className="mt-10 rounded-3xl border border-white/15 bg-white/[0.03] p-8 backdrop-blur">
          <h2 className="text-2xl font-semibold tracking-tight">Design principles</h2>

          <ul className="mt-6 space-y-4 text-sm text-white/65">
            <li>
              <span className="font-medium text-white/80">Low effort over cleverness</span><br />
              The system should work without configuration or explanation.
            </li>
            <li>
              <span className="font-medium text-white/80">Determinism over randomness</span><br />
              The same inputs always produce the same result.
            </li>
            <li>
              <span className="font-medium text-white/80">Silence over dashboards</span><br />
              No accounts to manage. No metrics to watch.
            </li>
            <li>
              <span className="font-medium text-white/80">Shipping over optimizing</span><br />
              Real output matters more than theoretical perfection.
            </li>
          </ul>
        </section>

        {/* REAL RECORDINGS */}
        <section className="mt-10 rounded-3xl border border-white/15 bg-white/[0.03] p-8 backdrop-blur">
          <h2 className="text-2xl font-semibold tracking-tight">Real recordings first</h2>

          <p className="mt-4 text-sm text-white/65 leading-relaxed">
            Many ambient tools rely entirely on generated audio.
            Soundscape does not.
          </p>

          <p className="mt-4 text-sm text-white/65 leading-relaxed">
            Real-world recordings — wind, water, fire, insects — carry imperfections that synthetic
            audio often removes. Those imperfections are part of what makes a soundscape feel believable.
          </p>

          <p className="mt-4 text-sm text-white/65 leading-relaxed">
            Soundscape curates reality instead of sterilizing it.
          </p>
        </section>

        {/* DETERMINISM */}
        <section className="mt-10 rounded-3xl border border-white/15 bg-white/[0.03] p-8 backdrop-blur">
          <h2 className="text-2xl font-semibold tracking-tight">Deterministic by design</h2>

          <p className="mt-4 text-sm text-white/65 leading-relaxed">
            When you generate a soundscape, the system produces a specific result — not a suggestion.
          </p>

          <p className="mt-4 text-sm text-white/65 leading-relaxed">
            Exports include a small recipe file that describes the mix.
            This makes soundscapes reproducible, debuggable, and stable over time.
          </p>
        </section>

        {/* WHAT IT IS NOT */}
        <section className="mt-10 rounded-3xl border border-white/15 bg-white/[0.03] p-8 backdrop-blur">
          <h2 className="text-2xl font-semibold tracking-tight">What Soundscape is not</h2>

          <ul className="mt-6 space-y-2 text-sm text-white/65">
            <li>• A DAW or music production tool</li>
            <li>• A generative music feed</li>
            <li>• A subscription platform</li>
            <li>• A social or content network</li>
            <li>• A constantly changing system</li>
          </ul>
        </section>

        {/* PRIVACY & GROWTH */}
        <section className="mt-10 rounded-3xl border border-white/15 bg-white/[0.03] p-8 backdrop-blur">
          <h2 className="text-2xl font-semibold tracking-tight">Privacy and growth</h2>

          <p className="mt-4 text-sm text-white/65 leading-relaxed">
            Soundscape does not track usage and does not require a traditional account.
            Purchases are linked to an email address so credits can always be restored.
          </p>

          <p className="mt-4 text-sm text-white/65 leading-relaxed">
            The asset library grows over time as new real-world recordings are added.
            Growth is intentional and curated, not algorithmic.
          </p>
        </section>

        {/* CLOSING */}
        <section className="mt-10 text-xs text-white/45">
          Soundscape is built to be boring to maintain and pleasant to use.<br />
          If that sounds like your kind of tool, you’re in the right place.
        </section>
      </div>
    </main>
  );
}
