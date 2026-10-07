import { useQuery } from "@tanstack/react-query";
import { CircleCheck, Factory, FileStack, FlaskConical, Globe2, Pickaxe, ScrollText, Search, ShoppingCart, Timer } from "lucide-react";
import { useDeferredValue, useEffect, useState, type ReactNode } from "react";

import { BarChart } from "@/components/BarChart";
import { DataTable, PagedTable, SegmentTabs, type Column } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input, SearchInput } from "@/components/ui/input";
import { EmptyState, StatCard } from "@/components/ui/page";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip } from "@/components/ui/tooltip";
import { api } from "@/lib/api";
import { date, dateTime, duration, humanize, isk, num } from "@/lib/format";
import { cn } from "@/lib/utils";

import { useSection } from "../sheet/hooks";
import { PlaceLabel, Security, TypeIcon } from "../sheet/components";
import type { CharacterHeader, EveType, Place } from "../sheet/types";

const base = (h: CharacterHeader) => `/api/characters/${h.id}`;

function TypeCell({ type, sub }: { type: EveType; sub?: ReactNode }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <TypeIcon type={type} size={28} />
      <div className="min-w-0">
        <div className="truncate">{type.name}</div>
        {sub && <div className="truncate text-xs text-subtle">{sub}</div>}
      </div>
    </div>
  );
}

// --- Blueprints ----------------------------------------------------------------

interface BlueprintRow {
  item_id: number;
  type: EveType;
  copy: boolean;
  quantity: number;
  runs: number;
  me: number;
  te: number;
  location: Place | null;
}

export function BlueprintsTab({ header }: { header: CharacterHeader }) {
  const [kind, setKind] = useState<"" | "original" | "copy">("");
  const [q, setQ] = useState("");
  const query = useDeferredValue(q);
  const summary = useSection<{ originals: number; copies: number; researched: number }>(header.id, "blueprints/summary");
  const columns: Column<BlueprintRow>[] = [
    { header: "Blueprint", cell: (b) => <TypeCell type={b.type} sub={b.copy ? "Copy" : b.quantity > 1 ? `Original ×${b.quantity}` : "Original"} /> },
    { header: "ME", align: "right", cell: (b) => <span className={b.me === 10 ? "text-success" : undefined}>{b.me}</span> },
    { header: "TE", align: "right", cell: (b) => <span className={b.te === 20 ? "text-success" : undefined}>{b.te}</span> },
    { header: "Runs", align: "right", cell: (b) => (b.runs < 0 ? "∞" : num(b.runs)) },
    { header: "Location", cell: (b) => <PlaceLabel place={b.location} />, className: "max-w-xs text-muted" },
  ];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Originals" value={summary.data?.originals ?? "—"} icon={<ScrollText />} />
        <StatCard label="Copies" value={summary.data?.copies ?? "—"} icon={<FileStack />} />
        <StatCard label="Fully researched" value={summary.data?.researched ?? "—"} hint="ME 10 / TE 20 originals" icon={<CircleCheck />} />
      </div>
      <Card>
        <SegmentTabs value={kind} onChange={setKind} options={[{ value: "", label: "All" }, { value: "original", label: "Originals" }, { value: "copy", label: "Copies" }]} />
        <div className="px-5 py-3">
          <div className="relative max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-subtle" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a blueprint" className="h-8 pl-8 text-xs" />
          </div>
        </div>
        <PagedTable<BlueprintRow>
          url={`${base(header)}/blueprints`}
          params={`kind=${kind}&q=${encodeURIComponent(query)}`}
          columns={columns}
          rowKey={(b) => b.item_id}
          empty={{ icon: <ScrollText />, title: "No blueprints" }}
        />
      </Card>
    </div>
  );
}

// --- Industry ------------------------------------------------------------------

interface Job {
  job_id: number;
  activity: string;
  status: string;
  blueprint: EveType;
  product: EveType | null;
  runs: number;
  successful_runs: number | null;
  probability: number | null;
  cost: number | null;
  start_date: string;
  end_date: string;
  progress: number;
  location: Place | null;
}

