// Temporary access (mumble.create_temp_links): make links for guests, see who used them, withdraw them.
import {
  Alert, api, Badge, Button, Card, CardBody, CardHeader, cn, ConfirmDialog, Dialog, EmptyState, Field, Input, PageHeader, Select, Skeleton, timeAgo,
  toast,
} from "@conduit/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router";

import { ArrowLeft, Ban, Clock, Copy, LinkIcon, Plus, Users } from "./icons";
import { copy, StatusBadge, untilText } from "./shared";
import { BASE, type TempLink, type TempOverview, type TempUser } from "./types";

const KEY = ["mumble", "temp"];
const PRESETS = [1, 2, 4, 8, 12, 24, 48, 72, 168];

export function TempPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: KEY, queryFn: () => api.get<TempOverview>(`${BASE}/temp`) });
  const [creating, setCreating] = useState(false);
  const [made, setMade] = useState<TempLink | null>(null);
  const [revoking, setRevoking] = useState<TempLink | null>(null);
  const [showPast, setShowPast] = useState(false);
  const revoke = useMutation({
    mutationFn: (id: number) => api.delete<TempLink>(`${BASE}/temp/${id}`),
    onSuccess: () => { toast.success("Link withdrawn; its guests can't connect any more"); qc.invalidateQueries({ queryKey: KEY }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const links = data?.links ?? [];
  const live = links.filter((l) => l.status === "active");
  const past = links.filter((l) => l.status !== "active");

  return (
    <>
      <PageHeader
        eyebrow={<Link to="/p/mumble" className="inline-flex items-center gap-1 hover:text-text"><ArrowLeft className="size-3" /> Mumble</Link>}
        title="Temporary access"
        icon={<Clock />}
        description="Hand a link to people without an account here: diplomats, guests on a fleet, a recruit. They choose a name and get a login that stops working when the link runs out."
        actions={data?.enabled ? <Button variant="primary" onClick={() => setCreating(true)}><Plus /> New link</Button> : undefined}
      />
      {isLoading || !data ? (
        <Skeleton className="h-64" />
      ) : !data.enabled ? (
        <Card><EmptyState icon={<Clock />} title="Temporary access is switched off" description="A Mumble manager can switch it on under Server setup." /></Card>
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
                description="Make one and send it to whoever needs to get on comms for a while."
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
        description={`The link stops working and the ${revoking?.uses ?? 0} login${revoking?.uses === 1 ? "" : "s"} it handed out are cut off at their next connect.`}
        danger
        confirmLabel={<><Ban /> Withdraw</>}
        onConfirm={() => revoking && revoke.mutateAsync(revoking.id)}
      />
    </>
  );
}

export function LinkCard({ link, showOwner, onRevoke }: { link: TempLink; showOwner: boolean; onRevoke?: () => void }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const cut = useMutation({
    mutationFn: (id: number) => api.delete<TempLink>(`${BASE}/temp/users/${id}`),
    onSuccess: () => { toast.success("Guest cut off"); qc.invalidateQueries({ queryKey: ["mumble"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const active = link.status === "active";
  const users = link.users ?? [];
  return (
    <Card className={cn(!active && "opacity-75")}>
      <CardHeader
        title={<span className="flex items-center gap-2">{link.label} <StatusBadge status={link.status} /></span>}
        description={
          <>
            {active ? untilText(link.expires_at) : `ended ${timeAgo(link.expires_at)}`} · {link.uses}{link.max_uses ? ` of ${link.max_uses}` : ""} used
            {showOwner && link.created_by ? ` · by ${link.created_by.name}` : ""}
          </>
        }
        actions={
          <div className="flex gap-1">
            {active && <Button variant="ghost" size="sm" onClick={() => copy(link.url, "Link copied")}><Copy /> Copy link</Button>}
            {active && onRevoke && <Button variant="ghost" size="sm" onClick={onRevoke}><Ban /> Withdraw</Button>}
          </div>
        }
      />
      <CardBody className="space-y-3">
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
          Guests get <span className="flex gap-1">{link.groups.length ? link.groups.map((g) => <Badge key={g} tone="accent">{g}</Badge>) : <span>no group</span>}</span>
        </div>
        {users.length === 0 ? (
          <p className="text-sm text-subtle">Nobody has used it yet.</p>
        ) : (
          <>
            <button type="button" className="inline-flex items-center gap-1.5 text-sm text-accent-ink hover:underline" onClick={() => setOpen((v) => !v)}>
              <Users className="size-3.5" /> {users.length} guest{users.length === 1 ? "" : "s"}
            </button>
            {open && (
              <ul className="divide-y divide-border border border-border text-sm">
                {users.map((u) => (
                  <GuestRow key={u.id} guest={u} onCut={active && u.active ? () => cut.mutate(u.id) : undefined} />
                ))}
              </ul>
            )}
          </>
        )}
      </CardBody>
    </Card>
  );
}

function GuestRow({ guest, onCut }: { guest: TempUser; onCut?: () => void }) {
  return (
    <li className="flex items-center gap-3 px-3 py-2">
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{guest.display_name}</div>
        <div className="truncate text-xs text-subtle">
          <span className="font-mono">{guest.username}</span> · joined {timeAgo(guest.created_at)}
          {guest.last_login_at ? ` · connected ${timeAgo(guest.last_login_at)}` : " · not connected yet"}
        </div>
      </div>
      {guest.revoked ? <Badge tone="danger">cut off</Badge> : !guest.active ? <Badge tone="neutral">ended</Badge> : onCut ? (
        <Button variant="ghost" size="xs" onClick={onCut}><Ban /> Cut off</Button>
      ) : null}
    </li>
  );
}

function NewLinkDialog({ open, onOpenChange, overview, onMade }: { open: boolean; onOpenChange: (o: boolean) => void; overview: TempOverview; onMade: (l: TempLink) => void }) {
  const [label, setLabel] = useState("");
  const [hours, setHours] = useState(String(Math.min(4, overview.max_hours)));
  const [maxUses, setMaxUses] = useState("");
  const [groups, setGroups] = useState<string[]>([overview.default_group].filter(Boolean));
  const create = useMutation({
    mutationFn: () => api.post<TempLink>(`${BASE}/temp`, {
      label: label.trim(), hours: Number(hours), max_uses: Number(maxUses) || 0,
      groups: overview.can_manage ? groups : undefined,
    }),
    onSuccess: (l) => { onMade(l); setLabel(""); setMaxUses(""); },
    onError: (e: Error) => toast.error(e.message),
  });
  const presets = PRESETS.filter((h) => h <= overview.max_hours);
  if (!presets.includes(overview.max_hours)) presets.push(overview.max_hours);
  const toggle = (g: string) => setGroups((cur) => (cur.includes(g) ? cur.filter((x) => x !== g) : [...cur, g]));
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="New temporary link"
      description="Whoever opens it gets a Mumble login that lasts as long as the link."
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
          <Field label="Lasts" hint={`At most ${overview.max_hours} hours.`}>
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
        {overview.can_manage && overview.known_groups.length > 0 && (
          <Field label="Mumble groups for the guests" hint="Only Mumble managers can give guests more than the guest group.">
            <div className="flex flex-wrap gap-1.5">
              {overview.known_groups.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => toggle(g)}
                  className={cn("border px-2.5 py-1 text-xs", groups.includes(g) ? "border-accent bg-accent-soft text-accent-ink" : "border-border text-muted hover:border-border-strong")}
                >
                  {g}
                </button>
              ))}
            </div>
          </Field>
        )}
      </div>
    </Dialog>
  );
}
