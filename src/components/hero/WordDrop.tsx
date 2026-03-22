"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import {
  type WordDropState,
  type FallingWord,
  type WordDropEffect,
  type HitRating,
  createWordDropState,
  startWordDrop,
  updateWordDrop,
  handleWordDropInput,
  handleWordDropBackspace,
  getHitRatingColor,
  getWordDropResults,
} from "@/core/word-drop-engine";
import { useAudio } from "@/hooks/use-audio";

interface WordDropProps {
  onComplete: (results: ReturnType<typeof getWordDropResults>) => void;
  duration?: number;
}

const LANE_GLOW_COLORS = [
  "rgba(34, 211, 238, 0.3)",
  "rgba(59, 130, 246, 0.3)",
  "rgba(168, 85, 247, 0.3)",
  "rgba(236, 72, 153, 0.3)",
];

export function WordDrop({ onComplete, duration = 60 }: WordDropProps) {
  const [gameState, setGameState] = useState<WordDropState>(createWordDropState);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [hitPopups, setHitPopups] = useState<Array<{ id: number; rating: HitRating; x: number; y: number }>>([]);
  const [levelUpFlash, setLevelUpFlash] = useState<number | null>(null);
  const [phase, setPhase] = useState<"countdown" | "playing" | "ended">("countdown");
  const [countdown, setCountdown] = useState(3);
  const [isFocused, setIsFocused] = useState(false);
  const [wrongFlash, setWrongFlash] = useState(false);

  const stateRef = useRef(gameState);
  stateRef.current = gameState;
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);
  const popupIdRef = useRef(0);

  const { playSound, initAudio } = useAudio();

  // Focus the input
  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  // Countdown: 3 -> 2 -> 1 -> "GO" (0) -> start
  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown < 0) {
      // Start the game
      setPhase("playing");
      const now = Date.now();
      setGameState(startWordDrop(createWordDropState(), now));
      lastTimeRef.current = performance.now();
      focusInput();
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 800);
    return () => clearTimeout(t);
  }, [phase, countdown, focusInput]);

  // Keep input focused during gameplay
  useEffect(() => {
    if (phase !== "playing") return;
    focusInput();
    const interval = setInterval(focusInput, 1000);
    return () => clearInterval(interval);
  }, [phase, focusInput]);

  // Process effects
  const processEffects = useCallback(
    (effects: WordDropEffect[]) => {
      for (const effect of effects) {
        switch (effect.type) {
          case "hit":
            playSound("keystroke");
            if (effect.rating === "perfect") {
              playSound("word-complete");
            }
            if (effect.word && containerRef.current) {
              const rect = containerRef.current.getBoundingClientRect();
              const laneWidth = rect.width / 4;
              const x = effect.word.lane * laneWidth + laneWidth / 2;
              const y = rect.height * 0.78;
              const id = popupIdRef.current++;
              setHitPopups((p) => [...p.slice(-5), { id, rating: effect.rating!, x, y }]);
              setTimeout(() => setHitPopups((p) => p.filter((pp) => pp.id !== id)), 700);
            }
            break;
          case "miss":
            playSound("error");
            break;
          case "combo_milestone":
            playSound("combo-milestone", { pitch: 1.2 });
            break;
          case "level_up":
            playSound("level-up");
            setLevelUpFlash(effect.level ?? null);
            setTimeout(() => setLevelUpFlash(null), 1500);
            break;
        }
      }
    },
    [playSound]
  );

  // Game loop
  useEffect(() => {
    if (phase !== "playing") return;

    const loop = (time: number) => {
      if (lastTimeRef.current === 0) lastTimeRef.current = time;
      const delta = Math.min(time - lastTimeRef.current, 50); // cap delta at 50ms
      lastTimeRef.current = time;

      const { state: newState, effects } = updateWordDrop(stateRef.current, delta, Date.now());
      setGameState(newState);
      if (effects.length > 0) processEffects(effects);

      animFrameRef.current = requestAnimationFrame(loop);
    };

    lastTimeRef.current = 0; // will be set on first frame
    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [phase, processEffects]);

  // Timer
  useEffect(() => {
    if (phase !== "playing") return;
    if (timeLeft <= 0) {
      setPhase("ended");
      onComplete(getWordDropResults(stateRef.current));
      return;
    }
    const t = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timeLeft, onComplete]);

  // Input handling
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (phase !== "playing") return;
      initAudio();

      if (e.key === "Backspace") {
        e.preventDefault();
        const { state: newState } = handleWordDropBackspace(stateRef.current);
        setGameState(newState);
        return;
      }

      if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return;
      e.preventDefault();

      const prevInput = stateRef.current.currentInput;
      const { state: newState, effects } = handleWordDropInput(stateRef.current, e.key);
      setGameState(newState);
      if (effects.length > 0) processEffects(effects);

      // Flash red if input was rejected (no match found)
      if (newState.currentInput === "" && prevInput === "") {
        setWrongFlash(true);
        playSound("error");
        setTimeout(() => setWrongFlash(false), 200);
      }
    },
    [phase, initAudio, processEffects, playSound]
  );

  const handleContainerClick = useCallback(() => {
    initAudio();
    focusInput();
  }, [initAudio, focusInput]);

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-2xl mx-auto select-none cursor-pointer"
      onClick={handleContainerClick}
    >
      {/* Hidden but focusable input */}
      <input
        ref={inputRef}
        type="text"
        className="fixed top-0 left-0 opacity-0 pointer-events-none"
        style={{ width: 1, height: 1 }}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        tabIndex={0}
      />

      {/* HUD */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <span className="font-[family-name:var(--font-accent)] text-3xl font-bold text-text-primary tabular-nums">
              {gameState.score.toLocaleString()}
            </span>
            <p className="text-[10px] text-text-ghost uppercase tracking-[0.2em]">Score</p>
          </div>
          {gameState.combo > 1 && (
            <motion.div
              key={gameState.combo}
              initial={{ scale: 1.3 }}
              animate={{ scale: 1 }}
              className="text-center"
            >
              <span className="font-[family-name:var(--font-accent)] text-2xl font-bold text-accent-purple tabular-nums">
                {gameState.combo}x
              </span>
              <p className="text-[10px] text-text-ghost uppercase tracking-[0.2em]">Combo</p>
            </motion.div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="font-[family-name:var(--font-accent)] text-lg font-bold text-accent-cyan">
            LV{gameState.level}
          </span>
          <span className={cn(
            "font-[family-name:var(--font-accent)] text-2xl font-bold tabular-nums",
            timeLeft <= 10 ? "text-error animate-pulse" : "text-text-primary"
          )}>
            {timeLeft}s
          </span>
        </div>
      </div>

      {/* Game field */}
      <div className="glass-intense rounded-2xl relative overflow-hidden" style={{ height: "460px" }}>
        {/* Lane dividers */}
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="absolute top-0 bottom-0 w-[1px] bg-white/[0.04]"
            style={{ left: `${i * 25}%` }}
          />
        ))}

        {/* Active lane highlight */}
        {gameState.activeWordId !== null && (() => {
          const activeWord = gameState.words.find(w => w.id === gameState.activeWordId);
          if (!activeWord) return null;
          return (
            <div
              className="absolute top-0 bottom-0 transition-all duration-150 pointer-events-none"
              style={{
                left: `${activeWord.lane * 25}%`,
                width: "25%",
                background: `linear-gradient(to bottom, transparent 60%, ${LANE_GLOW_COLORS[activeWord.lane]}, transparent)`,
                opacity: 0.3,
              }}
            />
          );
        })()}

        {/* GOOD zone indicator (73-97%) */}
        <div
          className="absolute left-0 right-0 pointer-events-none border-t border-b border-white/[0.04]"
          style={{ top: "73%", height: "24%" }}
        />

        {/* GREAT zone (79-91%) - slightly brighter */}
        <div
          className="absolute left-0 right-0 pointer-events-none"
          style={{
            top: "79%", height: "12%",
            background: "linear-gradient(to bottom, transparent, rgba(59,130,246,0.04), transparent)",
          }}
        />

        {/* PERFECT zone (82-88%) - brightest, pulsing */}
        <div
          className="absolute left-0 right-0 pointer-events-none animate-pulse"
          style={{
            top: "82%", height: "6%",
            background: "linear-gradient(to bottom, rgba(34,211,238,0.06), rgba(34,211,238,0.08), rgba(34,211,238,0.06))",
            boxShadow: "inset 0 0 20px rgba(34,211,238,0.05)",
          }}
        />

        {/* Strike zone line — the main target */}
        <div className="absolute left-0 right-0 z-10" style={{ top: "85%" }}>
          <div className="w-full h-[3px] bg-gradient-to-r from-accent-cyan via-accent-purple to-accent-pink" style={{ opacity: 0.8 }} />
          <div className="absolute inset-x-0 -top-2 h-4 bg-gradient-to-r from-accent-cyan via-accent-purple to-accent-pink opacity-15 blur-lg" />
          {/* Zone labels */}
          <div className="absolute -top-[32px] left-2 text-[8px] text-accent-cyan/40 font-[family-name:var(--font-accent)] tracking-widest">PERFECT</div>
          <div className="absolute top-[8px] left-2 text-[8px] text-accent-purple/30 font-[family-name:var(--font-accent)] tracking-widest">GOOD</div>
        </div>

        {/* Falling words */}
        {gameState.words.map((word) => (
          <FallingWordEl
            key={word.id}
            word={word}
            currentInput={gameState.currentInput}
            isActive={word.id === gameState.activeWordId}
          />
        ))}

        {/* Hit rating popups */}
        <AnimatePresence>
          {hitPopups.map((popup) => (
            <motion.div
              key={popup.id}
              initial={{ opacity: 1, y: 0, scale: 1.2 }}
              animate={{ opacity: 0, y: -40, scale: 0.8 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute pointer-events-none z-30"
              style={{ left: popup.x - 30, top: popup.y }}
            >
              <span className={cn(
                "font-[family-name:var(--font-accent)] text-lg font-bold uppercase tracking-wider",
                getHitRatingColor(popup.rating)
              )}>
                {popup.rating}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Level up flash */}
        <AnimatePresence>
          {levelUpFlash && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none"
            >
              <span className="font-[family-name:var(--font-accent)] text-4xl font-black bg-gradient-to-r from-accent-cyan to-accent-purple bg-clip-text text-transparent">
                LEVEL {levelUpFlash}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Countdown overlay */}
        {phase === "countdown" && (
          <div className="absolute inset-0 flex items-center justify-center z-50 bg-bg-primary/60 backdrop-blur-sm">
            <AnimatePresence mode="popLayout">
              <motion.span
                key={countdown}
                initial={{ scale: 0.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 2, opacity: 0 }}
                transition={{ duration: 0.35 }}
                className="font-[family-name:var(--font-accent)] text-8xl font-black text-accent-cyan"
                style={{ textShadow: "0 0 40px rgba(34, 211, 238, 0.5)" }}
              >
                {countdown <= 0 ? "GO!" : countdown}
              </motion.span>
            </AnimatePresence>
          </div>
        )}

        {/* Focus prompt */}
        {phase === "playing" && !isFocused && (
          <div className="absolute inset-0 flex items-center justify-center z-50 bg-bg-primary/60 backdrop-blur-sm">
            <div className="text-center">
              <p className="text-text-secondary text-lg font-medium animate-pulse">Click here to play</p>
              <p className="text-text-ghost text-sm mt-1">Type the words as they hit the line</p>
            </div>
          </div>
        )}

        {/* Current input display */}
        {(gameState.currentInput || wrongFlash) && phase === "playing" && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20">
            <span className={cn(
              "font-[family-name:var(--font-mono)] text-lg px-3 py-1 rounded-lg border transition-colors duration-100",
              wrongFlash
                ? "text-error bg-error/10 border-error/30 animate-[error-shake_200ms_ease-out]"
                : "text-accent-cyan bg-bg-primary/80 border-accent-cyan/20"
            )}>
              {wrongFlash ? "?" : gameState.currentInput}
            </span>
          </div>
        )}
      </div>

      {/* Stats bar */}
      <div className="flex items-center justify-center gap-6 mt-3 text-xs text-text-ghost">
        <span><span className="text-success">{gameState.hits}</span> hits</span>
        <span><span className="text-error">{gameState.misses}</span> misses</span>
        <span>best <span className="text-accent-purple">{gameState.maxCombo}x</span></span>
      </div>
    </div>
  );
}

function FallingWordEl({
  word,
  currentInput,
  isActive,
}: {
  word: FallingWord;
  currentInput: string;
  isActive: boolean;
}) {
  const laneWidth = 25;
  const left = word.lane * laneWidth + laneWidth / 2;
  const top = word.y * 100;

  if (word.state === "hit") {
    return (
      <motion.div
        initial={{ scale: 1, opacity: 1 }}
        animate={{ scale: 1.5, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="absolute -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none"
        style={{ left: `${left}%`, top: `${top}%` }}
      >
        <span className="font-[family-name:var(--font-mono)] text-base font-bold text-accent-cyan">
          {word.text}
        </span>
      </motion.div>
    );
  }

  if (word.state === "missed") {
    return (
      <motion.div
        animate={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{ left: `${left}%`, top: `${top}%` }}
      >
        <span className="font-[family-name:var(--font-mono)] text-base text-error/40 line-through">
          {word.text}
        </span>
      </motion.div>
    );
  }

  // Color-coded proximity zones
  const inPerfect = word.y >= 0.82 && word.y <= 0.88;
  const inGreat = word.y >= 0.79 && word.y <= 0.91;
  const inGood = word.y >= 0.73 && word.y <= 0.97;
  const tooLate = word.y > 0.91;

  // Determine visual style based on proximity
  let wordStyle: string;
  let scale = "";
  let glow: React.CSSProperties | undefined;

  if (isActive) {
    wordStyle = "bg-accent-cyan/20 border border-accent-cyan/40 text-white";
    scale = "scale-115";
    glow = { boxShadow: `0 0 16px ${LANE_GLOW_COLORS[word.lane]}` };
  } else if (inPerfect) {
    wordStyle = "bg-accent-cyan/15 border border-accent-cyan/25 text-accent-cyan";
    scale = "scale-115";
    glow = { boxShadow: "0 0 12px rgba(34, 211, 238, 0.2)" };
  } else if (tooLate && inGood) {
    wordStyle = "bg-error/10 border border-error/20 text-error/80";
    scale = "scale-105";
  } else if (inGreat) {
    wordStyle = "bg-accent-blue/10 border border-accent-blue/15 text-accent-blue";
    scale = "scale-110";
  } else if (inGood) {
    wordStyle = "bg-white/5 border border-white/10 text-text-primary";
    scale = "scale-105";
  } else {
    wordStyle = "text-text-secondary";
  }

  return (
    <div
      className={cn(
        "absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-100",
        scale
      )}
      style={{ left: `${left}%`, top: `${top}%` }}
    >
      <span
        className={cn(
          "font-[family-name:var(--font-mono)] text-base font-semibold px-2.5 py-1 rounded-lg inline-block whitespace-nowrap transition-all duration-100",
          wordStyle
        )}
        style={glow}
      >
        {word.text.split("").map((char, i) => (
          <span key={i} className={isActive && i < currentInput.length ? "text-accent-cyan font-bold" : ""}>
            {char}
          </span>
        ))}
      </span>
    </div>
  );
}
