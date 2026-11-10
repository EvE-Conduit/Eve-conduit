// Temporary access (discord.create_guest_links): make links for guests, see who came through them, withdraw them.
import {
  Alert, api, Avatar, Badge, Button, Card, CardBody, CardHeader, cn, type Column, ConfirmDialog, Dialog, EmptyState, Field, Input, PagedTable, PageHeader,
  SearchInput, Select, Skeleton, TabPanel, Tabs, timeAgo, toast,
} from "@conduit/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router";

import { ArrowLeft, Ban, Clock, Copy, DiscordLogo, LinkIcon, Plus, Users } from "./icons";
import { BASE, type GuestChannel, type GuestLink, type GuestLinkStatus, type GuestOverview, type GuestUser, type GuestVisit } from "./types";

const KEY = ["discord", "guests"];
const PRESETS = [1, 2, 4, 8, 12, 24, 48, 72, 168, 336, 720];

export function untilText(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "ended";
  const min = Math.round(ms / 60_000);
  if (min < 60) return `${min} min left`;
  const h = Math.floor(min / 60);
  if (h < 48) return `${h} h ${min % 60 ? `${min % 60} min ` : ""}left`;
  return `${Math.round(h / 24)} days left`;
}

/** "#diplo" for text channels, the plain name for voice ones, as Discord shows them. */
export const channelLabel = (c: GuestChannel) => (c.kind === "voice" || c.kind === "stage" ? `🔊 ${c.name}` : `#${c.name}`);

function copy(text: string, done: string) {
  navigator.clipboard.writeText(text).then(() => toast.success(done), () => toast.error("Couldn't copy; select the text instead"));
}

const STATUS: Record<GuestLinkStatus, { label: string; tone: "success" | "neutral" | "danger" | "warning" }> = {
  active: { label: "active", tone: "success" },
  used_up: { label: "all used", tone: "neutral" },
  expired: { label: "ended", tone: "neutral" },
  revoked: { label: "withdrawn", tone: "danger" },
  creator_lost: { label: "maker lost access", tone: "warning" },
};

/** Links whose guests are still on the server: open ones, and ones every use of which is taken. */
const running = (l: GuestLink) => l.status === "active" || l.status === "used_up";

