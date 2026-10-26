// Managers (store.manage_store): the items, how points are earned, and giving or taking points by hand.
import {
  Alert, api, Avatar, Badge, Button, Card, CardBody, CardHeader, ConfirmDialog, Dialog, EmptyState, Field, Input, PageHeader, Skeleton,
  Switch, Textarea, timeAgo, toast,
} from "@conduit/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router";

import { Back, Coins, Package, Pencil, Plus, Trash, Wrench } from "./icons";
import { ItemIcon, Picker, Points } from "./shared";
import { BASE, type Item, type Manage, type Member, type StoreSettings } from "./types";

const KEY = ["store", "manage"];

export function ManagePage() {
  const { data, isLoading } = useQuery({ queryKey: KEY, queryFn: () => api.get<Manage>(`${BASE}/manage`) });
  return (
    <>
      <Link to="/p/store" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-text"><Back /> Store</Link>
      <PageHeader eyebrow="Corp Store" title="Manage the store" icon={<Wrench />} description="What's for sale, how members earn points, and points given by hand." />
      {isLoading || !data ? (
        <Skeleton className="h-64" />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
          <Items items={data.items} />
          <div className="space-y-6">
            <Earning settings={data.settings} />
            <Award awards={data.awards} />
          </div>
        </div>
      )}
    </>
  );
}

type Draft = Omit<Item, "id" | "icon" | "bought"> & { id?: number; icon: string | null };
const BLANK: Draft = { name: "", description: "", type_id: null, type_name: null, icon: null, price: 100, stock: null, per_member_limit: null, active: true, order: 0 };

