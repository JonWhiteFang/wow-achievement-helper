import { useState } from "react";
import type { Category } from "../lib/api";

type Props = {
  categories: Category[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
};

export function CategoryTree({ categories, selectedId, onSelect }: Props) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

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

    return (
      <div key={cat.id}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "6px 8px",
            paddingLeft: 8 + depth * 16,
            background: isSelected ? "var(--panel-2)" : "transparent",
            borderLeft: isSelected ? "2px solid var(--accent)" : "2px solid transparent",
            cursor: "pointer",
          }}
        >
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
      {categories.map((c) => renderCategory(c))}
    </div>
  );
}
