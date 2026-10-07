/**
 * Build preset for plugin front ends.
 *
 * Produces one self-contained ES module (plugin.js) that imports React, the
 * router, React Query and @conduit/sdk from the host at runtime.
 *
 * Styling: plugins use the same Tailwind classes as the site. Instead of
 * shipping CSS (which would fight the site's stylesheet over rule order), the
 * bundle exports the list of classes it uses, and the site compiles one
 * correctly ordered stylesheet for itself plus all plugins at runtime.
 */
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { defineConfig, type Plugin, type UserConfig } from "vite";

import { scanCandidates } from "./tailwind-candidates.ts";
import { SHARED } from "./vite-shared-modules.ts";

function exportClasses(srcDir: string): Plugin {
  return {
    name: "conduit-plugin-classes",
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

export function definePluginConfig({ entry, outDir }: { entry: string; outDir: string }): UserConfig {
  const srcDir = resolve(process.cwd(), "src");
  return defineConfig({
    plugins: [react(), exportClasses(srcDir)],
    build: {
      outDir,
      emptyOutDir: true,
      target: "es2022",
      lib: { entry, formats: ["es"], fileName: () => "plugin.js" },
      rollupOptions: { external: Object.keys(SHARED) },
    },
  });
}
