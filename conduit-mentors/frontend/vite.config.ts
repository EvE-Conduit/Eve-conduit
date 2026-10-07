import { definePluginConfig } from "../../../frontend/vite-conduit-plugin.ts";

export default definePluginConfig({
  entry: "src/index.tsx",
  // Collected by Django's collectstatic and served at /static/conduit_mentors/plugin.js
  outDir: "../conduit_mentors/static/conduit_mentors",
});
