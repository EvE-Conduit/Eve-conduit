import { api, Badge, definePlugin, Skeleton } from "@conduit/sdk";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";

import { SpyCheckPage } from "./findings";
import { MemberPage } from "./member";
import { BASE, type Summary } from "./types";

function SpyCheckWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ["spycheck", "summary"],
    queryFn: () => api.get<Summary>(`${BASE}/summary`),
    refetchInterval: 600_000,
  });
  if (isLoading || !data) return <Skeleton className="h-16" />;
  return (
    <Link to="/p/spycheck" className="block">
      <div className="flex items-end justify-between gap-6">
        <div>
          <div className="text-xs text-muted">New Spy Check findings</div>
          <div className="mt-1 font-mono text-3xl font-semibold tabular-nums">{data.new}</div>
          <div className="text-xs text-subtle">{data.members} member{data.members === 1 ? "" : "s"} · {data.watched} watched</div>
        </div>
        {data.new > 0 ? <Badge tone="warning">To review</Badge> : <Badge tone="success">All reviewed</Badge>}
      </div>
    </Link>
  );
}

export default definePlugin({
  routes: [
    { path: "", Component: SpyCheckPage },
    { path: "members/:id", Component: MemberPage },
  ],
  widgets: [{ id: "summary", title: "Spy Check", Component: SpyCheckWidget, size: "sm", order: 45, permission: "spycheck.view_findings" }],
});
