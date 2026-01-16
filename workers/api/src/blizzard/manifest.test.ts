import { describe, it, expect } from "vitest";

describe("manifest meta achievement detection", () => {
  it("detects meta achievements from linked_achievement in child_criteria", () => {
    // Mock Blizzard API response with linked_achievement
    const mockAchievementData = {
      id: 2144,
      name: "Glory of the Raider",
      points: 25,
      is_account_wide: true,
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

    // Extract meta achievement info
    const hasLinkedAchievements = mockAchievementData.criteria?.child_criteria?.some(
      (c: any) => c.linked_achievement
    );
    const childAchievementIds = mockAchievementData.criteria?.child_criteria
      ?.filter((c: any) => c.linked_achievement)
      .map((c: any) => c.linked_achievement.id);

    expect(hasLinkedAchievements).toBe(true);
    expect(childAchievementIds).toEqual([562, 1858]);
  });

  it("does not mark regular achievements as meta", () => {
    // Mock regular achievement without linked_achievement
    const mockAchievementData = {
      id: 100,
      name: "Regular Achievement",
      points: 10,
      is_account_wide: false,
      criteria: {
        child_criteria: [
          {
            id: 1,
            description: "Kill 10 enemies",
            amount: 10,
          },
        ],
      },
    };

    const hasLinkedAchievements = mockAchievementData.criteria?.child_criteria?.some(
      (c: any) => c.linked_achievement
    );

    expect(hasLinkedAchievements).toBe(false);
  });

  it("handles achievements with no criteria", () => {
    const mockAchievementData = {
      id: 200,
      name: "Simple Achievement",
      points: 5,
      is_account_wide: false,
    };

    const hasLinkedAchievements = mockAchievementData.criteria?.child_criteria?.some(
      (c: any) => c.linked_achievement
    );

    expect(hasLinkedAchievements).toBeUndefined();
  });

  it("handles mixed criteria (some linked, some not)", () => {
    const mockAchievementData = {
      id: 300,
      name: "Mixed Achievement",
      points: 15,
      is_account_wide: true,
      criteria: {
        child_criteria: [
          {
            id: 1,
            description: "Sub Achievement",
            linked_achievement: { id: 400, name: "Sub Achievement" },
          },
          {
            id: 2,
            description: "Regular criterion",
            amount: 5,
          },
        ],
      },
    };

    const linkedAchievements = mockAchievementData.criteria?.child_criteria
      ?.filter((c: any) => c.linked_achievement)
      .map((c: any) => c.linked_achievement.id);

    expect(linkedAchievements).toEqual([400]);
  });
});
