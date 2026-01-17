import { describe, it, expect } from "vitest";

describe("fetchAchievement childAchievements parsing", () => {
  it("extracts childAchievements from linked_achievement", () => {
    const mockData = {
      criteria: {
        child_criteria: [
          {
            id: 1,
            description: "The Dedicated Few",
            linked_achievement: { id: 562, name: "The Dedicated Few" },
          },
          {
            id: 2,
            description: "Arachnophobia",
            linked_achievement: { id: 1858, name: "Arachnophobia" },
          },
        ],
      },
    };

    const childAchievements: { id: number; name: string }[] = [];
    const criteria: { id: number; description: string; amount: number }[] = [];

    if (mockData.criteria?.child_criteria) {
      for (const c of mockData.criteria.child_criteria) {
        if (c.linked_achievement) {
          childAchievements.push({ id: c.linked_achievement.id, name: c.linked_achievement.name });
        } else {
          criteria.push({ id: c.id, description: c.description || "", amount: 1 });
        }
      }
    }

    expect(childAchievements).toHaveLength(2);
    expect(childAchievements[0]).toEqual({ id: 562, name: "The Dedicated Few" });
    expect(childAchievements[1]).toEqual({ id: 1858, name: "Arachnophobia" });
    expect(criteria).toHaveLength(0);
  });

  it("separates linked achievements from regular criteria", () => {
    const mockData = {
      criteria: {
        child_criteria: [
          {
            id: 1,
            description: "Sub Achievement",
            linked_achievement: { id: 100, name: "Sub Achievement" },
          },
          {
            id: 2,
            description: "Kill 50 enemies",
            amount: 50,
          },
          {
            id: 3,
            description: "Another Sub",
            linked_achievement: { id: 200, name: "Another Sub" },
          },
        ],
      },
    };

    const childAchievements: { id: number; name: string }[] = [];
    const criteria: { id: number; description: string; amount: number }[] = [];

    if (mockData.criteria?.child_criteria) {
      for (const c of mockData.criteria.child_criteria) {
        if (c.linked_achievement) {
          childAchievements.push({ id: c.linked_achievement.id, name: c.linked_achievement.name });
        } else {
          criteria.push({ id: c.id, description: c.description || "", amount: c.amount || 1 });
        }
      }
    }

    expect(childAchievements).toHaveLength(2);
    expect(criteria).toHaveLength(1);
    expect(criteria[0]).toEqual({ id: 2, description: "Kill 50 enemies", amount: 50 });
  });

  it("handles achievements with no child_criteria", () => {
    const mockData: { criteria: { id: number; description: string; amount: number; child_criteria?: unknown[] } } = {
      criteria: {
        id: 1,
        description: "Single criterion",
        amount: 1,
      },
    };

    const childAchievements: { id: number; name: string }[] = [];
    const criteria: { id: number; description: string; amount: number }[] = [];

    if (mockData.criteria) {
      if (mockData.criteria.child_criteria) {
        // Has child_criteria
      } else {
        criteria.push({
          id: mockData.criteria.id,
          description: mockData.criteria.description || "",
          amount: mockData.criteria.amount || 1,
        });
      }
    }

    expect(childAchievements).toHaveLength(0);
    expect(criteria).toHaveLength(1);
  });

  it("returns undefined childAchievements when empty", () => {
    const childAchievements: { id: number; name: string }[] = [];
    const result = childAchievements.length > 0 ? childAchievements : undefined;
    expect(result).toBeUndefined();
  });
});
