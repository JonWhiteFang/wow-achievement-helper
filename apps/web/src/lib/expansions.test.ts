import { describe, it, expect } from "vitest";
import { buildCategoryExpansionMap } from "./expansions";
import type { Category } from "./api";

describe("buildCategoryExpansionMap", () => {
  it("detects War Within expansion", () => {
    const categories: Category[] = [{ id: 1, name: "War Within", children: [] }];
    const map = buildCategoryExpansionMap(categories);
    expect(map.get(1)).toBe("tww");
  });

  it("detects Dragonflight expansion", () => {
    const categories: Category[] = [{ id: 1, name: "Dragonflight", children: [] }];
    const map = buildCategoryExpansionMap(categories);
    expect(map.get(1)).toBe("df");
  });

  it("detects Shadowlands expansion", () => {
    const categories: Category[] = [{ id: 1, name: "Shadowlands", children: [] }];
    const map = buildCategoryExpansionMap(categories);
    expect(map.get(1)).toBe("sl");
  });

  it("detects Lich King/Wrath expansion", () => {
    const categories: Category[] = [{ id: 1, name: "Lich King", children: [] }];
    const map = buildCategoryExpansionMap(categories);
    expect(map.get(1)).toBe("wrath");
  });

  it("detects Burning Crusade expansion", () => {
    const categories: Category[] = [{ id: 1, name: "Burning Crusade", children: [] }];
    const map = buildCategoryExpansionMap(categories);
    expect(map.get(1)).toBe("tbc");
  });

  it("inherits expansion from parent category", () => {
    const categories: Category[] = [
      {
        id: 1,
        name: "Dragonflight",
        children: [{ id: 2, name: "Quests", children: [] }],
      },
    ];
    const map = buildCategoryExpansionMap(categories);
    expect(map.get(1)).toBe("df");
    expect(map.get(2)).toBe("df");
  });

  it("child can override parent expansion", () => {
    const categories: Category[] = [
      {
        id: 1,
        name: "Dungeons",
        children: [{ id: 2, name: "Shadowlands Dungeons", children: [] }],
      },
    ];
    const map = buildCategoryExpansionMap(categories);
    expect(map.has(1)).toBe(false); // parent has no expansion
    expect(map.get(2)).toBe("sl");
  });

  it("returns empty map for categories with no expansion match", () => {
    const categories: Category[] = [{ id: 1, name: "General", children: [] }];
    const map = buildCategoryExpansionMap(categories);
    expect(map.has(1)).toBe(false);
  });

  it("handles deeply nested categories", () => {
    const categories: Category[] = [
      {
        id: 1,
        name: "Legion",
        children: [
          {
            id: 2,
            name: "Raids",
            children: [{ id: 3, name: "Emerald Nightmare", children: [] }],
          },
        ],
      },
    ];
    const map = buildCategoryExpansionMap(categories);
    expect(map.get(1)).toBe("legion");
    expect(map.get(2)).toBe("legion");
    expect(map.get(3)).toBe("legion");
  });
});
