warning: in the working copy of 'app/globals.css', LF will be replaced by CRLF the next time Git touches it
[1mdiff --git a/app/components/sparkles.tsx b/app/components/sparkles.tsx[m
[1mdeleted file mode 100644[m
[1mindex bac9de6..0000000[m
[1m--- a/app/components/sparkles.tsx[m
[1m+++ /dev/null[m
[36m@@ -1,54 +0,0 @@[m
[31m-"use client";[m
[31m-[m
[31m-import { useMemo } from "react";[m
[31m-[m
[31m-export function Sparkles({[m
[31m-  seed = "default",[m
[31m-  count = 40,[m
[31m-  className = "",[m
[31m-}: {[m
[31m-  seed?: string;[m
[31m-  count?: number;[m
[31m-  className?: string;[m
[31m-}) {[m
[31m-  const points = useMemo(() => {[m
[31m-    // deterministic PRNG from seed[m
[31m-    let s = 0;[m
[31m-    for (let i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) >>> 0;[m
[31m-    const rand = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);[m
[31m-[m
[31m-    return Array.from({ length: count }).map(() => ({[m
[31m-      x: rand() * 100,[m
[31m-      y: rand() * 100,[m
[31m-      r: 0.6 + rand() * 1.2,[m
[31m-      d: 2 + rand() * 6,[m
[31m-      delay: rand() * 3,[m
[31m-      a: 0.35 + rand() * 0.65,[m
[31m-    }));[m
[31m-  }, [seed, count]);[m
[31m-[m
[31m-  return ([m
[31m-    <svg[m
[31m-      className={`pointer-events-none absolute inset-0 ${className}`}[m
[31m-      viewBox="0 0 100 100"[m
[31m-      preserveAspectRatio="none"[m
[31m-      aria-hidden[m
[31m-    >[m
[31m-      {points.map((p, i) => ([m
[31m-        <circle[m
[31m-          key={i}[m
[31m-          className="sparkle"[m
[31m-          cx={p.x}[m
[31m-          cy={p.y}[m
[31m-          r={p.r}[m
[31m-          fill="white"[m
[31m-          style={{[m
[31m-            opacity: `calc(var(--sparkle-opacity) * ${p.a})`,[m
[31m-            animation: `sparkle-twinkle ${p.d}s ease-in-out ${p.delay}s infinite`,[m
[31m-            filter: `blur(var(--sparkle-blur))`,[m
[31m-          }}[m
[31m-        />[m
[31m-      ))}[m
[31m-    </svg>[m
[31m-  );[m
[31m-}[m
[1mdiff --git a/app/globals.css b/app/globals.css[m
[1mindex d00047a..58490c1 100644[m
[1m--- a/app/globals.css[m
[1m+++ b/app/globals.css[m
[36m@@ -7,89 +7,65 @@[m
 :root {[m
   --background: #ffffff;[m
   --foreground: #171717;[m
[31m-}[m
[31m-[m
[31m-@theme inline {[m
[31m-  --color-background: var(--background);[m
[31m-  --color-foreground: var(--foreground);[m
[31m-  --font-sans: var(--font-geist-sans);[m
[31m-  --font-mono: var(--font-geist-mono);[m
[31m-}[m
[31m-[m
[31m-@media (prefers-color-scheme: dark) {[m
[31m-  :root {[m
[31m-    --background: #0a0a0a;[m
[31m-    --foreground: #ededed;[m
[31m-  }[m
[31m-}[m
 [m
[31m-/* -------------------------------------------------------[m
[31m-   SPARKLES (separate visual system — NOT glass)[m
[31m--------------------------------------------------------- */[m
[32m+[m[32m  /* -----------------------------------------------------[m
[32m+[m[32m     SPARKLES (separate visual system — NOT glass)[m
[32m+[m[32m  ------------------------------------------------------ */[m
 [m
[31m-:root {[m
[31m-  /* twinkle timing knobs (used by Sparkles.tsx style=animation) */[m
[32m+[m[32m  /* twinkle timing knobs (used by Sparkles.tsx) */[m
   --sparkle-twinkle-min: 2s;[m
   --sparkle-twinkle-step: 0.6s;[m
 [m
   /* visual knobs */[m
   --sparkle-opacity: 0.10;[m
[31m-  --sparkle-size-min: 0.6px;[m
[31m-  --sparkle-size-max: 1.8px;[m
[31m-  --sparkle-blur: 0.6px;[m
[31m-}[m
[32m+[m[32m  --sparkle-size-min: 0.4px;[m
[32m+[m[32m  --sparkle-size-max: 1.2px;[m
[32m+[m[32m  --sparkle-blur: 0.35px;[m
 [m
[31m-/* -------------------------------------------------------[m
[31m-   GLASS / UI TOKENS (Soundscape)[m
[31m--------------------------------------------------------- */[m
[32m+[m[32m  /* -----------------------------------------------------[m
[32m+[m[32m     GOLD ACCENT (borders + optional sparkle tint)[m
[32m+[m[32m  ------------------------------------------------------ */[m
 [m
[31m-:root {[m
[31m-  /* --------------------[m
[31m-     Glass optics knobs[m
[31m-  -------------------- */[m
[32m+[m[32m  --gold-rgb: 235 190 90;[m
[32m+[m
[32m+[m[32m  /* -----------------------------------------------------[m
[32m+[m[32m     GLASS / UI TOKENS (Soundscape)[m
[32m+[m[32m  ------------------------------------------------------ */[m
 [m
   /* keep the pipeline intact; set to 0px to "disable" blur */[m
   --glass-blur: 0px;[m
 [m
   /* base glass tint (R G B) */[m
[31m-  --glass-rgb: 120 88 170;[m
[32m+[m[32m  --glass-rgb: 16 12 26;[m
 [m
   /* optics */[m
[31m-  --glass-saturate: 1; /* 1 = neutral, >1 richer */[m
[31m-  --glass-contrast: 1; /* 1 = neutral, >1 crisper */[m
[32m+[m[32m  --glass-saturate: 1;[m
[32m+[m[32m  --glass-contrast: 1;[m
 [m
   /* master transparency multiplier */[m
[31m-  --glass-alpha: 1;[m
[31m-[m
[31m-  /* --------------------[m
[31m-     Borders (tiered)[m
[31m-  -------------------- */[m
[31m-  --glass-border-strong: rgb(255 255 255 / 0.5);[m
[31m-  --glass-border-medium: rgb(255 255 255 / 0.5);[m
[31m-  --glass-border-soft: rgb(255 255 255 / 0.5);[m
[31m-[m
[31m-  /* --------------------[m
[31m-     Per-tier base alpha (before master multiplier)[m
[31m-  -------------------- */[m
[31m-  --glass-fill-big-a: 0.10;[m
[31m-  --glass-fill-section-a: 0.05;[m
[31m-  --glass-fill-mini-a: 0.05;[m
[31m-  --glass-fill-inset-a: 0.01;[m
[31m-  --glass-fill-field-a: 0.01;[m
[32m+[m[32m  --glass-alpha: 2;[m
[32m+[m
[32m+[m[32m  /* borders (gold) */[m
[32m+[m[32m  --glass-border-strong: rgb(var(--gold-rgb) / 0.45);[m
[32m+[m[32m  --glass-border-medium: rgb(var(--gold-rgb) / 0.32);[m
[32m+[m[32m  --glass-border-soft: rgb(var(--gold-rgb) / 0.24);[m
[32m+[m
[32m+[m[32m  /* per-tier base alpha (before master multiplier) */[m
[32m+[m[32m  --glass-fill-big-a: 0.28;[m
[32m+[m[32m  --glass-fill-section-a: 0.2;[m
[32m+[m[32m  --glass-fill-mini-a: 0.2;[m
[32m+[m[32m  --glass-fill-inset-a: 0.2;[m
[32m+[m[32m  --glass-fill-field-a: 0.2;[m
 [m
   /* derived fills (color × transparency) */[m
[31m-  --glass-fill-big: rgb(var(--glass-rgb) / calc(var(--glass-fill-big-a) * var(--glass-alpha)));[m
[32m+[m[32m  --glass-fill-big: rgb(var(--glass-rgb-big) / calc(var(--glass-fill-big-a) * var(--glass-alpha)));[m
   --glass-fill-section: rgb(var(--glass-rgb) / calc(var(--glass-fill-section-a) * var(--glass-alpha)));[m
   --glass-fill-mini: rgb(var(--glass-rgb) / calc(var(--glass-fill-mini-a) * var(--glass-alpha)));[m
   --glass-fill-inset: rgb(var(--glass-rgb) / calc(var(--glass-fill-inset-a) * var(--glass-alpha)));[m
   --glass-fill-field: rgb(var(--glass-rgb) / calc(var(--glass-fill-field-a) * var(--glass-alpha)));[m
 [m
[31m-  /* --------------------[m
[31m-     Glass state overlays (for hover/active/press)[m
[31m-     Purpose: replace bg-white/.. and hover:bg-.. inside glass UI[m
[31m-     These are OVERLAYS (stack on top of the glass fill).[m
[31m-  -------------------- */[m
[31m-  --glass-state-rgb: 255 255 255; /* highlight tint (white) */[m
[32m+[m[32m  /* state overlays (stack on top of existing fill) */[m
[32m+[m[32m  --glass-state-rgb: 255 255 255;[m
   --glass-hover-a: 0.06;[m
   --glass-active-a: 0.10;[m
   --glass-press-a: 0.14;[m
[36m@@ -98,17 +74,28 @@[m
   --glass-overlay-active: rgb(var(--glass-state-rgb) / var(--glass-active-a));[m
   --glass-overlay-press: rgb(var(--glass-state-rgb) / var(--glass-press-a));[m
 [m
[31m-  /* --------------------[m
[31m-     Text tokens[m
[31m-  -------------------- */[m
[31m-  --text-rgb: 210 245 230;[m
[31m-[m
[32m+[m[32m  /* text */[m
[32m+[m[32m  --text-rgb: 235 190 90 ;[m
   --text-strong: rgb(var(--text-rgb) / 1);[m
   --text: rgb(var(--text-rgb) / 0.92);[m
   --text-muted: rgb(var(--text-rgb) / 0.72);[m
   --text-faint: rgb(var(--text-rgb) / 0.52);[m
 }[m
 [m
[32m+[m[32m@theme inli