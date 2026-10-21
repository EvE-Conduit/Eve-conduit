// The managers' pages: services, their routes and rates.
import { api, Badge, Button, Card, CardBody, ConfirmDialog, DataTable, Dialog, EmptyState, Field, Input, isk, PageHeader, Select, Skeleton, SwitchRow, Textarea, toast } from "@conduit/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

import { Pencil, Plus, Refresh, Settings, Trash, Truck } from "./icons";
import { BackLink, RateFacts, RouteLabel } from "./shared";
import { BASE, type ManagedService, type Owner, type Route } from "./types";

const HOME = "/p/freight/manage";

interface ManageRow {
  id: number;
  name: string;
  active: boolean;
  public: boolean;
  routes: number;
  owner: Owner | null;
  open: number;
  problems: number;
  open_reward: number;
  delivered: number;
  delivered_reward: number;
}

export function ManagePage() {
  const { data, isLoading } = useQuery({ queryKey: ["freight", "manage"], queryFn: () => api.get<{ services: ManageRow[] }>(`${BASE}/manage`) });
  const navigate = useNavigate();
  return (
    <div>
      <BackLink to="/p/freight">Freight</BackLink>
      <PageHeader
        icon={<Settings />}
        eyebrow="Freight"
        title="Services"
        description="Who hauls, the routes they run and what they charge."
        actions={
          <Link to={`${HOME}/new`}>
            <Button variant="primary" size="sm">
              <Plus /> New service
            </Button>
          </Link>
        }
      />
      <Card>
        <DataTable
          rows={data?.services ?? []}
          loading={isLoading}
          rowKey={(s) => s.id}
          onRowClick={(s) => navigate(`${HOME}/${s.id}`)}
          empty={{ icon: <Truck />, title: "No services yet", description: "Create one to give members a calculator and check their contracts." }}
          columns={[
            {
              header: "Service",
              cell: (s) => (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{s.name}</span>
                  {!s.active && <Badge>Closed</Badge>}
                  {s.public && <Badge tone="info">Public</Badge>}
                </div>
              ),
            },
            {
              header: "Contracts go to",
              cell: (s) =>
                s.owner ? (
                  <span className={s.owner.login_ok ? "" : "text-danger-fg"}>
                    {s.owner.name}
                    {!s.owner.login_ok && " (login can't read contracts)"}
                  </span>
                ) : (
                  <span className="text-danger-fg">Nobody</span>
                ),
            },
            { header: "Routes", align: "right", cell: (s) => s.routes },
            { header: "Open", align: "right", cell: (s) => <>{s.open}{s.problems > 0 && <Badge tone="danger" className="ml-2">{s.problems}</Badge>}</> },
            { header: "Open rewards", align: "right", cell: (s) => <span className="font-mono tabular-nums">{isk(s.open_reward)}</span> },
            { header: "Delivered", align: "right", cell: (s) => <span className="font-mono tabular-nums">{s.delivered} · {isk(s.delivered_reward)}</span> },
          ]}
        />
      </Card>
    </div>
  );
}

interface Options {
  characters: { id: number; name: string; corporation: string | null; login_ok: boolean }[];
  states: { id: number; name: string; color: string }[];
  groups: { id: number; name: string }[];
}

type ServiceForm = {
  name: string;
  description: string;
  owner_id: number | null;
  is_corporation: boolean;
  days_to_complete: number;
  expiration_days: number;
  state_ids: number[];
  group_ids: number[];
  public: boolean;
  notify: boolean;
  active: boolean;
};

const EMPTY: ServiceForm = {
  name: "",
  description: "",
  owner_id: null,
  is_corporation: true,
  days_to_complete: 3,
  expiration_days: 7,
  state_ids: [],
  group_ids: [],
  public: false,
  notify: true,
  active: true,
};

function toggle(ids: number[], id: number) {
  return ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id];
}

