import { FixedSizeList as List } from "react-window";
import type { AchievementSummary } from "../lib/api";

type Props = {
  achievements: AchievementSummary[];
  onSelect: (id: number) => void;
  completedIds?: Set<number>;
  progress?: Record<number, { completedCriteria: number; totalCriteria: number }>;
  filter?: "all" | "completed" | "incomplete";
};

const ROW_HEIGHT = 40;

export function AchievementList({ achievements, onSelect, completedIds, progress, filter = "all" }: Props) {
  let filtered = achievements;

  if (completedIds && filter !== "all") {
    filtered = filtered.filter((a) =>
      filter === "completed" ? completedIds.has(a.id) : !completedIds.has(a.id)
    );
  }

  if (filtered.length === 0) {
    return <div style={{ padding: "16px", color: "#666" }}>No achievements found</div>;
  }

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const a = filtered[index];
    const isCompleted = completedIds?.has(a.id);
    const prog = progress?.[a.id];

    return (
      <button
        style={{
          ...style,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
          textAlign: "left",
          padding: "0 12px",
          border: "none",
          borderBottom: "1px solid #eee",
          background: isCompleted ? "#e8f5e9" : "white",
          cursor: "pointer",
          boxSizing: "border-box",
        }}
        onClick={() => onSelect(a.id)}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</span>
        {isCompleted && <span style={{ color: "#4caf50", fontSize: "12px", flexShrink: 0 }}>✓</span>}
        {!isCompleted && prog && (
          <span style={{ color: "#666", fontSize: "12px", flexShrink: 0 }}>
            {prog.completedCriteria}/{prog.totalCriteria}
          </span>
        )}
      </button>
    );
  };

  return (
    <List
      height={window.innerHeight - 60}
      itemCount={filtered.length}
      itemSize={ROW_HEIGHT}
      width="100%"
    >
      {Row}
    </List>
  );
}
