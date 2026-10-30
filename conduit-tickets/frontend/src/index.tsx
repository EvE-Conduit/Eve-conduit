import { definePlugin } from "@conduit/sdk";

import { SettingsPage } from "./settings";
import { TicketsPage } from "./tickets";

export default definePlugin({
  routes: [
    { path: "", Component: TicketsPage },
    { path: "settings", Component: SettingsPage },
  ],
});
