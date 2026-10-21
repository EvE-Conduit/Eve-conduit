// Scheduling and editing an op (ops.schedule_ops for your own, ops.manage_ops for any). Times are entered in EVE time.
import { api, Button, cn, dateTime, Dialog, Field, Input, Select, SwitchRow, Textarea, toast, useCurrentUser } from "@conduit/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useEffect, useRef, useState } from "react";

import { RoleChips, useDiscordRoles } from "./roles";
import { fromEveInput, lengthText, toEveInput } from "./time";
import { BASE, type Kind, KINDS, type Op, type Options, type Person } from "./types";

const DURATIONS = [30, 60, 90, 120, 180, 240, 360, 480];

/** The next whole hour, by EVE time, as a datetime-local value. */
function nextHour(): string {
  const d = new Date();
  d.setUTCHours(d.getUTCHours() + 1, 0, 0, 0);
  return toEveInput(d.toISOString());
}

export function Editor({ op, onClose }: { op: Op | null; onClose: () => void }) {
  const qc = useQueryClient();
  const me = useCurrentUser();
  const { data: options } = useQuery({ queryKey: ["ops", "options"], queryFn: () => api.get<Options>(`${BASE}/options`), staleTime: 600_000 });
  const discord = useDiscordRoles();
  const [form, setForm] = useState({
    title: op?.title ?? "",
    kind: (op?.kind ?? "roam") as Kind,
    starts: op ? toEveInput(op.starts_at) : nextHour(),
    duration_minutes: op?.duration_minutes ?? 120,
    // A new op is led by whoever schedules it unless someone else is picked.
    fc: op ? op.fc : me ? ({ id: me.id, name: me.name, portrait: null } as Person | null) : null,
    fc_name: op?.fc_name ?? "",
    formup: op?.formup ?? "",
    comms: op?.comms ?? "",
    doctrine_id: op?.doctrine?.id ?? (null as number | null),
    doctrine_name: op?.doctrine?.name ?? "",
    description: op?.description ?? "",
    states: op?.states.map((s) => s.id) ?? ([] as number[]),
    groups: op?.groups.map((g) => g.id) ?? ([] as number[]),
    important: op?.important ?? false,
    notify: true,
    ping: op?.ping ?? false,
    ping_roles: op?.ping_roles ?? (null as string[] | null), // null: not chosen yet, use the default roles
  });
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));
  const pingRoles = form.ping_roles ?? options?.default_ping_roles ?? [];
  const startsAt = fromEveInput(form.starts);
  const ready = !!form.title.trim() && !!startsAt;
  const doctrines = options?.doctrines ?? [];
  const toggle = (key: "states" | "groups", id: number) => set({ [key]: form[key].includes(id) ? form[key].filter((x) => x !== id) : [...form[key], id] });

  const save = useMutation({
    mutationFn: () => {
      const body = {
        title: form.title,
        kind: form.kind,
        starts_at: startsAt,
        duration_minutes: form.duration_minutes,
        fc: form.fc?.id ?? null,
        fc_name: form.fc ? "" : form.fc_name,
        formup: form.formup,
        comms: form.comms,
        doctrine_id: form.doctrine_id,
        doctrine_name: form.doctrine_id ? "" : form.doctrine_name,
        description: form.description,
        states: form.states,
        groups: form.groups,
        important: form.important,
        notify: form.notify,
        ping: form.ping,
        ping_roles: form.ping ? pingRoles : [],
      };
      return op ? api.put<Op>(`${BASE}/${op.id}`, body) : api.post<Op>(BASE, body);
    },
    onSuccess: (saved) => {
      qc.invalidateQueries({ queryKey: ["ops"] });
      toast.success(op ? "Op updated" : `Op scheduled: ${saved.title}, ${dateTime(saved.starts_at)}`);
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={op ? "Edit op" : "Schedule op"}
      size="lg"
      footer={
        <>
          <span className="mr-auto self-center text-xs text-muted">
            {startsAt ? <>Forms up <span className="text-text">{dateTime(startsAt)}</span></> : "Pick when it forms up."}
          </span>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!ready} loading={save.isPending} onClick={() => save.mutate()}>{op ? "Save" : "Schedule"}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
          <Field label="Title" required>
            <Input value={form.title} maxLength={200} onChange={(e) => set({ title: e.target.value })} placeholder="Sunday roam to Syndicate" autoFocus />
          </Field>
          <Field label="Kind">
            <Select value={form.kind} onChange={(e) => set({ kind: e.target.value as Kind })} options={KINDS.map((k) => ({ value: k.value, label: k.label }))} />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
          <Field label="Form-up (EVE time)" required hint="EVE time is UTC.">
            <Input type="datetime-local" value={form.starts} onChange={(e) => set({ starts: e.target.value })} />
          </Field>
          <Field label="Runs for">
            <Select
              value={String(form.duration_minutes)}
              onChange={(e) => set({ duration_minutes: Number(e.target.value) })}
              options={[...new Set([...DURATIONS, form.duration_minutes])].sort((a, b) => a - b).map((m) => ({ value: String(m), label: lengthText(m) }))}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FcPicker fc={form.fc} name={form.fc_name} onPick={(fc) => set({ fc, fc_name: "" })} onType={(fc_name) => set({ fc: null, fc_name })} />
          <Field label="Doctrine" hint={doctrines.length ? "From the Doctrines plugin; members can open it from the op." : "Its name, as people know it."}>
            {doctrines.length ? (
              <Select
                value={String(form.doctrine_id ?? "")}
                onChange={(e) => set({ doctrine_id: e.target.value ? Number(e.target.value) : null })}
                options={[{ value: "", label: "None" }, ...doctrines.map((d) => ({ value: String(d.id), label: d.name }))]}
              />
            ) : (
              <Input value={form.doctrine_name} maxLength={100} onChange={(e) => set({ doctrine_name: e.target.value })} placeholder="Shield Ferox" />
            )}
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Form-up location">
            <Input value={form.formup} maxLength={120} onChange={(e) => set({ formup: e.target.value })} placeholder="Home staging, fleet hangar" />
          </Field>
          <Field label="Comms">
            <Input value={form.comms} maxLength={120} onChange={(e) => set({ comms: e.target.value })} placeholder="Mumble: Ops 1" />
          </Field>
        </div>

        <Field label="Details" hint="What to bring, what to expect.">
          <Textarea rows={3} value={form.description} maxLength={5000} onChange={(e) => set({ description: e.target.value })} placeholder="Bring a spare ship. Logi gets SRP priority." />
        </Field>

        {options && (options.states.length > 0 || options.groups.length > 0) && (
          <div>
            <div className="mb-1.5 text-[13px] font-medium">Who it's for</div>
            <p className="mb-2 text-xs text-muted">Nothing picked: every member. Otherwise only people in one of these states or groups see it and are told.</p>
            <div className="flex flex-wrap gap-1.5">
              {options.states.map((s) => (
                <Chip key={`s${s.id}`} on={form.states.includes(s.id)} onClick={() => toggle("states", s.id)}>
                  <span className="size-2 rounded-full" style={{ background: s.color }} />{s.name}
                </Chip>
              ))}
              {options.groups.map((g) => <Chip key={`g${g.id}`} on={form.groups.includes(g.id)} onClick={() => toggle("groups", g.id)}>{g.name}</Chip>)}
            </div>
          </div>
        )}

        <div className="divide-y divide-border border border-border px-3">
          <SwitchRow
            label="Everyone is expected"
            description="Its audience is told now and reminded before form-up, even if they muted ops."
            checked={form.important}
            onCheckedChange={(important) => set({ important, ...(important && !op ? { ping: true } : {}) })}
          />
          <SwitchRow
            label="Ping Discord"
            description={
              discord.data?.available
                ? "Discord webhooks that ping mention their own setting and the roles below when it's posted, moved, reminded and cancelled."
                : "Discord webhooks that ping (Administration → Integrations) mention their setting when it's posted, moved, reminded and cancelled."
            }
            checked={form.ping}
            onCheckedChange={(ping) => set({ ping })}
          />
          {form.ping && discord.data?.available && (
            <div className="py-3">
              <div className="mb-1.5 text-[13px] font-medium">Roles to ping</div>
              {discord.data.error ? <p className="text-xs text-warning-fg">{discord.data.error}</p> : <RoleChips roles={discord.data.roles} value={pingRoles} onChange={(ping_roles) => set({ ping_roles })} />}
            </div>
          )}
          {!op && (
            <SwitchRow
              label="Tell members it's scheduled"
              description="Under the bell. Webhooks such as Discord hear about it either way."
              checked={form.notify || form.important}
              disabled={form.important}
              onCheckedChange={(notify) => set({ notify })}
            />
          )}
        </div>
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

/** Pick the FC from the site's members, or type a name for someone who isn't on it. */
function FcPicker({ fc, name, onPick, onType }: { fc: Person | null; name: string; onPick: (p: Person) => void; onType: (name: string) => void }) {
  const [open, setOpen] = useState(false);
  const text = fc ? fc.name : name;
  const [debounced, setDebounced] = useState(text);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = setTimeout(() => setDebounced(text), 150);
    return () => clearTimeout(h);
  }, [text]);
  const { data: hits } = useQuery({
    queryKey: ["ops", "fcs", debounced],
    queryFn: () => api.get<Person[]>(`${BASE}/fcs?q=${encodeURIComponent(debounced)}`),
    enabled: open && !fc && debounced.trim().length >= 2,
    staleTime: 60_000,
  });
  useEffect(() => {
    const onDown = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);
  const list = open && !fc && debounced.trim().length >= 2 ? hits ?? [] : [];
  const pick = (p: Person) => { onPick(p); setOpen(false); };
  return (
    <div ref={box} className="relative">
      <Field label="FC" hint={fc ? "A member of the site; they can change this op." : "Type to pick a member, or leave a name for someone who isn't on the site."}>
        <Input
          value={text}
          maxLength={100}
          onChange={(e) => { onType(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => { if (e.key === "Enter" && list[0]) { e.preventDefault(); pick(list[0]); } if (e.key === "Escape") setOpen(false); }}
          placeholder="To be announced"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={list.length > 0}
        />
      </Field>
      {list.length > 0 && (
        <ul role="listbox" className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-auto border border-border bg-surface shadow-e2">
          {list.map((p) => (
            <li key={p.id} role="option" aria-selected={false}>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => pick(p)} className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-hover">
                {p.portrait ? <img src={p.portrait} alt="" className="size-6 shrink-0 border border-border" loading="lazy" /> : <span className="size-6 shrink-0 border border-border bg-bg" />}
                <span className="truncate">{p.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
