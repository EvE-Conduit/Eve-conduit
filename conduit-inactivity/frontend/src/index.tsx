import { api, Badge, definePlugin, Skeleton } from "@conduit/sdk";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";

import { LeavePage } from "./leave";
import { MembersPage } from "./members";
import { BASE, type Summary } from "./types";

function InactivityWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ["inactivity", "summary"],
    queryFn: () => api.get<Summary>(`${BASE}/summary`),
    refetchInterval: 600_000,
  });
  if (isLoading || !data) return <Skeleton className="h-16" />;
  return (
    <Link to="/p/inactivity/members" className="block">
      <div className="flex items-end justify-between gap-6">
        <div>
          <div className="text-xs text-muted">Inactive members</div>
          <div className="mt-1 font-mono text-3xl font-semibold tabular-nums">{data.inactive}</div>
          <div className="text-xs text-subtle">{data.on_leave} on leave · no activity for {data.days} days</div>
        </div>
        {data.pending > 0 ? <Badge tone="info">{data.pending} leave to approve</Badge> : <Badge tone="success">No leave waiting</Badge>}
      </div>
    </Link>
  );
}

export default definePlugin({
  routes: [
    { path: "", Component: LeavePage },
    { path: "members", Component: MembersPage },
  ],
  widgets: [{ id: "summary", title: "Inactivity", Component: InactivityWidget, size: "sm", order: 40, permission: "inactivity.view_inactivity" }],
});
