import { useQuery } from "@tanstack/react-query";
import { fetchCharacterAchievements, type CharacterProgress } from "../lib/api";

export function useCharacterQuery(realm: string | null, name: string | null) {
  return useQuery<CharacterProgress>({
    queryKey: ["character", realm, name],
    queryFn: () => fetchCharacterAchievements(realm!, name!),
    enabled: !!realm && !!name,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}
