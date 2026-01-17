import { useState, useEffect, useCallback } from "react";
import { fetchAuthStatus, type AuthStatus } from "../lib/api";
import { getRecentCategories, addRecentCategory, getTheme, setTheme as saveTheme, type RecentCategory } from "../lib/storage";
import { getPins, togglePin as togglePinStorage } from "../lib/pins";

export function useAppState() {
  const [auth, setAuth] = useState<AuthStatus>({ loggedIn: false });
  const [sessionExpired, setSessionExpired] = useState(false);
  const [recentCategories, setRecentCategories] = useState<RecentCategory[]>([]);
  const [theme, setThemeState] = useState<"dark" | "light">("dark");
  const [pinnedIds, setPinnedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchAuthStatus().then((status) => {
      setAuth(status);
      if (status.sessionExpired) setSessionExpired(true);
    });
    setRecentCategories(getRecentCategories());
    const savedTheme = getTheme();
    setThemeState(savedTheme);
    document.documentElement.dataset.theme = savedTheme;
    setPinnedIds(getPins());
  }, []);

  const toggleTheme = useCallback(() => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setThemeState(newTheme);
    saveTheme(newTheme);
  }, [theme]);

  const addRecent = useCallback((cat: RecentCategory) => {
    addRecentCategory(cat);
    setRecentCategories(getRecentCategories());
  }, []);

  const togglePin = useCallback((id: number) => {
    setPinnedIds(togglePinStorage(id));
  }, []);

  const dismissSessionExpired = useCallback(() => setSessionExpired(false), []);
  const handleLogout = useCallback(() => setAuth({ loggedIn: false }), []);

  return {
    auth,
    sessionExpired,
    recentCategories,
    theme,
    pinnedIds,
    toggleTheme,
    addRecent,
    togglePin,
    dismissSessionExpired,
    handleLogout,
  };
}
