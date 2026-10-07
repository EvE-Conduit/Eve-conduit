import { createContext, useContext, type ReactNode } from "react";

import type { LoadedModule } from "./modules";

const ModulesContext = createContext<LoadedModule[]>([]);

export function ModulesProvider({ modules, children }: { modules: LoadedModule[]; children: ReactNode }) {
  return <ModulesContext.Provider value={modules}>{children}</ModulesContext.Provider>;
}

export function useLoadedModules() {
  return useContext(ModulesContext);
}
