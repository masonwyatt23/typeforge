"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TypingArea } from "@/components/typing/TypingArea";
import { WpmGauge } from "@/components/game/WpmGauge";
import { AccuracyMeter } from "@/components/game/AccuracyMeter";
import { ComboMeter } from "@/components/game/ComboMeter";
import { ProgressBar } from "@/components/game/ProgressBar";
import { Countdown } from "@/components/game/Countdown";
import { ResultsScreen } from "@/components/game/ResultsScreen";
import { ParticleCanvas } from "@/components/effects/ParticleCanvas";
import { ScreenShake } from "@/components/effects/ScreenShake";
import { FlowStateOverlay } from "@/components/effects/FlowStateOverlay";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Button } from "@/components/ui/Button";
import { useGameStore } from "@/stores/game-store";
import { useAudioStore } from "@/stores/audio-store";
import { useAudio } from "@/hooks/use-audio";
import { getRandomPassage, type PassageCategory } from "@/core/passages";
import { useStatsStore } from "@/stores/stats-store";
import { getComboTier } from "@/core/typing-engine";
import type { TypingResult } from "@/types/typing";
import type { Passage } from "@/types/game";
import { cn } from "@/lib/utils/cn";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

type GamePhase = "select" | "countdown" | "playing" | "results";
type Difficulty = "easy" | "medium" | "hard";

