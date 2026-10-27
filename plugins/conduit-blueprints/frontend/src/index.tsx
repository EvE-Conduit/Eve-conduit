import { definePlugin } from "@conduit/sdk";

import { LibraryPage } from "./library";
import { QueuePage } from "./queue";
import { MyRequestsPage } from "./requests";
import { ResearchPage } from "./research";
import { SharingPage } from "./sharing";

export default definePlugin({
  routes: [
    { path: "", Component: LibraryPage },
    { path: "requests", Component: MyRequestsPage },
    { path: "sharing", Component: SharingPage },
    { path: "research", Component: ResearchPage },
    { path: "queue", Component: QueuePage },
  ],
});
