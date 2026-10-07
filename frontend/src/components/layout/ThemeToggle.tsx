import { Moon, Sun } from "lucide-react";

import { Tooltip } from "@/components/ui/tooltip";
import { useCurrentUser } from "@/lib/bootstrap";
import { DEFAULT_PREFERENCES, resolvedTheme, useSavePreferences } from "@/lib/preferences";

/** Flip between dark and light (the "system" option lives in Settings). */
export function useToggleTheme() {
  const user = useCurrentUser();
  const save = useSavePreferences();
  const prefs = user?.preferences ?? DEFAULT_PREFERENCES;
  const isDark = resolvedTheme(prefs.theme) === "dark";
  return { isDark, toggle: () => save.mutate({ ...prefs, theme: isDark ? "light" : "dark" }) };
}

export function ThemeToggle() {
  const { isDark, toggle } = useToggleTheme();
  return (
    <Tooltip content={isDark ? "Light theme" : "Dark theme"}>
      <button
        onClick={toggle}
        className="grid size-9 place-items-center rounded-lg text-muted transition-colors hover:bg-hover-strong hover:text-text"
        aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      >
        {isDark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
      </button>
    </Tooltip>
  );
}
