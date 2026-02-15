'use client';

import { useEffect, useMemo, useState } from 'react';

const DISMISS_KEY = 'ss_mobile_notice_dismissed_v1';
// Optional: show again after N days instead of forever
const COOLDOWN_DAYS = 14;

function safeGet(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function isDismissedRecently() {
  const raw = safeGet(DISMISS_KEY);
  if (!raw) return false;

  // raw can be "1" from old version or a timestamp
  if (raw === '1') return true;

  const ts = Number(raw);
  if (!Number.isFinite(ts)) return false;

  const ms = COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
  return Date.now() - ts < ms;
}

function detectPlatform() {
  const ua = navigator.userAgent || '';
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    // iPadOS reports as Mac sometimes
    (navigator.platform === 'MacIntel' && (navigator as any).maxTouchPoints > 1);

  const isAndroid = /Android/.test(ua);
  return { isIOS, isAndroid };
}

export default function MobileNotice() {
  const [show, setShow] = useState(false);
  const [platform, setPlatform] = useState<{ isIOS: boolean; isAndroid: boolean }>({
    isIOS: false,
    isAndroid: false,
  });

  const storeLinks = useMemo(() => {
    return {
      android: 'https://play.google.com/store/apps/details?id=com.summitsight.soundscape',
      // TODO: replace with real App Store link once live
      ios: null as string | null,
    };
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');

    const update = () => {
      const dismissed = isDismissedRecently();
      setShow(mq.matches && !dismissed);
    };

    setPlatform(detectPlatform());
    update();

    mq.addEventListener?.('change', update);
    window.addEventListener('resize', update);

    return () => {
      mq.removeEventListener?.('change', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  if (!show) return null;

  const dismiss = () => {
    // store timestamp so you can respect cooldown
    safeSet(DISMISS_KEY, String(Date.now()));
    setShow(false);
  };

  const openApp = () => {
    // Optional deep link attempt. Replace with your actual scheme/universal link.
    // Example scheme: soundscape://
    // For now, just dismiss and send to store.
    dismiss();

    if (platform.isAndroid && storeLinks.android) {
      window.open(storeLinks.android, '_blank', 'noopener,noreferrer');
      return;
    }

    if (platform.isIOS && storeLinks.ios) {
      window.open(storeLinks.ios, '_blank', 'noopener,noreferrer');
      return;
    }
  };

  const primaryCta = platform.isIOS
    ? storeLinks.ios
      ? { label: 'Get the iOS app', href: storeLinks.ios }
      : { label: 'iOS app coming soon', href: null }
    : { label: 'Get the Android app', href: storeLinks.android };

  return (
    <div className="fixed inset-x-0 bottom-0 z-[9999] p-3">
      <div
        className="glass-panel mx-auto max-w-5xl rounded-2xl px-4 py-3 shadow-lg"
        role="dialog"
        aria-live="polite"
        aria-label="Mobile experience notice"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-sm font-medium">Better on the app</div>
            <div className="mt-1 text-xs text-muted">
              This website isn’t optimized for mobile yet. For the best experience, use the Soundscape app.
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              {primaryCta.href ? (
                <a
                  href={primaryCta.href}
                  className="btn-glass rounded-xl px-3 py-1.5 text-xs"
                  target="_blank"
                  rel="noreferrer"
                >
                  {primaryCta.label}
                </a>
              ) : (
                <button
                  type="button"
                  className="btn-glass rounded-xl px-3 py-1.5 text-xs opacity-60 cursor-not-allowed"
                  aria-disabled="true"
                >
                  {primaryCta.label}
                </button>
              )}

              <button onClick={openApp} className="btn-inset rounded-xl px-3 py-1.5 text-xs">
                Open app
              </button>

              <button onClick={dismiss} className="btn-inset rounded-xl px-3 py-1.5 text-xs">
                Dismiss
              </button>
            </div>
          </div>

          <button
            onClick={dismiss}
            className="text-faint text-sm leading-none"
            aria-label="Dismiss"
            title="Dismiss"
            type="button"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
