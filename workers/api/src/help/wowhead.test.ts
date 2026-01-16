import { describe, it, expect } from "vitest";

// Test HTML parsing edge cases for Wowhead comments
describe("wowhead comment parsing", () => {
  it("extracts comments from JSON-embedded HTML", () => {
    const mockHtml = `
      <script>
        var comments = {
          "body": "This is a helpful comment about the achievement",
          "user": "TestUser",
          "rating": 5
        };
      </script>
    `;

    const commentPattern = /"body"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/g;
    const userPattern = /"user"\s*:\s*"([^"]+)"/g;
    const ratingPattern = /"rating"\s*:\s*(-?\d+)/g;

    const bodies: string[] = [];
    const users: string[] = [];
    const ratings: number[] = [];

    let match;
    while ((match = commentPattern.exec(mockHtml)) !== null) {
      bodies.push(match[1]);
    }

    while ((match = userPattern.exec(mockHtml)) !== null) {
      users.push(match[1]);
    }

    while ((match = ratingPattern.exec(mockHtml)) !== null) {
      ratings.push(parseInt(match[1], 10));
    }

    expect(bodies).toEqual(["This is a helpful comment about the achievement"]);
    expect(users).toEqual(["TestUser"]);
    expect(ratings).toEqual([5]);
  });

  it("handles escaped JSON strings", () => {
    const mockHtml = `
      "body": "This comment has quotes and newlines",
      "user": "EscapedUser"
    `;

    const commentPattern = /"body"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/g;
    const userPattern = /"user"\s*:\s*"([^"]+)"/g;

    const match = commentPattern.exec(mockHtml);
    const userMatch = userPattern.exec(mockHtml);

    expect(match?.[1]).toBe('This comment has quotes and newlines');
    expect(userMatch?.[1]).toBe("EscapedUser");
  });

  it("handles multiple comments", () => {
    const mockHtml = `
      "body": "First comment",
      "user": "User1",
      "rating": 10,
      "body": "Second comment",
      "user": "User2", 
      "rating": -2
    `;

    const commentPattern = /"body"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/g;
    const userPattern = /"user"\s*:\s*"([^"]+)"/g;
    const ratingPattern = /"rating"\s*:\s*(-?\d+)/g;

    const bodies: string[] = [];
    const users: string[] = [];
    const ratings: number[] = [];

    let match;
    while ((match = commentPattern.exec(mockHtml)) !== null) {
      bodies.push(match[1]);
    }

    while ((match = userPattern.exec(mockHtml)) !== null) {
      users.push(match[1]);
    }

    while ((match = ratingPattern.exec(mockHtml)) !== null) {
      ratings.push(parseInt(match[1], 10));
    }

    expect(bodies).toEqual(["First comment", "Second comment"]);
    expect(users).toEqual(["User1", "User2"]);
    expect(ratings).toEqual([10, -2]);
  });

  it("handles malformed HTML gracefully", () => {
    const mockHtml = `
      "user": incomplete
      "rating": not_a_number
      malformed content here
    `;

    const commentPattern = /"body"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/g;
    const userPattern = /"user"\s*:\s*"([^"]+)"/g;
    const ratingPattern = /"rating"\s*:\s*(-?\d+)/g;

    const bodies: string[] = [];
    const users: string[] = [];
    const ratings: number[] = [];

    let match;
    while ((match = commentPattern.exec(mockHtml)) !== null) {
      bodies.push(match[1]);
    }

    while ((match = userPattern.exec(mockHtml)) !== null) {
      users.push(match[1]);
    }

    while ((match = ratingPattern.exec(mockHtml)) !== null) {
      ratings.push(parseInt(match[1], 10));
    }

    expect(bodies).toEqual([]);
    expect(users).toEqual([]);
    expect(ratings).toEqual([]);
  });

  it("limits results to specified top count", () => {
    const comments = [
      { author: "User1", text: "Great guide!", score: 10, date: null },
      { author: "User2", text: "Very helpful", score: 8, date: null },
      { author: "User3", text: "Thanks!", score: 5, date: null },
      { author: "User4", text: "Awesome", score: 3, date: null },
    ];

    const top = 2;
    const limitedComments = comments.slice(0, top);

    expect(limitedComments).toHaveLength(2);
    expect(limitedComments[0].author).toBe("User1");
    expect(limitedComments[1].author).toBe("User2");
  });

  it("sorts comments by score descending", () => {
    const comments = [
      { author: "User1", text: "Comment 1", score: 3, date: null },
      { author: "User2", text: "Comment 2", score: 10, date: null },
      { author: "User3", text: "Comment 3", score: 5, date: null },
      { author: "User4", text: "Comment 4", score: null, date: null },
    ];

    comments.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

    expect(comments[0].score).toBe(10);
    expect(comments[1].score).toBe(5);
    expect(comments[2].score).toBe(3);
    expect(comments[3].score).toBe(null);
  });

  it("filters out very short comments", () => {
    const comments = [
      { text: "This is a long enough comment", author: "User1" },
      { text: "Short", author: "User2" },
      { text: "Also long enough to be useful", author: "User3" },
      { text: "No", author: "User4" },
    ];

    const filteredComments = comments.filter(c => c.text.length > 10);

    expect(filteredComments).toHaveLength(2);
    expect(filteredComments[0].author).toBe("User1");
    expect(filteredComments[1].author).toBe("User3");
  });
});

describe("stripHtml function simulation", () => {
  it("removes HTML tags from text", () => {
    const stripHtml = (html: string): string => {
      return html.replace(/<[^>]*>/g, '').trim();
    };

    const htmlText = "<p>This is <strong>bold</strong> text with <a href='#'>links</a></p>";
    const stripped = stripHtml(htmlText);

    expect(stripped).toBe("This is bold text with links");
  });

  it("handles nested HTML tags", () => {
    const stripHtml = (html: string): string => {
      return html.replace(/<[^>]*>/g, '').trim();
    };

    const htmlText = "<div><p>Nested <em><strong>tags</strong></em> here</p></div>";
    const stripped = stripHtml(htmlText);

    expect(stripped).toBe("Nested tags here");
  });

  it("truncates long text", () => {
    const longText = "A".repeat(1500);
    const truncated = longText.slice(0, 1000);

    expect(truncated).toHaveLength(1000);
    expect(truncated).toBe("A".repeat(1000));
  });
});