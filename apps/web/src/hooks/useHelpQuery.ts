import { useQuery } from "@tanstack/react-query";
import { fetchHelp, type HelpPayload } from "../lib/api";

export function useHelpQuery(achievementId: number | null, enabled: boolean) {
  return useQuery<HelpPayload>({
    queryKey: ["help", achievementId],
    queryFn: () => fetchHelp(achievementId!, 10),
    enabled: enabled && !!achievementId,
    staleTime: 12 * 60 * 60 * 1000, // 12 hours (matches worker cache)
    retry: 1,
  });
}
