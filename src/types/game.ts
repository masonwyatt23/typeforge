export type GameMode = "practice" | "daily" | "race" | "quick_match";
export type GameStatus = "idle" | "countdown" | "playing" | "finished";

export interface Passage {
  id: string;
  text: string;
  source?: string;
  difficulty: "easy" | "medium" | "hard";
  category?: string;
  wordCount: number;
  charCount: number;
}

export interface GameSession {
  id: string;
  mode: GameMode;
  passage: Passage;
  wpm: number;
  rawWpm: number;
  accuracy: number;
  maxCombo: number;
  durationMs: number;
  xpEarned: number;
  startedAt: number;
  completedAt: number;
}
