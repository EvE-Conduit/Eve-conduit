import { createContext, useContext, type ReactNode } from "react";

import type { LoadedPlugin } from "./plugins";

const ModulesContext = createContext<LoadedPlugin[]>([]);

export function PluginsProvider({ plugins, children }: { plugins: LoadedPlugin[]; children: ReactNode }) {
  return <ModulesContext.Provider value={plugins}>{children}</ModulesContext.Provider>;
}

export function useLoadedPlugins() {
  return useContext(ModulesContext);
}
