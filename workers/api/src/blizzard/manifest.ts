import type { Env } from "../env";
import { getClientToken } from "./token";
import type { Category } from "./gameData";

export type AchievementSummary = {
  id: number;
  name: string;
  points: number;
  categoryId: number;
};

export type Manifest = {
  categories: Category[];
  achievements: AchievementSummary[];
  builtAt: string;
};

type BlizzardCategoryDetail = {
  id: number;
  name: string;
  achievements?: { id: number; name: string; points: number }[];
  subcategories?: { id: number; name: string }[];
};

const MANIFEST_KV_KEY = "manifest:v1";
const MANIFEST_TTL = 60 * 60 * 24; // 24h

export async function getManifest(env: Env): Promise<Manifest> {
  // Try KV cache first
  const cached = await env.SESSIONS.get(MANIFEST_KV_KEY);
  if (cached) {
    return JSON.parse(cached);
  }

  // Build fresh manifest
  const manifest = await buildManifest(env);

  // Store in KV
  await env.SESSIONS.put(MANIFEST_KV_KEY, JSON.stringify(manifest), { expirationTtl: MANIFEST_TTL });

  return manifest;
}

async function buildManifest(env: Env): Promise<Manifest> {
  const token = await getClientToken(env);
  const achievements: AchievementSummary[] = [];
  const categoryQueue: { id: number; name: string; parent: Category | null }[] = [];
  const rootCategories: Category[] = [];

  // Fetch category index
  const indexRes = await fetch(
    `${env.BLIZZARD_API_HOST}/data/wow/achievement-category/index?namespace=static-eu&locale=en_GB`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!indexRes.ok) throw new Error(`Categories index failed: ${indexRes.status}`);

  const indexData = (await indexRes.json()) as { categories?: { id: number; name: string }[]; root_categories?: { id: number; name: string }[] };
  const roots = indexData.root_categories || indexData.categories || [];

  // Initialize queue with root categories
  for (const r of roots) {
    const cat: Category = { id: r.id, name: r.name, children: [] };
    rootCategories.push(cat);
    categoryQueue.push({ id: r.id, name: r.name, parent: cat });
  }

  // Process queue in batches (BFS with concurrency limit)
  const BATCH_SIZE = 6;
  while (categoryQueue.length > 0) {
    const batch = categoryQueue.splice(0, BATCH_SIZE);
    const results = await Promise.all(
      batch.map(async (item) => {
        const res = await fetch(
          `${env.BLIZZARD_API_HOST}/data/wow/achievement-category/${item.id}?namespace=static-eu&locale=en_GB`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) return { item, detail: null };
        const detail = (await res.json()) as BlizzardCategoryDetail;
        return { item, detail };
      })
    );

    for (const { item, detail } of results) {
      if (!detail) continue;

      // Collect achievements
      if (detail.achievements) {
        for (const a of detail.achievements) {
          achievements.push({ id: a.id, name: a.name, points: a.points || 0, categoryId: item.id });
        }
      }

      // Find the category node to attach children
      const parentNode = item.parent;
      if (!parentNode) continue;

      // Add subcategories
      if (detail.subcategories) {
        for (const sub of detail.subcategories) {
          const childCat: Category = { id: sub.id, name: sub.name, children: [] };
          parentNode.children.push(childCat);
          categoryQueue.push({ id: sub.id, name: sub.name, parent: childCat });
        }
      }
    }
  }

  return {
    categories: rootCategories,
    achievements,
    builtAt: new Date().toISOString(),
  };
}
