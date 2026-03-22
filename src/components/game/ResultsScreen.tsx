"use client";

import { motion } from "framer-motion";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Button } from "@/components/ui/Button";
import type { TypingResult } from "@/types/typing";
import { cn } from "@/lib/utils/cn";
import { useState } from "react";

interface PersonalBests {
  isNewBestWpm: boolean;
  isNewBestAccuracy: boolean;
  isNewBestCombo: boolean;
}

interface ResultsScreenProps {
  result: TypingResult;
  onRestart: () => void;
  onNewPassage: () => void;
  personalBests?: PersonalBests;
}

function getGrade(wpm: number, accuracy: number): { grade: string; color: string; message: string } {
  const score = wpm * accuracy;
  if (score >= 130) return { grade: "S+", color: "from-accent-pink via-accent-purple to-accent-cyan", message: "Absolutely legendary" };
  if (score >= 100) return { grade: "S", color: "from-accent-purple to-accent-pink", message: "Outstanding performance" };
  if (score >= 80) return { grade: "A", color: "from-accent-cyan to-accent-blue", message: "Excellent typing" };
  if (score >= 60) return { grade: "B", color: "from-accent-blue to-accent-purple", message: "Great work, keep pushing" };
  if (score >= 40) return { grade: "C", color: "from-success to-accent-cyan", message: "Solid effort" };
  return { grade: "D", color: "from-warning to-error", message: "Keep practicing, you'll get there" };
}

function PBBadge() {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0, rotate: -20 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.6 }}
      className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 text-[8px] font-bold text-black uppercase tracking-wider shadow-[0_0_12px_rgba(251,191,36,0.4)]"
    >
      NEW BEST
    </motion.span>
  );
}

function StatCard({
  label,
  value,
  unit,
  color,
  delay,
  isNewBest,
}: {
  label: string;
  value: string | number;
  unit?: string;
  color: string;
  delay: number;
  isNewBest?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative"
    >
      {isNewBest && <PBBadge />}
      <GlassPanel className={cn("px-6 py-5 flex flex-col items-center gap-1.5 min-w-[130px]", isNewBest && "border-yellow-400/20")}>
        <motion.span
          initial={{ opacity: 0, scale: 0.3 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: delay + 0.15, type: "spring", stiffness: 300, damping: 20 }}
          className={cn("font-[family-name:var(--font-accent)] text-3xl font-bold tabular-nums", color)}
        >
          {value}
          {unit && <span className="text-base ml-0.5 font-medium">{unit}</span>}
        </motion.span>
        <span className="text-[10px] text-text-secondary uppercase tracking-[0.2em]">{label}</span>
      </GlassPanel>
    </motion.div>
  );
}

function getWpmColor(wpm: number): string {
  if (wpm >= 120) return "text-accent-purple";
  if (wpm >= 80) return "text-accent-blue";
  if (wpm >= 40) return "text-accent-cyan";
  return "text-text-secondary";
}

function getAccuracyColor(accuracyPct: number): string {
  if (accuracyPct >= 98) return "text-success";
  if (accuracyPct >= 95) return "text-accent-cyan";
  if (accuracyPct >= 90) return "text-warning";
  return "text-error";
}

export function ResultsScreen({ result, onRestart, onNewPassage, personalBests }: ResultsScreenProps) {
  const [copied, setCopied] = useState(false);
  const accuracyPct = Math.round(result.accuracy * 100);
  const { grade, color: gradeColor, message } = getGrade(result.wpm, result.accuracy);

  const wpmColor = getWpmColor(result.wpm);
  const accuracyColor = getAccuracyColor(accuracyPct);

  const minutes = Math.floor(result.durationMs / 60000);
  const seconds = Math.round((result.durationMs % 60000) / 1000);
  const timeStr = minutes > 0 ? `${minutes}:${seconds.toString().padStart(2, "0")}` : `${seconds}s`;

  const handleShare = async () => {
    const text = `TypeForge: ${result.wpm} WPM | ${accuracyPct}% Accuracy | ${result.maxCombo}x Combo | Grade: ${grade}\nCan you beat me? typeforge.app`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for non-HTTPS
    }
  };

  const hasAnyPB = personalBests && (personalBests.isNewBestWpm || personalBests.isNewBestAccuracy || personalBests.isNewBestCombo);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center gap-6"
    >
      {/* Grade */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 15 }}
        className="text-center"
      >
        <span className={cn("font-[family-name:var(--font-accent)] text-7xl font-black bg-gradient-to-r bg-clip-text text-transparent", gradeColor)}>
          {grade}
        </span>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-text-secondary text-sm mt-1 tracking-wide"
        >
          {hasAnyPB ? "New personal best!" : message}
        </motion.p>
      </motion.div>

      {/* Stats */}
      <div className="flex flex-wrap justify-center gap-3">
        <StatCard label="Speed" value={result.wpm} unit="wpm" color={wpmColor} delay={0.25} isNewBest={personalBests?.isNewBestWpm} />
        <StatCard label="Accuracy" value={`${accuracyPct}`} unit="%" color={accuracyColor} delay={0.35} isNewBest={personalBests?.isNewBestAccuracy} />
        <StatCard label="Max Combo" value={result.maxCombo} unit="x" color="text-accent-purple" delay={0.45} isNewBest={personalBests?.isNewBestCombo} />
        <StatCard label="Time" value={timeStr} color="text-text-primary" delay={0.55} />
      </div>

      {/* Character breakdown */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="flex items-center gap-4 text-xs text-text-ghost"
      >
        <span><span className="text-accent-cyan">{result.correctChars}</span> correct</span>
        <span className="text-text-ghost/30">|</span>
        <span><span className="text-error">{result.incorrectChars}</span> errors</span>
        <span className="text-text-ghost/30">|</span>
        <span>raw <span className="text-text-secondary">{result.rawWpm}</span> wpm</span>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="flex gap-3 mt-2"
      >
        <Button variant="primary" size="lg" onClick={onRestart}>
          Retry
        </Button>
        <Button variant="secondary" size="lg" onClick={onNewPassage}>
          New Passage
        </Button>
        <button
          onClick={handleShare}
          className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-text-secondary hover:text-text-primary hover:bg-white/10 transition-all cursor-pointer text-sm"
          title="Copy results to clipboard"
        >
          {copied ? (
            <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
            </svg>
          )}
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="flex items-center gap-3 text-[10px] text-text-ghost"
      >
        <span className="flex items-center gap-1">
          <kbd className="px-1 py-0.5 rounded bg-white/5 border border-white/10 font-[family-name:var(--font-mono)]">Tab</kbd>
          retry
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1 py-0.5 rounded bg-white/5 border border-white/10 font-[family-name:var(--font-mono)]">Enter</kbd>
          new passage
        </span>
      </motion.div>
    </motion.div>
  );
}
