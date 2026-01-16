import { describe, it, expect } from "vitest";
import { calculatePoints, formatPoints } from "./points";

describe("calculatePoints", () => {
  it("calculates total points from achievements", () => {
    const achievements = [
      { id: 1, name: "A", points: 10, categoryId: 1 },
      { id: 2, name: "B", points: 20, categoryId: 1 },
      { id: 3, name: "C", points: 5, categoryId: 1 },
    ];
    const result = calculatePoints(achievements);
    expect(result.total).toBe(35);
    expect(result.earned).toBe(0);
  });

  it("calculates earned points with completedIds", () => {
    const achievements = [
      { id: 1, name: "A", points: 10, categoryId: 1 },
      { id: 2, name: "B", points: 20, categoryId: 1 },
      { id: 3, name: "C", points: 5, categoryId: 1 },
    ];
    const completedIds = new Set([1, 3]);
    const result = calculatePoints(achievements, completedIds);
    expect(result.total).toBe(35);
    expect(result.earned).toBe(15);
  });

  it("handles empty achievements array", () => {
    const result = calculatePoints([]);
    expect(result.total).toBe(0);
    expect(result.earned).toBe(0);
  });

  it("handles achievements with undefined points", () => {
    const achievements = [
      { id: 1, name: "A", categoryId: 1 },
      { id: 2, name: "B", points: 10, categoryId: 1 },
    ];
    const completedIds = new Set([1, 2]);
    const result = calculatePoints(achievements, completedIds);
    expect(result.total).toBe(10);
    expect(result.earned).toBe(10);
  });

  it("handles completedIds with non-existent achievement ids", () => {
    const achievements = [{ id: 1, name: "A", points: 10, categoryId: 1 }];
    const completedIds = new Set([1, 999]);
    const result = calculatePoints(achievements, completedIds);
    expect(result.earned).toBe(10);
  });
});

describe("formatPoints", () => {
  it("formats small numbers without separators", () => {
    expect(formatPoints(100)).toBe("100");
  });

  it("formats large numbers with locale separators", () => {
    const result = formatPoints(1000);
    expect(result).toMatch(/1.?000/); // handles different locales
  });

  it("formats zero", () => {
    expect(formatPoints(0)).toBe("0");
  });
});
