"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import type { ComboTier } from "@/types/typing";

interface ProgressBarProps {
  progress: number; // 0-1
  tier: ComboTier;
  className?: string;
}

const tierGradients: Record<ComboTier, string> = {
  none: "from-accent-cyan to-accent-blue",
  building: "from-accent-cyan to-accent-blue",
  hot: "from-accent-blue to-accent-purple",
  flow: "from-accent-purple to-accent-pink",
  unstoppable: "from-accent-pink via-accent-purple to-accent-cyan",
};

export function ProgressBar({ progress, tier, className }: ProgressBarProps) {
  return (
    <div className={cn("w-full h-1.5 bg-white/5 rounded-full overflow-hidden", className)}>
      <motion.div
        className={cn("h-full rounded-full bg-gradient-to-r", tierGradients[tier])}
        initial={{ width: 0 }}
        animate={{ width: `${progress * 100}%` }}
        transition={{ duration: 0.1, ease: "linear" }}
      />
    </div>
  );
}
