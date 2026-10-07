/**
 * Front-end side of the module system.
 *
 * Each enabled module with a front end ships an ES module bundle. Its default
 * export is the result of `defineModule(...)`, describing the pages, dashboard
 * widgets and character-sheet tabs it adds. The host imports every bundle at
 * start-up and mounts what it finds.
 */
import type { ComponentType } from "react";

import type { ModuleEntry } from "./types";

export interface ModuleRoute {
  /** Relative to the module's mount point, /m/<id>/. Use "" for its home page. */
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

export interface ModuleFrontend {
  routes?: ModuleRoute[];
  widgets?: DashboardWidget[];
  characterTabs?: CharacterTab[];
}

export function defineModule(frontend: ModuleFrontend): ModuleFrontend {
  return frontend;
}

export interface LoadedModule {
  info: ModuleEntry;
  frontend: ModuleFrontend;
  /** Tailwind classes the bundle uses (exported by the module build preset). */
  classes?: string[];
  error?: string;
}

export async function loadModules(entries: ModuleEntry[]): Promise<LoadedModule[]> {
  return Promise.all(
    entries.map(async (info) => {
      if (!info.entry) return { info, frontend: {} };
      try {
        const mod = await import(/* @vite-ignore */ info.entry);
        return { info, frontend: (mod.default ?? {}) as ModuleFrontend, classes: Array.isArray(mod.classes) ? mod.classes : [] };
      } catch (err) {
        console.error(`Module ${info.id} failed to load`, err);
        return { info, frontend: {}, error: err instanceof Error ? err.message : String(err) };
      }
    }),
  );
}
