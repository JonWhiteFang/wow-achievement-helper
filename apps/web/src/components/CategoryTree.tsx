import type { Category } from "../lib/api";

type Props = {
  categories: Category[];
  selectedId: number | null;
  onSelect: (id: number) => void;
};

export function CategoryTree({ categories, selectedId, onSelect }: Props) {
  const renderCategory = (cat: Category, depth = 0) => (
    <div key={cat.id}>
      <button
        onClick={() => onSelect(cat.id)}
        style={{
          display: "block",
          width: "100%",
          textAlign: "left",
          padding: "4px 8px",
          paddingLeft: `${8 + depth * 16}px`,
          border: "none",
          background: selectedId === cat.id ? "#e0e0e0" : "transparent",
          cursor: "pointer",
        }}
      >
        {cat.name}
      </button>
      {cat.children.map((c) => renderCategory(c, depth + 1))}
    </div>
  );

  return <div>{categories.map((c) => renderCategory(c))}</div>;
}
