import { api, Avatar, Badge, dateTime, definePlugin, Skeleton } from "@conduit/sdk";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";

import { EventPage } from "./event";
import { EventsPage } from "./events";
import { BASE, PHASE, type Widget } from "./types";

/** Your current Secret Santa and who you give to, or one you can still join. */
function SantaWidget() {
  const { data, isLoading } = useQuery({ queryKey: ["secretsanta", "widget"], queryFn: () => api.get<Widget>(`${BASE}/widget`), refetchInterval: 300_000 });
  if (isLoading) return <Skeleton className="h-16" />;
  if (!data?.event) return <p className="text-sm text-subtle">No Secret Santa right now.</p>;
  const e = data.event;
  const g = data.giving_to;
  return (
    <Link to={`/p/secretsanta/${e.id}`} className="block space-y-2 hover:text-text">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-medium">{e.name}</span>
        <Badge tone={PHASE[e.phase].tone}>{PHASE[e.phase].label}</Badge>
      </div>
      {g ? (
        <div className="flex items-center gap-3">
          <Avatar src={g.character?.portrait ?? null} name={g.character?.name ?? g.name} size="md" />
          <div className="min-w-0">
            <div className="text-xs text-muted">You're giving to</div>
            <div className="truncate font-medium">{g.character?.name ?? g.name}</div>
            <div className="text-xs text-subtle">{g.sent_at ? "Sent" : `Send by ${dateTime(e.gift_deadline)}`}</div>
          </div>
        </div>
      ) : e.joined ? (
        <p className="text-xs text-muted">You're in. You'll find out who you give to after the draw.</p>
      ) : (
        <p className="text-xs text-muted">Sign up by {dateTime(e.signup_closes_at)}.</p>
      )}
    </Link>
  );
}

export default definePlugin({
  routes: [
    { path: "", Component: EventsPage },
    { path: ":id", Component: EventPage },
  ],
  widgets: [{ id: "current", title: "Secret Santa", Component: SantaWidget, size: "sm", order: 30 }],
});