const STATUS_COLORS: Record<string, string> = { active: "#22d3ee", ready: "var(--success)", paused: "var(--warning)", delivered: "var(--subtle)", cancelled: "var(--danger)", reverted: "var(--danger)" };

function JobRow({ job }: { job: Job }) {
  return (
    <div className="flex items-center gap-4 px-5 py-3">
      <TypeIcon type={job.product ?? job.blueprint} size={36} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <span className="truncate text-sm font-medium">
            {job.product?.name ?? job.blueprint.name} <span className="font-normal text-muted">× {job.runs}</span>
          </span>
          <span className="shrink-0 font-mono text-xs text-muted">{job.status === "active" ? duration(job.end_date) : humanize(job.status)}</span>
        </div>
        <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-subtle">
          <span className="shrink-0">{job.activity} ·</span>
          <PlaceLabel place={job.location} className="min-w-0" />
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-none bg-surface-3">
          <div className="h-full rounded-none" style={{ width: `${Math.round(job.progress * 100)}%`, background: STATUS_COLORS[job.status] ?? "var(--site-accent)" }} />
        </div>
      </div>
    </div>
  );
}

export function IndustryTab({ header }: { header: CharacterHeader }) {
  const { data, isLoading } = useSection<{ active: Job[]; ready: Job[]; total_jobs: number }>(header.id, "industry");
  if (isLoading || !data) return <Skeleton className="h-72 rounded-xl" />;
  const columns: Column<Job>[] = [
    { header: "Job", cell: (j) => <TypeCell type={j.product ?? j.blueprint} sub={j.activity} /> },
    { header: "Runs", align: "right", cell: (j) => (j.successful_runs != null ? `${j.successful_runs}/${j.runs}` : j.runs) },
    { header: "Status", cell: (j) => <Badge color={STATUS_COLORS[j.status]} variant="dot">{humanize(j.status)}</Badge> },
    { header: "Cost", align: "right", cell: (j) => (j.cost != null ? isk(j.cost) : "—") },
    { header: "Finished", cell: (j) => dateTime(j.end_date), className: "whitespace-nowrap text-xs text-muted" },
  ];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Running" value={data.active.length} icon={<Factory />} />
        <StatCard label="Ready to deliver" value={data.ready.length} icon={<CircleCheck />} />
        <StatCard label="Jobs on record" value={data.total_jobs} icon={<Timer />} />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="In progress" icon={<Factory />} />
          {data.active.length ? <div className="divide-y divide-border">{data.active.map((j) => <JobRow key={j.job_id} job={j} />)}</div> : <EmptyState icon={<Factory />} title="No jobs running" className="py-10" />}
        </Card>
        <Card>
          <CardHeader title="Ready to deliver" icon={<CircleCheck />} />
          {data.ready.length ? <div className="divide-y divide-border">{data.ready.map((j) => <JobRow key={j.job_id} job={j} />)}</div> : <EmptyState icon={<CircleCheck />} title="Nothing waiting" className="py-10" />}
        </Card>
      </div>
      <Card>
        <CardHeader title="History" />
        <PagedTable<Job> url={`${base(header)}/industry/history`} columns={columns} rowKey={(j) => j.job_id} empty={{ icon: <Timer />, title: "No finished jobs yet" }} />
      </Card>
    </div>
  );
}

// --- Research ------------------------------------------------------------------

interface Agent {
  agent: { id: number; name: string; portrait: string };
  field: EveType;
  started_at: string;
  points_per_day: number;
  points: number;
}

