export type HelpPayload = {
  achievementId: number;
  strategy: Array<{ title: string; steps: string[] }>;
  comments: Array<{ author: string; text: string; score: number | null; date: string | null }>;
  sources: Array<{ name: string; url: string }>;
};

export interface HelpProvider {
  name: string;
  fetch(achievementId: number, top: number): Promise<Partial<HelpPayload> | null>;
}

/** Strip HTML tags and decode entities */
export function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}
