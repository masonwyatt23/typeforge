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
import { useParticles } from "@/hooks/use-particles";
import { GlassPanel } from "@/components/ui/GlassPanel";

interface WordDropProps {
  onComplete: (results: ReturnType<typeof getWordDropResults>) => void;
  duration?: number; // game duration in seconds (default 60)
}

const LANE_COLORS = [
  "from-accent-cyan to-accent-blue",
  "from-accent-blue to-accent-purple",
  "from-accent-purple to-accent-pink",
  "from-accent-pink to-accent-cyan",
];

const LANE_GLOW_COLORS = [
  "rgba(34, 211, 238, 0.3)",
  "rgba(59, 130, 246, 0.3)",
  "rgba(168, 85, 247, 0.3)",
  "rgba(236, 72, 153, 0.3)",
];

function HitRatingPopup({ rating, x, y }: { rating: HitRating; x: number; y: number }) {
  return (
    <motion.div
      initial={{ opacity: 1, y: 0, scale: 1.2 }}
      animate={{ opacity: 0, y: -40, scale: 0.8 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="absolute pointer-events-none z-30"
      style={{ left: x, top: y }}
    >
      <span
        className={cn(
          "font-[family-name:var(--font-accent)] text-lg font-bold uppercase tracking-wider",
          getHitRatingColor(rating)
        )}
      >
        {rating}
      </span>
    </motion.div>
  );
}

export function WordDrop({ onComplete, duration = 60 }: WordDropProps) {
  const [gameState, setGameState] = useState<WordDropState>(createWordDropState);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [hitPopups, setHitPopups] = useState<Array<{ id: number; rating: HitRating; x: number; y: number }>>([]);
  const [levelUpFlash, setLevelUpFlash] = useState<number | null>(null);
  const [phase, setPhase] = useState<"countdown" | "playing" | "ended">("countdown");
  const [countdown, setCountdown] = useState(3);

  const stateRef = useRef(gameState);
  stateRef.current = gameState;
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);
  const popupIdRef = useRef(0);

  const { playSound, initAudio } = useAudio();
  const { spawn } = useParticles();

  // Countdown
  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown <= 0) {
      setPhase("playing");
      const now = Date.now();
      setGameState(startWordDrop(createWordDropState(), now));
      lastTimeRef.current = performance.now();
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 700);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  // Process effects
  const processEffects = useCallback(
    (effects: WordDropEffect[]) => {
      for (const effect of effects) {
        switch (effect.type) {
          case "hit": {
            playSound("keystroke");
            if (effect.rating === "perfect") {
              playSound("combo-milestone", { pitch: 1.5 });
            }
            // Spawn particles at the word's lane position
            if (effect.word && containerRef.current) {
              const rect = containerRef.current.getBoundingClientRect();
              const laneWidth = rect.width / 4;
              const x = rect.left + effect.word.lane * laneWidth + laneWidth / 2;
              const y = rect.top + rect.height * 0.85;
              spawn("wordBurst", x, y, effect.rating === "perfect" ? 3 : 1.5);

              setHitPopups((p) => [
                ...p,
                { id: popupIdRef.current++, rating: effect.rating!, x: laneWidth * effect.word!.lane + laneWidth / 2 - 30, y: rect.height * 0.78 },
              ]);
              setTimeout(() => {
                setHitPopups((p) => p.filter((pp) => pp.id !== popupIdRef.current - 1));
              }, 600);
            }
            break;
          }
          case "miss":
            playSound("error");
            break;
          case "combo_milestone":
            playSound("combo-milestone", { pitch: 1 + (effect.combo ?? 0) * 0.005 });
            break;
          case "level_up":
            playSound("level-up");
            setLevelUpFlash(effect.level ?? null);
            setTimeout(() => setLevelUpFlash(null), 1500);
            break;
        }
      }
    },
    [playSound, spawn]
  );

  // Game loop
  useEffect(() => {
    if (phase !== "playing") return;

    const loop = (time: number) => {
      const delta = time - lastTimeRef.current;
      lastTimeRef.current = time;

      const { state: newState, effects } = updateWordDrop(stateRef.current, delta, Date.now());
      setGameState(newState);
      if (effects.length > 0) processEffects(effects);

      animFrameRef.current = requestAnimationFrame(loop);
    };

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
    const t = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
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

      const { state: newState, effects } = handleWordDropInput(stateRef.current, e.key);
      setGameState(newState);
      if (effects.length > 0) processEffects(effects);
    },
    [phase, initAudio, processEffects]
  );

  // Auto-focus
  useEffect(() => {
    if (phase === "playing") inputRef.current?.focus();
  }, [phase]);

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-2xl mx-auto select-none"
      onClick={() => inputRef.current?.focus()}
    >
      <input
        ref={inputRef}
        type="text"
        className="absolute opacity-0 w-0 h-0 pointer-events-none"
        onKeyDown={handleKeyDown}
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
          <div className="text-center">
            <span className="font-[family-name:var(--font-accent)] text-lg font-bold text-accent-cyan">
              LV{gameState.level}
            </span>
          </div>
          <div className="text-center">
            <span className={cn(
              "font-[family-name:var(--font-accent)] text-2xl font-bold tabular-nums",
              timeLeft <= 10 ? "text-error animate-pulse" : "text-text-primary"
            )}>
              {timeLeft}s
            </span>
          </div>
        </div>
      </div>

      {/* Game field */}
      <GlassPanel intense className="relative overflow-hidden" style={{ height: "460px" }}>
        {/* Lane dividers */}
        <div className="absolute inset-0 flex">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex-1 border-r border-white/[0.04] last:border-r-0" />
          ))}
        </div>

        {/* Strike zone */}
        <div
          className="absolute left-0 right-0 h-[2px] z-10"
          style={{ top: "85%" }}
        >
          <div className="w-full h-full bg-gradient-to-r from-accent-cyan via-accent-purple to-accent-pink opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-r from-accent-cyan via-accent-purple to-accent-pink opacity-20 blur-md" />
        </div>

        {/* Strike zone glow area */}
        <div
          className="absolute left-0 right-0 pointer-events-none z-5"
          style={{ top: "78%", height: "14%" }}
        >
          <div className="w-full h-full bg-gradient-to-b from-transparent via-white/[0.02] to-transparent" />
        </div>

        {/* Falling words */}
        <AnimatePresence>
          {gameState.words.map((word) => (
            <FallingWordComponent
              key={word.id}
              word={word}
              currentInput={gameState.currentInput}
              isActive={word.id === gameState.activeWordId}
            />
          ))}
        </AnimatePresence>

        {/* Hit rating popups */}
        <AnimatePresence>
          {hitPopups.map((popup) => (
            <HitRatingPopup key={popup.id} rating={popup.rating} x={popup.x} y={popup.y} />
          ))}
        </AnimatePresence>

        {/* Level up flash */}
        <AnimatePresence>
          {levelUpFlash && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none"
            >
              <div className="text-center">
                <span className="font-[family-name:var(--font-accent)] text-4xl font-black bg-gradient-to-r from-accent-cyan to-accent-purple bg-clip-text text-transparent">
                  LEVEL {levelUpFlash}
                </span>
              </div>
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
                transition={{ duration: 0.3 }}
                className="font-[family-name:var(--font-accent)] text-8xl font-black text-accent-cyan"
                style={{ textShadow: "0 0 40px rgba(34, 211, 238, 0.5)" }}
              >
                {countdown === 0 ? "GO" : countdown}
              </motion.span>
            </AnimatePresence>
          </div>
        )}

        {/* Current input display */}
        {gameState.currentInput && phase === "playing" && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20">
            <span className="font-[family-name:var(--font-mono)] text-lg text-accent-cyan bg-bg-primary/80 px-3 py-1 rounded-lg border border-accent-cyan/20">
              {gameState.currentInput}
            </span>
          </div>
        )}
      </GlassPanel>

      {/* Stats bar */}
      <div className="flex items-center justify-center gap-6 mt-3 text-xs text-text-ghost">
        <span><span className="text-success">{gameState.hits}</span> hits</span>
        <span><span className="text-error">{gameState.misses}</span> misses</span>
        <span>best combo <span className="text-accent-purple">{gameState.maxCombo}x</span></span>
      </div>
    </div>
  );
}

