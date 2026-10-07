import { Badge, Button, definePlugin, Skeleton } from "@conduit/sdk";
import { Link } from "react-router";

import { AdminPage } from "./admin";
import { DiscordLogo } from "./icons";
import { CallbackPage, MemberPage, useMe, useStartLink } from "./member";

/** On the dashboard: a nudge to link Discord, or where they stand once linked. */
function DiscordWidget() {
  const { data, isLoading } = useMe();
  const start = useStartLink();
  if (isLoading) return <Skeleton className="h-16" />;
  if (!data?.configured || (!data.account && !data.can_link)) return null;
  if (!data.account) {
    return (
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <DiscordLogo className="size-7 text-accent-ink" />
          <div>
            <div className="font-medium">Join {data.server || "our Discord"}</div>
            <div className="text-xs text-muted">Link your account to get on the server with your roles.</div>
          </div>
        </div>
        <Button variant="primary" size="sm" loading={start.isPending} onClick={() => start.mutate()}>Link</Button>
      </div>
    );
  }
  return (
    <Link to="/p/discord" className="flex items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <DiscordLogo className="size-7 shrink-0 text-accent-ink" />
        <div className="min-w-0">
          <div className="truncate font-medium">{data.account.username}</div>
          <div className="truncate text-xs text-muted">{data.roles.length ? data.roles.map((r) => `@${r}`).join(" ") : "no roles"}</div>
        </div>
      </div>
      {data.account.error ? <Badge tone="warning">Needs attention</Badge> : <Badge tone="success">Linked</Badge>}
    </Link>
  );
}

export default definePlugin({
  routes: [
    { path: "", Component: MemberPage },
    { path: "callback", Component: CallbackPage },
    { path: "admin", Component: AdminPage },
  ],
  widgets: [{ id: "link", title: "Discord", Component: DiscordWidget, size: "sm", order: 20 }],
});
