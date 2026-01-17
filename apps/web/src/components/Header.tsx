import type { CharacterProgress, MergeResult, AuthStatus, AchievementSummary } from "../lib/api";
import type { ViewMode, FilterMode, SortMode, RewardType, CompareFilter } from "../hooks";
import type { Expansion } from "../lib/expansions";
import { EXPANSIONS, EXPANSION_LABELS } from "../lib/expansions";
import { formatPoints } from "../lib/points";
import { CharacterLookup } from "./CharacterLookup";
import { AuthButton } from "./AuthButton";
import { ExportButtons } from "./ExportButtons";

type Props = {
  isMobile: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  charProgress: CharacterProgress | null;
  compareProgress: CharacterProgress | null;
  mergeResult: MergeResult | null;
  viewMode: ViewMode;
  charLoading: boolean;
  completedIds?: Set<number>;
  totalPoints: { earned: number; total: number };
  completedAt?: Record<number, number>;
  achievements: AchievementSummary[];
  // Filter props
  filter: FilterMode;
  onFilterChange: (f: FilterMode) => void;
  compareFilter: CompareFilter;
  onCompareFilterChange: (f: CompareFilter) => void;
  sort: SortMode;
  onSortChange: (s: SortMode) => void;
  expansion: Expansion | "all";
  onExpansionChange: (e: Expansion | "all") => void;
  rewardFilter: RewardType;
  onRewardFilterChange: (r: RewardType) => void;
  accountWideOnly: boolean;
  onAccountWideOnlyChange: (v: boolean) => void;
  // Actions
  onCharacterLookup: (realm: string, name: string) => void;
  onClearCharacter: () => void;
  onShowCharSelector: () => void;
  onShowCompareSelector: () => void;
  onExitCompareMode: () => void;
  onToggleCategories: () => void;
  // Auth/theme
  auth: AuthStatus;
  onLogout: () => void;
  theme: "dark" | "light";
  onToggleTheme: () => void;
};

export function Header({
  isMobile, searchQuery, onSearchChange,
  charProgress, compareProgress, mergeResult, viewMode, charLoading, completedIds, totalPoints, completedAt, achievements,
  filter, onFilterChange, compareFilter, onCompareFilterChange, sort, onSortChange,
  expansion, onExpansionChange, rewardFilter, onRewardFilterChange, accountWideOnly, onAccountWideOnlyChange,
  onCharacterLookup, onClearCharacter, onShowCharSelector, onShowCompareSelector, onExitCompareMode, onToggleCategories,
  auth, onLogout, theme, onToggleTheme,
}: Props) {
  const hasProgress = charProgress || mergeResult;

  return (
    <header style={{ padding: isMobile ? "8px 12px" : "12px 16px", background: "var(--panel)", borderBottom: "1px solid var(--border)", display: "flex", gap: isMobile ? 8 : 12, alignItems: "center", flexWrap: "wrap" }}>
      <button className="btn btn-ghost" onClick={onToggleCategories} title="Toggle categories">☰</button>
      <h1 style={{ margin: 0, fontSize: isMobile ? 16 : 18, color: "var(--accent)", flex: isMobile ? "1 1 auto" : "none" }}>WoW Achievements</h1>
      
      {!isMobile && (
        <input
          type="search"
          placeholder="Search achievements..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="input"
          style={{ width: 200 }}
        />
      )}
      
      <CharacterLookup
        onLookup={onCharacterLookup}
        loading={charLoading}
        currentCharacter={viewMode === "single" ? charProgress?.character || null : null}
        onClear={onClearCharacter}
      />
      
      {auth.loggedIn && <button className="btn" onClick={onShowCharSelector}>{isMobile ? "Chars" : "My Characters"}</button>}
      
      {charProgress && viewMode !== "compare" && (
        <button className="btn" onClick={onShowCompareSelector} title="Compare with another character">⚔️ Compare</button>
      )}
      
      {viewMode === "compare" && compareProgress && (
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span className="badge" style={{ background: "rgba(88,166,255,0.2)", color: "#58a6ff" }}>
            vs {compareProgress.character.name}
          </span>
          <button className="btn btn-ghost" onClick={onExitCompareMode} style={{ padding: "2px 6px" }}>×</button>
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
      
      {hasProgress && (
        <>
          {viewMode !== "compare" ? (
            <select className="select" value={filter} onChange={(e) => onFilterChange(e.target.value as FilterMode)} style={{ minWidth: isMobile ? 80 : undefined }}>
              <option value="all">All</option>
              <option value="completed">Done</option>
              <option value="incomplete">Todo</option>
              <option value="near">{isMobile ? "80%+" : "Near 80%+"}</option>
              <option value="pinned">Pinned</option>
            </select>
          ) : (
            <select className="select" value={compareFilter} onChange={(e) => onCompareFilterChange(e.target.value as CompareFilter)} style={{ minWidth: isMobile ? 80 : undefined }}>
              <option value="all">All</option>
              <option value="onlyA">Only {charProgress?.character.name}</option>
              <option value="onlyB">Only {compareProgress?.character.name}</option>
              <option value="both">Both have</option>
              <option value="neither">Neither has</option>
            </select>
          )}
          <select className="select" value={sort} onChange={(e) => onSortChange(e.target.value as SortMode)} style={{ minWidth: isMobile ? 80 : undefined }}>
            <option value="name">Name</option>
            <option value="points">Points</option>
            <option value="completion">Status</option>
          </select>
        </>
      )}
      
      <select className="select" value={expansion} onChange={(e) => onExpansionChange(e.target.value as Expansion | "all")} style={{ minWidth: isMobile ? 70 : undefined }}>
        <option value="all">All Xpacs</option>
        {EXPANSIONS.map((e) => <option key={e} value={e}>{EXPANSION_LABELS[e]}</option>)}
      </select>
      
      <select className="select" value={rewardFilter} onChange={(e) => onRewardFilterChange(e.target.value as RewardType)} style={{ minWidth: isMobile ? 70 : undefined }}>
        <option value="all">All Rewards</option>
        <option value="title">Title</option>
        <option value="mount">Mount</option>
        <option value="pet">Pet</option>
        <option value="toy">Toy</option>
        <option value="transmog">Transmog</option>
        <option value="other">Other</option>
      </select>
      
      <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, cursor: "pointer" }}>
        <input type="checkbox" checked={accountWideOnly} onChange={(e) => onAccountWideOnlyChange(e.target.checked)} />
        {isMobile ? "Acct" : "Account-wide"}
      </label>
      
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
        {completedIds && completedIds.size > 0 && (
          <ExportButtons achievements={achievements} completedIds={completedIds} completedAt={completedAt} characterName={charProgress?.character.name} />
        )}
        <button
          className="btn btn-ghost"
          onClick={onToggleTheme}
          title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          style={{ padding: "4px 8px" }}
        >{theme === "dark" ? "☀️" : "🌙"}</button>
        <AuthButton loggedIn={auth.loggedIn} battletag={auth.battletag} onLogout={onLogout} />
      </div>
    </header>
  );
}

export function MobileSearchBar({ searchQuery, onSearchChange }: { searchQuery: string; onSearchChange: (q: string) => void }) {
  return (
    <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)" }}>
      <input
        type="search"
        placeholder="Search achievements..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="input"
        style={{ width: "100%" }}
      />
    </div>
  );
}
