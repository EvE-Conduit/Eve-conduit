import { api, Badge, definePlugin, Skeleton, timeAgo } from "@conduit/sdk";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";

import { AttendancePage } from "./attendance";
import { FatPage } from "./fat";
import { FleetPage } from "./fleet";
import { HomePage } from "./home";
import { type Attendance, BASE } from "./types";

/** My fleet attendance on the dashboard. */
function MyFatsWidget() {
  const { data, isLoading } = useQuery({ queryKey: ["fleets", "me"], queryFn: () => api.get<Attendance>(`${BASE}/me`) });
  if (isLoading) return <Skeleton className="h-16" />;
  if (!data) return null;
  const last = data.fleets[0];
  return (
    <Link to="/p/fleets" className="block">
      <div className="flex items-end justify-between gap-6">
        <div>
          <div className="text-xs text-muted">Fleets in the last 30 days</div>
          <div className="mt-1 font-mono text-3xl font-semibold tabular-nums">{data.counts.days_30}</div>
          <div className="truncate text-xs text-subtle">{last ? `Last: ${last.name}, ${timeAgo(last.started_at)}` : "No FATs yet"}</div>
        </div>
        <Badge tone="accent">{data.counts.all} all time</Badge>
      </div>
    </Link>
  );
}

export default definePlugin({
  routes: [
    { path: "", Component: HomePage },
    { path: "attendance", Component: AttendancePage },
    { path: "fat/:code", Component: FatPage },
    { path: ":id", Component: FleetPage },
  ],
  widgets: [{ id: "my-fats", title: "Fleets", Component: MyFatsWidget, size: "sm", order: 35 }],
});
