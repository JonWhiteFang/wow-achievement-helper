import type { AchievementSummary } from "../lib/api";

type Props = {
  achievements: AchievementSummary[];
  onSelect: (id: number) => void;
  searchQuery: string;
};

export function AchievementList({ achievements, onSelect, searchQuery }: Props) {
  const filtered = searchQuery
    ? achievements.filter((a) => a.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : achievements;

  if (filtered.length === 0) {
    return <div style={{ padding: "16px", color: "#666" }}>No achievements found</div>;
  }

  return (
    <div style={{ overflow: "auto", height: "100%" }}>
      {filtered.map((a) => (
        <button
          key={a.id}
          onClick={() => onSelect(a.id)}
          style={{
            display: "block",
            width: "100%",
            textAlign: "left",
            padding: "8px 12px",
            border: "none",
            borderBottom: "1px solid #eee",
            background: "white",
            cursor: "pointer",
          }}
        >
          {a.name}
        </button>
      ))}
    </div>
  );
}