export function ResearchTab({ header }: { header: CharacterHeader }) {
  const { data, isLoading } = useSection<{ agents: Agent[]; points_per_day: number }>(header.id, "research");
  if (isLoading || !data) return <Skeleton className="h-60 rounded-xl" />;
  if (!data.agents.length) return <Card><EmptyState icon={<FlaskConical />} title="No research agents" description="This character has no R&D agreements." /></Card>;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Agents" value={data.agents.length} icon={<FlaskConical />} />
        <StatCard label="Points per day" value={num(data.points_per_day)} mono />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.agents.map((a) => (
          <Card key={a.agent.id} className="p-5">
            <div className="flex items-center gap-3">
              <img src={a.agent.portrait} alt="" className="size-12 rounded-lg ring-1 ring-border-strong" />
              <div className="min-w-0">
                <div className="truncate font-medium">{a.agent.name}</div>
                <div className="truncate text-xs text-muted">{a.field.name}</div>
              </div>
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <div className="font-mono text-2xl font-semibold tabular-nums">{num(a.points)}</div>
                <div className="text-xs text-subtle">research points</div>
              </div>
              <div className="text-right text-xs text-muted">
                <div>{a.points_per_day.toFixed(1)} / day</div>
                <div className="text-subtle">since {date(a.started_at)}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// --- Mining --------------------------------------------------------------------

interface MiningData {
  days: number;
  total_value: number;
  total_volume: number;
  series: { date: string; value: number }[];
  ores: { type: EveType; quantity: number; volume: number; value: number }[];
  systems: { system: { id: number; name: string; security: number }; volume: number; value: number }[];
}

export function MiningTab({ header }: { header: CharacterHeader }) {
  const { data, isLoading } = useSection<MiningData>(header.id, "mining");
  if (isLoading || !data) return <Skeleton className="h-72 rounded-xl" />;
  if (!data.ores.length) return <Card><EmptyState icon={<Pickaxe />} title="Nothing mined in the last 30 days" /></Card>;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Value mined (30d)" value={isk(data.total_value).replace(" ISK", "")} mono hint="at CCP average prices" icon={<Pickaxe />} />
        <StatCard label="Volume" value={`${num(data.total_volume)} m³`} mono />
        <StatCard label="Ore types" value={data.ores.length} />
      </div>
      <Card>
        <CardHeader title="Value mined per day" />
        <CardBody>
          <BarChart data={data.series.map((p) => ({ date: p.date, value: p.value }))} format={(n) => isk(n)} height={180} label="Value mined per day" />
        </CardBody>
      </Card>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="By ore" />
          <DataTable
            rows={data.ores}
            rowKey={(o) => o.type.id}
            columns={[
              { header: "Ore", cell: (o) => <TypeCell type={o.type} sub={o.type.group} /> },
              { header: "Units", align: "right", cell: (o) => num(o.quantity) },
              { header: "m³", align: "right", cell: (o) => num(o.volume) },
              { header: "Value", align: "right", cell: (o) => isk(o.value) },
            ]}
          />
        </Card>
        <Card>
          <CardHeader title="By system" />
          <ul className="divide-y divide-border">
            {data.systems.map((s) => (
              <li key={s.system.id} className="flex items-center gap-3 px-5 py-2.5 text-sm">
                <Security value={s.system.security} />
                <span className="flex-1 truncate">{s.system.name}</span>
                <span className="font-mono text-xs tabular-nums text-muted">{isk(s.value)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

// --- Planetary industry ----------------------------------------------------------

interface Colony {
  planet_id: number;
  name: string;
  type: string;
  image: string;
  system: { id: number; name: string; security: number };
  upgrade_level: number;
  pins: number;
  last_update: string;
  extractors: { product: EveType | null; qty_per_cycle: number | null; heads: number; expiry: string | null; expired: boolean }[];
  next_expiry: string | null;
  any_expired: boolean;
  factories: { schematic: string; count: number }[];
  storage: { type: EveType; amount: number }[];
}

export function PlanetsTab({ header }: { header: CharacterHeader }) {
  const { data, isLoading } = useSection<Colony[]>(header.id, "planets");
  if (isLoading || !data) return <Skeleton className="h-72 rounded-xl" />;
  if (!data.length) return <Card><EmptyState icon={<Globe2 />} title="No colonies" description="This character has no planetary industry set up." /></Card>;
  const expired = data.filter((c) => c.any_expired).length;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Colonies" value={data.length} icon={<Globe2 />} />
        <StatCard label="Extractors" value={data.reduce((s, c) => s + c.extractors.length, 0)} />
        <StatCard label="Need attention" value={<span className={expired ? "text-warning-fg" : undefined}>{expired}</span>} hint="colonies with stopped extractors" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {data.map((c) => (
          <Card key={c.planet_id} className={cn("overflow-hidden", c.any_expired && "border-warning/30")}>
            <div className="flex items-center gap-4 border-b border-border p-5">
              <img src={c.image} alt="" className="size-12 rounded-none ring-1 ring-border-strong" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{c.name}</div>
                <div className="flex items-center gap-2 text-xs text-muted">
                  <Security value={c.system.security} /> {humanize(c.type)} · Command Center level {c.upgrade_level}
                </div>
              </div>
              {c.any_expired ? <Badge color="var(--warning)">Extractor stopped</Badge> : c.next_expiry ? <Badge>{duration(c.next_expiry)} left</Badge> : null}
            </div>
            <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2">
              <div>
                <div className="mb-2 text-xs font-medium text-muted">Extractors</div>
                {c.extractors.length ? (
                  <ul className="space-y-2">
                    {c.extractors.map((e, i) => (
                      <li key={i} className="flex items-center gap-2.5 text-sm">
                        {e.product && <TypeIcon type={e.product} size={24} />}
                        <span className="min-w-0 flex-1 truncate">{e.product?.name ?? "Idle"}</span>
                        <span className={cn("font-mono text-xs", e.expired ? "text-warning-fg" : "text-muted")}>{e.expired ? "stopped" : duration(e.expiry)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-subtle">None</div>
                )}
              </div>
              <div>
                <div className="mb-2 text-xs font-medium text-muted">Factories</div>
                {c.factories.length ? (
                  <ul className="space-y-1 text-sm">
                    {c.factories.map((f) => (
                      <li key={f.schematic} className="flex justify-between gap-2">
                        <span className="truncate">{f.schematic}</span>
                        <span className="font-mono text-xs text-muted">×{f.count}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-subtle">None</div>
                )}
              </div>
            </div>
            {c.storage.length > 0 && (
              <div className="flex flex-wrap gap-1.5 border-t border-border px-5 py-3">
                {c.storage.map((s) => (
                  <Tooltip key={s.type.id} content={`${s.type.name}: ${num(s.amount)}`}>
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-surface-3 py-0.5 pl-0.5 pr-2 text-xs ring-1 ring-border-strong">
                      <TypeIcon type={s.type} size={20} />
                      <span className="font-mono tabular-nums">{num(s.amount)}</span>
                    </span>
                  </Tooltip>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

// --- Market --------------------------------------------------------------------

interface Order {
  order_id: number;
  type: EveType;
  is_buy: boolean;
  price: number;
  volume_total: number;
  volume_remain: number;
  escrow: number | null;
  issued: string;
  duration: number;
  range: string;
  state: string;
  location: Place | null;
}

const orderColumns: Column<Order>[] = [
  { header: "Item", cell: (o) => <TypeCell type={o.type} sub={o.type.group} /> },
  { header: "Price", align: "right", cell: (o) => isk(o.price, { full: true }).replace(" ISK", "") },
  {
    header: "Remaining",
    align: "right",
    cell: (o) => (
      <div>
        {num(o.volume_remain)} <span className="text-subtle">/ {num(o.volume_total)}</span>
        <div className="ml-auto mt-1 h-1 w-20 overflow-hidden rounded-none bg-surface-3">
          <div className="h-full rounded-none bg-accent/80" style={{ width: `${(1 - o.volume_remain / Math.max(1, o.volume_total)) * 100}%` }} />
        </div>
      </div>
    ),
  },
  { header: "Expires", cell: (o) => duration(new Date(new Date(o.issued).getTime() + o.duration * 86400000).toISOString()), className: "whitespace-nowrap font-mono text-xs text-muted" },
  { header: "Station", cell: (o) => <PlaceLabel place={o.location} />, className: "max-w-xs text-muted" },
];

export function MarketTab({ header }: { header: CharacterHeader }) {
  const [view, setView] = useState<"sell" | "buy" | "history">("sell");
  const { data, isLoading } = useSection<{ sell: Order[]; buy: Order[]; sell_value: number; buy_value: number; escrow: number }>(header.id, "market");
  if (isLoading || !data) return <Skeleton className="h-72 rounded-xl" />;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Sell orders" value={data.sell.length} icon={<ShoppingCart />} />
        <StatCard label="Selling for" value={isk(data.sell_value).replace(" ISK", "")} mono hint="remaining volume × price" />
        <StatCard label="Buy orders" value={data.buy.length} />
        <StatCard label="In escrow" value={isk(data.escrow).replace(" ISK", "")} mono />
      </div>
      <Card>
        <SegmentTabs
          value={view}
          onChange={setView}
          options={[
            { value: "sell", label: `Selling (${data.sell.length})` },
            { value: "buy", label: `Buying (${data.buy.length})` },
            { value: "history", label: "History" },
          ]}
        />
        {view === "history" ? (
          <PagedTable<Order>
            url={`${base(header)}/market/history`}
            rowKey={(o) => o.order_id}
            columns={[orderColumns[0]!, orderColumns[1]!, { header: "Outcome", cell: (o) => <Badge>{o.state === "closed" ? "Filled" : humanize(o.state)}</Badge> }, { header: "Issued", cell: (o) => date(o.issued), className: "text-xs text-muted" }]}
            empty={{ icon: <ShoppingCart />, title: "No past orders" }}
          />
        ) : (
          <DataTable rows={view === "sell" ? data.sell : data.buy} columns={orderColumns} rowKey={(o) => o.order_id} empty={{ icon: <ShoppingCart />, title: `No open ${view} orders` }} />
        )}
      </Card>
    </div>
  );
}

// --- Contracts -----------------------------------------------------------------

interface ContractRow {
  contract_id: number;
  type: string;
  status: string;
  title: string;
  direction: "issued" | "received";
  issuer: string;
  assignee: string | null;
  acceptor: string | null;
  price: number | null;
  reward: number | null;
  collateral: number | null;
  volume: number | null;
  start: Place | null;
  end: Place | null;
  date_issued: string;
  date_expired: string;
  /** When searching: the searched-for items in this contract. */
  matches?: { name: string; quantity: number }[];
}

const TYPE_LABEL: Record<string, string> = { item_exchange: "Item exchange", auction: "Auction", courier: "Courier", loan: "Loan" };

export function ContractsTab({ header }: { header: CharacterHeader }) {
  const [state, setState] = useState<"open" | "closed">("open");
  const [selected, setSelected] = useState<ContractRow | null>(null);
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  // Search once typing pauses, not on every key.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(q.trim()), 300);
    return () => clearTimeout(timer);
  }, [q]);
  const params = `state=${state}${search ? `&q=${encodeURIComponent(search)}` : ""}`;
  const columns: Column<ContractRow>[] = [
    {
      header: "Contract",
      cell: (c) => (
        <div className="min-w-0">
          <div className="truncate">{c.title || TYPE_LABEL[c.type] || humanize(c.type)}</div>
          <div className="truncate text-xs text-subtle">
            {TYPE_LABEL[c.type] ?? humanize(c.type)} · {c.direction === "issued" ? `to ${c.assignee ?? "public"}` : `from ${c.issuer}`}
          </div>
          {c.matches && c.matches.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {c.matches.slice(0, 3).map((m, i) => (
                <Badge key={i} tone="accent">
                  {m.name} ×{num(m.quantity)}
                </Badge>
              ))}
              {c.matches.length > 3 && <Badge>+{c.matches.length - 3} more</Badge>}
            </div>
          )}
        </div>
      ),
    },
    { header: "Status", cell: (c) => <Badge>{humanize(c.status)}</Badge> },
    { header: "Price / reward", align: "right", cell: (c) => isk(c.type === "courier" ? c.reward : c.price) },
    { header: "Route / location", cell: (c) => (c.type === "courier" ? <span className="text-xs">{c.start?.name ?? "?"} → {c.end?.name ?? "?"}</span> : <PlaceLabel place={c.start} />), className: "max-w-sm text-muted" },
    { header: "Issued", cell: (c) => date(c.date_issued), className: "whitespace-nowrap text-xs text-muted" },
  ];
  return (
    <Card>
      <SegmentTabs value={state} onChange={setState} options={[{ value: "open", label: "Outstanding" }, { value: "closed", label: "Finished & expired" }]} />
      <div className="border-b border-border px-card py-3">
        <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search for an item or contract title" aria-label="Search contracts" className="max-w-sm" />
      </div>
      <PagedTable<ContractRow>
        key={params}
        url={`${base(header)}/contracts`}
        params={params}
        columns={columns}
        rowKey={(c) => c.contract_id}
        onRowClick={setSelected}
        empty={
          search
            ? { icon: <Search />, title: `No ${state === "open" ? "outstanding" : "past"} contracts with “${search}”`, description: "Searches item names and contract titles." }
            : { icon: <ScrollText />, title: state === "open" ? "No outstanding contracts" : "No past contracts" }
        }
      />
      {selected && <ContractDialog header={header} contract={selected} onClose={() => setSelected(null)} />}
    </Card>
  );
}

function ContractDialog({ header, contract, onClose }: { header: CharacterHeader; contract: ContractRow; onClose: () => void }) {
  const { data } = useQuery({
    queryKey: ["contract", header.id, contract.contract_id],
    queryFn: () => api.get<ContractRow & { items_loaded: boolean; items: { type: EveType; quantity: number; included: boolean; bpc: boolean; value: number }[] }>(`${base(header)}/contracts/${contract.contract_id}`),
  });
  const total = data?.items.reduce((s, i) => s + (i.included ? i.value : 0), 0) ?? 0;
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()} title={contract.title || TYPE_LABEL[contract.type] || "Contract"} description={`${TYPE_LABEL[contract.type] ?? contract.type} · ${humanize(contract.status)}`} className="max-w-xl">
      <div className="space-y-4 text-sm">
        <div className="grid grid-cols-2 gap-3">
          <Fact label="Issuer">{contract.issuer}</Fact>
          <Fact label={contract.type === "courier" ? "Reward" : "Price"}>{isk(contract.type === "courier" ? contract.reward : contract.price, { full: true })}</Fact>
          {contract.collateral ? <Fact label="Collateral">{isk(contract.collateral, { full: true })}</Fact> : null}
          {contract.volume ? <Fact label="Volume">{num(contract.volume)} m³</Fact> : null}
          <Fact label="Expires">{dateTime(contract.date_expired)}</Fact>
          {contract.acceptor && <Fact label="Accepted by">{contract.acceptor}</Fact>}
        </div>
        {contract.type !== "courier" && (
          <div>
            <div className="mb-2 flex justify-between text-xs text-muted">
              <span>Items</span>
              {total > 0 && <span className="font-mono">≈ {isk(total)}</span>}
            </div>
            {!data ? (
              <Skeleton className="h-24" />
            ) : !data.items_loaded ? (
              <div className="text-xs text-subtle">Items are still being fetched.</div>
            ) : (
              <ul className="divide-y divide-border rounded-lg border border-border">
                {data.items.map((i, n) => (
                  <li key={n} className="flex items-center gap-2.5 px-3 py-2">
                    <TypeIcon type={i.type} size={24} />
                    <span className="flex-1 truncate">{i.type.name}{i.bpc && <span className="ml-2 text-[11px] font-medium text-[color-mix(in_oklab,var(--chart-2)_65%,var(--text))]">BPC</span>}</span>
                    {!i.included && <Badge>Wanted</Badge>}
                    <span className="font-mono text-xs text-muted">×{num(i.quantity)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </Dialog>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-bg/40 px-3 py-2">
      <div className="text-[11px] uppercase tracking-wider text-subtle">{label}</div>
      <div className="mt-0.5 truncate">{children}</div>
    </div>
  );
}
