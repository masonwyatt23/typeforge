"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import {
  type RhythmState,
  type RhythmEffect,
  type TimingRating,
  createRhythmState,
  startRhythm,
  updateRhythm,
  handleRhythmInput,
  getRhythmResults,
  getRandomRhythmPhrase,
  getRatingColor,
} from "@/core/rhythm-engine";
import { useAudio } from "@/hooks/use-audio";
import { useParticles } from "@/hooks/use-particles";
import { GlassPanel } from "@/components/ui/GlassPanel";

interface RhythmTypeProps {
  onComplete: (results: ReturnType<typeof getRhythmResults>) => void;
  bpm?: number;
}

const VISIBLE_CHARS = 40; // how many characters are visible at once
const CURSOR_OFFSET = 10; // cursor position from left edge (in char units)

function RatingPopup({ rating, x }: { rating: TimingRating; x: number }) {
  return (
    <motion.div
      initial={{ opacity: 1, y: 0 }}
      animate={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.5 }}
      className="absolute pointer-events-none z-30"
      style={{ left: `${x}%`, top: "-30px" }}
    >
      <span className={cn(
        "font-[family-name:var(--font-accent)] text-xs font-bold uppercase tracking-wider",
        getRatingColor(rating)
      )}>
        {rating}
      </span>
    </motion.div>
  );
}

