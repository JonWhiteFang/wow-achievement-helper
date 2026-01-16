import type { HelpPayload, HelpProvider } from "./types";
import { curatedProvider } from "./curated";
import { wowheadProvider } from "./wowhead";

// Provider order: curated first (authoritative), then community (wowhead)
const strategyProviders: HelpProvider[] = [curatedProvider];
const communityProviders: HelpProvider[] = [wowheadProvider];

export async function fetchHelp(achievementId: number, top: number): Promise<HelpPayload> {
  const wowheadUrl = `https://www.wowhead.com/achievement=${achievementId}`;
  const result: HelpPayload = {
    achievementId,
    strategy: [],
    comments: [],
    sources: [],
  };

  // Fetch strategy from curated providers
  for (const provider of strategyProviders) {
    try {
      const data = await provider.fetch(achievementId, top);
      if (data?.strategy?.length) {
        result.strategy = data.strategy;
        if (data.sources) result.sources.push(...data.sources);
        break;
      }
    } catch {
      // Continue to next provider
    }
  }

  // Fetch comments from community providers
  for (const provider of communityProviders) {
    try {
      const data = await provider.fetch(achievementId, top);
      if (data) {
        if (data.comments?.length) result.comments = data.comments;
        if (data.sources) result.sources.push(...data.sources);
        break;
      }
    } catch {
      // Continue to next provider
    }
  }

  // Always include Wowhead link as fallback source
  if (!result.sources.some((s) => s.name === "Wowhead")) {
    result.sources.push({ name: "Wowhead", url: wowheadUrl });
  }

  return result;
}

export type { HelpPayload };
