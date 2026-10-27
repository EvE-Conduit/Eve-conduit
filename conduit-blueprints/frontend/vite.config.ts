import { definePluginConfig } from "../../../frontend/vite-conduit-plugin.ts";

export default definePluginConfig({
  entry: "src/index.tsx",
  // Collected by Django's collectstatic and served at /static/conduit_blueprints/plugin.js
  outDir: "../conduit_blueprints/static/conduit_blueprints",
});
