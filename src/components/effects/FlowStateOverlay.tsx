"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ComboTier } from "@/types/typing";

interface FlowStateOverlayProps {
  tier: ComboTier;
  combo: number;
}

export function FlowStateOverlay({ tier, combo }: FlowStateOverlayProps) {
  const showFlash =
    (tier === "flow" && combo === 50) ||
    (tier === "unstoppable" && combo === 100);

  const text = combo >= 100 ? "UNSTOPPABLE" : "FLOW STATE";
  const gradient =
    combo >= 100
      ? "from-accent-pink via-accent-purple to-accent-cyan"
      : "from-accent-purple via-accent-pink to-accent-purple";

  return (
    <AnimatePresence>
      {showFlash && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="fixed inset-0 flex items-center justify-center pointer-events-none z-60"
        >
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: [0, 1, 1, 0], y: [20, 0, 0, -20] }}
            transition={{ duration: 1.5, times: [0, 0.2, 0.7, 1] }}
            className={`font-[family-name:var(--font-accent)] text-6xl font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent neon-text tracking-widest`}
          >
            {text}
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
