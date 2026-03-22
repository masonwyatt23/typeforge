import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AudioStore {
  enabled: boolean;
  volume: number;
  setEnabled: (enabled: boolean) => void;
  setVolume: (volume: number) => void;
  toggle: () => void;
}

export const useAudioStore = create<AudioStore>()(
  persist(
    (set) => ({
      enabled: true,
      volume: 0.7,
      setEnabled: (enabled) => set({ enabled }),
      setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),
      toggle: () => set((state) => ({ enabled: !state.enabled })),
    }),
    {
      name: "typing-game-audio",
    }
  )
);
