import type { Category, AchievementSummary } from "./api";

export type CategoryStats = { total: number; completed: number };

export function computeCategoryStats(
  categories: Category[],
  achievements: AchievementSummary[],
  completedIds?: Set<number>
): Map<number, CategoryStats> {
  const result = new Map<number, CategoryStats>();
  const byCategory = new Map<number, number[]>();

  // Group achievement IDs by category
  for (const a of achievements) {
    const list = byCategory.get(a.categoryId) || [];
    list.push(a.id);
    byCategory.set(a.categoryId, list);
  }

  // Recursively compute stats for a category (includes children)
  function compute(cat: Category): CategoryStats {
    const direct = byCategory.get(cat.id) || [];
    let total = direct.length;
    let completed = completedIds ? direct.filter((id) => completedIds.has(id)).length : 0;

    for (const child of cat.children) {
      const childStats = compute(child);
      total += childStats.total;
      completed += childStats.completed;
    }

    const stats = { total, completed };
    result.set(cat.id, stats);
    return stats;
  }

  for (const cat of categories) compute(cat);
  return result;
}
