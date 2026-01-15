import Fuse from "fuse.js";
import { useMemo } from "react";
import type { AchievementSummary } from "./api";

const fuseOptions = {
  keys: ["name"],
  threshold: 0.3,
  ignoreLocation: true,
};

export function useSearch(achievements: AchievementSummary[], query: string): AchievementSummary[] {
  const fuse = useMemo(() => new Fuse(achievements, fuseOptions), [achievements]);

  return useMemo(() => {
    if (!query.trim()) return achievements;
    return fuse.search(query).map((r) => r.item);
  }, [fuse, query, achievements]);
}
