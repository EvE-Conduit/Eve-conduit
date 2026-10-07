import { definePluginConfig } from "../../../frontend/vite-conduit-plugin.ts";

export default definePluginConfig({
  entry: "src/index.tsx",
  // Collected by Django's collectstatic and served at /static/conduit_example/plugin.js
  outDir: "../conduit_example/static/conduit_example",
});