function FallingWordComponent({
  word,
  currentInput,
  isActive,
}: {
  word: FallingWord;
  currentInput: string;
  isActive: boolean;
}) {
  const laneWidth = 25; // percentage
  const left = word.lane * laneWidth + laneWidth / 2;
  const top = word.y * 100;

  if (word.state === "hit") {
    return (
      <motion.div
        initial={{ scale: 1, opacity: 1 }}
        animate={{ scale: 1.5, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
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
        className="absolute -translate-x-1/2 -translate-y-1/2"
        style={{ left: `${left}%`, top: `${top}%` }}
      >
        <span className="font-[family-name:var(--font-mono)] text-base text-error/50 line-through">
          {word.text}
        </span>
      </motion.div>
    );
  }

  // Check if in strike zone
  const inStrikeZone = word.y >= 0.73 && word.y <= 0.97;

  return (
    <div
      className={cn(
        "absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-75",
        inStrikeZone && "scale-110"
      )}
      style={{ left: `${left}%`, top: `${top}%` }}
    >
      <span
        className={cn(
          "font-[family-name:var(--font-mono)] text-base font-semibold px-2 py-0.5 rounded-md inline-block",
          isActive
            ? "bg-accent-cyan/20 border border-accent-cyan/40 text-white"
            : inStrikeZone
              ? "bg-white/10 text-text-primary"
              : "text-text-secondary"
        )}
        style={
          isActive
            ? { boxShadow: `0 0 12px ${LANE_GLOW_COLORS[word.lane]}` }
            : undefined
        }
      >
        {word.text.split("").map((char, i) => (
          <span
            key={i}
            className={
              isActive && i < currentInput.length
                ? "text-accent-cyan"
                : ""
            }
          >
            {char}
          </span>
        ))}
      </span>
    </div>
  );
}
