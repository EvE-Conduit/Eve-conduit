import { definePlugin } from "@conduit/sdk";

import { MyTicketsPage } from "./mine";
import { PanelsPage } from "./panels";
import { SettingsPage } from "./settings";
import { TicketsPage } from "./tickets";
import { TranscriptPage } from "./transcript";

export default definePlugin({
  routes: [
    { path: "", Component: TicketsPage },
    { path: "mine", Component: MyTicketsPage },
    { path: "panels", Component: PanelsPage },
    { path: "settings", Component: SettingsPage },
    { path: ":id", Component: TranscriptPage },
  ],
});
