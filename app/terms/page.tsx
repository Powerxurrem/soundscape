// app/terms/page.tsx
import React from "react";

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

export const metadata = {
  title: "Terms & Conditions — Soundscape",
  robots: { index: false, follow: false }, // stays private beta-friendly
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-transparent text-zinc-100">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.08),rgba(0,0,0,0)_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(255,255,255,0.04),rgba(0,0,0,0)_55%)]" />
      </div>

      <div className="mx-auto w-full max-w-4xl px-6 py-12">
        <section
          className={cx(
            "rounded-[28px] border border-white/15151510 bg-white/[0.04] backdrop-blur-xl",
            "shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_30px_120px_rgba(0,0,0,0.9)]",
            "p-8 md:p-10"
          )}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15151510 bg-white/5 px-3 py-1 text-xs text-zinc-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
            <span>Private beta • Legal</span>
          </div>

          <h1 className="mt-5 text-3xl font-semibold tracking-tight md:text-4xl">
            Terms &amp; Conditions
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Last updated: <span className="text-zinc-300">[02.2026]</span>
          </p>

          <div className="mt-8 space-y-8 text-sm leading-relaxed text-zinc-300">
            <p>
              These Terms &amp; Conditions (“Terms”) govern your access to and use of{" "}
              <span className="text-zinc-100">Soundscape</span> (“Soundscape”, “we”, “us”, “our”),
              available at soundscape.run (the “Service”).
            </p>

            <p>By accessing or using the Service, you agree to these Terms.</p>

            <Section title="1. Definitions">
              <ul className="mt-3 list-disc space-y-2 pl-5 text-zinc-300">
                <li>
                  <b className="text-zinc-100">Service</b>: The Soundscape website, mixer, and
                  related features.
                </li>
                <li>
                  <b className="text-zinc-100">Assets</b>: Audio recordings owned and provided by
                  Soundscape.
                </li>
                <li>
                  <b className="text-zinc-100">Export</b>: Audio files rendered through the
                  Service.
                </li>
                <li>
                  <b className="text-zinc-100">Credits</b>: Units used to export audio (1 credit =
                  5 minutes of export).
                </li>
                <li>
                  <b className="text-zinc-100">User</b>: Any individual or entity using the
                  Service.
                </li>
              </ul>
            </Section>

            <Section title="2. License Grant (Exports)">
              <p>
                When you export audio using Soundscape, we grant you a{" "}
                <b className="text-zinc-100">non-exclusive, perpetual, worldwide license</b> to use
                the exported audio for <b className="text-zinc-100">commercial and non-commercial</b>{" "}
                purposes, including but not limited to:
              </p>

              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>videos (including YouTube)</li>
                <li>games</li>
                <li>applications</li>
                <li>podcasts</li>
                <li>client or commissioned work</li>
              </ul>

              <p className="mt-3">No attribution is required.</p>

              <p className="mt-3">
                This license applies <b className="text-zinc-100">only to exported audio</b>, not to
                the underlying Assets or the Service itself.
              </p>
            </Section>

            <Section title="3. Restrictions">
              <p>You may not:</p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>resell, redistribute, or share exported audio as a sound library or stock asset</li>
                <li>sublicense or transfer the exported audio on a standalone basis</li>
                <li>offer competing sound libraries, ambient mixers, or similar services using exported audio</li>
                <li>
                  register exported audio with <b className="text-zinc-100">YouTube Content ID</b>{" "}
                  or any other audio fingerprinting or rights-management system
                </li>
                <li>claim ownership or exclusivity over exported audio</li>
              </ul>

              <p className="mt-3">
                Violation of these restrictions may result in termination of access and revocation
                of licenses.
              </p>
            </Section>

            <Section title="4. Deterministic Outputs & Non-Exclusivity">
              <p>Soundscape uses deterministic systems. As a result:</p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>identical or similar exports may be generated by different users</li>
                <li>no exclusivity is granted for any export</li>
                <li>this behavior is intentional and expected</li>
              </ul>
              <p className="mt-3">
                Each user receives the same non-exclusive license regardless of similarity between
                exports.
              </p>
            </Section>

            <Section title="5. Ownership">
              <p>
                All Assets, recordings, and rendered audio are{" "}
                <b className="text-zinc-100">owned by Soundscape</b>.
              </p>
              <p className="mt-3">
                Users receive a <b className="text-zinc-100">license to use exported audio</b>, not
                ownership or authorship rights.
              </p>
              <p className="mt-3">
                Soundscape retains the right to resolve disputes, including false copyright or
                Content ID claims involving exported audio.
              </p>
            </Section>

            <Section title="6. Credits, Payments & Refunds">
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>Credits are required to export audio.</li>
                <li>1 credit equals 5 minutes of exported audio.</li>
                <li>Credits do not expire.</li>
                <li>
                  <b className="text-zinc-100">All purchases are final. No refunds are provided</b>,
                  including after export.
                </li>
                <li>Prices and credit packs may change for future purchases.</li>
              </ul>
            </Section>

            <Section title="7. Beta Status & Availability">
              <p>Soundscape is currently provided in a private beta.</p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>The Service is provided “as is” and “as available”.</li>
                <li>Features, behavior, or availability may change at any time.</li>
                <li>We do not guarantee uptime, continuity, or error-free operation.</li>
                <li>Access may be limited or revoked at our discretion.</li>
              </ul>
            </Section>

            <Section title="8. Termination">
              <p>
                We reserve the right to suspend or terminate access to the Service if these Terms
                are violated.
              </p>
              <p className="mt-3">Upon termination:</p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>licenses granted under these Terms may be revoked</li>
                <li>misuse of exported audio may invalidate granted rights</li>
              </ul>
            </Section>

            <Section title="9. Limitation of Liability">
              <p>To the maximum extent permitted by law:</p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>Soundscape is not liable for indirect, incidental, or consequential damages</li>
                <li>total liability shall not exceed the amount paid by the user to Soundscape</li>
              </ul>
            </Section>

            <Section title="10. Governing Law">
              <p>
                These Terms are governed by and construed in accordance with the{" "}
                <b className="text-zinc-100">laws of the Netherlands</b>, without regard to conflict
                of law principles.
              </p>
            </Section>

            <Section title="11. Contact">
              <p>
                For questions regarding these Terms or licensing, contact:{" "}
                <b className="text-zinc-100">summit-sight@hotmail.com</b>
              </p>
            </Section>

            <div className="pt-2 text-xs text-zinc-500">
              Tip: Link this page in your footer as <span className="text-zinc-300">/terms</span>.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/15151510 bg-black/30 p-6 backdrop-blur-xl">
      <h2 className="text-base font-semibold text-zinc-100">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}
