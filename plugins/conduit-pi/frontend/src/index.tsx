import { api, Badge, definePlugin, Skeleton } from "@conduit/sdk";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";

import { CorpPage } from "./corp";
import { MyPage } from "./mine";
import { Countdown, TypeName, useNow } from "./shared";
import { BASE, type Upcoming } from "./types";

function ExpiringWidget() {
  const now = useNow();
  const { data, isLoading } = useQuery({
    queryKey: ["pi", "upcoming"],
    queryFn: () => api.get<Upcoming>(`${BASE}/upcoming?limit=4`),
    refetchInterval: 600_000,
  });
  if (isLoading || !data) return <Skeleton className="h-24" />;
  if (data.colonies === 0) return <p className="text-sm text-muted">No colonies yet. They show up after your characters' next sync.</p>;
  return (
    <Link to="/p/pi" className="block space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted">{data.running} extractor{data.running !== 1 ? "s" : ""} running on {data.colonies} colonies</span>
        {data.expired > 0 ? <Badge tone="danger">{data.expired} not running</Badge> : <Badge tone="success">All running</Badge>}
      </div>
      {data.next.length > 0 && (
        <ul className="space-y-1.5">
          {data.next.map((n, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              <img src={n.image} alt="" className="size-6 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="truncate">{n.planet}</div>
                <div className="truncate text-xs text-muted">{n.character} · <TypeName type={n.product} size="size-3.5" /></div>
              </div>
              <Countdown expiry={n.expiry} status={n.status} now={now} />
            </li>
          ))}
        </ul>
      )}
    </Link>
  );
}

export default definePlugin({
  routes: [
    { path: "", Component: MyPage },
    { path: "corp", Component: CorpPage },
  ],
  widgets: [{ id: "expiring", title: "Extractors expiring next", Component: ExpiringWidget, size: "sm", order: 42 }],
});
