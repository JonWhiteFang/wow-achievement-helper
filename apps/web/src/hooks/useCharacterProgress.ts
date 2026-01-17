import { useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchCharacterAchievements, mergeCharacters, type CharacterProgress, type MergeResult } from "../lib/api";
import { getSavedCharacter, saveCharacter, clearSavedCharacter, getMergeSelection, saveMergeSelection, clearMergeSelection } from "../lib/storage";

export type ViewMode = "single" | "merged" | "compare";

export function useCharacterProgress() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [charProgress, setCharProgress] = useState<CharacterProgress | null>(null);
  const [compareProgress, setCompareProgress] = useState<CharacterProgress | null>(null);
  const [mergeResult, setMergeResult] = useState<MergeResult | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("single");
  const [charLoading, setCharLoading] = useState(false);
  const [charError, setCharError] = useState<string | null>(null);
  const [mergeSelection, setMergeSelection] = useState<{ realm: string; name: string }[]>(() => getMergeSelection());

  const loadCharacter = useCallback(async (realm: string, name: string) => {
    setCharLoading(true);
    setCharError(null);
    setViewMode("single");
    setCompareProgress(null);
    try {
      const data = await fetchCharacterAchievements(realm, name);
      setCharProgress(data);
      saveCharacter({ realm: data.character.realm, name: data.character.name });
      setSearchParams({ character: `${data.character.realm}/${data.character.name}` });
    } catch (e) {
      setCharError((e as Error).message);
    } finally {
      setCharLoading(false);
    }
  }, [setSearchParams]);

  const loadCompareCharacter = useCallback(async (realm: string, name: string) => {
    setCharLoading(true);
    setCharError(null);
    try {
      const data = await fetchCharacterAchievements(realm, name);
      setCompareProgress(data);
      setViewMode("compare");
    } catch (e) {
      setCharError((e as Error).message);
    } finally {
      setCharLoading(false);
    }
  }, []);

  const loadMerge = useCallback(async (characters: { realm: string; name: string }[]) => {
    setCharLoading(true);
    setCharError(null);
    setViewMode("merged");
    setMergeSelection(characters);
    saveMergeSelection(characters);
    try {
      const data = await mergeCharacters(characters);
      setMergeResult(data);
      const params = new URLSearchParams(searchParams);
      params.delete("character");
      setSearchParams(params);
    } catch (e) {
      setCharError((e as Error).message);
    } finally {
      setCharLoading(false);
    }
  }, [searchParams, setSearchParams]);

  const handleClearCharacter = useCallback(() => {
    setCharProgress(null);
    setCompareProgress(null);
    setMergeResult(null);
    setCharError(null);
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
