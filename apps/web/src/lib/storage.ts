const STORAGE_KEY = "wow-ach-character";
const MERGE_KEY = "wow-ach-merge-selection";
const RECENT_CATEGORIES_KEY = "wow-ach-recent-categories";

export type SavedCharacter = {
  realm: string;
  name: string;
};

export function getSavedCharacter(): SavedCharacter | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function saveCharacter(char: SavedCharacter): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(char));
}

export function clearSavedCharacter(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function getMergeSelection(): SavedCharacter[] {
  try {
    const data = localStorage.getItem(MERGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveMergeSelection(chars: SavedCharacter[]): void {
  localStorage.setItem(MERGE_KEY, JSON.stringify(chars));
}

export function clearMergeSelection(): void {
  localStorage.removeItem(MERGE_KEY);
}

export type RecentCategory = { id: number; name: string };

export function getRecentCategories(): RecentCategory[] {
  try {
    const data = localStorage.getItem(RECENT_CATEGORIES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function addRecentCategory(cat: RecentCategory): void {
  const recent = getRecentCategories().filter((c) => c.id !== cat.id);
  recent.unshift(cat);
  localStorage.setItem(RECENT_CATEGORIES_KEY, JSON.stringify(recent.slice(0, 5)));
}

const THEME_KEY = "wow-ach-theme";

export function getTheme(): "dark" | "light" {
  try {
    const theme = localStorage.getItem(THEME_KEY);
    return theme === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export function setTheme(theme: "dark" | "light"): void {
  localStorage.setItem(THEME_KEY, theme);
  document.documentElement.dataset.theme = theme;
}
