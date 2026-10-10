// The timer board: upcoming timers by day with live countdowns, who's going, and what came out recently.
import {
  api, Badge, Button, Card, cn, ConfirmDialog, dateTime, DropdownContent, DropdownItem, DropdownMenu, DropdownSeparator, DropdownTrigger,
  EmptyState, eveAndLocal, localDateTime, PageHeader, Skeleton, StatCard, TabPanel, Tabs, timeAgo, toast, Tooltip,
} from "@conduit/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useEffect, useState } from "react";

import { Editor } from "./editor";
import { Check, Dots, Pencil, Plus, Satellite, Settings, Shield, Swords, TimerIcon, Trash, Users } from "./icons";
import { SettingsDialog } from "./settings";
import { useNow } from "./now";
import { countdown, dayLabel, timeLeftText } from "./time";
import { BASE, type Board, KIND_LABEL, secTone, SIDE, type Timer } from "./types";

export function useBoard() {
  return useQuery({ queryKey: ["timers", "board"], queryFn: () => api.get<Board>(BASE), refetchInterval: 60_000 });
}

/** The live countdown, coloured by how close it is. */
export function Countdown({ t, now, className }: { t: Timer; now: number; className?: string }) {
  const ms = new Date(t.ends_at).getTime() - now;
  if (ms <= 0) {
    const ago = -ms;
    return ago < 3_600_000 ? (
      <span className={cn("inline-flex items-center gap-1.5 font-mono text-sm font-semibold uppercase tracking-wider text-danger-fg", className)}>
        <span className="size-1.5 animate-pulse rotate-45 bg-danger" aria-hidden /> Out now
      </span>
    ) : (
      <span className={cn("font-mono text-sm tabular-nums text-subtle", className)}>{timeAgo(t.ends_at)}</span>
    );
  }
  const tone = ms < 15 * 60_000 ? "text-danger-fg" : ms < 3_600_000 ? "text-warning-fg" : ms < 86_400_000 ? "text-text" : "text-muted";
  return <span className={cn("font-mono text-sm font-semibold tabular-nums", tone, className)}>{countdown(t.ends_at, now)}</span>;
}

export function KindBadge({ t }: { t: Timer }) {
  const tone = t.kind === "hull" ? "danger" : t.kind === "armor" ? "warning" : t.kind === "sov" ? "info" : "neutral";
  return <Badge tone={tone} size="xs">{KIND_LABEL[t.kind]}</Badge>;
}

export function SideBadge({ t }: { t: Timer }) {
  const s = SIDE[t.side];
  return (
    <Badge tone={s.badge} size="xs" variant="dot">
      {s.label}
    </Badge>
  );
}

export function SystemCell({ t }: { t: Timer }) {
  return (
    <span className="inline-flex min-w-0 items-baseline gap-1.5">
      <span className={cn("font-mono text-xs font-semibold tabular-nums", secTone(t.system.security))}>{t.system.security.toFixed(1)}</span>
      <span className="font-medium">{t.system.name}</span>
      {t.system.region && <span className="truncate text-xs text-subtle">{t.system.region}</span>}
    </span>
  );
}

function StructureCell({ t }: { t: Timer }) {
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      {t.icon ? (
        <img src={t.icon} alt="" className="size-8 shrink-0 border border-border bg-bg" loading="lazy" />
      ) : (
        <span className="grid size-8 shrink-0 place-items-center border border-border text-subtle"><TimerIcon /></span>
      )}
      <span className="min-w-0">
        <span className="flex items-center gap-1.5">
          <span className="truncate font-medium text-text">{t.name}</span>
          {t.important && <Badge tone="accent" size="xs">Everyone</Badge>}
        </span>
        <span className="block truncate text-xs text-subtle">
          {t.structure_type || "Structure"}
          {t.owner && <> · {t.owner}</>}
        </span>
      </span>
    </span>
  );
}

