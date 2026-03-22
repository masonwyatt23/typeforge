import { create } from "zustand";
import type { GameMode, GameStatus } from "@/types/game";

interface GameStore {
  mode: GameMode | null;
  status: GameStatus;
  passageText: string;
  wpm: number;
  accuracy: number;
  combo: number;
  maxCombo: number;
  progress: number;
  startTime: number | null;

  setMode: (mode: GameMode) => void;
  setStatus: (status: GameStatus) => void;
  setPassageText: (text: string) => void;
  updateStats: (wpm: number, accuracy: number, combo: number, maxCombo: number, progress: number) => void;
  setStartTime: (time: number) => void;
  reset: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  mode: null,
  status: "idle",
  passageText: "",
  wpm: 0,
  accuracy: 1,
  combo: 0,
  maxCombo: 0,
  progress: 0,
  startTime: null,

  setMode: (mode) => set({ mode }),
  setStatus: (status) => set({ status }),
  setPassageText: (text) => set({ passageText: text }),
  updateStats: (wpm, accuracy, combo, maxCombo, progress) =>
    set({ wpm, accuracy, combo, maxCombo, progress }),
  setStartTime: (time) => set({ startTime: time }),
  reset: () =>
    set({
      status: "idle",
      wpm: 0,
      accuracy: 1,
      combo: 0,
      maxCombo: 0,
      progress: 0,
      startTime: null,
    }),
}));
