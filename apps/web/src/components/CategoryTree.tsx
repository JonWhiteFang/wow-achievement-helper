import { useState, useMemo } from "react";
import type { Category, AchievementSummary } from "../lib/api";
import { computeCategoryStats } from "../lib/categoryStats";

type Props = {
  categories: Category[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  achievements?: AchievementSummary[];
  completedIds?: Set<number>;
  hasCompletedAt?: boolean;
};

export const RECENT_CATEGORY_ID = -1;

export function CategoryTree({ categories, selectedId, onSelect, achievements, completedIds, hasCompletedAt }: Props) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const stats = useMemo(
    () => (achievements ? computeCategoryStats(categories, achievements, completedIds) : null),
    [categories, achievements, completedIds]
  );

  const toggle = (id: number) => {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpanded(next);
  };

  const renderCategory = (cat: Category, depth = 0) => {
    const hasChildren = cat.children.length > 0;
    const isExpanded = expanded.has(cat.id);
    const isSelected = selectedId === cat.id;
    const catStats = stats?.get(cat.id);
    const pct = catStats && catStats.total > 0 ? Math.round((catStats.completed / catStats.total) * 100) : 0;

    return (
      <div key={cat.id}>
        <div
          style={{
            padding: "6px 8px",
            paddingLeft: 8 + depth * 16,
            background: isSelected ? "var(--panel-2)" : "transparent",
            borderLeft: isSelected ? "2px solid var(--accent)" : "2px solid transparent",
            cursor: "pointer",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            {hasChildren ? (
              <button
                onClick={() => toggle(cat.id)}
                style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", padding: 0, marginRight: 4, width: 16 }}
              >
                {isExpanded ? "▼" : "▶"}
              </button>
            ) : (
              <span style={{ width: 20 }} />
            )}
            <span
              onClick={() => onSelect(cat.id)}
              style={{ flex: 1, color: isSelected ? "var(--accent)" : "var(--text)" }}
            >
              {cat.name}
            </span>
          </div>
          {catStats && completedIds && catStats.total > 0 && (
            <div style={{ marginLeft: hasChildren ? 20 : 20, marginTop: 2 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ flex: 1, height: 3, background: "var(--panel-2)", borderRadius: 2 }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: pct === 100 ? "var(--success)" : "var(--warning)", borderRadius: 2 }} />
                </div>
                <span style={{ fontSize: 10, color: "var(--muted)", whiteSpace: "nowrap" }}>
                  {catStats.completed}/{catStats.total} ({pct}%)
                </span>
              </div>
            </div>
          )}
        </div>
        {hasChildren && isExpanded && cat.children.map((c) => renderCategory(c, depth + 1))}
      </div>
    );
  };

  return (
    <div style={{ padding: "8px 0" }}>
      <button
        onClick={() => onSelect(null)}
        style={{
          display: "block",
          width: "100%",
          textAlign: "left",
          padding: "6px 12px",
          background: selectedId === null ? "var(--panel-2)" : "transparent",
          border: "none",
          borderLeft: selectedId === null ? "2px solid var(--accent)" : "2px solid transparent",
          color: selectedId === null ? "var(--accent)" : "var(--text)",
          cursor: "pointer",
        }}
      >
        All Achievements
      </button>
      {hasCompletedAt && (
        <button
          onClick={() => onSelect(RECENT_CATEGORY_ID)}
          style={{
            display: "block",
            width: "100%",
            textAlign: "left",
            padding: "6px 12px",
            background: selectedId === RECENT_CATEGORY_ID ? "var(--panel-2)" : "transparent",
            border: "none",
            borderLeft: selectedId === RECENT_CATEGORY_ID ? "2px solid var(--accent)" : "2px solid transparent",
            color: selectedId === RECENT_CATEGORY_ID ? "var(--accent)" : "var(--success)",
            cursor: "pointer",
          }}
        >
          ⏱ Recently Completed
        </button>
      )}
      {categories.map((c) => renderCategory(c))}
    </div>
  );
}
