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

  // Collect all category IDs to fetch
  const allCategoryIds: number[] = [];
  for (const cat of rootCategories) {
    allCategoryIds.push(cat.id);
  }

  // Fetch category details in parallel batches
  const BATCH_SIZE = 5;
  const categoryDetails = new Map<number, BlizzardCategoryDetail>();
  
  for (let i = 0; i < allCategoryIds.length; i += BATCH_SIZE) {
    const batch = allCategoryIds.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map(async (id) => {
        const res = await fetch(
          `${env.BLIZZARD_API_HOST}/data/wow/achievement-category/${id}?namespace=static-eu&locale=en_GB`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) return null;
        const detail = (await res.json()) as BlizzardCategoryDetail;
        return { id, detail };
      })
    );
    for (const r of results) {
      if (r) categoryDetails.set(r.id, r.detail);
    }
  }

  // Build category tree and collect achievements
  function buildCategory(catId: number, name: string): Category {
    const detail = categoryDetails.get(catId);
    
    if (detail?.achievements) {
      for (const a of detail.achievements) {
        achievements.push({ id: a.id, name: a.name, categoryId: catId });
      }
    }

    // Note: We only fetch root categories to avoid too many subrequests
    // Subcategories would require additional fetches
    return { id: catId, name, children: [] };
  }

  const categories = rootCategories.map((cat) => buildCategory(cat.id, cat.name));
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
