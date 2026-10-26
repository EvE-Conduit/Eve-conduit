// The members' side: what's short at each staging location, and claiming to seed it.
import {
  api, Avatar, Badge, Button, Card, CardHeader, cn, date, Dialog, EmptyState, Field, Input, isk, num, PageHeader, Progress, Skeleton, toast, Tooltip,
} from "@conduit/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router";

import { Boxes, External, Hand, Settings, X } from "./icons";
import { BASE, type Board, STATUS, type Summary, type TargetRow } from "./types";

const KEY = ["stock", "board"];

export function BoardPage() {
  const { data, isLoading } = useQuery({ queryKey: KEY, queryFn: () => api.get<Board>(`${BASE}/board`), refetchInterval: 300_000 });
  const [claiming, setClaiming] = useState<TargetRow | null>(null);
  return (
    <>
      <PageHeader
        eyebrow="Logistics"
        title="Doctrine Stock"
        icon={<Boxes />}
        description="What should be for sale at each staging location, what is, and who's seeding what. Counted from members' and the corporations' sell orders and contracts."
        actions={data?.can_manage ? <Link to="/p/stock/manage"><Button variant="ghost"><Settings /> Manage</Button></Link> : undefined}
      />
      {isLoading || !data ? (
        <Skeleton className="h-64" />
      ) : data.places.length === 0 ? (
        <Card>
          <EmptyState icon={<Boxes />} title="No staging locations yet" description={data.can_manage ? "Add one under Manage, with what should be for sale there." : "The logistics team hasn't set any up yet."} />
        </Card>
      ) : (
        <div className="space-y-6">
          {data.places.map((p) => {
            const short = p.targets.filter((t) => t.status !== "ok").length;
            return (
              <Card key={p.id}>
                <CardHeader
                  title={p.label || p.name}
                  description={[p.label ? p.name : null, p.system].filter(Boolean).join(" · ")}
                  actions={p.targets.length === 0 ? undefined : short ? <Badge tone="warning">{short} short</Badge> : <Badge tone="success">All stocked</Badge>}
                />
                {p.targets.length === 0 ? (
                  <p className="px-card pb-card text-sm text-muted">Nothing to stock here yet.</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {p.targets.map((t) => (
                      <TargetItem key={t.id} t={t} onClaim={() => setClaiming(t)} />
                    ))}
                  </ul>
                )}
              </Card>
            );
          })}
        </div>
      )}
      {claiming && <ClaimDialog target={claiming} days={data?.claim_days ?? 7} onClose={() => setClaiming(null)} />}
    </>
  );
}

