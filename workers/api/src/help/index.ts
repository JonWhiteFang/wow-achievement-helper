import type { HelpPayload, HelpProvider } from "./types";
import { wowheadProvider } from "./wowhead";

const providers: HelpProvider[] = [wowheadProvider];

export async function fetchHelp(achievementId: number, top: number): Promise<HelpPayload> {
  const wowheadUrl = `https://www.wowhead.com/achievement=${achievementId}`;
  
  // Try each provider in order
  for (const provider of providers) {
    try {
      const result = await provider.fetch(achievementId, top);
      if (result) {
        return {
          achievementId,
          strategy: result.strategy || [],
          comments: result.comments || [],
          sources: result.sources || [{ name: provider.name, url: wowheadUrl }],
        };
      }
    } catch {
      // Continue to next provider
    }
  }
  
  // Fallback: return link-only response
  return {
    achievementId,
    strategy: [],
    comments: [],
    sources: [{ name: "Wowhead", url: wowheadUrl }],
  };
}

export type { HelpPayload };
