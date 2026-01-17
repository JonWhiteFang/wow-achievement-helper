import { useEffect, useState, useMemo } from "react";
import { Routes, Route, useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchManifest, type Category } from "./lib/api";
import { useFilters, useCharacterProgress, useAppState } from "./hooks";
import { useSearch } from "./lib/search";
import { calculatePoints } from "./lib/points";
import { buildCategoryExpansionMap } from "./lib/expansions";
import { Header, MobileSearchBar } from "./components/Header";
import { Sidebar, MobileSidebar } from "./components/Sidebar";
import { MainContent } from "./components/MainContent";
import { AchievementDrawer } from "./components/AchievementDrawer";
import { CharacterLookup } from "./components/CharacterLookup";
import { CharacterSelector } from "./components/CharacterSelector";
import { AchievementListSkeleton } from "./components/Skeleton";
import { RECENT_CATEGORY_ID } from "./components/CategoryTree";

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
  const { categoryId, achievementId } = useParams();
  const isMobile = useIsMobile();

  const selectedCategory = categoryId ? parseInt(categoryId, 10) : null;
  const selectedAchievement = achievementId ? parseInt(achievementId, 10) : null;

  const [searchQuery, setSearchQuery] = useState("");
  const [showCategories, setShowCategories] = useState(!isMobile);
  const [showCharSelector, setShowCharSelector] = useState(false);
  const [showCompareSelector, setShowCompareSelector] = useState(false);

  const filters = useFilters();
  const character = useCharacterProgress();
  const appState = useAppState();

  const { data: manifest, isLoading: loading, error } = useQuery({
    queryKey: ["manifest"],
    queryFn: fetchManifest,
  });

  const categories = manifest?.categories ?? [];
  const achievements = manifest?.achievements ?? [];

  // Initialize character from URL/storage on mount
  useEffect(() => {
    const saved = character.initFromUrl();
    if (saved) character.loadCharacter(saved.realm, saved.name);
  }, []);

  useEffect(() => {
    if (!isMobile) setShowCategories(true);
  }, [isMobile]);

  const activeData = character.activeData;
  const completedIds = activeData ? new Set(activeData.completed) : undefined;
  const completedAt = activeData?.completedAt;
  const progress = activeData?.progress;
  const compareCompletedIds = character.compareProgress ? new Set(character.compareProgress.completed) : undefined;

  const categoryExpansionMap = useMemo(() => buildCategoryExpansionMap(categories), [categories]);

  const getRecentAchievements = () => {
    if (!completedAt || !completedIds) return [];
    return achievements
      .filter((a) => completedIds.has(a.id) && completedAt[a.id])
      .map((a) => ({ ...a, completedAt: completedAt[a.id] }))
      .sort((a, b) => b.completedAt - a.completedAt)
      .slice(0, 20);
  };

  let categoryFiltered = selectedCategory === RECENT_CATEGORY_ID
    ? getRecentAchievements()
    : selectedCategory
      ? achievements.filter((a) => a.categoryId === selectedCategory)
      : achievements;

  if (filters.expansion !== "all") {
    categoryFiltered = categoryFiltered.filter((a) => categoryExpansionMap.get(a.categoryId) === filters.expansion);
  }
  if (filters.rewardFilter !== "all") {
    categoryFiltered = categoryFiltered.filter((a) => a.rewardType === filters.rewardFilter);
  }
  if (character.viewMode === "compare" && completedIds && compareCompletedIds && filters.compareFilter !== "all") {
    categoryFiltered = categoryFiltered.filter((a) => {
      const hasA = completedIds.has(a.id);
      const hasB = compareCompletedIds.has(a.id);
      if (filters.compareFilter === "onlyA") return hasA && !hasB;
      if (filters.compareFilter === "onlyB") return hasB && !hasA;
      if (filters.compareFilter === "both") return hasA && hasB;
      if (filters.compareFilter === "neither") return !hasA && !hasB;
      return true;
    });
  }

  const getBreadcrumbs = (): { id: number; name: string }[] => {
    if (!selectedCategory) return [];
    const path: { id: number; name: string }[] = [];
    const findPath = (cats: Category[], targetId: number): boolean => {
      for (const cat of cats) {
        if (cat.id === targetId) { path.push({ id: cat.id, name: cat.name }); return true; }
        if (cat.children && findPath(cat.children, targetId)) { path.unshift({ id: cat.id, name: cat.name }); return true; }
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
          if (c.children) { const found = findCat(c.children); if (found) return found; }
        }
        return null;
      };
      const found = findCat(categories);
      if (found) appState.addRecent({ id: found.id, name: found.name });
    } else {
      navigate(selectedAchievement ? `/achievement/${selectedAchievement}` : "/");
    }
  };

  const handleAchievementSelect = (id: number | null) => {
    if (id) navigate(selectedCategory ? `/category/${selectedCategory}/achievement/${id}` : `/achievement/${id}`);
    else navigate(selectedCategory ? `/category/${selectedCategory}` : "/");
  };

  const handleClearCharacter = () => {
    character.handleClearCharacter();
    filters.resetFilters();
  };

  const searchResults = useSearch(categoryFiltered, searchQuery);
  const totalPoints = calculatePoints(achievements, completedIds);
  const sectionPoints = calculatePoints(searchResults, completedIds);

  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <header style={{ padding: "12px 16px", background: "var(--panel)", borderBottom: "1px solid var(--border)" }}>
        <h1 style={{ margin: 0, fontSize: 18, color: "var(--accent)" }}>WoW Achievements</h1>
      </header>
      <AchievementListSkeleton count={12} />
    </div>
  );
  if (error) return <div style={{ padding: 32, color: "var(--danger)" }}>Error: {(error as Error).message}</div>;

  const sidebarProps = {
    categories,
    achievements,
    selectedCategory,
    onSelectCategory: handleCategorySelect,
    completedIds,
    recentCategories: appState.recentCategories,
    hasCompletedAt: !!completedAt && Object.keys(completedAt).length > 0,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <Header
        isMobile={isMobile}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        charProgress={character.charProgress}
        compareProgress={character.compareProgress}
        mergeResult={character.mergeResult}
        viewMode={character.viewMode}
        charLoading={character.charLoading}
        completedIds={completedIds}
        totalPoints={totalPoints}
        completedAt={completedAt}
        achievements={achievements}
        filter={filters.filter}
        onFilterChange={filters.setFilter}
        compareFilter={filters.compareFilter}
        onCompareFilterChange={filters.setCompareFilter}
        sort={filters.sort}
        onSortChange={filters.setSort}
        expansion={filters.expansion}
        onExpansionChange={filters.setExpansion}
        rewardFilter={filters.rewardFilter}
        onRewardFilterChange={filters.setRewardFilter}
        accountWideOnly={filters.accountWideOnly}
        onAccountWideOnlyChange={filters.setAccountWideOnly}
        onCharacterLookup={character.loadCharacter}
        onClearCharacter={handleClearCharacter}
        onShowCharSelector={() => setShowCharSelector(true)}
        onShowCompareSelector={() => setShowCompareSelector(true)}
        onExitCompareMode={character.exitCompareMode}
        onToggleCategories={() => setShowCategories(!showCategories)}
        auth={appState.auth}
        onLogout={appState.handleLogout}
        theme={appState.theme}
        onToggleTheme={appState.toggleTheme}
      />

      {isMobile && <MobileSearchBar searchQuery={searchQuery} onSearchChange={setSearchQuery} />}

      {appState.sessionExpired && (
        <div style={{ padding: "8px 16px", background: "rgba(210,153,34,0.15)", color: "var(--warning)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>Session expired. Please log in again.</span>
          <button className="btn btn-ghost" onClick={appState.dismissSessionExpired} style={{ padding: "2px 8px" }}>×</button>
        </div>
      )}
      {character.charError && <div style={{ padding: "8px 16px", background: "rgba(248,81,73,0.15)", color: "var(--danger)" }}>{character.charError}</div>}

      <div style={{ display: "flex", flex: 1, overflow: "hidden", position: "relative" }}>
        {isMobile ? (
          <MobileSidebar isOpen={showCategories} onClose={() => setShowCategories(false)} {...sidebarProps} />
        ) : (
          showCategories && (
            <aside style={{ width: 240, background: "var(--panel)", borderRight: "1px solid var(--border)", overflow: "auto" }}>
              <Sidebar {...sidebarProps} />
            </aside>
          )
        )}

        <MainContent
          achievements={searchResults}
          breadcrumbs={getBreadcrumbs()}
          onSelectCategory={handleCategorySelect}
          onSelectAchievement={handleAchievementSelect}
          completedIds={completedIds}
          compareCompletedIds={compareCompletedIds}
          progress={progress}
          viewMode={character.viewMode}
          filter={filters.filter}
          sort={filters.sort}
          showDates={selectedCategory === RECENT_CATEGORY_ID}
          accountWideOnly={filters.accountWideOnly}
          pinnedIds={appState.pinnedIds}
          onTogglePin={appState.togglePin}
          sectionPoints={sectionPoints}
        />

        {selectedAchievement && (
          isMobile ? (
            <div className="mobile-fullscreen">
              <AchievementDrawer
                achievementId={selectedAchievement}
                onClose={() => handleAchievementSelect(null)}
                completedIds={completedIds}
                onSelectAchievement={handleAchievementSelect}
                isPinned={appState.pinnedIds.has(selectedAchievement)}
                onTogglePin={() => appState.togglePin(selectedAchievement)}
              />
            </div>
          ) : (
            <aside style={{ width: 380, background: "var(--panel)", borderLeft: "1px solid var(--border)", overflow: "auto" }}>
              <AchievementDrawer
                achievementId={selectedAchievement}
                onClose={() => handleAchievementSelect(null)}
                completedIds={completedIds}
                onSelectAchievement={handleAchievementSelect}
                isPinned={appState.pinnedIds.has(selectedAchievement)}
                onTogglePin={() => appState.togglePin(selectedAchievement)}
              />
            </aside>
          )
        )}
      </div>

      {showCharSelector && (
        <CharacterSelector
          onSelect={character.loadCharacter}
          onMerge={character.loadMerge}
          onClose={() => setShowCharSelector(false)}
          initialSelection={character.mergeSelection}
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
              Select a character to compare against {character.charProgress?.character.name}
            </p>
            <CharacterLookup
              onLookup={(r, n) => { character.loadCompareCharacter(r, n); setShowCompareSelector(false); }}
              loading={character.charLoading}
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
