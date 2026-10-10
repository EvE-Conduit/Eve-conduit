import { Badge, Button, definePlugin, Skeleton } from "@conduit/sdk";
import { Link } from "react-router";

import { AdminPage } from "./admin";
import { Headphones } from "./icons";
import { MemberPage, useMe } from "./member";

/** On the dashboard: a nudge to link, or where they stand once they have. */
function TeamSpeakWidget() {
  const { data, isLoading } = useMe();
  if (isLoading) return <Skeleton className="h-16" />;
  if (!data?.configured || (!data.account && !data.can_link)) return null;
  if (!data.account || data.account.status === "pending") {
    return (
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Headphones className="size-7 text-accent-ink" />
          <div>
            <div className="font-medium">Get on {data.server.name}</div>
            <div className="text-xs text-muted">{data.account ? "Finish linking your TeamSpeak identity." : "Link your TeamSpeak identity to join voice comms."}</div>
          </div>
        </div>
        <Link to="/p/teamspeak"><Button variant="primary" size="sm">{data.account ? "Finish" : "Link"}</Button></Link>
      </div>
    );
  }
  const groups = [...(data.registered_group ? [data.registered_group] : []), ...data.groups_due];
  return (
    <Link to="/p/teamspeak" className="flex items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <Headphones className="size-7 shrink-0 text-accent-ink" />
        <div className="min-w-0">
          <div className="truncate font-medium">{data.account.nickname || data.nickname}</div>
          <div className="truncate text-xs text-muted">{groups.length ? groups.join(" · ") : "no groups"}</div>
        </div>
      </div>
      <Badge tone={data.account.error ? "danger" : "success"}>{data.account.error ? "Problem" : "Linked"}</Badge>
    </Link>
  );
}

export default definePlugin({
  routes: [
    { path: "", Component: MemberPage },
    { path: "admin", Component: AdminPage },
  ],
  widgets: [{ id: "account", title: "TeamSpeak", Component: TeamSpeakWidget, size: "sm", order: 22 }],
});
