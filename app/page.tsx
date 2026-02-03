'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createAudioEngine, type AudioEngine } from './mixer/audio/audioengine';
import { Sparkles } from "@/components/Sparkles";


type DemoTrack = {
  id: string;
  libraryId: string;
  name: string;
  type: 'loop';
  assetId: string;
  volume: number; // 0..1
};

function clamp01(v: number) {
  if (Number.isNaN(v)) return 0;
  return Math.max(0, Math.min(1, v));
}

function assetUrlFor(track: { type: 'loop'; libraryId: string }, assetId: string) {
  return `/assets/loops/${track.libraryId}/${assetId}.mp3`;
}

export default function Home() {
  const audioRef = useRef<AudioEngine | null>(null);

  const [isOn, setIsOn] = useState(false);
  const [masterVol, setMasterVol] = useState(0.82);

  const tracks: DemoTrack[] = useMemo(
    () => [
      {
        id: 'demo_rain',
        libraryId: 'rain',
        name: 'Rain',
        type: 'loop',
        assetId: 'rain_soft_loop_01',
        volume: 0.46,
      },
      {
        id: 'demo_fire',
        libraryId: 'fireplace',
        name: 'Fireplace',
        type: 'loop',
        assetId: 'fireplace_cozy_loop_01',
        volume: 0.56,
      },
    ],
    []
  );

  useEffect(() => {
    return () => {
      audioRef.current?.stopAll();
    };
  }, []);

  async function startDemo() {
    if (!audioRef.current) audioRef.current = createAudioEngine();
    await audioRef.current.activate();
    audioRef.current.setMaster(masterVol);
    await audioRef.current.syncMix(tracks as any, (t: any, id: string) => assetUrlFor(t, id));
    setIsOn(true);
  }

  function stopDemo() {
    audioRef.current?.stopAll();
    setIsOn(false);
  }

  useEffect(() => {
    audioRef.current?.setMaster(masterVol);
  }, [masterVol]);

  const rainPath = assetUrlFor({ type: 'loop', libraryId: 'rain' }, 'rain_soft_loop_01');
  const firePath = assetUrlFor({ type: 'loop', libraryId: 'fireplace' }, 'fireplace_cozy_loop_01');

  return (
    <main className="min-h-screen bg-transparent text-strong">
      {/* background glow */}
      <div className="pointer-events-none fixed inset-0 opacity-10">
        <div className="absolute -top-24 left-1/2 h-[420px] w-[820px] -translate-x-1/2 blur-3xl" />

      </div>

      <div className="relative mx-auto max-w-5xl px-6 py-14">
{/* HERO */}
<section className="glass-surface elev-3 relative overflow-hidden rounded-3xl p-8">
  {/* Sparkles behind content */}
  <div className="pointer-events-none absolute inset-0 z-0">
    <Sparkles seed="home-hero" count={22} />
  </div>

  {/* Content */}
  <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
    <div className="max-w-2xl">
      <div className="pill-glass inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs text-app">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400/90" />
        Engine stable • Assets deterministic
      </div>

      <h1 className="mt-4 text-4xl font-semibold tracking-tight">Soundscape</h1>
      <p className="mt-3 text-sm leading-relaxed text-app">
        Calm, realistic ambient soundscapes — built to be deterministic &amp; offline-friendly.
      </p>

      <div className="mt-6 flex flex-wrap gap-4">
        <a href="/autopilot" className="btn-glass rounded-xl px-4 py-2 text-sm">
          Start Autopilot
        </a>
        <a href="/mixer" className="btn-glass rounded-xl px-4 py-2 text-sm">
          Open Mixer
        </a>
      </div>
    </div>

    <div className="w-full md:w-[320px]">
      <div className="glass-panel rounded-2xl p-4">
        <div className="text-sm font-medium">What you get</div>

        <div className="mt-3 space-y-2 text-sm text-app">
          <div className="flex gap-2">
            <span className="text-faint">•</span>
            <span>Real recordings first</span>
          </div>
          <div className="flex gap-2">
            <span className="text-faint">•</span>
            <span>Deterministic mixes (recipe export)</span>
          </div>
          <div className="flex gap-2">
            <span className="text-faint">•</span>
            <span>Offline &amp; private</span>
          </div>
        </div>

        <div className="glass-panel mt-3 rounded-xl px-3 py-2 text-[11px] text-muted">
          Export includes WAV + deterministic recipe. Commercial use license included.
        </div>
      </div>
    </div>
  </div>
</section>


        {/* DEMO */}
        <section className="glass-surface elev-3 mt-10 rounded-3xl p-8 ,0_40px_120">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Demo</h2>
              <p className="mt-2 text-sm text-muted">Rain + Fireplace. One click. No setup.</p>
            </div>

            <div className="glass-panel mt-3 rounded-xl px-3 py-2 text-[11px] text-muted">
              {!isOn ? (
                <button
                  onClick={startDemo}
                  className="btn-inset"
                >
                  Play
                </button>
              ) : (
                <button
                  onClick={stopDemo}
                  className="btn-inset"
                >
                  Stop
                </button>
              )}
            </div>
          </div>

          <div className="mt-7 grid gap-5 lg:grid-cols-3">
            {/* now playing */}
            <div className="glass-panel lg:col-span-2 rounded-2xl p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium">Now Playing</div>
                    <span className="text-xs">{isOn ? '🟢' : '⚪'}</span>
                  </div>
                  <div className="mt-1 text-xs text-muted">
                    {isOn ? 'Rain + Fireplace running.' : 'Press Play to start the demo.'}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-faint">Volume</span>
                  <input
                    type="range"
                    className="w-44 accent-white"
                    min={0}
                    max={1}
                    step={0.01}
                    value={masterVol}
                    onChange={(e) => setMasterVol(clamp01(Number(e.target.value)))}
                  />
                </div>
              </div>

              <div className="glass-panel mt-4 rounded-xl p-4 text-xs text-muted">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-app">Sources</span>
                  <span className="text-faint">locked asset paths</span>
                </div>

                <div className="mt-3 space-y-2">
                  <div className="flex gap-2">
                    <span className="text-muted">•</span>
                    <span className="min-w-[80px] text-app">Rain</span>
                    <span className="truncate">{rainPath}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-muted">•</span>
                    <span className="min-w-[80px] text-app">Fireplace</span>
                    <span className="truncate">{firePath}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* guarantees */}
            <div className="glass-panel rounded-2xl p-5">
              <div className="text-sm font-medium">Guarantees</div>
              <div className="mt-1 text-xs text-faint">How Soundscape behaves — every time.</div>

              <div className="glass-panel mt-4 divide-y divide-white/10 overflow-hidden rounded-xl">
                <div className="p-4">
                  <div className="text-sm font-medium">Deterministic exports</div>
                  <div className="mt-1 text-xs text-muted">Same inputs → same WAV + recipe.</div>
                </div>

                <div className="p-4">
                  <div className="text-sm font-medium">No account required</div>
                  <div className="mt-1 text-xs text-muted">Runs without signup. No analytics.</div>
                </div>

                <div className="p-4">
                  <div className="text-sm font-medium">Transparent sourcing</div>
                  <div className="mt-1 text-xs text-muted">Trips shows what’s recorded vs generated.</div>
                  <a
                    href="/trips"
                    className="mt-3 inline-flex items-center gap-2 text-xs text-muted hover:text-white"
                  >
                    View Trips
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 text-xs text-faint"></div>
        </section>
      </div>
    </main>
  );
}


