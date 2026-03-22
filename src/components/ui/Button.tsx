"use client";

import { cn } from "@/lib/utils/cn";

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  disabled?: boolean;
}

export function Button({
  children,
  onClick,
  variant = "primary",
  size = "md",
  className,
  disabled,
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative font-medium rounded-xl transition-all duration-200 cursor-pointer",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan/50",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "hover:scale-[1.02] active:scale-[0.98]",
        {
          "bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20 hover:bg-accent-cyan/20 hover:border-accent-cyan/40":
            variant === "primary",
          "bg-white/5 text-text-primary border border-white/10 hover:bg-white/10":
            variant === "secondary",
          "bg-transparent text-text-secondary hover:text-text-primary hover:bg-white/5":
            variant === "ghost",
        },
        {
          "px-3 py-1.5 text-sm": size === "sm",
          "px-5 py-2.5 text-sm": size === "md",
          "px-8 py-3 text-base": size === "lg",
        },
        className
      )}
    >
      {children}
    </button>
  );
}