function PracticeContent() {
  const searchParams = useSearchParams();
  const isAiMode = searchParams.get("mode") === "ai";

  const [phase, setPhase] = useState<GamePhase>("select");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [category, setCategory] = useState<PassageCategory>("all");
  const [passage, setPassage] = useState<Passage | null>(null);
  const [result, setResult] = useState<TypingResult | null>(null);
  const [personalBests, setPersonalBests] = useState<{ isNewBestWpm: boolean; isNewBestAccuracy: boolean; isNewBestCombo: boolean } | undefined>();
  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  const [gameKey, setGameKey] = useState(0);
  const [aiTopic, setAiTopic] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiCoachMessage, setAiCoachMessage] = useState<string | null>(null);

  const { wpm, accuracy, combo, progress, reset: resetStore } = useGameStore();
  const { enabled: audioEnabled, toggle: toggleAudio } = useAudioStore();
  const { playSound } = useAudio();
  const recordGame = useStatsStore((s) => s.recordGame);

  const comboTier = getComboTier(combo);

  const runCountdown = useCallback(
    (onComplete: () => void) => {
      let count = 3;
      setCountdownValue(count);
      playSound("countdown-tick");

      const interval = setInterval(() => {
        count--;
        if (count > 0) {
          setCountdownValue(count);
          playSound("countdown-tick");
        } else if (count === 0) {
          setCountdownValue(0);
          playSound("countdown-go");
        } else {
          clearInterval(interval);
          setCountdownValue(null);
          onComplete();
        }
      }, 700);

      return () => clearInterval(interval);
    },
    [playSound]
  );

  const startGame = useCallback(
    (diff: Difficulty, customPassage?: Passage) => {
      const p = customPassage || getRandomPassage(diff, category);
      setPassage(p);
      setDifficulty(diff);
      setPhase("countdown");
      resetStore();
      setGameKey((k) => k + 1);
      setAiCoachMessage(null);
      setPersonalBests(undefined);
      runCountdown(() => setPhase("playing"));
    },
    [resetStore, runCountdown, category]
  );

  const startAiGame = useCallback(async () => {
    if (!aiTopic.trim()) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_passage",
          topic: aiTopic.trim(),
          difficulty,
        }),
      });
      const data = await res.json();
      if (data.passage) {
        const p: Passage = {
          id: `ai-${Date.now()}`,
          text: data.passage,
          source: `AI: ${aiTopic}`,
          difficulty,
          category: "ai",
          wordCount: data.passage.split(/\s+/).length,
          charCount: data.passage.length,
        };
        startGame(difficulty, p);
      }
    } catch {
      // Fallback to regular passage if AI fails
      startGame(difficulty);
    }
    setAiLoading(false);
  }, [aiTopic, difficulty, startGame]);

  const handleComplete = useCallback(
    async (r: TypingResult) => {
      setResult(r);
      setPhase("results");

      // Record stats and check for personal bests
      const pbs = recordGame(r, difficulty);
      setPersonalBests(pbs);

      // Get AI coaching feedback
      try {
        const res = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "coach",
            wpm: r.wpm,
            accuracy: Math.round(r.accuracy * 100),
            maxCombo: r.maxCombo,
            totalChars: r.totalChars,
            errors: r.incorrectChars,
          }),
        });
        const data = await res.json();
        if (data.message) setAiCoachMessage(data.message);
      } catch {
        // AI coaching is optional
      }
    },
    [recordGame, difficulty]
  );

  const handleRestart = useCallback(() => {
    if (!passage) return;
    setPhase("countdown");
    resetStore();
    setGameKey((k) => k + 1);
    setAiCoachMessage(null);
    runCountdown(() => setPhase("playing"));
  }, [passage, resetStore, runCountdown]);

  const handleNewPassage = useCallback(() => {
    if (isAiMode && aiTopic) {
      startAiGame();
    } else {
      startGame(difficulty);
    }
  }, [isAiMode, aiTopic, startAiGame, startGame, difficulty]);

  // Scroll to top on phase change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [phase]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && phase !== "select") {
        e.preventDefault();
        setPhase("select");
        resetStore();
        return;
      }
      if (phase === "results") {
        if (e.key === "Tab") {
          e.preventDefault();
          handleRestart();
        } else if (e.key === "Enter") {
          e.preventDefault();
          handleNewPassage();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [phase, handleRestart, handleNewPassage, resetStore]);

  return (
    <main className="h-screen flex flex-col overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-b from-bg-primary via-bg-primary to-bg-secondary -z-10" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(34,211,238,0.04)_0%,_transparent_50%)] -z-10" />

      <ParticleCanvas />

      {/* Screen glow */}
      <div
        className={`screen-glow transition-opacity duration-500 ${
          phase === "playing" && (comboTier === "unstoppable" || comboTier === "flow")
            ? comboTier === "unstoppable" ? "screen-glow-max" : "screen-glow-active"
            : comboTier === "hot" ? "screen-glow-active" : ""
        }`}
      />

      {phase === "playing" && <FlowStateOverlay tier={comboTier} combo={combo} />}

      <ScreenShake>
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 shrink-0">
          <Link href="/" className="font-[family-name:var(--font-accent)] text-base font-bold tracking-wider hover:opacity-80 transition-opacity">
            <span className="text-accent-cyan">TYPE</span>
            <span className="text-text-primary">FORGE</span>
          </Link>
          <Button variant="ghost" size="sm" onClick={toggleAudio}>
            {audioEnabled ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75 19.5 12m0 0 2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6 4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
              </svg>
            )}
          </Button>
        </header>

        {/* Main content - fixed height layout */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 md:px-8 min-h-0">
          <AnimatePresence mode="wait">
            {/* Mode selection */}
            {phase === "select" && (
              <motion.div
                key="select"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10, transition: { duration: 0.15 } }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center gap-6 max-w-xl w-full"
              >
                <div className="text-center">
                  <h2 className="font-[family-name:var(--font-accent)] text-xl font-bold tracking-widest text-text-primary">
                    {isAiMode ? "AI PASSAGES" : "SOLO PRACTICE"}
                  </h2>
                  <p className="text-text-secondary text-sm mt-2">
                    {isAiMode
                      ? "Enter a topic and AI will generate a custom typing passage"
                      : "Choose your difficulty and start typing"}
                  </p>
                </div>

                {/* Difficulty pills */}
                <div className="flex gap-2 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  {(["easy", "medium", "hard"] as const).map((diff) => (
                    <button
                      key={diff}
                      onClick={() => setDifficulty(diff)}
                      className={cn(
                        "px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer",
                        difficulty === diff
                          ? "bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/20"
                          : "text-text-secondary hover:text-text-primary hover:bg-white/5"
                      )}
                    >
                      {diff.charAt(0).toUpperCase() + diff.slice(1)}
                    </button>
                  ))}
                </div>

                {/* Category pills (non-AI mode) */}
                {!isAiMode && (
                  <div className="flex gap-1.5">
                    {(["all", "prose", "code", "quotes"] as const).map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setCategory(cat)}
                        className={cn(
                          "px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer",
                          category === cat
                            ? "bg-white/10 text-text-primary"
                            : "text-text-ghost hover:text-text-secondary"
                        )}
                      >
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </button>
                    ))}
                  </div>
                )}

                {/* AI topic input */}
                {isAiMode && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="w-full max-w-sm"
                  >
                    <div className="relative">
                      <input
                        type="text"
                        value={aiTopic}
                        onChange={(e) => setAiTopic(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && aiTopic.trim()) startAiGame();
                        }}
                        placeholder="Enter a topic... (e.g., space exploration, cooking, JavaScript)"
                        className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-text-primary text-sm placeholder:text-text-ghost focus:outline-none focus:border-accent-cyan/40 focus:ring-1 focus:ring-accent-cyan/20 transition-all"
                      />
                      {aiLoading && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="w-4 h-4 border-2 border-accent-cyan/30 border-t-accent-cyan rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Start button */}
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => {
                    if (isAiMode) {
                      startAiGame();
                    } else {
                      startGame(difficulty);
                    }
                  }}
                  disabled={isAiMode && !aiTopic.trim()}
                  className="min-w-[160px]"
                >
                  {aiLoading ? "Generating..." : "Start Typing"}
                </Button>
              </motion.div>
            )}

            {/* Countdown */}
            {phase === "countdown" && (
              <motion.div
                key="countdown"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.1 } }}
                className="max-w-3xl w-full"
              >
                <GlassPanel intense className="relative">
                  <div className="p-6 md:p-8 font-[family-name:var(--font-mono)] text-lg leading-[1.8] text-text-ghost select-none break-words">
                    {passage?.text}
                  </div>
                </GlassPanel>
                <Countdown count={countdownValue} />
              </motion.div>
            )}

            {/* Playing */}
            {phase === "playing" && passage && (
              <motion.div
                key={`playing-${gameKey}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="max-w-3xl w-full flex flex-col gap-4"
              >
                {/* HUD */}
                <div className="flex items-end justify-center gap-10">
                  <WpmGauge wpm={wpm} />
                  <ComboMeter combo={combo} tier={comboTier} />
                  <AccuracyMeter accuracy={accuracy} />
                </div>

                <ProgressBar progress={progress} tier={comboTier} />

                <GlassPanel intense className="relative">
                  <TypingArea
                    key={gameKey}
                    passage={passage.text}
                    onComplete={handleComplete}
                    isActive={true}
                  />
                </GlassPanel>

                <div className="flex justify-center">
                  <span className="text-[10px] text-text-ghost uppercase tracking-[0.25em]">
                    {passage.difficulty} &middot; {passage.wordCount} words
                    {passage.source && ` &middot; ${passage.source}`}
                  </span>
                </div>
              </motion.div>
            )}

            {/* Results */}
            {phase === "results" && result && (
              <motion.div
                key="results"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="max-w-2xl w-full"
              >
                <ResultsScreen
                  result={result}
                  onRestart={handleRestart}
                  onNewPassage={handleNewPassage}
                  personalBests={personalBests}
                />

                {/* AI Coach */}
                {aiCoachMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2 }}
                    className="mt-6"
                  >
                    <GlassPanel className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-1.5 rounded-lg bg-gradient-to-br from-accent-purple to-accent-pink text-white shrink-0">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.2em] text-accent-purple font-medium mb-1">AI Coach</p>
                          <p className="text-sm text-text-secondary leading-relaxed">{aiCoachMessage}</p>
                        </div>
                      </div>
                    </GlassPanel>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ScreenShake>
    </main>
  );
}

export default function PracticePage() {
  return (
    <Suspense fallback={null}>
      <PracticeContent />
    </Suspense>
  );
}
