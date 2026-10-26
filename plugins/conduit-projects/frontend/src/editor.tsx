// Dialogs: starting or editing a project, adding and changing items, claiming, delivering and sending back.
import { api, Button, cn, Dialog, Field, Input, Segmented, Spinner, Textarea, toast } from "@conduit/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useEffect, useState } from "react";

import { Clipboard, Search } from "./icons";
import { BASE, type Item, type Options, type Project, type ProjectSummary } from "./types";

function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["projects"] });
}

function errorToast(e: Error) {
  toast.error(e.message);
}

/** A datetime-local value (EVE time) from an ISO date, and back. */
function toInput(iso: string | null) {
  return iso ? iso.slice(0, 16) : "";
}
function fromInput(value: string) {
  return value ? `${value}:00Z` : null;
}

export function ProjectEditor({ project, onClose, onSaved }: { project: ProjectSummary | null; onClose: () => void; onSaved?: (p: Project) => void }) {
  const invalidate = useInvalidate();
  const { data: options } = useQuery({ queryKey: ["projects", "options"], queryFn: () => api.get<Options>(`${BASE}/options`), staleTime: 600_000 });
  const [form, setForm] = useState({
    name: project?.name ?? "",
    description: project?.description ?? "",
    location: project?.location ?? "",
    deadline: toInput(project?.deadline ?? null),
    states: project?.states.map((s) => s.id) ?? ([] as number[]),
    groups: project?.groups.map((g) => g.id) ?? ([] as number[]),
  });
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));
  const toggle = (key: "states" | "groups", id: number) => set({ [key]: form[key].includes(id) ? form[key].filter((x) => x !== id) : [...form[key], id] });
  const save = useMutation({
    mutationFn: () => {
      const body = { ...form, deadline: fromInput(form.deadline), notify: true };
      return project ? api.put<Project>(`${BASE}/projects/${project.id}`, body) : api.post<Project>(`${BASE}/projects`, body);
    },
    onSuccess: (p) => {
      toast.success(project ? "Project saved" : "Project started. Now add what it needs.");
      invalidate();
      onSaved?.(p);
      onClose();
    },
    onError: errorToast,
  });
  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={project ? "Edit project" : "New project"}
      description={project ? undefined : "Its audience is told about it. Add the items it needs on the next page."}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={save.isPending} disabled={!form.name.trim()} onClick={() => save.mutate()}>
            {project ? "Save" : "Start project"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Name" required>
          <Input value={form.name} maxLength={120} onChange={(e) => set({ name: e.target.value })} placeholder="20 Hurricanes for the deployment" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Deliver to" hint="Where members drop what they built.">
            <Input value={form.location} maxLength={200} onChange={(e) => set({ location: e.target.value })} placeholder="Corp hangar, staging Keepstar" />
          </Field>
          <Field label="Deadline (EVE time)" hint="Optional.">
            <Input type="datetime-local" value={form.deadline} onChange={(e) => set({ deadline: e.target.value })} />
          </Field>
        </div>
        <Field label="Details">
          <Textarea rows={3} value={form.description} maxLength={10000} onChange={(e) => set({ description: e.target.value })} placeholder="Fit them to the doctrine and contract them to the corp." />
        </Field>
        {options && (options.states.length > 0 || options.groups.length > 0) && (
          <div>
            <div className="mb-1.5 text-[13px] font-medium">Who it's for</div>
            <p className="mb-2 text-xs text-muted">Nothing picked: every member. Otherwise only people in one of these states or groups see it and are told.</p>
            <div className="flex flex-wrap gap-1.5">
              {options.states.map((s) => (
                <Chip key={`s${s.id}`} on={form.states.includes(s.id)} onClick={() => toggle("states", s.id)}>
                  <span className="size-2 rounded-full" style={{ background: s.color }} />
                  {s.name}
                </Chip>
              ))}
              {options.groups.map((g) => (
                <Chip key={`g${g.id}`} on={form.groups.includes(g.id)} onClick={() => toggle("groups", g.id)}>{g.name}</Chip>
              ))}
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 border px-2 py-1 text-xs transition-colors",
        on ? "border-accent/60 bg-accent-soft text-text" : "border-border text-muted hover:border-border-strong hover:text-text",
      )}
    >
      {children}
    </button>
  );
}

interface TypeHit {
  id: number;
  name: string;
  icon: string;
}

