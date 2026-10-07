import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowRight, ArrowUp, Bell, Check, Eye, EyeOff, KeyRound, LayoutGrid, Puzzle, RotateCcw, ShieldCheck, Users, UsersRound } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

import { tokenProblem } from "@/components/CharacterCard";
import { PluginBoundary } from "@/components/PluginBoundary";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Alert } from "@/components/ui/feedback";
import { EmptyState, StatCard } from "@/components/ui/page";
import { Tooltip } from "@/components/ui/tooltip";
import { CommsWidget, NetWorthWidget, SkillTrainingWidget } from "@/features/dashboard/widgets";
import { api } from "@/lib/api";
import { useBootstrap, useHasPerm } from "@/lib/bootstrap";
import { clock } from "@/lib/format";
import { useLoadedPlugins } from "@/lib/pluginContext";
import type { DashboardWidget } from "@/lib/plugins";
import { useUnreadCount } from "@/lib/notifications";
import { DEFAULT_PREFERENCES, useSavePreferences } from "@/lib/preferences";
import type { MyGroup } from "@/lib/types";
import { cn } from "@/lib/utils";

import { myCharactersQuery, useSsoResultToasts } from "./Characters";

function greeting() {
  const h = new Date().getHours();
  return h < 5 ? "Burning the midnight oil" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

type Placed = DashboardWidget & { moduleName: string; key: string };

export function Dashboard() {
  useSsoResultToasts();
  const { user, site } = useBootstrap();
  const plugins = useLoadedPlugins();
  const canManageModules = useHasPerm("site.manage_plugins");
  const unread = useUnreadCount();
  const savePrefs = useSavePreferences();
  const [editing, setEditing] = useState(false);
  const { data: characters = [] } = useQuery(myCharactersQuery);
  const { data: groups = [] } = useQuery({ queryKey: ["me", "groups"], queryFn: () => api.get<MyGroup[]>("/api/me/groups") });
  const attention = characters.filter(tokenProblem);

  if (!user) return null;
  const prefs = { ...DEFAULT_PREFERENCES, ...user.preferences };
  const layout = prefs.dashboard ?? {};
  const hidden = new Set(layout.hidden ?? []);
  const order = layout.order ?? [];

  const all: Placed[] = [
    { id: "networth", title: "Net worth", Component: NetWorthWidget, size: "md" as const, order: 0, moduleName: "Wallet" },
    { id: "training", title: "Skill training", Component: SkillTrainingWidget, size: "md" as const, order: 1, moduleName: "Skills" },
    { id: "comms", title: "Comms", Component: CommsWidget, size: "lg" as const, order: 2, moduleName: "Notifications" },
    ...plugins.flatMap((m) => (m.frontend.widgets ?? []).map((w) => ({ ...w, moduleName: m.info.name }))),
  ]
    .map((w) => ({ ...w, key: `${w.moduleName}:${w.id}` }))
    .sort((a, b) => {
      const ia = order.indexOf(a.key);
      const ib = order.indexOf(b.key);
      if (ia !== -1 || ib !== -1) return (ia === -1 ? 1e6 : ia) - (ib === -1 ? 1e6 : ib);
      return (a.order ?? 100) - (b.order ?? 100);
    });
  const visible = editing ? all : all.filter((w) => !hidden.has(w.key));

  const saveLayout = (next: { hidden?: string[]; order?: string[] }) =>
    savePrefs.mutate({ ...prefs, dashboard: { ...layout, ...next } }, { onError: (e) => toast.error(`Couldn't save layout: ${e.message}`) });
  const move = (key: string, dir: -1 | 1) => {
    const keys = all.map((w) => w.key);
    const i = keys.indexOf(key);
    const j = i + dir;
    if (j < 0 || j >= keys.length) return;
    [keys[i], keys[j]] = [keys[j]!, keys[i]!];
    saveLayout({ order: keys });
  };
  const toggleHidden = (key: string) => {
    const next = new Set(hidden);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    saveLayout({ hidden: [...next] });
  };

  const main = user.main;
  const memberGroups = groups.filter((g) => g.member).length;
  const openGroups = groups.filter((g) => g.joinable && !g.member).length;

  return (
    <div className="space-y-6">
      <section className="panel border-border-strong animate-fade-up">
        <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:p-8">
          <Avatar src={main?.portrait} name={user.name} size="xl" className="ring-0" />
          <div className="min-w-0 flex-1">
            <div className="eyebrow">
              {greeting()}, capsuleer · <span className="font-mono tabular-nums tracking-normal">EVE {clock(new Date(), { timeZone: "UTC" })}</span>
            </div>
            <h1 className="hud-title mt-2 truncate text-3xl tracking-[0.04em] sm:text-[40px]">{user.name}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {user.state && (
                <Badge color={user.state.color} variant="dot">
                  {user.state.name}
                </Badge>
              )}
              {main?.corporation && (
                <Badge>
                  <img src={main.corporation.logo} alt="" className="size-3.5" />
                  {main.corporation.name} <span className="font-mono text-subtle">[{main.corporation.ticker}]</span>
                </Badge>
              )}
              {main?.alliance && (
                <Badge>
                  <img src={main.alliance.logo} alt="" className="size-3.5" />
                  {main.alliance.name}
                </Badge>
              )}
            </div>
          </div>
          {main && (
            <Link to={`/characters/${main.id}`} className="shrink-0">
              <Button variant="primary" size="lg">
                Character sheet <ArrowRight />
              </Button>
            </Link>
          )}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Link to="/characters" className="block transition-colors hover:[&>div]:border-border-strong">
          <StatCard label="Characters" value={characters.length} icon={<UsersRound />} tone="accent" hint="linked to this account" />
        </Link>
        <Link to="/groups" className="block transition-colors hover:[&>div]:border-border-strong">
          <StatCard label="Groups" value={memberGroups} icon={<Users />} tone="info" hint={openGroups ? `${openGroups} open to join` : "member of"} />
        </Link>
        <StatCard label="Access" value={user.state?.name ?? "None"} icon={<ShieldCheck />} tone="success" hint={`on ${site.name}`} mono={false} />
        <Link to="/notifications" className="block transition-colors hover:[&>div]:border-border-strong">
          <StatCard
            label="Notifications"
            value={unread}
            icon={<Bell />}
            tone={unread ? "warning" : "accent"}
            hint={unread ? "unread" : "all caught up"}
          />
        </Link>
      </div>

      {attention.length > 0 && (
        <Alert
          tone="warning"
          title={`${attention.length === 1 ? "A character needs" : `${attention.length} characters need`} a new login`}
          action={
            <a href="/sso/add-character?next=/">
              <Button size="sm" variant="primary">
                <KeyRound /> Re-authorise
              </Button>
            </a>
          }
        >
          <span className="font-medium text-text">{attention.map((c) => c.name).join(", ")}</span>{" "}
          {attention.length === 1 ? "isn't" : "aren't"} updating. Log in with {attention.length === 1 ? "it" : "each"} again so your data stays current.
        </Alert>
      )}

      {all.length > 0 ? (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-tight">{editing ? "Customise your dashboard" : "Overview"}</h2>
            <div className="flex items-center gap-2">
              {editing && (layout.order?.length || layout.hidden?.length) ? (
                <Button size="sm" variant="ghost" onClick={() => saveLayout({ order: [], hidden: [] })}>
                  <RotateCcw /> Reset
                </Button>
              ) : null}
              <Button size="sm" variant={editing ? "primary" : "ghost"} onClick={() => setEditing(!editing)}>
                {editing ? (
                  <>
                    <Check /> Done
                  </>
                ) : (
                  <>
                    <LayoutGrid /> Customise
                  </>
                )}
              </Button>
            </div>
          </div>
          {visible.length ? (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-6">
              {visible.map((w, i) => (
                <Widget
                  key={w.key}
                  widget={w}
                  moduleName={w.moduleName}
                  editing={editing}
                  hidden={hidden.has(w.key)}
                  first={i === 0}
                  last={i === visible.length - 1}
                  onMove={(d) => move(w.key, d)}
                  onToggle={() => toggleHidden(w.key)}
                />
              ))}
            </div>
          ) : (
            <Card>
              <EmptyState
                icon={<LayoutGrid />}
                title="All widgets are hidden"
                description="Choose Customise to bring some back."
                action={<Button onClick={() => setEditing(true)}>Customise</Button>}
              />
            </Card>
          )}
        </>
      ) : (
        <Card>
          <EmptyState
            icon={<Puzzle />}
            title="Your dashboard fills up as plugins are enabled"
            description="Plugins add widgets here: wallets, skill queues, fleet timers and more."
            action={
              canManageModules ? (
                <Link to="/admin/plugins">
                  <Button variant="primary">Browse plugins</Button>
                </Link>
              ) : undefined
            }
          />
        </Card>
      )}
    </div>
  );
}

function Widget({
  widget,
  moduleName,
  editing,
  hidden,
  first,
  last,
  onMove,
  onToggle,
}: {
  widget: DashboardWidget;
  moduleName: string;
  editing: boolean;
  hidden: boolean;
  first: boolean;
  last: boolean;
  onMove: (dir: -1 | 1) => void;
  onToggle: () => void;
}) {
  const allowed = useHasPerm(widget.permission);
  if (!allowed) return null;
  const span = widget.size === "lg" ? "lg:col-span-6" : widget.size === "sm" ? "lg:col-span-2" : "lg:col-span-3";
  return (
    <Card className={cn("flex flex-col animate-fade-up", span, editing && "ring-1 ring-accent/25", hidden && "opacity-50")}>
      <CardHeader
        title={widget.title}
        description={moduleName}
        actions={
          editing ? (
            <div className="flex items-center gap-0.5">
              <Tooltip content="Move earlier">
                <Button size="icon-xs" variant="ghost" disabled={first} onClick={() => onMove(-1)} aria-label="Move earlier">
                  <ArrowUp />
                </Button>
              </Tooltip>
              <Tooltip content="Move later">
                <Button size="icon-xs" variant="ghost" disabled={last} onClick={() => onMove(1)} aria-label="Move later">
                  <ArrowDown />
                </Button>
              </Tooltip>
              <Tooltip content={hidden ? "Show" : "Hide"}>
                <Button size="icon-xs" variant="ghost" onClick={onToggle} aria-label={hidden ? "Show widget" : "Hide widget"}>
                  {hidden ? <EyeOff /> : <Eye />}
                </Button>
              </Tooltip>
            </div>
          ) : undefined
        }
      />
      <CardBody className="flex-1">
        <PluginBoundary name={moduleName} compact>
          <widget.Component />
        </PluginBoundary>
      </CardBody>
    </Card>
  );
}
