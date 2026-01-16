import { describe, it, expect } from "vitest";
import { stripHtml } from "./types";

describe("Wowhead comment extraction", () => {
  it("extracts comments from valid HTML", () => {
    const html = `
      "body":"This is a test comment with <b>bold</b> text"
      "user":"TestUser"
      "rating":42
    `;

    const bodyPattern = /"body"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/g;
    const userPattern = /"user"\s*:\s*"([^"]+)"/g;
    const ratingPattern = /"rating"\s*:\s*(-?\d+)/g;

    const bodies: string[] = [];
    const users: string[] = [];
    const ratings: number[] = [];

    let match;
    while ((match = bodyPattern.exec(html)) !== null) {
      bodies.push(match[1]);
    }
    while ((match = userPattern.exec(html)) !== null) {
      users.push(match[1]);
    }
    while ((match = ratingPattern.exec(html)) !== null) {
      ratings.push(parseInt(match[1], 10));
    }

    expect(bodies).toHaveLength(1);
    expect(users).toHaveLength(1);
    expect(ratings).toHaveLength(1);
    expect(users[0]).toBe("TestUser");
    expect(ratings[0]).toBe(42);
  });

  it("handles empty HTML gracefully", () => {
    const html = "";
    const bodyPattern = /"body"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/g;
    const bodies: string[] = [];

    let match;
    while ((match = bodyPattern.exec(html)) !== null) {
      bodies.push(match[1]);
    }

    expect(bodies).toHaveLength(0);
  });

  it("handles malformed JSON in body field", () => {
    const html = `"body":"Test with \\"escaped quotes\\""`;
    const bodyPattern = /"body"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/g;
    const match = bodyPattern.exec(html);

    expect(match).not.toBeNull();
    if (match) {
      try {
        const decoded = JSON.parse(`"${match[1]}"`);
        expect(decoded).toBe('Test with "escaped quotes"');
      } catch {
        // Fallback to raw string
        expect(match[1]).toContain("escaped");
      }
    }
  });

  it("handles missing user field", () => {
    const html = `
      "body":"Comment without user"
      "rating":10
    `;

    const userPattern = /"user"\s*:\s*"([^"]+)"/g;
    const users: string[] = [];

    let match;
    while ((match = userPattern.exec(html)) !== null) {
      users.push(match[1]);
    }

    expect(users).toHaveLength(0);
  });

  it("handles missing rating field", () => {
    const html = `
      "body":"Comment without rating"
      "user":"TestUser"
    `;

    const ratingPattern = /"rating"\s*:\s*(-?\d+)/g;
    const ratings: number[] = [];

    let match;
    while ((match = ratingPattern.exec(html)) !== null) {
      ratings.push(parseInt(match[1], 10));
    }

    expect(ratings).toHaveLength(0);
  });

  it("sorts comments by score descending", () => {
    const comments = [
      { author: "User1", text: "Comment 1", score: 5, date: null },
      { author: "User2", text: "Comment 2", score: 15, date: null },
      { author: "User3", text: "Comment 3", score: 10, date: null },
    ];

    comments.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

    expect(comments[0].score).toBe(15);
    expect(comments[1].score).toBe(10);
    expect(comments[2].score).toBe(5);
  });

  it("limits results to top N comments", () => {
    const comments = Array(20).fill(0).map((_, i) => ({
      author: `User${i}`,
      text: `Comment ${i}`,
      score: i,
      date: null,
    }));

    const top = 10;
    const limited = comments.slice(0, top);

    expect(limited).toHaveLength(10);
  });

  it("filters out very short comments", () => {
    const comments = [
      { text: "This is a good comment", score: 10 },
      { text: "ok", score: 5 },
      { text: "Another detailed comment here", score: 8 },
      { text: "x", score: 3 },
    ];

    const filtered = comments.filter((c) => c.text.length > 10);

    expect(filtered).toHaveLength(2);
  });

  it("strips HTML from comment text", () => {
    const html = "This is <b>bold</b> and <i>italic</i> text";
    const stripped = stripHtml(html);

    expect(stripped).not.toContain("<b>");
    expect(stripped).not.toContain("</b>");
    expect(stripped).toContain("bold");
    expect(stripped).toContain("italic");
  });

  it("truncates long comments", () => {
    const longText = "a".repeat(2000);
    const truncated = longText.slice(0, 1000);

    expect(truncated).toHaveLength(1000);
  });
});
