const STORAGE_KEY = "wow-ach-character";

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
