import type { AchievementSummary } from "../lib/api";

type Props = {
  achievements: AchievementSummary[];
  onSelect: (id: number) => void;
  searchQuery: string;
  completedIds?: Set<number>;
  progress?: Record<number, { completedCriteria: number; totalCriteria: number }>;
  filter?: "all" | "completed" | "incomplete";
};

export function AchievementList({ achievements, onSelect, searchQuery, completedIds, progress, filter = "all" }: Props) {
  let filtered = searchQuery
    ? achievements.filter((a) => a.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : achievements;

  if (completedIds && filter !== "all") {
    filtered = filtered.filter((a) =>
      filter === "completed" ? completedIds.has(a.id) : !completedIds.has(a.id)
    );
  }

  if (filtered.length === 0) {
    return <div style={{ padding: "16px", color: "#666" }}>No achievements found</div>;
  }

  return (
    <div style={{ overflow: "auto", height: "100%" }}>
      {filtered.map((a) => {
        const isCompleted = completedIds?.has(a.id);
        const prog = progress?.[a.id];
        return (
          <button
            key={a.id}
            onClick={() => onSelect(a.id)}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
              textAlign: "left",
              padding: "8px 12px",
              border: "none",
              borderBottom: "1px solid #eee",
              background: isCompleted ? "#e8f5e9" : "white",
              cursor: "pointer",
            }}
          >
            <span>{a.name}</span>
            {isCompleted && <span style={{ color: "#4caf50", fontSize: "12px" }}>✓</span>}
            {!isCompleted && prog && (
              <span style={{ color: "#666", fontSize: "12px" }}>
                {prog.completedCriteria}/{prog.totalCriteria}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
