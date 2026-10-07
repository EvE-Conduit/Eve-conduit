import * as Tabs from "@radix-ui/react-tabs";
import { useQuery } from "@tanstack/react-query";
import { Activity, Bot, Cpu, FileText, Gauge, RadioTower, RefreshCw, ScrollText, Search, Server, ShieldAlert, Timer, User } from "lucide-react";
import { useDeferredValue, useState } from "react";

import { BarChart } from "@/components/BarChart";
import { DataTable, PagedTable, type Column } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { EmptyState, PageHeader, StatCard } from "@/components/ui/page";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { dateTime, num } from "@/lib/format";
import { cn, timeAgo } from "@/lib/utils";

import { Detail, FilterChip, Select } from "./Api";

interface AuditEvent {
  id: number;
  at: string;
  action: string;
  summary: string;
  actor: { type: "user" | "api_key" | "system"; id: number | null; name: string };
  target: { type: string; id: string; name: string } | null;
  details: Record<string, unknown>;
  ip: string | null;
}

interface ServiceLog {
  id: number;
  at: string;
  level: "WARNING" | "ERROR" | "CRITICAL";
  logger: string;
  message: string;
  traceback: string;
}

interface LogFiles {
  configured: boolean;
  directory: string | null;
  files: { name: string; size: number; modified: string }[];
}

const LEVEL_COLORS: Record<ServiceLog["level"], string> = { WARNING: "var(--warning)", ERROR: "var(--danger)", CRITICAL: "#e11d48" };

const ACTOR_ICONS = { user: User, api_key: Bot, system: Cpu };

const tabClass =
  "inline-flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm text-muted transition-colors data-[state=active]:bg-surface-3 data-[state=active]:text-text data-[state=active]:shadow";

