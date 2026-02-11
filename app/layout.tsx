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
      <body className="bg-white/[0.06] text-app">
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
      url(/bg/cabin_2.jpg)
    `,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    filter: 'brightness(1.4) contrast(1) saturate(1.2)',
  }}
/>


<header className="glass-panel z-50 bg-white/[0.04] shadow-[0_1px_0_rgba(255,255,255,0.06)]">
  <div className="mx-auto max-w-5xl px-6 py-4">
    <nav className="flex items-center justify-between">
      <div className="flex items-center gap-6 text-sm font-medium">
        <a href="/" className="nav-link text-white">Home</a>
        <a href="/mixer" className="nav-link">Mixer</a>
        <a href="/autopilot" className="nav-link">Autopilot</a>
        <a href="/pricing" className="nav-link">Pricing</a>
        <a href="/about" className="nav-link">About</a>
        <a href="/terms" className="nav-link">Terms</a>
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

