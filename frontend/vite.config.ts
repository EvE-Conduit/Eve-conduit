import { fileURLToPath, URL } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

import { sharedModules } from "./vite-shared-modules.ts";

const backend = process.env.EVECSM_BACKEND ?? "http://127.0.0.1:8000";
const proxy = Object.fromEntries(["/api", "/sso", "/static", "/django-admin"].map((p) => [p, backend]));

export default defineConfig({
  plugins: [react(), tailwindcss(), sharedModules()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  server: { port: 5173, proxy },
  preview: { port: 4173, proxy },
  build: {
    target: "es2022",
    chunkSizeWarningLimit: 900,
  },
});
