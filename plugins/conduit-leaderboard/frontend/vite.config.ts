import { definePluginConfig } from "../../../frontend/vite-conduit-plugin.ts";

export default definePluginConfig({
  entry: "src/index.tsx",
  // Collected by Django's collectstatic and served at /static/conduit_leaderboard/plugin.js
  outDir: "../conduit_leaderboard/static/conduit_leaderboard",
});
