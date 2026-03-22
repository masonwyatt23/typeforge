import type { ComboTier } from "@/types/typing";
import { getComboTier } from "@/core/typing-engine";

export interface ComboVisualState {
  tier: ComboTier;
  bgClass: string;
  glowClass: string;
  particleMultiplier: number;
}

const TIER_CONFIG: Record<ComboTier, ComboVisualState> = {
  none: {
    tier: "none",
    bgClass: "",
    glowClass: "",
    particleMultiplier: 1,
  },
  building: {
    tier: "building",
    bgClass: "combo-bg-building",
    glowClass: "",
    particleMultiplier: 1.5,
  },
  hot: {
    tier: "hot",
    bgClass: "combo-bg-hot",
    glowClass: "screen-glow screen-glow-active",
    particleMultiplier: 2.5,
  },
  flow: {
    tier: "flow",
    bgClass: "combo-bg-flow",
    glowClass: "screen-glow screen-glow-active",
    particleMultiplier: 4,
  },
  unstoppable: {
    tier: "unstoppable",
    bgClass: "combo-bg-unstoppable",
    glowClass: "screen-glow screen-glow-max",
    particleMultiplier: 5,
  },
};

export function getComboVisuals(combo: number): ComboVisualState {
  const tier = getComboTier(combo);
  return TIER_CONFIG[tier];
}

// Get accent colors for current combo tier (for particles)
export function getComboColors(combo: number): string[] {
  const tier = getComboTier(combo);
  switch (tier) {
    case "none":
    case "building":
      return ["#22d3ee", "#3b82f6", "#60a5fa"];
    case "hot":
      return ["#3b82f6", "#a855f7", "#818cf8"];
    case "flow":
      return ["#a855f7", "#ec4899", "#c084fc"];
    case "unstoppable":
      return ["#ec4899", "#22d3ee", "#a855f7", "#fbbf24"];
  }
}

// Get combo milestone pitch multiplier
export function getComboMilestonePitch(combo: number): number {
  if (combo >= 100) return 2;    // C6
  if (combo >= 50) return 1.5;   // G5
  if (combo >= 25) return 1.25;  // E5
  return 1;                       // C5
}
