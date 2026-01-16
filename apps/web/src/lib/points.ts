import type { AchievementSummary } from "./api";

export function calculatePoints(achievements: AchievementSummary[], completedIds?: Set<number>): { earned: number; total: number } {
  let earned = 0;
  let total = 0;
  for (const a of achievements) {
    const pts = a.points || 0;
    total += pts;
    if (completedIds?.has(a.id)) earned += pts;
  }
  return { earned, total };
}

export function formatPoints(n: number): string {
  return n.toLocaleString();
}
