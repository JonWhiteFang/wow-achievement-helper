import { useEffect, useState } from "react";
import { fetchCategories, type Category, type AchievementSummary } from "./lib/api";
import { CategoryTree } from "./components/CategoryTree";
import { AchievementList } from "./components/AchievementList";
import { AchievementDrawer } from "./components/AchievementDrawer";

export default function App() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [achievements, setAchievements] = useState<AchievementSummary[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedAchievement, setSelectedAchievement] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories()
      .then((data) => {
        setCategories(data.categories);
        setAchievements(data.achievements);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filteredAchievements = selectedCategory
    ? achievements.filter((a) => a.categoryId === selectedCategory)
    : achievements;

  if (loading) return <div style={{ padding: "32px" }}>Loading achievements...</div>;
  if (error) return <div style={{ padding: "32px", color: "red" }}>Error: {error}</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", fontFamily: "system-ui" }}>
      <header style={{ padding: "12px 16px", borderBottom: "1px solid #ddd", display: "flex", gap: "16px", alignItems: "center" }}>
        <h1 style={{ margin: 0, fontSize: "18px" }}>WoW Achievement Helper</h1>
        <input
          type="search"
          placeholder="Search achievements..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ padding: "6px 12px", border: "1px solid #ccc", borderRadius: "4px", width: "300px" }}
        />
      </header>
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <aside style={{ width: "220px", borderRight: "1px solid #ddd", overflow: "auto" }}>
          <CategoryTree categories={categories} selectedId={selectedCategory} onSelect={setSelectedCategory} />
        </aside>
        <main style={{ flex: 1, overflow: "hidden" }}>
          <AchievementList achievements={filteredAchievements} onSelect={setSelectedAchievement} searchQuery={searchQuery} />
        </main>
        {selectedAchievement && (
          <aside style={{ width: "350px" }}>
            <AchievementDrawer achievementId={selectedAchievement} onClose={() => setSelectedAchievement(null)} />
          </aside>
        )}
      </div>
    </div>
  );
}
