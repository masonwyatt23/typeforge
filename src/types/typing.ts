export type CharState = "pending" | "correct" | "incorrect" | "corrected";

export type ComboTier = "none" | "building" | "hot" | "flow" | "unstoppable";

export interface TypingEngineState {
  passage: string;
  charStates: CharState[];
  cursorPosition: number;

  // Error tracking
  errors: Set<number>;
  uncorrectedErrors: number;

  // Stats
  correctChars: number;
  incorrectChars: number;
  totalKeystrokes: number;

  // Combo
  currentCombo: number;
  maxCombo: number;

  // Timing
  startTime: number | null;
  lastKeystrokeTime: number | null;

  // Completion
  isComplete: boolean;
}

export type TypingAction =
  | { type: "CHAR_INPUT"; char: string; timestamp: number }
  | { type: "BACKSPACE"; timestamp: number }
  | { type: "RESET"; passage: string };

export type TypingEffectType =
  | "CORRECT_CHAR"
  | "ERROR"
  | "CORRECTED_CHAR"
  | "COMBO_MILESTONE"
  | "COMBO_BREAK"
  | "WORD_COMPLETE"
  | "COMPLETE"
  | "ERROR_MAXED";

export interface TypingEffect {
  type: TypingEffectType;
  comboCount?: number;
  position?: number;
}

export interface TypingResult {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  correctChars: number;
  incorrectChars: number;
  totalChars: number;
  maxCombo: number;
  durationMs: number;
  passage: string;
}
