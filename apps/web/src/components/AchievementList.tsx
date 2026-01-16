import { FixedSizeList as List } from "react-window";
import { useRef, useEffect, useState } from "react";
import type { AchievementSummary } from "../lib/api";
import { formatCompletionDate } from "../lib/dates";

type AchievementWithDate = AchievementSummary & { completedAt?: number };

type Props = {
  achievements: AchievementWithDate[];
  onSelect: (id: number) => void;
  completedIds?: Set<number>;
  progress?: Record<number, { completedCriteria: number; totalCriteria: number }>;
  filter?: "all" | "completed" | "incomplete" | "near";
  sort?: "name" | "points" | "completion";
  showDates?: boolean;
  accountWideOnly?: boolean;
};

const ROW_HEIGHT = 44;

function AchievementIcon({ src, size = 20 }: { src?: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  const style = { width: size, height: size, borderRadius: 4, background: "var(--panel-2)", flexShrink: 0 };
  
  if (!src || failed) {
    return <div style={{ ...style, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontSize: size * 0.6 }}>⭐</div>;
  }
  return <img src={src} alt="" loading="lazy" style={{ ...style, objectFit: "cover" }} onError={() => setFailed(true)} />;
}

export function AchievementList({ achievements, onSelect, completedIds, progress, filter = "all", sort = "name", showDates, accountWideOnly }: Props) {
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
  if (accountWideOnly) {
    filtered = filtered.filter((a) => a.isAccountWide);
  }
  if (completedIds && filter !== "all") {
    if (filter === "completed") {
      filtered = filtered.filter((a) => completedIds.has(a.id));
    } else if (filter === "incomplete") {
      filtered = filtered.filter((a) => !completedIds.has(a.id));
    } else if (filter === "near" && progress) {
      filtered = filtered.filter((a) => {
        if (completedIds.has(a.id)) return false;
        const p = progress[a.id];
        return p && p.totalCriteria > 0 && p.completedCriteria / p.totalCriteria >= 0.8;
      });
    }
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

    // For meta achievements, count completed children
    const completedChildren = a.isMeta && a.childAchievementIds && completedIds 
      ? a.childAchievementIds.filter(id => completedIds.has(id)).length 
      : 0;
    const totalChildren = a.childAchievementIds?.length || 0;

    return (
      <button
        style={{
          ...style,
          display: "flex",
          alignItems: "center",
          gap: 8,
          width: "100%",
          textAlign: "left",
          padding: "0 16px",
          border: "none",
          borderBottom: "1px solid var(--border)",
          background: "transparent",
          color: "var(--text)",
          cursor: "pointer",
        }}
        className={a.isMeta ? "achievement-meta" : ""}
        onClick={() => onSelect(a.id)}
      >
        <AchievementIcon src={a.icon} size={20} />
        <span style={{ width: 16, color: isCompleted ? "var(--success)" : "var(--muted)", fontSize: 14 }}>
          {isCompleted ? "✓" : "○"}
        </span>
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</span>
        {a.isMeta && <span className="badge badge-meta">META</span>}
        {showDates && a.completedAt && (
          <span style={{ fontSize: 11, color: "var(--muted)", whiteSpace: "nowrap" }}>{formatCompletionDate(a.completedAt)}</span>
        )}
        {!isCompleted && a.isMeta && totalChildren > 0 && (
          <span style={{ fontSize: 11, color: "var(--muted)", whiteSpace: "nowrap" }}>{completedChildren}/{totalChildren}</span>
        )}
        {!isCompleted && !a.isMeta && prog && (
          <div style={{ width: 80, display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ flex: 1, height: 4, background: "var(--panel-2)", borderRadius: 2 }}>
              <div style={{ width: `${pct}%`, height: "100%", background: "var(--warning)", borderRadius: 2 }} />
            </div>
            <span style={{ fontSize: 11, color: "var(--muted)", width: 28 }}>{pct}%</span>
          </div>
        )}
        {!showDates && <span style={{ color: "var(--muted)", fontSize: 12, width: 32, textAlign: "right" }}>{a.points || 0}</span>}
        <a
          href={`https://www.wowhead.com/achievement=${a.id}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="wowhead-link"
          title="View on Wowhead"
        >↗</a>
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
