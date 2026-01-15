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
type SortMode = "name" | "points" | "completion";

export default function App() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [achievements, setAchievements] = useState<AchievementSummary[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedAchievement, setSelectedAchievement] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCategories, setShowCategories] = useState(true);

  const [charProgress, setCharProgress] = useState<CharacterProgress | null>(null);
  const [mergeResult, setMergeResult] = useState<MergeResult | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("single");
  const [charLoading, setCharLoading] = useState(false);
  const [charError, setCharError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "completed" | "incomplete">("all");
  const [sort, setSort] = useState<SortMode>("name");

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
    if (saved) loadCharacter(saved.realm, saved.name);

    const savedMerge = getMergeSelection();
    if (savedMerge.length > 0) setMergeSelection(savedMerge);
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

  const categoryFiltered = selectedCategory
    ? achievements.filter((a) => a.categoryId === selectedCategory)
    : achievements;

  const searchResults = useSearch(categoryFiltered, searchQuery);
  const activeData = viewMode === "merged" && mergeResult ? mergeResult.merged : charProgress;
  const completedIds = activeData ? new Set(activeData.completed) : undefined;
  const progress = activeData?.progress;

  if (loading) return <div style={{ padding: 32, color: "var(--muted)" }}>Loading achievements...</div>;
  if (error) return <div style={{ padding: 32, color: "var(--danger)" }}>Error: {error}</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <header style={{ padding: "12px 16px", background: "var(--panel)", borderBottom: "1px solid var(--border)", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <button className="btn btn-ghost" onClick={() => setShowCategories(!showCategories)} title="Toggle categories">☰</button>
        <h1 style={{ margin: 0, fontSize: 18, color: "var(--accent)" }}>WoW Achievement Helper</h1>
        <input
          type="search"
          placeholder="Search achievements..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input"
          style={{ width: 200 }}
        />
        <CharacterLookup
          onLookup={loadCharacter}
          loading={charLoading}
          currentCharacter={viewMode === "single" ? charProgress?.character || null : null}
          onClear={handleClearCharacter}
        />
        {auth.loggedIn && <button className="btn" onClick={() => setShowCharSelector(true)}>My Characters</button>}
        {viewMode === "merged" && mergeResult && (
          <span className="badge badge-success">Merged ({mergeResult.sources.length})</span>
        )}
        {(charProgress || mergeResult) && (
          <>
            <select className="select" value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}>
              <option value="all">All</option>
              <option value="completed">Completed</option>
              <option value="incomplete">Incomplete</option>
            </select>
            <select className="select" value={sort} onChange={(e) => setSort(e.target.value as SortMode)}>
              <option value="name">Sort: Name</option>
              <option value="points">Sort: Points</option>
              <option value="completion">Sort: Completion</option>
            </select>
          </>
        )}
        {charProgress && viewMode === "single" && (
          <button className="btn" onClick={() => loadCharacter(charProgress.character.realm, charProgress.character.name)} disabled={charLoading}>Refresh</button>
        )}
        {mergeResult && viewMode === "merged" && (
          <button className="btn" onClick={() => loadMerge(mergeSelection)} disabled={charLoading}>Refresh</button>
        )}
        <div style={{ marginLeft: "auto" }}>
          <AuthButton loggedIn={auth.loggedIn} battletag={auth.battletag} onLogout={() => setAuth({ loggedIn: false })} />
        </div>
      </header>

      {charError && <div style={{ padding: "8px 16px", background: "rgba(248,81,73,0.15)", color: "var(--danger)" }}>{charError}</div>}

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {showCategories && (
          <aside style={{ width: 240, background: "var(--panel)", borderRight: "1px solid var(--border)", overflow: "auto" }}>
            <CategoryTree categories={categories} selectedId={selectedCategory} onSelect={setSelectedCategory} />
          </aside>
        )}
        <main style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "8px 16px", borderBottom: "1px solid var(--border)", color: "var(--muted)", fontSize: 13 }}>
            {searchResults.length} achievements {selectedCategory && "in category"}
          </div>
          <div style={{ flex: 1, overflow: "hidden" }}>
            <AchievementList
              achievements={searchResults}
              onSelect={setSelectedAchievement}
              completedIds={completedIds}
              progress={progress}
              filter={filter}
              sort={sort}
            />
          </div>
        </main>
        {selectedAchievement && (
          <aside style={{ width: 380, background: "var(--panel)", borderLeft: "1px solid var(--border)", overflow: "auto" }}>
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
