import { useState } from "react";
import type { Expansion } from "../lib/expansions";

export type FilterMode = "all" | "completed" | "incomplete" | "near" | "pinned";
export type SortMode = "name" | "points" | "completion";
export type RewardType = "all" | "title" | "mount" | "pet" | "toy" | "transmog" | "other";
export type CompareFilter = "all" | "onlyA" | "onlyB" | "both" | "neither";

export function useFilters() {
  const [filter, setFilter] = useState<FilterMode>("all");
  const [compareFilter, setCompareFilter] = useState<CompareFilter>("all");
  const [sort, setSort] = useState<SortMode>("name");
  const [expansion, setExpansion] = useState<Expansion | "all">("all");
  const [accountWideOnly, setAccountWideOnly] = useState(false);
  const [rewardFilter, setRewardFilter] = useState<RewardType>("all");

  const resetFilters = () => {
    setFilter("all");
    setCompareFilter("all");
  };

  return {
    filter, setFilter,
    compareFilter, setCompareFilter,
    sort, setSort,
    expansion, setExpansion,
    accountWideOnly, setAccountWideOnly,
    rewardFilter, setRewardFilter,
    resetFilters,
  };
}
