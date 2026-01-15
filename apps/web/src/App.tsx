import { useEffect, useState } from "react";
import { fetchCategories, fetchCharacterAchievements, fetchAuthStatus, type Category, type AchievementSummary, type CharacterProgress, type AuthStatus } from "./lib/api";
import { getSavedCharacter, saveCharacter, clearSavedCharacter } from "./lib/storage";
import { CategoryTree } from "./components/CategoryTree";
import { AchievementList } from "./components/AchievementList";
import { AchievementDrawer } from "./components/AchievementDrawer";
import { CharacterLookup } from "./components/CharacterLookup";
import { AuthButton } from "./components/AuthButton";
import { CharacterSelector } from "./components/CharacterSelector";

export default function App() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [achievements, setAchievements] = useState<AchievementSummary[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedAchievement, setSelectedAchievement] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [charProgress, setCharProgress] = useState<CharacterProgress | null>(null);
  const [charLoading, setCharLoading] = useState(false);
  const [charError, setCharError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "completed" | "incomplete">("all");

  const [auth, setAuth] = useState<AuthStatus>({ loggedIn: false });
  const [showCharSelector, setShowCharSelector] = useState(false);

  useEffect(() => {
    fetchCategories()
      .then((data) => {
        setCategories(data.categories);
        setAchievements(data.achievements);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));

    fetchAuthStatus().then(setAuth);

    const saved = getSavedCharacter();
    if (saved) {
      loadCharacter(saved.realm, saved.name);
    }
  }, []);

  const loadCharacter = async (realm: string, name: string) => {
    setCharLoading(true);
    setCharError(null);
    try {
      const data = await fetchCharacterAchievements(realm, name);
      setCharProgress(data);
      saveCharacter({ realm: data.character.realm, name: data.character.name });
    } catch (e) {
      setCharError((e as Error).message);
    } finally {
      setCharLoading(false);
    }
  };

  const handleClearCharacter = () => {
    setCharProgress(null);
    setCharError(null);
    clearSavedCharacter();
    setFilter("all");
  };

  const handleLogout = () => {
    setAuth({ loggedIn: false });
  };

  const filteredAchievements = selectedCategory
    ? achievements.filter((a) => a.categoryId === selectedCategory)
    : achievements;

  const completedIds = charProgress ? new Set(charProgress.completed) : undefined;

  if (loading) return <div style={{ padding: "32px" }}>Loading achievements...</div>;
  if (error) return <div style={{ padding: "32px", color: "red" }}>Error: {error}</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", fontFamily: "system-ui" }}>
      <header style={{ padding: "12px 16px", borderBottom: "1px solid #ddd", display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
        <h1 style={{ margin: 0, fontSize: "18px" }}>WoW Achievement Helper</h1>
        <input
          type="search"
          placeholder="Search achievements..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ padding: "6px 12px", border: "1px solid #ccc", borderRadius: "4px", width: "200px" }}
        />
        <CharacterLookup
          onLookup={loadCharacter}
          loading={charLoading}
          currentCharacter={charProgress?.character || null}
          onClear={handleClearCharacter}
        />
        {auth.loggedIn && (
          <button onClick={() => setShowCharSelector(true)} style={{ padding: "6px 12px" }}>
            My Characters
          </button>
        )}
        {charProgress && (
          <select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} style={{ padding: "6px" }}>
            <option value="all">All</option>
            <option value="completed">Completed</option>
            <option value="incomplete">Incomplete</option>
          </select>
        )}
        {charProgress && (
          <button onClick={() => loadCharacter(charProgress.character.realm, charProgress.character.name)} disabled={charLoading} style={{ padding: "6px 12px" }}>
            Refresh
          </button>
        )}
        <div style={{ marginLeft: "auto" }}>
          <AuthButton loggedIn={auth.loggedIn} battletag={auth.battletag} onLogout={handleLogout} />
        </div>
      </header>
      {charError && <div style={{ padding: "8px 16px", background: "#ffebee", color: "#c62828" }}>{charError}</div>}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <aside style={{ width: "220px", borderRight: "1px solid #ddd", overflow: "auto" }}>
          <CategoryTree categories={categories} selectedId={selectedCategory} onSelect={setSelectedCategory} />
        </aside>
        <main style={{ flex: 1, overflow: "hidden" }}>
          <AchievementList
            achievements={filteredAchievements}
            onSelect={setSelectedAchievement}
            searchQuery={searchQuery}
            completedIds={completedIds}
            progress={charProgress?.progress}
            filter={filter}
          />
        </main>
        {selectedAchievement && (
          <aside style={{ width: "350px" }}>
            <AchievementDrawer achievementId={selectedAchievement} onClose={() => setSelectedAchievement(null)} />
          </aside>
        )}
      </div>
      {showCharSelector && (
        <CharacterSelector onSelect={loadCharacter} onClose={() => setShowCharSelector(false)} />
      )}
    </div>
  );
}
