// Temporary access (discord.create_guest_links): make links for guests, see who came through them, withdraw them.
import {
  Alert, api, Avatar, Badge, Button, Card, CardBody, CardHeader, cn, ConfirmDialog, Dialog, EmptyState, Field, Input, PageHeader, Select, Skeleton,
  timeAgo, toast,
} from "@conduit/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router";

import { ArrowLeft, Ban, Clock, Copy, LinkIcon, Plus, Users } from "./icons";
import { BASE, type GuestLink, type GuestLinkStatus, type GuestOverview, type GuestUser } from "./types";

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
  const [showPast, setShowPast] = useState(false);
  const revoke = useMutation({
    mutationFn: (id: number) => api.delete<GuestLink & { waiting: number }>(`${BASE}/guests/${id}`),
    onSuccess: (l) => {
      if (l.waiting) toast.warning(`Link withdrawn. ${l.waiting} guest${l.waiting === 1 ? "" : "s"} couldn't be removed yet; that is tried again every couple of minutes.`);
      else toast.success("Link withdrawn and its guests removed from the server");
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
        description="Hand a link to people without an account here: diplomats, guests on a fleet, a recruit. They sign in with Discord, join the server with the guest role, and are removed again when the link runs out."
        actions={data?.enabled ? <Button variant="primary" onClick={() => setCreating(true)}><Plus /> New link</Button> : undefined}
      />
      {isLoading || !data ? (
        <Skeleton className="h-64" />
      ) : !data.enabled ? (
        <Card><EmptyState icon={<Clock />} title="Temporary access is switched off" description="A Discord manager can switch it on and choose the guest role under Server setup." /></Card>
      ) : (
        <div className="space-y-6">
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
              {live.map((l) => <LinkCard key={l.id} link={l} showOwner={data.can_manage} onRevoke={() => setRevoking(l)} />)}
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
            ? `The link stops working and the ${here(revoking)} guest${here(revoking) === 1 ? "" : "s"} it let in ${here(revoking) === 1 ? "is" : "are"} removed from the server now.`
            : "The link stops working. Nobody is on the server through it."
        }
        danger
        confirmLabel={<><Ban /> Withdraw</>}
        onConfirm={() => revoking && revoke.mutateAsync(revoking.id)}
      />
    </>
  );
}

function LinkCard({ link, showOwner, onRevoke }: { link: GuestLink; showOwner: boolean; onRevoke?: () => void }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const remove = useMutation({
    mutationFn: (id: number) => api.delete<GuestLink>(`${BASE}/guests/users/${id}`),
    onSuccess: () => { toast.success("Guest removed from the server"); qc.invalidateQueries({ queryKey: KEY }); },
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
            {live && onRevoke && <Button variant="ghost" size="sm" onClick={onRevoke}><Ban /> Withdraw</Button>}
          </div>
        }
      />
      <CardBody className="space-y-3">
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
          Guests get <Badge tone="accent">@{link.role}</Badge>
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
  expired: "left when the link ran out",
  revoked: "removed with the link",
  removed: "removed",
  creator_lost: "removed: the link's maker lost access",
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
          {guest.error ? ` · couldn't be removed yet: ${guest.error}` : ""}
        </div>
      </div>
      {guest.ended_at ? <Badge tone={guest.ended_reason === "member" ? "success" : "neutral"}>{guest.ended_reason === "member" ? "member" : "gone"}</Badge> : onRemove ? (
        <Button variant="ghost" size="xs" onClick={onRemove}><Ban /> Remove</Button>
      ) : null}
    </li>
  );
}

function NewLinkDialog({ open, onOpenChange, overview, onMade }: { open: boolean; onOpenChange: (o: boolean) => void; overview: GuestOverview; onMade: (l: GuestLink) => void }) {
  const [label, setLabel] = useState("");
  const [hours, setHours] = useState(String(Math.min(4, overview.max_hours)));
  const [maxUses, setMaxUses] = useState("");
  const create = useMutation({
    mutationFn: () => api.post<GuestLink>(`${BASE}/guests`, { label: label.trim(), hours: Number(hours), max_uses: Number(maxUses) || 0 }),
    onSuccess: (l) => { onMade(l); setLabel(""); setMaxUses(""); },
    onError: (e: Error) => toast.error(e.message),
  });
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
          <Button variant="primary" loading={create.isPending} disabled={!label.trim()} onClick={() => create.mutate()}><LinkIcon /> Make link</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="What it's for" hint="Shown to the guests, and to you in the list.">
          <Input autoFocus value={label} onChange={(e) => setLabel(e.target.value)} maxLength={100} placeholder="Diplo meeting Saturday" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Lasts" hint={`At most ${overview.max_hours} hours. Guests are removed when it ends.`}>
            <Select value={hours} onChange={(e) => setHours(e.target.value)}>
              {presets.map((h) => (
                <option key={h} value={h}>{h < 24 ? `${h} hour${h === 1 ? "" : "s"}` : `${h / 24} day${h === 24 ? "" : "s"}`}</option>
              ))}
            </Select>
          </Field>
          <Field label="Uses" hint="How many people may use it; empty for no limit.">
            <Input type="number" min={0} value={maxUses} onChange={(e) => setMaxUses(e.target.value)} placeholder="no limit" />
          </Field>
        </div>
      </div>
    </Dialog>
  );
}
