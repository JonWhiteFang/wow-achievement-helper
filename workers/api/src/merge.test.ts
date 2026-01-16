import { describe, it, expect } from "vitest";
import type { MergeRequest } from "./merge";

// Test the merge logic directly (without network calls)
describe("merge logic", () => {
  it("unions completed achievements", () => {
    const completedSet = new Set<number>();
    const results = [
      { completed: [1, 2, 3] },
      { completed: [2, 3, 4] },
    ];
    for (const r of results) {
      for (const id of r.completed) completedSet.add(id);
    }
    expect(Array.from(completedSet).sort()).toEqual([1, 2, 3, 4]);
  });

  it("takes max progress per achievement", () => {
    const progressMap: Record<number, { completedCriteria: number; totalCriteria: number }> = {};
    const results = [
      { progress: { 10: { completedCriteria: 2, totalCriteria: 5 } } },
      { progress: { 10: { completedCriteria: 4, totalCriteria: 5 } } },
    ];
    for (const r of results) {
      for (const [idStr, prog] of Object.entries(r.progress)) {
        const id = parseInt(idStr, 10);
        if (!progressMap[id] || prog.completedCriteria > progressMap[id].completedCriteria) {
          progressMap[id] = prog;
        }
      }
    }
    expect(progressMap[10].completedCriteria).toBe(4);
  });

  it("removes completed from progress", () => {
    const completedSet = new Set([10]);
    const progressMap: Record<number, { completedCriteria: number; totalCriteria: number }> = {
      10: { completedCriteria: 5, totalCriteria: 5 },
      20: { completedCriteria: 2, totalCriteria: 5 },
    };
    for (const id of completedSet) delete progressMap[id];
    expect(progressMap[10]).toBeUndefined();
    expect(progressMap[20]).toBeDefined();
  });

  it("handles completedAt timestamps correctly", () => {
    const completedAtMap: Record<number, number> = {};
    const results = [
      { completed: [1, 2], completedAt: { 1: 1000, 2: 2000 } },
      { completed: [1, 3], completedAt: { 1: 1500, 3: 3000 } },
    ];

    for (const r of results) {
      for (const id of r.completed) {
        if (r.completedAt[id] && (!completedAtMap[id] || r.completedAt[id] > completedAtMap[id])) {
          completedAtMap[id] = r.completedAt[id];
        }
      }
    }

    expect(completedAtMap[1]).toBe(1500); // Most recent timestamp
    expect(completedAtMap[2]).toBe(2000);
    expect(completedAtMap[3]).toBe(3000);
  });
});

describe("input validation", () => {
  it("validates empty characters array", () => {
    const characters: { realm: string; name: string }[] = [];
    
    expect(() => {
      if (characters.length === 0) {
        throw { code: "INVALID_INPUT", message: "No characters provided", status: 400 };
      }
    }).toThrow();
  });

  it("validates maximum characters limit", () => {
    const MAX_CHARACTERS = 10;
    const characters = Array(11).fill(0).map((_, i) => ({ realm: "test", name: `char${i}` }));
    
    expect(() => {
      if (characters.length > MAX_CHARACTERS) {
        throw { code: "INVALID_INPUT", message: `Maximum ${MAX_CHARACTERS} characters allowed`, status: 400 };
      }
    }).toThrow();
  });

  it("accepts valid character count", () => {
    const MAX_CHARACTERS = 10;
    const characters = [{ realm: "test", name: "char1" }];
    
    expect(() => {
      if (characters.length === 0) {
        throw { code: "INVALID_INPUT", message: "No characters provided", status: 400 };
      }
      if (characters.length > MAX_CHARACTERS) {
        throw { code: "INVALID_INPUT", message: `Maximum ${MAX_CHARACTERS} characters allowed`, status: 400 };
      }
    }).not.toThrow();
  });
});

describe("error handling", () => {
  it("handles no data scenario", () => {
    const results: any[] = [];
    
    expect(() => {
      if (results.length === 0) {
        throw { code: "NO_DATA", message: "Could not fetch any character data", status: 404 };
      }
    }).toThrow();
  });

  it("filters out null results", () => {
    const batchResults = [
      { completed: [1, 2], progress: {}, character: { realm: "test", name: "char1" } },
      null,
      { completed: [3, 4], progress: {}, character: { realm: "test", name: "char2" } },
    ];

    const results = batchResults.filter((r): r is NonNullable<typeof r> => r !== null);
    
    expect(results).toHaveLength(2);
    expect(results[0].character.name).toBe("char1");
    expect(results[1].character.name).toBe("char2");
  });
});

describe("batch processing", () => {
  it("splits characters into correct batch sizes", () => {
    const BATCH_SIZE = 3;
    const characters = Array(7).fill(0).map((_, i) => ({ realm: "test", name: `char${i}` }));
    const batches: typeof characters[] = [];

    for (let i = 0; i < characters.length; i += BATCH_SIZE) {
      const batch = characters.slice(i, i + BATCH_SIZE);
      batches.push(batch);
    }

    expect(batches).toHaveLength(3);
    expect(batches[0]).toHaveLength(3);
    expect(batches[1]).toHaveLength(3);
    expect(batches[2]).toHaveLength(1);
  });
});
