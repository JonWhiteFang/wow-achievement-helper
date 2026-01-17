import type { Category, AchievementSummary } from "../lib/api";
import type { RecentCategory } from "../lib/storage";
import { CategoryTree } from "./CategoryTree";
import { ProgressStats } from "./ProgressStats";

type Props = {
  categories: Category[];
  achievements: AchievementSummary[];
  selectedCategory: number | null;
  onSelectCategory: (id: number | null) => void;
  completedIds?: Set<number>;
  recentCategories: RecentCategory[];
  hasCompletedAt: boolean;
};

export function Sidebar({ categories, achievements, selectedCategory, onSelectCategory, completedIds, recentCategories, hasCompletedAt }: Props) {
  return (
    <>
      {recentCategories.length > 0 && (
        <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>Recent</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {recentCategories.map((c) => (
              <button key={c.id} className="btn btn-ghost" style={{ fontSize: 11, padding: "2px 6px" }} onClick={() => onSelectCategory(c.id)}>{c.name}</button>
            ))}
          </div>
        </div>
      )}
      <CategoryTree
        categories={categories}
        selectedId={selectedCategory}
        onSelect={onSelectCategory}
        achievements={achievements}
        completedIds={completedIds}
        hasCompletedAt={hasCompletedAt}
      />
      {completedIds && completedIds.size > 0 && (
        <div style={{ borderTop: "1px solid var(--border)", marginTop: 8 }}>
          <ProgressStats achievements={achievements} completedIds={completedIds} categories={categories} />
        </div>
      )}
    </>
  );
}

type MobileSidebarProps = Props & {
  isOpen: boolean;
  onClose: () => void;
};

export function MobileSidebar({ isOpen, onClose, ...props }: MobileSidebarProps) {
  return (
    <>
      {isOpen && <div className="mobile-backdrop" onClick={onClose} />}
      <aside className={`mobile-drawer ${isOpen ? "open" : ""}`}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 600 }}>Categories</span>
          <button className="btn btn-ghost" onClick={onClose}>×</button>
        </div>
        <Sidebar {...props} />
      </aside>
    </>
  );
}
