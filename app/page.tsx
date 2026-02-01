'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createAudioEngine, type AudioEngine } from './mixer/audio/audioengine';

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
    <main className="min-h-screen bg-transparent text-zinc-100">
      {/* background glow */}
      <div className="pointer-events-none fixed inset-0 opacity-10">
        <div className="absolute -top-24 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-white/7 blur-3xl" />
        <div className="absolute top-[35%] left-[10%] h-[360px] w-[360px] rounded-full bg-white/5 blur-3xl" />
        <div className="absolute top-[55%] right-[12%] h-[420px] w-[420px] rounded-full bg-white/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl px-6 py-14">
        {/* HERO */}
        <section className="rounded-3xl border border-white/50 bg-white/[0.03] p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_40px_120px_rgba(0,0,0,0.65)] backdrop-blur-md">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/[0.04] px-3 py-1 text-xs text-white/50">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400/90" />
                Engine stable • Assets deterministic
              </div>

              <h1 className="mt-4 text-4xl font-semibold tracking-tight">Soundscape</h1>
              <p className="mt-3 text-sm leading-relaxed text-white/65">
                Calm, realistic ambient soundscapes — built to be deterministic, offline-friendly,
                and boring to maintain.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="/autopilot"
                  className="rounded-xl border border-white/50 bg-white/25 px-5 py-2.5 text-sm hover:bg-white/15"
                >
                  Start Autopilot
                </a>
                <a
                  href="/mixer"
                  className="rounded-xl border border-white/50 bg-white/[0.25] px-5 py-2.5 text-sm hover:bg-white/[0.06]"
                >
                  Open Mixer
                </a>
              </div>
            </div>

            <div className="w-full md:w-[320px]">
              <div className="rounded-2xl border border-white/50 bg-white/[0.02] p-4">
                <div className="text-sm font-medium">Quick paths</div>
                <div className="mt-3 grid gap-2 text-sm">
                  <a
                    href="/autopilot"
                    className="rounded-xl border border-white/50 bg-white/[0.02] px-4 py-2 hover:bg-white/[0.06]"
                  >
                    → Autopilot (one-click)
                  </a>
                  <a
                    href="/mixer"
                    className="rounded-xl border border-white/50 bg-white/[0.02] px-4 py-2 hover:bg-white/[0.06]"
                  >
                    → Mixer (manual control)
                  </a>
                  <a
                    href="/pricing"
                    className="rounded-xl border border-white/50 bg-white/[0.02] px-4 py-2 hover:bg-white/[0.06]"
                  >
                    → Pricing
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* DEMO */}
        <section className="mt-10 rounded-3xl border border-white/50 bg-white/[0.09] p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_40px_120px_rgba(0,0,0,0.65)] backdrop-blur-md">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Demo</h2>
              <p className="mt-2 text-sm text-white/65">Rain + Fireplace. One click. No setup.</p>
            </div>

            <div className="flex gap-2">
              {!isOn ? (
                <button
                  onClick={startDemo}
                  className="rounded-xl border border-white/50 bg-white/10 px-5 py-2.5 text-sm hover:bg-white/50"
                >
                  Play
                </button>
              ) : (
                <button
                  onClick={stopDemo}
                  className="rounded-xl border border-white/50 bg-white/10 px-5 py-2.5 text-sm hover:bg-white/50"
                >
                  Stop
                </button>
              )}
            </div>
          </div>

          <div className="mt-7 grid gap-5 lg:grid-cols-3">
            {/* now playing */}
            <div className="lg:col-span-2 rounded-2xl border border-white/50 bg-white/[0.02] p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium">Now Playing</div>
                    <span className="text-xs">{isOn ? '🟢' : '⚪'}</span>
                  </div>
                  <div className="mt-1 text-xs text-white/60">
                    {isOn ? 'Rain + Fireplace running.' : 'Press Play to start the demo.'}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-white/55">Volume</span>
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

              <div className="mt-4 rounded-xl border border-white/10 bg-transparant/30 p-4 text-xs text-white/80">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-white/75">Sources</span>
                  <span className="text-white/45">locked asset paths</span>
                </div>
                <div className="mt-3 space-y-2">
                  <div className="flex gap-2">
                    <span className="text-white/75">•</span>
                    <span className="min-w-[80px] text-white/75">Rain</span>
                    <span className="truncate">{rainPath}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-white/75">•</span>
                    <span className="min-w-[80px] text-white/75">Fireplace</span>
                    <span className="truncate">{firePath}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* principles */}
            <div className="rounded-2xl border border-white/50 bg-white/[0.02] p-5">
              <div className="text-sm font-medium">Principles</div>

              <div className="mt-4 space-y-3">
                <div className="rounded-xl border border-white/50 bg-white/[0.02] p-4">
                  <div className="text-sm font-medium">Real recordings first</div>
                  <div className="mt-1 text-xs text-white/60">Curate reality. Don’t sterilize it.</div>
                </div>

                <div className="rounded-xl border border-white/50 bg-white/[0.02] p-4">
                  <div className="text-sm font-medium">Deterministic by design</div>
                  <div className="mt-1 text-xs text-white/60">Same inputs, same behavior.</div>
                </div>

                <div className="rounded-xl border border-white/50 bg-white/[0.02] p-4">
                  <div className="text-sm font-medium">Offline & private</div>
                  <div className="mt-1 text-xs text-white/60">No accounts. No analytics.</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 text-xs text-white/45">

          </div>
        </section>
      </div>
    </main>
  );
}
