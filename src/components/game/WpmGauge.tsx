"use client";

import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";
import { cn } from "@/lib/utils/cn";

interface WpmGaugeProps {
  wpm: number;
  className?: string;
}

export function WpmGauge({ wpm, className }: WpmGaugeProps) {
  const springWpm = useSpring(0, { stiffness: 100, damping: 20 });
  const displayWpm = useTransform(springWpm, (v) => Math.round(v));

  useEffect(() => {
    springWpm.set(wpm);
  }, [wpm, springWpm]);

  const color =
    wpm >= 120
      ? "text-accent-purple"
      : wpm >= 80
        ? "text-accent-blue"
        : wpm >= 40
          ? "text-accent-cyan"
          : "text-text-secondary";

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <motion.span
        className={cn(
          "font-[family-name:var(--font-accent)] text-4xl font-bold tabular-nums transition-colors duration-300",
          color,
          wpm >= 120 && "neon-text"
        )}
      >
        {displayWpm}
      </motion.span>
      <span className="text-xs text-text-secondary uppercase tracking-widest">WPM</span>
    </div>
  );
}
