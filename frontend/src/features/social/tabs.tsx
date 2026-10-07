import { useQuery } from "@tanstack/react-query";
import { Ban, Bell, CalendarDays, ClipboardCopy, Crosshair, Eye, Inbox, Mail, Radar, Search, Shield, Skull, Star, Swords, Users } from "lucide-react";
import { useDeferredValue, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

import { PagedTable, SegmentTabs, type Column } from "@/components/DataTable";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { EmptyState, StatCard } from "@/components/ui/page";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip } from "@/components/ui/tooltip";
import { api } from "@/lib/api";
import { date, dateTime, duration, humanize, isk, num } from "@/lib/format";
import { cn, timeAgo } from "@/lib/utils";

import { useSection } from "../sheet/hooks";
import { Security, TypeIcon } from "../sheet/components";
import type { CharacterHeader, EveType } from "../sheet/types";

const base = (h: CharacterHeader) => `/api/characters/${h.id}`;

/** EVE's contact standing colours: excellent, good, neutral, bad, terrible. */
export function standingColor(s: number) {
  if (s > 5) return "#2f6fdb";
  if (s > 0) return "#4fa3f7";
  if (s === 0) return "var(--subtle)";
  if (s >= -5) return "#f08a24";
  return "#d93a2b";
}

function StandingPill({ value }: { value: number }) {
  return (
    <span className="inline-flex min-w-12 justify-center rounded-md px-1.5 py-0.5 font-mono text-xs font-semibold tabular-nums text-white" style={{ background: standingColor(value) }}>
      {value > 0 ? "+" : ""}
      {value.toFixed(1)}
    </span>
  );
}

// --- Mail ----------------------------------------------------------------------

interface MailRow {
  mail_id: number;
  subject: string;
  sender: { id: number; name: string } | null;
  recipients: { id: number; type: string; name: string }[];
  timestamp: string;
  is_read: boolean;
  labels: number[];
  preview: string;
}

