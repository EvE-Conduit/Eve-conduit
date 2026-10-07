import {
  AlertTriangle, ArrowLeft, Building2, Clock, Factory, KeyRound, LayoutGrid, Lock, Package, Pickaxe, Radio, RefreshCw,
  ScrollText, ShieldAlert, ShoppingCart, Swords, Users, Wallet, type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { Link, useParams, useSearchParams } from "react-router";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/page";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip } from "@/components/ui/tooltip";
import { ApiError } from "@/lib/api";
import { num } from "@/lib/format";
import { cn, timeAgo } from "@/lib/utils";

import { useCorpHeader, useRefreshCorporation } from "@/features/corp/hooks";
import {
  AssetsTab, ContractsTab, IndustryTab, KillmailsTab, MarketTab, MembersTab, MiningTab, OverviewTab, StarbasesTab, StructuresTab, WalletsTab,
} from "@/features/corp/tabs";
import type { CorpHeader, CorpSectionStatus } from "@/features/corp/types";

const TABS: Record<string, { icon: LucideIcon; View: (p: { header: CorpHeader }) => ReactNode }> = {
  overview: { icon: LayoutGrid, View: OverviewTab },
  members: { icon: Users, View: MembersTab },
  structures: { icon: Building2, View: StructuresTab },
  wallets: { icon: Wallet, View: WalletsTab },
  assets: { icon: Package, View: AssetsTab },
  industry: { icon: Factory, View: IndustryTab },
  contracts: { icon: ScrollText, View: ContractsTab },
  market: { icon: ShoppingCart, View: MarketTab },
  mining: { icon: Pickaxe, View: MiningTab },
  starbases: { icon: Radio, View: StarbasesTab },
  killmails: { icon: Swords, View: KillmailsTab },
};

const GROUPS: { title: string; keys: string[] }[] = [
  { title: "Corporation", keys: ["overview", "members", "killmails"] },
  { title: "Holdings", keys: ["structures", "starbases", "assets"] },
  { title: "Finance", keys: ["wallets", "market", "contracts"] },
  { title: "Industry", keys: ["industry", "mining"] },
];

export function CorporationSheet() {
  const { id } = useParams();
  const corporationId = Number(id);
  const [params, setParams] = useSearchParams();
  const { data: header, isLoading, error } = useCorpHeader(corporationId);
  const refresh = useRefreshCorporation(corporationId);

  if (isLoading) return <Skeleton className="h-56 rounded-2xl" />;
  if (error || !header) {
    const forbidden = error instanceof ApiError && error.status === 403;
    return (
      <EmptyState
        icon={<ShieldAlert />}
        title={forbidden ? "You can't view this corporation" : "Corporation not found"}
        description={forbidden ? "Ask an administrator for a corporation permission." : undefined}
        action={<Link to="/corporations"><Button>Back to corporations</Button></Link>}
      />
    );
  }

  const sections = header.sections.filter((s) => s.key in TABS);
  const requested = params.get("tab") ?? "overview";
  const current = sections.find((s) => s.key === requested && s.allowed) ?? sections[0]!;
  const problems = sections.filter((s) => s.result === "error" || s.result === "no_character");

  return (
    <div className="space-y-6">
      <Link to="/corporations" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-text">
        <ArrowLeft className="size-4" /> Corporations
      </Link>

      <section className="panel relative overflow-hidden rounded-2xl animate-fade-up">
        <img src={header.logo_large} alt="" className="pointer-events-none absolute -right-10 top-1/2 hidden size-72 -translate-y-1/2 opacity-[0.06] md:block" />
        <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:p-8">
          <img src={header.logo_large} alt="" className="size-24 rounded-2xl ring-1 ring-border" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-3xl font-semibold tracking-tight text-text">{header.name}</h1>
              <span className="font-mono text-sm text-muted">[{header.ticker}]</span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {header.alliance && (
                <Badge>
                  <img src={header.alliance.logo} alt="" className="size-3.5 rounded-sm" /> {header.alliance.name}
                </Badge>
              )}
              <Badge>
                <Users className="size-3" /> {num(header.member_count)} members
              </Badge>
              <Badge tone="accent">{num(header.registered_characters)} registered</Badge>
              {problems.length > 0 && (
                <Tooltip content={problems.map((p) => `${p.label}: ${p.message}`).join("\n")}>
                  <Badge tone="warning">
                    <AlertTriangle className="size-3" /> {problems.length} section{problems.length === 1 ? "" : "s"} not syncing
                  </Badge>
                </Tooltip>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted">
            <span>Updated {timeAgo(current.last_success)}</span>
            {header.can_refresh && (
              <Button size="sm" variant="ghost" onClick={() => refresh.mutate()} loading={refresh.isPending} aria-label="Refresh now">
                {!refresh.isPending && <RefreshCw />} Refresh
              </Button>
            )}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[210px_minmax(0,1fr)]">
        <SheetNav sections={sections} value={current.key} onChange={(v) => setParams(v === "overview" ? {} : { tab: v }, { replace: true })} />
        <div className="min-w-0 animate-fade-up" key={current.key}>
          <SectionGate status={current}>{(() => { const View = TABS[current.key]!.View; return <View header={header} />; })()}</SectionGate>
        </div>
      </div>
    </div>
  );
}

function SectionGate({ status, children }: { status: CorpSectionStatus; children: ReactNode }) {
  if (!status.allowed) {
    return <Card><EmptyState icon={<Lock />} title={`${status.label} is restricted`} description="Seeing corporation finances needs the corporation wallets permission." /></Card>;
  }
  if (status.last_success) {
    return (
      <>
        {status.result !== "ok" && status.message && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-warning/35 bg-warning-soft px-4 py-3 text-sm">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning-fg" />
            <span className="text-muted"><span className="font-medium text-text">Showing older data.</span> {status.message}</span>
          </div>
        )}
        {children}
      </>
    );
  }
  if (status.result === "no_character") {
    return (
      <Card>
        <EmptyState
          icon={<KeyRound />}
          title={`Nobody can sync ${status.label.toLowerCase()} yet`}
          description={`${status.requirement} needs to register on this site, granting ${status.scopes.length ? status.scopes.join(", ") : "their login"}.`}
          action={<a href="/sso/add-character?next=/characters"><Button variant="primary"><KeyRound /> Add a character</Button></a>}
        />
      </Card>
    );
  }
  return (
    <Card>
      <EmptyState
        icon={status.result === "error" ? <AlertTriangle /> : <Clock />}
        title={status.result === "error" ? "The last update failed" : "Fetching data from EVE…"}
        description={status.result === "error" ? status.message : `${status.description}. This usually takes a few minutes.`}
      />
    </Card>
  );
}

function SheetNav({ sections, value, onChange }: { sections: CorpSectionStatus[]; value: string; onChange: (key: string) => void }) {
  const groups = GROUPS.map((g) => ({ title: g.title, items: g.keys.flatMap((k) => sections.filter((s) => s.key === k)) })).filter((g) => g.items.length);
  const dot = (s: CorpSectionStatus) =>
    s.result === "ok" ? null : (
      <span
        className={cn("ml-auto size-1.5 shrink-0 rounded-none", s.result === "pending" ? "bg-info" : "bg-warning")}
        title={s.result === "pending" ? "Waiting for first sync" : s.message}
      />
    );
  return (
    <>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-10 w-full rounded-lg border border-border-strong bg-surface px-3 text-sm text-text lg:hidden" aria-label="Section">
        {groups.map((g) => (
          <optgroup key={g.title} label={g.title}>
            {g.items.map((s) => (
              <option key={s.key} value={s.key} disabled={!s.allowed}>{s.label}</option>
            ))}
          </optgroup>
        ))}
      </select>
      <nav className="sticky top-20 hidden h-fit space-y-5 lg:block" aria-label="Corporation sheet sections">
        {groups.map((g) => (
          <div key={g.title}>
            <div className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-subtle">{g.title}</div>
            {g.items.map((s) => {
              const Icon = TABS[s.key]!.icon;
              const active = value === s.key;
              return (
                <button
                  key={s.key}
                  onClick={() => s.allowed && onChange(s.key)}
                  disabled={!s.allowed}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-3 py-1.5 text-left text-sm transition-colors",
                    active ? "bg-accent-soft text-text" : "text-muted hover:bg-hover hover:text-text",
                    !s.allowed && "cursor-not-allowed opacity-50",
                    !s.last_success && !active && "opacity-70",
                  )}
                >
                  <Icon className={cn("size-4 shrink-0", active ? "text-accent-ink" : "text-subtle")} />
                  <span className="truncate">{s.label}</span>
                  {!s.allowed ? <Lock className="ml-auto size-3 text-subtle" /> : dot(s)}
                </button>
              );
            })}
          </div>
        ))}
      </nav>
    </>
  );
}

