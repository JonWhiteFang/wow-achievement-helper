const API_BASE = import.meta.env.VITE_API_BASE;

export type Category = {
  id: number;
  name: string;
  children: Category[];
};

export type AchievementSummary = {
  id: number;
  name: string;
  points?: number;
  categoryId: number;
  icon?: string;
  isAccountWide?: boolean;
  isMeta?: boolean;
  childAchievementIds?: number[];
};

export type Achievement = {
  id: number;
  name: string;
  description: string;
  points: number;
  isAccountWide: boolean;
  reward: { title: string | null; item: { id: number; name: string } | null };
  categoryId: number;
  criteria: { id: number; description: string; amount: number }[];
  icon?: string;
  childAchievements?: { id: number; name: string }[];
};

export type CategoriesResponse = {
  categories: Category[];
  achievements: AchievementSummary[];
  generatedAt: string;
};

export type ManifestResponse = {
  categories: Category[];
  achievements: AchievementSummary[];
  builtAt: string;
};

export type CharacterProgress = {
  character: { realm: string; name: string };
  completed: number[];
  completedAt?: Record<number, number>;
  progress: Record<number, { completedCriteria: number; totalCriteria: number }>;
  fetchedAt: string;
};

export type AuthStatus = {
  loggedIn: boolean;
  battletag?: string | null;
  sessionExpired?: boolean;
};

export type WowCharacter = {
  realm: string;
  name: string;
  level: number;
  id: string;
};

export type ApiError = {
  error: string;
  message: string;
};

export async function fetchCategories(): Promise<CategoriesResponse> {
  const res = await fetch(`${API_BASE}/api/categories`);
  if (!res.ok) throw new Error("Failed to fetch categories");
  return res.json();
}

export async function fetchManifest(): Promise<ManifestResponse> {
  // Try manifest first, fall back to categories
  const res = await fetch(`${API_BASE}/api/manifest`);
  if (res.ok) return res.json();
  
  // Fallback to categories endpoint
  const fallback = await fetch(`${API_BASE}/api/categories`);
  if (!fallback.ok) throw new Error("Failed to fetch achievements");
  const data = await fallback.json() as CategoriesResponse;
  return { categories: data.categories, achievements: data.achievements, builtAt: data.generatedAt };
}

export async function fetchAchievement(id: number): Promise<Achievement> {
  const res = await fetch(`${API_BASE}/api/achievement/${id}`);
  if (!res.ok) throw new Error("Failed to fetch achievement");
  return res.json();
}

export async function fetchCharacterAchievements(realm: string, name: string): Promise<CharacterProgress> {
  const res = await fetch(
    `${API_BASE}/api/character/${encodeURIComponent(realm)}/${encodeURIComponent(name)}/achievements`
  );
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as ApiError;
    throw new Error(data.message || `Failed to fetch character (${res.status})`);
  }
  return res.json();
}

export function getLoginUrl(): string {
  return `${API_BASE}/auth/login`;
}

export async function fetchAuthStatus(): Promise<AuthStatus> {
  const res = await fetch(`${API_BASE}/auth/me`, { credentials: "include" });
  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { error?: string };
    if (data.error === "SESSION_EXPIRED") return { loggedIn: false, sessionExpired: true };
    return { loggedIn: false };
  }
  return res.json();
}

export async function logout(): Promise<void> {
  await fetch(`${API_BASE}/auth/logout`, { method: "POST", credentials: "include" });
}

export async function fetchMyCharacters(): Promise<WowCharacter[]> {
  const res = await fetch(`${API_BASE}/api/me/characters`, { credentials: "include" });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as ApiError;
    throw new Error(data.message || "Failed to fetch characters");
  }
  const json = (await res.json()) as { characters: WowCharacter[] };
  return json.characters;
}

export type MergeResult = {
  merged: {
    completed: number[];
    completedAt?: Record<number, number>;
    progress: Record<number, { completedCriteria: number; totalCriteria: number }>;
  };
  sources: { realm: string; name: string }[];
  fetchedAt: string;
};

export async function mergeCharacters(characters: { realm: string; name: string }[]): Promise<MergeResult> {
  const res = await fetch(`${API_BASE}/api/me/merge`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ characters }),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as ApiError;
    throw new Error(data.message || "Failed to merge characters");
  }
  return res.json();
}

export type HelpPayload = {
  achievementId: number;
  strategy: Array<{ title: string; steps: string[] }>;
  comments: Array<{ author: string; text: string; score: number | null; date: string | null }>;
  sources: Array<{ name: string; url: string }>;
};

export type Realm = { name: string; slug: string };

export async function fetchRealms(): Promise<Realm[]> {
  const res = await fetch(`${API_BASE}/api/realms`);
  if (!res.ok) throw new Error("Failed to fetch realms");
  const data = (await res.json()) as { realms: Realm[] };
  return data.realms;
}

export async function fetchHelp(achievementId: number, top = 10): Promise<HelpPayload> {
  const res = await fetch(`${API_BASE}/api/help/achievement/${achievementId}?top=${top}`);
  if (!res.ok) throw new Error("Failed to fetch help");
  return res.json();
}
