import { definePlugin } from "@conduit/sdk";

import { BoardPage, StructuresWidget } from "./board";
import { PlanPage } from "./plan";
import { SettingsPage } from "./settings";

export default definePlugin({
  routes: [
    { path: "", Component: BoardPage },
    { path: "plan", Component: PlanPage },
    { path: "settings", Component: SettingsPage },
  ],
  widgets: [{ id: "low", title: "Structures running low", Component: StructuresWidget, size: "sm", order: 45 }],
});
