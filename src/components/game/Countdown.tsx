"use client";

import { AnimatePresence, motion } from "framer-motion";

interface CountdownProps {
  count: number | null;
}

export function Countdown({ count }: CountdownProps) {
  const isGo = count === 0;

  return (
    <AnimatePresence>
      {count !== null && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Darkened backdrop during countdown */}
          <motion.div
            className="absolute inset-0 bg-bg-primary/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <AnimatePresence mode="popLayout">
            <motion.div
              key={count}
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex items-center justify-center"
            >
              {/* Glow ring */}
              <motion.div
                className={`absolute w-32 h-32 rounded-full ${
                  isGo ? "bg-accent-cyan/10" : "bg-accent-blue/10"
                }`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1.2, opacity: [0, 0.5, 0] }}
                transition={{ duration: 0.6 }}
              />

              <span
                className={`font-[family-name:var(--font-accent)] font-black relative z-10 ${
                  isGo
                    ? "text-8xl bg-gradient-to-r from-accent-cyan to-accent-blue bg-clip-text text-transparent"
                    : "text-8xl text-text-primary"
                }`}
                style={
                  isGo
                    ? { textShadow: "0 0 40px rgba(34, 211, 238, 0.5), 0 0 80px rgba(34, 211, 238, 0.2)" }
                    : { textShadow: "0 0 20px rgba(255, 255, 255, 0.1)" }
                }
              >
                {isGo ? "GO" : count}
              </span>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
