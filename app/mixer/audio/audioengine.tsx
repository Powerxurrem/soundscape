'use client';

export type TrackType = 'loop' | 'event';

export type MixTrackLike = {
  id: string;
  libraryId: string;
  name: string;
  type: TrackType;
  assetId: string;
  volume: number; // 0..1

  // event-only
  ratePreset?: 'Rare' | 'Medium' | 'Often' | 'Very Often';
  rateSpeed?: 0.5 | 1 | 2;

  // thunder-only
  randomizeVariants?: boolean;
};

type GetUrl = (track: MixTrackLike, assetId: string) => string;

const EVENT_RATE_SECONDS: Record<
  NonNullable<MixTrackLike['ratePreset']>,
  { min: number; max: number }
> = {
  Rare: { min: 45, max: 90 },
  Medium: { min: 20, max: 45 },
  Often: { min: 10, max: 20 },
  'Very Often': { min: 5, max: 10 },
};

function clamp01(v: number) {
  if (Number.isNaN(v)) return 0;
  return Math.max(0, Math.min(1, v));
}

function randBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function pickWeighted<T>(items: { item: T; weight: number }[]) {
  const total = items.reduce((s, x) => s + x.weight, 0);
  let r = Math.random() * total;
  for (const x of items) {
    r -= x.weight;
    if (r <= 0) return x.item;
  }
  return items[items.length - 1].item;
}

type LoopRuntime = {
  src: AudioBufferSourceNode;
  gain: GainNode;
  assetKey: string; // url
};

type EventRuntime = {
  src: AudioBufferSourceNode;
  gain: GainNode;
};

export type AudioEngine = {
  activate: () => Promise<void>;
  isActive: () => boolean;
  setMaster: (v: number) => void;

  // preload/decode buffers without starting playback
  preload: (urls: string[]) => Promise<void>;

  syncMix: (tracks: MixTrackLike[], getUrl: GetUrl) => Promise<void>;
  stopAll: () => void;
};


