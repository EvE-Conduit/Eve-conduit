import { api, Badge, definePlugin, Skeleton, useHasPerm } from "@conduit/sdk";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";

import { ApplyPage } from "./apply";
import { FormsPage } from "./forms";
import { ApplicationPage, QueuePage } from "./review";
import { SettingsPage } from "./settings";
import { BASE } from "./types";

/** Recruiters land on the queue, everyone else on the application form. */
function HomePage() {
  return useHasPerm("recruit.review_applications") ? <QueuePage /> : <ApplyPage />;
}

function RecruiterWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ["recruit", "queue", "open", ""],
    queryFn: () => api.get<{ counts: { open: number; new: number; mine: number } }>(`${BASE}/applications?status=open`),
    refetchInterval: 120_000,
  });
  if (isLoading || !data) return <Skeleton className="h-16" />;
  const { open, new: fresh, mine } = data.counts;
  return (
    <Link to="/p/recruit" className="block">
      <div className="flex items-end justify-between gap-6">
        <div>
          <div className="text-xs text-muted">Open applications</div>
          <div className="mt-1 font-mono text-3xl font-semibold tabular-nums">{open}</div>
          <div className="text-xs text-subtle">{mine} with you</div>
        </div>
        {fresh > 0 ? <Badge tone="info">{fresh} new</Badge> : <Badge tone="success">All picked up</Badge>}
      </div>
    </Link>
  );
}

export default definePlugin({
  routes: [
    { path: "", Component: HomePage },
    { path: "apply", Component: ApplyPage },
    { path: "applications/:id", Component: ApplicationPage },
    { path: "forms", Component: FormsPage },
    { path: "settings", Component: SettingsPage },
  ],
  widgets: [{ id: "queue", title: "Recruitment", Component: RecruiterWidget, size: "sm", order: 30, permission: "recruit.review_applications" }],
});
