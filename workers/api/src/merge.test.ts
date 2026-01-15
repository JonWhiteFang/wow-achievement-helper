import { describe, it, expect } from "vitest";

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
});
