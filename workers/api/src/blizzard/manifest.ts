import type { Env } from "../env";
import { getClientToken } from "./token";
import type { Category } from "./gameData";

export type AchievementSummary = {
  id: number;
  name: string;
  points: number;
  categoryId: number;
  icon?: string;
  isAccountWide?: boolean;
  isMeta?: boolean;
  childAchievementIds?: number[];
  rewardType?: string;
};

export type Manifest = {
  categories: Category[];
  achievements: AchievementSummary[];
  builtAt: string;
};

type BuildState = {
  phase: "index" | "categories" | "media" | "done";
  queue: number[];
  achievements: AchievementSummary[];
  categoryData: Record<number, { id: number; name: string; parentId: number | null; childIds: number[] }>;
  rootIds: number[];
  mediaQueue?: number[];
};

type BlizzardCategoryDetail = {
  id: number;
  name: string;
  achievements?: { id: number; name: string; points: number }[];
  subcategories?: { id: number; name: string }[];
  parent_category?: { id: number };
};

type BlizzardMediaResponse = {
  assets?: { key: string; value: string }[];
};

const MANIFEST_KEY = "manifest:v1";
const BUILD_STATE_KEY = "manifest:build-state";
const MANIFEST_TTL = 60 * 60 * 24;
const BATCH_SIZE = 40;
const MEDIA_BATCH_SIZE = 20; // Smaller batch for media phase (2 requests per achievement)

export async function getManifest(env: Env): Promise<Manifest | null> {
  const cached = await env.SESSIONS.get(MANIFEST_KEY);
  if (cached) return JSON.parse(cached);
  return null;
}

