"use client";

import { useReducer, useCallback, useRef, useEffect } from "react";
import {
  typingEngineReducer,
  createInitialState,
  computeResults,
  getCurrentWpm,
  getProgress,
  getComboTier,
} from "@/core/typing-engine";
import type { TypingAction, TypingResult, TypingEffect } from "@/types/typing";
import { useAudio } from "./use-audio";
import { useParticles } from "./use-particles";
import { useScreenShake } from "./use-screen-shake";
import { useGameStore } from "@/stores/game-store";
import { getComboVisuals, getComboColors, getComboMilestonePitch } from "@/lib/effects/combo-visual-manager";
import { SHAKE_INTENSITY, WPM_UPDATE_INTERVAL } from "@/lib/utils/constants";

interface UseTypingEngineOptions {
  onComplete?: (result: TypingResult) => void;
}

// Store both effects and combo from reducer result so dispatch can use post-action combo
interface PendingEffects {
  effects: TypingEffect[];
  combo: number;
}

export function useTypingEngine(passage: string, options: UseTypingEngineOptions = {}) {
  const pendingRef = useRef<PendingEffects>({ effects: [], combo: 0 });

  const [state, rawDispatch] = useReducer(
    (s: ReturnType<typeof createInitialState>, a: TypingAction) => {
      const result = typingEngineReducer(s, a);
      pendingRef.current = { effects: result.effects, combo: result.state.currentCombo };
      return result.state;
    },
    passage,
    createInitialState
  );

  const cursorElementRef = useRef<HTMLElement | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const { playSound, initAudio } = useAudio();
  const { spawn } = useParticles();
  const { shake } = useScreenShake();
  const { updateStats } = useGameStore();
  const onCompleteRef = useRef(options.onComplete);
  onCompleteRef.current = options.onComplete;

  // WPM update interval — uses ref to avoid resetting interval on every keystroke
  useEffect(() => {
    if (!state.startTime || state.isComplete) return;

    const interval = setInterval(() => {
      const s = stateRef.current;
      const wpm = getCurrentWpm(s, Date.now());
      const progress = getProgress(s);
      const accuracy = s.correctChars + s.incorrectChars > 0
        ? s.correctChars / (s.correctChars + s.incorrectChars)
        : 1;
      updateStats(wpm, accuracy, s.currentCombo, s.maxCombo, progress);
    }, WPM_UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, [state.startTime, state.isComplete, updateStats]);

  const getCursorPosition = useCallback((): { x: number; y: number } => {
    if (cursorElementRef.current) {
      const rect = cursorElementRef.current.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top };
    }
    return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  }, []);

  const processEffects = useCallback(
    (effects: TypingEffect[], combo: number) => {
      const pos = getCursorPosition();
      const visuals = getComboVisuals(combo);

      for (const effect of effects) {
        switch (effect.type) {
          case "CORRECT_CHAR":
            playSound("keystroke");
            spawn("keystroke", pos.x, pos.y, visuals.particleMultiplier);
            break;

          case "CORRECTED_CHAR":
            playSound("keystroke", { volume: 0.7 });
            break;

          case "ERROR":
          case "ERROR_MAXED":
            playSound("error");
            spawn("error", pos.x, pos.y);
            shake(SHAKE_INTENSITY.ERROR);
            break;

          case "COMBO_MILESTONE": {
            const pitch = getComboMilestonePitch(effect.comboCount ?? 0);
            playSound("combo-milestone", { pitch });
            spawn("comboMilestone", pos.x, pos.y, visuals.particleMultiplier);
            break;
          }

          case "COMBO_BREAK":
            if ((effect.comboCount ?? 0) >= 10) {
              playSound("combo-break");
              shake(SHAKE_INTENSITY.COMBO_BREAK);
            }
            break;

          case "WORD_COMPLETE":
            playSound("word-complete");
            spawn("wordBurst", pos.x, pos.y, visuals.particleMultiplier * 0.5);
            break;

          case "COMPLETE":
            playSound("complete");
            spawn("confetti", window.innerWidth / 2, window.innerHeight / 3);
            break;
        }
      }
    },
    [playSound, spawn, shake, getCursorPosition]
  );

  const dispatch = useCallback(
    (action: TypingAction) => {
      initAudio();
      rawDispatch(action);

      // Use post-action combo from the reducer result (via ref) for correct tier effects
      requestAnimationFrame(() => {
        const { effects, combo } = pendingRef.current;
        if (effects.length > 0) {
          processEffects(effects, combo);
          pendingRef.current = { effects: [], combo: 0 };
        }
      });
    },
    [initAudio, processEffects]
  );

  // Trigger onComplete when isComplete changes
  const prevCompleteRef = useRef(false);
  useEffect(() => {
    if (state.isComplete && !prevCompleteRef.current) {
      const result = computeResults(state);
      updateStats(result.wpm, result.accuracy, state.currentCombo, state.maxCombo, 1);
      onCompleteRef.current?.(result);
    }
    prevCompleteRef.current = state.isComplete;
  }, [state.isComplete, updateStats]);

  const reset = useCallback(
    (newPassage?: string) => {
      rawDispatch({ type: "RESET", passage: newPassage ?? passage });
    },
    [passage]
  );

  return {
    state,
    dispatch,
    reset,
    cursorElementRef,
    comboTier: getComboTier(state.currentCombo),
    comboVisuals: getComboVisuals(state.currentCombo),
    comboColors: getComboColors(state.currentCombo),
    progress: getProgress(state),
  };
}
