"use client";

import { cn } from "@/lib/utils/cn";

interface AccuracyMeterProps {
  accuracy: number; // 0-1
  className?: string;
}

export function AccuracyMeter({ accuracy, className }: AccuracyMeterProps) {
  const pct = Math.round(accuracy * 100);
  const color =
    pct >= 98
      ? "text-success"
      : pct >= 95
        ? "text-accent-cyan"
        : pct >= 90
          ? "text-warning"
          : "text-error";

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <span
        className={cn(
          "font-[family-name:var(--font-accent)] text-2xl font-bold tabular-nums transition-colors duration-300",
          color
        )}
      >
        {pct}%
      </span>
      <span className="text-xs text-text-secondary uppercase tracking-widest">Accuracy</span>
    </div>
  );
}
