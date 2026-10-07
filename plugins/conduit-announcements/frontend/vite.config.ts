import { definePluginConfig } from "../../../frontend/vite-conduit-plugin.ts";

export default definePluginConfig({
  entry: "src/index.tsx",
  // Collected by Django's collectstatic and served at /static/conduit_announcements/plugin.js
  outDir: "../conduit_announcements/static/conduit_announcements",
});
