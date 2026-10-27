// The watch list (the plugin's own, and the Blacklist's when it's on) and the settings.
import {
  Alert, api, Badge, Button, Card, CardBody, CardHeader, ConfirmDialog, date, Dialog, DiscordPings, EmptyState, Field, Input, SearchInput, Select, Skeleton,
  SwitchRow, Textarea, toast,
} from "@conduit/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link } from "react-router";

import { Eye, Plus, Shield, Trash } from "./icons";
import { Pic } from "./shared";
import { BASE, ENTITY_KINDS, type Hit, type Kind, type Settings, type WatchItem, type WatchList } from "./types";

export function WatchTab() {
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<WatchItem | null>(null);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["spycheck", "watch"], queryFn: () => api.get<WatchList>(`${BASE}/watch`) });
  if (isLoading || !data) return <Skeleton className="h-48" />;
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader
          title="Watch list"
          description="Characters, corporations and alliances to look for, besides the blacklist."
          actions={data.can_manage && <Button size="sm" variant="primary" onClick={() => setAdding(true)}><Plus /> Watch</Button>}
        />
        {data.items.length === 0 ? (
          <EmptyState icon={<Eye />} title="Nobody watched yet" description={data.can_manage ? "Add whoever you want members' dealings with looked for." : undefined} />
        ) : (
          <WatchRows items={data.items} onRemove={data.can_manage ? setRemoving : undefined} />
        )}
      </Card>
      <Card>
        <CardHeader title="From the blacklist" description="Active blacklist entries are watched too." />
        {!data.blacklist_available ? (
          <CardBody><p className="text-sm text-muted">The Blacklist plugin isn't installed or switched on. Spy Check works from its own watch list.</p></CardBody>
        ) : !data.use_blacklist ? (
          <CardBody><p className="text-sm text-muted">Switched off in the settings.</p></CardBody>
        ) : data.blacklist.length === 0 ? (
          <EmptyState icon={<Shield />} title="The blacklist is empty" />
        ) : (
          <WatchRows items={data.blacklist} />
        )}
      </Card>
      {adding && <AddDialog onClose={() => setAdding(false)} />}
      <ConfirmDialog
        open={!!removing}
        onOpenChange={(o) => !o && setRemoving(null)}
        title={`Stop watching ${removing?.name ?? ""}?`}
        description="Its findings stay; the next scan just stops looking for it."
        danger
        confirmLabel={<><Trash /> Remove</>}
        onConfirm={() =>
          api.delete(`${BASE}/watch/${removing!.id}`).then(() => {
            qc.invalidateQueries({ queryKey: ["spycheck"] });
            toast.success(`${removing!.name} removed`);
            setRemoving(null);
          })
        }
      />
    </div>
  );
}

function WatchRows({ items, onRemove }: { items: WatchItem[]; onRemove?: (w: WatchItem) => void }) {
  return (
    <ul className="divide-y divide-border">
      {items.map((w) => (
        <li key={w.eve_id} className="flex items-start gap-3 px-card py-3">
          <Pic src={w.image} round={w.kind === "character"} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{w.name}</span>
              <span className="text-xs text-muted">{ENTITY_KINDS[w.kind]}</span>
              {w.severity && <Badge tone={w.severity === "banned" ? "danger" : "warning"}>{w.severity === "banned" ? "Banned" : "Watch"}</Badge>}
              {w.open > 0 && <Badge tone="warning">{w.open} new</Badge>}
            </div>
            {w.reason && <p className="mt-1 whitespace-pre-line text-sm text-muted">{w.reason}</p>}
            {w.created_at && <div className="mt-1 text-xs text-subtle">Added {date(w.created_at)}{w.added_by ? ` by ${w.added_by}` : ""}</div>}
          </div>
          {onRemove && <Button size="sm" variant="ghost" onClick={() => onRemove(w)} aria-label={`Remove ${w.name}`}><Trash /></Button>}
        </li>
      ))}
    </ul>
  );
}

