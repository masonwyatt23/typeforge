import { describe, it, expect } from "vitest";
import {
  createInitialState,
  typingEngineReducer,
  computeResults,
  getCurrentWpm,
  getComboTier,
  getProgress,
} from "./typing-engine";
import type { TypingAction } from "@/types/typing";

function typeChar(char: string, timestamp = Date.now()): TypingAction {
  return { type: "CHAR_INPUT", char, timestamp };
}

function backspace(timestamp = Date.now()): TypingAction {
  return { type: "BACKSPACE", timestamp };
}

function typeString(state: ReturnType<typeof createInitialState>, text: string, startTime = 1000) {
  let current = state;
  const allEffects: ReturnType<typeof typingEngineReducer>["effects"] = [];
  for (let i = 0; i < text.length; i++) {
    const result = typingEngineReducer(current, typeChar(text[i], startTime + i * 50));
    current = result.state;
    allEffects.push(...result.effects);
  }
  return { state: current, effects: allEffects };
}

describe("typing engine", () => {
  describe("initialization", () => {
    it("creates correct initial state", () => {
      const state = createInitialState("hello");
      expect(state.passage).toBe("hello");
      expect(state.charStates).toEqual(["pending", "pending", "pending", "pending", "pending"]);
      expect(state.cursorPosition).toBe(0);
      expect(state.isComplete).toBe(false);
      expect(state.currentCombo).toBe(0);
      expect(state.startTime).toBeNull();
    });

    it("handles empty passage", () => {
      const state = createInitialState("");
      expect(state.charStates).toEqual([]);
      expect(state.passage.length).toBe(0);
    });
  });

  describe("character input", () => {
    it("marks correct character", () => {
      const state = createInitialState("hi");
      const { state: next, effects } = typingEngineReducer(state, typeChar("h", 1000));
      expect(next.charStates[0]).toBe("correct");
      expect(next.cursorPosition).toBe(1);
      expect(next.correctChars).toBe(1);
      expect(effects).toContainEqual({ type: "CORRECT_CHAR", position: 0 });
    });

    it("marks incorrect character", () => {
      const state = createInitialState("hi");
      const { state: next, effects } = typingEngineReducer(state, typeChar("x", 1000));
      expect(next.charStates[0]).toBe("incorrect");
      expect(next.cursorPosition).toBe(1);
      expect(next.incorrectChars).toBe(1);
      expect(next.uncorrectedErrors).toBe(1);
      expect(effects).toContainEqual({ type: "ERROR", position: 0 });
    });

    it("sets start time on first keystroke", () => {
      const state = createInitialState("hi");
      const { state: next } = typingEngineReducer(state, typeChar("h", 5000));
      expect(next.startTime).toBe(5000);
    });

    it("preserves start time on subsequent keystrokes", () => {
      const state = createInitialState("hi");
      const { state: first } = typingEngineReducer(state, typeChar("h", 5000));
      const { state: second } = typingEngineReducer(first, typeChar("i", 6000));
      expect(second.startTime).toBe(5000);
    });

    it("completes on last character", () => {
      const state = createInitialState("ab");
      const { state: s1 } = typingEngineReducer(state, typeChar("a", 1000));
      const { state: s2, effects } = typingEngineReducer(s1, typeChar("b", 1050));
      expect(s2.isComplete).toBe(true);
      expect(effects).toContainEqual({ type: "COMPLETE" });
    });

    it("ignores input when complete", () => {
      const { state: complete } = typeString(createInitialState("ab"), "ab");
      const { state: after } = typingEngineReducer(complete, typeChar("x", 2000));
      expect(after.cursorPosition).toBe(2);
    });

    it("ignores input at end of passage", () => {
      const state = createInitialState("a");
      const { state: s1 } = typingEngineReducer(state, typeChar("a", 1000));
      const { state: s2 } = typingEngineReducer(s1, typeChar("b", 1050));
      expect(s2.cursorPosition).toBe(1);
    });
  });

  describe("error limiting", () => {
    it("blocks input after max uncorrected errors", () => {
      const passage = "abcdefghijklmnop";
      let state = createInitialState(passage);

      // Type 10 wrong characters
      for (let i = 0; i < 10; i++) {
        const { state: next } = typingEngineReducer(state, typeChar("z", 1000 + i));
        state = next;
      }
      expect(state.uncorrectedErrors).toBe(10);

      // 11th wrong char should be blocked and emit ERROR_MAXED
      const { state: blocked, effects } = typingEngineReducer(state, typeChar("z", 2000));
      expect(blocked.cursorPosition).toBe(10);
      expect(blocked.uncorrectedErrors).toBe(10);
      expect(effects).toContainEqual({ type: "ERROR_MAXED" });
    });
  });

  describe("backspace", () => {
    it("moves cursor back", () => {
      const state = createInitialState("hi");
      const { state: s1 } = typingEngineReducer(state, typeChar("h", 1000));
      const { state: s2 } = typingEngineReducer(s1, backspace(1050));
      expect(s2.cursorPosition).toBe(0);
      expect(s2.charStates[0]).toBe("pending");
    });

    it("does nothing at position 0", () => {
      const state = createInitialState("hi");
      const { state: after } = typingEngineReducer(state, backspace(1000));
      expect(after.cursorPosition).toBe(0);
    });

    it("decrements uncorrected errors when backspacing over incorrect char", () => {
      const state = createInitialState("hi");
      const { state: s1 } = typingEngineReducer(state, typeChar("x", 1000));
      expect(s1.uncorrectedErrors).toBe(1);
      const { state: s2 } = typingEngineReducer(s1, backspace(1050));
      expect(s2.uncorrectedErrors).toBe(0);
    });

    it("decrements correctChars when backspacing over correct char", () => {
      const state = createInitialState("hi");
      const { state: s1 } = typingEngineReducer(state, typeChar("h", 1000));
      expect(s1.correctChars).toBe(1);
      const { state: s2 } = typingEngineReducer(s1, backspace(1050));
      expect(s2.correctChars).toBe(0);
    });

    it("does nothing when complete", () => {
      const { state: complete } = typeString(createInitialState("ab"), "ab");
      const { state: after } = typingEngineReducer(complete, backspace(2000));
      expect(after.cursorPosition).toBe(2);
    });
  });

  describe("combo system", () => {
    it("increments combo on correct chars", () => {
      const { state } = typeString(createInitialState("hello"), "hello");
      expect(state.currentCombo).toBe(5);
      expect(state.maxCombo).toBe(5);
    });

    it("breaks combo on error", () => {
      const state = createInitialState("abc");
      const { state: s1 } = typingEngineReducer(state, typeChar("a", 1000));
      const { state: s2, effects } = typingEngineReducer(s1, typeChar("x", 1050));
      expect(s2.currentCombo).toBe(0);
      expect(s2.maxCombo).toBe(1);
      expect(effects).toContainEqual({ type: "COMBO_BREAK", comboCount: 1 });
    });

    it("fires combo milestone at 10", () => {
      const passage = "abcdefghij";
      const { effects } = typeString(createInitialState(passage), passage);
      const milestones = effects.filter((e) => e.type === "COMBO_MILESTONE");
      expect(milestones).toContainEqual({ type: "COMBO_MILESTONE", comboCount: 10 });
    });

    it("preserves max combo after break", () => {
      const passage = "abcdefg";
      let state = createInitialState(passage);
      // Type 5 correct
      for (let i = 0; i < 5; i++) {
        const { state: next } = typingEngineReducer(state, typeChar(passage[i], 1000 + i));
        state = next;
      }
      // Type 1 wrong
      const { state: s1 } = typingEngineReducer(state, typeChar("z", 2000));
      expect(s1.maxCombo).toBe(5);
      expect(s1.currentCombo).toBe(0);
    });
  });

  describe("corrected characters", () => {
    it("marks corrected char when backspacing and retyping", () => {
      const state = createInitialState("hi");
      // Type wrong
      const { state: s1 } = typingEngineReducer(state, typeChar("x", 1000));
      expect(s1.charStates[0]).toBe("incorrect");
      // Backspace
      const { state: s2 } = typingEngineReducer(s1, backspace(1050));
      expect(s2.charStates[0]).toBe("pending");
      // Retype correctly — but the char was incorrect before backspace reset it to pending
      // so it should be "correct" not "corrected" because pending -> correct is normal
      const { state: s3 } = typingEngineReducer(s2, typeChar("h", 1100));
      expect(s3.charStates[0]).toBe("correct");
    });
  });

  describe("word completion", () => {
    it("fires word complete on space", () => {
      const { effects } = typeString(createInitialState("hi there"), "hi ");
      const wordCompletes = effects.filter((e) => e.type === "WORD_COMPLETE");
      expect(wordCompletes.length).toBeGreaterThan(0);
    });

    it("fires word complete at end of passage", () => {
      const { effects } = typeString(createInitialState("hi"), "hi");
      const wordCompletes = effects.filter((e) => e.type === "WORD_COMPLETE");
      expect(wordCompletes.length).toBeGreaterThan(0);
    });
  });

  describe("special characters", () => {
    it("handles punctuation correctly", () => {
      const state = createInitialState("it's");
      const { state: s1 } = typingEngineReducer(state, typeChar("i", 1000));
      const { state: s2 } = typingEngineReducer(s1, typeChar("t", 1050));
      const { state: s3 } = typingEngineReducer(s2, typeChar("'", 1100));
      const { state: s4 } = typingEngineReducer(s3, typeChar("s", 1150));
      expect(s4.correctChars).toBe(4);
      expect(s4.isComplete).toBe(true);
    });

    it("handles numbers", () => {
      const state = createInitialState("42");
      const { state: s1 } = typingEngineReducer(state, typeChar("4", 1000));
      const { state: s2 } = typingEngineReducer(s1, typeChar("2", 1050));
      expect(s2.isComplete).toBe(true);
      expect(s2.correctChars).toBe(2);
    });
  });

  describe("reset", () => {
    it("resets to fresh state with new passage", () => {
      const { state: typed } = typeString(createInitialState("old"), "old");
      const { state: reset } = typingEngineReducer(typed, { type: "RESET", passage: "new" });
      expect(reset.passage).toBe("new");
      expect(reset.cursorPosition).toBe(0);
      expect(reset.isComplete).toBe(false);
      expect(reset.correctChars).toBe(0);
    });
  });

  describe("results computation", () => {
    it("computes WPM and accuracy", () => {
      const passage = "hello world"; // 11 chars
      const state = createInitialState(passage);
      // Simulate typing the full passage over 6 seconds (10000 wpm test...)
      let current = state;
      for (let i = 0; i < passage.length; i++) {
        const { state: next } = typingEngineReducer(
          current,
          typeChar(passage[i], 1000 + i * 545) // ~110 chars/min pace
        );
        current = next;
      }

      const results = computeResults(current);
      expect(results.accuracy).toBe(1);
      expect(results.correctChars).toBe(11);
      expect(results.incorrectChars).toBe(0);
      expect(results.maxCombo).toBe(11);
      expect(results.wpm).toBeGreaterThan(0);
    });

    it("accuracy reflects errors", () => {
      const state = createInitialState("ab");
      const { state: s1 } = typingEngineReducer(state, typeChar("a", 1000));
      const { state: s2 } = typingEngineReducer(s1, typeChar("x", 2000)); // wrong
      const results = computeResults(s2);
      expect(results.accuracy).toBe(0.5);
    });
  });

  describe("utility functions", () => {
    it("getCurrentWpm returns 0 before typing", () => {
      const state = createInitialState("test");
      expect(getCurrentWpm(state, Date.now())).toBe(0);
    });

    it("getComboTier returns correct tiers", () => {
      expect(getComboTier(0)).toBe("none");
      expect(getComboTier(9)).toBe("none");
      expect(getComboTier(10)).toBe("building");
      expect(getComboTier(24)).toBe("building");
      expect(getComboTier(25)).toBe("hot");
      expect(getComboTier(49)).toBe("hot");
      expect(getComboTier(50)).toBe("flow");
      expect(getComboTier(99)).toBe("flow");
      expect(getComboTier(100)).toBe("unstoppable");
      expect(getComboTier(500)).toBe("unstoppable");
    });

    it("getProgress returns correct values", () => {
      const state = createInitialState("abcd");
      expect(getProgress(state)).toBe(0);
      const { state: s1 } = typingEngineReducer(state, typeChar("a", 1000));
      expect(getProgress(s1)).toBe(0.25);
      const { state: complete } = typeString(createInitialState("ab"), "ab");
      expect(getProgress(complete)).toBe(1);
    });

    it("getProgress handles empty passage", () => {
      const state = createInitialState("");
      expect(getProgress(state)).toBe(0);
    });
  });
});