export function EditPage() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const options = useQuery({ queryKey: ["freight", "options"], queryFn: () => api.get<Options>(`${BASE}/manage/options`) });
  const service = useQuery({ queryKey: ["freight", "managed", id], queryFn: () => api.get<ManagedService>(`${BASE}/manage/services/${id}`), enabled: !isNew });
  const [form, setForm] = useState<ServiceForm>(EMPTY);
  const [editing, setEditing] = useState<Route | "new" | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const s = service.data;
    if (s) {
      setForm({
        name: s.name, description: s.description, owner_id: s.owner_id, is_corporation: s.is_corporation, days_to_complete: s.days_to_complete,
        expiration_days: s.expiration_days, state_ids: s.state_ids, group_ids: s.group_ids, public: s.public, notify: s.notify, active: s.active,
      });
    }
  }, [service.data]);

  const save = useMutation({
    mutationFn: () => (isNew ? api.post<ManagedService>(`${BASE}/manage/services`, form) : api.put<ManagedService>(`${BASE}/manage/services/${id}`, form)),
    onSuccess: (s) => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["freight"] });
      if (isNew) navigate(`${HOME}/${s.id}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const sync = useMutation({
    mutationFn: () => api.post(`${BASE}/manage/services/${id}/sync`, {}),
    onSuccess: () => toast.success("Reading the contracts now; the queue updates in a minute"),
    onError: (e: Error) => toast.error(e.message),
  });
  const removeRoute = useMutation({
    mutationFn: (routeId: number) => api.delete(`${BASE}/manage/routes/${routeId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["freight"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  if (!isNew && service.isLoading) return <Skeleton className="h-96" />;
  if (!isNew && !service.data) return <EmptyState icon={<Truck />} title="No such service" />;
  const set = <K extends keyof ServiceForm>(k: K, v: ServiceForm[K]) => setForm((f) => ({ ...f, [k]: v }));
  const opts = options.data;

  return (
    <div>
      <BackLink to={HOME}>Services</BackLink>
      <PageHeader
        icon={<Truck />}
        eyebrow="Freight"
        title={isNew ? "New service" : form.name || "Service"}
        actions={
          !isNew && (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => sync.mutate()} loading={sync.isPending}>
                <Refresh /> Read contracts now
              </Button>
              <Button size="sm" variant="danger" onClick={() => setDeleting(true)}>
                <Trash /> Delete
              </Button>
            </div>
          )
        }
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card>
          <CardBody>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                save.mutate();
              }}
            >
              <Field label="Name" required>
                <Input value={form.name} maxLength={100} onChange={(e) => set("name", e.target.value)} />
              </Field>
              <Field label="Description" hint="Shown to customers above the calculator.">
                <Textarea value={form.description} maxLength={4000} onChange={(e) => set("description", e.target.value)} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Contracts go to" required hint="One of your characters. Its login reads the contracts.">
                  <Select
                    value={form.owner_id ? String(form.owner_id) : ""}
                    onChange={(e) => set("owner_id", e.target.value ? Number(e.target.value) : null)}
                    options={[
                      { value: "", label: "Pick a character" },
                      ...(service.data?.owner && !opts?.characters.some((c) => c.id === service.data?.owner?.id)
                        ? [{ value: String(service.data.owner.id), label: service.data.owner.name }]
                        : []),
                      ...(opts?.characters ?? []).map((c) => ({ value: String(c.id), label: `${c.name}${c.corporation ? ` (${c.corporation})` : ""}` })),
                    ]}
                  />
                </Field>
                <Field label="Made out to">
                  <Select
                    value={form.is_corporation ? "corporation" : "character"}
                    onChange={(e) => set("is_corporation", e.target.value === "corporation")}
                    options={[
                      { value: "corporation", label: "The character's corporation" },
                      { value: "character", label: "The character" },
                    ]}
                  />
                </Field>
                <Field label="Days to complete">
                  <Input type="number" min={1} max={30} value={form.days_to_complete} onChange={(e) => set("days_to_complete", Number(e.target.value))} />
                </Field>
                <Field label="Expiration (days)">
                  <Input type="number" min={1} max={30} value={form.expiration_days} onChange={(e) => set("expiration_days", Number(e.target.value))} />
                </Field>
              </div>
              {opts && (opts.states.length > 0 || opts.groups.length > 0) && (
                <Field label="Who may use it" hint="Nothing ticked: every member.">
                  <div className="flex flex-wrap gap-1.5">
                    {opts.states.map((s) => (
                      <Button key={`s${s.id}`} type="button" size="xs" variant={form.state_ids.includes(s.id) ? "primary" : "secondary"} onClick={() => set("state_ids", toggle(form.state_ids, s.id))}>
                        {s.name}
                      </Button>
                    ))}
                    {opts.groups.map((g) => (
                      <Button key={`g${g.id}`} type="button" size="xs" variant={form.group_ids.includes(g.id) ? "primary" : "secondary"} onClick={() => set("group_ids", toggle(form.group_ids, g.id))}>
                        {g.name}
                      </Button>
                    ))}
                  </div>
                </Field>
              )}
              <SwitchRow label="Open" description="Closed services keep their contracts but give no new prices." checked={form.active} onCheckedChange={(v) => set("active", v)} />
              <SwitchRow label="Public" description="Anyone can use the calculator, without an account." checked={form.public} onCheckedChange={(v) => set("public", v)} />
              <SwitchRow label="Tell the haulers" description="Haulers and freight managers get a notification for each new contract." checked={form.notify} onCheckedChange={(v) => set("notify", v)} />
              <Button type="submit" variant="primary" loading={save.isPending}>
                {isNew ? "Create service" : "Save"}
              </Button>
            </form>
          </CardBody>
        </Card>
        {!isNew && service.data && (
          <Card>
            <CardBody>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="hud-label text-subtle">Routes</div>
                <Button size="xs" variant="primary" onClick={() => setEditing("new")}>
                  <Plus /> Add a route
                </Button>
              </div>
              {!service.data.routes.length ? (
                <EmptyState icon={<Truck />} title="No routes yet" description="Every contract is flagged until it matches a route." />
              ) : (
                <ul className="divide-y divide-border">
                  {service.data.routes.map((r) => (
                    <li key={r.id} className="flex items-start justify-between gap-3 py-3">
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <RouteLabel route={r} />
                          {!r.active && <Badge>Off</Badge>}
                        </div>
                        <RateFacts route={r} />
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button size="icon-xs" variant="ghost" aria-label="Change" onClick={() => setEditing(r)}>
                          <Pencil />
                        </Button>
                        <Button size="icon-xs" variant="ghost" aria-label="Remove" onClick={() => removeRoute.mutate(r.id)}>
                          <Trash />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        )}
      </div>
      {editing && service.data && <RouteDialog serviceId={service.data.id} route={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title="Delete this service?"
        description="Its routes and the contracts it tracked go too. Contracts in game aren't touched."
        confirmLabel="Delete"
        danger
        onConfirm={async () => {
          await api.delete(`${BASE}/manage/services/${id}`);
          qc.invalidateQueries({ queryKey: ["freight"] });
          navigate(HOME);
        }}
      />
    </div>
  );
}

interface Hit {
  id: number;
  name: string;
  subtitle: string;
  solar_system_id?: number;
  solar_system_name?: string;
}

interface End {
  name: string;
  system_id: number | null;
  system_name: string;
  location_id: number | null;
}

/** A system, or a station or structure the site knows (which sets the system too). */
function EndPicker({ label, value, onChange }: { label: string; value: End; onChange: (e: End) => void }) {
  const [q, setQ] = useState("");
  const { data } = useQuery({
    queryKey: ["freight", "search", q],
    queryFn: async () => {
      const [systems, places] = await Promise.all([
        api.get<Hit[]>(`${BASE}/manage/search/systems?q=${encodeURIComponent(q)}`),
        q.length >= 3 ? api.get<Hit[]>(`${BASE}/manage/search/places?q=${encodeURIComponent(q)}`) : Promise.resolve([]),
      ]);
      return [...places, ...systems];
    },
    enabled: q.length >= 2,
  });
  return (
    <Field label={label} required hint={value.system_id ? (value.location_id ? `Station or structure in ${value.system_name}` : `Anywhere in ${value.system_name}`) : "Search a system, station or structure"}>
      <div className="space-y-2">
        <Input placeholder="Jita, Amarr VIII, 1DQ1-A - ..." value={q} onChange={(e) => setQ(e.target.value)} />
        {q.length >= 2 && (data?.length ?? 0) > 0 && (
          <ul className="max-h-48 overflow-auto border border-border">
            {data!.map((h) => (
              <li key={`${h.solar_system_id ? "p" : "s"}${h.id}`}>
                <button
                  type="button"
                  className="block w-full px-3 py-1.5 text-left text-sm hover:bg-hover"
                  onClick={() => {
                    onChange(
                      h.solar_system_id
                        ? { name: h.name, system_id: h.solar_system_id, system_name: h.solar_system_name ?? "", location_id: h.id }
                        : { name: h.name, system_id: h.id, system_name: h.name, location_id: null },
                    );
                    setQ("");
                  }}
                >
                  <span className="font-medium">{h.name}</span> <span className="text-xs text-subtle">{h.subtitle}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <Input value={value.name} onChange={(e) => onChange({ ...value, name: e.target.value })} placeholder="Name customers see" disabled={!value.system_id} />
      </div>
    </Field>
  );
}

function endOf(r: Route | null, which: "start" | "end"): End {
  const e = r?.[which];
  return { name: e?.name ?? "", system_id: e?.system?.id ?? null, system_name: e?.system?.name ?? "", location_id: e?.location_id ?? null };
}

function RouteDialog({ serviceId, route, onClose }: { serviceId: number; route: Route | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [start, setStart] = useState<End>(endOf(route, "start"));
  const [end, setEnd] = useState<End>(endOf(route, "end"));
  const [jumps, setJumps] = useState(route?.jumps != null ? String(route.jumps) : "");
  const [rates, setRates] = useState({
    base_price: route?.base_price ?? 0,
    price_per_m3: route?.price_per_m3 ?? 0,
    price_per_jump: route?.price_per_jump ?? 0,
    collateral_percent: route?.collateral_percent ?? 0,
    min_reward: route?.min_reward ?? 0,
    max_volume: route?.max_volume ?? 0,
    max_collateral: route?.max_collateral ?? 0,
  });
  const [bothWays, setBothWays] = useState(route?.both_ways ?? true);
  const [active, setActive] = useState(route?.active ?? true);
  const moved = !route || start.system_id !== route.start.system?.id || end.system_id !== route.end.system?.id;
  const save = useMutation({
    mutationFn: () => {
      const body = {
        start_name: start.name, start_system_id: start.system_id, start_location_id: start.location_id,
        end_name: end.name, end_system_id: end.system_id, end_location_id: end.location_id,
        // Empty after moving an end: looked up again.
        jumps: jumps === "" || (moved && route?.jumps != null && jumps === String(route.jumps)) ? null : Number(jumps),
        both_ways: bothWays, active, ...rates,
      };
      return route ? api.put<Route>(`${BASE}/manage/routes/${route.id}`, body) : api.post<Route>(`${BASE}/manage/services/${serviceId}/routes`, body);
    },
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["freight"] });
      if (r.jumps === null && rates.price_per_jump > 0) toast.warning("ESI couldn't count the jumps; type them in or the per-jump price isn't charged");
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const rate = (k: keyof typeof rates, label: string, hint?: string) => (
    <Field label={label} hint={hint}>
      <Input type="number" min={0} step="any" value={rates[k]} onChange={(e) => setRates((r) => ({ ...r, [k]: Number(e.target.value) }))} />
    </Field>
  );
  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      size="lg"
      title={route ? "Change route" : "Add a route"}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={save.isPending} disabled={!start.system_id || !end.system_id} onClick={() => save.mutate()}>
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <EndPicker label="Pick up" value={start} onChange={setStart} />
          <EndPicker label="Deliver to" value={end} onChange={setEnd} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {rate("base_price", "Base price (ISK)")}
          {rate("price_per_m3", "ISK per m³")}
          {rate("collateral_percent", "% of collateral")}
          {rate("price_per_jump", "ISK per jump")}
          <Field label="Jumps" hint="Empty: counted by ESI.">
            <Input type="number" min={0} value={jumps} onChange={(e) => setJumps(e.target.value)} />
          </Field>
          {rate("min_reward", "Minimum reward (ISK)")}
          {rate("max_volume", "Max volume (m³)", "0: no limit")}
          {rate("max_collateral", "Max collateral (ISK)", "0: no limit")}
        </div>
        <SwitchRow label="Both ways" description="The same rates from the delivery end back to the pick-up." checked={bothWays} onCheckedChange={setBothWays} />
        <SwitchRow label="On" description="Routes that are off aren't offered and don't match contracts." checked={active} onCheckedChange={setActive} />
      </div>
    </Dialog>
  );
}
