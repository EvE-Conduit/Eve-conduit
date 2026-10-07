import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Database,
  Globe2,
  HardDrive,
  Layers,
  RefreshCw,
  ServerCog,
  ShieldAlert,
  Webhook,
  XCircle,
} from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader, StatCard } from "@/components/ui/page";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { humanize, num } from "@/lib/format";
import { cn, timeAgo } from "@/lib/utils";

interface Check {
  ok: boolean;
  ms: number;
  detail: string;
}

interface Health {
  status: "ok" | "degraded" | "down";
  checked_at: string;
  checks: { database: Check; cache: Check };
  celery: {
    mode: "inline" | "workers";
    ok: boolean;
    workers: string[];
    queue_length: number | null;
    heartbeat_age: number | null;
    detail: string;
  };
  esi: {
    sso_configured: boolean;
    calls_last_hour: number;
    failed_last_hour: number;
    error_limit_remain: number | null;
    error_limit_threshold: number;
    paused_for: number | null;
    ok: boolean;
  };
  sync: { by_result: Record<string, number>; overdue: number; tokens_total: number; tokens_invalid: number; ok: boolean };
  data: { sde_build: number | null; sde_imported_at: string | null; prices_updated_at: string | null; ok: boolean };
  problems: {
    errors_24h: number;
    warnings_24h: number;
    failing_webhooks: { id: number; name: string; failures: number; last_error: string }[];
  };
  security: { id: string; message: string; hint: string }[];
  about: { version: string; python: string; django: string; debug: boolean; database: string; users: number; modules_enabled: number };
}

const STATUS = {
  ok: { label: "All systems normal", tone: "success", Icon: CheckCircle2 },
  degraded: { label: "Running with problems", tone: "warning", Icon: AlertTriangle },
  down: { label: "Something essential is down", tone: "danger", Icon: XCircle },
} as const;

export function AdminHealth() {
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["admin", "health"],
    queryFn: () => api.get<Health>("/api/admin/health"),
    refetchInterval: 30_000,
  });

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Health"
        description="Whether the database, cache, background workers, scheduler and ESI are working. Refreshes every 30 seconds."
        actions={
          <Button onClick={() => refetch()} loading={isFetching}>
            {!isFetching && <RefreshCw />} Check now
          </Button>
        }
      />

      {isLoading || !data ? (
        <div className="space-y-4">
          <Skeleton className="h-24 rounded-xl" />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
        </div>
      ) : (
        <div className="space-y-6">
          <StatusBanner health={data} />

          {data.security.length > 0 && (
            <Card className="border-warning/40">
              <CardHeader
                icon={<ShieldAlert />}
                title={`${data.security.length} security ${data.security.length === 1 ? "setting needs" : "settings need"} attention`}
                description="Server settings that are risky for a public site. They're also printed when the server starts."
              />
              <CardBody className="space-y-4">
                {data.security.map((w) => (
                  <div key={w.id} className="flex gap-3 text-sm">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning-fg" />
                    <div>
                      <div className="font-medium">{w.message}</div>
                      <div className="mt-0.5 text-muted">{w.hint}</div>
                    </div>
                  </div>
                ))}
              </CardBody>
            </Card>
          )}

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Database" value={`${data.checks.database.ms} ms`} icon={<Database />} hint={data.checks.database.ok ? data.checks.database.detail : "unreachable"} />
            <StatCard label="Cache" value={`${data.checks.cache.ms} ms`} icon={<HardDrive />} hint={data.checks.cache.ok ? data.checks.cache.detail : "failing"} />
            <StatCard
              label="Job queue"
              value={data.celery.mode === "inline" ? "Inline" : num(data.celery.queue_length)}
              icon={<Layers />}
              hint={data.celery.mode === "inline" ? "no workers in this mode" : "tasks waiting"}
            />
            <StatCard label="ESI calls (1h)" value={num(data.esi.calls_last_hour)} icon={<Globe2 />} hint={`${num(data.esi.failed_last_hour)} failed`} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader icon={<Cpu />} title="Background jobs" description="Celery workers run syncs; the scheduler (beat) queues them." />
              <CardBody className="space-y-3">
                <Row label="Mode" ok={data.celery.ok} value={data.celery.mode === "inline" ? "Inline (development)" : "Workers"} />
                {data.celery.mode === "workers" && (
                  <>
                    <Row
                      label="Workers"
                      ok={data.celery.workers.length > 0}
                      value={data.celery.workers.length ? data.celery.workers.join(", ") : "none answered"}
                    />
                    <Row
                      label="Scheduler heartbeat"
                      ok={data.celery.heartbeat_age != null && data.celery.heartbeat_age < 300}
                      value={data.celery.heartbeat_age == null ? "never seen" : `${data.celery.heartbeat_age}s ago`}
                    />
                  </>
                )}
                {data.celery.detail && <p className="text-sm text-muted">{data.celery.detail}</p>}
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                icon={<Globe2 />}
                title="EVE Online ESI"
                description="ESI bans apps that ignore its error limit, so EvE Conduit pauses before it's reached."
                actions={
                  <Link to="/admin/logs">
                    <Button size="sm" variant="ghost">
                      ESI log
                    </Button>
                  </Link>
                }
              />
              <CardBody className="space-y-3">
                <Row label="EVE SSO application" ok={data.esi.sso_configured} value={data.esi.sso_configured ? "Configured" : "Missing ESI_CLIENT_ID / ESI_SECRET_KEY"} />
                <Row
                  label="Error budget"
                  ok={data.esi.error_limit_remain == null || data.esi.error_limit_remain > data.esi.error_limit_threshold * 3}
                  value={data.esi.error_limit_remain == null ? "no recent calls" : `${data.esi.error_limit_remain} errors left this window`}
                />
                <Row label="Paused" ok={!data.esi.paused_for} value={data.esi.paused_for ? `for ${data.esi.paused_for}s` : "no"} />
                <Row
                  label="Failure rate (1h)"
                  ok={data.esi.calls_last_hour === 0 || data.esi.failed_last_hour / data.esi.calls_last_hour < 0.2}
                  value={data.esi.calls_last_hour ? `${Math.round((data.esi.failed_last_hour / data.esi.calls_last_hour) * 100)}%` : "—"}
                />
              </CardBody>
            </Card>

            <Card>
              <CardHeader icon={<Activity />} title="Character syncs" description="How every character sheet section last synced." />
              <CardBody className="space-y-4">
                <SyncBar byResult={data.sync.by_result} />
                <Row label="Overdue by 15+ minutes" ok={data.sync.ok} value={num(data.sync.overdue)} />
                <Row
                  label="Characters needing a new login"
                  ok={data.sync.tokens_invalid === 0}
                  value={`${num(data.sync.tokens_invalid)} of ${num(data.sync.tokens_total)}`}
                />
              </CardBody>
            </Card>

            <Card>
              <CardHeader icon={<ServerCog />} title="Static data and server" />
              <CardBody className="space-y-3">
                <Row
                  label="EVE static data"
                  ok={data.data.ok}
                  value={data.data.sde_build ? `build ${data.data.sde_build}, ${timeAgo(data.data.sde_imported_at)}` : "not imported yet"}
                />
                <Row label="Market prices" ok={!!data.data.prices_updated_at} value={data.data.prices_updated_at ? timeAgo(data.data.prices_updated_at) : "never"} />
                <Row label="Errors logged (24h)" ok={data.problems.errors_24h === 0} value={num(data.problems.errors_24h)} />
                <Row label="Warnings logged (24h)" ok={data.problems.warnings_24h < 50} value={num(data.problems.warnings_24h)} />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <Badge>EvE Conduit {data.about.version}</Badge>
                  <Badge>Python {data.about.python}</Badge>
                  <Badge>Django {data.about.django}</Badge>
                  <Badge>{data.about.database}</Badge>
                  <Badge>{num(data.about.users)} users</Badge>
                  <Badge>{data.about.modules_enabled} plugins on</Badge>
                  {data.about.debug && <Badge color="var(--warning)">DEBUG on</Badge>}
                </div>
              </CardBody>
            </Card>
          </div>

          {data.problems.failing_webhooks.length > 0 && (
            <Card>
              <CardHeader
                icon={<Webhook />}
                title="Failing webhooks"
                actions={
                  <Link to="/admin/integrations">
                    <Button size="sm">Open integrations</Button>
                  </Link>
                }
              />
              <CardBody className="space-y-2">
                {data.problems.failing_webhooks.map((w) => (
                  <Row key={w.id} label={w.name} ok={false} value={`${w.failures} failed: ${w.last_error || "no response"}`} />
                ))}
              </CardBody>
            </Card>
          )}
        </div>
      )}
    </>
  );
}