function AddDialog({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [dq, setDq] = useState("");
  const [picked, setPicked] = useState<Hit | null>(null);
  const [reason, setReason] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDq(q.trim()), 350);
    return () => clearTimeout(t);
  }, [q]);
  const { data: hits, isFetching } = useQuery({
    queryKey: ["spycheck", "entities", dq],
    queryFn: () => api.get<Hit[]>(`${BASE}/entities?q=${encodeURIComponent(dq)}`),
    enabled: dq.length >= 3,
  });
  const save = useMutation({
    mutationFn: () => api.post<WatchItem>(`${BASE}/watch`, { eve_id: picked!.id, reason }),
    onSuccess: (w) => {
      qc.invalidateQueries({ queryKey: ["spycheck"] });
      toast.success(`Watching ${w.name}. The next scan looks for them.`);
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title="Watch someone"
      description="Members' dealings with them are looked for from the next scan on."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!picked} loading={save.isPending} onClick={() => save.mutate()}><Plus /> Watch</Button>
        </>
      }
    >
      <div className="space-y-5">
        <Field label="Who" hint="A character, corporation or alliance. Ones the synced data hasn't mentioned are found by their exact name.">
          <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name" aria-label="Name" />
        </Field>
        {dq.length >= 3 && !isFetching && hits && hits.length === 0 && <p className="text-sm text-muted">Nobody by that name.</p>}
        {(hits ?? []).length > 0 && (
          <div className="divide-y divide-border rounded-lg border border-border">
            {hits!.map((h) => (
              <label key={h.id} className={`flex items-center gap-3 px-3 py-2.5 text-sm ${h.watched ? "opacity-60" : "cursor-pointer"}`}>
                <input type="radio" name="who" disabled={h.watched} checked={picked?.id === h.id} onChange={() => setPicked(h)} />
                <Pic src={h.image} round={h.kind === "character"} />
                <span className="flex-1">{h.name} <span className="text-xs text-muted">{ENTITY_KINDS[h.kind]}</span></span>
                {h.watched && <span className="text-xs text-muted">Already watched</span>}
              </label>
            ))}
          </div>
        )}
        <Field label="Why (optional)">
          <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
      </div>
    </Dialog>
  );
}

export function SettingsTab() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["spycheck", "settings"], queryFn: () => api.get<Settings>(`${BASE}/settings`) });
  const [form, setForm] = useState<Settings | null>(null);
  useEffect(() => {
    if (data) setForm(data);
  }, [data]);
  const save = useMutation({
    mutationFn: (s: Settings) => api.put<Settings>(`${BASE}/settings`, s),
    onSuccess: (s) => {
      qc.setQueryData(["spycheck", "settings"], s);
      qc.invalidateQueries({ queryKey: ["spycheck"] });
      toast.success("Saved. The next scan uses them.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  if (isLoading || !form) return <Skeleton className="h-64" />;
  const set = (patch: Partial<Settings>) => setForm({ ...form, ...patch });
  const toggleKind = (k: Kind, on: boolean) => set({ skip_kinds: on ? form.skip_kinds.filter((x) => x !== k) : [...form.skip_kinds, k] });
  return (
    <div className="grid max-w-5xl gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader title="Who is told" description="One notification per scan with what's new, never one per finding." />
        <CardBody className="space-y-3">
          <Field label="Group" hint="Only its members who may see Spy Check get it. None: everyone who may.">
            <Select
              value={form.notify_group == null ? "" : String(form.notify_group)}
              onChange={(e) => set({ notify_group: e.target.value ? Number(e.target.value) : null })}
              options={[{ value: "", label: "Everyone who may see Spy Check" }, ...form.group_options.map((g) => ({ value: String(g.id), label: g.name }))]}
            />
          </Field>
          {data && form.notify_group === data.notify_group && (
            data.recipients === 0
              ? <Alert tone="warning">Nobody gets the notification: give the group the “see Spy Check findings” permission.</Alert>
              : <p className="text-sm text-muted">{data.recipients} {data.recipients === 1 ? "person gets" : "people get"} it.</p>
          )}
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="The blacklist" />
        <CardBody className="space-y-2">
          {!form.blacklist_available && <Alert tone="info">The Blacklist plugin isn't installed or switched on, so only the watch list is used.</Alert>}
          <div className="divide-y divide-border">
            <SwitchRow label="Look for blacklisted entities" description="Every active entry, besides the watch list." checked={form.use_blacklist} onCheckedChange={(v) => set({ use_blacklist: v })} />
            <SwitchRow label="Include “watch” entries" description="Off: only entries marked banned." checked={form.blacklist_watch_entries} onCheckedChange={(v) => set({ blacklist_watch_entries: v })} />
          </div>
        </CardBody>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader title="What is looked at" description="Each kind is read from the character data Conduit already syncs." />
        <CardBody className="grid gap-x-8 sm:grid-cols-2">
          <div className="divide-y divide-border">
            {form.kind_options.map((k) => (
              <SwitchRow key={k.value} label={k.label} checked={!form.skip_kinds.includes(k.value)} onCheckedChange={(v) => toggleKind(k.value, v)} />
            ))}
          </div>
          <div>
            <Field label="Contacts count above standing" hint="0 means any good standing. Contacts at or below it aren't findings.">
              <Input type="number" min={-10} max={10} step={0.5} value={form.min_standing} onChange={(e) => set({ min_standing: Number(e.target.value) })} className="w-32" />
            </Field>
            <p className="mt-4 text-sm text-muted">
              Corporation history counts stints in a watched corporation, and in corporations that are in a watched alliance today (alliance history isn't
              synced). See <Link to="/p/spycheck?tab=watch" className="text-accent-ink">the watch list</Link>.
            </p>
          </div>
        </CardBody>
      </Card>
      <div className="lg:col-span-2">
        <Button variant="primary" loading={save.isPending} onClick={() => save.mutate(form)}>Save settings</Button>
      </div>
      <DiscordPings plugin="spycheck" className="lg:col-span-2" />
    </div>
  );
}
