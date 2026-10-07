/**
 * Front-end side of the plugin system.
 *
 * Each enabled plugin with a front end ships an ES module bundle. Its default
 * export is the result of `definePlugin(...)`, describing the pages, dashboard
 * widgets and character-sheet tabs it adds. The host imports every bundle at
 * start-up and mounts what it finds.
 */
import type { ComponentType } from "react";

import type { PluginEntry } from "./types";

export interface ModuleRoute {
  /** Relative to the plugin's mount point, /p/<id>/. Use "" for its home page. */
  path: string;
  Component: ComponentType;
}

export interface DashboardWidget {
  id: string;
  title: string;
  Component: ComponentType;
  /** Grid width on large screens. */
  size?: "sm" | "md" | "lg";
  order?: number;
  permission?: string;
}

export interface CharacterTab {
  id: string;
  label: string;
  Component: ComponentType<{ characterId: number }>;
  order?: number;
}

export interface PluginFrontend {
  routes?: ModuleRoute[];
  widgets?: DashboardWidget[];
  characterTabs?: CharacterTab[];
}

export function definePlugin(frontend: PluginFrontend): PluginFrontend {
  return frontend;
}

export interface LoadedPlugin {
  info: PluginEntry;
  frontend: PluginFrontend;
  /** Tailwind classes the bundle uses (exported by the plugin build preset). */
  classes?: string[];
  error?: string;
}

export async function loadPlugins(entries: PluginEntry[]): Promise<LoadedPlugin[]> {
  return Promise.all(
    entries.map(async (info) => {
      if (!info.entry) return { info, frontend: {} };
      try {
        const mod = await import(/* @vite-ignore */ info.entry);
        return { info, frontend: (mod.default ?? {}) as PluginFrontend, classes: Array.isArray(mod.classes) ? mod.classes : [] };
      } catch (err) {
        console.error(`Plugin ${info.id} failed to load`, err);
        return { info, frontend: {}, error: err instanceof Error ? err.message : String(err) };
      }
    }),
  );
}
