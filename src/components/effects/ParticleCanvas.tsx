"use client";

import { useEffect, useRef } from "react";
import { useParticles } from "@/hooks/use-particles";

export function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { initParticles } = useParticles();

  useEffect(() => {
    if (canvasRef.current) {
      initParticles(canvasRef.current);
    }
  }, [initParticles]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 50 }}
    />
  );
}
