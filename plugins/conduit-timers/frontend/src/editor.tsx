// Adding and editing a timer (timers.manage_timers). The time is entered as the game shows it ("1d 4h 23m") or exactly.
import { api, Button, cn, dateTime, Dialog, Field, Input, Segmented, Select, SwitchRow, Textarea, toast } from "@conduit/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import { fromLocalInput, parseTimeLeft, toLocalInput } from "./time";
import { BASE, type Kind, KINDS, secTone, type Side, type StructureType, type System, type Timer } from "./types";

export function Editor({ timer: t, onClose }: { timer: Timer | null; onClose: () => void }) {
  const qc = useQueryClient();
  const { data: types } = useQuery({ queryKey: ["timers", "types"], queryFn: () => api.get<StructureType[]>(`${BASE}/types`), staleTime: 3_600_000 });
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
  });
  const [mode, setMode] = useState<"left" | "exact">(t ? "exact" : "left");
  const [left, setLeft] = useState("");
  const [exact, setExact] = useState(toLocalInput(t?.ends_at));
  // "Time left" counts from when it was typed, so the saved time doesn't drift while the form is open.
  const [typedAt, setTypedAt] = useState(Date.now());
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

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
          <Field label="Structure" required hint="Its name as shown in game.">
            <Input value={form.name} maxLength={200} onChange={(e) => set({ name: e.target.value })} placeholder="M-OEE8 Keepstar" autoFocus />
          </Field>
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
            onCheckedChange={(important) => set({ important })}
          />
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
