import { api, Badge, definePlugin, Skeleton, timeAgo } from "@conduit/sdk";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";

import { BulletinSection } from "./bulletin";
import { FeedPage, TONE } from "./feed";
import { BASE, type Feed } from "./types";

/** The latest few announcements on the dashboard. */
function LatestWidget() {
  const { data, isLoading } = useQuery({ queryKey: ["announcements", "widget"], queryFn: () => api.get<Feed>(BASE), refetchInterval: 300_000 });
  if (isLoading) return <Skeleton className="h-24" />;
  if (!data) return null;
  const latest = data.announcements.slice(0, 3);
  if (latest.length === 0) return <p className="text-sm text-subtle">No announcements yet.</p>;
  return (
    <div className="space-y-1">
      {data.unread > 0 && (
        <div className="mb-2">
          <Badge tone="success">{data.unread} new</Badge>
        </div>
      )}
      <ul className="divide-y divide-border">
        {latest.map((a) => (
          <li key={a.id}>
            <Link to={`/p/announcements#a${a.id}`} className="flex items-center gap-3 py-2 hover:text-text">
              <span className={`h-8 w-0.5 shrink-0 ${TONE[a.tone].stripe}`} aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{a.title}</span>
                <span className="block truncate text-xs text-subtle">{a.author?.name ?? "Leadership"} · {timeAgo(a.publish_at)}</span>
              </span>
              {a.unread && <span className="size-1.5 shrink-0 rotate-45 bg-success" aria-label="New" />}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default definePlugin({
  routes: [{ path: "", Component: FeedPage }],
  widgets: [{ id: "latest", title: "Announcements", Component: LatestWidget, size: "md", order: 5 }],
  // Needs EvE Conduit 0.5.18; older versions ignore it.
  landingSections: [{ id: "bulletin", title: "Bulletin (latest announcements)", Component: BulletinSection, placement: "top", order: 10 }],
});
