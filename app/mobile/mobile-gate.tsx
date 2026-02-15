'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

function detectPlatform() {
  const ua = navigator.userAgent || '';
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && (navigator as any).maxTouchPoints > 1);
  const isAndroid = /Android/.test(ua);
  return { isIOS, isAndroid };
}

// Try to open app, then fallback if it didn’t open.
// NOTE: This is best-effort. Universal links are the most reliable solution.
function attemptOpenApp({
  deepLink,
  fallbackUrl,
  timeoutMs = 900,
}: {
  deepLink: string;
  fallbackUrl: string;
  timeoutMs?: number;
}) {
  const start = Date.now();

  // If the page is hidden quickly, likely the app opened
  const onVis = () => {
    // If user switched away quickly, we assume success and do nothing.
    // If not, fallback triggers below.
  };

  document.addEventListener('visibilitychange', onVis);

  // Attempt open
  window.location.href = deepLink;

  // Fallback after timeout if still here
  setTimeout(() => {
    document.removeEventListener('visibilitychange', onVis);

    // If the page is still visible and enough time passed, go to fallback
    const stillHere = document.visibilityState === 'visible';
    const elapsed = Date.now() - start;
    if (stillHere && elapsed >= timeoutMs) {
      window.location.href = fallbackUrl;
    }
  }, timeoutMs);
}

export default function MobileGate() {
  const sp = useSearchParams();
  const from = sp.get('from') || '/';
  const [platform, setPlatform] = useState({ isIOS: false, isAndroid: false });
  const [autoTried, setAutoTried] = useState(false);

  const links = useMemo(() => {
    // ✅ Replace these with your real links
    const ANDROID_STORE =
      'https://play.google.com/store/apps/details?id=com.summitsight.soundscape';

    // If you have a TestFlight public link, put it here.
    // Otherwise keep null and show “iOS in review”.
    const IOS_TESTFLIGHT: string | null = null;

    // Best: universal link like https://soundscape.app/open (configured on iOS + Android)
    // If you don't have one yet, scheme links can still work but less reliably.
    const DEEP_LINK_IOS = 'soundscape://open';
    const DEEP_LINK_ANDROID = 'soundscape://open';

    return {
      ANDROID_STORE,
      IOS_TESTFLIGHT,
      DEEP_LINK_IOS,
      DEEP_LINK_ANDROID,
    };
  }, []);

  useEffect(() => {
    setPlatform(detectPlatform());
  }, []);

  useEffect(() => {
    // Auto-redirect attempt once on mount
    if (autoTried) return;

    // Only auto-try if we're actually on mobile platform
    if (!platform.isAndroid && !platform.isIOS) return;

    setAutoTried(true);

    if (platform.isAndroid) {
      attemptOpenApp({
        deepLink: links.DEEP_LINK_ANDROID,
        fallbackUrl: links.ANDROID_STORE,
      });
      return;
    }

    if (platform.isIOS) {
      // If you have TestFlight, fallback there; otherwise just don't auto-jump to nowhere.
      if (links.IOS_TESTFLIGHT) {
        attemptOpenApp({
          deepLink: links.DEEP_LINK_IOS,
          fallbackUrl: links.IOS_TESTFLIGHT,
        });
      }
    }
  }, [platform, autoTried, links]);

  const continueToWeb = () => {
    // bypass gate
    window.location.href = `${from}?desktop=1`;
  };

  return (
    <div className="glass-panel w-full max-w-xl rounded-2xl p-6 shadow-lg">
      <div className="text-lg font-semibold">Open Soundscape</div>
      <div className="mt-2 text-sm text-muted">
        For the best mobile experience, use the Soundscape app.
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <a
          className="btn-glass rounded-xl px-4 py-2 text-sm text-center"
          href={links.ANDROID_STORE}
          target="_blank"
          rel="noreferrer"
        >
          Get Android app
        </a>

        {links.IOS_TESTFLIGHT ? (
          <a
            className="btn-glass rounded-xl px-4 py-2 text-sm text-center"
            href={links.IOS_TESTFLIGHT}
            target="_blank"
            rel="noreferrer"
          >
            Get iOS (TestFlight)
          </a>
        ) : (
          <button
            className="btn-glass rounded-xl px-4 py-2 text-sm text-center opacity-60 cursor-not-allowed"
            aria-disabled="true"
            type="button"
          >
            iOS is in review — coming soon
          </button>
        )}

        <button
          className="btn-inset rounded-xl px-4 py-2 text-sm"
          onClick={() => {
            if (platform.isAndroid) {
              attemptOpenApp({
                deepLink: links.DEEP_LINK_ANDROID,
                fallbackUrl: links.ANDROID_STORE,
              });
              return;
            }
            if (platform.isIOS && links.IOS_TESTFLIGHT) {
              attemptOpenApp({
                deepLink: links.DEEP_LINK_IOS,
                fallbackUrl: links.IOS_TESTFLIGHT,
              });
            }
          }}
          type="button"
        >
          Open app
        </button>

        <button
          className="text-sm underline opacity-80 hover:opacity-100"
          onClick={continueToWeb}
          type="button"
        >
          Continue to website
        </button>
      </div>

      <div className="mt-4 text-xs text-muted">
        Tip: If “Open app” doesn’t work, install the app first — then retry.
      </div>
    </div>
  );
}