function TargetItem({ t, onClaim }: { t: TargetRow; onClaim: () => void }) {
  const qc = useQueryClient();
  const release = useMutation({
    mutationFn: () => api.delete(`${BASE}/targets/${t.id}/claim`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stock"] }),
    onError: (e: Error) => toast.error(e.message),
  });
  const pct = t.quantity ? Math.min(100, (t.have / t.quantity) * 100) : 100;
  return (
    <li className="grid gap-3 px-card py-3 md:grid-cols-[minmax(0,1fr)_220px_auto] md:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <img src={t.icon} alt="" className="size-10 shrink-0" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate font-medium">{t.fit ? t.fit.name : t.name}</span>
            <Badge tone={STATUS[t.status].tone}>{STATUS[t.status].label}</Badge>
          </div>
          <div className="truncate text-xs text-muted">
            {t.fit && (
              <Link to={`/p/doctrines/fit/${t.fit.id}`} className="inline-flex items-center gap-1 hover:text-text">
                {t.name} <External className="size-3" />
              </Link>
            )}
            {t.fit && " · "}
            {priceText(t)}
            {t.note && ` · ${t.note}`}
          </div>
        </div>
      </div>
      <div>
        <div className="mb-1 flex items-baseline justify-between text-xs">
          <Tooltip content={`${num(t.on_market)} on the market, ${num(t.on_contract)} on contract. Low below ${num(t.low)}.`}>
            <span className="font-mono tabular-nums text-text">
              {num(t.have)} / {num(t.quantity)}
            </span>
          </Tooltip>
          <span className="text-muted">
            {t.short > 0 ? `short ${num(t.short)}${t.claimed ? `, ${num(t.claimed)} claimed` : ""}` : "stocked"}
          </span>
        </div>
        <Progress value={pct} tone={t.status === "ok" ? "success" : t.status === "low" ? "danger" : "warning"} size="sm" />
      </div>
      <div className="flex items-center justify-end gap-2">
        {t.claims.length > 0 && (
          <div className="flex -space-x-1.5">
            {t.claims.slice(0, 4).map((c) => (
              <Tooltip key={c.user_id} content={`${c.user} is seeding ${num(c.quantity)} (until ${date(c.expires_at)})`}>
                <span><Avatar src={c.portrait} name={c.user} size="xs" rounded="full" className="ring-2 ring-surface" /></span>
              </Tooltip>
            ))}
          </div>
        )}
        {t.my_claim != null ? (
          <>
            <Button size="sm" variant="secondary" onClick={onClaim}>Seeding {num(t.my_claim)}</Button>
            <Button size="icon-sm" variant="ghost" loading={release.isPending} onClick={() => release.mutate()} aria-label="Stop seeding">
              {!release.isPending && <X />}
            </Button>
          </>
        ) : (
          t.still_short > 0 && (
            <Button size="sm" variant="outline" onClick={onClaim}>
              <Hand /> I'll seed
            </Button>
          )
        )}
      </div>
    </li>
  );
}

function priceText(t: TargetRow) {
  const parts = [];
  if (t.cheapest_order != null) parts.push(`market from ${isk(t.cheapest_order)}`);
  if (t.cheapest_contract != null) parts.push(`${t.fit ? "fitted" : "contract"} from ${isk(t.cheapest_contract)}`);
  return parts.length ? parts.join(" · ") : "none for sale";
}

function ClaimDialog({ target, days, onClose }: { target: TargetRow; days: number; onClose: () => void }) {
  const qc = useQueryClient();
  const [qty, setQty] = useState(String(target.my_claim ?? Math.max(target.still_short, 1)));
  const save = useMutation({
    mutationFn: () => api.post(`${BASE}/targets/${target.id}/claim`, { quantity: Number(qty) }),
    onSuccess: () => {
      toast.success("Thanks! Your claim is on the board.");
      qc.invalidateQueries({ queryKey: ["stock"] });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={`Seed ${target.fit ? target.fit.name : target.name}`}
      description={`Say how many you'll put up for sale, so others don't double up. Your claim lasts ${days} day${days === 1 ? "" : "s"}, and ends by itself once the target is met.`}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={save.isPending} disabled={!(Number(qty) >= 1)} onClick={() => save.mutate()}>Claim</Button>
        </>
      }
    >
      <Field label="How many" hint={`${num(target.still_short)} still unclaimed of ${num(target.short)} short`}>
        <Input type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)} className={cn("max-w-32 font-mono")} autoFocus />
      </Field>
    </Dialog>
  );
}

export function StockWidget() {
  const { data, isLoading } = useQuery({ queryKey: ["stock", "summary"], queryFn: () => api.get<Summary>(`${BASE}/summary`), refetchInterval: 300_000 });
  if (isLoading || !data) return <Skeleton className="h-16" />;
  if (data.targets === 0) return <p className="text-sm text-muted">No stock targets set up yet.</p>;
  return (
    <Link to="/p/stock" className="block space-y-3">
      <div className="flex items-end justify-between gap-6">
        <div>
          <div className="text-xs text-muted">Targets short</div>
          <div className="mt-1 font-mono text-3xl font-semibold tabular-nums">{data.short}</div>
          <div className="text-xs text-subtle">of {data.targets}</div>
        </div>
        {data.low > 0 ? <Badge tone="danger">{data.low} low</Badge> : data.short ? <Badge tone="warning">Needs seeding</Badge> : <Badge tone="success">All stocked</Badge>}
      </div>
      {data.worst.length > 0 && (
        <ul className="space-y-1.5">
          {data.worst.map((w) => (
            <li key={w.id} className="flex items-center gap-2 text-sm">
              <img src={w.icon} alt="" className="size-5" />
              <span className="min-w-0 flex-1 truncate">{w.name} <span className="text-subtle">· {w.place}</span></span>
              <span className={cn("font-mono text-xs tabular-nums", w.status === "low" ? "text-danger-fg" : "text-warning-fg")}>
                {num(w.have)}/{num(w.quantity)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Link>
  );
}
