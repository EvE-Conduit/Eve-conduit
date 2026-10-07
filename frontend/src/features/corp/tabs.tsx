import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle, ArrowDownRight, ArrowUpRight, Building2, ChevronDown, ChevronRight, Clock, Coins, Crown, Factory, Fuel, Globe2,
  Landmark, MapPin, Package, Percent, Pickaxe, Radio, ScrollText, ShieldAlert, ShoppingCart, Swords, Users, Wallet,
} from "lucide-react";
import { useDeferredValue, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router";

import { AreaChart } from "@/components/AreaChart";
import { BarChart } from "@/components/BarChart";
import { DataTable, PagedTable, SegmentTabs, type Column } from "@/components/DataTable";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Meter, Progress, StatusDot } from "@/components/ui/feedback";
import { SearchInput, Select } from "@/components/ui/input";
import { DescriptionList, EmptyState, StatCard } from "@/components/ui/page";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip } from "@/components/ui/tooltip";
import { api } from "@/lib/api";
import { date, dateTime, duration, humanize, isk, num } from "@/lib/format";
import { cn, timeAgo } from "@/lib/utils";

import { PlaceLabel, Security, TypeIcon } from "../sheet/components";
import type { EveType, Place } from "../sheet/types";
import { corpBase, useCorpSection } from "./hooks";
import type { CorpHeader, CorpMember, CorpOverview, CorpStructure, CorpWallets, SystemRef } from "./types";

type TabProps = { header: CorpHeader };
const shortIsk = (n: number | null | undefined) => isk(n).replace(" ISK", "");

function Loading() {
  return <Skeleton className="h-80 rounded-xl" />;
}

function TypeCell({ type, sub }: { type: EveType; sub?: ReactNode }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <TypeIcon type={type} size={28} />
      <div className="min-w-0">
        <div className="truncate text-text">{type.name}</div>
        {sub && <div className="truncate text-xs text-muted">{sub}</div>}
      </div>
    </div>
  );
}

function SystemLabel({ system }: { system: SystemRef | null }) {
  if (!system) return <span className="text-subtle">Unknown</span>;
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      {system.security != null && <Security value={system.security} className="shrink-0" />}
      <span className="truncate">{system.name}</span>
      {system.region && <span className="hidden shrink-0 text-subtle xl:inline">· {system.region}</span>}
    </span>
  );
}

function PersonCell({ id, name, portrait, sub }: { id: number; name: string; portrait?: string; sub?: ReactNode }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <Avatar src={portrait ?? `https://images.evetech.net/characters/${id}/portrait?size=64`} name={name} size="xs" rounded="full" />
      <div className="min-w-0">
        <div className="truncate text-text">{name}</div>
        {sub && <div className="truncate text-xs text-muted">{sub}</div>}
      </div>
    </div>
  );
}

// --- Overview ----------------------------------------------------------------------------

