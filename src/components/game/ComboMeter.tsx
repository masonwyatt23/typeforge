"use client";

import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import type { ComboTier } from "@/types/typing";

interface ComboMeterProps {
  combo: number;
  tier: ComboTier;
  className?: string;
}

const tierColors: Record<ComboTier, string> = {
  none: "text-text-ghost",
  building: "text-accent-cyan",
  hot: "text-accent-purple",
  flow: "text-accent-pink",
  unstoppable: "text-accent-pink",
};

export function ComboMeter({ combo, tier, className }: ComboMeterProps) {
  if (combo < 2) return null;

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <AnimatePresence mode="popLayout">
        <motion.span
          key={combo}
          initial={{ scale: 1.4, opacity: 0.7 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 25 }}
          className={cn(
            "font-[family-name:var(--font-accent)] text-3xl font-bold tabular-nums transition-colors duration-200",
            tierColors[tier],
            tier === "unstoppable" && "neon-text"
          )}
        >
          {combo}x
        </motion.span>
      </AnimatePresence>
      <span className="text-xs text-text-secondary uppercase tracking-widest">Combo</span>
    </div>
  );
}
