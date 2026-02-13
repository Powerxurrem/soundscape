export type TrackType = 'loop' | 'event';

export type Asset = {
  id: string; // your stable internal ID (matches UI + exports)
  label: string; // what user sees
  type: TrackType; // loop or event
  category: string; // e.g. "Rain", "Fireplace", "Thunder"
  file: string; // public URL path, e.g. "/assets/loops/rain/xxx.mp3"
};

// Minimal ship set: core beds + one thunder event.
// (No other changes outside this asset list.)
export const ASSETS: Asset[] = [
  // --- RAIN (loops) — keep 2 variants
  {
    id: 'rain_soft_loop_01',
    label: 'Soft Rain', 
    type: 'loop',
    category: 'Rain',
    file: '/assets/loops/rain/rain_soft_loop_01.mp3',
  },
  {
    id: 'rain_medium_loop_01',
    label: 'Medium Rain',
    type: 'loop',
    category: 'Rain',
    file: '/assets/loops/rain/rain_medium_loop_01.mp3',
  },

  // --- FIREPLACE (loops) — real recording
  {
    id: 'fireplace_cozy_loop_01',
    label: 'Cozy Fireplace',
    type: 'loop',
    category: 'Fireplace',
    file: '/assets/loops/fireplace/fireplace_cozy_loop_01.mp3',
  },

  // --- WATER (loops) — real recording
  {
    id: 'water_stream_with_distant_birds_01',
    label: 'Stream + Distant Birds',
    type: 'loop',
    category: 'Water',
    file: '/assets/loops/water/water_stream_with_distant_birds_01.mp3',
  },

  // --- BIRDS (loops) — real recording
  {
    id: 'birds_morning_chirp_01',
    label: 'Morning Chirps',
    type: 'loop',
    category: 'Birds',
    file: '/assets/loops/birds/birds_morning_chirp_01.mp3',
  },

  // --- THUNDER (events) — keep 1 variant
  {
    id: 'thunder_distant_01',
    label: 'Distant Roll',
    type: 'event',
    category: 'thunder',
    file: '/assets/events/thunder/thunder_distant_roll_01.mp3',
  },
];
