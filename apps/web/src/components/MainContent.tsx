import type { AchievementSummary } from "../lib/api";
import type { ViewMode, FilterMode, SortMode } from "../hooks";
import { formatPoints } from "../lib/points";
import { AchievementList } from "./AchievementList";

type Props = {
  achievements: AchievementSummary[];
  breadcrumbs: { id: number; name: string }[];
  onSelectCategory: (id: number | null) => void;
  onSelectAchievement: (id: number | null) => void;
  completedIds?: Set<number>;
  compareCompletedIds?: Set<number>;
  progress?: Record<number, { completedCriteria: number; totalCriteria: number }>;
  viewMode: ViewMode;
  filter: FilterMode;
  sort: SortMode;
  showDates: boolean;
  accountWideOnly: boolean;
  pinnedIds: Set<number>;
  onTogglePin: (id: number) => void;
  sectionPoints: { earned: number; total: number };
};

export function MainContent({
  achievements, breadcrumbs, onSelectCategory, onSelectAchievement,
  completedIds, compareCompletedIds, progress, viewMode, filter, sort,
  showDates, accountWideOnly, pinnedIds, onTogglePin, sectionPoints,
}: Props) {
  return (
    <main style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {breadcrumbs.length > 0 && (
        <div style={{ padding: "6px 16px", borderBottom: "1px solid var(--border)", fontSize: 12, display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
          <button className="btn btn-ghost" style={{ padding: "2px 6px", fontSize: 12 }} onClick={() => onSelectCategory(null)}>All</button>
          {breadcrumbs.map((b, i) => (
            <span key={b.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ color: "var(--muted)" }}>›</span>
              <button className="btn btn-ghost" style={{ padding: "2px 6px", fontSize: 12, color: i === breadcrumbs.length - 1 ? "var(--accent)" : undefined }} onClick={() => onSelectCategory(b.id)}>{b.name}</button>
            </span>
          ))}
        </div>
      )}
      <div style={{ padding: "8px 16px", borderBottom: "1px solid var(--border)", color: "var(--muted)", fontSize: 13 }}>
        {achievements.length} achievements{completedIds && ` (${formatPoints(sectionPoints.earned)} / ${formatPoints(sectionPoints.total)} pts)`}
      </div>
      <div style={{ flex: 1, overflow: "hidden" }}>
        <AchievementList
          achievements={achievements}
          onSelect={onSelectAchievement}
          completedIds={completedIds}
          compareCompletedIds={viewMode === "compare" ? compareCompletedIds : undefined}
          progress={progress}
          filter={viewMode === "compare" ? "all" : filter}
          sort={sort}
          showDates={showDates}
          accountWideOnly={accountWideOnly}
          pinnedIds={pinnedIds}
          onTogglePin={onTogglePin}
        />
      </div>
    </main>
  );
}
