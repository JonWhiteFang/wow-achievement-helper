import type { Env } from "../env";
import { getClientToken } from "./token";

export type CharacterAchievements = {
  character: { realm: string; name: string };
  completed: number[];
  completedAt: Record<number, number>;
  progress: Record<number, { completedCriteria: number; totalCriteria: number }>;
  fetchedAt: string;
};

/** Normalize realm name to Blizzard slug format */
export function normalizeRealmSlug(realm: string): string {
  return realm
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove diacritics
    .replace(/['\s]/g, "-")
    .replace(/--+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function fetchCharacterAchievements(
  env: Env,
  realm: string,
  name: string
): Promise<CharacterAchievements> {
  const token = await getClientToken(env);
  const realmSlug = normalizeRealmSlug(realm);
  const charName = name.toLowerCase();

  const res = await fetch(
    `${env.PROFILE_API_HOST}/profile/wow/character/${realmSlug}/${encodeURIComponent(charName)}/achievements?namespace=profile-eu&locale=en_GB`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (res.status === 404) {
    throw { code: "NOT_FOUND", message: "Character not found", status: 404 };
  }
  if (res.status === 403) {
    throw { code: "NOT_PUBLIC", message: "This character's achievements are not publicly visible.", status: 403 };
  }
  if (!res.ok) {
    throw { code: "UPSTREAM_ERROR", message: `Blizzard API error: ${res.status}`, status: 502 };
  }

  const data = (await res.json()) as {
    achievements: Array<{
      id: number;
      completed_timestamp?: number;
      criteria?: { id: number; is_completed: boolean; child_criteria?: Array<{ id: number; is_completed: boolean }> };
    }>;
  };

  const completed: number[] = [];
  const completedAt: Record<number, number> = {};
  const progress: Record<number, { completedCriteria: number; totalCriteria: number }> = {};

  for (const a of data.achievements || []) {
    if (a.completed_timestamp) {
      completed.push(a.id);
      completedAt[a.id] = a.completed_timestamp;
    } else if (a.criteria?.child_criteria) {
      const total = a.criteria.child_criteria.length;
      const done = a.criteria.child_criteria.filter((c) => c.is_completed).length;
      if (total > 0) {
        progress[a.id] = { completedCriteria: done, totalCriteria: total };
      }
    }
  }

  return {
    character: { realm: realmSlug, name: charName },
    completed,
    completedAt,
    progress,
    fetchedAt: new Date().toISOString(),
  };
}
