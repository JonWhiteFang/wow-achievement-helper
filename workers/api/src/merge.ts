import type { Env } from "./env";
import { fetchCharacterAchievements, type CharacterAchievements } from "./blizzard/character";

export type MergeRequest = {
  characters: { realm: string; name: string }[];
};

export type MergeResult = {
  merged: {
    completed: number[];
    progress: Record<number, { completedCriteria: number; totalCriteria: number }>;
  };
  sources: { realm: string; name: string }[];
  fetchedAt: string;
};

const MAX_CHARACTERS = 10;
const BATCH_SIZE = 3;

export async function mergeCharacterAchievements(env: Env, characters: { realm: string; name: string }[]): Promise<MergeResult> {
  if (characters.length === 0) {
    throw { code: "INVALID_INPUT", message: "No characters provided", status: 400 };
  }
  if (characters.length > MAX_CHARACTERS) {
    throw { code: "INVALID_INPUT", message: `Maximum ${MAX_CHARACTERS} characters allowed`, status: 400 };
  }

  const results: CharacterAchievements[] = [];

  // Fetch in batches to avoid rate limiting
  for (let i = 0; i < characters.length; i += BATCH_SIZE) {
    const batch = characters.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map((c) => fetchCharacterAchievements(env, c.realm, c.name).catch(() => null))
    );
    results.push(...batchResults.filter((r): r is CharacterAchievements => r !== null));
  }

  if (results.length === 0) {
    throw { code: "NO_DATA", message: "Could not fetch any character data", status: 404 };
  }

  // Merge: union of completed, max progress per achievement
  const completedSet = new Set<number>();
  const progressMap: Record<number, { completedCriteria: number; totalCriteria: number }> = {};

  for (const r of results) {
    for (const id of r.completed) {
      completedSet.add(id);
    }
    for (const [idStr, prog] of Object.entries(r.progress)) {
      const id = parseInt(idStr, 10);
      if (!progressMap[id] || prog.completedCriteria > progressMap[id].completedCriteria) {
        progressMap[id] = prog;
      }
    }
  }

  // Remove completed from progress
  for (const id of completedSet) {
    delete progressMap[id];
  }

  return {
    merged: {
      completed: Array.from(completedSet),
      progress: progressMap,
    },
    sources: results.map((r) => r.character),
    fetchedAt: new Date().toISOString(),
  };
}
