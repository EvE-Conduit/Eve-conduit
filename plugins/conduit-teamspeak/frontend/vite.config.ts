import { definePluginConfig } from "../../../frontend/vite-conduit-plugin.ts";

export default definePluginConfig({
  entry: "src/index.tsx",
  // Collected by Django's collectstatic and served at /static/conduit_teamspeak/plugin.js
  outDir: "../conduit_teamspeak/static/conduit_teamspeak",
});
