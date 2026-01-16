import type { HelpProvider, HelpPayload } from "./types";
import { stripHtml } from "./types";

export const wowheadProvider: HelpProvider = {
  name: "Wowhead",

  async fetch(achievementId: number, top: number): Promise<Partial<HelpPayload> | null> {
    const url = `https://www.wowhead.com/achievement=${achievementId}`;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(url, {
        headers: { "User-Agent": "WoW-Achievement-Helper/1.0" },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        return { comments: [], sources: [{ name: "Wowhead", url }] };
      }

      const html = await res.text();
      const comments = extractComments(html, top);

      return {
        comments,
        sources: [{ name: "Wowhead", url }],
      };
    } catch (err) {
      // Return empty comments with source link on any error (timeout, network, parse)
      return { comments: [], sources: [{ name: "Wowhead", url }] };
    }
  },
};

function extractComments(html: string, top: number): HelpPayload["comments"] {
  const comments: HelpPayload["comments"] = [];

  try {
    // Look for comment data in the page - Wowhead embeds comments in JavaScript
    const commentPattern = /\"body\"\s*:\s*\"([^\"]*(?:\\.[^\"]*)*)\"/g;
    const userPattern = /\"user\"\s*:\s*\"([^\"]+)\"/g;
    const ratingPattern = /\"rating\"\s*:\s*(-?\d+)/g;

    const bodies: string[] = [];
    const users: string[] = [];
    const ratings: number[] = [];

    let match;
    while ((match = commentPattern.exec(html)) !== null && bodies.length < top * 2) {
      try {
        const decoded = JSON.parse(`"${match[1]}"`);
        bodies.push(decoded);
      } catch {
        bodies.push(match[1]);
      }
    }

    while ((match = userPattern.exec(html)) !== null && users.length < top * 2) {
      users.push(match[1]);
    }

    while ((match = ratingPattern.exec(html)) !== null && ratings.length < top * 2) {
      ratings.push(parseInt(match[1], 10));
    }

    for (let i = 0; i < Math.min(bodies.length, users.length); i++) {
      const text = stripHtml(bodies[i]).slice(0, 1000);
      if (text.length > 10) { // Skip very short/empty comments
        comments.push({
          author: users[i] || "Anonymous",
          text,
          score: ratings[i] ?? null,
          date: null,
        });
      }
    }

    comments.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  } catch {
    // Return empty on parse errors
  }

  return comments.slice(0, top);
}
