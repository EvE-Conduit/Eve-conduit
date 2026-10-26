import { definePlugin } from "@conduit/sdk";

import { ProjectsPage, ProjectsWidget } from "./list";
import { MyPage } from "./me";
import { ProjectPage } from "./project";
import { QueuePage } from "./queue";

export default definePlugin({
  routes: [
    { path: "", Component: ProjectsPage },
    { path: "me", Component: MyPage },
    { path: "queue", Component: QueuePage },
    { path: ":id", Component: ProjectPage },
  ],
  widgets: [{ id: "open", title: "Industry projects", Component: ProjectsWidget, size: "md", order: 40 }],
});
