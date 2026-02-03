"use client";

import { useMemo } from "react";

export function Sparkles({
  seed = "default",
  count = 40,
  className = "",
}: {
  seed?: string;
  count?: number;
  className?: string;
}) {
  const points = useMemo(() => {
    // deterministic PRNG from seed
    let s = 0;
    for (let i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) >>> 0;
    const rand = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);

    return Array.from({ length: count }).map(() => ({
      x: rand() * 100,
      y: rand() * 100,
      r: 0.6 + rand() * 1.2,
      d: 2 + rand() * 6,
      delay: rand() * 3,
      a: 0.35 + rand() * 0.65,
    }));
  }, [seed, count]);

  return (
    <svg
      className={`pointer-events-none absolute inset-0 ${className}`}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
    >
      {points.map((p, i) => (
        <circle
          key={i}
          className="sparkle"
          cx={p.x}
          cy={p.y}
          r={p.r}
          fill="white"
          style={{
            opacity: `calc(var(--sparkle-opacity) * ${p.a})`,
            animation: `sparkle-twinkle ${p.d}s ease-in-out ${p.delay}s infinite`,
            filter: `blur(var(--sparkle-blur))`,
          }}
        />
      ))}
    </svg>
  );
}
