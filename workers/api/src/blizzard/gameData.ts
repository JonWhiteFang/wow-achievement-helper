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
  subcategories?: { id: number; name: string }[];
};

type BlizzardCategoryDetail = {
  id: number;
  name: string;
  achievements?: { id: number; name: string }[];
  subcategories?: { id: number; name: string }[];
};

export async function fetchCategories(env: Env): Promise<{ categories: Category[]; achievements: { id: number; name: string; categoryId: number }[] }> {
  const token = await getClientToken(env);
  
  // Fetch category index
  const indexRes = await fetch(
    `${env.BLIZZARD_API_HOST}/data/wow/achievement-category/index?namespace=static-eu&locale=en_GB`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!indexRes.ok) throw new Error(`Categories fetch failed: ${indexRes.status}`);
  
  const indexData = (await indexRes.json()) as { categories: BlizzardCategory[]; root_categories?: BlizzardCategory[] };
  const rootCategories = indexData.root_categories || indexData.categories || [];
  
  const achievements: { id: number; name: string; categoryId: number }[] = [];
  const categories: Category[] = [];

  // Fetch details for each root category to get achievements
  async function fetchCategoryDetail(catId: number): Promise<BlizzardCategoryDetail | null> {
    const res = await fetch(
      `${env.BLIZZARD_API_HOST}/data/wow/achievement-category/${catId}?namespace=static-eu&locale=en_GB`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) return null;
    return res.json();
  }

  async function processCategory(cat: BlizzardCategory): Promise<Category> {
    const detail = await fetchCategoryDetail(cat.id);
    
    if (detail?.achievements) {
      for (const a of detail.achievements) {
        achievements.push({ id: a.id, name: a.name, categoryId: cat.id });
      }
    }

    const children: Category[] = [];
    if (detail?.subcategories) {
      for (const sub of detail.subcategories) {
        children.push(await processCategory({ id: sub.id, name: sub.name }));
      }
    }

    return { id: cat.id, name: cat.name, children };
  }

  // Process root categories (limit concurrency)
  for (const cat of rootCategories) {
    categories.push(await processCategory(cat));
  }

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