export async function buildManifestIncremental(env: Env): Promise<{ done: boolean; progress: string }> {
  const token = await getClientToken(env);
  
  let state: BuildState;
  const stateJson = await env.SESSIONS.get(BUILD_STATE_KEY);
  
  if (stateJson) {
    state = JSON.parse(stateJson);
  } else {
    state = { phase: "index", queue: [], achievements: [], categoryData: {}, rootIds: [] };
  }

  if (state.phase === "index") {
    const res = await fetch(
      `${env.BLIZZARD_API_HOST}/data/wow/achievement-category/index?namespace=static-eu&locale=en_GB`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) throw new Error(`Index fetch failed: ${res.status}`);
    
    const data = (await res.json()) as { root_categories?: { id: number; name: string }[]; categories?: { id: number; name: string }[] };
    const roots = data.root_categories || data.categories || [];
    
    for (const r of roots) {
      state.rootIds.push(r.id);
      state.categoryData[r.id] = { id: r.id, name: r.name, parentId: null, childIds: [] };
      state.queue.push(r.id);
    }
    
    state.phase = "categories";
    await env.SESSIONS.put(BUILD_STATE_KEY, JSON.stringify(state), { expirationTtl: 3600 });
    return { done: false, progress: `Indexed ${roots.length} root categories` };
  }

  if (state.phase === "categories") {
    if (state.queue.length === 0) {
      state.phase = "media";
      state.mediaQueue = state.achievements.map((a) => a.id);
      await env.SESSIONS.put(BUILD_STATE_KEY, JSON.stringify(state), { expirationTtl: 3600 });
      return { done: false, progress: `Categories done, starting media fetch for ${state.achievements.length} achievements` };
    }
    
    const batch = state.queue.splice(0, BATCH_SIZE);
    const results = await Promise.all(
      batch.map(async (id) => {
        const res = await fetch(
          `${env.BLIZZARD_API_HOST}/data/wow/achievement-category/${id}?namespace=static-eu&locale=en_GB`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) return null;
        return (await res.json()) as BlizzardCategoryDetail;
      })
    );

    for (const detail of results) {
      if (!detail) continue;
      if (detail.achievements) {
        for (const a of detail.achievements) {
          state.achievements.push({ id: a.id, name: a.name, points: a.points || 0, categoryId: detail.id });
        }
      }
      if (detail.subcategories) {
        for (const sub of detail.subcategories) {
          state.categoryData[sub.id] = { id: sub.id, name: sub.name, parentId: detail.id, childIds: [] };
          state.categoryData[detail.id].childIds.push(sub.id);
          state.queue.push(sub.id);
        }
      }
    }

    await env.SESSIONS.put(BUILD_STATE_KEY, JSON.stringify(state), { expirationTtl: 3600 });
    return { done: false, progress: `Processed ${batch.length} categories, ${state.queue.length} remaining, ${state.achievements.length} achievements` };
  }

  if (state.phase === "media") {
    if (!state.mediaQueue || state.mediaQueue.length === 0) {
      state.phase = "done";
    } else {
      const batch = state.mediaQueue.splice(0, MEDIA_BATCH_SIZE);
      const achievementMap = new Map<number, { icon?: string; points?: number; isAccountWide?: boolean; isMeta?: boolean; childAchievementIds?: number[]; rewardType?: string }>();
      
      const results = await Promise.all(
        batch.map(async (id) => {
          const [mediaRes, detailRes] = await Promise.all([
            fetch(`${env.BLIZZARD_API_HOST}/data/wow/media/achievement/${id}?namespace=static-eu`, { headers: { Authorization: `Bearer ${token}` } }),
            fetch(`${env.BLIZZARD_API_HOST}/data/wow/achievement/${id}?namespace=static-eu&locale=en_GB`, { headers: { Authorization: `Bearer ${token}` } }),
          ]);
          let icon: string | undefined;
          let points: number | undefined;
          let isAccountWide: boolean | undefined;
          let isMeta: boolean | undefined;
          let childAchievementIds: number[] | undefined;
          let rewardType: string | undefined;
          if (mediaRes.ok) {
            const data = (await mediaRes.json()) as BlizzardMediaResponse;
            icon = data.assets?.find((a) => a.key === "icon")?.value;
          }
          if (detailRes.ok) {
            const data = (await detailRes.json()) as { points?: number; is_account_wide?: boolean; reward_description?: string; criteria?: { child_criteria?: { linked_achievement?: { id: number } }[] } };
            points = data.points;
            isAccountWide = data.is_account_wide;
            if (data.criteria?.child_criteria) {
              const linkedAchievements = data.criteria.child_criteria.filter(c => c.linked_achievement).map(c => c.linked_achievement!.id);
              if (linkedAchievements.length > 0) {
                isMeta = true;
                childAchievementIds = linkedAchievements;
              }
            }
            if (data.reward_description) {
              const reward = data.reward_description.toLowerCase();
              if (reward.includes("title:") || reward.includes("title reward")) rewardType = "title";
              else if (reward.includes("mount")) rewardType = "mount";
              else if (reward.includes("pet") || reward.includes("companion")) rewardType = "pet";
              else if (reward.includes("toy")) rewardType = "toy";
              else if (reward.includes("appearance") || reward.includes("transmog")) rewardType = "transmog";
              else rewardType = "other";
            }
          }
          return { id, icon, points, isAccountWide, isMeta, childAchievementIds, rewardType };
        })
      );

      for (const r of results) {
        if (r.icon || r.points !== undefined || r.isAccountWide !== undefined || r.isMeta !== undefined || r.childAchievementIds !== undefined || r.rewardType !== undefined) {
          achievementMap.set(r.id, { icon: r.icon, points: r.points, isAccountWide: r.isAccountWide, isMeta: r.isMeta, childAchievementIds: r.childAchievementIds, rewardType: r.rewardType });
        }
      }

      for (const a of state.achievements) {
        const data = achievementMap.get(a.id);
        if (data?.icon) a.icon = data.icon;
        if (data?.points !== undefined) a.points = data.points;
        if (data?.isAccountWide !== undefined) a.isAccountWide = data.isAccountWide;
        if (data?.isMeta !== undefined) a.isMeta = data.isMeta;
        if (data?.childAchievementIds !== undefined) a.childAchievementIds = data.childAchievementIds;
        if (data?.rewardType !== undefined) a.rewardType = data.rewardType;
      }

      await env.SESSIONS.put(BUILD_STATE_KEY, JSON.stringify(state), { expirationTtl: 3600 });
      return { done: false, progress: `Fetched ${batch.length} details, ${state.mediaQueue.length} remaining` };
    }
  }

  if (state.phase === "done") {
    const buildTree = (id: number): Category | null => {
      const data = state.categoryData[id];
      if (!data) return null;
      const children = data.childIds.map(buildTree).filter((c): c is Category => c !== null);
      return { id: data.id, name: data.name, children };
    };

    const categories = state.rootIds.map(buildTree).filter((c): c is Category => c !== null);
    
    const manifest: Manifest = {
      categories,
      achievements: state.achievements,
      builtAt: new Date().toISOString(),
    };
    
    await env.SESSIONS.put(MANIFEST_KEY, JSON.stringify(manifest), { expirationTtl: MANIFEST_TTL });
    await env.SESSIONS.delete(BUILD_STATE_KEY);
    
    return { done: true, progress: `Complete: ${categories.length} categories, ${state.achievements.length} achievements` };
  }

  return { done: false, progress: "Unknown state" };
}
