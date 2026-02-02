import './globals.css';
import type { ReactNode } from 'react';


export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-white/[0.06] text-white/80">
        {/* ===== Global background layers ===== */}
        {/* Aurora background */}
<div
  aria-hidden
  className="fixed inset-0 -z-10"
  style={{
    backgroundImage: `
      radial-gradient(
        ellipse at top,
        rgba(0,0,0,0.35),
        rgba(0,0,0,0.45)
      ),
      url(/bg/aurora_wide_converted.jpg)
    `,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    filter: 'brightness(0.8) contrast(1) saturate(1.3)',
  }}
/>


        {/* ===== Header ===== */}
        <header className="sticky top-0 z-50 bg-white/[0.04] backdrop-blur-md shadow-[0_1px_0_rgba(255,255,255,0.06)]">

          <div className="mx-auto max-w-5xl px-6 py-4">
            <nav className="flex items-center justify-between">
              <div className="flex items-center gap-6 text-sm font-medium">
                <a href="/" className="text-white hover:opacity-80">Home</a>
                <a href="/pricing" className="text-white/80 hover:text-white">Pricing</a>
                <a href="/about" className="text-white/80 hover:text-white">About</a>
                <a href="/trips" className="text-white/80 hover:text-white">Trips</a>
                <a href="/mixer" className="text-white/80 hover:text-white">Mixer</a>
                <a href="/autopilot" className="text-white/80 hover:text-white">Autopilot</a>
                <a href="/terms" className="text-white/80 hover:text-white">Terms</a>
              </div>
            </nav>
          </div>
        </header>

        {/* ===== Main ===== */}
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}
