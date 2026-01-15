import type { HelpProvider, HelpPayload } from "./types";
import { stripHtml } from "./types";

export const wowheadProvider: HelpProvider = {
  name: "Wowhead",

  async fetch(achievementId: number, top: number): Promise<Partial<HelpPayload> | null> {
    const url = `https://www.wowhead.com/achievement=${achievementId}`;
    
    try {
      // Fetch the achievement page
      const res = await fetch(url, {
        headers: { "User-Agent": "WoW-Achievement-Helper/1.0" },
      });
      
      if (!res.ok) return null;
      
      const html = await res.text();
      const comments = extractComments(html, top);
      
      return {
        comments,
        sources: [{ name: "Wowhead", url }],
      };
    } catch {
      return null;
    }
  },
};

function extractComments(html: string, top: number): HelpPayload["comments"] {
  const comments: HelpPayload["comments"] = [];
  
  // Look for comment data in the page - Wowhead embeds comments in JavaScript
  // Pattern: {"body":"...", "user":"...", "rating":...}
  const commentPattern = /"body"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/g;
  const userPattern = /"user"\s*:\s*"([^"]+)"/g;
  const ratingPattern = /"rating"\s*:\s*(-?\d+)/g;
  
  const bodies: string[] = [];
  const users: string[] = [];
  const ratings: number[] = [];
  
  let match;
  while ((match = commentPattern.exec(html)) !== null && bodies.length < top * 2) {
    try {
      // Unescape JSON string
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
  
  // Combine and sort by rating
  for (let i = 0; i < Math.min(bodies.length, users.length); i++) {
    comments.push({
      author: users[i] || "Anonymous",
      text: stripHtml(bodies[i]).slice(0, 1000), // Limit length
      score: ratings[i] ?? null,
      date: null,
    });
  }
  
  // Sort by score descending, take top N
  comments.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  return comments.slice(0, top);
}
