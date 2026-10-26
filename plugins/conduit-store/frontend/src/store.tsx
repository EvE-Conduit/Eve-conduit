// The members' side: the balance, what's for sale, buying, and who earned most.
import {
  api, Avatar, Badge, Button, Card, CardBody, CardHeader, Dialog, EmptyState, Field, Input, PageHeader, Segmented, Skeleton,
  StatCard, toast,
} from "@conduit/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router";

import { Coins, Package, Star, Trophy, Wrench } from "./icons";
import { ItemIcon, Points, points } from "./shared";
import { BASE, type Item, type Ranked, type StoreInfo } from "./types";

export const STORE_KEY = ["store", "me"];

export function StorePage() {
  const { data, isLoading } = useQuery({ queryKey: STORE_KEY, queryFn: () => api.get<StoreInfo>(`${BASE}/me`) });
  const [buying, setBuying] = useState<Item | null>(null);

  if (isLoading || !data) return <Skeleton className="h-64" />;
  return (
    <>
      <PageHeader
        eyebrow="Corp Store"
        title="Corp Store"
        icon={<Coins />}
        description="Earn points by recruiting, flying in fleets, mentoring and building for the corp, then spend them here. An officer hands over what you buy."
        actions={
          <div className="flex flex-wrap gap-2">
            {data.can_fulfil && (
              <Link to="/p/store/orders">
                <Button variant="ghost"><Package /> Orders {data.pending ? <Badge tone="info">{data.pending}</Badge> : null}</Button>
              </Link>
            )}
            {data.can_manage && <Link to="/p/store/manage"><Button variant="ghost"><Wrench /> Manage</Button></Link>}
          </div>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard label="Your points" value={points(data.balance)} mono icon={<Coins />} hint={<Link to="/p/store/me" className="hover:underline">History and orders</Link>} />
            <StatCard label="For sale" value={data.items.length} icon={<Package />} hint={data.items.length === 1 ? "item" : "items"} />
          </div>
          {data.items.length === 0 ? (
            <Card>
              <EmptyState icon={<Package />} title="Nothing for sale yet" description="Officers add items here. Keep earning points in the meantime." />
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {data.items.map((item) => (
                <ItemCard key={item.id} item={item} balance={data.balance} onBuy={() => setBuying(item)} />
              ))}
            </div>
          )}
        </div>
        <Leaderboard board={data.leaderboard} />
      </div>
      {buying && <BuyDialog item={buying} balance={data.balance} onClose={() => setBuying(null)} />}
    </>
  );
}

function left(item: Item): number | null {
  const byLimit = item.per_member_limit != null ? item.per_member_limit - (item.bought ?? 0) : null;
  if (item.stock == null) return byLimit;
  return byLimit == null ? item.stock : Math.min(item.stock, byLimit);
}

function ItemCard({ item, balance, onBuy }: { item: Item; balance: number; onBuy: () => void }) {
  const most = left(item);
  const soldOut = item.stock === 0;
  const reachedLimit = !soldOut && most === 0;
  return (
    <Card className="flex flex-col">
      <CardBody className="flex flex-1 flex-col gap-3">
        <div className="flex items-start gap-3">
          <ItemIcon icon={item.icon} name={item.name} className="size-12" />
          <div className="min-w-0 flex-1">
            <div className="font-medium">{item.name}</div>
            <Points value={item.price} className="text-sm" />
          </div>
        </div>
        {item.description && <p className="whitespace-pre-line text-sm text-muted">{item.description}</p>}
        <div className="mt-auto flex items-center justify-between gap-3 pt-1">
          <span className="text-xs text-subtle">
            {[
              item.stock != null && (soldOut ? "Sold out" : `${item.stock} left`),
              item.per_member_limit != null && `${item.bought ?? 0} of ${item.per_member_limit} per member`,
            ].filter(Boolean).join(" · ")}
          </span>
          <Button size="sm" variant="primary" disabled={soldOut || reachedLimit || balance < item.price} onClick={onBuy}>
            {soldOut ? "Sold out" : reachedLimit ? "Limit reached" : balance < item.price ? `Need ${points(item.price - balance)} more` : "Buy"}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

function BuyDialog({ item, balance, onClose }: { item: Item; balance: number; onClose: () => void }) {
  const qc = useQueryClient();
  const [qty, setQty] = useState(1);
  const most = Math.max(1, Math.min(left(item) ?? 1000, Math.floor(balance / item.price) || 1));
  const cost = item.price * qty;
  const buy = useMutation({
    mutationFn: () => api.post<{ balance: number }>(`${BASE}/orders`, { item_id: item.id, quantity: qty }),
    onSuccess: () => {
      toast.success("Ordered. An officer will hand it over and you'll get a notification.");
      qc.invalidateQueries({ queryKey: ["store"] });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={`Buy ${item.name}`}
      description="The points are taken now. You can cancel and get them back until an officer hands it over."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={buy.isPending} disabled={cost > balance || qty < 1} onClick={() => buy.mutate()}>
            Buy for {points(cost)} points
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="How many" hint={`Up to ${most}`}>
          <Input type="number" min={1} max={most} value={qty} onChange={(e) => setQty(Math.max(1, Math.min(most, Number(e.target.value) || 1)))} className="w-28" />
        </Field>
        <div className="flex justify-between border-t border-border pt-3 text-sm">
          <span className="text-muted">Left afterwards</span>
          <Points value={balance - cost} />
        </div>
      </div>
    </Dialog>
  );
}

function Leaderboard({ board }: { board: StoreInfo["leaderboard"] }) {
  const [when, setWhen] = useState<"month" | "all_time">("month");
  const rows: Ranked[] = board[when];
  return (
    <Card className="self-start">
      <CardHeader
        title={<span className="inline-flex items-center gap-2"><Trophy className="size-4 text-accent-ink" /> Points earned</span>}
        actions={
          <Segmented size="sm" value={when} onChange={setWhen} aria-label="Period"
            options={[{ value: "month", label: "This month" }, { value: "all_time", label: "All time" }]} />
        }
      />
      {rows.length === 0 ? (
        <CardBody><p className="text-sm text-muted">Nobody has earned points {when === "month" ? "this month" : ""} yet.</p></CardBody>
      ) : (
        <ol className="divide-y divide-border">
          {rows.map((r, i) => (
            <li key={r.id} className="flex items-center gap-3 px-card py-2.5 text-sm">
              <span className="w-5 text-right font-mono text-xs text-subtle">{i < 3 ? <Star className="ml-auto size-3.5 text-accent-ink" /> : i + 1}</span>
              <Avatar src={r.portrait} name={r.name} size="xs" />
              <span className="min-w-0 flex-1 truncate">{r.name}</span>
              <Points value={r.points} className="text-xs" />
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
