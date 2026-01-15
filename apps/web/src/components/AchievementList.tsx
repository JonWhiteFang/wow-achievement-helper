import { FixedSizeList as List } from "react-window";
import { useRef, useEffect, useState } from "react";
import type { AchievementSummary } from "../lib/api";

type Props = {
  achievements: AchievementSummary[];
  onSelect: (id: number) => void;
  completedIds?: Set<number>;
  progress?: Record<number, { completedCriteria: number; totalCriteria: number }>;
  filter?: "all" | "completed" | "incomplete";
  sort?: "name" | "points" | "completion";
};

const ROW_HEIGHT = 44;

export function AchievementList({ achievements, onSelect, completedIds, progress, filter = "all", sort = "name" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(400);

  useEffect(() => {
    const update = () => {
      if (containerRef.current) setHeight(containerRef.current.clientHeight);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  let filtered = achievements;
  if (completedIds && filter !== "all") {
    filtered = filtered.filter((a) => (filter === "completed" ? completedIds.has(a.id) : !completedIds.has(a.id)));
  }

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "points") return (b.points || 0) - (a.points || 0);
    if (sort === "completion" && completedIds) {
      const ac = completedIds.has(a.id) ? 1 : 0;
      const bc = completedIds.has(b.id) ? 1 : 0;
      if (ac !== bc) return ac - bc;
    }
    return a.name.localeCompare(b.name);
  });

  if (sorted.length === 0) {
    return <div style={{ padding: 16, color: "var(--muted)" }}>No achievements found</div>;
  }

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const a = sorted[index];
    const isCompleted = completedIds?.has(a.id);
    const prog = progress?.[a.id];
    const pct = prog ? Math.round((prog.completedCriteria / prog.totalCriteria) * 100) : 0;

    return (
      <button
        style={{
          ...style,
          display: "flex",
          alignItems: "center",
          gap: 12,
          width: "100%",
          textAlign: "left",
          padding: "0 16px",
          border: "none",
          borderBottom: "1px solid var(--border)",
          background: "transparent",
          color: "var(--text)",
          cursor: "pointer",
        }}
        onClick={() => onSelect(a.id)}
      >
        <span style={{ width: 20, color: isCompleted ? "var(--success)" : "var(--muted)", fontSize: 16 }}>
          {isCompleted ? "✓" : "○"}
        </span>
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</span>
        {!isCompleted && prog && (
          <div style={{ width: 80, display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ flex: 1, height: 4, background: "var(--panel-2)", borderRadius: 2 }}>
              <div style={{ width: `${pct}%`, height: "100%", background: "var(--warning)", borderRadius: 2 }} />
            </div>
            <span style={{ fontSize: 11, color: "var(--muted)", width: 28 }}>{pct}%</span>
          </div>
        )}
        <span style={{ color: "var(--muted)", fontSize: 12, width: 32, textAlign: "right" }}>{a.points || 0}</span>
      </button>
    );
  };

  return (
    <div ref={containerRef} style={{ height: "100%" }}>
      <List height={height} itemCount={sorted.length} itemSize={ROW_HEIGHT} width="100%">
        {Row}
      </List>
    </div>
  );
}