export function AdminLogs() {
  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Logs"
        icon={<ScrollText />}
        description="What happened on this site and who did it, plus warnings and errors from the server itself."
      />
      <Tabs.Root defaultValue="audit">
        <Tabs.List className="mb-6 inline-flex rounded-xl border border-border bg-surface/70 p-1">
          {[
            { v: "audit", label: "Audit", icon: ScrollText },
            { v: "service", label: "Service", icon: Server },
            { v: "esi", label: "ESI", icon: RadioTower },
          ].map((t) => (
            <Tabs.Trigger key={t.v} value={t.v} className={tabClass}>
              <t.icon className="size-4" /> {t.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        <Tabs.Content value="audit">
          <Audit />
        </Tabs.Content>
        <Tabs.Content value="service" className="space-y-6">
          <Service />
          <Files />
        </Tabs.Content>
        <Tabs.Content value="esi" className="space-y-6">
          <Esi />
        </Tabs.Content>
      </Tabs.Root>
    </>
  );
}

function SearchInput({ value, onChange, placeholder, className }: { value: string; onChange: (v: string) => void; placeholder: string; className?: string }) {
  return (
    <div className={cn("relative max-w-xs flex-1", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="pl-9" />
    </div>
  );
}

// --- Audit -----------------------------------------------------------------------

function Audit() {
  const actions = useQuery({ queryKey: ["admin", "audit", "actions"], queryFn: () => api.get<string[]>("/api/admin/audit/actions") });
  const [action, setAction] = useState("");
  const [actor, setActor] = useState("");
  const [q, setQ] = useState("");
  const actorQ = useDeferredValue(actor);
  const textQ = useDeferredValue(q);
  const [open, setOpen] = useState<AuditEvent | null>(null);

  const params = new URLSearchParams();
  if (action) params.set("action", action);
  if (actorQ.trim()) params.set("actor", actorQ.trim());
  if (textQ.trim()) params.set("q", textQ.trim());

  // "group.member_added" -> offer "group." too, so a whole family can be picked.
  const families = [...new Set((actions.data ?? []).map((a) => a.split(".")[0]))].sort();

  const columns: Column<AuditEvent>[] = [
    { header: "Time", cell: (e) => <span className="whitespace-nowrap text-muted" title={dateTime(e.at)}>{timeAgo(e.at)}</span> },
    {
      header: "Actor",
      cell: (e) => {
        const Icon = ACTOR_ICONS[e.actor.type] ?? Cpu;
        return (
          <span className="inline-flex items-center gap-2 whitespace-nowrap">
            <Icon className={cn("size-3.5", e.actor.type === "api_key" ? "text-accent-ink" : "text-subtle")} />
            {e.actor.name}
          </span>
        );
      },
    },
    { header: "What happened", className: "max-w-xl", cell: (e) => <span>{e.summary}</span> },
    { header: "Action", cell: (e) => <code className="whitespace-nowrap font-mono text-[11px] text-subtle">{e.action}</code> },
  ];

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <SearchInput value={q} onChange={setQ} placeholder="Search events…" />
        <SearchInput value={actor} onChange={setActor} placeholder="Actor name…" />
        <Select value={action} onChange={setAction} label="Action">
          <option value="">All actions</option>
          {families.map((f) => (
            <optgroup key={f} label={f}>
              <option value={`${f}.`}>All {f} events</option>
              {actions.data
                ?.filter((a) => a.startsWith(`${f}.`))
                .map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
            </optgroup>
          ))}
        </Select>
      </div>
      <Card className="overflow-hidden">
        <PagedTable<AuditEvent>
          key={params.toString()}
          url="/api/admin/audit"
          params={params.toString()}
          columns={columns}
          rowKey={(e) => e.id}
          onRowClick={setOpen}
          empty={{ icon: <ScrollText />, title: "No events", description: params.toString() ? "Nothing matches these filters." : "Sign-ins, group changes and admin actions show up here." }}
        />
      </Card>
      {open && (
        <Dialog open onOpenChange={(o) => !o && setOpen(null)} title={open.summary} className="max-w-2xl">
          <dl className="grid grid-cols-[120px_1fr] gap-x-4 gap-y-2 text-sm">
            <Detail label="Time">{dateTime(open.at)}</Detail>
            <Detail label="Action">
              <code className="font-mono text-xs">{open.action}</code>
            </Detail>
            <Detail label="Actor">
              {open.actor.name} <span className="text-subtle">({open.actor.type.replace("_", " ")})</span>
            </Detail>
            <Detail label="Target">{open.target ? `${open.target.name} (${open.target.type} ${open.target.id})` : "—"}</Detail>
            <Detail label="IP address">
              <code className="font-mono text-xs">{open.ip ?? "—"}</code>
            </Detail>
          </dl>
          {Object.keys(open.details ?? {}).length > 0 && (
            <pre className="mt-4 max-h-80 overflow-auto rounded-lg border border-border bg-bg/70 p-3 font-mono text-xs text-text">{JSON.stringify(open.details, null, 2)}</pre>
          )}
        </Dialog>
      )}
    </>
  );
}

// --- Service ---------------------------------------------------------------------

function Service() {
  const [level, setLevel] = useState("");
  const [logger, setLogger] = useState("");
  const [q, setQ] = useState("");
  const loggerQ = useDeferredValue(logger);
  const textQ = useDeferredValue(q);
  const [open, setOpen] = useState<ServiceLog | null>(null);

  const params = new URLSearchParams();
  if (level) params.set("level", level);
  if (loggerQ.trim()) params.set("logger", loggerQ.trim());
  if (textQ.trim()) params.set("q", textQ.trim());

  const columns: Column<ServiceLog>[] = [
    { header: "Time", cell: (l) => <span className="whitespace-nowrap text-muted" title={dateTime(l.at)}>{timeAgo(l.at)}</span> },
    {
      header: "Level",
      cell: (l) => (
        <Badge color={LEVEL_COLORS[l.level]} variant="dot">
          {l.level.toLowerCase()}
        </Badge>
      ),
    },
    { header: "Logger", cell: (l) => <code className="whitespace-nowrap font-mono text-[11px] text-subtle">{l.logger}</code> },
    { header: "Message", className: "max-w-2xl", cell: (l) => <span className="font-mono text-xs">{l.message}</span> },
  ];

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <SearchInput value={q} onChange={setQ} placeholder="Search messages…" />
        <SearchInput value={logger} onChange={setLogger} placeholder="Logger, e.g. evecsm.esi" />
        <div className="flex gap-1.5">
          {["", "WARNING", "ERROR", "CRITICAL"].map((l) => (
            <FilterChip key={l} active={level === l} onClick={() => setLevel(l)}>
              {l ? l.charAt(0) + l.slice(1).toLowerCase() : "All"}
            </FilterChip>
          ))}
        </div>
      </div>
      <Card className="overflow-hidden">
        <PagedTable<ServiceLog>
          key={params.toString()}
          url="/api/admin/logs/service"
          params={params.toString()}
          columns={columns}
          rowKey={(l) => l.id}
          onRowClick={setOpen}
          empty={{ icon: <Server />, title: "No warnings or errors", description: params.toString() ? "Nothing matches these filters." : "The server hasn't logged any problems." }}
        />
      </Card>
      {open && (
        <Dialog open onOpenChange={(o) => !o && setOpen(null)} title={`${open.level.toLowerCase()} in ${open.logger}`} description={dateTime(open.at)} className="max-w-3xl">
          <pre className="whitespace-pre-wrap break-words rounded-lg border border-border bg-bg/70 p-3 font-mono text-xs text-text">{open.message}</pre>
          {open.traceback && <pre className="mt-3 max-h-96 overflow-auto rounded-lg border border-border bg-bg/70 p-3 font-mono text-[11px] text-danger-fg">{open.traceback}</pre>}
        </Dialog>
      )}
    </div>
  );
}

function size(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function Files() {
  const files = useQuery({ queryKey: ["admin", "logs", "files"], queryFn: () => api.get<LogFiles>("/api/admin/logs/files") });
  const [name, setName] = useState<string | null>(null);
  const [lines, setLines] = useState(500);
  const current = name ?? files.data?.files[0]?.name ?? null;
  const tail = useQuery({
    queryKey: ["admin", "logs", "file", current, lines],
    queryFn: () => api.get<{ name: string; lines: string[]; truncated: boolean }>(`/api/admin/logs/files/${encodeURIComponent(current!)}?lines=${lines}`),
    enabled: !!current,
  });

  return (
    <Card className="overflow-hidden">
      <CardHeader
        title="Log files"
        description={files.data?.directory ? <span className="font-mono">{files.data.directory}</span> : "Raw output of the web, worker and other services."}
        icon={<FileText />}
        actions={
          current && (
            <>
              <Select value={String(lines)} onChange={(v) => setLines(Number(v))} label="Lines">
                {[200, 500, 1000, 2000].map((n) => (
                  <option key={n} value={n}>
                    Last {n} lines
                  </option>
                ))}
              </Select>
              <Button size="icon" variant="ghost" onClick={() => tail.refetch()} aria-label="Refresh">
                <RefreshCw className={cn(tail.isFetching && "animate-spin")} />
              </Button>
            </>
          )
        }
      />
      {files.isLoading ? (
        <Skeleton className="m-5 h-40" />
      ) : !files.data?.configured ? (
        <EmptyState
          icon={<FileText />}
          title="No log folder configured"
          description="With Docker or Supervisor the services log to standard output (docker compose logs, journalctl). Set EVECSM_LOG_DIR to browse log files here; the Windows install does this for you."
          className="py-10"
        />
      ) : !files.data.files.length ? (
        <EmptyState icon={<FileText />} title="No log files yet" description="The folder exists but has no log files in it." className="py-10" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr]">
          <ul className="max-h-[480px] overflow-y-auto border-b border-border p-2 md:border-b-0 md:border-r">
            {files.data.files.map((f) => (
              <li key={f.name}>
                <button
                  onClick={() => setName(f.name)}
                  className={cn(
                    "w-full rounded-lg px-3 py-2 text-left transition-colors",
                    current === f.name ? "bg-accent-soft text-text" : "text-muted hover:bg-hover hover:text-text",
                  )}
                >
                  <div className="truncate font-mono text-xs">{f.name}</div>
                  <div className="mt-0.5 text-[11px] text-subtle">
                    {size(f.size)} · {timeAgo(f.modified)}
                  </div>
                </button>
              </li>
            ))}
          </ul>
          <div className="min-w-0">
            {tail.isLoading ? (
              <Skeleton className="m-5 h-80" />
            ) : (
              <>
                {tail.data?.truncated && <div className="border-b border-border px-4 py-2 text-[11px] text-subtle">Showing the last {lines} lines.</div>}
                <pre className="max-h-[480px] overflow-auto p-4 font-mono text-[11px] leading-relaxed text-text">{tail.data?.lines.join("\n") || "(empty)"}</pre>
              </>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

// --- ESI --------------------------------------------------------------------------

type EsiOutcome = "ok" | "not_modified" | "error" | "rate_limited" | "network" | "paused";

interface EsiCall {
  id: number;
  at: string;
  method: string;
  route: string;
  path: string;
  query: string;
  character: { id: number; name: string } | null;
  source: string;
  outcome: EsiOutcome;
  status: number | null;
  duration_ms: number;
  error: string;
  error_limit_remain: number | null;
  ratelimit_group: string;
  ratelimit_remaining: number | null;
}

interface EsiGroupRow {
  calls: number;
  errors: number;
  avg_ms: number;
}

interface EsiSummary {
  hours: number;
  mode: "all" | "errors" | "off";
  retention_days: number;
  total: number;
  by_outcome: Record<EsiOutcome, number>;
  avg_ms: number;
  error_limit: { remain: number; reset: number | null; seen_at: string } | null;
  error_limit_threshold: number;
  paused_until: string | null;
  routes: (EsiGroupRow & { route: string })[];
  sources: (EsiGroupRow & { source: string })[];
  timeline: { hour: string; calls: number; errors: number }[];
}

const OUTCOMES: Record<EsiOutcome, { label: string; color: string }> = {
  ok: { label: "OK", color: "var(--success)" },
  not_modified: { label: "Not modified", color: "var(--info)" },
  error: { label: "Error", color: "var(--danger)" },
  rate_limited: { label: "Rate limited", color: "#fb923c" },
  network: { label: "No answer", color: "#e11d48" },
  paused: { label: "Held back", color: "#a78bfa" },
};

/** One bar per hour, including hours without calls. */
function hourly(timeline: EsiSummary["timeline"], hours: number) {
  const byHour = new Map(timeline.map((t) => [new Date(t.hour).getTime(), t.calls]));
  const now = new Date();
  now.setMinutes(0, 0, 0);
  return Array.from({ length: hours }, (_, i) => {
    const at = now.getTime() - (hours - 1 - i) * 3_600_000;
    return { date: new Date(at).toISOString(), value: byHour.get(at) ?? 0 };
  });
}

function Esi() {
  const [hours, setHours] = useState<"24" | "168">("24");
  const summary = useQuery({
    queryKey: ["admin", "esi", "summary", hours],
    queryFn: () => api.get<EsiSummary>(`/api/admin/esi/summary?hours=${hours}`),
    refetchInterval: 30_000,
  });
  const s = summary.data;
  const failed = s ? s.by_outcome.error + s.by_outcome.rate_limited + s.by_outcome.network : 0;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          Every request this server sent to ESI. Answers still fresh in the local cache are reused without asking ESI, so they aren't listed.
          {s && s.mode !== "all" && (
            <span className="text-warning-fg"> Recording: {s.mode === "off" ? "off" : "errors only"} (EVECSM_ESI_LOG).</span>
          )}
        </p>
        <div className="flex gap-1.5">
          {(["24", "168"] as const).map((h) => (
            <FilterChip key={h} active={hours === h} onClick={() => setHours(h)}>
              {h === "24" ? "24 hours" : "7 days"}
            </FilterChip>
          ))}
        </div>
      </div>

      {!s ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Calls" value={num(s.total)} icon={<Activity />} hint={`average ${num(s.avg_ms)} ms`} />
            <StatCard
              label="Failed"
              value={num(failed)}
              icon={<ShieldAlert />}
              hint={s.total ? `${((failed / s.total) * 100).toFixed(1)}% of calls · ${num(s.by_outcome.rate_limited)} rate limited` : "nothing yet"}
            />
            <StatCard label="Not modified" value={num(s.by_outcome.not_modified)} icon={<Timer />} hint={`${num(s.by_outcome.paused)} held back while pausing`} />
            <StatCard
              label="Error limit"
              mono
              value={
                s.paused_until ? (
                  <span className="text-danger-fg">Paused</span>
                ) : s.error_limit ? (
                  <span className={cn(s.error_limit.remain < s.error_limit_threshold * 3 && "text-warning-fg")}>{s.error_limit.remain} left</span>
                ) : (
                  "–"
                )
              }
              icon={<Gauge />}
              hint={
                s.paused_until
                  ? `ESI calls resume ${timeAgo(s.paused_until)}`
                  : s.error_limit
                    ? `seen ${timeAgo(s.error_limit.seen_at)} · pauses below ${s.error_limit_threshold}`
                    : "no ESI answer seen in the last hour"
              }
            />
          </div>

          <Card>
            <CardHeader title="Calls per hour" icon={<Activity />} />
            <div className="px-5 pb-4">
              <BarChart data={hourly(s.timeline, s.hours)} unit="hour" format={(n) => num(Math.round(n))} label="ESI calls per hour" />
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <EsiGroupCard title="Busiest routes" rows={s.routes.map((r) => ({ ...r, name: r.route }))} mono />
            <EsiGroupCard title="Who's calling" rows={s.sources.map((r) => ({ ...r, name: r.source || "unknown" }))} />
          </div>
        </>
      )}

      <EsiCalls />
    </>
  );
}

function EsiGroupCard({ title, rows, mono }: { title: string; rows: (EsiGroupRow & { name: string })[]; mono?: boolean }) {
  const columns: Column<EsiGroupRow & { name: string }>[] = [
    { header: "Name", cell: (r) => <span className={cn("break-all", mono ? "font-mono text-xs" : "text-sm")}>{r.name}</span> },
    { header: "Calls", className: "text-right", cell: (r) => <span className="font-mono tabular-nums">{num(r.calls)}</span> },
    {
      header: "Failed",
      className: "text-right",
      cell: (r) => <span className={cn("font-mono tabular-nums", r.errors ? "text-danger-fg" : "text-subtle")}>{num(r.errors)}</span>,
    },
    { header: "Avg", className: "text-right", cell: (r) => <span className="whitespace-nowrap font-mono tabular-nums text-muted">{num(r.avg_ms)} ms</span> },
  ];
  return (
    <Card className="overflow-hidden">
      <CardHeader title={title} />
      <DataTable rows={rows} columns={columns} rowKey={(r) => r.name} empty={{ icon: <RadioTower />, title: "No calls in this period" }} />
    </Card>
  );
}

function EsiCalls() {
  const [outcome, setOutcome] = useState("");
  const [route, setRoute] = useState("");
  const [source, setSource] = useState("");
  const routeQ = useDeferredValue(route);
  const sourceQ = useDeferredValue(source);
  const [open, setOpen] = useState<EsiCall | null>(null);

  const params = new URLSearchParams();
  if (outcome) params.set("outcome", outcome);
  if (routeQ.trim()) params.set("route", routeQ.trim());
  if (sourceQ.trim()) params.set("source", sourceQ.trim());

  const columns: Column<EsiCall>[] = [
    { header: "Time", cell: (c) => <span className="whitespace-nowrap text-muted" title={dateTime(c.at)}>{timeAgo(c.at)}</span> },
    {
      header: "Result",
      cell: (c) => (
        <Badge color={OUTCOMES[c.outcome].color} variant="dot">
          {c.status ?? OUTCOMES[c.outcome].label}
        </Badge>
      ),
    },
    {
      header: "Request",
      className: "max-w-xl",
      cell: (c) => (
        <span className="font-mono text-xs">
          <span className="text-subtle">{c.method}</span> {c.path}
          {c.query && <span className="text-subtle">?{c.query}</span>}
        </span>
      ),
    },
    { header: "Character", cell: (c) => <span className="whitespace-nowrap text-sm">{c.character ? c.character.name || c.character.id : <span className="text-subtle">–</span>}</span> },
    { header: "Source", cell: (c) => <code className="whitespace-nowrap font-mono text-[11px] text-subtle">{c.source}</code> },
    { header: "Time taken", className: "text-right", cell: (c) => <span className="whitespace-nowrap font-mono tabular-nums text-muted">{num(c.duration_ms)} ms</span> },
  ];

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <SearchInput value={route} onChange={setRoute} placeholder="Route, e.g. /wallet" />
        <SearchInput value={source} onChange={setSource} placeholder="Source, e.g. sheet:assets" />
        <div className="flex flex-wrap gap-1.5">
          <FilterChip active={outcome === ""} onClick={() => setOutcome("")}>
            All
          </FilterChip>
          <FilterChip active={outcome === "failed"} onClick={() => setOutcome("failed")}>
            Failed
          </FilterChip>
          {(Object.keys(OUTCOMES) as EsiOutcome[]).map((o) => (
            <FilterChip key={o} active={outcome === o} onClick={() => setOutcome(o)}>
              {OUTCOMES[o].label}
            </FilterChip>
          ))}
        </div>
      </div>
      <Card className="overflow-hidden">
        <PagedTable<EsiCall>
          key={params.toString()}
          url="/api/admin/esi/calls"
          params={params.toString()}
          columns={columns}
          rowKey={(c) => c.id}
          onRowClick={setOpen}
          empty={{ icon: <RadioTower />, title: "No ESI calls", description: params.toString() ? "Nothing matches these filters." : "Calls appear here as soon as the server talks to ESI." }}
        />
      </Card>
      {open && (
        <Dialog open onOpenChange={(o) => !o && setOpen(null)} title={`${open.method} ${open.route}`} description={dateTime(open.at)} className="max-w-2xl">
          <dl className="grid grid-cols-[120px_1fr] gap-x-4 gap-y-2 text-sm">
            <Detail label="Result">
              <Badge color={OUTCOMES[open.outcome].color} variant="dot">
                {OUTCOMES[open.outcome].label}
                {open.status ? ` · ${open.status}` : ""}
              </Badge>
            </Detail>
            <Detail label="Path">
              <code className="break-all font-mono text-xs">
                {open.path}
                {open.query && `?${open.query}`}
              </code>
            </Detail>
            {open.character && <Detail label="Character">{open.character.name || open.character.id}</Detail>}
            <Detail label="Source">
              <code className="font-mono text-xs">{open.source}</code>
            </Detail>
            <Detail label="Time taken">{num(open.duration_ms)} ms</Detail>
            {open.error_limit_remain !== null && <Detail label="Error limit left">{open.error_limit_remain}</Detail>}
            {open.ratelimit_group && (
              <Detail label="Rate limit">
                {open.ratelimit_group}
                {open.ratelimit_remaining !== null && ` · ${open.ratelimit_remaining} tokens left`}
              </Detail>
            )}
          </dl>
          {open.error && <pre className="mt-3 whitespace-pre-wrap break-words rounded-lg border border-border bg-bg/70 p-3 font-mono text-xs text-danger-fg">{open.error}</pre>}
        </Dialog>
      )}
    </div>
  );
}
