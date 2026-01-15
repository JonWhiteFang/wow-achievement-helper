import { useEffect, useState } from "react";
import { fetchManifest, fetchCharacterAchievements, fetchAuthStatus, mergeCharacters, type Category, type AchievementSummary, type CharacterProgress, type AuthStatus, type MergeResult } from "./lib/api";
import { getSavedCharacter, saveCharacter, clearSavedCharacter, getMergeSelection, saveMergeSelection, clearMergeSelection } from "./lib/storage";
import { useSearch } from "./lib/search";
import { CategoryTree } from "./components/CategoryTree";
import { AchievementList } from "./components/AchievementList";
import { AchievementDrawer } from "./components/AchievementDrawer";
import { CharacterLookup } from "./components/CharacterLookup";
import { AuthButton } from "./components/AuthButton";
import { CharacterSelector } from "./components/CharacterSelector";

type ViewMode = "single" | "merged";

export default function App() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [achievements, setAchievements] = useState<AchievementSummary[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedAchievement, setSelectedAchievement] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [charProgress, setCharProgress] = useState<CharacterProgress | null>(null);
  const [mergeResult, setMergeResult] = useState<MergeResult | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("single");
  const [charLoading, setCharLoading] = useState(false);
  const [charError, setCharError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "completed" | "incomplete">("all");

  const [auth, setAuth] = useState<AuthStatus>({ loggedIn: false });
  const [showCharSelector, setShowCharSelector] = useState(false);
  const [mergeSelection, setMergeSelection] = useState<{ realm: string; name: string }[]>([]);

  useEffect(() => {
    fetchManifest()
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

    const savedMerge = getMergeSelection();
    if (savedMerge.length > 0) {
      setMergeSelection(savedMerge);
    }
  }, []);

  const loadCharacter = async (realm: string, name: string) => {
    setCharLoading(true);
    setCharError(null);
    setViewMode("single");
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

  const loadMerge = async (characters: { realm: string; name: string }[]) => {
    setCharLoading(true);
    setCharError(null);
    setViewMode("merged");
    setMergeSelection(characters);
    saveMergeSelection(characters);
    try {
      const data = await mergeCharacters(characters);
      setMergeResult(data);
    } catch (e) {
      setCharError((e as Error).message);
    } finally {
      setCharLoading(false);
    }
  };

  const handleClearCharacter = () => {
    setCharProgress(null);
    setMergeResult(null);
    setCharError(null);
    clearSavedCharacter();
    clearMergeSelection();
    setMergeSelection([]);
    setFilter("all");
    setViewMode("single");
  };

  const handleLogout = () => {
    setAuth({ loggedIn: false });
  };

  const categoryFiltered = selectedCategory
    ? achievements.filter((a) => a.categoryId === selectedCategory)
    : achievements;

  const searchResults = useSearch(categoryFiltered, searchQuery);

  const activeData = viewMode === "merged" && mergeResult ? mergeResult.merged : charProgress;
  const completedIds = activeData ? new Set(activeData.completed) : undefined;
  const progress = activeData?.progress;

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
          currentCharacter={viewMode === "single" ? charProgress?.character || null : null}
          onClear={handleClearCharacter}
        />
        {auth.loggedIn && (
          <button onClick={() => setShowCharSelector(true)} style={{ padding: "6px 12px" }}>
            My Characters
          </button>
        )}
        {viewMode === "merged" && mergeResult && (
          <span style={{ fontSize: "14px", color: "#666" }}>
            Merged ({mergeResult.sources.length} chars)
          </span>
        )}
        {(charProgress || mergeResult) && (
          <select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} style={{ padding: "6px" }}>
            <option value="all">All</option>
            <option value="completed">Completed</option>
            <option value="incomplete">Incomplete</option>
          </select>
        )}
        {charProgress && viewMode === "single" && (
          <button onClick={() => loadCharacter(charProgress.character.realm, charProgress.character.name)} disabled={charLoading} style={{ padding: "6px 12px" }}>
            Refresh
          </button>
        )}
        {mergeResult && viewMode === "merged" && (
          <button onClick={() => loadMerge(mergeSelection)} disabled={charLoading} style={{ padding: "6px 12px" }}>
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
            achievements={searchResults}
            onSelect={setSelectedAchievement}
            completedIds={completedIds}
            progress={progress}
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
        <CharacterSelector
          onSelect={loadCharacter}
          onMerge={loadMerge}
          onClose={() => setShowCharSelector(false)}
          initialSelection={mergeSelection}
        />
      )}
    </div>
  );
}