export function createAudioEngine(): AudioEngine {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;

  const bufferCache = new Map<string, AudioBuffer>(); // key=url
  const loopMap = new Map<string, LoopRuntime>(); // key=track.id
  const loopStarting = new Set<string>(); // track.id

  // Track scheduled/playing one-shots so Stop can cut them immediately
  const eventNodes = new Set<EventRuntime>();

  // One scheduler for events
  let eventTimer: number | null = null;

  // Next fire time per event track (AudioContext time)
  const nextFireAt = new Map<string, number>(); // key=track.id

  // Scheduler tuning
  const TICK_MS = 200;
  const LOOKAHEAD_SEC = 0.8;

  function ensureCtx() {
    if (!ctx) {
      ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = 0.8;
      master.connect(ctx.destination);
    }
    return { ctx, master: master! };
  }

  async function loadBuffer(url: string) {
    const { ctx } = ensureCtx();
    const cached = bufferCache.get(url);
    if (cached) return cached;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch audio: ${url}`);

    const arr = await res.arrayBuffer();
    const buf = await ctx.decodeAudioData(arr);
    bufferCache.set(url, buf);
    return buf;
  }

  async function preload(urls: string[]) {
    const unique = Array.from(new Set(urls));
    await Promise.all(unique.map((u) => loadBuffer(u).catch(() => {})));
  }

  function stopLoop(trackId: string) {
    const rt = loopMap.get(trackId);
    if (!rt) return;
    try {
      rt.src.stop(0);
    } catch {}
    try {
      rt.src.disconnect();
      rt.gain.disconnect();
    } catch {}
    loopMap.delete(trackId);
  }

  function stopAll() {
    // stop loops
    for (const id of Array.from(loopMap.keys())) stopLoop(id);

    // stop events
    for (const n of Array.from(eventNodes)) {
      try {
        n.src.stop(0);
      } catch {}
      try {
        n.src.disconnect();
        n.gain.disconnect();
      } catch {}
    }
    eventNodes.clear();

    // stop planning
    if (eventTimer) window.clearInterval(eventTimer);
    eventTimer = null;

    nextFireAt.clear();
  }

  function setMaster(v: number) {
    const { master } = ensureCtx();
    master.gain.value = clamp01(v);
  }

  function isActive() {
    return !!ctx && ctx.state === 'running';
  }

  async function activate() {
    const { ctx } = ensureCtx();
    if (ctx.state !== 'running') await ctx.resume();
  }

  async function startOrUpdateLoop(track: MixTrackLike, getUrl: GetUrl) {
    const { ctx, master } = ensureCtx();
    const url = getUrl(track, track.assetId);

    // prevent double-start during async load
    if (loopStarting.has(track.id)) return;
    loopStarting.add(track.id);

    try {
      const existing = loopMap.get(track.id);
      if (existing && existing.assetKey === url) {
        existing.gain.gain.value = clamp01(track.volume);
        return;
      }

      stopLoop(track.id);

      const buf = await loadBuffer(url);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;

      const gain = ctx.createGain();
      gain.gain.value = clamp01(track.volume);

      src.connect(gain);
      gain.connect(master);
      src.start(0);

      loopMap.set(track.id, { src, gain, assetKey: url });
    } catch (e) {
      console.warn(e);
    } finally {
      loopStarting.delete(track.id);
    }
  }

  function computeEventIntervalSec(track: MixTrackLike) {
    const base = EVENT_RATE_SECONDS[track.ratePreset ?? 'Rare'];
    const speed = track.rateSpeed ?? 1;
    return { min: base.min / speed, max: base.max / speed };
  }

  function pickThunderVariant(track: MixTrackLike): string {
    if (!track.randomizeVariants) return track.assetId;

    return pickWeighted<string>([
      { item: 'thunder_distant_roll_01', weight: 0.7 },
      { item: 'thunder_close_strike_01', weight: 0.3 },
    ]);
  }

  async function playOneShotAt(
    track: MixTrackLike,
    assetId: string,
    getUrl: GetUrl,
    atTime: number
  ) {
    const { ctx, master } = ensureCtx();
    const url = getUrl(track, assetId);

    let buf: AudioBuffer;
    try {
      buf = await loadBuffer(url);
    } catch (e) {
      console.warn(e);
      return;
    }

    const src = ctx.createBufferSource();
    src.buffer = buf;

    const gain = ctx.createGain();
    gain.gain.value = clamp01(track.volume);

    src.connect(gain);
    gain.connect(master);

    const node: EventRuntime = { src, gain };
    eventNodes.add(node);

    src.start(atTime);

    src.onended = () => {
      eventNodes.delete(node);
      try {
        src.disconnect();
        gain.disconnect();
      } catch {}
    };
  }

  async function syncMix(tracks: MixTrackLike[], getUrl: GetUrl) {
    if (!isActive()) return;

    const { ctx } = ensureCtx();

    // Loops
    const loopTracks = tracks.filter((t) => t.type === 'loop');
    const loopIds = new Set(loopTracks.map((t) => t.id));

    for (const id of Array.from(loopMap.keys())) {
      if (!loopIds.has(id)) stopLoop(id);
    }

    for (const t of loopTracks) {
      await startOrUpdateLoop(t, getUrl);
    }

    // Events (thunder only)
    const eventTracks = tracks.filter((t) => t.type === 'event' && t.libraryId === 'thunder');

    if (eventTimer) window.clearInterval(eventTimer);
    eventTimer = null;
    nextFireAt.clear();

    if (eventTracks.length === 0) return;

    // preload thunder
    {
      const urls: string[] = [];
      for (const t of eventTracks) {
        urls.push(getUrl(t, 'thunder_distant_roll_01'));
        urls.push(getUrl(t, 'thunder_close_strike_01'));
        urls.push(getUrl(t, t.assetId));
      }
      await preload(urls);
    }

    // init next fire times
    for (const t of eventTracks) {
      nextFireAt.set(t.id, ctx.currentTime + 0.2);
    }

    eventTimer = window.setInterval(() => {
      if (!isActive()) return;
      const now = ctx.currentTime;

      for (const t of eventTracks) {
        const nextAt = nextFireAt.get(t.id);
        if (nextAt == null) continue;

        if (nextAt <= now + LOOKAHEAD_SEC) {
          const variant = pickThunderVariant(t);
          void playOneShotAt(t, variant, getUrl, Math.max(nextAt, now));

          const { min, max } = computeEventIntervalSec(t);
          const interval = randBetween(min, max);
          nextFireAt.set(t.id, nextAt + interval);
        }
      }
    }, TICK_MS);
  }

  return { activate, isActive, setMaster, preload, syncMix, stopAll };

}
