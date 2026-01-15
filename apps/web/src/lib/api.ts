const API_BASE = import.meta.env.VITE_API_BASE;

export type Category = {
  id: number;
  name: string;
  children: Category[];
};

export type AchievementSummary = {
  id: number;
  name: string;
  categoryId: number;
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
};

export type CategoriesResponse = {
  categories: Category[];
  achievements: AchievementSummary[];
  generatedAt: string;
};

export async function fetchCategories(): Promise<CategoriesResponse> {
  const res = await fetch(`${API_BASE}/api/categories`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch categories");
  return res.json();
}

export async function fetchAchievement(id: number): Promise<Achievement> {
  const res = await fetch(`${API_BASE}/api/achievement/${id}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch achievement");
  return res.json();
}