function Items({ items }: { items: Item[] }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Draft | null>(null);
  const [deleting, setDeleting] = useState<Item | null>(null);
  return (
    <Card className="self-start">
      <CardHeader title="Items" description="Hidden items stay on past orders but can't be bought." actions={<Button variant="primary" size="sm" onClick={() => setEditing({ ...BLANK })}><Plus /> Add item</Button>} />
      {items.length === 0 ? (
        <EmptyState icon={<Package />} title="No items yet" description="Add ships, modules, PLEX, ISK or anything else you'll hand over." />
      ) : (
        <ul className="divide-y divide-border">
          {items.map((i) => (
            <li key={i.id} className="flex items-center gap-3 px-card py-3 text-sm">
              <ItemIcon icon={i.icon} name={i.name} className="size-9" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{i.name}</span>
                  {!i.active && <Badge tone="neutral">hidden</Badge>}
                </div>
                <div className="text-xs text-muted">
                  {[i.stock == null ? "unlimited" : `${i.stock} in stock`, i.per_member_limit != null && `${i.per_member_limit} per member`].filter(Boolean).join(" · ")}
                </div>
              </div>
              <Points value={i.price} className="text-xs" />
              <Button size="sm" variant="ghost" onClick={() => setEditing({ ...i })} aria-label={`Edit ${i.name}`}><Pencil /></Button>
              <Button size="sm" variant="ghost" onClick={() => setDeleting(i)} aria-label={`Delete ${i.name}`}><Trash /></Button>
            </li>
          ))}
        </ul>
      )}
      {editing && <ItemDialog draft={editing} onClose={() => setEditing(null)} />}
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete ${deleting?.name}?`}
        description="Only items nobody has ordered can be deleted; hide the others."
        danger
        confirmLabel="Delete"
        onConfirm={() =>
          api.delete(`${BASE}/items/${deleting!.id}`).then(() => qc.invalidateQueries({ queryKey: ["store"] }), (e: Error) => toast.error(e.message))
        }
      />
    </Card>
  );
}

const optional = (v: string) => (v.trim() === "" ? null : Math.max(0, Math.floor(Number(v)) || 0));

function ItemDialog({ draft, onClose }: { draft: Draft; onClose: () => void }) {
  const qc = useQueryClient();
  const [d, setD] = useState(draft);
  const set = (patch: Partial<Draft>) => setD((x) => ({ ...x, ...patch }));
  const type = d.type_id ? { id: d.type_id, name: d.type_name ?? `Type ${d.type_id}`, icon: d.icon } : null;
  const save = useMutation({
    mutationFn: () => (d.id ? api.put(`${BASE}/items/${d.id}`, d) : api.post(`${BASE}/items`, d)),
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["store"] });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={d.id ? `Edit ${draft.name}` : "Add an item"}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={save.isPending} disabled={!d.name.trim() || d.price < 1} onClick={() => save.mutate()}>Save</Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <span className="block text-[13px] font-medium">EVE item <span className="font-normal text-subtle">(optional, for its picture)</span></span>
          <Picker<{ id: number; name: string; icon: string | null; subtitle?: string }>
            url={`${BASE}/types`}
            value={type}
            onChange={(t) => set(t ? { type_id: t.id, type_name: t.name, icon: t.icon, name: d.name.trim() ? d.name : t.name } : { type_id: null, type_name: null, icon: null })}
            placeholder="Ferox, PLEX, Large Shield Extender II…"
            empty="No item by that name."
          />
        </div>
        <Field label="Name" required className="sm:col-span-2">
          <Input value={d.name} onChange={(e) => set({ name: e.target.value })} maxLength={100} />
        </Field>
        <Field label="Description" className="sm:col-span-2" hint="E.g. fitted to doctrine, delivered in staging.">
          <Textarea rows={3} value={d.description} onChange={(e) => set({ description: e.target.value })} />
        </Field>
        <Field label="Price in points" required>
          <Input type="number" min={1} value={d.price} onChange={(e) => set({ price: Math.max(0, Math.floor(Number(e.target.value)) || 0) })} />
        </Field>
        <Field label="Sort order" hint="Lower comes first.">
          <Input type="number" value={d.order} onChange={(e) => set({ order: Math.floor(Number(e.target.value)) || 0 })} />
        </Field>
        <Field label="In stock" hint="Empty: unlimited.">
          <Input type="number" min={0} value={d.stock ?? ""} onChange={(e) => set({ stock: optional(e.target.value) })} />
        </Field>
        <Field label="Limit per member" hint="Empty: no limit.">
          <Input type="number" min={1} value={d.per_member_limit ?? ""} onChange={(e) => set({ per_member_limit: optional(e.target.value) })} />
        </Field>
        <label className="inline-flex items-center gap-2 text-sm sm:col-span-2">
          <Switch checked={d.active} onCheckedChange={(active) => set({ active })} />
          {d.active ? "For sale" : "Hidden"}
        </label>
      </div>
    </Dialog>
  );
}

const SOURCE_INFO = [
  { key: "referral_points", plugin: "recruit", name: "Recruitment", label: "Referral", hint: "To the member a recruit named as their referrer, when the recruit is accepted." },
  { key: "fleet_points", plugin: "fleets", name: "Fleets", label: "Fleet", hint: "To each member with a FAT, once per fleet however many characters they brought, when the fleet ends." },
  { key: "mentor_points", plugin: "mentors", name: "Mentoring", label: "Mentee graduated", hint: "To the mentor, when their mentee graduates." },
] as const;

function PluginState({ state, name }: { state: { installed: boolean; enabled: boolean }; name: string }) {
  if (state.enabled) return null;
  return <Badge tone="warning">{state.installed ? `${name} is switched off` : `needs ${name}`}</Badge>;
}

function Earning({ settings }: { settings: StoreSettings }) {
  const qc = useQueryClient();
  const [s, setS] = useState(settings);
  const save = useMutation({
    mutationFn: () => api.put<StoreSettings>(`${BASE}/settings`, s),
    onSuccess: (saved) => {
      qc.setQueryData<Manage>(KEY, (m) => (m ? { ...m, settings: saved } : m));
      toast.success("Saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Card>
      <CardHeader title="Earning points" description="Points members get automatically. 0 switches one off." />
      <CardBody className="space-y-4">
        {SOURCE_INFO.map((src) => (
          <div key={src.key} className="grid grid-cols-[1fr_96px] items-start gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-sm font-medium">{src.label} <PluginState state={settings.sources[src.plugin]} name={src.name} /></div>
              <p className="text-xs text-muted">{src.hint}</p>
            </div>
            <Input type="number" min={0} aria-label={`Points: ${src.label}`} value={s[src.key]}
              onChange={(e) => setS({ ...s, [src.key]: Math.max(0, Math.floor(Number(e.target.value)) || 0) })} />
          </div>
        ))}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-sm font-medium">Industry projects <PluginState state={settings.sources.projects} name="Industry Projects" /></div>
            <p className="text-xs text-muted">Each project sets its own points per delivery.</p>
          </div>
          <Switch checked={s.projects_enabled} onCheckedChange={(projects_enabled) => setS({ ...s, projects_enabled })} aria-label="Points from industry projects" />
        </div>
        <div className="flex justify-end border-t border-border pt-4">
          <Button variant="primary" loading={save.isPending} onClick={() => save.mutate()}>Save</Button>
        </div>
      </CardBody>
    </Card>
  );
}

function Award({ awards }: { awards: Manage["awards"] }) {
  const qc = useQueryClient();
  const [member, setMember] = useState<Member | null>(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const n = Math.trunc(Number(amount)) || 0;
  const give = useMutation({
    mutationFn: () => api.post<{ awards: Manage["awards"] }>(`${BASE}/awards`, { user_id: member!.id, points: n, reason }),
    onSuccess: ({ awards }) => {
      toast.success(n > 0 ? `Gave ${member!.name} ${n.toLocaleString("en")} points` : `Took ${(-n).toLocaleString("en")} points from ${member!.name}`);
      qc.setQueryData<Manage>(KEY, (m) => (m ? { ...m, awards } : m));
      qc.invalidateQueries({ queryKey: ["store", "me"] });
      setMember(null);
      setAmount("");
      setReason("");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Card>
      <CardHeader title="Give or take points" description="For anything the automatic sources don't cover. The member is told why; it's in the audit log." />
      <CardBody className="space-y-4">
        <div className="space-y-1.5">
          <span className="block text-[13px] font-medium">Member</span>
          <Picker<Member> url={`${BASE}/members`} value={member} onChange={setMember} placeholder="Main character name" empty="No member by that name." />
        </div>
        <Field label="Points" hint="Negative takes points away.">
          <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-32" />
        </Field>
        <Field label="What for" required>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} placeholder="Scouted the whole Sunday op" />
        </Field>
        {n < 0 && <Alert tone="warning">This takes points away; their balance can go below zero.</Alert>}
        <div className="flex justify-end">
          <Button variant="primary" loading={give.isPending} disabled={!member || !n || !reason.trim()} onClick={() => give.mutate()}>
            <Coins /> {n < 0 ? "Take points" : "Give points"}
          </Button>
        </div>
      </CardBody>
      {awards.length > 0 && (
        <ul className="divide-y divide-border border-t border-border">
          {awards.slice(0, 10).map((a) => (
            <li key={a.id} className="flex items-center gap-3 px-card py-2.5 text-sm">
              <Avatar src={a.user.portrait} name={a.user.name} size="xs" />
              <div className="min-w-0 flex-1">
                <div className="truncate"><span className="font-medium">{a.user.name}</span> <span className="text-muted">· {a.reason}</span></div>
                <div className="text-xs text-subtle">{a.by} · {timeAgo(a.created_at)}</div>
              </div>
              <span className={a.points > 0 ? "font-mono text-xs text-success-fg" : "font-mono text-xs text-danger-fg"}>
                {a.points > 0 ? "+" : ""}{a.points.toLocaleString("en")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
