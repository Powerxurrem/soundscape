import { Metadata } from 'next';
import MobileGate from './mobile-gate';

export const metadata: Metadata = {
  title: 'Open Soundscape',
  robots: { index: false, follow: false },
};

export default function MobilePage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <MobileGate />
    </main>
  );
}
