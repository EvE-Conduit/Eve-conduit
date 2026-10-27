// Setting up staging locations, their targets and how long claims last (stock.manage_stock).
import {
  api, Badge, Button, Card, CardBody, CardHeader, ConfirmDialog, Dialog, DiscordPings, EmptyState, Field, Input, num, PageHeader, SearchInput, Segmented, Skeleton, toast,
} from "@conduit/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router";

import { Back, Boxes, Pencil, Plus, Trash } from "./icons";
import { BASE, type Hit, type Manage, type PlaceRow, STATUS, type TargetRow } from "./types";

const KEY = ["stock", "manage"];

export function ManagePage() {
  const { data, isLoading } = useQuery({ queryKey: KEY, queryFn: () => api.get<Manage>(`${BASE}/manage`) });
  const [addingPlace, setAddingPlace] = useState(false);
  const [editingPlace, setEditingPlace] = useState<PlaceRow | null>(null);
  const [target, setTarget] = useState<{ place: PlaceRow; target: TargetRow | null } | null>(null);
  const [removing, setRemoving] = useState<{ kind: "place" | "target"; id: number; name: string } | null>(null);
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ["stock"] });

  return (
    <>
      <Link to="/p/stock" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-text"><Back /> Doctrine Stock</Link>
      <PageHeader
        eyebrow="Doctrine Stock"
        title="Manage"
        icon={<Boxes />}
        description="Staging locations and how many of each ship or item should be for sale there. Managers are told when something drops below its low mark."
        actions={<Button variant="primary" onClick={() => setAddingPlace(true)}><Plus /> Add location</Button>}
      />
      {isLoading || !data ? (
        <Skeleton className="h-64" />
      ) : (
        <div className="space-y-6">
          {data.places.length === 0 && (
            <Card><EmptyState icon={<Boxes />} title="No staging locations yet" description="Add the station or structure where things should be for sale." /></Card>
          )}
          {data.places.map((p) => (
            <Card key={p.id}>
              <CardHeader
                title={p.label || p.name}
                description={[p.label ? p.name : null, p.system].filter(Boolean).join(" · ")}
                actions={
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => setTarget({ place: p, target: null })}><Plus /> Target</Button>
                    <Button size="icon-sm" variant="ghost" onClick={() => setEditingPlace(p)} aria-label={`Edit ${p.name}`}><Pencil /></Button>
                    <Button size="icon-sm" variant="ghost" onClick={() => setRemoving({ kind: "place", id: p.id, name: p.label || p.name })} aria-label={`Remove ${p.name}`}><Trash /></Button>
                  </div>
                }
              />
              {p.targets.length === 0 ? (
                <p className="px-card pb-card text-sm text-muted">No targets yet.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {p.targets.map((t) => (
                    <li key={t.id} className="flex items-center gap-3 px-card py-2.5 text-sm">
                      <img src={t.icon} alt="" className="size-8" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{t.fit ? `${t.fit.name} (${t.name})` : t.name}</div>
                        <div className="truncate text-xs text-muted">
                          want {num(t.quantity)} · low below {num(t.low)}{t.note && ` · ${t.note}`}
                        </div>
                      </div>
                      <span className="font-mono text-xs tabular-nums">{num(t.have)}/{num(t.quantity)}</span>
                      <Badge tone={STATUS[t.status].tone}>{STATUS[t.status].label}</Badge>
                      <Button size="icon-sm" variant="ghost" onClick={() => setTarget({ place: p, target: t })} aria-label={`Edit ${t.name}`}><Pencil /></Button>
                      <Button size="icon-sm" variant="ghost" onClick={() => setRemoving({ kind: "target", id: t.id, name: t.fit?.name ?? t.name })} aria-label={`Remove ${t.name}`}><Trash /></Button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          ))}
          <ClaimSettings days={data.settings.claim_days} />
          <DiscordPings plugin="stock" />
        </div>
      )}
      {addingPlace && <PlaceDialog onClose={() => setAddingPlace(false)} />}
      {editingPlace && <PlaceDialog place={editingPlace} onClose={() => setEditingPlace(null)} />}
      {target && data && <TargetDialog place={target.place} target={target.target} doctrines={data.doctrines} onClose={() => setTarget(null)} />}
      <ConfirmDialog
        open={!!removing}
        onOpenChange={(o) => !o && setRemoving(null)}
        title={`Remove ${removing?.name}?`}
        description={removing?.kind === "place" ? "Its targets and claims go with it." : "Its claims go with it."}
        danger
        confirmLabel="Remove"
        onConfirm={() => api.delete(removing!.kind === "place" ? `${BASE}/places/${removing!.id}` : `${BASE}/targets/${removing!.id}`).then(refresh)}
      />
    </>
  );
}

function ClaimSettings({ days }: { days: number }) {
  const qc = useQueryClient();
  const [value, setValue] = useState(String(days));
  const save = useMutation({
    mutationFn: () => api.put(`${BASE}/settings`, { claim_days: Number(value) }),
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["stock"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Card>
      <CardHeader title="Claims" description="When a member says they'll seed something, their claim lasts this long. It also ends once the target is met." />
      <CardBody className="flex items-end gap-3">
        <Field label="Days a claim lasts">
          <Input type="number" min={1} max={90} value={value} onChange={(e) => setValue(e.target.value)} className="max-w-28 font-mono" />
        </Field>
        <Button loading={save.isPending} disabled={Number(value) === days} onClick={() => save.mutate()}>Save</Button>
      </CardBody>
    </Card>
  );
}

function Search({ kind, placeholder, onPick }: { kind: "places" | "types" | "fits"; placeholder: string; onPick: (hit: Hit) => void }) {
  const [q, setQ] = useState("");
  const min = kind === "places" ? 3 : 2;
  const { data } = useQuery({
    queryKey: ["stock", "search", kind, q],
    queryFn: () => api.get<Hit[]>(`${BASE}/search/${kind}?q=${encodeURIComponent(q)}`),
    enabled: q.trim().length >= min,
  });
  return (
    <div className="relative">
      <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} autoFocus />
      {q.trim().length >= min && data && (
        <ul className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto border border-border-strong bg-surface-raised shadow-e3">
          {data.length === 0 && <li className="px-3 py-2 text-sm text-subtle">Nothing found</li>}
          {data.map((h) => (
            <li key={h.id}>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-hover"
                onClick={() => {
                  onPick(h);
                  setQ("");
                }}
              >
                {h.icon && <img src={h.icon} alt="" className="size-6" />}
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{h.name}</span>
                  <span className="block truncate text-xs text-subtle">{h.subtitle}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PlaceDialog({ place, onClose }: { place?: PlaceRow; onClose: () => void }) {
  const qc = useQueryClient();
  const [picked, setPicked] = useState<Hit | null>(null);
  const [label, setLabel] = useState(place?.label ?? "");
  const [order, setOrder] = useState(String(place?.order ?? 0));
  const save = useMutation({
    mutationFn: () =>
      place
        ? api.put(`${BASE}/places/${place.id}`, { label, order: Number(order) || 0 })
        : api.post(`${BASE}/places`, { location_id: picked?.id, label, order: Number(order) || 0 }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stock"] });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={place ? `Edit ${place.label || place.name}` : "Add a staging location"}
      description={place ? place.name : "Stations and structures the site already knows: someone has assets, orders or contracts there."}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={save.isPending} disabled={!place && !picked} onClick={() => save.mutate()}>Save</Button>
        </>
      }
    >
      <div className="space-y-4">
        {!place && (
          <Field label="Station or structure">
            {picked ? (
              <div className="flex items-center justify-between gap-2 border border-border px-3 py-2 text-sm">
                <span><span className="font-medium">{picked.name}</span> <span className="text-xs text-subtle">{picked.subtitle}</span></span>
                <Button size="xs" variant="ghost" onClick={() => setPicked(null)}>Change</Button>
              </div>
            ) : (
              <Search kind="places" placeholder="Type at least 3 letters" onPick={setPicked} />
            )}
          </Field>
        )}
        <Field label="Label" hint="Optional, e.g. Main staging">
          <Input value={label} onChange={(e) => setLabel(e.target.value)} maxLength={100} />
        </Field>
        <Field label="Order" hint="Lower comes first">
          <Input type="number" value={order} onChange={(e) => setOrder(e.target.value)} className="max-w-28 font-mono" />
        </Field>
      </div>
    </Dialog>
  );
}

function TargetDialog({ place, target, doctrines, onClose }: { place: PlaceRow; target: TargetRow | null; doctrines: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [mode, setMode] = useState<"type" | "fit">(target?.fit ? "fit" : "type");
  const [picked, setPicked] = useState<Hit | null>(
    target ? (target.fit ? { id: target.fit.id, name: target.fit.name, subtitle: target.name, icon: target.icon } : { id: target.type_id, name: target.name, subtitle: "", icon: target.icon }) : null,
  );
  const [quantity, setQuantity] = useState(String(target?.quantity ?? 10));
  const [low, setLow] = useState(target && target.low !== target.quantity ? String(target.low) : "");
  const [note, setNote] = useState(target?.note ?? "");
  const save = useMutation({
    mutationFn: () => {
      const body = {
        type_id: mode === "type" ? picked?.id : null,
        fit_id: mode === "fit" ? picked?.id : null,
        quantity: Number(quantity),
        low: low === "" ? null : Number(low),
        note,
        order: target?.order ?? 0,
      };
      return target ? api.put(`${BASE}/targets/${target.id}`, body) : api.post(`${BASE}/places/${place.id}/targets`, body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stock"] });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={target ? "Edit target" : `New target at ${place.label || place.name}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={save.isPending} disabled={!picked || !(Number(quantity) >= 1)} onClick={() => save.mutate()}>Save</Button>
        </>
      }
    >
      <div className="space-y-4">
        {doctrines && (
          <Segmented<"type" | "fit">
            value={mode}
            onChange={(m) => {
              setMode(m);
              setPicked(null);
            }}
            options={[{ value: "type", label: "Ship or item" }, { value: "fit", label: "Doctrine fit" }]}
            aria-label="What to stock"
          />
        )}
        <Field label={mode === "fit" ? "Doctrine fit" : "Ship or item"} hint={mode === "fit" ? "Counts the fit's hull: on the market, or on contract (usually fitted)." : undefined}>
          {picked ? (
            <div className="flex items-center justify-between gap-2 border border-border px-3 py-2 text-sm">
              <span className="flex min-w-0 items-center gap-2">
                {picked.icon && <img src={picked.icon} alt="" className="size-6" />}
                <span className="truncate font-medium">{picked.name}</span>
                {picked.subtitle && <span className="truncate text-xs text-subtle">{picked.subtitle}</span>}
              </span>
              <Button size="xs" variant="ghost" onClick={() => setPicked(null)}>Change</Button>
            </div>
          ) : (
            <Search kind={mode === "fit" ? "fits" : "types"} placeholder={mode === "fit" ? "Fit name" : "Type a name"} onPick={setPicked} />
          )}
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Should be for sale">
            <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} className="font-mono" />
          </Field>
          <Field label="Low below" hint="Alert below this many; empty means the target">
            <Input type="number" min={0} value={low} onChange={(e) => setLow(e.target.value)} className="font-mono" placeholder={quantity} />
          </Field>
        </div>
        <Field label="Note" hint="Optional, shown to members">
          <Input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} />
        </Field>
      </div>
    </Dialog>
  );
}
