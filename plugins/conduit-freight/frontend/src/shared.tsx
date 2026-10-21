// Pieces used by the members', the haulers', the managers' and the public pages.
import { api, Badge, Button, Callout, Card, CardBody, cn, Field, Input, isk, num, Select, toast, Tooltip } from "@conduit/sdk";
import { useMutation } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Link } from "react-router";

import { ArrowLeft, ArrowRight, Check, Copy, Swap, Warning } from "./icons";
import type { Problem, Quote, Route, Service, SystemInfo } from "./types";

export function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <Button
      size="xs"
      variant="ghost"
      aria-label={`${label}: ${value}`}
      onClick={() => {
        navigator.clipboard.writeText(value).then(
          () => {
            setDone(true);
            setTimeout(() => setDone(false), 1500);
          },
          () => toast.error("Couldn't copy; select it and copy by hand"),
        );
      }}
    >
      {done ? <Check /> : <Copy />} {done ? "Copied" : label}
    </Button>
  );
}

export function BackLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-text">
      <ArrowLeft /> {children}
    </Link>
  );
}

export function SystemText({ system }: { system: SystemInfo | null }) {
  if (!system) return null;
  const tone = system.security >= 0.5 ? "text-success-fg" : system.security > 0 ? "text-warning-fg" : "text-danger-fg";
  return (
    <span className="text-muted">
      {system.name} <span className={cn("font-mono text-xs", tone)}>{system.security.toFixed(1)}</span>
      {system.region && <span className="text-subtle"> · {system.region}</span>}
    </span>
  );
}

/** "Jita 4-4 → Amarr VIII", with the systems underneath. */
export function RouteLabel({ route, compact }: { route: Route; compact?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-1.5 font-medium">
        <span>{route.start.name}</span>
        {route.both_ways ? <Swap className="size-3.5 text-subtle" /> : <ArrowRight className="size-3.5 text-subtle" />}
        <span>{route.end.name}</span>
      </div>
      {!compact && (
        <div className="text-xs">
          <SystemText system={route.start.system} /> <span className="text-subtle">to</span> <SystemText system={route.end.system} />
          {route.jumps !== null && <span className="text-subtle"> · {route.jumps} jumps</span>}
        </div>
      )}
    </div>
  );
}

const pct = (n: number) => `${Number.isInteger(n) ? n : n.toFixed(2)}%`;

/** What a route charges, in a few words each. */
export function RateFacts({ route }: { route: Route }) {
  const facts: ReactNode[] = [
    route.base_price > 0 ? <>{isk(route.base_price)} base</> : null,
    route.price_per_m3 > 0 ? <>{isk(route.price_per_m3, { full: true })}/m³</> : null,
    route.price_per_jump > 0 ? <>{isk(route.price_per_jump)}/jump</> : null,
    route.collateral_percent > 0 ? <>{pct(route.collateral_percent)} of collateral</> : null,
    route.min_reward > 0 ? <>at least {isk(route.min_reward)}</> : null,
    route.max_volume > 0 ? <>up to {num(route.max_volume)} m³</> : null,
    route.max_collateral > 0 ? <>up to {isk(route.max_collateral)} collateral</> : null,
  ].filter(Boolean);
  if (!facts.length) return <span className="text-xs text-subtle">Free</span>;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {facts.map((f, i) => (
        <li key={i} className="border border-border bg-surface-2 px-2 py-1 text-xs text-muted">
          {f}
        </li>
      ))}
    </ul>
  );
}

const STATUS_TONE: Record<string, "neutral" | "accent" | "success" | "warning" | "danger" | "info"> = {
  outstanding: "accent",
  in_progress: "info",
  finished: "success",
  finished_issuer: "success",
  finished_contractor: "success",
  rejected: "danger",
  deleted: "neutral",
  expired: "warning",
  failed: "danger",
  reversed: "warning",
};

export function StatusBadge({ status, label }: { status: string; label: string }) {
  return <Badge tone={STATUS_TONE[status] ?? "neutral"}>{label}</Badge>;
}

export function Problems({ problems, compact }: { problems: Problem[]; compact?: boolean }) {
  if (!problems.length) return compact ? <Badge tone="success">Matches its route</Badge> : null;
  if (compact) {
    const severe = problems.filter((p) => p.severe).length;
    return (
      <Tooltip content={problems.map((p) => p.text).join(" ")}>
        <span>
          <Badge tone={severe ? "danger" : "warning"}>
            {severe ? `${severe} problem${severe === 1 ? "" : "s"}` : `${problems.length} note${problems.length === 1 ? "" : "s"}`}
          </Badge>
        </span>
      </Tooltip>
    );
  }
  return (
    <ul className="space-y-2">
      {problems.map((p) => (
        <li key={p.code} className={cn("flex items-start gap-2.5 border px-3 py-2 text-sm", p.severe ? "border-danger/40 bg-danger-soft text-danger-fg" : "border-warning/40 bg-warning-soft text-warning-fg")}>
          <Warning className="mt-0.5 size-4 shrink-0" />
          <span>{p.text}</span>
        </li>
      ))}
    </ul>
  );
}

