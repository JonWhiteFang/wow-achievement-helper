import type { Env } from "../env";
import { getClientToken } from "./token";

export type Category = {
  id: number;
  name: string;
  children: Category[];
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

type BlizzardCategory = {
  id: number;
  name: string;
  subcategories?: BlizzardCategory[];
  achievements?: { id: number; name: string }[];
};

export async function fetchCategories(env: Env): Promise<{ categories: Category[]; achievements: { id: number; name: string; categoryId: number }[] }> {
  const token = await getClientToken(env);
  const res = await fetch(
    `${env.BLIZZARD_API_HOST}/data/wow/achievement-category/index?namespace=static-eu&locale=en_GB`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) throw new Error(`Categories fetch failed: ${res.status}`);

  const data = (await res.json()) as { categories: BlizzardCategory[]; root_categories: BlizzardCategory[] };
  const achievements: { id: number; name: string; categoryId: number }[] = [];

  function mapCategory(cat: BlizzardCategory): Category {
    if (cat.achievements) {
      for (const a of cat.achievements) {
        achievements.push({ id: a.id, name: a.name, categoryId: cat.id });
      }
    }
    return {
      id: cat.id,
      name: cat.name,
      children: (cat.subcategories || []).map(mapCategory),
    };
  }

  const categories = (data.root_categories || data.categories || []).map(mapCategory);
  return { categories, achievements };
}

export async function fetchAchievement(env: Env, id: number): Promise<Achievement> {
  const token = await getClientToken(env);
  const res = await fetch(
    `${env.BLIZZARD_API_HOST}/data/wow/achievement/${id}?namespace=static-eu&locale=en_GB`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) throw new Error(`Achievement fetch failed: ${res.status}`);

  const data = (await res.json()) as {
    id: number;
    name: string;
    description: string;
    points: number;
    is_account_wide: boolean;
    reward_description?: string;
    category: { id: number };
    criteria?: { id: number; description: string; amount: number; child_criteria?: unknown[] };
  };

  const criteria: { id: number; description: string; amount: number }[] = [];
  if (data.criteria) {
    if (data.criteria.child_criteria && Array.isArray(data.criteria.child_criteria)) {
      for (const c of data.criteria.child_criteria as { id: number; description?: string; amount?: number }[]) {
        criteria.push({ id: c.id, description: c.description || "", amount: c.amount || 1 });
      }
    } else {
      criteria.push({ id: data.criteria.id, description: data.criteria.description || "", amount: data.criteria.amount || 1 });
    }
  }

  return {
    id: data.id,
    name: data.name,
    description: data.description || "",
    points: data.points,
    isAccountWide: data.is_account_wide,
    reward: { title: data.reward_description || null, item: null },
    categoryId: data.category.id,
    criteria,
  };
}
