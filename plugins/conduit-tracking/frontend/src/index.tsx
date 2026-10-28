import { definePlugin } from "@conduit/sdk";

import { ReportPage } from "./report";
import { SessionsPage } from "./sessions";

export default definePlugin({
  routes: [
    { path: "", Component: SessionsPage },
    { path: ":id", Component: ReportPage },
  ],
});
