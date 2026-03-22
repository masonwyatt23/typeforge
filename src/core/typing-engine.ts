import {
  type TypingEngineState,
  type TypingAction,
  type TypingEffect,
  type CharState,
  type TypingResult,
} from "@/types/typing";
import { MAX_UNCORRECTED_ERRORS, CHARS_PER_WORD, COMBO_TIERS } from "@/lib/utils/constants";

export interface EngineResult {
  state: TypingEngineState;
  effects: TypingEffect[];
}

export function createInitialState(passage: string): TypingEngineState {
  return {
    passage,
    charStates: new Array(passage.length).fill("pending") as CharState[],
    cursorPosition: 0,
    errors: new Set(),
    uncorrectedErrors: 0,
    correctChars: 0,
    incorrectChars: 0,
    totalKeystrokes: 0,
    currentCombo: 0,
    maxCombo: 0,
    startTime: null,
    lastKeystrokeTime: null,
    isComplete: false,
  };
}

export function typingEngineReducer(
  state: TypingEngineState,
  action: TypingAction
): EngineResult {
  switch (action.type) {
    case "RESET":
      return { state: createInitialState(action.passage), effects: [] };

    case "CHAR_INPUT":
      return handleCharInput(state, action.char, action.timestamp);

    case "BACKSPACE":
      return handleBackspace(state, action.timestamp);
  }
}

function handleCharInput(
  prev: TypingEngineState,
  char: string,
  timestamp: number
): EngineResult {
  if (prev.isComplete) return { state: prev, effects: [] };

  // Block input if too many uncorrected errors
  if (prev.uncorrectedErrors >= MAX_UNCORRECTED_ERRORS) {
    return { state: prev, effects: [{ type: "ERROR_MAXED" }] };
  }

  const effects: TypingEffect[] = [];
  const pos = prev.cursorPosition;

  // Already at end of passage
  if (pos >= prev.passage.length) return { state: prev, effects: [] };

  const expected = prev.passage[pos];
  const isCorrect = char === expected;

  // Clone mutable state
  const charStates = [...prev.charStates];
  const errors = new Set(prev.errors);
  let { correctChars, incorrectChars, uncorrectedErrors, currentCombo, maxCombo } = prev;
  const totalKeystrokes = prev.totalKeystrokes + 1;

  // Set start time on first keystroke
  const startTime = prev.startTime ?? timestamp;

  if (isCorrect) {
    // If this position was previously an error that was corrected via backspace
    if (charStates[pos] === "incorrect") {
      charStates[pos] = "corrected";
      correctChars++;
      uncorrectedErrors--;
      effects.push({ type: "CORRECTED_CHAR", position: pos });
    } else {
      charStates[pos] = "correct";
      correctChars++;
      effects.push({ type: "CORRECT_CHAR", position: pos });
    }

    // Combo
    currentCombo++;
    if (currentCombo > maxCombo) maxCombo = currentCombo;

    // Check combo milestones
    if (
      currentCombo === COMBO_TIERS.BUILDING ||
      currentCombo === COMBO_TIERS.HOT ||
      currentCombo === COMBO_TIERS.FLOW ||
      currentCombo === COMBO_TIERS.UNSTOPPABLE
    ) {
      effects.push({ type: "COMBO_MILESTONE", comboCount: currentCombo });
    }

    // Check word completion (space or end of passage)
    const nextPos = pos + 1;
    if (char === " " || nextPos >= prev.passage.length) {
      effects.push({ type: "WORD_COMPLETE", position: pos });
    }
  } else {
    charStates[pos] = "incorrect";
    incorrectChars++;
    uncorrectedErrors++;
    errors.add(pos);

    // Break combo
    if (currentCombo > 0) {
      effects.push({ type: "COMBO_BREAK", comboCount: currentCombo });
    }
    currentCombo = 0;

    effects.push({ type: "ERROR", position: pos });
  }

  const newPos = pos + 1;
  const isComplete = newPos >= prev.passage.length;

  if (isComplete) {
    effects.push({ type: "COMPLETE" });
  }

  return {
    state: {
      ...prev,
      charStates,
      cursorPosition: newPos,
      errors,
      uncorrectedErrors,
      correctChars,
      incorrectChars,
      totalKeystrokes,
      currentCombo,
      maxCombo,
      startTime,
      lastKeystrokeTime: timestamp,
      isComplete,
    },
    effects,
  };
}

function handleBackspace(
  prev: TypingEngineState,
  timestamp: number
): EngineResult {
  if (prev.isComplete) return { state: prev, effects: [] };
  if (prev.cursorPosition === 0) return { state: prev, effects: [] };

  const newPos = prev.cursorPosition - 1;
  const charStates = [...prev.charStates];
  let { uncorrectedErrors, incorrectChars, correctChars } = prev;
  const totalKeystrokes = prev.totalKeystrokes + 1;

  if (charStates[newPos] === "incorrect") {
    uncorrectedErrors--;
    incorrectChars--;
  }
  if (charStates[newPos] === "correct" || charStates[newPos] === "corrected") {
    correctChars--;
  }

  charStates[newPos] = "pending";

  return {
    state: {
      ...prev,
      charStates,
      cursorPosition: newPos,
      correctChars,
      uncorrectedErrors,
      incorrectChars,
      totalKeystrokes,
      lastKeystrokeTime: timestamp,
    },
    effects: [],
  };
}

// Compute results from final state
export function computeResults(state: TypingEngineState): TypingResult {
  const durationMs = state.lastKeystrokeTime! - state.startTime!;
  const durationMin = durationMs / 60000;

  const totalTyped = state.correctChars + state.incorrectChars;
  const rawWpm = durationMin > 0 ? totalTyped / CHARS_PER_WORD / durationMin : 0;
  const netWpm = durationMin > 0
    ? Math.max(0, (state.correctChars / CHARS_PER_WORD) / durationMin)
    : 0;
  const accuracy = totalTyped > 0 ? state.correctChars / totalTyped : 0;

  return {
    wpm: Math.round(netWpm),
    rawWpm: Math.round(rawWpm),
    accuracy: Math.round(accuracy * 1000) / 1000,
    correctChars: state.correctChars,
    incorrectChars: state.incorrectChars,
    totalChars: state.passage.length,
    maxCombo: state.maxCombo,
    durationMs,
    passage: state.passage,
  };
}

// Get current WPM during typing (called on interval)
export function getCurrentWpm(state: TypingEngineState, now: number): number {
  if (!state.startTime || state.correctChars === 0) return 0;
  const elapsedMin = (now - state.startTime) / 60000;
  if (elapsedMin === 0) return 0;
  return Math.round(state.correctChars / CHARS_PER_WORD / elapsedMin);
}

// Get combo tier from count
export function getComboTier(combo: number) {
  if (combo >= COMBO_TIERS.UNSTOPPABLE) return "unstoppable" as const;
  if (combo >= COMBO_TIERS.FLOW) return "flow" as const;
  if (combo >= COMBO_TIERS.HOT) return "hot" as const;
  if (combo >= COMBO_TIERS.BUILDING) return "building" as const;
  return "none" as const;
}

// Get progress as 0-1
export function getProgress(state: TypingEngineState): number {
  if (state.passage.length === 0) return 0;
  return state.cursorPosition / state.passage.length;
}
