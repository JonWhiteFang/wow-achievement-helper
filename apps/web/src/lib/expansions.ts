import type { Category } from "./api";

export type Expansion = "classic" | "tbc" | "wrath" | "cata" | "mop" | "wod" | "legion" | "bfa" | "sl" | "df" | "tww";

export const EXPANSION_LABELS: Record<Expansion, string> = {
  classic: "Classic", tbc: "TBC", wrath: "Wrath", cata: "Cataclysm", mop: "Pandaria",
  wod: "Draenor", legion: "Legion", bfa: "BfA", sl: "Shadowlands", df: "Dragonflight", tww: "War Within",
};

export const EXPANSIONS: Expansion[] = ["classic", "tbc", "wrath", "cata", "mop", "wod", "legion", "bfa", "sl", "df", "tww"];

const PATTERNS: [RegExp, Expansion][] = [
  [/War Within|Khaz Algar/i, "tww"], [/Dragonflight|Dragon Isles/i, "df"], [/Shadowlands/i, "sl"],
  [/Battle for Azeroth|Kul Tiras|Zandalar/i, "bfa"], [/Legion/i, "legion"], [/Draenor/i, "wod"],
  [/Pandaria/i, "mop"], [/Cataclysm/i, "cata"], [/Lich King|Northrend/i, "wrath"],
  [/Burning Crusade|Outland/i, "tbc"], [/Classic/i, "classic"],
];

function getExpansion(name: string): Expansion | null {
  for (const [p, e] of PATTERNS) if (p.test(name)) return e;
  return null;
}

export function buildCategoryExpansionMap(categories: Category[]): Map<number, Expansion> {
  const map = new Map<number, Expansion>();
  const traverse = (cat: Category, parent: Expansion | null) => {
    const exp = getExpansion(cat.name) || parent;
    if (exp) map.set(cat.id, exp);
    cat.children.forEach((c) => traverse(c, exp));
  };
  categories.forEach((c) => traverse(c, null));
  return map;
}
