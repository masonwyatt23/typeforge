import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TypingResult } from "@/types/typing";

interface GameRecord {
  wpm: number;
  accuracy: number;
  maxCombo: number;
  difficulty: string;
  date: number;
}

interface PersonalBests {
  isNewBestWpm: boolean;
  isNewBestAccuracy: boolean;
  isNewBestCombo: boolean;
}

interface StatsStore {
  gamesPlayed: number;
  bestWpm: number;
  bestAccuracy: number;
  averageWpm: number;
  bestCombo: number;
  totalCharsTyped: number;
  totalTimeMs: number;
  recentHistory: GameRecord[];

  recordGame: (result: TypingResult, difficulty: string) => PersonalBests;
  getPersonalBests: () => { wpm: number; accuracy: number; combo: number };
}

export const useStatsStore = create<StatsStore>()(
  persist(
    (set, get) => ({
      gamesPlayed: 0,
      bestWpm: 0,
      bestAccuracy: 0,
      averageWpm: 0,
      bestCombo: 0,
      totalCharsTyped: 0,
      totalTimeMs: 0,
      recentHistory: [],

      recordGame: (result: TypingResult, difficulty: string): PersonalBests => {
        const state = get();
        const isNewBestWpm = result.wpm > state.bestWpm;
        const isNewBestAccuracy = result.accuracy > state.bestAccuracy;
        const isNewBestCombo = result.maxCombo > state.bestCombo;

        const newGamesPlayed = state.gamesPlayed + 1;
        const newTotalChars = state.totalCharsTyped + result.totalChars;
        const newTotalTime = state.totalTimeMs + result.durationMs;

        // Running average: ((old_avg * old_count) + new_value) / new_count
        const newAverageWpm = Math.round(
          (state.averageWpm * state.gamesPlayed + result.wpm) / newGamesPlayed
        );

        const newRecord: GameRecord = {
          wpm: result.wpm,
          accuracy: result.accuracy,
          maxCombo: result.maxCombo,
          difficulty,
          date: Date.now(),
        };

        const newHistory = [newRecord, ...state.recentHistory].slice(0, 20);

        set({
          gamesPlayed: newGamesPlayed,
          bestWpm: Math.max(state.bestWpm, result.wpm),
          bestAccuracy: Math.max(state.bestAccuracy, result.accuracy),
          averageWpm: newAverageWpm,
          bestCombo: Math.max(state.bestCombo, result.maxCombo),
          totalCharsTyped: newTotalChars,
          totalTimeMs: newTotalTime,
          recentHistory: newHistory,
        });

        return { isNewBestWpm, isNewBestAccuracy, isNewBestCombo };
      },

      getPersonalBests: () => {
        const state = get();
        return {
          wpm: state.bestWpm,
          accuracy: state.bestAccuracy,
          combo: state.bestCombo,
        };
      },
    }),
    {
      name: "typeforge-stats",
    }
  )
);
