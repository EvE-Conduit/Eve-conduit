import { Badge, Button, definePlugin, Skeleton } from "@conduit/sdk";
import { Link } from "react-router";

import { AdminPage } from "./admin";
import { Mic } from "./icons";
import { MemberPage, useMe } from "./member";
import { PublicTempPage } from "./public";
import { TempPage } from "./temp";

/** On the dashboard: a nudge to make the account, or where they stand once they have one. */
function MumbleWidget() {
  const { data, isLoading } = useMe();
  if (isLoading) return <Skeleton className="h-16" />;
  if (!data?.configured || (!data.account && !data.can_link)) return null;
  if (!data.account) {
    return (
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Mic className="size-7 text-accent-ink" />
          <div>
            <div className="font-medium">Get on {data.server.name}</div>
            <div className="text-xs text-muted">Make your Mumble account to join voice comms.</div>
          </div>
        </div>
        <Link to="/p/mumble"><Button variant="primary" size="sm">Set up</Button></Link>
      </div>
    );
  }
  return (
    <Link to="/p/mumble" className="flex items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <Mic className="size-7 shrink-0 text-accent-ink" />
        <div className="min-w-0">
          <div className="truncate font-medium">{data.account.display_name}</div>
          <div className="truncate text-xs text-muted">{data.groups_due.length ? data.groups_due.join(" · ") : "no groups"}</div>
        </div>
      </div>
      <Badge tone="success">Ready</Badge>
    </Link>
  );
}

export default definePlugin({
  routes: [
    { path: "", Component: MemberPage },
    { path: "temp", Component: TempPage },
    { path: "admin", Component: AdminPage },
  ],
  publicRoutes: [{ path: "temp/:token", Component: PublicTempPage }],
  widgets: [{ id: "account", title: "Mumble", Component: MumbleWidget, size: "sm", order: 21 }],
});
