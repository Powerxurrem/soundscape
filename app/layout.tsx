import './globals.css';
import type { ReactNode } from 'react';

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header className="border-b px-6 py-4">
          <nav className="flex gap-6 text-sm font-medium">
            <a href="/" className="hover:underline">Home</a>
            <a href="/pricing" className="hover:underline">Pricing</a>
            <a href="/mixer" className="hover:underline">Mixer</a>
          </nav>
        </header>

        <main>
          {children}
        </main>
      </body>
    </html>
  );
}
