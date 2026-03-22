"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WordDrop } from "@/components/hero/WordDrop";
import { RhythmType } from "@/components/hero/RhythmType";
import { ParticleCanvas } from "@/components/effects/ParticleCanvas";
import { ScreenShake } from "@/components/effects/ScreenShake";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils/cn";
import Link from "next/link";
import { useStatsStore } from "@/stores/stats-store";

type HeroMode = "word-drop" | "rhythm-type";
type Phase = "select" | "playing" | "results";

interface GameResults {
  score: number;
  hits?: number;
  misses?: number;
  accuracy: number;
  maxCombo: number;
  level?: number;
  duration?: number;
  perfects?: number;
  greats?: number;
  goods?: number;
  totalNotes?: number;
}

function getGrade(accuracy: number, score: number): { grade: string; color: string } {
  if (accuracy >= 0.95 && score >= 5000) return { grade: "S+", color: "from-accent-pink via-accent-purple to-accent-cyan" };
  if (accuracy >= 0.9 && score >= 3000) return { grade: "S", color: "from-accent-purple to-accent-pink" };
  if (accuracy >= 0.8) return { grade: "A", color: "from-accent-cyan to-accent-blue" };
  if (accuracy >= 0.7) return { grade: "B", color: "from-accent-blue to-accent-purple" };
  if (accuracy >= 0.5) return { grade: "C", color: "from-success to-accent-cyan" };
  return { grade: "D", color: "from-warning to-error" };
}

