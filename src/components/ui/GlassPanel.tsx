"use client";

import { cn } from "@/lib/utils/cn";

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  intense?: boolean;
}

export function GlassPanel({ children, className, intense }: GlassPanelProps) {
  return (
    <div className={cn(intense ? "glass-intense" : "glass", "rounded-2xl", className)}>
      {children}
    </div>
  );
}
