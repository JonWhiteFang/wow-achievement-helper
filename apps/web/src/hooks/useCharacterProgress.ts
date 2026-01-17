import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchCharacterAchievements, mergeCharacters, type CharacterProgress, type MergeResult } from "../lib/api";
import { getSavedCharacter, saveCharacter, clearSavedCharacter, getMergeSelection, saveMergeSelection, clearMergeSelection } from "../lib/storage";

export type ViewMode = "single" | "merged" | "compare";

export function useCharacterProgress() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [charProgress, setCharProgress] = useState<CharacterProgress | null>(null);
  const [compareProgress, setCompareProgress] = useState<CharacterProgress | null>(null);
  const [mergeResult, setMergeResult] = useState<MergeResult | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("single");
  const [mergeSelection, setMergeSelection] = useState<{ realm: string; name: string }[]>(() => getMergeSelection());

  const characterMutation = useMutation({
    mutationFn: ({ realm, name }: { realm: string; name: string }) => fetchCharacterAchievements(realm, name),
    onSuccess: (data) => {
      setCharProgress(data);
      queryClient.setQueryData(["character", data.character.realm, data.character.name], data);
      saveCharacter({ realm: data.character.realm, name: data.character.name });
      setSearchParams({ character: `${data.character.realm}/${data.character.name}` });
    },
  });

  const compareMutation = useMutation({
    mutationFn: ({ realm, name }: { realm: string; name: string }) => fetchCharacterAchievements(realm, name),
    onSuccess: (data) => {
      setCompareProgress(data);
      queryClient.setQueryData(["character", data.character.realm, data.character.name], data);
      setViewMode("compare");
    },
  });

  const mergeMutation = useMutation({
    mutationFn: (characters: { realm: string; name: string }[]) => mergeCharacters(characters),
    onSuccess: (data) => {
      setMergeResult(data);
      const params = new URLSearchParams(searchParams);
      params.delete("character");
      setSearchParams(params);
    },
  });

  const loadCharacter = useCallback((realm: string, name: string) => {
    setViewMode("single");
    setCompareProgress(null);
    characterMutation.mutate({ realm, name });
  }, [characterMutation]);

  const loadCompareCharacter = useCallback((realm: string, name: string) => {
    compareMutation.mutate({ realm, name });
  }, [compareMutation]);

  const loadMerge = useCallback((characters: { realm: string; name: string }[]) => {
    setViewMode("merged");
    setMergeSelection(characters);
    saveMergeSelection(characters);
    mergeMutation.mutate(characters);
  }, [mergeMutation]);

  const handleClearCharacter = useCallback(() => {
    setCharProgress(null);
    setCompareProgress(null);
    setMergeResult(null);
    clearSavedCharacter();
    clearMergeSelection();
    setMergeSelection([]);
    setViewMode("single");
    const params = new URLSearchParams(searchParams);
    params.delete("character");
    setSearchParams(params);
  }, [searchParams, setSearchParams]);

  const exitCompareMode = useCallback(() => {
    setCompareProgress(null);
    setViewMode("single");
  }, []);

  const initFromUrl = useCallback(() => {
    const charParam = searchParams.get("character");
    if (charParam) {
      const [realm, name] = charParam.split("/");
      if (realm && name) return { realm, name };
    }
    return getSavedCharacter();
  }, [searchParams]);

  const charLoading = characterMutation.isPending || compareMutation.isPending || mergeMutation.isPending;
  const charError = characterMutation.error?.message || compareMutation.error?.message || mergeMutation.error?.message || null;
  const activeData = viewMode === "merged" && mergeResult ? mergeResult.merged : charProgress;

  return {
    charProgress,
    compareProgress,
    mergeResult,
    viewMode,
    charLoading,
    charError,
    mergeSelection,
    activeData,
    loadCharacter,
    loadCompareCharacter,
    loadMerge,
    handleClearCharacter,
    exitCompareMode,
    initFromUrl,
  };
}
