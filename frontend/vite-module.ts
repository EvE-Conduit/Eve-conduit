/**
 * Build preset for module front ends.
 *
 * Produces one self-contained ES module (module.js) that imports React, the
 * router, React Query and @conduit/sdk from the host at runtime.
 *
 * Styling: modules use the same Tailwind classes as the site. Instead of
 * shipping CSS (which would fight the site's stylesheet over rule order), the
 * bundle exports the list of classes it uses, and the site compiles one
 * correctly ordered stylesheet for itself plus all modules at runtime.
 */
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { defineConfig, type Plugin, type UserConfig } from "vite";

import { scanCandidates } from "./tailwind-candidates.ts";
import { SHARED } from "./vite-shared-modules.ts";

function exportClasses(srcDir: string): Plugin {
  return {
    name: "conduit-module-classes",
    apply: "build",
    generateBundle(_, bundle) {
      const classes = scanCandidates(srcDir);
      for (const chunk of Object.values(bundle)) {
        if (chunk.type === "chunk" && chunk.isEntry) {
          chunk.code += `\nexport const classes = ${JSON.stringify(classes)};\n`;
        }
      }
    },
  };
}

export function defineModuleConfig({ entry, outDir }: { entry: string; outDir: string }): UserConfig {
  const srcDir = resolve(process.cwd(), "src");
  return defineConfig({
    plugins: [react(), exportClasses(srcDir)],
    build: {
      outDir,
      emptyOutDir: true,
      target: "es2022",
      lib: { entry, formats: ["es"], fileName: () => "module.js" },
      rollupOptions: { external: Object.keys(SHARED) },
    },
  });
}
