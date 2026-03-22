// Combo tier thresholds
export const COMBO_TIERS = {
  NONE: 0,
  BUILDING: 10,
  HOT: 25,
  FLOW: 50,
  UNSTOPPABLE: 100,
} as const;

// Max uncorrected errors before input blocks
export const MAX_UNCORRECTED_ERRORS = 10;

// WPM calculation interval (ms)
export const WPM_UPDATE_INTERVAL = 500;

// Characters per "word" for WPM calculation (standard)
export const CHARS_PER_WORD = 5;

// Multiplayer progress broadcast interval (ms)
export const PROGRESS_BROADCAST_INTERVAL = 200;

// XP rewards
export const XP_BASE = 10;
export const XP_PER_WPM = 2;
export const XP_ACCURACY_BONUS = 50; // awarded at 95%+ accuracy
export const XP_COMBO_BONUS_PER_10 = 5;
export const XP_DAILY_BONUS = 25;

// Level XP thresholds (exponential curve)
export function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

// Screen shake intensities (px)
export const SHAKE_INTENSITY = {
  ERROR: 2,
  COMBO_BREAK: 4,
  RAPID_ERRORS: 6,
} as const;

// Particle spawn rates per combo tier
export const PARTICLE_RATE_MULTIPLIER = {
  NONE: 1,
  BUILDING: 1.5,
  HOT: 2.5,
  FLOW: 4,
  UNSTOPPABLE: 5,
} as const;
