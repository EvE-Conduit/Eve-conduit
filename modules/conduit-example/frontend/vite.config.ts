import { defineModuleConfig } from "../../../frontend/vite-module.ts";

export default defineModuleConfig({
  entry: "src/index.tsx",
  // Collected by Django's collectstatic and served at /static/conduit_example/module.js
  outDir: "../conduit_example/static/conduit_example",
});
