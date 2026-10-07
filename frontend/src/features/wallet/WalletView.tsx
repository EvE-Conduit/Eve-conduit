import * as Tabs from "@radix-ui/react-tabs";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight, Coins, Search, Wallet } from "lucide-react";
import { useDeferredValue, useState, type ReactNode } from "react";
import { Link } from "react-router";

import { AreaChart } from "@/components/AreaChart";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState, StatCard } from "@/components/ui/page";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { dateTime, humanize, isk, num } from "@/lib/format";
import { cn } from "@/lib/utils";

import { PlaceLabel, TypeIcon } from "../sheet/components";
import type { EveType, Place } from "../sheet/types";

export interface WalletSummary {
  synced: boolean;
  balance: number;
  series: { date: string; balance: number }[];
  characters: { character: { id: number; name: string; portrait: string }; balance: number }[];
  income: number;
  spending: number;
  top_income: { ref_type: string; amount: number }[];
  top_spending: { ref_type: string; amount: number }[];
}

interface JournalRow {
  id: number;
  character_id: number;
  date: string;
  ref_type: string;
  amount: number | null;
  balance: number | null;
  description: string;
  reason: string;
  first_party: string | null;
  second_party: string | null;
}

interface TransactionRow {
  id: number;
  date: string;
  type: EveType;
  quantity: number;
  unit_price: number;
  total: number;
  is_buy: boolean;
  client: string | null;
  location: Place | null;
}

interface Page<T> {
  items: T[];
  count: number;
}

const PAGE = 50;

