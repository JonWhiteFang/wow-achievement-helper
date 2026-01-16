import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { formatCompletionDate } from "./dates";

describe("formatCompletionDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows 'just now' for timestamps less than 1 minute ago", () => {
    const timestamp = Date.now() - 30000; // 30 seconds ago
    const result = formatCompletionDate(timestamp);
    expect(result).toContain("just now");
  });

  it("shows minutes ago for timestamps 1-59 minutes ago", () => {
    const timestamp = Date.now() - 5 * 60000; // 5 minutes ago
    const result = formatCompletionDate(timestamp);
    expect(result).toContain("5m ago");
  });

  it("shows hours ago for timestamps 1-23 hours ago", () => {
    const timestamp = Date.now() - 3 * 3600000; // 3 hours ago
    const result = formatCompletionDate(timestamp);
    expect(result).toContain("3h ago");
  });

  it("shows days ago for timestamps 1-29 days ago", () => {
    const timestamp = Date.now() - 7 * 86400000; // 7 days ago
    const result = formatCompletionDate(timestamp);
    expect(result).toContain("7d ago");
  });

  it("shows only absolute date for timestamps 30+ days ago", () => {
    const timestamp = Date.now() - 45 * 86400000; // 45 days ago
    const result = formatCompletionDate(timestamp);
    expect(result).not.toContain("ago");
    expect(result).toMatch(/\w+ \d+, \d{4}/); // e.g., "May 1, 2024"
  });

  it("includes absolute date in all results", () => {
    const timestamp = Date.now() - 60000; // 1 minute ago
    const result = formatCompletionDate(timestamp);
    expect(result).toMatch(/\w+ \d+, \d{4}/);
  });
});
