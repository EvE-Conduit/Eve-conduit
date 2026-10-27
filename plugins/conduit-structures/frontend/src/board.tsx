// The board: every structure the viewer may see, its fuel counting down, what it burns, and refuel claims.
import {
  api, Avatar, Badge, Button, Card, cn, Dialog, duration, dateTime, EmptyState, Field, humanize, Input, num, PageHeader, Progress, SearchInput,
  Segmented, Select, Skeleton, StatCard, Table, TableToolbar, Td, Th, THead, toast, Tooltip, Tr,
} from "@conduit/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";

import { Alert, Building, Fuel, Hand, Pencil, Settings, Truck, X } from "./icons";
import { BASE, type Board, hoursLabel, LEVEL, type Level, parseThresholds, STATE_TONE, type StructureRow, type Summary } from "./types";

const KEY = ["structures", "board"];
type Show = "all" | "low" | "empty";
type Sort = "fuel" | "name" | "system" | "burn";

/** Re-renders every ``ms`` so countdowns move between refetches. */
export function useNow(ms = 30_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), ms);
    return () => window.clearInterval(id);
  }, [ms]);
  return now;
}

const LOW: Level[] = ["warning", "danger", "empty"];
const FUEL_SCALE_HOURS = 30 * 24;

export function BoardPage() {
  const { data, isLoading } = useQuery({ queryKey: KEY, queryFn: () => api.get<Board>(`${BASE}/board`), refetchInterval: 300_000 });
  const [show, setShow] = useState<Show>("all");
  const [corp, setCorp] = useState("");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("fuel");
  const [claiming, setClaiming] = useState<StructureRow | null>(null);
  const [editing, setEditing] = useState<StructureRow | null>(null);
  const now = useNow();

  const rows = useMemo(() => {
    let out = data?.structures ?? [];
    if (show === "low") out = out.filter((s) => LOW.includes(s.level));
    if (show === "empty") out = out.filter((s) => s.level === "empty");
    if (corp) out = out.filter((s) => String(s.corporation.id) === corp);
    const needle = q.trim().toLowerCase();
    if (needle) out = out.filter((s) => [s.name, s.type.name, s.system.name, s.system.region, s.corporation.ticker].some((x) => x.toLowerCase().includes(needle)));
    const by: Record<Sort, (a: StructureRow, b: StructureRow) => number> = {
      fuel: () => 0, // the server's order: out of fuel, then least left
      name: (a, b) => a.name.localeCompare(b.name),
      system: (a, b) => a.system.name.localeCompare(b.system.name) || a.name.localeCompare(b.name),
      burn: (a, b) => b.burn - a.burn,
    };
    return [...out].sort(by[sort]);
  }, [data, show, corp, q, sort]);

  const all = data?.structures ?? [];
  const low = all.filter((s) => s.level === "warning" || s.level === "danger").length;
  const empty = all.filter((s) => s.level === "empty").length;
  const burn = all.reduce((t, s) => t + s.burn, 0);

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Structures & Fuel"
        icon={<Building />}
        description="Every structure your corporations own that you may see on the corporation sheets, with fuel left, what it burns and who's refuelling it."
        actions={
          <div className="flex gap-1">
            <Link to="/p/structures/plan"><Button variant="ghost"><Truck /> Fuel plan</Button></Link>
            {data?.can_manage && <Link to="/p/structures/settings"><Button variant="ghost"><Settings /> Settings</Button></Link>}
          </div>
        }
      />
      {isLoading || !data ? (
        <Skeleton className="h-64" />
      ) : all.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Building />}
            title={data.can_view ? "No structures yet" : "No corporations to show"}
            description={
              data.can_view
                ? "Structures show up once a Station Manager or Director's login syncs the corporation's Structures section."
                : "Structures follow the corporation sheet: you need permission to view a corporation to see its structures."
            }
          />
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Structures" value={all.length} icon={<Building />} hint={`${data.corporations.length} corporation${data.corporations.length === 1 ? "" : "s"}`} />
            <StatCard label="Below a threshold" value={low} icon={<Fuel />} tone={low ? "warning" : "success"} hint={`warnings at ${data.thresholds.map(hoursLabel).join(", ") || "none"}`} />
            <StatCard label="Out of fuel" value={empty} icon={<Alert />} tone={empty ? "danger" : "success"} />
            <StatCard label="Burning" value={`${num(Math.ceil(burn * 24))}`} icon={<Fuel />} hint="fuel blocks a day" />
          </div>
          <Card>
            <TableToolbar>
              <Segmented<Show>
                value={show}
                onChange={setShow}
                size="sm"
                options={[{ value: "all", label: "All" }, { value: "low", label: "Low" }, { value: "empty", label: "Out of fuel" }]}
                aria-label="Show"
              />
              {data.corporations.length > 1 && (
                <Select value={corp} onChange={(e) => setCorp(e.target.value)} className="w-48"
                  options={[{ value: "", label: "Every corporation" }, ...data.corporations.map((c) => ({ value: String(c.id), label: `[${c.ticker}] ${c.name}` }))]} />
              )}
              <Select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="w-44"
                options={[{ value: "fuel", label: "Least fuel first" }, { value: "burn", label: "Highest burn" }, { value: "system", label: "System" }, { value: "name", label: "Name" }]} />
              <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, type, system, region" className="ml-auto w-64" />
            </TableToolbar>
            {rows.length === 0 ? (
              <p className="px-card py-6 text-sm text-muted">Nothing matches.</p>
            ) : (
              <Table>
                <THead>
                  <tr>
                    <Th>Structure</Th>
                    <Th>Location</Th>
                    <Th>Fuel left</Th>
                    <Th align="right">Burn</Th>
                    <Th>Services</Th>
                    <Th>State</Th>
                    <Th align="right">Refuel</Th>
                  </tr>
                </THead>
                <tbody>
                  {rows.map((s) => (
                    <StructureItem key={s.id} s={s} now={now} canManage={data.can_manage} onClaim={() => setClaiming(s)} onEdit={() => setEditing(s)} />
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
        </div>
      )}
      {claiming && data && <ClaimDialog s={claiming} hours={data.claim_hours} onClose={() => setClaiming(null)} />}
      {editing && data && <EditDialog s={editing} defaults={data.thresholds} onClose={() => setEditing(null)} />}
    </>
  );
}

function fuelTone(level: Level) {
  return level === "danger" || level === "empty" ? "danger" : level === "warning" ? "warning" : level === "ok" ? "success" : "info";
}

function StructureItem({ s, now, canManage, onClaim, onEdit }: { s: StructureRow; now: number; canManage: boolean; onClaim: () => void; onEdit: () => void }) {
  const qc = useQueryClient();
  const release = useMutation({
    mutationFn: () => api.delete(`${BASE}/structures/${s.id}/claim`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["structures"] }),
    onError: (e: Error) => toast.error(e.message),
  });
  const tone = fuelTone(s.level);
  const hours = s.fuel_expires ? Math.max(0, (new Date(s.fuel_expires).getTime() - now) / 3_600_000) : null;
  const timer = s.state_timer_end && new Date(s.state_timer_end).getTime() > now;
  return (
    <Tr>
      <Td>
        <div className="flex min-w-0 items-center gap-3">
          <img src={s.type.icon} alt="" className="size-9 shrink-0 rounded-lg" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="truncate font-medium">{s.name}</span>
              {canManage && (
                <Button size="icon-sm" variant="ghost" onClick={onEdit} aria-label={`Fuel settings for ${s.name}`}><Pencil className="size-3.5" /></Button>
              )}
            </div>
            <div className="truncate text-xs text-muted">
              {s.type.name} · [{s.corporation.ticker}]
              {s.staging && ` · ${s.staging}`}
              {s.threshold_override && ` · warns at ${s.thresholds.map(hoursLabel).join(", ") || "never"}`}
            </div>
          </div>
        </div>
      </Td>
      <Td>
        <div className="text-sm">{s.system.name}{s.system.security != null && <span className="ml-1.5 font-mono text-xs text-subtle">{s.system.security.toFixed(1)}</span>}</div>
        <div className="text-xs text-muted">{s.system.region}</div>
      </Td>
      <Td className="min-w-48">
        <div className="mb-1 flex items-baseline justify-between gap-3 text-xs">
          <Tooltip content={s.fuel_expires ? `Runs out ${dateTime(s.fuel_expires)}${s.burn ? `, about ${num(s.blocks_left)} blocks in the bay` : ""}` : "No fuel reported"}>
            <span className={cn("font-mono tabular-nums", { danger: "text-danger-fg", warning: "text-warning-fg", success: "text-text", info: "text-muted" }[tone])}>
              {s.fuel_expires ? duration(s.fuel_expires, now) : "—"}
            </span>
          </Tooltip>
          <Badge tone={LEVEL[s.level].tone} size="xs">{LEVEL[s.level].label}</Badge>
        </div>
        <Progress value={hours != null ? hours / FUEL_SCALE_HOURS : 0} tone={tone} size="sm" label="Fuel remaining" />
      </Td>
      <Td numeric>
        <Tooltip content={`${s.burn_all !== s.burn ? `${num(s.burn_all)}/h with every service online. ` : ""}${s.need ? `${num(s.need)} blocks to top up` : "Topped up"}`}>
          <span>{s.burn ? `${num(s.burn)}/h` : "—"}</span>
        </Tooltip>
      </Td>
      <Td>
        <div className="flex max-w-72 flex-wrap gap-1">
          {s.services.length === 0 && <span className="text-xs text-subtle">none</span>}
          {s.services.map((sv) => (
            <Badge key={sv.name} tone={sv.state === "online" ? "success" : "neutral"} size="xs">
              {sv.name}{sv.module == null && " (?)"}
            </Badge>
          ))}
        </div>
      </Td>
      <Td>
        <Badge tone={STATE_TONE[s.state] ?? "neutral"} size="xs">{humanize(s.state)}</Badge>
        <div className="mt-1 text-xs text-subtle">
          {timer ? <span className="text-danger-fg">timer {duration(s.state_timer_end, now)}</span> : s.reinforce_hour != null && <>RF {String(s.reinforce_hour).padStart(2, "0")}:00 ET</>}
          {s.unanchors_at && <span className="ml-2 text-warning-fg">unanchoring</span>}
        </div>
      </Td>
      <Td align="right">
        <div className="flex items-center justify-end gap-2">
          {s.claims.length > 0 && (
            <div className="flex -space-x-1.5">
              {s.claims.slice(0, 3).map((c) => (
                <Tooltip key={c.user_id} content={`${c.user} is refuelling it${c.note ? `: ${c.note}` : ""}`}>
                  <span><Avatar src={c.portrait} name={c.user} size="xs" rounded="full" className="ring-2 ring-surface" /></span>
                </Tooltip>
              ))}
            </div>
          )}
          {s.my_claim ? (
            <Button size="icon-sm" variant="ghost" loading={release.isPending} onClick={() => release.mutate()} aria-label="I'm not refuelling it after all">
              {!release.isPending && <X />}
            </Button>
          ) : (
            (s.level !== "ok" && s.level !== "none") || s.need > 0 ? (
              <Button size="sm" variant={s.claims.length ? "ghost" : "outline"} onClick={onClaim}><Hand /> I'm on it</Button>
            ) : null
          )}
        </div>
      </Td>
    </Tr>
  );
}

function ClaimDialog({ s, hours, onClose }: { s: StructureRow; hours: number; onClose: () => void }) {
  const qc = useQueryClient();
  const [note, setNote] = useState("");
  const save = useMutation({
    mutationFn: () => api.post(`${BASE}/structures/${s.id}/claim`, { note }),
    onSuccess: () => {
      toast.success("Thanks! Others can see you're on it.");
      qc.invalidateQueries({ queryKey: ["structures"] });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={`Refuel ${s.name}`}
      description={`Say you're refuelling it so nobody else hauls the same blocks. Your claim ends by itself once its fuel goes up, or after ${hours} hours.`}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={save.isPending} onClick={() => save.mutate()}>I'm refuelling it</Button>
        </>
      }
    >
      <div className="mb-4 rounded-lg bg-surface-2 px-3 py-2 text-sm">
        {s.need > 0 ? <>About <span className="font-mono font-semibold">{num(s.need)}</span> fuel blocks ({num(s.need * 5)} m³) to top it up.</> : "It's already topped up for the plan."}
      </div>
      <Field label="Note (optional)" hint="e.g. which blocks, or when you'll be there">
        <Input value={note} maxLength={200} onChange={(e) => setNote(e.target.value)} autoFocus />
      </Field>
    </Dialog>
  );
}

function EditDialog({ s, defaults, onClose }: { s: StructureRow; defaults: number[]; onClose: () => void }) {
  const qc = useQueryClient();
  const [mode, setMode] = useState<"default" | "custom" | "never">(!s.threshold_override ? "default" : s.thresholds.length ? "custom" : "never");
  const [text, setText] = useState((s.threshold_override ? s.thresholds : defaults).map(hoursLabel).join(", "));
  const [staging, setStaging] = useState(s.staging);
  const parsed = parseThresholds(text);
  const save = useMutation({
    mutationFn: () => api.put(`${BASE}/structures/${s.id}`, { thresholds: mode === "default" ? null : mode === "never" ? [] : parsed, staging }),
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["structures"] });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={s.name}
      description="When to warn about this structure's fuel, and where it goes on the fuel plan."
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={save.isPending} disabled={mode === "custom" && !parsed?.length} onClick={() => save.mutate()}>Save</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Segmented
          value={mode}
          onChange={setMode}
          size="sm"
          options={[{ value: "default", label: "Default" }, { value: "custom", label: "Its own" }, { value: "never", label: "Never warn" }]}
          aria-label="Warnings"
        />
        {mode === "default" && <p className="text-sm text-muted">Warns at {defaults.map(hoursLabel).join(", ") || "nothing"}, like every structure.</p>}
        {mode === "custom" && (
          <Field label="Warn below" hint="Days or hours, e.g. 14d, 5d, 12h" error={parsed ? undefined : "Use days (7d) or hours (12h)"}>
            <Input value={text} onChange={(e) => setText(e.target.value)} className="font-mono" />
          </Field>
        )}
        <Field label="Staging (optional)" hint="Structures with the same staging are grouped on the fuel plan; otherwise by system.">
          <Input value={staging} maxLength={100} onChange={(e) => setStaging(e.target.value)} />
        </Field>
      </div>
    </Dialog>
  );
}

export function StructuresWidget() {
  const { data, isLoading } = useQuery({ queryKey: ["structures", "summary"], queryFn: () => api.get<Summary>(`${BASE}/summary`), refetchInterval: 300_000 });
  const now = useNow(60_000);
  if (isLoading || !data) return <Skeleton className="h-16" />;
  if (!data.structures) return <p className="text-sm text-muted">{data.can_view ? "No structures synced yet." : "No corporations' structures to show you."}</p>;
  return (
    <Link to="/p/structures" className="block space-y-3">
      <div className="flex items-end justify-between gap-6">
        <div>
          <div className="text-xs text-muted">Running low</div>
          <div className="mt-1 font-mono text-3xl font-semibold tabular-nums">{data.low}</div>
          <div className="text-xs text-subtle">of {data.structures} structures</div>
        </div>
        {data.danger > 0 ? <Badge tone="danger">{data.danger} critical</Badge> : data.low ? <Badge tone="warning">Needs fuel</Badge> : <Badge tone="success">All fuelled</Badge>}
      </div>
      {data.worst.length > 0 && (
        <ul className="space-y-1.5">
          {data.worst.map((w) => (
            <li key={w.id} className="flex items-center gap-2 text-sm">
              <img src={w.icon} alt="" className="size-5" />
              <span className="min-w-0 flex-1 truncate">{w.name} <span className="text-subtle">· {w.system}</span></span>
              {w.claimed && <Tooltip content="Someone is refuelling it"><span><Hand className="size-3.5 text-success-fg" /></span></Tooltip>}
              <span className={cn("font-mono text-xs tabular-nums", w.level === "warning" ? "text-warning-fg" : "text-danger-fg")}>
                {w.fuel_expires ? duration(w.fuel_expires, now) : "empty"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Link>
  );
}
