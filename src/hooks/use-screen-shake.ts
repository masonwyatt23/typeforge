"use client";

import { useCallback, useEffect, useRef } from "react";

export function useScreenShake() {
  const frameRef = useRef<number | null>(null);

  const shake = useCallback((intensity = 3, duration = 150) => {
    const root = document.documentElement;
    const startTime = performance.now();

    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
    }

    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const decay = 1 - progress;

      const x = (Math.random() - 0.5) * 2 * intensity * decay;
      const y = (Math.random() - 0.5) * 2 * intensity * decay;

      root.style.setProperty("--shake-x", `${x}px`);
      root.style.setProperty("--shake-y", `${y}px`);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        root.style.setProperty("--shake-x", "0px");
        root.style.setProperty("--shake-y", "0px");
        frameRef.current = null;
      }
    };

    frameRef.current = requestAnimationFrame(animate);
  }, []);

  // Cleanup on unmount — cancel animation and reset CSS vars
  useEffect(() => {
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        document.documentElement.style.setProperty("--shake-x", "0px");
        document.documentElement.style.setProperty("--shake-y", "0px");
      }
    };
  }, []);

  return { shake };
}
