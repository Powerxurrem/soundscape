'use client';

import './globals.css';
import type { ReactNode } from 'react';

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-black text-white">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur">
          <div className="mx-auto max-w-5xl px-6 py-4">
            <nav className="flex items-center justify-between">
              <div className="flex items-center gap-6 text-sm font-medium">
                <a href="/" className="text-white hover:opacity-80">Home</a>
                <a href="/pricing" className="text-white/80 hover:text-white">Pricing</a>
                <a href="/about" className="text-white/80 hover:text-white">About</a>
                <a href="/trips" className="text-white/80 hover:text-white">Trips</a>
                <a href="/mixer" className="text-white/80 hover:text-white">Mixer</a>
                <a href="/autopilot" className="text-white/80 hover:text-white">Autopilot</a>
              </div>

            </nav>
          </div>
        </header>

        {/* Main */}
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}
