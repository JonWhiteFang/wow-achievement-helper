import type { AchievementSummary, Category } from "../lib/api";

type Props = {
  achievements: AchievementSummary[];
  completedIds?: Set<number>;
  categories: Category[];
};

export function ProgressStats({ achievements, completedIds, categories }: Props) {
  const completed = completedIds?.size || 0;
  const total = achievements.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  let earnedPoints = 0;
  let totalPoints = 0;
  for (const a of achievements) {
    const pts = a.points || 0;
    totalPoints += pts;
    if (completedIds?.has(a.id)) earnedPoints += pts;
  }

  // Category stats (top-level only)
  const categoryStats = categories.slice(0, 5).map((cat) => {
    const catAchievements = achievements.filter((a) => a.categoryId === cat.id);
    const catCompleted = catAchievements.filter((a) => completedIds?.has(a.id)).length;
    const catPct = catAchievements.length > 0 ? Math.round((catCompleted / catAchievements.length) * 100) : 0;
    return { name: cat.name, completed: catCompleted, total: catAchievements.length, pct: catPct };
  }).filter((s) => s.total > 0);

  return (
    <div style={{ padding: 12, fontSize: 13 }}>
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span>Overall</span>
          <span>{completed.toLocaleString()} / {total.toLocaleString()} ({pct}%)</span>
        </div>
        <div style={{ height: 6, background: "var(--panel-2)", borderRadius: 3 }}>
          <div style={{ width: `${pct}%`, height: "100%", background: "var(--success)", borderRadius: 3 }} />
        </div>
      </div>
      <div style={{ marginBottom: 12, color: "var(--accent)" }}>
        {earnedPoints.toLocaleString()} / {totalPoints.toLocaleString()} points
      </div>
      {categoryStats.map((s) => (
        <div key={s.name} style={{ marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--muted)" }}>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 120 }}>{s.name}</span>
            <span>{s.pct}%</span>
          </div>
          <div style={{ height: 3, background: "var(--panel-2)", borderRadius: 2 }}>
            <div style={{ width: `${s.pct}%`, height: "100%", background: "var(--warning)", borderRadius: 2 }} />
          </div>
        </div>
      ))}
    </div>
  );
}
