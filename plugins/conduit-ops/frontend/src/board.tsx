// The ops calendar: upcoming ops by day with live countdowns and RSVPs, a month calendar, and recent ops.
import {
  api, Badge, Button, Card, cn, ConfirmDialog, dateTime, Dialog, DropdownContent, DropdownItem, DropdownMenu, DropdownSeparator,
  DropdownTrigger, EmptyState, eveAndLocal, Input, PageHeader, Select, Skeleton, StatCard, TabPanel, Tabs, timeAgo, toast, Tooltip,
} from "@conduit/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useEffect, useState } from "react";
import { Link } from "react-router";

import { Editor } from "./editor";
import { Ban, CalendarIcon, Check, ChevronLeft, ChevronRight, Clock, Dots, List, MapPin, Mic, Pencil, Plus, Settings, Shield, Swords, Trash, Users } from "./icons";
import { useNow } from "./now";
import { SettingsDialog } from "./settings";
import { countdown, dayLabel, eveClock, eveDay, lengthText, monthGrid } from "./time";
import { type Answer, ANSWERS, BASE, type Board, fcName, KIND_LABEL, KIND_STYLE, type Op } from "./types";

export function useBoard() {
  return useQuery({ queryKey: ["ops", "board"], queryFn: () => api.get<Board>(BASE), refetchInterval: 60_000 });
}

/** The live countdown to form-up, coloured by how close it is; "Live" while the op runs. */
export function Countdown({ op, now, className }: { op: Op; now: number; className?: string }) {
  if (op.status === "cancelled") return <span className={cn("font-mono text-sm uppercase tracking-wider text-subtle line-through", className)}>Cancelled</span>;
  const start = new Date(op.starts_at).getTime();
  if (start <= now) {
    return new Date(op.ends_at).getTime() > now ? (
      <span className={cn("inline-flex items-center gap-1.5 font-mono text-sm font-semibold uppercase tracking-wider text-success-fg", className)}>
        <span className="size-1.5 animate-pulse rotate-45 bg-success" aria-hidden /> Live
      </span>
    ) : (
      <span className={cn("font-mono text-sm tabular-nums text-subtle", className)}>{timeAgo(op.starts_at)}</span>
    );
  }
  const ms = start - now;
  const tone = ms < 15 * 60_000 ? "text-danger-fg" : ms < 3_600_000 ? "text-warning-fg" : ms < 86_400_000 ? "text-text" : "text-muted";
  return <span className={cn("font-mono text-sm font-semibold tabular-nums", tone, className)}>{countdown(op.starts_at, now)}</span>;
}

export function KindBadge({ op }: { op: Op }) {
  return <Badge tone={KIND_STYLE[op.kind].badge} size="xs">{KIND_LABEL[op.kind]}</Badge>;
}

export function AnswerBadge({ answer }: { answer: Answer | null }) {
  if (answer === "going") return <Badge tone="success" size="xs">Going</Badge>;
  if (answer === "maybe") return <Badge tone="warning" size="xs">Maybe</Badge>;
  if (answer === "declined") return <Badge tone="neutral" size="xs">Not going</Badge>;
  return null;
}

/** Going / maybe / can't, the character to bring and a note for the FC. */
function RsvpControl({ op, board }: { op: Op; board: Board }) {
  const qc = useQueryClient();
  const [note, setNote] = useState(op.my_note);
  useEffect(() => setNote(op.my_note), [op.my_note]);
  const answer = useMutation({
    mutationFn: (body: { answer: Answer | null; character_id?: number | null; note?: string }) =>
      api.post<Op>(`${BASE}/${op.id}/rsvp`, { character_id: op.my_character, note, ...body }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["ops"] });
      if (r.my_answer !== op.my_answer) toast.success(r.my_answer === "going" ? `You're going: ${op.title}` : r.my_answer ? "Answer saved" : "Answer taken back");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  if (op.status === "cancelled" || op.status === "past") return null;
  const attending = op.my_answer === "going" || op.my_answer === "maybe";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex" role="group" aria-label="Your answer">
        {ANSWERS.map((a) => {
          const on = op.my_answer === a.value;
          return (
            <Button
              key={a.value}
              size="xs"
              variant={on ? (a.value === "going" ? "success" : a.value === "maybe" ? "secondary" : "ghost") : "ghost"}
              aria-pressed={on}
              className={cn("border border-border", on && "border-border-strong")}
              loading={answer.isPending && answer.variables?.answer === a.value}
              onClick={() => answer.mutate({ answer: on ? null : a.value })}
            >
              {on && <Check />} {a.label}
            </Button>
          );
        })}
      </div>
      {attending && board.characters.length > 1 && (
        <Select
          aria-label="Character"
          className="h-7 w-44 text-xs"
          value={String(op.my_character ?? board.main_character ?? "")}
          onChange={(e) => answer.mutate({ answer: op.my_answer, character_id: Number(e.target.value) })}
          options={board.characters.map((c) => ({ value: String(c.id), label: c.name }))}
        />
      )}
      {attending && (
        <Input
          aria-label="Note for the FC"
          className="h-7 w-48 text-xs"
          value={note}
          maxLength={120}
          placeholder="Note for the FC (optional)"
          onChange={(e) => setNote(e.target.value)}
          onBlur={() => note !== op.my_note && answer.mutate({ answer: op.my_answer, note })}
          onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
        />
      )}
    </div>
  );
}

