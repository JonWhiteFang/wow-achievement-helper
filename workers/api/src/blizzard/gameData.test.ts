import { describe, it, expect } from "vitest";

// Test childAchievements parsing from linked_achievement
describe("childAchievements parsing", () => {
  it("parses child achievements from linked_achievement criteria", () => {
    const mockData = {
      criteria: {
        child_criteria: [
          {
            id: 1,
            linked_achievement: { id: 100, name: "First Achievement" }
          },
          {
            id: 2,
            linked_achievement: { id: 200, name: "Second Achievement" }
          }
        ]
      }
    };

    const childAchievements: { id: number; name: string }[] = [];
    
    if (mockData.criteria?.child_criteria && Array.isArray(mockData.criteria.child_criteria)) {
      for (const c of mockData.criteria.child_criteria) {
        if (c.linked_achievement) {
          childAchievements.push({ id: c.linked_achievement.id, name: c.linked_achievement.name });
        }
      }
    }

    expect(childAchievements).toEqual([
      { id: 100, name: "First Achievement" },
      { id: 200, name: "Second Achievement" }
    ]);
  });

  it("handles mixed criteria with regular and linked achievements", () => {
    const mockData = {
      criteria: {
        child_criteria: [
          {
            id: 1,
            description: "Regular criteria",
            amount: 5
          },
          {
            id: 2,
            linked_achievement: { id: 100, name: "Linked Achievement" }
          }
        ]
      }
    };

    const criteria: { id: number; description: string; amount: number }[] = [];
    const childAchievements: { id: number; name: string }[] = [];
    
    if (mockData.criteria?.child_criteria && Array.isArray(mockData.criteria.child_criteria)) {
      for (const c of mockData.criteria.child_criteria) {
        if (c.linked_achievement) {
          childAchievements.push({ id: c.linked_achievement.id, name: c.linked_achievement.name });
        } else {
          criteria.push({ id: c.id, description: c.description || "", amount: c.amount || 1 });
        }
      }
    }

    expect(criteria).toEqual([
      { id: 1, description: "Regular criteria", amount: 5 }
    ]);
    expect(childAchievements).toEqual([
      { id: 100, name: "Linked Achievement" }
    ]);
  });

  it("handles single criteria without child_criteria", () => {
    const mockData = {
      criteria: {
        id: 1,
        description: "Single criteria",
        amount: 1
      }
    };

    const criteria: { id: number; description: string; amount: number }[] = [];
    const childAchievements: { id: number; name: string }[] = [];
    
    if (mockData.criteria) {
      if (mockData.criteria.child_criteria && Array.isArray(mockData.criteria.child_criteria)) {
        for (const c of mockData.criteria.child_criteria) {
          if (c.linked_achievement) {
            childAchievements.push({ id: c.linked_achievement.id, name: c.linked_achievement.name });
          } else {
            criteria.push({ id: c.id, description: c.description || "", amount: c.amount || 1 });
          }
        }
      } else {
        criteria.push({ id: mockData.criteria.id, description: mockData.criteria.description || "", amount: mockData.criteria.amount || 1 });
      }
    }

    expect(criteria).toEqual([
      { id: 1, description: "Single criteria", amount: 1 }
    ]);
    expect(childAchievements).toEqual([]);
  });

  it("handles missing criteria gracefully", () => {
    const mockData = {};

    const criteria: { id: number; description: string; amount: number }[] = [];
    const childAchievements: { id: number; name: string }[] = [];
    
    if (mockData.criteria) {
      if (mockData.criteria.child_criteria && Array.isArray(mockData.criteria.child_criteria)) {
        for (const c of mockData.criteria.child_criteria) {
          if (c.linked_achievement) {
            childAchievements.push({ id: c.linked_achievement.id, name: c.linked_achievement.name });
          } else {
            criteria.push({ id: c.id, description: c.description || "", amount: c.amount || 1 });
          }
        }
      } else if (mockData.criteria.id) {
        criteria.push({ id: mockData.criteria.id, description: mockData.criteria.description || "", amount: mockData.criteria.amount || 1 });
      }
    }

    expect(criteria).toEqual([]);
    expect(childAchievements).toEqual([]);
  });

  it("handles empty child_criteria array", () => {
    const mockData = {
      criteria: {
        child_criteria: []
      }
    };

    const childAchievements: { id: number; name: string }[] = [];
    
    if (mockData.criteria?.child_criteria && Array.isArray(mockData.criteria.child_criteria)) {
      for (const c of mockData.criteria.child_criteria) {
        if (c.linked_achievement) {
          childAchievements.push({ id: c.linked_achievement.id, name: c.linked_achievement.name });
        }
      }
    }

    expect(childAchievements).toEqual([]);
  });
});