export function OverviewTab({ header }: TabProps) {
  const { data } = useCorpSection<CorpOverview>(header.id, "overview");
  if (!data) return <Loading />;
  const known = data.known_members ?? data.member_count ?? 0;
  const coverage = known ? data.registered / known : 0;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Members" value={num(data.member_count)} icon={<Users />} hint={data.active_7d != null ? `${num(data.active_7d)} active this week` : "Member tracking needs a Director"} />
        <StatCard
          label="Registered"
          value={known ? `${Math.round(coverage * 100)}%` : num(data.registered)}
          mono
          icon={<Radio />}
          tone={known && coverage < 0.8 ? "warning" : "success"}
          hint={`${num(data.registered)} of ${num(known || null)} characters`}
        />
        <StatCard label="Structures" value={num(data.structures)} icon={<Building2 />} tone={data.low_fuel ? "danger" : undefined} hint={data.low_fuel ? `${data.low_fuel} low on fuel` : "fuel looks fine"} />
        <StatCard label="Corporation wallets" value={data.wallet_total != null ? shortIsk(data.wallet_total) : "—"} mono icon={<Wallet />} hint={data.wallet_total != null ? "all divisions" : "needs finance access"} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="About" icon={<Landmark />} />
          <CardBody className="space-y-5">
            {data.ceo && (
              <div className="flex items-center gap-3">
                <Avatar src={data.ceo.portrait} name={data.ceo.name} size="md" />
                <div>
                  <div className="text-xs font-medium uppercase tracking-wider text-subtle">CEO</div>
                  <div className="font-medium text-text">{data.ceo.name}</div>
                </div>
              </div>
            )}
            <DescriptionList
              items={[
                { label: "Founded", value: date(data.founded) },
                { label: "Tax rate", value: data.tax_rate != null ? `${(data.tax_rate * 100).toFixed(1)}%` : "—" },
                { label: "Home station", value: <PlaceLabel place={data.home_station} /> },
                { label: "War eligible", value: data.war_eligible == null ? "—" : data.war_eligible ? "Yes" : "No" },
                { label: "Shares", value: num(data.shares) },
                ...(data.url ? [{ label: "Website", value: <a href={data.url} target="_blank" rel="noreferrer" className="text-accent-ink hover:underline">{data.url}</a> }] : []),
              ]}
            />
            {data.description && <p className="whitespace-pre-line border-t border-border pt-4 text-sm leading-relaxed text-muted">{data.description}</p>}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Activity" icon={<Clock />} description="From member tracking" />
          <CardBody className="space-y-4">
            {data.active_7d == null ? (
              <p className="text-sm text-muted">Member tracking needs a registered Director with the member-tracking scope.</p>
            ) : (
              <>
                <Meter label="Logged in this week" valueText={`${num(data.active_7d)} / ${num(known)}`} value={known ? data.active_7d / known : 0} tone="accent" />
                <Meter label="Logged in this month" valueText={`${num(data.active_30d)} / ${num(known)}`} value={known ? (data.active_30d ?? 0) / known : 0} tone="info" />
                <Meter label="Registered on this site" valueText={`${num(data.registered)} / ${num(known)}`} value={coverage} tone="auto" />
              </>
            )}
          </CardBody>
          {(data.hangar_divisions.length > 0 || data.wallet_divisions.length > 0) && (
            <div className="border-t border-border px-card py-4">
              <div className="mb-2 text-xs font-medium uppercase tracking-wider text-subtle">Divisions</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                {data.hangar_divisions.map((d) => (
                  <div key={`h${d.division}`} className="flex items-center gap-2 truncate text-muted"><Package className="size-3.5 shrink-0" />{d.name || `Hangar ${d.division}`}</div>
                ))}
                {data.wallet_divisions.map((d) => (
                  <div key={`w${d.division}`} className="flex items-center gap-2 truncate text-muted"><Wallet className="size-3.5 shrink-0" />{d.name || `Wallet ${d.division}`}</div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// --- Members -----------------------------------------------------------------------------

export function MembersTab({ header }: TabProps) {
  const { data } = useCorpSection<{ items: CorpMember[]; count: number; registered: number; online: number }>(header.id, "members");
  const [filter, setFilter] = useState<"" | "online" | "unregistered" | "registered">("");
  const [q, setQ] = useState("");
  const query = useDeferredValue(q.trim().toLowerCase());
  const rows = useMemo(
    () =>
      (data?.items ?? []).filter(
        (m) =>
          (!filter || (filter === "online" ? m.online : filter === "registered" ? m.registered : !m.registered)) &&
          (!query || m.name.toLowerCase().includes(query) || m.owner?.name.toLowerCase().includes(query) || m.titles.some((t) => t.toLowerCase().includes(query))),
      ),
    [data, filter, query],
  );
  if (!data) return <Loading />;
  const columns: Column<CorpMember>[] = [
    {
      header: "Member",
      cell: (m) => (
        <div className="flex min-w-0 items-center gap-3">
          <span className="relative">
            <Avatar src={m.portrait} name={m.name} size="sm" rounded="full" />
            <StatusDot tone={m.online ? "success" : "neutral"} pulse={m.online} className="absolute -bottom-0.5 -right-0.5 ring-2 ring-surface rounded-none" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 truncate text-text">
              {m.name}
              {m.roles.includes("Director") && <Tooltip content="Director"><Crown className="size-3.5 shrink-0 text-warning-fg" /></Tooltip>}
            </div>
            <div className="truncate text-xs text-muted">{m.titles.length ? m.titles.join(", ") : m.start_date ? `Joined ${date(m.start_date)}` : "—"}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Account",
      cell: (m) =>
        m.owner ? (
          <Link to={`/characters/${m.id}`} className="inline-flex items-center gap-1.5 text-sm hover:text-accent-ink">
            <Badge tone="success" size="xs">Registered</Badge>
            <span className="truncate text-muted">{m.owner.main_id === m.id ? "Main" : `Alt of ${m.owner.name}`}</span>
          </Link>
        ) : (
          <Badge tone="warning" size="xs">Not registered</Badge>
        ),
    },
    {
      header: "Last login",
      cell: (m) =>
        m.online ? <span className="font-medium text-success-fg">Online now</span> : m.logon_date ? <Tooltip content={dateTime(m.logon_date)}><span className="text-muted">{timeAgo(m.logon_date)}</span></Tooltip> : <span className="text-subtle">—</span>,
    },
    { header: "Location", cell: (m) => (m.location ? <PlaceLabel place={m.location} /> : <span className="text-subtle">—</span>), className: "max-w-[16rem] text-muted" },
    { header: "Ship", cell: (m) => (m.ship ? <TypeCell type={m.ship} /> : <span className="text-subtle">—</span>), className: "max-w-[12rem]" },
  ];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Members" value={data.count} icon={<Users />} />
        <StatCard label="Online now" value={data.online} icon={<Radio />} tone="success" />
        <StatCard label="Not registered" value={data.count - data.registered} icon={<AlertTriangle />} tone={data.count - data.registered ? "warning" : "success"} hint={`${num(data.registered)} registered`} />
      </div>
      <Card>
        <SegmentTabs
          value={filter}
          onChange={setFilter}
          options={[
            { value: "", label: `All ${num(data.count)}` },
            { value: "online", label: `Online ${num(data.online)}` },
            { value: "registered", label: "Registered" },
            { value: "unregistered", label: "Not registered" },
          ]}
        />
        <div className="px-card py-3">
          <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a member, account or title" className="max-w-sm" />
        </div>
        <DataTable rows={rows.slice(0, 500)} columns={columns} rowKey={(m) => m.id} empty={{ icon: <Users />, title: "No members match" }} />
        {rows.length > 500 && <div className="border-t border-border px-card py-3 text-xs text-muted">Showing 500 of {num(rows.length)}. Narrow the search to see the rest.</div>}
      </Card>
    </div>
  );
}

// --- Structures --------------------------------------------------------------------------

const FUEL_SCALE_HOURS = 30 * 24;

function fuelTone(hours: number | null): "danger" | "warning" | "success" | "info" {
  if (hours == null) return "info";
  return hours < 72 ? "danger" : hours < 24 * 7 ? "warning" : "success";
}

const STATE_TONE: Record<string, "success" | "warning" | "danger" | "info" | "neutral"> = {
  shield_vulnerable: "success",
  armor_vulnerable: "warning",
  hull_vulnerable: "danger",
  armor_reinforce: "danger",
  hull_reinforce: "danger",
  anchoring: "info",
  onlining_vulnerable: "info",
  online_deprecated: "info",
  unanchored: "neutral",
  low_power: "warning",
  abandoned: "danger",
};

export function StructuresTab({ header }: TabProps) {
  const { data } = useCorpSection<CorpStructure[]>(header.id, "structures");
  if (!data) return <Loading />;
  if (!data.length) return <Card><EmptyState icon={<Building2 />} title="No structures" description="This corporation doesn't own any Upwell structures." /></Card>;
  const low = data.filter((s) => s.fuel_hours != null && s.fuel_hours < 72).length;
  const reinforced = data.filter((s) => s.state.endsWith("_reinforce")).length;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Structures" value={data.length} icon={<Building2 />} />
        <StatCard label="Low fuel" value={low} icon={<Fuel />} tone={low ? "danger" : "success"} hint="under 72 hours" />
        <StatCard label="Reinforced" value={reinforced} icon={<ShieldAlert />} tone={reinforced ? "danger" : "success"} />
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {data.map((s) => (
          <StructureCard key={s.id} s={s} />
        ))}
      </div>
    </div>
  );
}

function StructureCard({ s }: { s: CorpStructure }) {
  const tone = fuelTone(s.fuel_hours);
  const timer = s.state_timer_end && new Date(s.state_timer_end).getTime() > Date.now();
  return (
    <Card className={cn(tone === "danger" && "border-danger/40")}>
      <div className="flex items-start gap-4 p-card">
        <TypeIcon type={s.type} size={56} className="rounded-xl" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-semibold text-text">{s.name}</h3>
            <Badge tone={STATE_TONE[s.state] ?? "neutral"} size="xs">{humanize(s.state)}</Badge>
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-sm text-muted">
            <span>{s.type.name}</span>
            <SystemLabel system={s.system} />
          </div>
          <div className="mt-4">
            <div className="mb-1.5 flex items-baseline justify-between text-sm">
              <span className="inline-flex items-center gap-1.5 text-muted"><Fuel className="size-3.5" /> Fuel</span>
              <span className={cn("font-mono text-xs tabular-nums", { danger: "text-danger-fg", warning: "text-warning-fg", success: "text-text", info: "text-muted" }[tone])}>
                {s.fuel_expires ? `${duration(s.fuel_expires)} · ${dateTime(s.fuel_expires)}` : "No fuel / not using fuel"}
              </span>
            </div>
            <Progress value={s.fuel_hours != null ? s.fuel_hours / FUEL_SCALE_HOURS : 0} tone={tone === "info" ? "info" : tone} size="sm" label="Fuel remaining" />
          </div>
          {timer && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger-fg">
              <Clock className="size-4" /> Timer ends {dateTime(s.state_timer_end)} ({duration(s.state_timer_end)})
            </div>
          )}
          {s.services.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {s.services.map((sv) => (
                <Badge key={sv.name} tone={sv.state === "online" ? "success" : "neutral"} size="xs">{sv.name}</Badge>
              ))}
            </div>
          )}
          <div className="mt-3 text-xs text-subtle">
            {s.reinforce_hour != null && <>Reinforces at {String(s.reinforce_hour).padStart(2, "0")}:00 ET</>}
            {s.unanchors_at && <span className="ml-3 text-warning-fg">Unanchoring {dateTime(s.unanchors_at)}</span>}
          </div>
        </div>
      </div>
    </Card>
  );
}

// --- Wallets -----------------------------------------------------------------------------

export function WalletsTab({ header }: TabProps) {
  const { data } = useCorpSection<CorpWallets>(header.id, "wallets");
  const [division, setDivision] = useState<number | null>(null);
  const [view, setView] = useState<"journal" | "transactions">("journal");
  if (!data) return <Loading />;
  if (!data.synced) return <Card><EmptyState icon={<Wallet />} title="No wallet data yet" description="It appears after the first sync by an Accountant." /></Card>;
  const selected = data.divisions.find((d) => d.division === division);
  const series = selected?.series ?? data.series;
  const first = series[0]?.balance ?? 0;
  const change = (selected?.balance ?? data.balance) - first;
  const max = Math.max(1, ...data.divisions.map((d) => d.balance));
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total balance" value={shortIsk(data.balance)} mono icon={<Wallet />} hint={isk(data.balance, { full: true })} />
        <StatCard label="30-day change" value={<span className={change >= 0 ? "text-success-fg" : "text-danger-fg"}>{isk(change, { sign: true }).replace(" ISK", "")}</span>} mono hint={selected ? selected.name : "all divisions"} />
        <StatCard label="Income (30d)" value={shortIsk(data.income)} mono icon={<ArrowDownRight />} tone="success" />
        <StatCard label="Spending (30d)" value={shortIsk(data.spending)} mono icon={<ArrowUpRight />} tone="danger" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title={`Balance, last 30 days`} description={selected ? selected.name : "All divisions combined"} />
          <CardBody>
            <AreaChart data={series.map((p) => ({ date: p.date, value: p.balance }))} format={(n) => isk(n)} label="Balance" />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Divisions" description="Select one to chart it" />
          <ul className="divide-y divide-border">
            <li>
              <button onClick={() => setDivision(null)} className={cn("flex w-full items-center justify-between px-card py-3 text-left text-sm transition-colors hover:bg-hover", division == null && "bg-accent-soft")}>
                <span className="font-medium text-text">All divisions</span>
                <span className="font-mono tabular-nums">{isk(data.balance)}</span>
              </button>
            </li>
            {data.divisions.map((d) => (
              <li key={d.division}>
                <button onClick={() => setDivision(d.division)} className={cn("block w-full px-card py-3 text-left transition-colors hover:bg-hover", division === d.division && "bg-accent-soft")}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                    <span className="truncate text-text">{d.name}</span>
                    <span className="font-mono text-xs tabular-nums">{isk(d.balance)}</span>
                  </div>
                  <Progress value={d.balance / max} size="xs" tone="accent" />
                </button>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <Card>
        <SegmentTabs value={view} onChange={setView} options={[{ value: "journal", label: "Journal" }, { value: "transactions", label: "Market transactions" }]} />
        {view === "journal" ? (
          <PagedTable<{ id: string; division_name: string; date: string; ref_type: string; amount: number | null; balance: number | null; description: string; first_party: string | null; second_party: string | null }>
            url={`${corpBase(header.id)}/wallets/journal`}
            params={division ? `division=${division}` : ""}
            rowKey={(r) => r.id}
            empty={{ icon: <ScrollText />, title: "No journal entries" }}
            columns={[
              { header: "Date", cell: (r) => <span className="whitespace-nowrap text-muted">{dateTime(r.date)}</span> },
              { header: "Type", cell: (r) => <div><div className="text-text">{humanize(r.ref_type)}</div><div className="text-xs text-muted">{r.division_name}</div></div> },
              { header: "Description", cell: (r) => r.description || [r.first_party, r.second_party].filter(Boolean).join(" → "), className: "max-w-md text-muted" },
              { header: "Amount", align: "right", cell: (r) => <span className={r.amount != null && r.amount < 0 ? "text-danger-fg" : "text-success-fg"}>{isk(r.amount, { sign: true })}</span> },
              { header: "Balance", align: "right", cell: (r) => <span className="text-muted">{isk(r.balance)}</span> },
            ]}
          />
        ) : (
          <PagedTable<{ id: string; date: string; type: EveType; quantity: number; unit_price: number; total: number; is_buy: boolean; client: string | null; location: Place | null }>
            url={`${corpBase(header.id)}/wallets/transactions`}
            params={division ? `division=${division}` : ""}
            rowKey={(r) => r.id}
            empty={{ icon: <ShoppingCart />, title: "No market transactions" }}
            columns={[
              { header: "Date", cell: (r) => <span className="whitespace-nowrap text-muted">{dateTime(r.date)}</span> },
              { header: "Item", cell: (r) => <TypeCell type={r.type} sub={`${r.is_buy ? "Bought from" : "Sold to"} ${r.client ?? "unknown"}`} /> },
              { header: "Qty", align: "right", cell: (r) => num(r.quantity) },
              { header: "Price", align: "right", cell: (r) => isk(r.unit_price) },
              { header: "Total", align: "right", cell: (r) => <span className={r.total < 0 ? "text-danger-fg" : "text-success-fg"}>{isk(r.total, { sign: true })}</span> },
            ]}
          />
        )}
      </Card>
    </div>
  );
}

// --- Assets ------------------------------------------------------------------------------

interface AssetNode {
  item_id: number;
  type: EveType;
  name: string;
  quantity: number;
  flag: string;
  bpc: boolean;
  value: number;
  children: AssetNode[];
}

export function AssetsTab({ header }: TabProps) {
  const { data } = useCorpSection<{ total_value: number; item_count: number; locations: { location: Place; item_count: number; value: number }[] }>(header.id, "assets");
  const [open, setOpen] = useState<number | null>(null);
  const [q, setQ] = useState("");
  if (!data) return <Loading />;
  const locations = data.locations.filter((l) => !q || l.location.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Estimated value" value={shortIsk(data.total_value)} mono icon={<Coins />} />
        <StatCard label="Items" value={data.item_count} icon={<Package />} />
        <StatCard label="Locations" value={data.locations.length} icon={<MapPin />} />
      </div>
      <Card>
        <CardHeader title="By location" description="Most valuable first" actions={<SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter locations" className="w-56" />} />
        {!locations.length ? (
          <EmptyState icon={<Package />} title="No assets" />
        ) : (
          <ul className="divide-y divide-border">
            {locations.map((l) => (
              <li key={l.location.id}>
                <button onClick={() => setOpen(open === l.location.id ? null : l.location.id)} className="flex w-full items-center gap-3 px-card py-3 text-left text-sm transition-colors hover:bg-hover" aria-expanded={open === l.location.id}>
                  {open === l.location.id ? <ChevronDown className="size-4 text-subtle" /> : <ChevronRight className="size-4 text-subtle" />}
                  <PlaceLabel place={l.location} className="flex-1" />
                  <span className="text-xs text-muted">{num(l.item_count)} items</span>
                  <span className="w-28 text-right font-mono tabular-nums">{isk(l.value)}</span>
                </button>
                {open === l.location.id && <AssetTree corporationId={header.id} locationId={l.location.id} />}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function AssetTree({ corporationId, locationId }: { corporationId: number; locationId: number }) {
  const { data } = useQuery({ queryKey: ["corporation", corporationId, "assets", locationId], queryFn: () => api.get<AssetNode[]>(`${corpBase(corporationId)}/assets/${locationId}`) });
  if (!data) return <div className="px-card pb-3"><Skeleton className="h-24" /></div>;
  return <div className="border-t border-border bg-surface-2/60 py-1">{data.map((n) => <AssetRow key={n.item_id} node={n} depth={0} />)}</div>;
}

function AssetRow({ node, depth }: { node: AssetNode; depth: number }) {
  const [open, setOpen] = useState(false);
  const kids = node.children.length > 0;
  return (
    <>
      <div className="flex items-center gap-2.5 py-1.5 pr-card text-sm" style={{ paddingLeft: `calc(var(--pad-card) + ${depth * 20 + (kids ? 0 : 20)}px)` }}>
        {kids && (
          <button onClick={() => setOpen(!open)} className="rounded p-0.5 text-subtle hover:bg-hover hover:text-text" aria-label={open ? "Collapse" : "Expand"}>
            {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
          </button>
        )}
        <TypeIcon type={node.type} size={24} />
        <span className="min-w-0 flex-1 truncate">
          <span className="text-text">{node.name || node.type.name}</span>
          {node.name && <span className="ml-2 text-xs text-muted">{node.type.name}</span>}
          {node.bpc && <Badge size="xs" className="ml-2">Copy</Badge>}
        </span>
        <span className="hidden text-xs text-subtle sm:inline">{humanize(node.flag)}</span>
        <span className="w-20 text-right font-mono text-xs tabular-nums text-muted">×{num(node.quantity)}</span>
        <span className="w-24 text-right font-mono text-xs tabular-nums">{isk(node.value)}</span>
      </div>
      {open && node.children.map((c) => <AssetRow key={c.item_id} node={c} depth={depth + 1} />)}
    </>
  );
}

// --- Industry ----------------------------------------------------------------------------

interface CorpJob {
  job_id: number;
  activity: string;
  status: string;
  installer: { id: number; name: string; portrait: string };
  blueprint: EveType;
  product: EveType | null;
  runs: number;
  cost: number | null;
  end_date: string;
  progress: number;
  location: Place | null;
}

export function IndustryTab({ header }: TabProps) {
  const [status, setStatus] = useState<"open" | "done">("open");
  const { data: summary } = useCorpSection<{ active: number; ready: number; installers: number; by_activity: { activity: string; count: number }[] }>(header.id, "industry/summary");
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Running" value={summary?.active ?? "—"} icon={<Factory />} />
        <StatCard label="Ready to deliver" value={summary?.ready ?? "—"} icon={<Package />} tone={summary?.ready ? "success" : undefined} />
        <StatCard label="Industrialists" value={summary?.installers ?? "—"} icon={<Users />} hint={summary?.by_activity.map((a) => `${a.count} ${a.activity.toLowerCase()}`).join(", ")} />
      </div>
      <Card>
        <SegmentTabs value={status} onChange={setStatus} options={[{ value: "open", label: "Open jobs" }, { value: "done", label: "History" }]} />
        <PagedTable<CorpJob>
          url={`${corpBase(header.id)}/industry`}
          params={`status=${status}`}
          rowKey={(j) => j.job_id}
          empty={{ icon: <Factory />, title: status === "open" ? "No open jobs" : "No finished jobs" }}
          columns={[
            { header: "Job", cell: (j) => <TypeCell type={j.product ?? j.blueprint} sub={`${j.activity} · ${num(j.runs)} runs`} /> },
            { header: "Installer", cell: (j) => <PersonCell id={j.installer.id} name={j.installer.name} portrait={j.installer.portrait} /> },
            {
              header: "Progress",
              cell: (j) => (
                <div className="w-40">
                  <div className="mb-1 flex justify-between text-xs">
                    <span className={j.status === "ready" ? "text-success-fg" : "text-muted"}>{humanize(j.status)}</span>
                    <span className="text-subtle">{j.status === "active" ? duration(j.end_date) : date(j.end_date)}</span>
                  </div>
                  <Progress value={j.progress} size="xs" tone={j.status === "ready" || j.status === "delivered" ? "success" : "accent"} />
                </div>
              ),
            },
            { header: "Location", cell: (j) => <PlaceLabel place={j.location} />, className: "max-w-[16rem] text-muted" },
            { header: "Cost", align: "right", cell: (j) => isk(j.cost) },
          ]}
        />
      </Card>
    </div>
  );
}

// --- Contracts ---------------------------------------------------------------------------

interface CorpContractRow {
  id: number;
  type: string;
  status: string;
  title: string;
  issuer: string | null;
  assignee: string | null;
  acceptor: string | null;
  price: number | null;
  reward: number | null;
  collateral: number | null;
  date_issued: string;
  date_expired: string | null;
  start: Place | null;
  end: Place | null;
}

const CONTRACT_TONE: Record<string, "success" | "warning" | "danger" | "info" | "neutral"> = {
  outstanding: "info", in_progress: "warning", finished: "success", finished_issuer: "success", finished_contractor: "success",
  rejected: "danger", failed: "danger", deleted: "neutral", reversed: "neutral", expired: "neutral",
};

export function ContractsTab({ header }: TabProps) {
  const [status, setStatus] = useState<"open" | "">("open");
  return (
    <Card>
      <SegmentTabs value={status} onChange={setStatus} options={[{ value: "open", label: "Open" }, { value: "", label: "All" }]} />
      <PagedTable<CorpContractRow>
        url={`${corpBase(header.id)}/contracts`}
        params={`status=${status}`}
        rowKey={(c) => c.id}
        empty={{ icon: <ScrollText />, title: "No contracts" }}
        columns={[
          { header: "Contract", cell: (c) => <div className="min-w-0"><div className="truncate text-text">{c.title || humanize(c.type)}</div><div className="truncate text-xs text-muted">{humanize(c.type)} · issued {date(c.date_issued)}</div></div>, className: "max-w-xs" },
          { header: "Status", cell: (c) => <Badge tone={CONTRACT_TONE[c.status] ?? "neutral"} size="xs">{humanize(c.status)}</Badge> },
          { header: "Issuer → assignee", cell: (c) => <span className="text-muted">{c.issuer ?? "?"} → {c.acceptor ?? c.assignee ?? "public"}</span>, className: "max-w-xs" },
          { header: "Route", cell: (c) => (c.type === "courier" ? <span className="text-muted">{c.start?.name} → {c.end?.name}</span> : <PlaceLabel place={c.start} />), className: "max-w-xs text-muted" },
          { header: "Value", align: "right", cell: (c) => isk(c.type === "courier" ? c.reward : c.price) },
        ]}
      />
    </Card>
  );
}

// --- Market ------------------------------------------------------------------------------

interface CorpOrder {
  id: number;
  type: EveType;
  is_buy: boolean;
  price: number;
  volume_total: number;
  volume_remain: number;
  total: number;
  issued_by: string | null;
  division: string | null;
  expires: string;
  location: Place | null;
}

export function MarketTab({ header }: TabProps) {
  const [state, setState] = useState<"active" | "closed">("active");
  const [side, setSide] = useState("");
  const { data: summary } = useCorpSection<{ sell_orders: number; buy_orders: number; sell_value: number; buy_value: number; escrow: number }>(header.id, "market/summary");
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Sell orders" value={summary?.sell_orders ?? "—"} icon={<ArrowUpRight />} />
        <StatCard label="Listed for sale" value={shortIsk(summary?.sell_value)} mono />
        <StatCard label="Buy orders" value={summary?.buy_orders ?? "—"} icon={<ArrowDownRight />} />
        <StatCard label="In escrow" value={shortIsk(summary?.escrow)} mono />
      </div>
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pr-card">
          <SegmentTabs value={state} onChange={setState} options={[{ value: "active", label: "Active" }, { value: "closed", label: "Closed" }]} />
          <Select value={side} onChange={(e) => setSide(e.target.value)} className="w-36" options={[{ value: "", label: "Buy and sell" }, { value: "sell", label: "Sell" }, { value: "buy", label: "Buy" }]} aria-label="Order side" />
        </div>
        <PagedTable<CorpOrder>
          url={`${corpBase(header.id)}/market`}
          params={`state=${state}&side=${side}`}
          rowKey={(o) => o.id}
          empty={{ icon: <ShoppingCart />, title: "No orders" }}
          columns={[
            { header: "Item", cell: (o) => <TypeCell type={o.type} sub={<>{o.is_buy ? "Buy" : "Sell"}{o.issued_by && ` · ${o.issued_by}`}{o.division && ` · ${o.division}`}</>} /> },
            { header: "Remaining", cell: (o) => <div className="w-32"><div className="mb-1 text-xs text-muted">{num(o.volume_remain)} / {num(o.volume_total)}</div><Progress value={o.volume_remain / o.volume_total} size="xs" tone={o.is_buy ? "info" : "accent"} /></div> },
            { header: "Location", cell: (o) => <PlaceLabel place={o.location} />, className: "max-w-[16rem] text-muted" },
            { header: "Expires", cell: (o) => <span className="text-muted">{duration(o.expires)}</span> },
            { header: "Price", align: "right", cell: (o) => isk(o.price) },
            { header: "Total", align: "right", cell: (o) => isk(o.total) },
          ]}
        />
      </Card>
    </div>
  );
}

// --- Mining ------------------------------------------------------------------------------

interface CorpMining {
  total_value: number;
  total_quantity: number;
  series: { date: string; value: number }[];
  miners: { id: number; name: string; portrait: string; registered: boolean; quantity: number; value: number }[];
  ores: { type: EveType; quantity: number; value: number }[];
  extractions: { structure: string; moon: string; start: string; arrival: string; decay: string }[];
}

export function MiningTab({ header }: TabProps) {
  const { data } = useCorpSection<CorpMining>(header.id, "mining");
  if (!data) return <Loading />;
  const maxOre = Math.max(1, ...data.ores.map((o) => o.value));
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Mined (30d)" value={shortIsk(data.total_value)} mono icon={<Pickaxe />} hint={`${num(data.total_quantity)} units`} />
        <StatCard label="Miners" value={data.miners.length} icon={<Users />} hint={`${data.miners.filter((m) => !m.registered).length} not registered`} />
        <StatCard label="Moon extractions" value={data.extractions.length} icon={<Globe2 />} />
      </div>
      <Card>
        <CardHeader title="Moon mining per day" description="Estimated value at average prices" />
        <CardBody>
          <BarChart data={data.series} format={(n) => isk(n)} label="Value mined" />
        </CardBody>
      </Card>
      {data.extractions.length > 0 && (
        <Card>
          <CardHeader title="Extractions" icon={<Globe2 />} />
          <DataTable
            rows={data.extractions}
            rowKey={(e) => `${e.structure}${e.start}`}
            columns={[
              { header: "Moon", cell: (e) => <div><div className="text-text">{e.moon}</div><div className="text-xs text-muted">{e.structure}</div></div> },
              {
                header: "Chunk arrives",
                cell: (e) => {
                  const total = new Date(e.arrival).getTime() - new Date(e.start).getTime();
                  const done = Math.min(1, (Date.now() - new Date(e.start).getTime()) / total);
                  return (
                    <div className="w-48">
                      <div className="mb-1 flex justify-between text-xs"><span className="text-muted">{dateTime(e.arrival)}</span><span className={done >= 1 ? "text-success-fg" : "text-subtle"}>{done >= 1 ? "Ready" : duration(e.arrival)}</span></div>
                      <Progress value={done} size="xs" tone={done >= 1 ? "success" : "accent"} />
                    </div>
                  );
                },
              },
              { header: "Auto-fracture", cell: (e) => <span className="text-muted">{dateTime(e.decay)}</span> },
            ]}
          />
        </Card>
      )}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Top miners" />
          <DataTable
            rows={data.miners.slice(0, 25)}
            rowKey={(m) => m.id}
            empty={{ icon: <Pickaxe />, title: "Nothing mined in the last 30 days" }}
            columns={[
              { header: "Miner", cell: (m) => <PersonCell id={m.id} name={m.name} portrait={m.portrait} sub={m.registered ? undefined : "Not registered"} /> },
              { header: "Units", align: "right", cell: (m) => num(m.quantity) },
              { header: "Value", align: "right", cell: (m) => isk(m.value) },
            ]}
          />
        </Card>
        <Card>
          <CardHeader title="By ore" />
          <CardBody className="space-y-4">
            {data.ores.length ? data.ores.slice(0, 12).map((o) => (
              <div key={o.type.id} className="flex items-center gap-3">
                <TypeIcon type={o.type} size={28} />
                <div className="min-w-0 flex-1"><Meter label={o.type.name} valueText={isk(o.value)} value={o.value / maxOre} tone="accent" /></div>
              </div>
            )) : <p className="text-sm text-muted">No ore yet.</p>}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

// --- Starbases ---------------------------------------------------------------------------

export function StarbasesTab({ header }: TabProps) {
  const { data } = useCorpSection<{ id: number; type: EveType; system: SystemRef | null; moon: string | null; state: string; onlined_since: string | null; reinforced_until: string | null; unanchor_at: string | null }[]>(header.id, "starbases");
  if (!data) return <Loading />;
  return (
    <Card>
      <CardHeader title="Control towers" description="Starbases (POS) the corporation has anchored" />
      <DataTable
        rows={data}
        rowKey={(s) => s.id}
        empty={{ icon: <Radio />, title: "No starbases" }}
        columns={[
          { header: "Tower", cell: (s) => <TypeCell type={s.type} sub={s.moon ?? undefined} /> },
          { header: "System", cell: (s) => <SystemLabel system={s.system} /> },
          { header: "State", cell: (s) => <Badge tone={s.state === "online" ? "success" : s.state === "reinforced" ? "danger" : "neutral"} size="xs">{humanize(s.state)}</Badge> },
          { header: "Online since", cell: (s) => <span className="text-muted">{date(s.onlined_since)}</span> },
          { header: "Reinforced until", cell: (s) => (s.reinforced_until ? <span className="text-danger-fg">{dateTime(s.reinforced_until)}</span> : <span className="text-subtle">—</span>) },
        ]}
      />
    </Card>
  );
}

// --- Killmails ---------------------------------------------------------------------------

interface KillRow {
  id: number;
  time: string;
  is_loss: boolean;
  ship: EveType;
  victim: string;
  victim_corporation: string | null;
  final_blow: string | null;
  attackers: number;
  value: number;
  system: SystemRef | null;
  zkillboard: string;
}

export function KillmailsTab({ header }: TabProps) {
  const [kind, setKind] = useState<"" | "kills" | "losses">("");
  const { data: s } = useCorpSection<{ kills: number; losses: number; isk_destroyed: number; isk_lost: number }>(header.id, "killmails/summary");
  const efficiency = s && s.isk_destroyed + s.isk_lost > 0 ? s.isk_destroyed / (s.isk_destroyed + s.isk_lost) : null;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Kills" value={s?.kills ?? "—"} icon={<Swords />} tone="success" />
        <StatCard label="Losses" value={s?.losses ?? "—"} icon={<ShieldAlert />} tone="danger" />
        <StatCard label="ISK destroyed" value={shortIsk(s?.isk_destroyed)} mono />
        <StatCard label="Efficiency" value={efficiency != null ? `${Math.round(efficiency * 100)}%` : "—"} mono icon={<Percent />} hint={`${shortIsk(s?.isk_lost)} ISK lost`} />
      </div>
      <Card>
        <SegmentTabs value={kind} onChange={setKind} options={[{ value: "", label: "All" }, { value: "kills", label: "Kills" }, { value: "losses", label: "Losses" }]} />
        <PagedTable<KillRow>
          url={`${corpBase(header.id)}/killmails`}
          params={`kind=${kind}`}
          rowKey={(k) => k.id}
          onRowClick={(k) => window.open(k.zkillboard, "_blank", "noopener")}
          empty={{ icon: <Swords />, title: "No killmails" }}
          columns={[
            { header: "Ship", cell: (k) => <TypeCell type={k.ship} sub={<span className={k.is_loss ? "text-danger-fg" : "text-success-fg"}>{k.is_loss ? "Loss" : "Kill"}</span>} /> },
            { header: "Victim", cell: (k) => <div className="min-w-0"><div className="truncate text-text">{k.victim}</div><div className="truncate text-xs text-muted">{k.victim_corporation}</div></div>, className: "max-w-xs" },
            { header: "Final blow", cell: (k) => <span className="text-muted">{k.final_blow ?? "—"} {k.attackers > 1 && <span className="text-subtle">+{k.attackers - 1}</span>}</span> },
            { header: "System", cell: (k) => <SystemLabel system={k.system} /> },
            { header: "When", cell: (k) => <span className="whitespace-nowrap text-muted">{dateTime(k.time)}</span> },
            { header: "Value", align: "right", cell: (k) => isk(k.value) },
          ]}
        />
      </Card>
    </div>
  );
}
