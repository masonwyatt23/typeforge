"use client";

import { cn } from "@/lib/utils/cn";

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  intense?: boolean;
  style?: React.CSSProperties;
}

export function GlassPanel({ children, className, intense, style }: GlassPanelProps) {
  return (
    <div className={cn(intense ? "glass-intense" : "glass", "rounded-2xl", className)} style={style}>
      {children}
    </div>
  );
}