/** Everything about an op: when, where, who leads, the doctrine, who's coming. */
function OpDetails({ op, board, now }: { op: Op; board: Board; now: number }) {
  const going = op.rsvps.filter((r) => r.answer === "going");
  const maybe = op.rsvps.filter((r) => r.answer === "maybe");
  const declined = op.rsvps.filter((r) => r.answer === "declined");
  const names = (rows: typeof going) =>
    rows.map((r) => (r.character && r.character !== r.user ? `${r.user} (${r.character})` : r.user) + (r.note ? ` — ${r.note}` : "")).join(", ");
  return (
    <div className="space-y-0.5 text-sm">
      <Detail label="Forms up">
        {eveAndLocal(op.starts_at)}
        {op.status === "upcoming" && <span className="text-subtle"> (in {countdown(op.starts_at, now)})</span>}
        <span className="text-subtle"> · about {lengthText(op.duration_minutes)}</span>
      </Detail>
      {fcName(op) && <Detail label="FC">{fcName(op)}</Detail>}
      {op.formup && <Detail label="Form-up">{op.formup}</Detail>}
      {op.comms && <Detail label="Comms">{op.comms}</Detail>}
      {op.doctrine && (
        <Detail label="Doctrine">
          {op.doctrine.link ? <Link to={op.doctrine.link} className="text-accent hover:underline">{op.doctrine.name}</Link> : op.doctrine.name}
        </Detail>
      )}
      {(op.states.length > 0 || op.groups.length > 0) && (
        <Detail label="For">
          <span className="flex flex-wrap gap-1">
            {op.states.map((s) => <Badge key={`s${s.id}`} size="xs" color={s.color}>{s.name}</Badge>)}
            {op.groups.map((g) => <Badge key={`g${g.id}`} size="xs" tone="neutral">{g.name}</Badge>)}
          </span>
        </Detail>
      )}
      {op.description && <Detail label="Details"><span className="whitespace-pre-wrap">{op.description}</span></Detail>}
      {going.length > 0 && <Detail label={`Going (${going.length})`}>{names(going)}</Detail>}
      {maybe.length > 0 && <Detail label={`Maybe (${maybe.length})`}>{names(maybe)}</Detail>}
      {declined.length > 0 && <Detail label={`Can't (${declined.length})`}>{names(declined)}</Detail>}
      <Detail label="Posted by">
        {op.created_by?.name ?? "someone"}
        <span className="text-subtle"> · updated {timeAgo(op.updated_at)}</span>
      </Detail>
      {op.status !== "cancelled" && op.status !== "past" && (
        <div className="pt-2">
          <RsvpControl op={op} board={board} />
        </div>
      )}
    </div>
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

function OpRow({ op, board, now, onEdit, onCancel, onDelete }: {
  op: Op; board: Board; now: number; onEdit: () => void; onCancel: () => void; onDelete: () => void;
}) {
  const [open, setOpen] = useState(() => window.location.hash === `#o${op.id}`);
  const done = op.status === "cancelled" || op.status === "past";
  return (
    <li id={`o${op.id}`} className={cn("relative scroll-mt-24", op.status === "cancelled" && "opacity-60")}>
      <span className={cn("absolute inset-y-0 left-0 w-1", KIND_STYLE[op.kind].stripe)} aria-hidden />
      <div className="grid gap-x-4 gap-y-2 px-card py-3 pl-5 sm:grid-cols-[130px_minmax(0,1.6fr)_minmax(0,1fr)_auto] sm:items-center">
        <div className="flex items-center justify-between gap-2 sm:block">
          <Countdown op={op} now={now} />
          <Tooltip content={eveAndLocal(op.starts_at)}>
            <span className="block text-xs text-subtle">{eveClock(op.starts_at)} ET · {lengthText(op.duration_minutes)}</span>
          </Tooltip>
        </div>
        <button type="button" className="min-w-0 text-left" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          <span className="flex items-center gap-1.5">
            <span className={cn("truncate font-medium text-text", op.status === "cancelled" && "line-through")}>{op.title}</span>
            {op.important && <Badge tone="accent" size="xs">Everyone</Badge>}
          </span>
          <span className="block truncate text-xs text-subtle">
            {fcName(op) ? `FC ${fcName(op)}` : "FC to be announced"}
            {op.doctrine && <> · {op.doctrine.name}</>}
          </span>
        </button>
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          <KindBadge op={op} />
          {op.formup && <span className="inline-flex min-w-0 items-center gap-1"><MapPin className="size-3.5 shrink-0" /><span className="truncate">{op.formup}</span></span>}
          {op.comms && <span className="inline-flex min-w-0 items-center gap-1"><Mic className="size-3.5 shrink-0" /><span className="truncate">{op.comms}</span></span>}
        </div>
        <div className="flex items-center justify-end gap-2">
          <Tooltip content={`${op.counts.going} going · ${op.counts.maybe} maybe`}>
            <span className="inline-flex items-center gap-1 text-xs text-muted"><Users className="size-3.5" /> {op.counts.going}{op.counts.maybe ? `+${op.counts.maybe}` : ""}</span>
          </Tooltip>
          {done ? <AnswerBadge answer={op.my_answer} /> : (
            <Button
              variant={op.my_answer === "going" ? "success" : "secondary"}
              size="xs"
              onClick={() => setOpen(true)}
              aria-label={`Answer ${op.title}`}
            >
              {op.my_answer === "going" ? <><Check /> Going</> : op.my_answer === "maybe" ? "Maybe" : op.my_answer === "declined" ? "Not going" : "Going?"}
            </Button>
          )}
          {op.can_edit && op.status !== "cancelled" && (
            <DropdownMenu>
              <DropdownTrigger asChild>
                <Button variant="ghost" size="icon-xs" aria-label={`Options for ${op.title}`}><Dots /></Button>
              </DropdownTrigger>
              <DropdownContent align="end">
                <DropdownItem onSelect={onEdit}><Pencil /> Edit</DropdownItem>
                {!done && <DropdownItem onSelect={onCancel}><Ban /> Cancel op</DropdownItem>}
                <DropdownSeparator />
                <DropdownItem danger onSelect={onDelete}><Trash /> Delete</DropdownItem>
              </DropdownContent>
            </DropdownMenu>
          )}
        </div>
      </div>
      {open && (
        <div className="border-t border-border bg-bg/40 px-card py-3 pl-5">
          <OpDetails op={op} board={board} now={now} />
        </div>
      )}
    </li>
  );
}

/** A month of ops by EVE day. Clicking an op opens it. */
function CalendarView({ now, onOpen }: { now: number; onOpen: (op: Op) => void }) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date(now);
    return { year: d.getUTCFullYear(), month: d.getUTCMonth() };
  });
  const key = `${cursor.year}-${String(cursor.month + 1).padStart(2, "0")}`;
  const { data, isLoading } = useQuery({ queryKey: ["ops", "month", key], queryFn: () => api.get<Op[]>(`${BASE}/month?month=${key}`) });
  const byDay = new Map<string, Op[]>();
  for (const op of data ?? []) {
    const d = eveDay(op.starts_at);
    byDay.set(d, [...(byDay.get(d) ?? []), op]);
  }
  const today = eveDay(now);
  const move = (n: number) => setCursor((c) => {
    const m = c.month + n;
    return { year: c.year + Math.floor(m / 12), month: ((m % 12) + 12) % 12 };
  });
  const title = new Date(Date.UTC(cursor.year, cursor.month, 1)).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-border px-card py-2">
        <Button variant="ghost" size="icon-xs" aria-label="Previous month" onClick={() => move(-1)}><ChevronLeft /></Button>
        <span className="font-medium">{title} <span className="text-xs text-subtle">· EVE time</span></span>
        <Button variant="ghost" size="icon-xs" aria-label="Next month" onClick={() => move(1)}><ChevronRight /></Button>
      </div>
      {isLoading ? (
        <Skeleton className="h-96" />
      ) : (
        <div className="overflow-x-auto">
          <div className="grid min-w-[640px] grid-cols-7 text-xs">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d} className="border-b border-border px-2 py-1 text-subtle uppercase tracking-wider">{d}</div>
            ))}
            {monthGrid(cursor.year, cursor.month).flat().map((day) => {
              const inMonth = Number(day.slice(5, 7)) === cursor.month + 1;
              const ops = byDay.get(day) ?? [];
              return (
                <div key={day} className={cn("min-h-24 border-b border-r border-border p-1", !inMonth && "bg-bg/40 text-subtle")}>
                  <div className={cn("mb-1 text-right tabular-nums", day === today && "font-semibold text-accent")}>{Number(day.slice(8))}</div>
                  <ul className="space-y-0.5">
                    {ops.map((op) => (
                      <li key={op.id}>
                        <button
                          type="button"
                          onClick={() => onOpen(op)}
                          className={cn("flex w-full items-center gap-1 truncate bg-surface px-1 py-0.5 text-left hover:bg-hover", op.status === "cancelled" && "line-through opacity-60")}
                        >
                          <span className={cn("size-1.5 shrink-0", KIND_STYLE[op.kind].stripe)} aria-hidden />
                          <span className="tabular-nums text-subtle">{eveClock(op.starts_at)}</span>
                          <span className="truncate text-text">{op.title}</span>
                          {op.my_answer === "going" && <Check className="size-3 shrink-0 text-success-fg" />}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}

export function CalendarPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useBoard();
  const now = useNow();
  const [editing, setEditing] = useState<Op | "new" | null>(null);
  const [cancelling, setCancelling] = useState<Op | null>(null);
  const [deleting, setDeleting] = useState<Op | null>(null);
  const [viewing, setViewing] = useState<Op | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const refresh = () => qc.invalidateQueries({ queryKey: ["ops"] });

  // Search results and notifications link to #o<id>: scroll there once the list is in.
  useEffect(() => {
    if (data && window.location.hash.startsWith("#o")) document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ block: "center" });
  }, [data]);

  const cancel = useMutation({
    mutationFn: (id: number) => api.post(`${BASE}/${id}/cancel`, {}),
    onSuccess: () => { refresh(); toast.success("Op cancelled; everyone who answered was told"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: (id: number) => api.delete(`${BASE}/${id}`),
    onSuccess: () => { refresh(); toast.success("Op deleted"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const upcoming = data?.upcoming ?? [];
  const next = upcoming.find((op) => new Date(op.starts_at).getTime() > now);
  const live = upcoming.filter((op) => op.status === "live").length;
  const week = upcoming.filter((op) => new Date(op.starts_at).getTime() - now < 7 * 86_400_000).length;
  const mine = upcoming.filter((op) => op.my_answer === "going").length;
  const unanswered = upcoming.filter((op) => !op.my_answer && op.status === "upcoming").length;
  // A fresh copy of the op being viewed from the calendar, so answering updates the dialog.
  const viewed = viewing ? (upcoming.find((op) => op.id === viewing.id) ?? data?.past.find((op) => op.id === viewing.id) ?? viewing) : null;

  const days: { label: string; ops: Op[] }[] = [];
  for (const op of upcoming) {
    const label = dayLabel(op.starts_at, now);
    const last = days[days.length - 1];
    if (last && last.label === label) last.ops.push(op);
    else days.push({ label, ops: [op] });
  }

  const row = (op: Op) =>
    data && <OpRow key={op.id} op={op} board={data} now={now} onEdit={() => setEditing(op)} onCancel={() => setCancelling(op)} onDelete={() => setDeleting(op)} />;

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Ops calendar"
        icon={<CalendarIcon />}
        description="CTAs, stratops, roams and everything else on one calendar, in EVE time. Say whether you're coming and you'll be reminded before form-up."
        actions={
          data?.can_schedule ? (
            <div className="flex flex-wrap items-center gap-2">
              {data.can_manage && <Button variant="ghost" onClick={() => setSettingsOpen(true)}><Settings /> Settings</Button>}
              <Button variant="primary" onClick={() => setEditing("new")}><Plus /> Schedule op</Button>
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
              label="Next op"
              icon={<Clock />}
              tone={next ? (new Date(next.starts_at).getTime() - now < 3_600_000 ? "danger" : "accent") : undefined}
              value={next ? <Countdown op={next} now={now} className="text-2xl" /> : "—"}
              hint={next ? `${next.title} · ${eveClock(next.starts_at)} ET` : "Nothing scheduled"}
              mono={false}
            />
            <StatCard label="Next 7 days" icon={<CalendarIcon />} value={week} hint={live ? `${live} running now` : "ops scheduled"} />
            <StatCard label="I'm going to" icon={<Users />} value={mine} tone={mine ? "success" : undefined} hint={mine ? "you'll be reminded" : "answer an op"} />
            <StatCard label="Not answered" icon={<Shield />} value={unanswered} tone={unanswered ? "warning" : undefined} hint={unanswered ? "let your FC know" : "all answered"} />
          </div>

          <Tabs
            variant="pills"
            defaultValue="list"
            className="space-y-4"
            items={[
              { value: "list", label: "Upcoming", count: upcoming.length, icon: <List /> },
              { value: "calendar", label: "Calendar", icon: <CalendarIcon /> },
              { value: "past", label: "Recent", count: data.past.length },
            ]}
          >
            <TabPanel value="list">
              {upcoming.length === 0 ? (
                <Card>
                  <EmptyState
                    icon={<Swords />}
                    title="No ops scheduled"
                    description={data.can_schedule ? "Schedule one and its audience is told under the bell." : "When an FC schedules an op, it shows up here."}
                    action={data.can_schedule ? <Button variant="primary" onClick={() => setEditing("new")}><Plus /> Schedule op</Button> : undefined}
                  />
                </Card>
              ) : (
                <div className="space-y-6">
                  {days.map((d) => (
                    <section key={d.label}>
                      <h2 className="hud-label mb-2 flex items-center gap-3 text-text">
                        {d.label}
                        <span className="h-px flex-1 bg-border" aria-hidden />
                        <span className="text-xs font-normal normal-case tracking-normal text-subtle">{d.ops.length} op{d.ops.length === 1 ? "" : "s"}</span>
                      </h2>
                      <Card className="overflow-hidden">
                        <ul className="divide-y divide-border">{d.ops.map(row)}</ul>
                      </Card>
                    </section>
                  ))}
                </div>
              )}
            </TabPanel>
            <TabPanel value="calendar">
              <CalendarView now={now} onOpen={setViewing} />
            </TabPanel>
            <TabPanel value="past">
              {data.past.length === 0 ? (
                <Card><EmptyState icon={<CalendarIcon />} title="No recent ops" description="Finished and cancelled ops stay here for a while." /></Card>
              ) : (
                <Card className="overflow-hidden">
                  <ul className="divide-y divide-border opacity-90">{data.past.map(row)}</ul>
                </Card>
              )}
            </TabPanel>
          </Tabs>
        </div>
      )}

      {viewed && data && (
        <Dialog
          open
          onOpenChange={(o) => !o && setViewing(null)}
          title={viewed.title}
          size="lg"
          footer={
            <>
              {viewed.can_edit && viewed.status !== "cancelled" && (
                <Button variant="ghost" className="mr-auto" onClick={() => { setEditing(viewed); setViewing(null); }}><Pencil /> Edit</Button>
              )}
              <Button variant="secondary" onClick={() => setViewing(null)}>Close</Button>
            </>
          }
        >
          <div className="mb-3 flex items-center gap-2"><KindBadge op={viewed} /><Countdown op={viewed} now={now} /></div>
          <OpDetails op={viewed} board={data} now={now} />
        </Dialog>
      )}
      {editing && <Editor op={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
      {settingsOpen && <SettingsDialog onClose={() => setSettingsOpen(false)} />}
      <ConfirmDialog
        open={!!cancelling}
        onOpenChange={(o) => !o && setCancelling(null)}
        danger
        title={`Cancel "${cancelling?.title}"?`}
        description={`Everyone who said they're going or maybe is told, and webhooks hear about it. It stays on the calendar, crossed out. Planned for ${cancelling ? dateTime(cancelling.starts_at) : ""}.`}
        confirmLabel={<><Ban /> Cancel op</>}
        onConfirm={() => cancelling && cancel.mutateAsync(cancelling.id)}
      />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        danger
        title={`Delete "${deleting?.title}"?`}
        description="It disappears for everyone without anyone being told. To call an op off, cancel it instead."
        confirmLabel={<><Trash /> Delete</>}
        onConfirm={() => deleting && del.mutateAsync(deleting.id)}
      />
    </>
  );
}
