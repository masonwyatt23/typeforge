"use client";

import { useRef, useCallback, useEffect } from "react";
import { ParticleSystem } from "@/lib/effects/particle-system";

export function useParticles() {
  const systemRef = useRef<ParticleSystem | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const initParticles = useCallback((canvas: HTMLCanvasElement) => {
    if (systemRef.current) return;
    const system = new ParticleSystem();
    system.init(canvas);
    systemRef.current = system;
    canvasRef.current = canvas;
  }, []);

  const spawn = useCallback(
    (preset: string, x: number, y: number, rateMultiplier = 1) => {
      systemRef.current?.spawn(preset, x, y, rateMultiplier);
    },
    []
  );

  const clear = useCallback(() => {
    systemRef.current?.clear();
  }, []);

  useEffect(() => {
    return () => {
      systemRef.current?.destroy();
      systemRef.current = null;
    };
  }, []);

  return { initParticles, spawn, clear };
}