/** Wallet for one character (`base` = /api/characters/<id>) or all of mine (`base` = /api/me). */
export function WalletView({ base, multiCharacter = false }: { base: string; multiCharacter?: boolean }) {
  const { data, isLoading } = useQuery({ queryKey: [base, "wallet"], queryFn: () => api.get<WalletSummary>(`${base}/wallet`) });
  if (isLoading || !data) return <Skeleton className="h-96 rounded-xl" />;
  if (!data.synced) return <Card><EmptyState icon={<Wallet />} title="No wallet data yet" description="It appears after the first sync." /></Card>;

  const first = data.series[0]?.balance ?? data.balance;
  const change = data.balance - first;
  const names = new Map(data.characters.map((c) => [c.character.id, c.character.name]));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Balance" value={isk(data.balance).replace(" ISK", "")} mono hint={isk(data.balance, { full: true })} icon={<Wallet />} />
        <StatCard label="30-day change" value={<span className={change >= 0 ? "text-success" : "text-danger-fg"}>{isk(change, { sign: true }).replace(" ISK", "")}</span>} mono hint="since 30 days ago" />
        <StatCard label="Income (30d)" value={isk(data.income).replace(" ISK", "")} mono icon={<ArrowDownRight />} />
        <StatCard label="Spending (30d)" value={isk(data.spending).replace(" ISK", "")} mono icon={<ArrowUpRight />} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Balance, last 30 days" description={multiCharacter ? "All your characters combined" : undefined} />
          <CardBody>
            <AreaChart data={data.series.map((p) => ({ date: p.date, value: p.balance }))} format={(n) => isk(n)} label="Wallet balance" />
          </CardBody>
        </Card>
        <Card>
          {multiCharacter ? (
            <>
              <CardHeader title="By character" />
              <ul className="divide-y divide-border">
                {data.characters.map((c) => (
                  <li key={c.character.id}>
                    <Link to={`/characters/${c.character.id}?tab=wallet`} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-hover">
                      <Avatar src={c.character.portrait} name={c.character.name} size="sm" />
                      <span className="min-w-0 flex-1 truncate text-sm">{c.character.name}</span>
                      <span className="font-mono text-sm tabular-nums">{isk(c.balance)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <CardHeader title="Where it came from" />
              <CardBody className="space-y-5">
                <FlowList title="Income" rows={data.top_income} total={data.income} positive />
                <FlowList title="Spending" rows={data.top_spending} total={data.spending} />
              </CardBody>
            </>
          )}
        </Card>
      </div>

      <Tabs.Root defaultValue="journal">
        <Card>
          <div className="flex items-center gap-1 border-b border-border px-3 pt-2">
            <Tabs.List className="flex gap-1">
              <TabButton value="journal">Journal</TabButton>
              {!multiCharacter && <TabButton value="transactions">Market transactions</TabButton>}
            </Tabs.List>
          </div>
          <Tabs.Content value="journal">
            <Journal base={base} names={multiCharacter ? names : null} />
          </Tabs.Content>
          {!multiCharacter && (
            <Tabs.Content value="transactions">
              <Transactions base={base} />
            </Tabs.Content>
          )}
        </Card>
      </Tabs.Root>
    </div>
  );
}

function TabButton({ value, children }: { value: string; children: ReactNode }) {
  return (
    <Tabs.Trigger
      value={value}
      className="relative px-3 py-2.5 text-sm text-muted transition-colors hover:text-text data-[state=active]:text-text data-[state=active]:after:absolute data-[state=active]:after:inset-x-2 data-[state=active]:after:-bottom-px data-[state=active]:after:h-0.5 data-[state=active]:after:rounded-none data-[state=active]:after:bg-accent"
    >
      {children}
    </Tabs.Trigger>
  );
}

function FlowList({ title, rows, total, positive }: { title: string; rows: { ref_type: string; amount: number }[]; total: number; positive?: boolean }) {
  return (
    <div>
      <div className="mb-2 flex justify-between text-xs text-muted">
        <span>{title}</span>
        <span className="font-mono">{isk(total)}</span>
      </div>
      {rows.length === 0 && <div className="text-xs text-subtle">Nothing in the last 30 days.</div>}
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.ref_type}>
            <div className="flex justify-between text-xs">
              <span className="truncate">{humanize(r.ref_type)}</span>
              <span className="font-mono tabular-nums text-muted">{isk(r.amount)}</span>
            </div>
            <div className="mt-1 h-1 overflow-hidden rounded-none bg-surface-3">
              <div className={cn("h-full rounded-none", positive ? "bg-success/70" : "bg-danger/70")} style={{ width: `${(r.amount / Math.max(total, 1)) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function usePaged<T>(key: unknown[], url: (offset: number) => string) {
  const [page, setPage] = useState(0);
  const query = useQuery({ queryKey: [...key, page], queryFn: () => api.get<Page<T>>(url(page * PAGE)), placeholderData: keepPreviousData });
  return { ...query, page, setPage, pages: Math.max(1, Math.ceil((query.data?.count ?? 0) / PAGE)) };
}

function Pager({ page, pages, count, setPage }: { page: number; pages: number; count: number; setPage: (p: number) => void }) {
  if (count <= PAGE) return null;
  return (
    <div className="flex items-center justify-between border-t border-border px-5 py-3 text-xs text-muted">
      <span>
        {page * PAGE + 1}–{Math.min((page + 1) * PAGE, count)} of {num(count)}
      </span>
      <div className="flex gap-1">
        <Button size="icon" variant="ghost" disabled={page === 0} onClick={() => setPage(page - 1)} aria-label="Previous page">
          <ChevronLeft />
        </Button>
        <Button size="icon" variant="ghost" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)} aria-label="Next page">
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}

function Journal({ base, names }: { base: string; names: Map<number, string> | null }) {
  const [q, setQ] = useState("");
  const query = useDeferredValue(q);
  const { data, isLoading, page, setPage, pages } = usePaged<JournalRow>([base, "journal", query], (offset) => `${base}/wallet/journal?limit=${PAGE}&offset=${offset}&q=${encodeURIComponent(query)}`);
  return (
    <>
      <div className="px-5 py-3">
        <div className="relative max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-subtle" />
          <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder="Search descriptions" className="h-8 pl-8 text-xs" />
        </div>
      </div>
      {isLoading ? (
        <div className="space-y-2 p-5">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-9" />)}</div>
      ) : !data?.items.length ? (
        <EmptyState icon={<Coins />} title="No journal entries" className="py-10" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y border-border text-left text-[11px] uppercase tracking-wider text-subtle">
                <th className="px-5 py-2.5 font-medium">Date</th>
                {names && <th className="px-5 py-2.5 font-medium">Character</th>}
                <th className="px-5 py-2.5 font-medium">Type</th>
                <th className="px-5 py-2.5 font-medium">Description</th>
                <th className="px-5 py-2.5 text-right font-medium">Amount</th>
                <th className="px-5 py-2.5 text-right font-medium">Balance</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((r) => (
                <tr key={`${r.character_id}-${r.id}`} className="border-b border-border/60 last:border-0 hover:bg-hover">
                  <td className="whitespace-nowrap px-5 py-2.5 text-xs text-muted">{dateTime(r.date)}</td>
                  {names && <td className="whitespace-nowrap px-5 py-2.5">{names.get(r.character_id) ?? r.character_id}</td>}
                  <td className="whitespace-nowrap px-5 py-2.5">{humanize(r.ref_type)}</td>
                  <td className="max-w-md px-5 py-2.5 text-muted">
                    <div className="truncate">{r.description}</div>
                    {r.reason && <div className="truncate text-xs text-subtle">“{r.reason}”</div>}
                  </td>
                  <td className={cn("whitespace-nowrap px-5 py-2.5 text-right font-mono tabular-nums", (r.amount ?? 0) >= 0 ? "text-success" : "text-danger-fg")}>
                    {r.amount == null ? "—" : isk(r.amount, { full: true, sign: true }).replace(" ISK", "")}
                  </td>
                  <td className="whitespace-nowrap px-5 py-2.5 text-right font-mono tabular-nums text-muted">{r.balance == null ? "—" : isk(r.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pager page={page} pages={pages} count={data?.count ?? 0} setPage={setPage} />
    </>
  );
}

function Transactions({ base }: { base: string }) {
  const { data, isLoading, page, setPage, pages } = usePaged<TransactionRow>([base, "transactions"], (offset) => `${base}/wallet/transactions?limit=${PAGE}&offset=${offset}`);
  if (isLoading) return <div className="space-y-2 p-5">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-9" />)}</div>;
  if (!data?.items.length) return <EmptyState icon={<Coins />} title="No market transactions" className="py-10" />;
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-subtle">
              <th className="px-5 py-2.5 font-medium">Date</th>
              <th className="px-5 py-2.5 font-medium">Item</th>
              <th className="px-5 py-2.5 text-right font-medium">Qty</th>
              <th className="px-5 py-2.5 text-right font-medium">Price</th>
              <th className="px-5 py-2.5 text-right font-medium">Total</th>
              <th className="px-5 py-2.5 font-medium">Where</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((t) => (
              <tr key={t.id} className="border-b border-border/60 last:border-0 hover:bg-hover">
                <td className="whitespace-nowrap px-5 py-2.5 text-xs text-muted">{dateTime(t.date)}</td>
                <td className="px-5 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <TypeIcon type={t.type} size={24} />
                    <span className="truncate">{t.type.name}</span>
                    <span className={cn("rounded px-1.5 text-[11px] font-medium uppercase", t.is_buy ? "bg-danger-soft text-danger-fg" : "bg-success-soft text-success-fg")}>{t.is_buy ? "Buy" : "Sell"}</span>
                  </div>
                </td>
                <td className="px-5 py-2.5 text-right font-mono tabular-nums">{num(t.quantity)}</td>
                <td className="whitespace-nowrap px-5 py-2.5 text-right font-mono tabular-nums text-muted">{isk(t.unit_price, { full: true }).replace(" ISK", "")}</td>
                <td className={cn("whitespace-nowrap px-5 py-2.5 text-right font-mono tabular-nums", t.total >= 0 ? "text-success" : "text-danger-fg")}>{isk(t.total, { sign: true }).replace(" ISK", "")}</td>
                <td className="max-w-xs px-5 py-2.5 text-muted">
                  <PlaceLabel place={t.location} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pager page={page} pages={pages} count={data.count} setPage={setPage} />
    </>
  );
}