export function BoardPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useBoard();
  const now = useNow();
  const [editing, setEditing] = useState<Timer | "new" | null>(null);
  const [deleting, setDeleting] = useState<Timer | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const refresh = () => qc.invalidateQueries({ queryKey: ["timers"] });

  // Search results link to #t<id>: scroll there once the board is in.
  useEffect(() => {
    if (data && window.location.hash.startsWith("#t")) document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ block: "center" });
  }, [data]);

  const going = useMutation({
    mutationFn: (t: Timer) => api.post<{ going: boolean; going_count: number }>(`${BASE}/${t.id}/going`, { going: !t.going }),
    onSuccess: (r, t) => {
      refresh();
      toast.success(r.going ? `You're going: ${t.name}` : `You're no longer going to ${t.name}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: (id: number) => api.delete(`${BASE}/${id}`),
    onSuccess: () => { refresh(); toast.success("Timer removed"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const upcoming = data?.upcoming ?? [];
  const next = upcoming.find((t) => new Date(t.ends_at).getTime() > now);
  const ours = upcoming.filter((t) => t.side === "friendly").length;
  const hostile = upcoming.filter((t) => t.side === "hostile").length;
  const today = upcoming.filter((t) => dayLabel(t.ends_at, now).startsWith("Today")).length;
  const myCount = data?.going.length ?? 0;

  // Upcoming timers grouped by EVE day.
  const days: { label: string; timers: Timer[] }[] = [];
  for (const t of upcoming) {
    const label = dayLabel(t.ends_at, now);
    const last = days[days.length - 1];
    if (last && last.label === label) last.timers.push(t);
    else days.push({ label, timers: [t] });
  }

  const row = (t: Timer) => (
    <TimerRow key={t.id} t={t} now={now} canManage={!!data?.can_manage} onGoing={() => going.mutate(t)} onEdit={() => setEditing(t)} onDelete={() => setDeleting(t)} />
  );

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Timers"
        icon={<TimerIcon />}
        description="Structure and sovereignty timers with live countdowns. Say you're going and you'll be reminded before it comes out."
        actions={
          data?.can_manage ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="ghost" onClick={() => setSettingsOpen(true)}><Settings /> Settings</Button>
              <Button variant="primary" onClick={() => setEditing("new")}><Plus /> Add timer</Button>
            </div>
          ) : undefined
        }
      />

      {isLoading || !data ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}</div>
          <Skeleton className="h-64" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Next timer"
              icon={<TimerIcon />}
              tone={next ? (new Date(next.ends_at).getTime() - now < 3_600_000 ? "danger" : "accent") : undefined}
              value={next ? <Countdown t={next} now={now} className="text-2xl" /> : "—"}
              hint={next ? `${next.name} · ${next.system.name}` : "Nothing on the board"}
              mono={false}
            />
            <StatCard label="Coming out today" icon={<Satellite />} value={today} hint={today ? "by EVE time" : "a quiet day"} />
            <StatCard label="Upcoming" icon={<Shield />} value={upcoming.length} hint={`${ours} ours · ${hostile} hostile`} />
            <StatCard label="I'm going to" icon={<Users />} value={myCount} tone={myCount ? "success" : undefined} hint={myCount ? "you'll be reminded" : "press Going on a timer"} />
          </div>

          <Tabs
            variant="pills"
            defaultValue="upcoming"
            className="space-y-4"
            items={[
              { value: "upcoming", label: "Upcoming", count: upcoming.length, icon: <Swords /> },
              { value: "past", label: "Came out", count: data.past.length },
            ]}
          >
            <TabPanel value="upcoming">
              {upcoming.length === 0 ? (
                <Card>
                  <EmptyState
                    icon={<TimerIcon />}
                    title="No timers on the board"
                    description={data.can_manage
                      ? "Add one from the in-game timer. Reinforced corporation structures and timers in members' notifications are added by themselves."
                      : "Nothing is coming out of reinforcement. Timers from your corporation's structures show up here on their own."}
                    action={data.can_manage ? <Button variant="primary" onClick={() => setEditing("new")}><Plus /> Add timer</Button> : undefined}
                  />
                </Card>
              ) : (
                <div className="space-y-6">
                  {days.map((d) => (
                    <section key={d.label}>
                      <h2 className="hud-label mb-2 flex items-center gap-3 text-text">
                        {d.label}
                        <span className="h-px flex-1 bg-border" aria-hidden />
                        <span className="text-xs font-normal normal-case tracking-normal text-subtle">{d.timers.length} timer{d.timers.length === 1 ? "" : "s"}</span>
                      </h2>
                      <Card className="overflow-hidden">
                        <ul className="divide-y divide-border">{d.timers.map(row)}</ul>
                      </Card>
                    </section>
                  ))}
                </div>
              )}
            </TabPanel>
            <TabPanel value="past">
              {data.past.length === 0 ? (
                <Card><EmptyState icon={<TimerIcon />} title="Nothing came out recently" description="Timers stay here for a while after they come out." /></Card>
              ) : (
                <Card className="overflow-hidden">
                  <ul className="divide-y divide-border opacity-80">{data.past.map(row)}</ul>
                </Card>
              )}
            </TabPanel>
          </Tabs>
        </div>
      )}

      {editing && <Editor timer={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
      {settingsOpen && <SettingsDialog onClose={() => setSettingsOpen(false)} />}
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        danger
        title={`Remove "${deleting?.name}"?`}
        description="It disappears from the board for everyone. People who said they're going aren't told."
        confirmLabel={<><Trash /> Remove</>}
        onConfirm={() => deleting && del.mutateAsync(deleting.id)}
      />
    </>
  );
}

function TimerRow({ t, now, canManage, onGoing, onEdit, onDelete }: {
  t: Timer; now: number; canManage: boolean; onGoing: () => void; onEdit: () => void; onDelete: () => void;
}) {
  const side = SIDE[t.side];
  const past = new Date(t.ends_at).getTime() <= now;
  const [open, setOpen] = useState(false);
  return (
    <li id={`t${t.id}`} className="relative scroll-mt-24">
      <span className={cn("absolute inset-y-0 left-0 w-1", side.stripe)} aria-hidden />
      <div className="grid gap-x-4 gap-y-2 px-card py-3 pl-5 sm:grid-cols-[150px_minmax(0,1.4fr)_minmax(0,1fr)_auto] sm:items-center">
        <div className="flex items-center justify-between gap-2 sm:block">
          <Countdown t={t} now={now} />
          <Tooltip content={eveAndLocal(t.ends_at)}>
            <span className="block text-xs text-subtle">{new Date(t.ends_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" })} ET</span>
          </Tooltip>
        </div>
        <button type="button" className="min-w-0 text-left" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          <StructureCell t={t} />
        </button>
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          <SystemCell t={t} />
          <span className="flex items-center gap-1.5"><KindBadge t={t} /><SideBadge t={t} /></span>
        </div>
        <div className="flex items-center justify-end gap-2">
          <Tooltip content={t.going_names.length ? t.going_names.join(", ") : "Nobody has said they're going yet"}>
            <span className="inline-flex items-center gap-1 text-xs text-muted"><Users className="size-3.5" /> {t.going_count}</span>
          </Tooltip>
          {!past && (
            <Button variant={t.going ? "success" : "secondary"} size="xs" onClick={onGoing} aria-pressed={t.going}>
              {t.going ? <><Check /> Going</> : "Going?"}
            </Button>
          )}
          {canManage && (
            <DropdownMenu>
              <DropdownTrigger asChild>
                <Button variant="ghost" size="icon-xs" aria-label={`Options for ${t.name}`}><Dots /></Button>
              </DropdownTrigger>
              <DropdownContent align="end">
                <DropdownItem onSelect={onEdit}><Pencil /> Edit</DropdownItem>
                <DropdownSeparator />
                <DropdownItem danger onSelect={onDelete}><Trash /> Remove</DropdownItem>
              </DropdownContent>
            </DropdownMenu>
          )}
        </div>
      </div>
      {open && (
        <div className="border-t border-border bg-bg/40 px-card py-3 pl-5 text-sm">
          <Detail label="Comes out">{eveAndLocal(t.ends_at)} {!past && <span className="text-subtle">(in {timeLeftText(t.ends_at, now)})</span>}</Detail>
          {t.notes && <Detail label="Notes"><span className="whitespace-pre-wrap">{t.notes}</span></Detail>}
          {t.going_names.length > 0 && <Detail label={`Going (${t.going_count})`}>{t.going_names.join(", ")}{t.going_count > t.going_names.length && " …"}</Detail>}
          <Detail label="From">
            {t.source === "structure" ? "the corporation's structures" : t.source === "notification" ? "an in-game notification" : t.created_by?.name ?? "someone"}
            <span className="text-subtle"> · updated {timeAgo(t.updated_at)}</span>
          </Detail>
          <Detail label="Exact">{dateTime(t.ends_at)} · {localDateTime(t.ends_at)} local</Detail>
        </div>
      )}
    </li>
  );
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3 py-0.5">
      <span className="w-24 shrink-0 text-xs uppercase tracking-wider text-subtle">{label}</span>
      <span className="min-w-0 text-text">{children}</span>
    </div>
  );
}
