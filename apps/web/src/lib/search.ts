import Fuse from "fuse.js";
import { useMemo, useState, useEffect } from "react";
import type { AchievementSummary } from "./api";

const fuseOptions = {
  keys: ["name"],
  threshold: 0.3,
  ignoreLocation: true,
};

const DEBOUNCE_MS = 300;

export function useSearch(achievements: AchievementSummary[], query: string): { results: AchievementSummary[]; isSearching: boolean } {
  const fuse = useMemo(() => new Fuse(achievements, fuseOptions), [achievements]);
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (query !== debouncedQuery) {
      setIsSearching(true);
      const timer = setTimeout(() => {
        setDebouncedQuery(query);
        setIsSearching(false);
      }, DEBOUNCE_MS);
      return () => clearTimeout(timer);
    }
  }, [query, debouncedQuery]);

  const results = useMemo(() => {
    if (!debouncedQuery.trim()) return achievements;
    return fuse.search(debouncedQuery).map((r) => r.item);
  }, [fuse, debouncedQuery, achievements]);

  return { results, isSearching };
}
