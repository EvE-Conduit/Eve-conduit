/**
 * Lets separately built module bundles share the host's copy of React, the
 * router, React Query and the EvE Conduit SDK.
 *
 * Each shared package is exposed as a stable ES module at /sdk/<name>.js and
 * an import map pointing the bare specifiers at those files is put in
 * index.html. A module bundle marks the same specifiers as external, so its
 * `import { useState } from "react"` resolves to the host's React at runtime.
 */
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

import type { Plugin } from "vite";

import { scanCandidates } from "./tailwind-candidates.ts";

const require = createRequire(import.meta.url);
const PREFIX = "\0conduit-shared:";
const HOST_CLASSES = "virtual:conduit-host-classes";

/** specifier -> published file name under /sdk/ */
export const SHARED: Record<string, string> = {
  react: "react",
  "react/jsx-runtime": "react-jsx-runtime",
  "react-dom": "react-dom",
  "react-router": "react-router",
  "@tanstack/react-query": "react-query",
  "@conduit/sdk": "conduit-sdk",
};

// Packages shipped as CommonJS need their export names spelled out so both the
// dev server's interop and the production bundler re-export them.
const CJS = new Set(["react", "react/jsx-runtime", "react-dom"]);

function shimCode(spec: string): string {
  if (spec === "@conduit/sdk") return `export * from "/src/sdk/index.ts";`;
  if (!CJS.has(spec)) return `export * from ${JSON.stringify(spec)};`;
  const names = Object.keys(require(spec)).filter((n) => n !== "default" && n !== "__esModule" && /^[A-Za-z_$][\w$]*$/.test(n));
  return [
    `import * as M from ${JSON.stringify(spec)};`,
    `export { ${names.join(", ")} } from ${JSON.stringify(spec)};`,
    `export default (M.default ?? M);`,
  ].join("\n");
}

export function sharedModules(): Plugin {
  let isBuild = false;
  return {
    name: "conduit-shared-modules",
    configResolved(config) {
      isBuild = config.command === "build";
    },
    resolveId(id) {
      if (id === HOST_CLASSES) return "\0" + HOST_CLASSES;
      if (id.startsWith(PREFIX)) return id;
      if (id.startsWith("virtual:conduit-shared/")) return PREFIX + id.slice("virtual:conduit-shared/".length);
      return null;
    },
    load(id) {
      if (id === "\0" + HOST_CLASSES) {
        // The classes the site's own stylesheet was built from; see lib/moduleStyles.ts.
        const src = fileURLToPath(new URL("./src", import.meta.url));
        return `export default ${JSON.stringify(scanCandidates(src))};`;
      }
      if (id.startsWith(PREFIX)) return shimCode(id.slice(PREFIX.length));
      return null;
    },
    buildStart() {
      if (!isBuild) return;
      for (const [spec, file] of Object.entries(SHARED)) {
        this.emitFile({
          type: "chunk",
          id: `virtual:conduit-shared/${spec}`,
          fileName: `sdk/${file}.js`,
          preserveSignature: "strict",
        });
      }
    },
    transformIndexHtml() {
      const imports = Object.fromEntries(
        Object.entries(SHARED).map(([spec, file]) => [
          spec,
          isBuild ? `/sdk/${file}.js` : `/@id/__x00__conduit-shared:${spec}`,
        ]),
      );
      return [
        { tag: "script", attrs: { type: "importmap" }, children: JSON.stringify({ imports }, null, 2), injectTo: "head-prepend" },
      ];
    },
  };
}
