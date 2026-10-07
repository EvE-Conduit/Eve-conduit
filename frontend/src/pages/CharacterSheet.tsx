import {
  ArrowLeft, Bell, Brain, CalendarDays, Coins, Crown, Factory, FileStack, FlaskConical, Globe2, Inbox, LayoutGrid, Package, Pickaxe,
  Puzzle, Radar, ScrollText, Shield, ShieldAlert, ShoppingCart, Star, Swords, Users, Wallet, type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { Link, useParams, useSearchParams } from "react-router";

import { PluginBoundary } from "@/components/PluginBoundary";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/page";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api";
import { useLoadedPlugins } from "@/lib/pluginContext";
import type { Entity } from "@/lib/types";

import { AssetsView } from "@/features/assets/AssetsView";
import { OverviewTab } from "@/features/overview/OverviewTab";
import { SectionGate, SyncedAt } from "@/features/sheet/components";
import { useCharacterHeader, useRefreshCharacter } from "@/features/sheet/hooks";
import type { CharacterHeader } from "@/features/sheet/types";
import { BlueprintsTab, ContractsTab, IndustryTab, MarketTab, MiningTab, PlanetsTab, ResearchTab } from "@/features/industry/tabs";
import { SkillsTab } from "@/features/skills/SkillsTab";
import { CalendarTab, ContactsTab, FittingsTab, IntelTab, KillmailsTab, LoyaltyTab, MailTab, NotificationsTab, StandingsTab } from "@/features/social/tabs";
import { cn } from "@/lib/utils";
import { WalletView } from "@/features/wallet/WalletView";

/** Built-in character sheet sections; keys match the backend registry. */
const BUILTIN: Record<string, (props: { header: CharacterHeader }) => ReactNode> = {
  overview: OverviewTab,
  skills: SkillsTab,
  wallet: ({ header }) => <WalletView base={`/api/characters/${header.id}`} />,
  assets: ({ header }) => <AssetsView base={`/api/characters/${header.id}`} />,
  blueprints: BlueprintsTab,
  industry: IndustryTab,
  research: ResearchTab,
  mining: MiningTab,
  planets: PlanetsTab,
  market: MarketTab,
  contracts: ContractsTab,
  mail: MailTab,
  notifications: NotificationsTab,
  calendar: CalendarTab,
  contacts: ContactsTab,
  standings: StandingsTab,
  loyalty: LoyaltyTab,
  fittings: FittingsTab,
  killmails: KillmailsTab,
  intel: IntelTab,
};

/** Side-menu groups for the sheet. Sections not listed here land in "Other". */
const GROUPS: { title: string; items: [string, LucideIcon][] }[] = [
  { title: "Character", items: [["overview", LayoutGrid], ["skills", Brain], ["standings", Star], ["contacts", Users], ["intel", Radar]] },
  { title: "Finance", items: [["wallet", Wallet], ["assets", Package], ["market", ShoppingCart], ["contracts", ScrollText], ["loyalty", Coins]] },
  { title: "Industry", items: [["blueprints", FileStack], ["industry", Factory], ["research", FlaskConical], ["mining", Pickaxe], ["planets", Globe2]] },
  { title: "Communication", items: [["mail", Inbox], ["notifications", Bell], ["calendar", CalendarDays]] },
  { title: "Combat", items: [["fittings", Shield], ["killmails", Swords]] },
];

export function CharacterSheet() {
  const { id } = useParams();
  const characterId = Number(id);
  const [params, setParams] = useSearchParams();
  const { data: header, isLoading, error } = useCharacterHeader(characterId);
  const refresh = useRefreshCharacter(characterId);
  const plugins = useLoadedPlugins();
  const moduleTabs = plugins
    .flatMap((m) => (m.frontend.characterTabs ?? []).map((t) => ({ ...t, key: `${m.info.id}:${t.id}`, moduleName: m.info.name })))
    .sort((a, b) => (a.order ?? 100) - (b.order ?? 100));

  if (isLoading) return <Skeleton className="h-56 rounded-2xl" />;
  if (error || !header) {
    const forbidden = error instanceof ApiError && error.status === 403;
    return (
      <EmptyState
        icon={<ShieldAlert />}
        title={forbidden ? "You can't view this character" : "Character not found"}
        description={forbidden ? "Ask an administrator for the right permission." : "It may have been removed."}
        action={<Link to="/characters"><Button>Back to characters</Button></Link>}
      />
    );
  }

  const sections = header.sections.filter((s) => s.key in BUILTIN);
  const requested = params.get("tab") ?? "overview";
  const tab = sections.some((s) => s.key === requested) || moduleTabs.some((t) => t.key === requested) ? requested : "overview";
  const current = sections.find((s) => s.key === tab);
  const currentModule = moduleTabs.find((t) => t.key === tab);

  return (
    <div className="space-y-6">
      <Link to={header.is_mine ? "/characters" : "/admin/members"} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-text">
        <ArrowLeft className="size-4" /> {header.is_mine ? "Characters" : "Members"}
      </Link>

      <section className="panel border-border-strong animate-fade-up">
        <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-end sm:p-8">
          <Avatar src={header.portrait} name={header.name} size="xl" className="size-28 ring-0" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="hud-title truncate text-3xl tracking-[0.04em]">{header.name}</h1>
              {header.is_main && (
                <Badge color="var(--site-accent)">
                  <Crown className="size-3" /> Main
                </Badge>
              )}
              {!header.token_valid && <Badge tone="warning">Login expired</Badge>}
            </div>
            {!header.is_mine && <div className="mt-1 text-sm text-muted">Belongs to {header.owner.name}</div>}
            <div className="mt-4 flex flex-wrap gap-3">
              {header.corporation && <EntityChip entity={header.corporation} label="Corporation" />}
              {header.alliance && <EntityChip entity={header.alliance} label="Alliance" />}
            </div>
          </div>
          <SyncedAt status={header.sections.find((s) => s.key === tab) ?? header.sections[0]} onRefresh={header.is_mine ? () => refresh.mutate() : undefined} refreshing={refresh.isPending} />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[200px_minmax(0,1fr)]">
        <SheetNav
          groups={[
            ...GROUPS.map((g) => ({
              title: g.title,
              items: g.items.flatMap(([key, icon]) => {
                const st = sections.find((x) => x.key === key);
                return st ? [{ key, label: st.label, icon, dim: !st.available }] : [];
              }),
            })),
            {
              title: "Other",
              items: sections.filter((x) => !GROUPS.some((g) => g.items.some(([k]) => k === x.key))).map((x) => ({ key: x.key, label: x.label, icon: LayoutGrid, dim: !x.available })),
            },
            { title: "Plugins", items: moduleTabs.map((t) => ({ key: t.key, label: t.label, icon: Puzzle, dim: false })) },
          ].filter((g) => g.items.length)}
          value={tab}
          onChange={(v) => setParams(v === "overview" ? {} : { tab: v }, { replace: true })}
        />
        <div className="min-w-0 animate-fade-up" key={tab}>
          {current ? (
            <SectionGate status={current} isMine={header.is_mine} tokenValid={header.token_valid}>
              {(() => {
                const View = BUILTIN[current.key]!;
                return <View header={header} />;
              })()}
            </SectionGate>
          ) : currentModule ? (
            <PluginBoundary name={currentModule.moduleName}>
              <currentModule.Component characterId={header.id} />
            </PluginBoundary>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function EntityChip({ entity, label }: { entity: Entity; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-2/80 py-2 pl-2 pr-4 shadow-e1 backdrop-blur">
      <img src={entity.logo} alt="" className="size-9 rounded-lg" />
      <div className="leading-tight">
        <div className="text-[11px] uppercase tracking-wider text-subtle">{label}</div>
        <div className="text-sm font-medium">
          {entity.name} {entity.ticker && <span className="font-mono text-xs text-muted">[{entity.ticker}]</span>}
        </div>
      </div>
    </div>
  );
}

interface NavGroup {
  title: string;
  items: { key: string; label: string; icon: LucideIcon; dim: boolean }[];
}

function SheetNav({ groups, value, onChange }: { groups: NavGroup[]; value: string; onChange: (key: string) => void }) {
  return (
    <>
      {/* Phones: one dropdown */}
      <Select value={value} onChange={(e) => onChange(e.target.value)} className="lg:hidden" aria-label="Section">
        {groups.map((g) => (
          <optgroup key={g.title} label={g.title}>
            {g.items.map((i) => (
              <option key={i.key} value={i.key}>
                {i.label}
              </option>
            ))}
          </optgroup>
        ))}
      </Select>
      <nav className="panel sticky top-20 hidden h-fit space-y-4 rounded-xl p-2 lg:block" aria-label="Character sheet sections">
        {groups.map((g) => (
          <div key={g.title}>
            <div className="mb-1 px-3 pt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-subtle">{g.title}</div>
            {g.items.map((i) => (
              <button
                key={i.key}
                onClick={() => onChange(i.key)}
                aria-current={value === i.key ? "page" : undefined}
                className={cn(
                  "relative flex w-full items-center gap-2.5 rounded-lg px-3 py-1.5 text-left text-sm font-medium transition-colors",
                  value === i.key ? "bg-accent-soft text-text" : "text-muted hover:bg-hover hover:text-text",
                  i.dim && value !== i.key && "opacity-50",
                )}
              >
                <i.icon className={cn("size-4 shrink-0", value === i.key ? "text-accent-ink" : "text-subtle")} />
                <span className="truncate">{i.label}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>
    </>
  );
}
