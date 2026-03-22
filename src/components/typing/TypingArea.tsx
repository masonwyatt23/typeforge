"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTypingEngine } from "@/hooks/use-typing-engine";
import type { TypingResult } from "@/types/typing";
import { cn } from "@/lib/utils/cn";
import { MAX_UNCORRECTED_ERRORS } from "@/lib/utils/constants";

interface TypingAreaProps {
  passage: string;
  onComplete: (result: TypingResult) => void;
  isActive: boolean;
}

export function TypingArea({ passage, onComplete, isActive }: TypingAreaProps) {
  const {
    state,
    dispatch,
    cursorElementRef,
    comboVisuals,
  } = useTypingEngine(passage, { onComplete });

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isTypingActive, setIsTypingActive] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const focusInput = useCallback(() => {
    if (isActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isActive]);

  useEffect(() => {
    focusInput();
    // Also focus on any click in the document during gameplay
    const handler = () => focusInput();
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [focusInput, isActive]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isActive || state.isComplete) return;

      setIsTypingActive(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setIsTypingActive(false), 500);

      if (e.key === "Backspace") {
        e.preventDefault();
        dispatch({ type: "BACKSPACE", timestamp: Date.now() });
        return;
      }

      if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return;

      e.preventDefault();
      dispatch({ type: "CHAR_INPUT", char: e.key, timestamp: Date.now() });
    },
    [isActive, state.isComplete, dispatch]
  );

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
  }, []);

  // Auto-scroll to keep cursor visible
  useEffect(() => {
    if (cursorElementRef.current && containerRef.current) {
      const cursor = cursorElementRef.current;
      const container = containerRef.current;
      const cursorRect = cursor.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      if (cursorRect.bottom > containerRect.bottom - 20) {
        container.scrollTop += cursorRect.bottom - containerRect.bottom + 40;
      }
      if (cursorRect.top < containerRect.top + 20) {
        container.scrollTop -= containerRect.top - cursorRect.top + 40;
      }
    }
  }, [state.cursorPosition, cursorElementRef]);

  return (
    <div className="relative" onClick={focusInput}>
      <input
        ref={inputRef}
        type="text"
        className="absolute opacity-0 w-0 h-0 pointer-events-none"
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        aria-label="Typing input"
        tabIndex={0}
      />

      {/* Focus overlay */}
      {!isFocused && isActive && !state.isComplete && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-bg-primary/70 rounded-2xl backdrop-blur-sm cursor-pointer transition-opacity">
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-accent-cyan/10 border border-accent-cyan/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-accent-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672ZM12 2.25V4.5m5.834.166-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243-1.59-1.59" />
              </svg>
            </div>
            <span className="text-text-secondary text-sm font-medium">Click anywhere to start</span>
          </div>
        </div>
      )}

      {/* Combo background */}
      <div className={cn(
        "absolute inset-0 rounded-2xl transition-all duration-700",
        comboVisuals.bgClass,
        state.uncorrectedErrors >= MAX_UNCORRECTED_ERRORS && "border-2 border-error/40 shadow-[0_0_20px_rgba(239,68,68,0.15)]"
      )} />

      {/* Error max warning */}
      <AnimatePresence>
        {state.uncorrectedErrors >= MAX_UNCORRECTED_ERRORS && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-2 left-0 right-0 z-20 text-center"
          >
            <span className="text-error text-xs font-medium animate-pulse bg-bg-primary/80 px-3 py-1 rounded-full">
              Backspace to fix errors
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Passage text */}
      <div
        ref={containerRef}
        className={cn(
          "relative font-[family-name:var(--font-mono)] text-lg md:text-xl leading-[2] p-6 md:p-8 max-h-[280px] overflow-y-auto select-none break-words",
          isTypingActive && "typing-active"
        )}
      >
        {passage.split("").map((char, i) => {
          const charState = state.charStates[i];
          const isCurrent = i === state.cursorPosition && !state.isComplete;

          return (
            <span
              key={i}
              ref={isCurrent ? (el) => { cursorElementRef.current = el; } : undefined}
              className={cn(
                "relative transition-colors duration-75",
                charState === "pending" && "char-pending",
                charState === "correct" && "char-correct",
                charState === "incorrect" && "char-incorrect",
                charState === "corrected" && "char-corrected",
                isCurrent && "char-current"
              )}
            >
              {char === " " ? "\u00A0" : char}
            </span>
          );
        })}
      </div>
    </div>
  );
}