function Step({ n, title, children }: { n: number; title: ReactNode; children: ReactNode }) {
  return (
    <li className="grid grid-cols-[28px_1fr] gap-3">
      <span className="grid size-7 place-items-center border border-border-strong font-mono text-xs text-accent-ink">{n}</span>
      <div className="min-w-0">
        <div className="hud-label text-subtle">{title}</div>
        <div className="mt-1">{children}</div>
      </div>
    </li>
  );
}

function Money({ value }: { value: number }) {
  const text = String(Math.round(value));
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="font-mono font-medium tabular-nums">{Number(text).toLocaleString("en")} ISK</span>
      <CopyButton value={text} />
    </div>
  );
}

/** The reward and, step by step, the courier contract to make. */
export function ContractSteps({ quote }: { quote: Quote }) {
  const t = quote.terms;
  const r = quote.route;
  return (
    <div className="panel border-accent/40 p-5">
      <div className="hud-label text-subtle">Reward</div>
      <div className="mt-1 font-mono text-[34px] font-semibold leading-none tabular-nums text-accent-ink">{isk(quote.reward, { full: true })}</div>
      <div className="mt-1.5 text-xs text-muted">
        {num(quote.volume)} m³ · {isk(quote.collateral)} collateral{r.jumps !== null && <> · {r.jumps} jumps</>}
      </div>
      {quote.problems.length > 0 && (
        <Callout tone="danger" className="mt-4">
          {quote.problems.join(" ")} Split the cargo, or ask the haulers first.
        </Callout>
      )}
      <ol className="mt-6 space-y-4">
        <Step n={1} title="Courier contract, private, to">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{t.assignee.name || "—"}</span>
            <span className="text-xs text-subtle">({t.assignee.kind})</span>
            {t.assignee.name && <CopyButton value={t.assignee.name} />}
          </div>
        </Step>
        <Step n={2} title="Pick up at">
          <div className="text-sm">
            <span className="font-medium">{r.start.name}</span> <SystemText system={r.start.system} />
          </div>
        </Step>
        <Step n={3} title="Ship to">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-medium">{r.end.name}</span> <SystemText system={r.end.system} />
            <CopyButton value={r.end.name} />
          </div>
        </Step>
        <Step n={4} title="Reward">
          <Money value={quote.reward} />
        </Step>
        <Step n={5} title="Collateral">
          <Money value={quote.collateral} />
        </Step>
        <Step n={6} title="Expiration · Days to complete">
          <span className="text-sm">
            {t.expiration_days} day{t.expiration_days === 1 ? "" : "s"} · {t.days_to_complete} day{t.days_to_complete === 1 ? "" : "s"}
          </span>
        </Step>
      </ol>
    </div>
  );
}

/** Route, volume and collateral in; the contract out. `base` is the API the service lives under (members' or public). */
export function Calculator({ service, base }: { service: Service; base: string }) {
  const [routeId, setRouteId] = useState(String(service.routes[0]?.id ?? ""));
  const [volume, setVolume] = useState("");
  const [collateral, setCollateral] = useState("");
  const run = useMutation({
    mutationFn: () =>
      api.post<Quote>(`${base}/services/${service.id}/quote`, {
        route_id: Number(routeId),
        volume: parseAmount(volume),
        collateral: parseAmount(collateral),
      }),
    onError: (e: Error) => toast.error(e.message),
  });
  const route = service.routes.find((r) => String(r.id) === routeId);
  if (!service.routes.length) return <Callout tone="info">This service has no routes yet.</Callout>;
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <Card>
        <CardBody>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              run.mutate();
            }}
          >
            <Field label="Route" required>
              <Select
                value={routeId}
                onChange={(e) => {
                  setRouteId(e.target.value);
                  run.reset();
                }}
                options={service.routes.map((r) => ({ value: String(r.id), label: `${r.start.name} ${r.both_ways ? "⇄" : "→"} ${r.end.name}` }))}
              />
            </Field>
            {route && <RateFacts route={route} />}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Volume (m³)" required>
                <Input inputMode="decimal" value={volume} onChange={(e) => setVolume(e.target.value)} placeholder="e.g. 12,500" />
              </Field>
              <Field label="Collateral (ISK)" hint="What the cargo is worth: the hauler pays it if they lose it.">
                <Input inputMode="decimal" value={collateral} onChange={(e) => setCollateral(e.target.value)} placeholder="e.g. 1,500,000,000" />
              </Field>
            </div>
            <Button type="submit" variant="primary" loading={run.isPending} disabled={!routeId || !parseAmount(volume)}>
              Get a price
            </Button>
          </form>
        </CardBody>
      </Card>
      <div>{run.data ? <ContractSteps quote={run.data} /> : <Callout tone="info">Enter the volume and collateral for the reward and the exact contract to make.</Callout>}</div>
    </div>
  );
}

/** "1,500,000", "1.5b", "250m", "12k" → a number. */
export function parseAmount(text: string): number {
  const m = text.trim().toLowerCase().replace(/[,\s_]/g, "").match(/^(\d*\.?\d+)([kmb]?)$/);
  if (!m) return 0;
  return Number(m[1]) * ({ "": 1, k: 1e3, m: 1e6, b: 1e9 } as Record<string, number>)[m[2]];
}
