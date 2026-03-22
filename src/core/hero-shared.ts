// Shared types and utilities for Hero Mode game engines

import { COMBO_TIERS } from "@/lib/utils/constants";

export type TimingRating = "perfect" | "great" | "good" | "miss";

export function getRatingColor(rating: TimingRating): string {
  switch (rating) {
    case "perfect": return "text-accent-cyan";
    case "great": return "text-accent-blue";
    case "good": return "text-accent-purple";
    case "miss": return "text-error";
  }
}

const COMBO_MILESTONES: number[] = [
  COMBO_TIERS.BUILDING,
  COMBO_TIERS.HOT,
  COMBO_TIERS.FLOW,
  COMBO_TIERS.UNSTOPPABLE,
];

export function isComboMilestone(combo: number): boolean {
  return COMBO_MILESTONES.includes(combo);
}