export default function HeroPage() {
  const [phase, setPhase] = useState<Phase>("select");
  const [mode, setMode] = useState<HeroMode>("word-drop");
  const [duration, setDuration] = useState(60);
  const [results, setResults] = useState<GameResults | null>(null);

  const handleComplete = useCallback((r: GameResults) => {
    setResults(r);
    setPhase("results");
  }, []);

  const handleRestart = useCallback(() => {
    setPhase("playing");
    setResults(null);
  }, []);

  return (
    <main className="h-screen flex flex-col overflow-hidden">
      <div className="fixed inset-0 bg-gradient-to-b from-[#080c18] via-bg-primary to-[#0a0f1e] -z-10" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(168,85,247,0.05)_0%,_transparent_50%)] -z-10" />

      <ParticleCanvas />

      <ScreenShake>
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 shrink-0">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <Logo size="sm" showIcon={false} />
          </Link>
          <span className="font-[family-name:var(--font-accent)] text-xs tracking-[0.3em] text-accent-purple font-bold">
            HERO MODE
          </span>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center px-4 md:px-8 min-h-0">
          <AnimatePresence mode="wait">
            {/* Mode select */}
            {phase === "select" && (
              <motion.div
                key="select"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10, transition: { duration: 0.15 } }}
                className="flex flex-col items-center gap-8 max-w-lg w-full"
              >
                {/* Hero icon */}
                <div className="text-center">
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="inline-block mb-4"
                  >
                    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                      <defs>
                        <linearGradient id="hero-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#a855f7" />
                          <stop offset="100%" stopColor="#ec4899" />
                        </linearGradient>
                      </defs>
                      {/* Guitar neck */}
                      <rect x="28" y="8" width="8" height="36" rx="2" fill="url(#hero-grad)" opacity="0.8" />
                      {/* Guitar body */}
                      <ellipse cx="32" cy="48" rx="16" ry="12" fill="url(#hero-grad)" opacity="0.6" />
                      {/* Frets */}
                      <line x1="28" y1="16" x2="36" y2="16" stroke="white" strokeWidth="1" opacity="0.4" />
                      <line x1="28" y1="22" x2="36" y2="22" stroke="white" strokeWidth="1" opacity="0.4" />
                      <line x1="28" y1="28" x2="36" y2="28" stroke="white" strokeWidth="1" opacity="0.4" />
                      <line x1="28" y1="34" x2="36" y2="34" stroke="white" strokeWidth="1" opacity="0.4" />
                      {/* Sound hole */}
                      <circle cx="32" cy="48" r="5" stroke="white" strokeWidth="1" fill="none" opacity="0.3" />
                      {/* Lightning bolt overlay */}
                      <path d="M34 20L28 32H32L30 42L38 28H33L34 20Z" fill="white" opacity="0.9" />
                    </svg>
                  </motion.div>
                  <h2 className="font-[family-name:var(--font-accent)] text-2xl font-bold tracking-widest bg-gradient-to-r from-accent-purple to-accent-pink bg-clip-text text-transparent">
                    HERO MODE
                  </h2>
                  <p className="text-text-secondary text-sm mt-2">Guitar Hero meets typing. Catch the words.</p>
                </div>

                {/* Mode tabs */}
                <div className="flex gap-2 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <button
                    onClick={() => setMode("word-drop")}
                    className={cn(
                      "px-5 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer",
                      mode === "word-drop"
                        ? "bg-accent-purple/15 text-accent-purple border border-accent-purple/20"
                        : "text-text-secondary hover:text-text-primary"
                    )}
                  >
                    Word Drop
                  </button>
                  <button
                    onClick={() => setMode("rhythm-type")}
                    className={cn(
                      "px-5 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer",
                      mode === "rhythm-type"
                        ? "bg-accent-pink/15 text-accent-pink border border-accent-pink/20"
                        : "text-text-secondary hover:text-text-primary"
                    )}
                  >
                    Rhythm Type
                  </button>
                </div>

                {/* Mode description */}
                <GlassPanel className="p-5 text-center max-w-sm">
                  {mode === "word-drop" ? (
                    <>
                      <p className="text-sm text-text-primary font-medium mb-1">Words fall from above</p>
                      <p className="text-xs text-text-secondary">Type each word as it hits the strike zone. Chain combos, level up, and survive the increasing speed.</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-text-primary font-medium mb-1">Type to the beat</p>
                      <p className="text-xs text-text-secondary">Characters scroll in rhythm. Hit each one as the cursor passes for PERFECT, GREAT, or GOOD ratings.</p>
                    </>
                  )}
                </GlassPanel>

                {/* Duration select */}
                <div className="flex gap-2">
                  {[30, 60, 90].map((d) => (
                    <button
                      key={d}
                      onClick={() => setDuration(d)}
                      className={cn(
                        "px-4 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer",
                        duration === d
                          ? "bg-white/10 text-text-primary"
                          : "text-text-ghost hover:text-text-secondary"
                      )}
                    >
                      {d}s
                    </button>
                  ))}
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => setPhase("playing")}
                  className="min-w-[160px] bg-gradient-to-r from-accent-purple to-accent-pink border-accent-purple/20 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)]"
                >
                  Start Game
                </Button>
              </motion.div>
            )}

            {/* Playing */}
            {phase === "playing" && (
              <motion.div
                key="playing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full"
              >
                {mode === "word-drop" ? (
                  <WordDrop onComplete={handleComplete} duration={duration} />
                ) : (
                  <RhythmType onComplete={handleComplete} bpm={180} />
                )}
              </motion.div>
            )}

            {/* Results */}
            {phase === "results" && results && (
              <motion.div
                key="results"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-6 max-w-md w-full"
              >
                {/* Grade */}
                <motion.div
                  initial={{ scale: 0.5, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="text-center"
                >
                  <span className={cn(
                    "font-[family-name:var(--font-accent)] text-7xl font-black bg-gradient-to-r bg-clip-text text-transparent",
                    getGrade(results.accuracy, results.score).color
                  )}>
                    {getGrade(results.accuracy, results.score).grade}
                  </span>
                </motion.div>

                {/* Score */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-center"
                >
                  <span className="font-[family-name:var(--font-accent)] text-4xl font-bold text-text-primary">
                    {results.score.toLocaleString()}
                  </span>
                  <p className="text-xs text-text-ghost uppercase tracking-[0.2em] mt-1">Final Score</p>
                </motion.div>

                {/* Stats */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex flex-wrap justify-center gap-3"
                >
                  {(mode === "word-drop"
                    ? [
                        { label: "Accuracy", value: `${Math.round(results.accuracy * 100)}%`, color: results.accuracy >= 0.9 ? "text-success" : "text-warning" },
                        { label: "Max Combo", value: `${results.maxCombo}x`, color: "text-accent-purple" },
                        { label: "Level", value: `${results.level ?? 1}`, color: "text-accent-cyan" },
                        { label: "Hits", value: `${results.hits ?? 0}`, color: "text-accent-blue" },
                      ]
                    : [
                        { label: "Accuracy", value: `${Math.round(results.accuracy * 100)}%`, color: results.accuracy >= 0.9 ? "text-success" : "text-warning" },
                        { label: "Perfect", value: `${results.perfects ?? 0}`, color: "text-accent-cyan" },
                        { label: "Great", value: `${results.greats ?? 0}`, color: "text-accent-blue" },
                        { label: "Combo", value: `${results.maxCombo}x`, color: "text-accent-pink" },
                      ]
                  ).map((stat) => (
                    <GlassPanel key={stat.label} className="px-5 py-3 text-center min-w-[100px]">
                      <span className={cn("font-[family-name:var(--font-accent)] text-xl font-bold", stat.color)}>
                        {stat.value}
                      </span>
                      <p className="text-[9px] text-text-ghost uppercase tracking-[0.2em] mt-0.5">{stat.label}</p>
                    </GlassPanel>
                  ))}
                </motion.div>

                {/* Actions */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="flex gap-3 mt-2"
                >
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleRestart}
                    className="bg-gradient-to-r from-accent-purple to-accent-pink border-accent-purple/20"
                  >
                    Play Again
                  </Button>
                  <Button variant="secondary" size="lg" onClick={() => setPhase("select")}>
                    Change Mode
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ScreenShake>
    </main>
  );
}