/** Add one item by name, or a whole list pasted from the game. */
export function ItemAdder({ project, onClose }: { project: Project; onClose: () => void }) {
  const invalidate = useInvalidate();
  const [mode, setMode] = useState<"one" | "paste">("one");
  const [q, setQ] = useState("");
  const [dq, setDq] = useState("");
  const [type, setType] = useState<TypeHit | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [text, setText] = useState("");
  const [points, setPoints] = useState("0");
  const [iskPer, setIskPer] = useState("0");
  useEffect(() => {
    const t = setTimeout(() => setDq(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);
  const hits = useQuery({
    queryKey: ["projects", "types", dq],
    queryFn: () => api.get<TypeHit[]>(`${BASE}/types?q=${encodeURIComponent(dq)}`),
    enabled: mode === "one" && !type && dq.length >= 2,
  });
  const add = useMutation({
    mutationFn: async (): Promise<{ added: number; unknown: string[] }> => {
      const rewards = { points_per_unit: Number(points) || 0, isk_per_unit: Number(iskPer) || 0 };
      if (mode === "paste") return api.post<{ added: number; unknown: string[] }>(`${BASE}/projects/${project.id}/items/paste`, { text, ...rewards });
      await api.post<Project>(`${BASE}/projects/${project.id}/items`, { type_id: type!.id, quantity: Number(quantity), ...rewards });
      return { added: 1, unknown: [] };
    },
    onSuccess: (res) => {
      if (res.unknown.length) toast.warning(`Added ${res.added}. Not recognised: ${res.unknown.slice(0, 5).join(", ")}${res.unknown.length > 5 ? "…" : ""}`);
      else toast.success("Added");
      invalidate();
      onClose();
    },
    onError: errorToast,
  });
  const ready = mode === "one" ? !!type && Number(quantity) >= 1 : !!text.trim();
  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title="Add what it needs"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={add.isPending} disabled={!ready} onClick={() => add.mutate()}>Add</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Segmented<"one" | "paste">
          value={mode}
          onChange={setMode}
          aria-label="How to add"
          options={[{ value: "one", label: "One item", icon: <Search /> }, { value: "paste", label: "Paste a list", icon: <Clipboard /> }]}
        />
        {mode === "one" ? (
          <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
            <Field label="Item">
              {type ? (
                <div className="flex items-center gap-2 border border-border px-2 py-1.5 text-sm">
                  <img src={type.icon} alt="" className="size-6" />
                  <span className="flex-1">{type.name}</span>
                  <Button size="xs" variant="ghost" onClick={() => setType(null)}>Change</Button>
                </div>
              ) : (
                <div className="relative">
                  <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Hurricane" autoComplete="off" autoFocus />
                  {dq.length >= 2 && (
                    <div className="absolute inset-x-0 top-full z-10 mt-1 max-h-60 overflow-y-auto border border-border-strong bg-surface-raised p-1 shadow-e3">
                      {hits.isLoading ? (
                        <Spinner className="px-2 py-1.5" />
                      ) : !hits.data?.length ? (
                        <div className="px-2 py-1.5 text-xs text-subtle">No item by that name.</div>
                      ) : (
                        hits.data.map((t) => (
                          <button key={t.id} type="button" onClick={() => setType(t)} className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm hover:bg-hover">
                            <img src={t.icon} alt="" className="size-5" />
                            {t.name}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </Field>
            <Field label="How many">
              <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </Field>
          </div>
        ) : (
          <Field
            label="Items"
            hint="Paste the materials list from the in-game Industry window (the copy button under the inputs), an inventory, or lines like “Tritanium x 1000”. The same item twice adds up. Blueprints aren't in the static data, so work out the parts in game (with the ME you use) and paste them here."
          >
            <Textarea rows={8} value={text} onChange={(e) => setText(e.target.value)} className="font-mono text-xs" placeholder={"Tritanium\t1000000\nPyerite\t250000"} />
          </Field>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Points per unit" hint={project.store_enabled ? "Corp Store points for each unit delivered." : "Paid by the Corp Store plugin, which isn't switched on."}>
            <Input type="number" min={0} value={points} onChange={(e) => setPoints(e.target.value)} />
          </Field>
          <Field label="ISK per unit" hint="Only shown; paying it is up to you.">
            <Input type="number" min={0} value={iskPer} onChange={(e) => setIskPer(e.target.value)} />
          </Field>
        </div>
      </div>
    </Dialog>
  );
}

export function ItemEditor({ item, project, onClose }: { item: Item; project: Project; onClose: () => void }) {
  const invalidate = useInvalidate();
  const [quantity, setQuantity] = useState(String(item.quantity));
  const [points, setPoints] = useState(String(item.points_per_unit));
  const [iskPer, setIskPer] = useState(String(item.isk_per_unit));
  const save = useMutation({
    mutationFn: () => api.put<Project>(`${BASE}/items/${item.id}`, { quantity: Number(quantity), points_per_unit: Number(points) || 0, isk_per_unit: Number(iskPer) || 0 }),
    onSuccess: () => {
      invalidate();
      onClose();
    },
    onError: errorToast,
  });
  const remove = useMutation({
    mutationFn: () => api.delete<Project>(`${BASE}/items/${item.id}`),
    onSuccess: () => {
      toast.success(`${item.name} removed`);
      invalidate();
      onClose();
    },
    onError: errorToast,
  });
  const taken = item.confirmed + item.claimed;
  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={item.name}
      footer={
        <>
          <Button variant="danger" className="mr-auto" loading={remove.isPending} disabled={taken > 0} onClick={() => remove.mutate()}>Remove</Button>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={save.isPending} disabled={Number(quantity) < Math.max(1, taken)} onClick={() => save.mutate()}>Save</Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="How many" hint={taken ? `At least ${taken.toLocaleString("en")}: claimed or delivered.` : undefined}>
          <Input type="number" min={Math.max(1, taken)} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </Field>
        <Field label="Points per unit" hint={project.store_enabled ? undefined : "Corp Store isn't on."}>
          <Input type="number" min={0} value={points} onChange={(e) => setPoints(e.target.value)} />
        </Field>
        <Field label="ISK per unit">
          <Input type="number" min={0} value={iskPer} onChange={(e) => setIskPer(e.target.value)} />
        </Field>
      </div>
    </Dialog>
  );
}

/** Claim part of an item, or change one's claim. */
export function ClaimDialog({ item, current, onClose }: { item: Item; current: number; onClose: () => void }) {
  const invalidate = useInvalidate();
  const max = item.free + current;
  const [quantity, setQuantity] = useState(String(current || max));
  const n = Number(quantity);
  const claim = useMutation({
    mutationFn: () => api.post<Project>(`${BASE}/items/${item.id}/claim`, { quantity: n }),
    onSuccess: () => {
      toast.success(current ? "Claim changed" : `You're building ${n.toLocaleString("en")} × ${item.name}`);
      invalidate();
      onClose();
    },
    onError: errorToast,
  });
  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={current ? `Change your claim: ${item.name}` : `Build ${item.name}`}
      description={`${max.toLocaleString("en")} free to claim. Mark it delivered once it's where the project says.`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={claim.isPending} disabled={!(n >= 1 && n <= max)} onClick={() => claim.mutate()}>
            {current ? "Change claim" : "Claim"}
          </Button>
        </>
      }
    >
      <Field label="How many">
        <div className="flex gap-2">
          <Input type="number" min={1} max={max} value={quantity} onChange={(e) => setQuantity(e.target.value)} autoFocus />
          <Button variant="secondary" onClick={() => setQuantity(String(max))}>All {max.toLocaleString("en")}</Button>
        </div>
      </Field>
      {item.points_per_unit > 0 && n > 0 && (
        <p className="mt-3 text-sm text-muted">Earns {(n * item.points_per_unit).toLocaleString("en")} points once a manager confirms the delivery.</p>
      )}
    </Dialog>
  );
}

/** Mark a claim delivered (member), or send a delivery back with a reason (manager). */
export function NoteDialog({ title, description, label, placeholder, confirmLabel, onSubmit, onClose }: {
  title: string;
  description?: string;
  label: string;
  placeholder: string;
  confirmLabel: string;
  onSubmit: (note: string) => Promise<unknown>;
  onClose: () => void;
}) {
  const invalidate = useInvalidate();
  const [note, setNote] = useState("");
  const run = useMutation({
    mutationFn: () => onSubmit(note),
    onSuccess: () => {
      invalidate();
      onClose();
    },
    onError: errorToast,
  });
  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={run.isPending} onClick={() => run.mutate()}>{confirmLabel}</Button>
        </>
      }
    >
      <Field label={label}>
        <Input value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} placeholder={placeholder} autoFocus />
      </Field>
    </Dialog>
  );
}
