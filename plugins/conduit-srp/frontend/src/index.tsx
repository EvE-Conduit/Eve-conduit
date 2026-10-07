import { api, Badge, definePlugin, isk, Skeleton } from "@conduit/sdk";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";

import { MySrpPage, useCanReview, useMe } from "./my";
import { QueuePage } from "./queue";
import { RequestPage } from "./request";
import { BASE, type Queue } from "./types";

/** Reviewers and payers land on the queue, everyone else on their own losses. */
function HomePage() {
  return useCanReview() ? <QueuePage /> : <MySrpPage />;
}

function MyWidget() {
  const { data, isLoading } = useMe();
  if (isLoading) return <Skeleton className="h-16" />;
  if (!data) return null;
  return (
    <Link to="/p/srp/me" className="block">
      <div className="flex items-end justify-between gap-6">
        <div>
          <div className="text-xs text-muted">Losses you can claim</div>
          <div className="mt-1 font-mono text-3xl font-semibold tabular-nums">{data.losses.length}</div>
          <div className="text-xs text-subtle">{data.totals.pending} waiting for review</div>
        </div>
        {data.totals.approved > 0 ? <Badge tone="accent">{isk(data.totals.approved)} coming</Badge> : <Badge tone="success">All settled</Badge>}
      </div>
    </Link>
  );
}

function ReviewWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ["srp", "queue", "pending", ""],
    queryFn: () => api.get<Queue>(`${BASE}/queue?status=pending`),
    refetchInterval: 120_000,
  });
  if (isLoading || !data) return <Skeleton className="h-16" />;
  return (
    <Link to="/p/srp" className="block">
      <div className="flex items-end justify-between gap-6">
        <div>
          <div className="text-xs text-muted">SRP waiting for review</div>
          <div className="mt-1 font-mono text-3xl font-semibold tabular-nums">{data.counts.pending}</div>
          <div className="text-xs text-subtle">{isk(data.totals.pending)} suggested</div>
        </div>
        {data.counts.approved > 0 ? <Badge tone="accent">{isk(data.totals.approved)} to pay</Badge> : <Badge tone="success">Nothing to pay</Badge>}
      </div>
    </Link>
  );
}

export default definePlugin({
  routes: [
    { path: "", Component: HomePage },
    { path: "me", Component: MySrpPage },
    { path: "requests/:id", Component: RequestPage },
  ],
  widgets: [
    { id: "mine", title: "Ship replacement", Component: MyWidget, size: "sm", order: 45 },
    { id: "review", title: "SRP queue", Component: ReviewWidget, size: "sm", order: 46, permission: "srp.review_requests" },
  ],
});
