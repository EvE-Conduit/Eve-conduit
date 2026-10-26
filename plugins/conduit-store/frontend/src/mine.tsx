// A member's own points: every entry, and their orders (cancel while waiting).
import {
  api, Badge, Button, Card, CardHeader, ConfirmDialog, date, EmptyState, PageHeader, Skeleton, Table, Td, Th, THead, timeAgo, toast, Tr,
} from "@conduit/sdk";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router";

import { Back, Package, Star } from "./icons";
import { ItemIcon, Points, StatusBadge } from "./shared";
import { BASE, type History, type Order, SOURCES } from "./types";

export function MyPointsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["store", "history"], queryFn: () => api.get<History>(`${BASE}/me/history`) });
  const [cancelling, setCancelling] = useState<Order | null>(null);

  return (
    <>
      <Link to="/p/store" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-text"><Back /> Store</Link>
      <PageHeader
        eyebrow="Corp Store"
        title="My points"
        icon={<Star />}
        description="What you earned, what you spent, and your orders."
        actions={data ? <span className="text-2xl font-semibold"><Points value={data.balance} /></span> : undefined}
      />
      {isLoading || !data ? (
        <Skeleton className="h-64" />
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader title="Orders" />
            {data.orders.length === 0 ? (
              <EmptyState icon={<Package />} title="No orders yet" description={<>Spend your points in the <Link to="/p/store" className="underline">store</Link>.</>} />
            ) : (
              <ul className="divide-y divide-border">
                {data.orders.map((o) => (
                  <li key={o.id} className="flex flex-wrap items-center gap-3 px-card py-3 text-sm">
                    <ItemIcon icon={o.item.icon} name={o.item.name} className="size-8" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">{o.quantity} × {o.item.name}</div>
                      <div className="text-xs text-muted">
                        Ordered {date(o.created_at)}
                        {o.handled_by && o.handled_at && ` · ${o.status === "fulfilled" ? "handed over" : "cancelled"} by ${o.handled_by} ${timeAgo(o.handled_at)}`}
                      </div>
                      {o.note && <p className="mt-1 whitespace-pre-line text-xs italic text-muted">“{o.note}”</p>}
                    </div>
                    <Points value={o.points} className="text-xs" />
                    <StatusBadge status={o.status} />
                    {o.status === "pending" && (
                      <Button size="sm" variant="ghost" className="text-danger-fg" onClick={() => setCancelling(o)}>Cancel</Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card>
            <CardHeader title="Points" description="Newest first." />
            {data.entries.length === 0 ? (
              <EmptyState icon={<Star />} title="No points yet" description="Refer a recruit, fly in fleets, mentor a new member or deliver to an industry project." />
            ) : (
              <Table>
                <THead>
                  <tr>
                    <Th>What for</Th>
                    <Th>From</Th>
                    <Th align="right">Points</Th>
                    <Th align="right">When</Th>
                  </tr>
                </THead>
                <tbody>
                  {data.entries.map((e) => (
                    <Tr key={e.id}>
                      <Td>{e.reason}{e.by && e.source === "manual" && <span className="text-xs text-subtle"> · {e.by}</span>}</Td>
                      <Td><Badge tone="neutral">{SOURCES[e.source]}</Badge></Td>
                      <Td align="right" className={e.points > 0 ? "font-mono text-success-fg" : "font-mono text-muted"}>
                        {e.points > 0 ? "+" : ""}{e.points.toLocaleString("en")}
                      </Td>
                      <Td align="right" className="text-xs text-muted">{timeAgo(e.created_at)}</Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
        </div>
      )}
      <ConfirmDialog
        open={!!cancelling}
        onOpenChange={(o) => !o && setCancelling(null)}
        title="Cancel this order?"
        description={cancelling ? `You get your ${cancelling.points.toLocaleString("en")} points back.` : undefined}
        danger
        confirmLabel="Cancel order"
        cancelLabel="Keep it"
        onConfirm={() =>
          api.post(`${BASE}/orders/${cancelling!.id}/cancel`, {}).then(
            () => {
              toast.success("Cancelled. Your points are back.");
              qc.invalidateQueries({ queryKey: ["store"] });
            },
            (e: Error) => toast.error(e.message),
          )
        }
      />
    </>
  );
}
