import type { HelpProvider, HelpPayload } from "./types";

// Import strategy data - these are bundled at build time
import strategy7520 from "../data/strategy/7520.json";
import strategy2144 from "../data/strategy/2144.json";
import strategy40393 from "../data/strategy/40393.json";

type StrategyData = {
  id: number;
  name: string;
  strategy: Array<{ title: string; steps: string[] }>;
};

const strategies: Map<number, StrategyData> = new Map([
  [7520, strategy7520 as StrategyData],
  [2144, strategy2144 as StrategyData],
  [40393, strategy40393 as StrategyData],
]);

export const curatedProvider: HelpProvider = {
  name: "Curated",

  async fetch(achievementId: number): Promise<Partial<HelpPayload> | null> {
    const data = strategies.get(achievementId);
    if (!data) return null;

    return {
      strategy: data.strategy,
      sources: [{ name: "Curated", url: "" }],
    };
  },
};
