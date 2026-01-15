const STORAGE_KEY = "wow-ach-character";
const MERGE_KEY = "wow-ach-merge-selection";

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
