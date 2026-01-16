import { useEffect, useState, useMemo } from "react";
import { Routes, Route, useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchManifest, fetchCharacterAchievements, fetchAuthStatus, mergeCharacters, type Category, type CharacterProgress, type AuthStatus, type MergeResult } from "./lib/api";
import { getSavedCharacter, saveCharacter, clearSavedCharacter, getMergeSelection, saveMergeSelection, clearMergeSelection, getRecentCategories, addRecentCategory, getTheme, setTheme, type RecentCategory } from "./lib/storage";
import { getPins, togglePin } from "./lib/pins";
import { useSearch } from "./lib/search";
import { calculatePoints, formatPoints } from "./lib/points";
import { buildCategoryExpansionMap, EXPANSIONS, EXPANSION_LABELS, type Expansion } from "./lib/expansions";
import { CategoryTree, RECENT_CATEGORY_ID } from "./components/CategoryTree";
import { ProgressStats } from "./components/ProgressStats";
import { ExportButtons } from "./components/ExportButtons";
import { AchievementList } from "./components/AchievementList";
import { AchievementDrawer } from "./components/AchievementDrawer";
import { CharacterLookup } from "./components/CharacterLookup";
import { AuthButton } from "./components/AuthButton";
import { CharacterSelector } from "./components/CharacterSelector";

type ViewMode = "single" | "merged" | "compare";
type SortMode = "name" | "points" | "completion";
type RewardType = "all" | "title" | "mount" | "pet" | "toy" | "transmog" | "other";
type CompareFilter = "all" | "onlyA" | "onlyB" | "both" | "neither";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.matchMedia("(max-width: 768px)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isMobile;
}

