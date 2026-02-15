import { Suspense } from 'react';
import MobileGate from './mobile-gate';

export const dynamic = 'force-dynamic'; // avoids static prerender headaches

export default function MobilePage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <Suspense fallback={<div className="text-sm opacity-70">Opening Soundscape…</div>}>
        <MobileGate />
      </Suspense>
    </main>
  );
}
