/**
 * Applies a user's display preferences to <html> as data attributes (see theme.css for the contract)
 * and keeps "system" theme in sync with the OS.
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "./api";
import { BOOTSTRAP_KEY } from "./bootstrap";
import type { Bootstrap, Preferences } from "./types";

export const DEFAULT_PREFERENCES: Preferences = {
  theme: "dark",
  density: "comfortable",
  timezone: "UTC",
  clock_24h: true,
  reduce_motion: false,
  text_scale: 0,
  high_contrast: false,
  muted_categories: [],
  dashboard: {},
};

/**
 * Named themes beyond plain dark/light. Each sits on a dark or light base (so data-theme, and every
 * rule keyed on it, still applies) and sets data-skin="<name>" for its own tokens in theme.css.
 * index.html repeats this map for the first paint.
 */
export const SKINS = {
  sakura: { mode: "light", themeColor: "#fdf1f5" },
  neotokyo: { mode: "dark", themeColor: "#0d0a1a" },
} as const;

const THEME_KEY = "conduit:theme";
const media = typeof window !== "undefined" ? window.matchMedia("(prefers-color-scheme: light)") : null;
let current: Preferences = DEFAULT_PREFERENCES;

function skinOf(theme: Preferences["theme"]) {
  return theme in SKINS ? SKINS[theme as keyof typeof SKINS] : null;
}

/** The dark or light base a theme sits on. */
export function resolvedTheme(theme: Preferences["theme"]): "dark" | "light" {
  if (theme === "system") return media?.matches ? "light" : "dark";
  return skinOf(theme)?.mode ?? (theme as "dark" | "light");
}

/** Set the attributes on <html>. Safe to call often. */
export function applyPreferences(prefs: Partial<Preferences> | null | undefined) {
  current = { ...DEFAULT_PREFERENCES, ...(prefs ?? {}) };
  const root = document.documentElement;
  const theme = resolvedTheme(current.theme);
  root.dataset.theme = theme;
  root.classList.toggle("dark", theme === "dark");
  root.classList.toggle("light", theme === "light");
  const skin = skinOf(current.theme);
  setAttr("skin", skin ? current.theme : null);
  setAttr("contrast", current.high_contrast ? "high" : null);
  setAttr("density", current.density === "compact" ? "compact" : null);
  setAttr("textScale", current.text_scale ? String(current.text_scale) : null);
  setAttr("motion", current.reduce_motion ? "reduce" : null);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", skin?.themeColor ?? (theme === "light" ? "#e9edf0" : "#05080c"));
  try {
    localStorage.setItem(THEME_KEY, current.theme);
  } catch {
    // storage unavailable; the theme still applies for this page load
  }
}

function setAttr(name: string, value: string | null) {
  const root = document.documentElement;
  if (value === null) delete root.dataset[name];
  else root.dataset[name] = value;
}

/** Before sign-in (login page) use the theme the browser last saw. */
export function applyStoredTheme() {
  let theme: Preferences["theme"] = "dark";
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "light" || stored === "dark" || stored === "system" || (stored && stored in SKINS)) theme = stored as Preferences["theme"];
  } catch {
    // ignore
  }
  applyPreferences({ ...current, theme });
}

media?.addEventListener("change", () => {
  if (current.theme === "system") applyPreferences(current);
});

export function currentPreferences() {
  return current;
}

/**
 * Save preferences (the whole object). Applies optimistically, rolls back on error, and keeps the
 * bootstrap copy in sync so every component sees the new values.
 */
export function useSavePreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (prefs: Preferences) => api.put<Preferences>("/api/me/preferences", prefs),
    onMutate: (prefs) => {
      const previous = qc.getQueryData<Bootstrap>(BOOTSTRAP_KEY);
      applyPreferences(prefs);
      if (previous?.user) qc.setQueryData<Bootstrap>(BOOTSTRAP_KEY, { ...previous, user: { ...previous.user, preferences: prefs } });
      return { previous };
    },
    onError: (_err, _prefs, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(BOOTSTRAP_KEY, ctx.previous);
        applyPreferences(ctx.previous.user?.preferences);
      }
    },
  });
}