function AppContent() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { categoryId, achievementId } = useParams();
  const isMobile = useIsMobile();

  const selectedCategory = categoryId ? parseInt(categoryId, 10) : null;
  const selectedAchievement = achievementId ? parseInt(achievementId, 10) : null;

  const [searchQuery, setSearchQuery] = useState("");
  const [showCategories, setShowCategories] = useState(!isMobile);

  const [charProgress, setCharProgress] = useState<CharacterProgress | null>(null);
  const [compareProgress, setCompareProgress] = useState<CharacterProgress | null>(null);
  const [mergeResult, setMergeResult] = useState<MergeResult | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("single");
  const [charLoading, setCharLoading] = useState(false);
  const [charError, setCharError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "completed" | "incomplete" | "near" | "pinned">("all");
  const [compareFilter, setCompareFilter] = useState<CompareFilter>("all");
  const [sort, setSort] = useState<SortMode>("name");
  const [expansion, setExpansion] = useState<Expansion | "all">("all");
  const [accountWideOnly, setAccountWideOnly] = useState(false);
  const [rewardFilter, setRewardFilter] = useState<RewardType>("all");

  const [auth, setAuth] = useState<AuthStatus>({ loggedIn: false });
  const [sessionExpired, setSessionExpired] = useState(false);
  const [showCharSelector, setShowCharSelector] = useState(false);
  const [showCompareSelector, setShowCompareSelector] = useState(false);
  const [mergeSelection, setMergeSelection] = useState<{ realm: string; name: string }[]>([]);
  const [recentCategories, setRecentCategories] = useState<RecentCategory[]>([]);
  const [theme, setThemeState] = useState<"dark" | "light">("dark");
  const [pinnedIds, setPinnedIds] = useState<Set<number>>(new Set());

  const { data: manifest, isLoading: loading, error } = useQuery({
    queryKey: ["manifest"],
    queryFn: fetchManifest,
  });

  const categories = manifest?.categories ?? [];
  const achievements = manifest?.achievements ?? [];

  useEffect(() => {
    fetchAuthStatus().then((status) => {
      setAuth(status);
      if (status.sessionExpired) setSessionExpired(true);
    });

    const charParam = searchParams.get("character");
    if (charParam) {
      const [realm, name] = charParam.split("/");
      if (realm && name) loadCharacter(realm, name);
    } else {
      const saved = getSavedCharacter();
      if (saved) loadCharacter(saved.realm, saved.name);
    }

    const savedMerge = getMergeSelection();
    if (savedMerge.length > 0) setMergeSelection(savedMerge);

    setRecentCategories(getRecentCategories());

    const savedTheme = getTheme();
    setThemeState(savedTheme);
    document.documentElement.dataset.theme = savedTheme;

    setPinnedIds(getPins());
  }, []);

  // Close mobile drawer when switching to desktop
  useEffect(() => {
    if (!isMobile) setShowCategories(true);
  }, [isMobile]);

  const loadCharacter = async (realm: string, name: string) => {
    setCharLoading(true);
    setCharError(null);
    setViewMode("single");
    setCompareProgress(null);
    try {
      const data = await fetchCharacterAchievements(realm, name);
      setCharProgress(data);
      saveCharacter({ realm: data.character.realm, name: data.character.name });
      setSearchParams({ character: `${data.character.realm}/${data.character.name}` });
    } catch (e) {
      setCharError((e as Error).message);
    } finally {
      setCharLoading(false);
    }
  };

  const loadCompareCharacter = async (realm: string, name: string) => {
    setCharLoading(true);
    setCharError(null);
    try {
      const data = await fetchCharacterAchievements(realm, name);
      setCompareProgress(data);
      setViewMode("compare");
      setShowCompareSelector(false);
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
      searchParams.delete("character");
      setSearchParams(searchParams);
    } catch (e) {
      setCharError((e as Error).message);
    } finally {
      setCharLoading(false);
    }
  };

  const handleClearCharacter = () => {
    setCharProgress(null);
    setCompareProgress(null);
    setMergeResult(null);
    setCharError(null);
    clearSavedCharacter();
    clearMergeSelection();
    setMergeSelection([]);
    setFilter("all");
    setCompareFilter("all");
    setViewMode("single");
    searchParams.delete("character");
    setSearchParams(searchParams);
  };

  const exitCompareMode = () => {
    setCompareProgress(null);
    setViewMode("single");
    setCompareFilter("all");
  };

  const activeData = viewMode === "merged" && mergeResult ? mergeResult.merged : charProgress;
  const completedIds = activeData ? new Set(activeData.completed) : undefined;
  const completedAt = activeData?.completedAt;
  const progress = activeData?.progress;
  const compareCompletedIds = compareProgress ? new Set(compareProgress.completed) : undefined;

  const categoryExpansionMap = useMemo(() => buildCategoryExpansionMap(categories), [categories]);

  // Get recent achievements (last 20 by completion date)
  const getRecentAchievements = () => {
    if (!completedAt || !completedIds) return [];
    const withDates = achievements
      .filter((a) => completedIds.has(a.id) && completedAt[a.id])
      .map((a) => ({ ...a, completedAt: completedAt[a.id] }))
      .sort((a, b) => b.completedAt - a.completedAt)
      .slice(0, 20);
    return withDates;
  };

  let categoryFiltered = selectedCategory === RECENT_CATEGORY_ID
    ? getRecentAchievements()
    : selectedCategory
      ? achievements.filter((a) => a.categoryId === selectedCategory)
      : achievements;

  // Apply expansion filter
  if (expansion !== "all") {
    categoryFiltered = categoryFiltered.filter((a) => categoryExpansionMap.get(a.categoryId) === expansion);
  }

  // Apply reward filter
  if (rewardFilter !== "all") {
    categoryFiltered = categoryFiltered.filter((a) => a.rewardType === rewardFilter);
  }

  // Apply compare filter
  if (viewMode === "compare" && completedIds && compareCompletedIds && compareFilter !== "all") {
    categoryFiltered = categoryFiltered.filter((a) => {
      const hasA = completedIds.has(a.id);
      const hasB = compareCompletedIds.has(a.id);
      if (compareFilter === "onlyA") return hasA && !hasB;
      if (compareFilter === "onlyB") return hasB && !hasA;
      if (compareFilter === "both") return hasA && hasB;
      if (compareFilter === "neither") return !hasA && !hasB;
      return true;
    });
  }

  const getBreadcrumbs = (): { id: number; name: string }[] => {
    if (!selectedCategory) return [];
    const path: { id: number; name: string }[] = [];
    const findPath = (cats: Category[], targetId: number): boolean => {
      for (const cat of cats) {
        if (cat.id === targetId) {
          path.push({ id: cat.id, name: cat.name });
          return true;
        }
        if (cat.children && findPath(cat.children, targetId)) {
          path.unshift({ id: cat.id, name: cat.name });
          return true;
        }
      }
      return false;
    };
    findPath(categories, selectedCategory);
    return path;
  };

  const handleCategorySelect = (id: number | null) => {
    if (isMobile) setShowCategories(false);
    if (id) {
      navigate(selectedAchievement ? `/category/${id}/achievement/${selectedAchievement}` : `/category/${id}`);
      const findCat = (cats: Category[]): Category | null => {
        for (const c of cats) {
          if (c.id === id) return c;
          if (c.children) {
            const found = findCat(c.children);
            if (found) return found;
          }
        }
        return null;
      };
      const found = findCat(categories);
      if (found) {
        addRecentCategory({ id: found.id, name: found.name });
        setRecentCategories(getRecentCategories());
      }
    } else {
      navigate(selectedAchievement ? `/achievement/${selectedAchievement}` : "/");
    }
  };

  const handleAchievementSelect = (id: number | null) => {
    if (id) {
      navigate(selectedCategory ? `/category/${selectedCategory}/achievement/${id}` : `/achievement/${id}`);
    } else {
      navigate(selectedCategory ? `/category/${selectedCategory}` : "/");
    }
  };

  const breadcrumbs = getBreadcrumbs();
  const searchResults = useSearch(categoryFiltered, searchQuery);

  const totalPoints = calculatePoints(achievements, completedIds);
  const sectionPoints = calculatePoints(searchResults, completedIds);

  if (loading) return <div style={{ padding: 32, color: "var(--muted)" }}>Loading achievements...</div>;
  if (error) return <div style={{ padding: 32, color: "var(--danger)" }}>Error: {(error as Error).message}</div>;

  const categorySidebar = (
    <>
      {recentCategories.length > 0 && (
        <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>Recent</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {recentCategories.map((c) => (
              <button key={c.id} className="btn btn-ghost" style={{ fontSize: 11, padding: "2px 6px" }} onClick={() => handleCategorySelect(c.id)}>{c.name}</button>
            ))}
          </div>
        </div>
      )}
      <CategoryTree categories={categories} selectedId={selectedCategory} onSelect={handleCategorySelect} achievements={achievements} completedIds={completedIds} hasCompletedAt={!!completedAt && Object.keys(completedAt).length > 0} />
      {completedIds && completedIds.size > 0 && (
        <div style={{ borderTop: "1px solid var(--border)", marginTop: 8 }}>
          <ProgressStats achievements={achievements} completedIds={completedIds} categories={categories} />
        </div>
      )}
    </>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <header style={{ padding: isMobile ? "8px 12px" : "12px 16px", background: "var(--panel)", borderBottom: "1px solid var(--border)", display: "flex", gap: isMobile ? 8 : 12, alignItems: "center", flexWrap: "wrap" }}>
        <button className="btn btn-ghost" onClick={() => setShowCategories(!showCategories)} title="Toggle categories">☰</button>
        <h1 style={{ margin: 0, fontSize: isMobile ? 16 : 18, color: "var(--accent)", flex: isMobile ? "1 1 auto" : "none" }}>WoW Achievements</h1>
        {!isMobile && (
          <input
            type="search"
            placeholder="Search achievements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input"
            style={{ width: 200 }}
          />
        )}
        <CharacterLookup
          onLookup={loadCharacter}
          loading={charLoading}
          currentCharacter={viewMode === "single" ? charProgress?.character || null : null}
          onClear={handleClearCharacter}
        />
        {auth.loggedIn && <button className="btn" onClick={() => setShowCharSelector(true)}>{isMobile ? "Chars" : "My Characters"}</button>}
        {charProgress && viewMode !== "compare" && (
          <button className="btn" onClick={() => setShowCompareSelector(true)} title="Compare with another character">⚔️ Compare</button>
        )}
        {viewMode === "compare" && compareProgress && (
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span className="badge" style={{ background: "rgba(88,166,255,0.2)", color: "#58a6ff" }}>
              vs {compareProgress.character.name}
            </span>
            <button className="btn btn-ghost" onClick={exitCompareMode} style={{ padding: "2px 6px" }}>×</button>
          </div>
        )}
        {viewMode === "merged" && mergeResult && (
          <span className="badge badge-success">Merged ({mergeResult.sources.length})</span>
        )}
        {completedIds && (
          <span className="badge" style={{ background: "rgba(201,162,39,0.2)", color: "var(--accent)" }}>
            {formatPoints(totalPoints.earned)} / {formatPoints(totalPoints.total)} pts
          </span>
        )}
        {(charProgress || mergeResult) && (
          <>
            {viewMode !== "compare" && (
              <select className="select" value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} style={{ minWidth: isMobile ? 80 : undefined }}>
                <option value="all">All</option>
                <option value="completed">Done</option>
                <option value="incomplete">Todo</option>
                <option value="near">{isMobile ? "80%+" : "Near 80%+"}</option>
                <option value="pinned">Pinned</option>
              </select>
            )}
            {viewMode === "compare" && (
              <select className="select" value={compareFilter} onChange={(e) => setCompareFilter(e.target.value as CompareFilter)} style={{ minWidth: isMobile ? 80 : undefined }}>
                <option value="all">All</option>
                <option value="onlyA">Only {charProgress?.character.name}</option>
                <option value="onlyB">Only {compareProgress?.character.name}</option>
                <option value="both">Both have</option>
                <option value="neither">Neither has</option>
              </select>
            )}
            <select className="select" value={sort} onChange={(e) => setSort(e.target.value as SortMode)} style={{ minWidth: isMobile ? 80 : undefined }}>
              <option value="name">Name</option>
              <option value="points">Points</option>
              <option value="completion">Status</option>
            </select>
          </>
        )}
        <select className="select" value={expansion} onChange={(e) => setExpansion(e.target.value as Expansion | "all")} style={{ minWidth: isMobile ? 70 : undefined }}>
          <option value="all">All Xpacs</option>
          {EXPANSIONS.map((e) => <option key={e} value={e}>{EXPANSION_LABELS[e]}</option>)}
        </select>
        <select className="select" value={rewardFilter} onChange={(e) => setRewardFilter(e.target.value as RewardType)} style={{ minWidth: isMobile ? 70 : undefined }}>
          <option value="all">All Rewards</option>
          <option value="title">Title</option>
          <option value="mount">Mount</option>
          <option value="pet">Pet</option>
          <option value="toy">Toy</option>
          <option value="transmog">Transmog</option>
          <option value="other">Other</option>
        </select>
        <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, cursor: "pointer" }}>
          <input type="checkbox" checked={accountWideOnly} onChange={(e) => setAccountWideOnly(e.target.checked)} />
          {isMobile ? "Acct" : "Account-wide"}
        </label>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          {completedIds && completedIds.size > 0 && (
            <ExportButtons achievements={achievements} completedIds={completedIds} completedAt={completedAt} characterName={charProgress?.character.name} />
          )}
          <button
            className="btn btn-ghost"
            onClick={() => { const newTheme = theme === "dark" ? "light" : "dark"; setThemeState(newTheme); setTheme(newTheme); }}
            title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            style={{ padding: "4px 8px" }}
          >{theme === "dark" ? "☀️" : "🌙"}</button>
          <AuthButton loggedIn={auth.loggedIn} battletag={auth.battletag} onLogout={() => setAuth({ loggedIn: false })} />
        </div>
      </header>

      {isMobile && (
        <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)" }}>
          <input
            type="search"
            placeholder="Search achievements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input"
            style={{ width: "100%" }}
          />
        </div>
      )}

      {sessionExpired && (
        <div style={{ padding: "8px 16px", background: "rgba(210,153,34,0.15)", color: "var(--warning)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>Session expired. Please log in again.</span>
          <button className="btn btn-ghost" onClick={() => setSessionExpired(false)} style={{ padding: "2px 8px" }}>×</button>
        </div>
      )}
      {charError && <div style={{ padding: "8px 16px", background: "rgba(248,81,73,0.15)", color: "var(--danger)" }}>{charError}</div>}

      <div style={{ display: "flex", flex: 1, overflow: "hidden", position: "relative" }}>
        {/* Mobile category drawer */}
        {isMobile && showCategories && (
          <div className="mobile-backdrop" onClick={() => setShowCategories(false)} />
        )}
        {isMobile ? (
          <aside className={`mobile-drawer ${showCategories ? "open" : ""}`}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 600 }}>Categories</span>
              <button className="btn btn-ghost" onClick={() => setShowCategories(false)}>×</button>
            </div>
            {categorySidebar}
          </aside>
        ) : (
          showCategories && (
            <aside style={{ width: 240, background: "var(--panel)", borderRight: "1px solid var(--border)", overflow: "auto" }}>
              {categorySidebar}
            </aside>
          )
        )}

        <main style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {breadcrumbs.length > 0 && (
            <div style={{ padding: "6px 16px", borderBottom: "1px solid var(--border)", fontSize: 12, display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
              <button className="btn btn-ghost" style={{ padding: "2px 6px", fontSize: 12 }} onClick={() => handleCategorySelect(null)}>All</button>
              {breadcrumbs.map((b, i) => (
                <span key={b.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ color: "var(--muted)" }}>›</span>
                  <button className="btn btn-ghost" style={{ padding: "2px 6px", fontSize: 12, color: i === breadcrumbs.length - 1 ? "var(--accent)" : undefined }} onClick={() => handleCategorySelect(b.id)}>{b.name}</button>
                </span>
              ))}
            </div>
          )}
          <div style={{ padding: "8px 16px", borderBottom: "1px solid var(--border)", color: "var(--muted)", fontSize: 13 }}>
            {searchResults.length} achievements{completedIds && ` (${formatPoints(sectionPoints.earned)} / ${formatPoints(sectionPoints.total)} pts)`}
          </div>
          <div style={{ flex: 1, overflow: "hidden" }}>
            <AchievementList
              achievements={searchResults}
              onSelect={handleAchievementSelect}
              completedIds={completedIds}
              compareCompletedIds={viewMode === "compare" ? compareCompletedIds : undefined}
              progress={progress}
              filter={viewMode === "compare" ? "all" : filter}
              sort={sort}
              showDates={selectedCategory === RECENT_CATEGORY_ID}
              accountWideOnly={accountWideOnly}
              pinnedIds={pinnedIds}
              onTogglePin={(id) => setPinnedIds(togglePin(id))}
            />
          </div>
        </main>

        {/* Achievement drawer - full screen on mobile */}
        {selectedAchievement && (
          isMobile ? (
            <div className="mobile-fullscreen">
              <AchievementDrawer 
                achievementId={selectedAchievement} 
                onClose={() => handleAchievementSelect(null)} 
                completedIds={completedIds}
                onSelectAchievement={handleAchievementSelect}
                isPinned={pinnedIds.has(selectedAchievement)}
                onTogglePin={() => setPinnedIds(togglePin(selectedAchievement))}
              />
            </div>
          ) : (
            <aside style={{ width: 380, background: "var(--panel)", borderLeft: "1px solid var(--border)", overflow: "auto" }}>
              <AchievementDrawer 
                achievementId={selectedAchievement} 
                onClose={() => handleAchievementSelect(null)} 
                completedIds={completedIds}
                onSelectAchievement={handleAchievementSelect}
                isPinned={pinnedIds.has(selectedAchievement)}
                onTogglePin={() => setPinnedIds(togglePin(selectedAchievement))}
              />
            </aside>
          )
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

      {showCompareSelector && (
        <div className="modal-backdrop" onClick={() => setShowCompareSelector(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Compare with...</h3>
              <button className="btn btn-ghost" onClick={() => setShowCompareSelector(false)}>×</button>
            </div>
            <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 16 }}>
              Select a character to compare against {charProgress?.character.name}
            </p>
            <CharacterLookup
              onLookup={loadCompareCharacter}
              loading={charLoading}
              currentCharacter={null}
              onClear={() => {}}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AppContent />} />
      <Route path="/category/:categoryId" element={<AppContent />} />
      <Route path="/achievement/:achievementId" element={<AppContent />} />
      <Route path="/category/:categoryId/achievement/:achievementId" element={<AppContent />} />
    </Routes>
  );
}
