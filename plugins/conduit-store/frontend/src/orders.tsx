// Officers (store.fulfil_orders): hand orders over in game and mark them done, or cancel with a reason.
import {
  api, Avatar, Button, Card, Dialog, EmptyState, Field, PageHeader, Skeleton, Table, Td, Tabs, Textarea, Th, THead, timeAgo, toast, Tr,
} from "@conduit/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router";

import { Back, Check, Package, X } from "./icons";
import { ItemIcon, Points, StatusBadge } from "./shared";
import { BASE, type Order, type OrderStatus } from "./types";

export function OrdersPage() {
  const [status, setStatus] = useState<OrderStatus>("pending");
  const [acting, setActing] = useState<{ order: Order; cancel: boolean } | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["store", "orders", status],
    queryFn: () => api.get<{ items: Order[]; counts: Record<OrderStatus, number> }>(`${BASE}/orders?status=${status}`),
    refetchInterval: 60_000,
  });
  return (
    <>
      <Link to="/p/store" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-text"><Back /> Store</Link>
      <PageHeader eyebrow="Corp Store" title="Orders" icon={<Package />} description="Hand each order over in game (contract or hangar), then mark it done. The member gets a notification." />
      <Card>
        <Tabs
          value={status}
          onValueChange={(v) => setStatus(v as OrderStatus)}
          listClassName="px-card"
          items={[
            { value: "pending", label: "Waiting", count: data?.counts.pending },
            { value: "fulfilled", label: "Handed over", count: data?.counts.fulfilled },
            { value: "cancelled", label: "Cancelled", count: data?.counts.cancelled },
          ]}
        />
        {isLoading || !data ? (
          <div className="p-card"><Skeleton className="h-40" /></div>
        ) : data.items.length === 0 ? (
          <EmptyState icon={<Package />} title={status === "pending" ? "Nothing waiting" : "Nothing here"} description={status === "pending" ? "New orders show up here, and you get a notification." : undefined} />
        ) : (
          <Table>
            <THead>
              <tr>
                <Th>Member</Th>
                <Th>Order</Th>
                <Th align="right">Points</Th>
                <Th>{status === "pending" ? "Ordered" : "Status"}</Th>
                {status === "pending" && <Th align="right"> </Th>}
              </tr>
            </THead>
            <tbody>
              {data.items.map((o) => (
                <Tr key={o.id}>
                  <Td>
                    <div className="flex items-center gap-2">
                      <Avatar src={o.user!.portrait} name={o.user!.name} size="sm" />
                      <span className="font-medium">{o.user!.name}</span>
                    </div>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <ItemIcon icon={o.item.icon} name={o.item.name} className="size-7" />
                      <span>{o.quantity} × {o.item.name}</span>
                    </div>
                    {o.note && <div className="mt-1 text-xs italic text-muted">“{o.note}”</div>}
                  </Td>
                  <Td align="right"><Points value={o.points} className="text-xs" /></Td>
                  <Td className="text-xs text-muted">
                    {status === "pending" ? timeAgo(o.created_at) : (
                      <span className="inline-flex items-center gap-2"><StatusBadge status={o.status} /> {o.handled_by} {o.handled_at && timeAgo(o.handled_at)}</span>
                    )}
                  </Td>
                  {status === "pending" && (
                    <Td align="right">
                      <div className="flex justify-end gap-1.5">
                        <Button size="sm" variant="success" onClick={() => setActing({ order: o, cancel: false })}><Check /> Handed over</Button>
                        <Button size="sm" variant="ghost" onClick={() => setActing({ order: o, cancel: true })} aria-label="Cancel order"><X /></Button>
                      </div>
                    </Td>
                  )}
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
      {acting && <ActDialog order={acting.order} cancel={acting.cancel} onClose={() => setActing(null)} />}
    </>
  );
}

function ActDialog({ order, cancel, onClose }: { order: Order; cancel: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [note, setNote] = useState("");
  const act = useMutation({
    mutationFn: () => api.post(`${BASE}/orders/${order.id}/${cancel ? "cancel" : "fulfil"}`, { note }),
    onSuccess: () => {
      toast.success(cancel ? "Cancelled; the points went back" : "Marked as handed over");
      qc.invalidateQueries({ queryKey: ["store"] });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={cancel ? "Cancel this order?" : "Handed over?"}
      description={`${order.user!.name}: ${order.quantity} × ${order.item.name}. ${cancel ? `They get ${order.points.toLocaleString("en")} points back.` : ""}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Back</Button>
          <Button variant={cancel ? "solidDanger" : "primary"} loading={act.isPending} disabled={cancel && !note.trim()} onClick={() => act.mutate()}>
            {cancel ? "Cancel order" : "Mark handed over"}
          </Button>
        </>
      }
    >
      <Field label={cancel ? "Why (the member sees it)" : "Note to the member (optional)"} required={cancel}>
        <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder={cancel ? "Out of stock until next week…" : "Contracted to you in Jita 4-4"} />
      </Field>
    </Dialog>
  );
}