export function GuestsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: KEY, queryFn: () => api.get<GuestOverview>(`${BASE}/guests`) });
  const [creating, setCreating] = useState(false);
  const [made, setMade] = useState<GuestLink | null>(null);
  const [revoking, setRevoking] = useState<GuestLink | null>(null);
  const [extending, setExtending] = useState<GuestLink | null>(null);
  const [showPast, setShowPast] = useState(false);
  const [tab, setTab] = useState("links");
  const revoke = useMutation({
    mutationFn: (id: number) => api.delete<GuestLink & { waiting: number }>(`${BASE}/guests/${id}`),
    onSuccess: (l) => {
      if (l.waiting) toast.warning(`Link withdrawn. For ${l.waiting} guest${l.waiting === 1 ? "" : "s"} Discord couldn't be reached yet; that is tried again every couple of minutes.`);
      else toast.success(data?.end_action === "kick" ? "Link withdrawn and its guests removed from the server" : "Link withdrawn; its guests lost their access");
      qc.invalidateQueries({ queryKey: KEY });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const links = data?.links ?? [];
  const live = links.filter(running);
  const past = links.filter((l) => !running(l));
  const here = (l: GuestLink) => l.guests.filter((g) => !g.ended_at).length;

  return (
    <>
      <PageHeader
        eyebrow={<Link to="/p/discord" className="inline-flex items-center gap-1 hover:text-text"><ArrowLeft className="size-3" /> Discord</Link>}
        title="Temporary access"
        icon={<Clock />}
        description="Hand a link to people without an account here: diplomats, guests on a fleet, a recruit. They sign in with Discord and get access to the server until the link runs out."
        actions={data?.enabled ? <Button variant="primary" onClick={() => setCreating(true)}><Plus /> New link</Button> : undefined}
      />
      {isLoading || !data ? (
        <Skeleton className="h-64" />
      ) : !data.enabled ? (
        <Card><EmptyState icon={<Clock />} title="Temporary access is switched off" description="A Discord manager can switch it on and choose the roles for guests under Server setup." /></Card>
      ) : (
        <Tabs
          variant="pills"
          value={tab}
          onValueChange={setTab}
          className="space-y-4"
          items={[{ value: "links", label: "Links", count: live.length }, { value: "history", label: "History" }]}
        >
        <TabPanel value="history"><History showOwner={data.can_manage} /></TabPanel>
        <TabPanel value="links">
        <div className="space-y-6">
          <p className="text-sm text-muted">
            {data.end_action === "kick"
              ? "When a link ends, the people who joined through it are removed from the server. Anyone who was on the server before only loses their access."
              : data.kept_role
                ? `When a link ends, its guests lose @${data.role} and their channels. They stay on the server with @${data.kept_role}.`
                : "When a link ends, its guests lose the guest role and stay on the server."}
          </p>
          {made && (
            <Alert tone="success" title="Link made. Send it to your guests." action={<Button size="sm" variant="ghost" onClick={() => setMade(null)}>Done</Button>}>
              <div className="mt-2 flex items-stretch">
                <Input readOnly value={made.url} className="font-mono text-xs" onFocus={(e) => e.target.select()} />
                <Button variant="secondary" size="icon" aria-label="Copy link" onClick={() => copy(made.url, "Link copied")}><Copy /></Button>
              </div>
            </Alert>
          )}
          {live.length === 0 ? (
            <Card>
              <EmptyState
                icon={<LinkIcon />}
                title="No active links"
                description={`Make one and send it to whoever needs to be on ${data.server || "the server"} for a while.`}
                action={<Button variant="primary" onClick={() => setCreating(true)}><Plus /> New link</Button>}
              />
            </Card>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {live.map((l) => <LinkCard key={l.id} link={l} showOwner={data.can_manage} onRevoke={() => setRevoking(l)} onExtend={() => setExtending(l)} />)}
            </div>
          )}
          {past.length > 0 && (
            <div>
              <button type="button" className="text-sm text-muted hover:text-text" onClick={() => setShowPast((v) => !v)}>
                {showPast ? "Hide" : "Show"} {past.length} past link{past.length === 1 ? "" : "s"}
              </button>
              {showPast && (
                <div className="mt-3 grid gap-4 lg:grid-cols-2">
                  {past.map((l) => <LinkCard key={l.id} link={l} showOwner={data.can_manage} />)}
                </div>
              )}
            </div>
          )}
        </div>
        </TabPanel>
        </Tabs>
      )}
      {data && extending && (
        <ExtendDialog link={extending} maxHours={data.max_hours} onClose={() => setExtending(null)} onDone={() => { setExtending(null); qc.invalidateQueries({ queryKey: KEY }); }} />
      )}
      {data && (
        <NewLinkDialog
          open={creating}
          onOpenChange={setCreating}
          overview={data}
          onMade={(l) => { setMade(l); setCreating(false); qc.invalidateQueries({ queryKey: KEY }); }}
        />
      )}
      <ConfirmDialog
        open={!!revoking}
        onOpenChange={(o) => !o && setRevoking(null)}
        title={`Withdraw "${revoking?.label}"?`}
        description={
          revoking && here(revoking)
            ? `The link stops working and the ${here(revoking)} guest${here(revoking) === 1 ? "" : "s"} it let in ${data?.end_action === "kick" ? (here(revoking) === 1 ? "is removed from the server" : "are removed from the server") : (here(revoking) === 1 ? "loses access" : "lose access")} now.`
            : "The link stops working. Nobody has guest access through it."
        }
        danger
        confirmLabel={<><Ban /> Withdraw</>}
        onConfirm={() => revoking && revoke.mutateAsync(revoking.id)}
      />
    </>
  );
}

function LinkCard({ link, showOwner, onRevoke, onExtend }: { link: GuestLink; showOwner: boolean; onRevoke?: () => void; onExtend?: () => void }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const remove = useMutation({
    mutationFn: (id: number) => api.delete<GuestLink>(`${BASE}/guests/users/${id}`),
    onSuccess: () => { toast.success("Their guest access has ended"); qc.invalidateQueries({ queryKey: KEY }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const live = running(link);
  const st = STATUS[link.status];
  return (
    <Card className={cn(!live && "opacity-75")}>
      <CardHeader
        title={<span className="flex items-center gap-2">{link.label} <Badge tone={st.tone}>{st.label}</Badge></span>}
        description={
          <>
            {live ? untilText(link.expires_at) : `ended ${timeAgo(link.ended_at)}`} · {link.uses}{link.max_uses ? ` of ${link.max_uses}` : ""} used
            {showOwner && link.created_by ? ` · by ${link.created_by.name}` : ""}
          </>
        }
        actions={
          <div className="flex gap-1">
            {link.status === "active" && <Button variant="ghost" size="sm" onClick={() => copy(link.url, "Link copied")}><Copy /> Copy link</Button>}
            {live && onExtend && <Button variant="ghost" size="sm" onClick={onExtend}><Clock /> Extend</Button>}
            {live && onRevoke && <Button variant="ghost" size="sm" onClick={onRevoke}><Ban /> Withdraw</Button>}
          </div>
        }
      />
      <CardBody className="space-y-3">
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
          Guests get <Badge tone="accent">@{link.role}</Badge>
          {link.channels.length > 0 && (
            <>
              and see only {link.channels.map((c) => <Badge key={c.id} tone="neutral">{channelLabel(c)}</Badge>)}
            </>
          )}
        </div>
        {link.guests.length === 0 ? (
          <p className="text-sm text-subtle">Nobody has used it yet.</p>
        ) : (
          <>
            <button type="button" className="inline-flex items-center gap-1.5 text-sm text-accent-ink hover:underline" onClick={() => setOpen((v) => !v)}>
              <Users className="size-3.5" /> {link.guests.length} guest{link.guests.length === 1 ? "" : "s"}
            </button>
            {open && (
              <ul className="divide-y divide-border border border-border text-sm">
                {link.guests.map((g) => (
                  <GuestRow key={g.id} guest={g} onRemove={!g.ended_at ? () => remove.mutate(g.id) : undefined} />
                ))}
              </ul>
            )}
          </>
        )}
      </CardBody>
    </Card>
  );
}

const ENDED: Record<string, string> = {
  expired: "ended when the link ran out",
  revoked: "ended with the link",
  removed: "ended by hand",
  creator_lost: "ended: the link's maker lost access",
  member: "a member here now",
};

function GuestRow({ guest, onRemove }: { guest: GuestUser; onRemove?: () => void }) {
  return (
    <li className="flex items-center gap-3 px-3 py-2">
      <Avatar src={guest.avatar} name={guest.username} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{guest.username}</div>
        <div className="truncate text-xs text-subtle">
          joined {timeAgo(guest.joined_at)}
          {guest.ended_at ? ` · ${ENDED[guest.ended_reason] ?? "left"}` : ""}
          {guest.error ? ` · couldn't be ended yet: ${guest.error}` : ""}
        </div>
      </div>
      {guest.ended_at ? <Badge tone={guest.ended_reason === "member" ? "success" : "neutral"}>{guest.ended_reason === "member" ? "member" : "ended"}</Badge> : onRemove ? (
        <Button variant="ghost" size="xs" onClick={onRemove}><Ban /> End access</Button>
      ) : null}
    </li>
  );
}

function NewLinkDialog({ open, onOpenChange, overview, onMade }: { open: boolean; onOpenChange: (o: boolean) => void; overview: GuestOverview; onMade: (l: GuestLink) => void }) {
  const [label, setLabel] = useState("");
  const [hours, setHours] = useState(String(Math.min(4, overview.max_hours)));
  const [maxUses, setMaxUses] = useState("");
  // Every channel offered, until some are picked.
  const [picked, setPicked] = useState<string[] | null>(null);
  const channels = picked ?? overview.channels.map((c) => c.id);
  const toggle = (id: string) => setPicked(channels.includes(id) ? channels.filter((x) => x !== id) : [...channels, id]);
  const create = useMutation({
    mutationFn: () => api.post<GuestLink>(`${BASE}/guests`, {
      label: label.trim(), hours: Number(hours), max_uses: Number(maxUses) || 0,
      channels: overview.channels.length ? channels : undefined,
    }),
    onSuccess: (l) => { onMade(l); setLabel(""); setMaxUses(""); setPicked(null); },
    onError: (e: Error) => toast.error(e.message),
  });
  const noChannel = overview.channels.length > 0 && channels.length === 0;
  const presets = PRESETS.filter((h) => h <= overview.max_hours);
  if (!presets.includes(overview.max_hours)) presets.push(overview.max_hours);
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="New temporary link"
      description={`Whoever opens it can join ${overview.server || "the Discord server"} with the @${overview.role} role for as long as the link lasts.`}
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="primary" loading={create.isPending} disabled={!label.trim() || noChannel} onClick={() => create.mutate()}><LinkIcon /> Make link</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="What it's for" hint="Shown to the guests, and to you in the list.">
          <Input autoFocus value={label} onChange={(e) => setLabel(e.target.value)} maxLength={100} placeholder="Diplo meeting Saturday" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Lasts" hint={`At most ${overview.max_hours} hours. You can extend it while it runs.`}>
            <Select value={hours} onChange={(e) => setHours(e.target.value)}>
              {presets.map((h) => (
                <option key={h} value={h}>{hoursLabel(h)}</option>
              ))}
            </Select>
          </Field>
          <Field label="Uses" hint="How many people may use it; empty for no limit.">
            <Input type="number" min={0} value={maxUses} onChange={(e) => setMaxUses(e.target.value)} placeholder="no limit" />
          </Field>
        </div>
        {overview.channels.length > 0 && (
          <Field label="Channels these guests see" hint={noChannel ? "Choose at least one." : "They see these and nothing else on the server."}>
            <div className="flex flex-wrap gap-1.5">
              {overview.channels.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={channels.includes(c.id)}
                  onClick={() => toggle(c.id)}
                  className={cn("border px-2.5 py-1 text-xs", channels.includes(c.id) ? "border-accent bg-accent-soft text-accent-ink" : "border-border text-muted hover:border-border-strong")}
                >
                  {channelLabel(c)}
                </button>
              ))}
            </div>
          </Field>
        )}
      </div>
    </Dialog>
  );
}

const hoursLabel = (h: number) => (h < 24 ? `${h} hour${h === 1 ? "" : "s"}` : `${h / 24} day${h === 24 ? "" : "s"}`);

function ExtendDialog({ link, maxHours, onClose, onDone }: { link: GuestLink; maxHours: number; onClose: () => void; onDone: () => void }) {
  // The link may end at most maxHours from now, so what can be added shrinks with what it has left.
  const left = Math.max(0, (new Date(link.expires_at).getTime() - Date.now()) / 3_600_000);
  const room = Math.floor(maxHours - left);
  const presets = PRESETS.filter((h) => h <= room);
  const [hours, setHours] = useState(String(presets[0] ?? ""));
  const extend = useMutation({
    mutationFn: () => api.post<GuestLink>(`${BASE}/guests/${link.id}/extend`, { hours: Number(hours) }),
    onSuccess: (l) => { toast.success(`"${l.label}" now runs until ${new Date(l.expires_at).toLocaleString()}`); onDone(); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={`Extend "${link.label}"`}
      description={`It has ${untilText(link.expires_at)}. Its guests keep their access for the extra time.`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={extend.isPending} disabled={!presets.length} onClick={() => extend.mutate()}><Clock /> Extend</Button>
        </>
      }
    >
      {presets.length ? (
        <Field label="Add" hint={`A link may run at most ${maxHours} hours from now.`}>
          <Select value={hours} onChange={(e) => setHours(e.target.value)}>
            {presets.map((h) => <option key={h} value={h}>{hoursLabel(h)}</option>)}
          </Select>
        </Field>
      ) : (
        <Alert tone="info" title="It already runs as long as a link may">Links may run at most {maxHours} hours from now. Try again later, or make a new link when this one ends.</Alert>
      )}
    </Dialog>
  );
}

/** Everyone who came through a link, newest first, with a search. */
function History({ showOwner }: { showOwner: boolean }) {
  const [q, setQ] = useState("");
  const columns: Column<GuestVisit>[] = [
    {
      header: "Guest",
      cell: (g) => (
        <div className="flex min-w-0 items-center gap-2">
          <Avatar src={g.avatar} name={g.username} size="sm" />
          <div className="min-w-0">
            <div className="truncate font-medium">{g.username}</div>
            <div className="truncate font-mono text-xs text-subtle">{g.discord_id}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Link",
      cell: (g) => (
        <div className="min-w-0">
          <div className="truncate">{g.link.label}</div>
          <div className="truncate text-xs text-subtle">
            @{g.link.role}{g.link.channels.length ? ` · ${g.link.channels.map(channelLabel).join(" ")}` : ""}
          </div>
        </div>
      ),
    },
    ...(showOwner ? [{ header: "Invited by", cell: (g: GuestVisit) => g.invited_by ?? <span className="text-subtle">deleted account</span> }] : []),
    { header: "Joined", cell: (g) => <span title={new Date(g.joined_at).toLocaleString()}>{timeAgo(g.joined_at)}</span> },
    {
      header: "Access",
      cell: (g) => g.ended_at
        ? <span className="text-muted" title={new Date(g.ended_at).toLocaleString()}>{ENDED[g.ended_reason] ?? "ended"} {timeAgo(g.ended_at)}</span>
        : <Badge tone="success">{untilText(g.link.expires_at)}</Badge>,
    },
  ];
  return (
    <Card>
      <CardHeader
        title="Who came through a link"
        description={showOwner ? "Every guest of every link, newest first." : "The guests of your links, newest first."}
        actions={<SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Discord name or id, link, who invited" className="w-72" />}
      />
      <PagedTable<GuestVisit>
        url={`${BASE}/guests/history`}
        params={q.trim() ? `q=${encodeURIComponent(q.trim())}` : ""}
        columns={columns}
        rowKey={(g) => g.id}
        empty={{ icon: <DiscordLogo />, title: q.trim() ? "Nobody matches" : "Nobody has come through a link yet", description: q.trim() ? "Try another name or link." : undefined }}
      />
    </Card>
  );
}
