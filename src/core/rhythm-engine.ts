// Rhythm Type Engine — type characters in sync with a moving cursor

import { type TimingRating, isComboMilestone } from "@/core/hero-shared";

export type { TimingRating } from "@/core/hero-shared";
export { getRatingColor } from "@/core/hero-shared";

export interface RhythmNote {
  char: string;
  index: number;
  state: "upcoming" | "active" | "perfect" | "great" | "good" | "miss";
  hitDelta?: number; // ms delta from perfect timing
}

export interface RhythmState {
  text: string;
  notes: RhythmNote[];
  cursorPosition: number; // current position in the text (float, advances with time)
  nextExpectedIndex: number; // which character the player should type next
  bpm: number; // characters per minute (determines scroll speed)
  score: number;
  combo: number;
  maxCombo: number;
  perfects: number;
  greats: number;
  goods: number;
  misses: number;
  isPlaying: boolean;
  startTime: number | null;
}

export interface RhythmEffect {
  type: "hit" | "miss" | "combo_milestone";
  rating?: TimingRating;
  index?: number;
  combo?: number;
}

// Timing windows (in characters of distance from cursor)
const PERFECT_WINDOW = 0.4;
const GREAT_WINDOW = 0.8;
const GOOD_WINDOW = 1.3;
const MISS_THRESHOLD = 1.8; // auto-miss if cursor passes this far

// Scoring
const SCORE_MAP: Record<TimingRating, number> = {
  perfect: 300,
  great: 200,
  good: 100,
  miss: 0,
};

// Phrases for rhythm mode (shorter, rhythmic)
const RHYTHM_PHRASES = [
  "the quick brown fox jumps over the lazy dog and runs away fast",
  "speed and power flow through every keystroke you make today",
  "forge your skills in the fires of competition and glory",
  "typing fast is an art form that requires practice and focus",
  "the rhythm of the keys creates a symphony of productivity",
  "dance across the keyboard with precision and perfect timing",
  "every character counts when you are chasing the high score",
  "let your fingers fly across the keys with confidence now",
  "master the flow and enter a state of pure concentration",
  "the beat goes on and your fingers follow the perfect rhythm",
];

export function getRandomRhythmPhrase(): string {
  return RHYTHM_PHRASES[Math.floor(Math.random() * RHYTHM_PHRASES.length)];
}

export function createRhythmState(text: string, bpm: number): RhythmState {
  return {
    text,
    notes: text.split("").map((char, i) => ({
      char,
      index: i,
      state: "upcoming",
    })),
    cursorPosition: -3, // start a few chars before the text
    nextExpectedIndex: 0,
    bpm,
    score: 0,
    combo: 0,
    maxCombo: 0,
    perfects: 0,
    greats: 0,
    goods: 0,
    misses: 0,
    isPlaying: false,
    startTime: null,
  };
}

export function startRhythm(state: RhythmState, now: number): RhythmState {
  return { ...state, isPlaying: true, startTime: now };
}

export function updateRhythm(
  state: RhythmState,
  deltaMs: number,
): { state: RhythmState; effects: RhythmEffect[] } {
  if (!state.isPlaying) return { state, effects: [] };

  const effects: RhythmEffect[] = [];
  const charsPerSecond = state.bpm / 60;
  const newCursorPos = state.cursorPosition + charsPerSecond * (deltaMs / 1000);

  // Check for auto-missed notes (cursor passed too far)
  const updatedNotes = [...state.notes];
  let { combo, misses, nextExpectedIndex } = state;

  for (let i = nextExpectedIndex; i < updatedNotes.length; i++) {
    const note = updatedNotes[i];
    if (note.state !== "upcoming") continue;

    const distance = newCursorPos - i;
    if (distance > MISS_THRESHOLD) {
      updatedNotes[i] = { ...note, state: "miss" };
      if (combo > 0) {
        effects.push({ type: "miss", index: i, combo });
      }
      combo = 0;
      misses++;
      nextExpectedIndex = i + 1;
    } else {
      break; // notes are in order, no need to check further
    }
  }

  // Check if game is complete
  const isComplete = newCursorPos > state.text.length + 3;

  return {
    state: {
      ...state,
      notes: updatedNotes,
      cursorPosition: newCursorPos,
      nextExpectedIndex,
      combo,
      misses,
      isPlaying: !isComplete,
    },
    effects,
  };
}

export function handleRhythmInput(
  state: RhythmState,
  char: string,
): { state: RhythmState; effects: RhythmEffect[] } {
  if (!state.isPlaying) return { state, effects: [] };

  const effects: RhythmEffect[] = [];
  const idx = state.nextExpectedIndex;

  if (idx >= state.notes.length) return { state, effects: [] };

  const note = state.notes[idx];
  const isCorrectChar = char === note.char;

  if (!isCorrectChar) {
    // Wrong character — miss
    const updatedNotes = [...state.notes];
    updatedNotes[idx] = { ...note, state: "miss" };

    if (state.combo > 0) {
      effects.push({ type: "miss", index: idx, combo: state.combo });
    }

    return {
      state: {
        ...state,
        notes: updatedNotes,
        nextExpectedIndex: idx + 1,
        combo: 0,
        misses: state.misses + 1,
      },
      effects,
    };
  }

  // Correct character — determine timing rating
  const distance = Math.abs(state.cursorPosition - idx);
  let rating: TimingRating;

  if (distance <= PERFECT_WINDOW) {
    rating = "perfect";
  } else if (distance <= GREAT_WINDOW) {
    rating = "great";
  } else if (distance <= GOOD_WINDOW) {
    rating = "good";
  } else {
    // Typed too early — still counts as a hit but poor timing
    rating = "good";
  }

  const combo = state.combo + 1;
  const comboBonus = Math.floor(SCORE_MAP[rating] * combo * 0.05);
  const scoreGain = SCORE_MAP[rating] + comboBonus;

  const updatedNotes = [...state.notes];
  updatedNotes[idx] = { ...note, state: rating, hitDelta: distance };

  effects.push({ type: "hit", rating, index: idx, combo });
  if (isComboMilestone(combo)) {
    effects.push({ type: "combo_milestone", combo });
  }

  return {
    state: {
      ...state,
      notes: updatedNotes,
      nextExpectedIndex: idx + 1,
      score: state.score + scoreGain,
      combo,
      maxCombo: Math.max(state.maxCombo, combo),
      perfects: state.perfects + (rating === "perfect" ? 1 : 0),
      greats: state.greats + (rating === "great" ? 1 : 0),
      goods: state.goods + (rating === "good" ? 1 : 0),
    },
    effects,
  };
}

export function getRhythmResults(state: RhythmState) {
  const total = state.perfects + state.greats + state.goods + state.misses;
  return {
    score: state.score,
    perfects: state.perfects,
    greats: state.greats,
    goods: state.goods,
    misses: state.misses,
    accuracy: total > 0 ? (state.perfects + state.greats + state.goods) / total : 0,
    maxCombo: state.maxCombo,
    totalNotes: state.text.length,
  };
}

