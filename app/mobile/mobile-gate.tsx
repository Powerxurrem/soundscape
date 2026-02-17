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

  const onVis = () => {
    // If user switched away quickly, we assume success and do nothing.
  };

  document.addEventListener('visibilitychange', onVis);

  // Attempt open
  window.location.href = deepLink;

  // Fallback after timeout if still here
  setTimeout(() => {
    document.removeEventListener('visibilitychange', onVis);

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
    const ANDROID_STORE =
      'https://play.google.com/store/apps/details?id=com.summitsight.soundscape';

    const IOS_STORE = 'https://apps.apple.com/app/id6759100910';

    // If you have universal links later, replace these with https://yourdomain/open
    const DEEP_LINK_IOS = 'soundscape://open';
    const DEEP_LINK_ANDROID = 'soundscape://open';

    return {
      ANDROID_STORE,
      IOS_STORE,
      DEEP_LINK_IOS,
      DEEP_LINK_ANDROID,
    };
  }, []);

  useEffect(() => {
    setPlatform(detectPlatform());
  }, []);

  useEffect(() => {
    if (autoTried) return;
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
      attemptOpenApp({
        deepLink: links.DEEP_LINK_IOS,
        fallbackUrl: links.IOS_STORE,
      });
    }
  }, [platform, autoTried, links]);

  const continueToWeb = () => {
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

        <a
          className="btn-glass rounded-xl px-4 py-2 text-sm text-center"
          href={links.IOS_STORE}
          target="_blank"
          rel="noreferrer"
        >
          Get iOS app
        </a>

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
            if (platform.isIOS) {
              attemptOpenApp({
                deepLink: links.DEEP_LINK_IOS,
                fallbackUrl: links.IOS_STORE,
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
