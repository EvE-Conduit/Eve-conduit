import { definePlugin, Skeleton } from "@conduit/sdk";
import { Link } from "react-router";

import { EditorPage } from "./editor";
import { HistoryPage } from "./history";
import { HomePage, PageView, RecentList } from "./pages";
import { PublicList, PublicPage } from "./public";
import { useOverview } from "./shell";
import { HOME } from "./types";

/** Recently updated pages on the dashboard. */
function RecentWidget() {
  const { data, isLoading } = useOverview();
  if (isLoading) return <Skeleton className="h-24" />;
  if (!data) return null;
  return (
    <div>
      <RecentList pages={data.recent.slice(0, 5)} />
      <Link to={HOME} className="mt-2 inline-block text-xs text-muted hover:text-text">Open the wiki →</Link>
    </div>
  );
}

export default definePlugin({
  routes: [
    { path: "", Component: HomePage },
    { path: "new", Component: EditorPage },
    { path: ":slug", Component: PageView },
    { path: ":slug/edit", Component: EditorPage },
    { path: ":slug/history", Component: HistoryPage },
  ],
  publicRoutes: [
    { path: "", Component: PublicList },
    { path: ":slug", Component: PublicPage },
  ],
  widgets: [{ id: "recent", title: "Wiki", Component: RecentWidget, size: "sm", order: 40 }],
});
