import { definePlugin } from "@conduit/sdk";

import { SettingsPage } from "./settings";
import { TicketsPage } from "./tickets";
import { TranscriptPage } from "./transcript";

export default definePlugin({
  routes: [
    { path: "", Component: TicketsPage },
    { path: "settings", Component: SettingsPage },
    { path: ":id", Component: TranscriptPage },
  ],
});