export function RhythmType({ onComplete, bpm = 180 }: RhythmTypeProps) {
  const [gameState, setGameState] = useState<RhythmState>(() =>
    createRhythmState(getRandomRhythmPhrase(), bpm)
  );
  const [phase, setPhase] = useState<"countdown" | "playing" | "ended">("countdown");
  const [countdown, setCountdown] = useState(3);
  const [ratingPopups, setRatingPopups] = useState<Array<{ id: number; rating: TimingRating; x: number }>>([]);

  const stateRef = useRef(gameState);
  stateRef.current = gameState;
  const inputRef = useRef<HTMLInputElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);
  const popupIdRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const { playSound, initAudio } = useAudio();
  const { spawn } = useParticles();

  // Countdown
  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown <= 0) {
      setPhase("playing");
      const now = Date.now();
      setGameState((s) => startRhythm(s, now));
      lastTimeRef.current = performance.now();
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 700);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  // Process effects
  const processEffects = useCallback(
    (effects: RhythmEffect[]) => {
      for (const effect of effects) {
        switch (effect.type) {
          case "hit": {
            playSound("keystroke");
            if (effect.rating === "perfect") {
              playSound("combo-milestone", { pitch: 2, volume: 0.4 });
            }
            // Particle burst at the cursor position
            if (containerRef.current) {
              const rect = containerRef.current.getBoundingClientRect();
              const cursorX = rect.left + (CURSOR_OFFSET / VISIBLE_CHARS) * rect.width;
              const cursorY = rect.top + rect.height / 2;
              spawn("keystroke", cursorX, cursorY, effect.rating === "perfect" ? 3 : 1);
            }
            // Rating popup
            const popX = (CURSOR_OFFSET / VISIBLE_CHARS) * 100;
            const id = popupIdRef.current++;
            setRatingPopups((p) => [...p, { id, rating: effect.rating!, x: popX }]);
            setTimeout(() => setRatingPopups((p) => p.filter((pp) => pp.id !== id)), 500);
            break;
          }
          case "miss":
            playSound("error");
            break;
          case "combo_milestone":
            playSound("combo-milestone", { pitch: 1.2 });
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

      const { state: newState, effects } = updateRhythm(stateRef.current, delta);
      setGameState(newState);
      if (effects.length > 0) processEffects(effects);

      if (!newState.isPlaying) {
        setPhase("ended");
        onComplete(getRhythmResults(newState));
        return;
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [phase, processEffects, onComplete]);

  // Input handling
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (phase !== "playing") return;
      initAudio();

      if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return;
      e.preventDefault();

      const { state: newState, effects } = handleRhythmInput(stateRef.current, e.key);
      setGameState(newState);
      if (effects.length > 0) processEffects(effects);
    },
    [phase, initAudio, processEffects]
  );

  useEffect(() => {
    if (phase === "playing") inputRef.current?.focus();
  }, [phase]);

  // Calculate visible window
  const scrollOffset = gameState.cursorPosition - CURSOR_OFFSET;
  const startIdx = Math.max(0, Math.floor(scrollOffset));
  const endIdx = Math.min(gameState.text.length, startIdx + VISIBLE_CHARS + 2);

  return (
    <div
      className="relative w-full max-w-3xl mx-auto select-none"
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
            <motion.div key={gameState.combo} initial={{ scale: 1.3 }} animate={{ scale: 1 }} className="text-center">
              <span className="font-[family-name:var(--font-accent)] text-2xl font-bold text-accent-pink tabular-nums">
                {gameState.combo}x
              </span>
              <p className="text-[10px] text-text-ghost uppercase tracking-[0.2em]">Combo</p>
            </motion.div>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-text-ghost tabular-nums">
          <span className="text-accent-cyan">{gameState.perfects}P</span>
          <span className="text-accent-blue">{gameState.greats}Gr</span>
          <span className="text-accent-purple">{gameState.goods}Go</span>
          <span className="text-error">{gameState.misses}M</span>
        </div>
      </div>

      {/* Rhythm track */}
      <div ref={containerRef}>
      <GlassPanel intense className="relative overflow-hidden" style={{ height: "140px" }}>
        {/* Beat markers — subtle vertical lines */}
        <div className="absolute inset-0 flex items-center">
          {Array.from({ length: 20 }).map((_, i) => {
            const charPos = Math.floor(scrollOffset) + i;
            if (charPos < 0 || charPos % 4 !== 0) return null;
            const xPct = ((i - (scrollOffset % 1)) / VISIBLE_CHARS) * 100;
            return (
              <div
                key={i}
                className="absolute top-0 bottom-0 w-[1px] bg-white/[0.04]"
                style={{ left: `${xPct}%` }}
              />
            );
          })}
        </div>

        {/* Cursor line — the "hit" marker */}
        <div
          className="absolute top-0 bottom-0 w-[2px] z-20"
          style={{ left: `${(CURSOR_OFFSET / VISIBLE_CHARS) * 100}%` }}
        >
          <div className="w-full h-full bg-accent-pink" />
          <div className="absolute inset-0 bg-accent-pink/30 blur-md" />
          {/* Cursor glow circle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-accent-pink/10 border border-accent-pink/30" />
        </div>

        {/* Characters */}
        <div className="absolute inset-0 flex items-center">
          {gameState.notes.slice(startIdx, endIdx).map((note) => {
            const charOffset = note.index - scrollOffset;
            const xPct = (charOffset / VISIBLE_CHARS) * 100;
            const distanceFromCursor = Math.abs(charOffset - CURSOR_OFFSET);
            const isNearCursor = distanceFromCursor < 2;

            return (
              <div
                key={note.index}
                className="absolute flex items-center justify-center"
                style={{
                  left: `${xPct}%`,
                  width: `${100 / VISIBLE_CHARS}%`,
                  transition: "opacity 50ms",
                }}
              >
                <span
                  className={cn(
                    "font-[family-name:var(--font-mono)] text-2xl font-semibold transition-all duration-75",
                    note.state === "upcoming" && (isNearCursor ? "text-text-primary scale-110" : "text-text-ghost"),
                    note.state === "perfect" && "text-accent-cyan scale-125",
                    note.state === "great" && "text-accent-blue",
                    note.state === "good" && "text-accent-purple opacity-70",
                    note.state === "miss" && "text-error/40 line-through",
                    note.state === "active" && "text-white",
                  )}
                >
                  {note.char === " " ? "\u00B7" : note.char}
                </span>
              </div>
            );
          })}
        </div>

        {/* Rating popups */}
        <AnimatePresence>
          {ratingPopups.map((p) => (
            <RatingPopup key={p.id} rating={p.rating} x={p.x} />
          ))}
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
                className="font-[family-name:var(--font-accent)] text-7xl font-black text-accent-pink"
                style={{ textShadow: "0 0 40px rgba(236, 72, 153, 0.5)" }}
              >
                {countdown === 0 ? "GO" : countdown}
              </motion.span>
            </AnimatePresence>
          </div>
        )}
      </GlassPanel>
      </div>

      {/* BPM indicator */}
      <div className="flex items-center justify-center gap-4 mt-3 text-xs text-text-ghost">
        <span>{bpm} BPM</span>
        <span className="text-text-ghost/30">|</span>
        <span>{gameState.text.length} notes</span>
        <span className="text-text-ghost/30">|</span>
        <span>best combo <span className="text-accent-pink">{gameState.maxCombo}x</span></span>
      </div>
    </div>
  );
}
