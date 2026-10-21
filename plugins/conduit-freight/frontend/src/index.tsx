import { definePlugin } from "@conduit/sdk";

import { EditPage, ManagePage } from "./manage";
import { HomePage, MyPage, ServicePage } from "./member";
import { PublicList, PublicService } from "./public";
import { QueuePage } from "./queue";

export default definePlugin({
  routes: [
    { path: "", Component: HomePage },
    { path: "services/:id", Component: ServicePage },
    { path: "me", Component: MyPage },
    { path: "queue", Component: QueuePage },
    { path: "manage", Component: ManagePage },
    { path: "manage/new", Component: EditPage },
    { path: "manage/:id", Component: EditPage },
  ],
  publicRoutes: [
    { path: "", Component: PublicList },
    { path: ":id", Component: PublicService },
  ],
});
