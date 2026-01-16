import { describe, it, expect } from "vitest";

// Test meta achievement detection logic
describe("meta achievement detection", () => {
  it("detects meta achievements from child_criteria with linked_achievement", () => {
    const mockCriteria = {
      child_criteria: [
        {
          id: 12345,
          description: "Achievement Name",
          linked_achievement: { id: 6789, name: "Achievement Name" }
        },
        {
          id: 12346,
          description: "Another Achievement",
          linked_achievement: { id: 6790, name: "Another Achievement" }
        }
      ]
    };

    const linkedAchievements = mockCriteria.child_criteria
      .filter(c => c.linked_achievement)
      .map(c => c.linked_achievement!.id);

    expect(linkedAchievements).toEqual([6789, 6790]);
    expect(linkedAchievements.length > 0).toBe(true);
  });

  it("returns empty array when no linked achievements", () => {
    const mockCriteria = {
      child_criteria: [
        {
          id: 12345,
          description: "Regular criteria",
          amount: 1
        }
      ]
    };

    const linkedAchievements = mockCriteria.child_criteria
      .filter(c => c.linked_achievement)
      .map(c => c.linked_achievement!.id);

    expect(linkedAchievements).toEqual([]);
    expect(linkedAchievements.length > 0).toBe(false);
  });

  it("handles mixed criteria types", () => {
    const mockCriteria = {
      child_criteria: [
        {
          id: 12345,
          description: "Regular criteria",
          amount: 5
        },
        {
          id: 12346,
          description: "Linked achievement",
          linked_achievement: { id: 6789, name: "Sub Achievement" }
        }
      ]
    };

    const linkedAchievements = mockCriteria.child_criteria
      .filter(c => c.linked_achievement)
      .map(c => c.linked_achievement!.id);

    expect(linkedAchievements).toEqual([6789]);
  });

  it("handles empty child_criteria", () => {
    const mockCriteria = {
      child_criteria: []
    };

    const linkedAchievements = mockCriteria.child_criteria
      .filter(c => c.linked_achievement)
      .map(c => c.linked_achievement!.id);

    expect(linkedAchievements).toEqual([]);
  });
});

describe("childAchievementIds extraction", () => {
  it("extracts child achievement IDs correctly", () => {
    const mockResponse = {
      criteria: {
        child_criteria: [
          { linked_achievement: { id: 100 } },
          { linked_achievement: { id: 200 } },
          { linked_achievement: { id: 300 } }
        ]
      }
    };

    let isMeta = false;
    let childAchievementIds: number[] | undefined;

    if (mockResponse.criteria?.child_criteria) {
      const linkedAchievements = mockResponse.criteria.child_criteria
        .filter(c => c.linked_achievement)
        .map(c => c.linked_achievement!.id);
      
      if (linkedAchievements.length > 0) {
        isMeta = true;
        childAchievementIds = linkedAchievements;
      }
    }

    expect(isMeta).toBe(true);
    expect(childAchievementIds).toEqual([100, 200, 300]);
  });

  it("handles missing criteria structure", () => {
    const mockResponse = {};

    let isMeta = false;
    let childAchievementIds: number[] | undefined;

    if (mockResponse.criteria?.child_criteria) {
      const linkedAchievements = mockResponse.criteria.child_criteria
        .filter(c => c.linked_achievement)
        .map(c => c.linked_achievement!.id);
      
      if (linkedAchievements.length > 0) {
        isMeta = true;
        childAchievementIds = linkedAchievements;
      }
    }

    expect(isMeta).toBe(false);
    expect(childAchievementIds).toBeUndefined();
  });
});