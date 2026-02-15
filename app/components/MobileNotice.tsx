'use client';

import { useEffect, useState } from 'react';

const DISMISS_KEY = 'ss_mobile_notice_dismissed_v1';

export default function MobileNotice() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only on small screens
    const mq = window.matchMedia('(max-width: 768px)');
    const dismissed = localStorage.getItem(DISMISS_KEY) === '1';

    const update = () => {
      const isMobile = mq.matches;
      const alreadyDismissed = localStorage.getItem(DISMISS_KEY) === '1';
      setShow(isMobile && !alreadyDismissed);
    };

    if (!dismissed) setShow(mq.matches);

    // Listen for orientation/resize
    mq.addEventListener?.('change', update);
    window.addEventListener('resize', update);

    return () => {
      mq.removeEventListener?.('change', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  if (!show) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setShow(false);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-[9999] p-3">
      <div className="glass-panel mx-auto max-w-5xl rounded-2xl px-4 py-3 shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-sm font-medium">Better on the app</div>
            <div className="mt-1 text-xs text-muted">
              This website isn’t optimized for mobile yet. For the best experience, use the Soundscape app.
            </div>
            <div className="mt-2 flex gap-2">
              <a
                href="https://play.google.com/store/apps/details?id=com.summitsight.soundscape"
                className="btn-glass rounded-xl px-3 py-1.5 text-xs"
                target="_blank"
                rel="noreferrer"
              >
                Get the Android app

              </a>
              <button
                onClick={dismiss}
                className="btn-inset rounded-xl px-3 py-1.5 text-xs"
              >
                Dismiss
              </button>
            </div>
          </div>

          <button
            onClick={dismiss}
            className="text-faint text-sm leading-none"
            aria-label="Dismiss"
            title="Dismiss"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