export function MailTab({ header }: { header: CharacterHeader }) {
  const labels = useSection<{ id: number; name: string; unread: number }[]>(header.id, "mail/labels");
  const [label, setLabel] = useState<number | null>(null);
  const [q, setQ] = useState("");
  const query = useDeferredValue(q);
  const [open, setOpen] = useState<MailRow | null>(null);
  const columns: Column<MailRow>[] = [
    {
      header: "From",
      cell: (m) => (
        <div className="flex items-center gap-2.5">
          {m.sender && <Avatar src={`https://images.evetech.net/characters/${m.sender.id}/portrait?size=64`} name={m.sender.name} size="xs" rounded="full" />}
          <span className={cn("truncate", !m.is_read && "font-semibold")}>{m.sender?.name ?? "—"}</span>
        </div>
      ),
      className: "max-w-[200px]",
    },
    {
      header: "Subject",
      cell: (m) => (
        <div className="min-w-0">
          <div className={cn("truncate", !m.is_read ? "font-semibold text-text" : "text-muted")}>{m.subject}</div>
          <div className="truncate text-xs text-subtle">{m.preview}</div>
        </div>
      ),
      className: "max-w-lg",
    },
    { header: "Received", cell: (m) => dateTime(m.timestamp), className: "whitespace-nowrap text-xs text-muted" },
  ];
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[180px_minmax(0,1fr)]">
      <Card className="h-fit p-2">
        <button onClick={() => setLabel(null)} className={cn("flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm", label === null ? "bg-accent-soft text-text" : "text-muted hover:bg-hover-strong")}>
          <Inbox className="size-4" /> All mail
        </button>
        {labels.data?.map((l) => (
          <button key={l.id} onClick={() => setLabel(l.id)} className={cn("flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm", label === l.id ? "bg-accent-soft text-text" : "text-muted hover:bg-hover-strong")}>
            <Mail className="size-4" />
            <span className="flex-1 truncate text-left">{l.name}</span>
            {l.unread > 0 && <span className="rounded-none bg-accent px-1.5 text-[11px] font-semibold text-accent-fg">{l.unread}</span>}
          </button>
        ))}
      </Card>
      <Card>
        <div className="px-5 py-3">
          <div className="relative max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-subtle" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search subject and text" className="h-8 pl-8 text-xs" />
          </div>
        </div>
        <PagedTable<MailRow>
          url={`${base(header)}/mail`}
          params={`q=${encodeURIComponent(query)}${label !== null ? `&label=${label}` : ""}`}
          columns={columns}
          rowKey={(m) => m.mail_id}
          onRowClick={setOpen}
          empty={{ icon: <Inbox />, title: "No mail here" }}
        />
      </Card>
      {open && <MailDialog header={header} mail={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

function MailDialog({ header, mail, onClose }: { header: CharacterHeader; mail: MailRow; onClose: () => void }) {
  const { data } = useQuery({ queryKey: ["mail", header.id, mail.mail_id], queryFn: () => api.get<MailRow & { body: string; body_loaded: boolean }>(`${base(header)}/mail/${mail.mail_id}`) });
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()} title={mail.subject} description={`From ${mail.sender?.name ?? "unknown"} · ${dateTime(mail.timestamp)}`} className="max-w-2xl">
      <div className="mb-4 flex flex-wrap gap-1.5 text-xs">
        <span className="text-subtle">To</span>
        {mail.recipients.map((r) => (
          <Badge key={r.id}>{r.name}</Badge>
        ))}
      </div>
      {!data ? <Skeleton className="h-40" /> : <div className="whitespace-pre-wrap text-sm leading-relaxed text-muted">{data.body_loaded ? data.body || "(empty)" : "The message text is still being fetched."}</div>}
    </Dialog>
  );
}

// --- Notifications ---------------------------------------------------------------

interface NotificationRow {
  id: number;
  type: string;
  title: string;
  category: string;
  sender: string;
  timestamp: string;
  is_read: boolean;
  details: Record<string, string>;
}

const CATEGORY_COLOR: Record<string, string> = { structure: "#f59e0b", war: "var(--danger)", corporation: "#818cf8", kills: "#fb7185", other: "var(--subtle)" };

export function NotificationsTab({ header }: { header: CharacterHeader }) {
  const [category, setCategory] = useState("");
  const columns: Column<NotificationRow>[] = [
    {
      header: "Notification",
      cell: (n) => (
        <div className="min-w-0">
          <div className={cn("truncate", !n.is_read && "font-semibold")}>{n.title}</div>
          <div className="truncate text-xs text-subtle">
            {Object.entries(n.details)
              .slice(0, 3)
              .map(([k, v]) => `${humanize(k.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase())}: ${v}`)
              .join(" · ")}
          </div>
        </div>
      ),
      className: "max-w-xl",
    },
    { header: "Type", cell: (n) => <Badge color={CATEGORY_COLOR[n.category]} variant="dot">{humanize(n.category)}</Badge> },
    { header: "From", cell: (n) => n.sender, className: "max-w-[180px] text-muted" },
    { header: "When", cell: (n) => timeAgo(n.timestamp), className: "whitespace-nowrap text-xs text-muted" },
  ];
  return (
    <Card>
      <SegmentTabs
        value={category}
        onChange={setCategory}
        options={[{ value: "", label: "All" }, { value: "structure", label: "Structures" }, { value: "war", label: "War" }, { value: "corporation", label: "Corporation" }, { value: "kills", label: "Kills & bounties" }, { value: "other", label: "Other" }]}
      />
      <PagedTable<NotificationRow> url={`${base(header)}/notifications`} params={`category=${category}`} columns={columns} rowKey={(n) => n.id} empty={{ icon: <Bell />, title: "No notifications" }} />
    </Card>
  );
}

// --- Calendar --------------------------------------------------------------------

interface EventRow {
  id: number;
  date: string;
  title: string;
  important: boolean;
  response: string;
  duration: number | null;
  owner: string;
  text: string;
}

const RESPONSE_COLOR: Record<string, string> = { accepted: "var(--success)", tentative: "var(--warning)", declined: "var(--danger)", not_responded: "var(--subtle)" };

export function CalendarTab({ header }: { header: CharacterHeader }) {
  const { data, isLoading } = useSection<{ upcoming: EventRow[]; past: EventRow[] }>(header.id, "calendar");
  if (isLoading || !data) return <Skeleton className="h-60 rounded-xl" />;
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader title="Upcoming" icon={<CalendarDays />} />
        {data.upcoming.length ? (
          <ul className="divide-y divide-border">
            {data.upcoming.map((e) => (
              <li key={e.id} className="flex gap-4 px-5 py-4">
                <div className="w-14 shrink-0 rounded-lg border border-border bg-bg/40 py-1.5 text-center">
                  <div className="text-[11px] uppercase tracking-wider text-accent-ink">{new Date(e.date).toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" })}</div>
                  <div className="text-xl font-semibold leading-tight">{new Date(e.date).getUTCDate()}</div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">{e.title}</span>
                    {e.important && <Star className="size-3.5 fill-amber-400 text-warning-fg" />}
                  </div>
                  <div className="mt-0.5 text-xs text-muted">
                    {dateTime(e.date)} · in {duration(e.date)}
                    {e.duration ? ` · ${e.duration} min` : ""}
                    {e.owner && ` · ${e.owner}`}
                  </div>
                  {e.text && <p className="mt-1.5 line-clamp-2 text-sm text-muted">{e.text}</p>}
                </div>
                <div className="shrink-0 self-start">
                  <Badge color={RESPONSE_COLOR[e.response]} variant="dot">{humanize(e.response || "not_responded")}</Badge>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={<CalendarDays />} title="Nothing scheduled" className="py-10" />
        )}
      </Card>
      <Card>
        <CardHeader title="Recent" />
        <ul className="divide-y divide-border">
          {data.past.slice(0, 12).map((e) => (
            <li key={e.id} className="px-5 py-2.5 text-sm">
              <div className="truncate">{e.title}</div>
              <div className="text-xs text-subtle">{date(e.date)}</div>
            </li>
          ))}
          {!data.past.length && <li className="px-5 py-4 text-sm text-subtle">No past events.</li>}
        </ul>
      </Card>
    </div>
  );
}

// --- Contacts & standings ---------------------------------------------------------

interface ContactRow {
  id: number;
  type: string;
  name: string;
  image: string;
  standing: number;
  blocked: boolean;
  watched: boolean;
  labels: string[];
}

export function ContactsTab({ header }: { header: CharacterHeader }) {
  const { data, isLoading } = useSection<ContactRow[]>(header.id, "contacts");
  const [q, setQ] = useState("");
  if (isLoading || !data) return <Skeleton className="h-60 rounded-xl" />;
  const rows = data.filter((c) => c.name.toLowerCase().includes(q.trim().toLowerCase()));
  const count = (f: (c: ContactRow) => boolean) => data.filter(f).length;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Contacts" value={data.length} icon={<Users />} />
        <StatCard label="Positive" value={<span style={{ color: standingColor(10) }}>{count((c) => c.standing > 0)}</span>} />
        <StatCard label="Negative" value={<span style={{ color: standingColor(-10) }}>{count((c) => c.standing < 0)}</span>} />
        <StatCard label="Watched" value={count((c) => c.watched)} icon={<Eye />} />
      </div>
      <Card>
        <div className="px-5 py-3">
          <div className="relative max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-subtle" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a contact" className="h-8 pl-8 text-xs" />
          </div>
        </div>
        {rows.length ? (
          <ul className="grid grid-cols-1 gap-px border-t border-border bg-border sm:grid-cols-2 xl:grid-cols-3">
            {rows.map((c) => (
              <li key={c.id} className="flex items-center gap-3 bg-surface px-5 py-3">
                <img src={c.image} alt="" className={cn("size-9 ring-1 ring-border-strong", c.type === "character" ? "rounded-none" : "rounded-md")} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm">{c.name}</span>
                    {c.watched && <Eye className="size-3.5 text-accent-ink" aria-label="Watched" />}
                    {c.blocked && <Ban className="size-3.5 text-danger-fg" aria-label="Blocked" />}
                  </div>
                  <div className="truncate text-xs text-subtle">{[humanize(c.type), ...c.labels].join(" · ")}</div>
                </div>
                <StandingPill value={c.standing} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={<Users />} title="No contacts" className="py-10" />
        )}
      </Card>
    </div>
  );
}

interface StandingRow {
  id: number;
  name: string;
  standing: number;
  image: string;
}

export function StandingsTab({ header }: { header: CharacterHeader }) {
  const { data, isLoading } = useSection<{ factions: StandingRow[]; corporations: StandingRow[]; agents: StandingRow[] }>(header.id, "standings");
  if (isLoading || !data) return <Skeleton className="h-60 rounded-xl" />;
  const column = (title: string, rows: StandingRow[], round = false) => (
    <Card>
      <CardHeader title={title} description={`${rows.length} entries`} />
      <ul className="divide-y divide-border">
        {rows.map((r) => (
          <li key={r.id} className="flex items-center gap-3 px-5 py-2.5">
            <img src={r.image} alt="" className={cn("size-8 ring-1 ring-border-strong", round ? "rounded-none" : "rounded-md")} />
            <span className="min-w-0 flex-1 truncate text-sm">{r.name}</span>
            <div className="hidden h-1.5 w-24 overflow-hidden rounded-none bg-surface-3 sm:block">
              <div className="h-full rounded-none" style={{ width: `${(Math.abs(r.standing) / 10) * 100}%`, background: standingColor(r.standing), marginLeft: r.standing < 0 ? "auto" : undefined }} />
            </div>
            <StandingPill value={r.standing} />
          </li>
        ))}
        {!rows.length && <li className="px-5 py-4 text-sm text-subtle">None.</li>}
      </ul>
    </Card>
  );
  return (
    <div className="grid grid-cols-1 gap-6 2xl:grid-cols-3">
      {column("Factions", data.factions)}
      {column("Corporations", data.corporations)}
      {column("Agents", data.agents, true)}
    </div>
  );
}

export function LoyaltyTab({ header }: { header: CharacterHeader }) {
  const { data, isLoading } = useSection<{ total: number; corporations: { id: number; name: string; logo: string; points: number }[] }>(header.id, "loyalty");
  if (isLoading || !data) return <Skeleton className="h-60 rounded-xl" />;
  if (!data.corporations.length) return <Card><EmptyState icon={<Star />} title="No loyalty points" /></Card>;
  const max = Math.max(...data.corporations.map((c) => c.points));
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Total loyalty points" value={num(data.total)} mono icon={<Star />} />
        <StatCard label="Corporations" value={data.corporations.length} />
      </div>
      <Card>
        <ul className="divide-y divide-border">
          {data.corporations.map((c) => (
            <li key={c.id} className="flex items-center gap-4 px-5 py-3">
              <img src={c.logo} alt="" className="size-9 rounded-md ring-1 ring-border-strong" />
              <span className="min-w-0 flex-1 truncate text-sm">{c.name}</span>
              <div className="hidden h-1.5 w-40 overflow-hidden rounded-none bg-surface-3 md:block">
                <div className="h-full rounded-none bg-accent/80" style={{ width: `${(c.points / max) * 100}%` }} />
              </div>
              <span className="w-28 text-right font-mono text-sm tabular-nums">{num(c.points)} LP</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

// --- Fittings --------------------------------------------------------------------

interface FitRow {
  id: number;
  name: string;
  ship: EveType;
  modules: number;
}

interface FitDetail {
  id: number;
  name: string;
  description: string;
  ship: EveType;
  render: string;
  slots: { key: string; label: string; items: { type: EveType; quantity: number }[] }[];
  value: number;
  eft: string;
}

export function FittingsTab({ header }: { header: CharacterHeader }) {
  const { data, isLoading } = useSection<FitRow[]>(header.id, "fittings");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<FitRow | null>(null);
  if (isLoading || !data) return <Skeleton className="h-60 rounded-xl" />;
  if (!data.length) return <Card><EmptyState icon={<Shield />} title="No saved fittings" /></Card>;
  const needle = q.trim().toLowerCase();
  const rows = data.filter((f) => !needle || f.name.toLowerCase().includes(needle) || f.ship.name.toLowerCase().includes(needle));
  return (
    <div className="space-y-4">
      <div className="relative max-w-xs">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-subtle" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a fit or ship" className="h-9 pl-8" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((f) => (
          <button key={f.id} onClick={() => setOpen(f)} className="panel flex items-center gap-3 rounded-xl p-3 text-left transition hover:-translate-y-0.5 hover:border-border-strong">
            <img src={f.ship.icon.replace("/icon?", "/render?").replace(/size=\d+/, "size=128")} alt="" className="size-14 rounded-lg bg-surface-3" />
            <div className="min-w-0">
              <div className="truncate font-medium">{f.name}</div>
              <div className="truncate text-xs text-muted">{f.ship.name} · {f.ship.group}</div>
              <div className="text-xs text-subtle">{f.modules} items</div>
            </div>
          </button>
        ))}
      </div>
      {open && <FitDialog header={header} fit={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

function FitDialog({ header, fit, onClose }: { header: CharacterHeader; fit: FitRow; onClose: () => void }) {
  const { data } = useQuery({ queryKey: ["fit", header.id, fit.id], queryFn: () => api.get<FitDetail>(`${base(header)}/fittings/${fit.id}`) });
  const copy = () => data && navigator.clipboard.writeText(data.eft).then(() => toast.success("Fit copied in EFT format. Paste it into the in-game fitting window."));
  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={fit.name}
      description={`${fit.ship.name}${data ? ` · ≈ ${isk(data.value)}` : ""}`}
      className="max-w-2xl"
      footer={
        <Button variant="primary" onClick={copy} disabled={!data}>
          <ClipboardCopy /> Copy EFT
        </Button>
      }
    >
      {!data ? (
        <Skeleton className="h-60" />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-[180px_1fr]">
          <img src={data.render} alt="" className="w-full rounded-xl bg-surface-3" />
          <div className="space-y-4">
            {data.slots.map((s) => (
              <div key={s.key}>
                <div className="mb-1.5 text-[11px] uppercase tracking-wider text-subtle">{s.label}</div>
                <ul className="space-y-1">
                  {s.items.map((i, n) => (
                    <li key={n} className="flex items-center gap-2.5 text-sm">
                      <TypeIcon type={i.type} size={24} />
                      <span className="flex-1 truncate">{i.type.name}</span>
                      {i.quantity > 1 && <span className="font-mono text-xs text-muted">×{num(i.quantity)}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </Dialog>
  );
}

// --- Killmails -------------------------------------------------------------------

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
  system: { id: number; name: string; security: number; region: string } | null;
  zkillboard: string;
}

export function KillmailsTab({ header }: { header: CharacterHeader }) {
  const [kind, setKind] = useState<"" | "kills" | "losses">("");
  const summary = useSection<{ kills: number; losses: number; isk_destroyed: number; isk_lost: number }>(header.id, "killmails/summary");
  const s = summary.data;
  const efficiency = s && s.isk_destroyed + s.isk_lost > 0 ? (s.isk_destroyed / (s.isk_destroyed + s.isk_lost)) * 100 : null;
  const columns: Column<KillRow>[] = [
    {
      header: "Ship",
      cell: (k) => (
        <div className="flex items-center gap-2.5">
          <span className={cn("h-8 w-1 shrink-0 rounded-none", k.is_loss ? "bg-danger" : "bg-success")} />
          <TypeIcon type={k.ship} size={32} />
          <div className="min-w-0">
            <div className="truncate">{k.ship.name}</div>
            <div className="truncate text-xs text-subtle">{k.ship.group}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Victim",
      cell: (k) => (
        <div className="min-w-0">
          <div className="truncate">{k.victim}</div>
          <div className="truncate text-xs text-subtle">{k.victim_corporation}</div>
        </div>
      ),
      className: "max-w-[220px]",
    },
    { header: "Final blow", cell: (k) => <span className="text-muted">{k.final_blow ?? "NPC"} <span className="text-subtle">+{k.attackers - 1}</span></span>, className: "max-w-[200px]" },
    { header: "Where", cell: (k) => (k.system ? <span className="inline-flex items-center gap-1.5"><Security value={k.system.security} />{k.system.name}</span> : "—") },
    { header: "Value", align: "right", cell: (k) => isk(k.value) },
    {
      header: "",
      cell: (k) => (
        <Tooltip content="Open on zKillboard">
          <a href={k.zkillboard} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-subtle hover:text-accent-ink">
            <Crosshair className="size-4" />
          </a>
        </Tooltip>
      ),
    },
  ];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Kills" value={s?.kills ?? "—"} icon={<Swords />} />
        <StatCard label="Losses" value={s?.losses ?? "—"} icon={<Skull />} />
        <StatCard label="ISK destroyed" value={s ? isk(s.isk_destroyed).replace(" ISK", "") : "—"} mono />
        <StatCard label="Efficiency" value={efficiency != null ? `${efficiency.toFixed(0)}%` : "—"} mono hint="ISK destroyed vs lost" />
      </div>
      <Card>
        <SegmentTabs value={kind} onChange={setKind} options={[{ value: "", label: "All" }, { value: "kills", label: "Kills" }, { value: "losses", label: "Losses" }]} />
        <PagedTable<KillRow> url={`${base(header)}/killmails`} params={`kind=${kind}`} columns={columns} rowKey={(k) => k.id} empty={{ icon: <Swords />, title: "No killmails in the last 90 days" }} />
      </Card>
    </div>
  );
}

// --- Intel -----------------------------------------------------------------------

interface Interaction {
  id: number;
  name: string;
  type: string;
  image: string;
  journal: number;
  market: number;
  mail: number;
  contracts: number;
  total: number;
  last: string | null;
  standing: number | null;
  member: { user_id: number; main: string | null; same_account: boolean } | null;
}

export function IntelTab({ header }: { header: CharacterHeader }) {
  const { data, isLoading } = useSection<{
    interactions: Interaction[];
    registered_counterparties: number;
    account_characters: { id: number; name: string; portrait: string; corporation: { name: string } | null }[];
  }>(header.id, "intel");
  if (isLoading || !data) return <Skeleton className="h-72 rounded-xl" />;
  const max = Math.max(1, ...data.interactions.map((i) => i.total));
  const sources: [keyof Interaction, string][] = [["journal", "Wallet"], ["market", "Market"], ["mail", "Mail"], ["contracts", "Contracts"]];
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader title="Top interactions" icon={<Radar />} description="Who this character deals with most, across wallet, market, mail and contracts. NPCs are left out." />
        {data.interactions.length ? (
          <ul className="divide-y divide-border">
            {data.interactions.map((i) => (
              <li key={i.id} className="flex items-center gap-3 px-5 py-3">
                <img src={i.image} alt="" className={cn("size-9 ring-1 ring-border-strong", i.type === "character" ? "rounded-none" : "rounded-md")} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="truncate text-sm font-medium">{i.name}</span>
                    {i.standing != null && <StandingPill value={i.standing} />}
                    {i.member && (
                      <Badge color={i.member.same_account ? "var(--subtle)" : "#f59e0b"}>{i.member.same_account ? "Same account" : `Member · ${i.member.main ?? "?"}`}</Badge>
                    )}
                  </div>
                  <div className="mt-1 flex h-1.5 max-w-sm overflow-hidden rounded-none bg-surface-3" style={{ width: `${(i.total / max) * 100}%` }}>
                    {sources.map(([key], n) =>
                      (i[key] as number) > 0 ? <span key={key} style={{ flex: i[key] as number, opacity: 1 - n * 0.2 }} className="h-full border-r-2 border-surface bg-accent last:border-0" /> : null,
                    )}
                  </div>
                  <div className="mt-1 text-xs text-subtle">
                    {sources.filter(([k]) => (i[k] as number) > 0).map(([k, label]) => `${label} ${i[k]}`).join(" · ")}
                    {i.last && ` · last ${timeAgo(i.last)}`}
                  </div>
                </div>
                <span className="font-mono text-sm tabular-nums text-muted">{i.total}</span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={<Radar />} title="No interactions yet" description="Intel builds up from wallet, market, mail and contract data." className="py-10" />
        )}
      </Card>
      <div className="space-y-6">
        <Card>
          <CardHeader title="Registered counterparties" />
          <CardBody>
            <div className="font-mono text-3xl font-semibold tabular-nums">{data.registered_counterparties}</div>
            <p className="mt-1 text-xs text-muted">Characters in the top interactions that belong to another member here. Worth a look when vetting alts or spies.</p>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Same account" description="Other characters linked by this member" />
          <ul className="divide-y divide-border">
            {data.account_characters.map((c) => (
              <li key={c.id}>
                <Link to={`/characters/${c.id}`} className="flex items-center gap-3 px-5 py-2.5 hover:bg-hover">
                  <Avatar src={c.portrait} name={c.name} size="sm" />
                  <div className="min-w-0">
                    <div className="truncate text-sm">{c.name}</div>
                    <div className="truncate text-xs text-subtle">{c.corporation?.name}</div>
                  </div>
                </Link>
              </li>
            ))}
            {!data.account_characters.length && <li className="px-5 py-4 text-sm text-subtle">No other characters.</li>}
          </ul>
        </Card>
      </div>
    </div>
  );
}

