"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl" | "hero";
  animated?: boolean;
  showIcon?: boolean;
  className?: string;
}

const sizes = {
  sm: { text: "text-base", icon: 18, gap: "gap-1.5" },
  md: { text: "text-xl", icon: 22, gap: "gap-2" },
  lg: { text: "text-3xl", icon: 28, gap: "gap-2.5" },
  xl: { text: "text-5xl", icon: 40, gap: "gap-3" },
  hero: { text: "text-7xl md:text-8xl", icon: 56, gap: "gap-4" },
};

// The anvil/forge icon - represents "forging" your typing skills
function ForgeIcon({ size = 24, animated = false }: { size?: number; animated?: boolean }) {
  const icon = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Keyboard key shape with lightning bolt */}
      <defs>
        <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="50%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
        <linearGradient id="bolt-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#60a5fa" />
        </linearGradient>
      </defs>
      {/* Rounded key shape */}
      <rect
        x="2"
        y="4"
        width="28"
        height="24"
        rx="6"
        stroke="url(#logo-gradient)"
        strokeWidth="2"
        fill="none"
        opacity="0.6"
      />
      {/* Inner glow rect */}
      <rect
        x="4"
        y="6"
        width="24"
        height="20"
        rx="4"
        fill="url(#logo-gradient)"
        opacity="0.08"
      />
      {/* Lightning bolt - the "forge" */}
      <path
        d="M18 8L12 17H16L14 24L22 14H17L18 8Z"
        fill="url(#bolt-gradient)"
        stroke="url(#bolt-gradient)"
        strokeWidth="0.5"
        strokeLinejoin="round"
      />
    </svg>
  );

  if (!animated) return icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
    >
      <motion.div
        animate={{
          filter: [
            "drop-shadow(0 0 4px rgba(34, 211, 238, 0.3))",
            "drop-shadow(0 0 12px rgba(34, 211, 238, 0.5))",
            "drop-shadow(0 0 4px rgba(34, 211, 238, 0.3))",
          ],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        {icon}
      </motion.div>
    </motion.div>
  );
}

export function Logo({ size = "md", animated = false, showIcon = true, className }: LogoProps) {
  const s = sizes[size];

  const wordmark = (
    <span className={cn("font-[family-name:var(--font-accent)] font-bold tracking-wider", s.text)}>
      <span className="bg-gradient-to-r from-accent-cyan via-accent-blue to-accent-purple bg-clip-text text-transparent">
        TYPE
      </span>
      <span className="text-text-primary">FORGE</span>
    </span>
  );

  if (animated) {
    return (
      <div className={cn("flex items-center", s.gap, className)}>
        {showIcon && <ForgeIcon size={s.icon} animated />}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        >
          {size === "hero" ? (
            <motion.div
              animate={{
                textShadow: [
                  "0 0 20px rgba(34, 211, 238, 0.0)",
                  "0 0 40px rgba(34, 211, 238, 0.15)",
                  "0 0 20px rgba(34, 211, 238, 0.0)",
                ],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              {wordmark}
            </motion.div>
          ) : (
            wordmark
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center", s.gap, className)}>
      {showIcon && <ForgeIcon size={s.icon} />}
      {wordmark}
    </div>
  );
}

export { ForgeIcon };
