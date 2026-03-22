"use client";

import { useRef, useCallback, useEffect } from "react";
import { AudioEngine, type SoundId } from "@/lib/audio/audio-engine";
import { useAudioStore } from "@/stores/audio-store";

export function useAudio() {
  const engineRef = useRef<AudioEngine | null>(null);
  const { enabled, volume } = useAudioStore();
  const initializedRef = useRef(false);

  const initAudio = useCallback(async () => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    const engine = AudioEngine.getInstance();
    await engine.init();
    engineRef.current = engine;
  }, []);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.volume = volume;
      engineRef.current.enabled = enabled;
    }
  }, [volume, enabled]);

  const playSound = useCallback(
    (id: SoundId, options?: { pitch?: number; volume?: number }) => {
      if (!enabled) return;

      // Lazy init on first sound play
      if (!engineRef.current) {
        const engine = AudioEngine.getInstance();
        engine.init().then(() => {
          engineRef.current = engine;
          engine.volume = volume;
          engine.enabled = enabled;
          engine.play(id, options);
        });
        initializedRef.current = true;
        return;
      }

      engineRef.current.play(id, options);
    },
    [enabled, volume]
  );

  return { playSound, initAudio };
}
