// Adding and editing a timer (timers.manage_timers). The time is entered as the game shows it ("1d 4h 23m") or exactly.
import { api, Button, cn, dateTime, Dialog, Field, Input, Segmented, Select, SwitchRow, Textarea, toast } from "@conduit/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import { RoleChips, useDiscordRoles } from "./roles";
import { fromLocalInput, parseTimeLeft, toLocalInput } from "./time";
import { BASE, type Kind, KINDS, type OwnStructure, secTone, type Settings, type Side, type StructureType, type System, type Timer } from "./types";

export function Editor({ timer: t, onClose }: { timer: Timer | null; onClose: () => void }) {
  const qc = useQueryClient();
  const { data: types } = useQuery({ queryKey: ["timers", "types"], queryFn: () => api.get<StructureType[]>(`${BASE}/types`), staleTime: 3_600_000 });
  const { data: settings } = useQuery({ queryKey: ["timers", "settings"], queryFn: () => api.get<Settings>(`${BASE}/settings`), staleTime: 600_000 });
  const discord = useDiscordRoles();
  const [form, setForm] = useState({
    name: t?.name ?? "",
    structure_type: t?.structure_type ?? "",
    system: t ? { id: t.system.id, name: t.system.name, region: t.system.region, security: t.system.security } : (null as System | null),
    kind: (t?.kind ?? "armor") as Kind,
    side: (t?.side ?? "friendly") as Side,
    owner: t?.owner ?? "",
    notes: t?.notes ?? "",
    important: t?.important ?? false,
    notify: true,
    structure_id: t?.structure_id ?? (null as number | null),
    ping: t?.ping ?? false,
    ping_roles: t?.ping_roles ?? (null as string[] | null), // null: not chosen yet, use the default roles
  });
  // A new timer pings the roles from the settings unless its own were picked.
  const pingRoles = form.ping_roles ?? settings?.default_ping_roles ?? [];
  const [mode, setMode] = useState<"left" | "exact">(t ? "exact" : "left");
  const [left, setLeft] = useState("");
  const [exact, setExact] = useState(toLocalInput(t?.ends_at));
  // "Time left" counts from when it was typed, so the saved time doesn't drift while the form is open.
  const [typedAt, setTypedAt] = useState(Date.now());
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));
  /** One of our own structures was picked: fill in everything the corporation sheet knows about it. */
  const pickStructure = (s: OwnStructure) => {
    set({
      name: s.name,
      structure_type: s.structure_type,
      structure_id: s.structure_id,
      ...(s.system ? { system: s.system } : {}),
      ...(s.owner ? { owner: s.owner } : {}),
      ...(s.ours ? { side: "friendly" as Side } : {}),
      ...(s.kind ? { kind: s.kind } : {}),
    });
    if (s.ends_at) {
      setMode("exact");
      setExact(toLocalInput(s.ends_at));
    }
  };

  const seconds = mode === "left" ? parseTimeLeft(left) : null;
  const endsAt = mode === "left" ? (seconds != null ? new Date(typedAt + seconds * 1000).toISOString() : null) : fromLocalInput(exact);
  const ready = !!form.name.trim() && !!form.system && !!endsAt;

  const save = useMutation({
    mutationFn: () => {
      const body = {
        name: form.name,
        structure_type: form.structure_type,
        system: form.system!.id,
        kind: form.kind,
        side: form.side,
        owner: form.owner,
        ends_at: endsAt,
        notes: form.notes,
        important: form.important,
        notify: form.notify,
        structure_id: form.structure_id,
        ping: form.ping,
        ping_roles: form.ping ? pingRoles : [],
      };
      return t ? api.put<Timer>(`${BASE}/${t.id}`, body) : api.post<Timer>(BASE, body);
    },
    onSuccess: (saved) => {
      qc.invalidateQueries({ queryKey: ["timers"] });
      toast.success(t ? "Timer updated" : `Timer added: ${saved.name} comes out ${dateTime(saved.ends_at)}`);
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={t ? "Edit timer" : "Add timer"}
      size="lg"
      footer={
        <>
          <span className="mr-auto self-center text-xs text-muted">
            {endsAt ? <>Comes out <span className="text-text">{dateTime(endsAt)}</span></> : mode === "left" ? "Type the time left as the game shows it." : "Pick the exact time."}
          </span>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!ready} loading={save.isPending} onClick={() => save.mutate()}>{t ? "Save" : "Add timer"}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
          <StructurePicker
            value={form.name}
            picked={form.structure_id}
            onChange={(name) => set({ name, structure_id: null })}
            onPick={pickStructure}
          />
          <Field label="Type">
            <Input list="timers-structure-types" value={form.structure_type} maxLength={60} onChange={(e) => set({ structure_type: e.target.value })} placeholder="Fortizar" />
            <datalist id="timers-structure-types">
              {(types ?? []).map((x) => <option key={x.name} value={x.name} />)}
            </datalist>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <SystemPicker value={form.system} onChange={(system) => set({ system })} />
          <Field label="Owner" hint="Corporation or alliance.">
            <Input value={form.owner} maxLength={120} onChange={(e) => set({ owner: e.target.value })} placeholder="Goonswarm Federation" />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Timer">
            <Select value={form.kind} onChange={(e) => set({ kind: e.target.value as Kind })} options={KINDS.map((k) => ({ value: k.value, label: k.label }))} />
          </Field>
          <div>
            <div className="mb-1.5 text-[13px] font-medium">Whose</div>
            <Segmented<Side>
              value={form.side}
              onChange={(side) => set({ side })}
              size="sm"
              className="w-full"
              options={[{ value: "friendly", label: "Ours" }, { value: "hostile", label: "Hostile" }, { value: "neutral", label: "Neutral" }]}
            />
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <span className="text-[13px] font-medium">When it comes out <span className="text-danger-fg">*</span></span>
            <Segmented<"left" | "exact">
              value={mode}
              onChange={setMode}
              size="sm"
              options={[{ value: "left", label: "Time left" }, { value: "exact", label: "Exact time" }]}
            />
          </div>
          {mode === "left" ? (
            <>
              <Input
                value={left}
                onChange={(e) => { setLeft(e.target.value); setTypedAt(Date.now()); }}
                placeholder="1d 4h 23m"
                className="font-mono"
                aria-invalid={!!left && seconds == null}
              />
              <p className="mt-1.5 text-xs text-muted">As the game shows it: <span className="font-mono">1d 4h 23m</span>, <span className="font-mono">4h 23m</span>, <span className="font-mono">45m</span> or <span className="font-mono">4:23</span>. Counted from now.</p>
            </>
          ) : (
            <>
              <Input type="datetime-local" value={exact} onChange={(e) => setExact(e.target.value)} />
              <p className="mt-1.5 text-xs text-muted">In your own time zone{endsAt ? <>; that's {dateTime(endsAt)}</> : null}.</p>
            </>
          )}
        </div>

        <Field label="Notes" hint="Form-up, doctrine, comms, what to expect.">
          <Textarea rows={3} value={form.notes} maxLength={5000} onChange={(e) => set({ notes: e.target.value })} placeholder="Form up 30 minutes before on Mumble. Doctrine: Ferox fleet." />
        </Field>

        <div className="divide-y divide-border border border-border px-3">
          <SwitchRow
            label="Everyone is expected"
            description="Members are told now and reminded before it comes out, even if they muted timers."
            checked={form.important}
            onCheckedChange={(important) => set({ important, ...(important && !t ? { ping: true } : {}) })}
          />
          <SwitchRow
            label="Ping Discord"
            description={
              discord.data?.available
                ? "Discord webhooks that ping mention their own setting and the roles below when it's added, moved and reminded."
                : "Discord webhooks that ping (Administration → Integrations) mention their setting when it's added, moved and reminded."
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
          {!t && (
            <SwitchRow
              label="Tell members it's been added"
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

/** A solar system, found by typing its name. */
function SystemPicker({ value, onChange }: { value: System | null; onChange: (s: System | null) => void }) {
  const [q, setQ] = useState(value?.name ?? "");
  const [open, setOpen] = useState(false);
  const [debounced, setDebounced] = useState(q);
  const box = useRef<HTMLDivElement>(null);
  // Filled in from elsewhere (a structure was picked): show that system's name.
  useEffect(() => {
    if (value && value.name !== q) { setQ(value.name); setOpen(false); }
  }, [value?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const h = setTimeout(() => setDebounced(q), 150);
    return () => clearTimeout(h);
  }, [q]);
  const { data: hits } = useQuery({
    queryKey: ["timers", "systems", debounced],
    queryFn: () => api.get<System[]>(`${BASE}/systems?q=${encodeURIComponent(debounced)}`),
    enabled: open && debounced.trim().length >= 2 && debounced !== value?.name,
    staleTime: 600_000,
  });
  useEffect(() => {
    const onDown = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);
  const pick = (s: System) => { onChange(s); setQ(s.name); setOpen(false); };
  const list = open && debounced !== value?.name ? hits ?? [] : [];
  return (
    <div ref={box} className="relative">
      <Field label="Solar system" required hint={value ? `${value.region} · ${value.security.toFixed(1)}` : "Start typing the name."}>
        <Input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); if (value && e.target.value !== value.name) onChange(null); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => { if (e.key === "Enter" && list[0]) { e.preventDefault(); pick(list[0]); } if (e.key === "Escape") setOpen(false); }}
          placeholder="Jita"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={list.length > 0}
        />
      </Field>
      {list.length > 0 && (
        <ul role="listbox" className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-auto border border-border bg-surface shadow-e2">
          {list.map((s) => (
            <li key={s.id} role="option" aria-selected={s.id === value?.id}>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => pick(s)} className="flex w-full items-baseline gap-2 px-3 py-2 text-left text-sm hover:bg-hover">
                <span className={cn("font-mono text-xs font-semibold tabular-nums", secTone(s.security))}>{s.security.toFixed(1)}</span>
                <span className="font-medium">{s.name}</span>
                <span className="ml-auto truncate text-xs text-subtle">{s.region}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const STATE_LABEL: Record<string, string> = {
  shield_vulnerable: "Shields up",
  armor_vulnerable: "Armor vulnerable",
  hull_vulnerable: "Hull vulnerable",
  armor_reinforce: "Armor reinforced",
  hull_reinforce: "Hull reinforced",
  anchoring: "Anchoring",
  anchor_vulnerable: "Anchoring",
  unanchored: "Unanchored",
  fitting_invulnerable: "Fitting",
  onlining_vulnerable: "Onlining",
  deploy_vulnerable: "Deploying",
  unknown: "",
};

/**
 * The structure's name. While typing, our own structures (from the corporation sheet) whose name, system or type
 * matches are offered; picking one fills in the rest of the form. With nothing to offer (no match, or no access to
 * the corporation sheet) the name is simply what was typed.
 */
function StructurePicker({ value, picked, onChange, onPick }: { value: string; picked: number | null; onChange: (name: string) => void; onPick: (s: OwnStructure) => void }) {
  const [open, setOpen] = useState(false);
  const [debounced, setDebounced] = useState(value);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = setTimeout(() => setDebounced(value), 150);
    return () => clearTimeout(h);
  }, [value]);
  const { data: hits } = useQuery({
    queryKey: ["timers", "structures", debounced],
    queryFn: () => api.get<OwnStructure[]>(`${BASE}/structures?q=${encodeURIComponent(debounced)}`),
    enabled: open && picked == null && debounced.trim().length >= 2,
    staleTime: 60_000,
  });
  useEffect(() => {
    const onDown = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);
  const pick = (s: OwnStructure) => { onPick(s); setOpen(false); };
  const list = open && picked == null && debounced.trim().length >= 2 ? hits ?? [] : [];
  return (
    <div ref={box} className="relative">
      <Field
        label="Structure"
        required
        hint={picked != null ? "Filled in from what the site knows about it; change anything." : "Its name as shown in game. Type a name or system to pick a structure the site knows."}
      >
        <Input
          value={value}
          maxLength={200}
          onChange={(e) => { onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => { if (e.key === "Enter" && list[0]) { e.preventDefault(); pick(list[0]); } if (e.key === "Escape") setOpen(false); }}
          placeholder="M-OEE8 Keepstar"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={list.length > 0}
          autoFocus
        />
      </Field>
      {list.length > 0 && (
        <ul role="listbox" className="absolute left-0 right-0 top-full z-20 mt-1 max-h-72 overflow-auto border border-border bg-surface shadow-e2">
          {list.map((s) => (
            <li key={s.structure_id} role="option" aria-selected={false}>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => pick(s)} className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-hover">
                {s.icon ? <img src={s.icon} alt="" className="size-7 shrink-0 border border-border bg-bg" loading="lazy" /> : <span className="size-7 shrink-0 border border-border bg-bg" />}
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">
                    {s.name}
                    {s.ours && <span className="ml-2 text-xs font-normal text-success-fg">Ours</span>}
                  </span>
                  <span className="block truncate text-xs text-subtle">
                    {s.structure_type}
                    {s.structure_type && s.system ? " · " : ""}
                    {s.system && <><span className={cn("font-mono tabular-nums", secTone(s.system.security))}>{s.system.security.toFixed(1)}</span> {s.system.name}{s.system.region ? ` · ${s.system.region}` : ""}</>}
                    {s.owner && !s.ours ? ` · ${s.owner}` : ""}
                  </span>
                </span>
                <span className={cn("shrink-0 text-xs", s.ends_at ? "text-danger-fg" : "text-subtle")}>
                  {s.ends_at ? `${STATE_LABEL[s.state] ?? s.state} · ${dateTime(s.ends_at)}` : STATE_LABEL[s.state] ?? s.state}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
