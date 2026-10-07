import { defineModuleConfig } from "../../../frontend/vite-module.ts";

export default defineModuleConfig({
  entry: "src/index.tsx",
  // Collected by Django's collectstatic and served at /static/evecsm_example/module.js
  outDir: "../evecsm_example/static/evecsm_example",
});