function StatusBanner({ health }: { health: Health }) {
  const s = STATUS[health.status];
  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-xl border p-5 animate-fade-up",
        s.tone === "success" && "border-success/30 bg-success-soft",
        s.tone === "warning" && "border-warning/30 bg-warning-soft",
        s.tone === "danger" && "border-danger/30 bg-danger-soft",
      )}
    >
      <div
        className={cn(
          "grid size-11 place-items-center rounded-none [&_svg]:size-6",
          s.tone === "success" && "bg-success/15 text-success-fg",
          s.tone === "warning" && "bg-warning/15 text-warning-fg",
          s.tone === "danger" && "bg-danger/15 text-danger-fg",
        )}
      >
        <s.Icon />
      </div>
      <div>
        <div className="text-lg font-semibold tracking-tight">{s.label}</div>
        <div className="text-sm text-muted">Checked {timeAgo(health.checked_at)}</div>
      </div>
    </div>
  );
}

function Row({ label, value, ok }: { label: ReactNode; value: ReactNode; ok: boolean }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      {ok ? <CheckCircle2 className="size-4 shrink-0 text-success-fg" /> : <AlertTriangle className="size-4 shrink-0 text-warning-fg" />}
      <span className="text-muted">{label}</span>
      <span className="ml-auto truncate text-right font-medium">{value}</span>
    </div>
  );
}

const SYNC_TONES: Record<string, string> = {
  ok: "bg-success",
  pending: "bg-info",
  error: "bg-danger",
  missing_scopes: "bg-warning",
  token_invalid: "bg-subtle",
};

function SyncBar({ byResult }: { byResult: Record<string, number> }) {
  const total = Object.values(byResult).reduce((a, b) => a + b, 0);
  if (!total) return <p className="text-sm text-muted">No character has synced yet.</p>;
  const entries = Object.entries(byResult).sort((a, b) => b[1] - a[1]);
  return (
    <div>
      <div className="flex h-2.5 overflow-hidden rounded-none bg-surface-3">
        {entries.map(([k, n]) => (
          <div key={k} className={SYNC_TONES[k] ?? "bg-muted"} style={{ width: `${(n / total) * 100}%` }} title={`${humanize(k)}: ${n}`} />
        ))}
      </div>
      <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        {entries.map(([k, n]) => (
          <span key={k} className="inline-flex items-center gap-1.5">
            <span className={cn("size-2 rounded-none", SYNC_TONES[k] ?? "bg-muted")} />
            {humanize(k)} <span className="font-mono tabular-nums text-text">{num(n)}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
