// Creating and editing an event (secretsanta.organise_events).
import { api, Button, cn, Dialog, Field, Input, SwitchRow, Textarea, toast } from "@conduit/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { useNavigate } from "react-router";

import { type Audience, BASE, type EventDetail } from "./types";

/** ISO time -> the value a datetime-local input shows, in the browser's time zone. */
function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function Editor({ event: e, onClose }: { event: EventDetail | null; onClose: () => void }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: audience } = useQuery({ queryKey: ["secretsanta", "audience"], queryFn: () => api.get<Audience>(`${BASE}/audience`) });
  const [form, setForm] = useState({
    name: e?.name ?? "",
    description: e?.description ?? "",
    notes: e?.organiser?.notes ?? "",
    signup_closes_at: toLocalInput(e?.signup_closes_at),
    gift_deadline: toLocalInput(e?.gift_deadline),
    budget: e?.budget_isk != null ? String(e.budget_isk / 1_000_000) : "",
    states: e?.organiser?.states.map((s) => s.id) ?? [],
    groups: e?.organiser?.groups.map((g) => g.id) ?? [],
    announce: true,
  });
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));
  const toggle = (key: "states" | "groups", id: number) => set({ [key]: form[key].includes(id) ? form[key].filter((x) => x !== id) : [...form[key], id] });

  const save = useMutation({
    mutationFn: () => {
      const body = {
        name: form.name,
        description: form.description,
        notes: form.notes,
        signup_closes_at: new Date(form.signup_closes_at).toISOString(),
        gift_deadline: new Date(form.gift_deadline).toISOString(),
        budget_isk: form.budget.trim() ? Math.round(Number(form.budget) * 1_000_000) : null,
        states: form.states,
        groups: form.groups,
        announce: form.announce,
      };
      return e ? api.put<EventDetail>(`${BASE}/events/${e.id}`, body) : api.post<EventDetail>(`${BASE}/events`, body);
    },
    onSuccess: (saved) => {
      qc.invalidateQueries({ queryKey: ["secretsanta"] });
      toast.success(e ? "Event saved" : "Event created");
      onClose();
      if (!e) navigate(`/p/secretsanta/${saved.id}`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const budgetOk = !form.budget.trim() || (Number.isFinite(Number(form.budget)) && Number(form.budget) >= 0);
  const valid = form.name.trim() && form.signup_closes_at && form.gift_deadline && budgetOk;
  const everyone = form.states.length === 0 && form.groups.length === 0;

  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={e ? "Edit event" : "New Secret Santa"}
      size="lg"
      footer={
        <>
          <span className="mr-auto self-center text-xs text-muted">{everyone ? "Every member" : "Only the chosen states and groups"} can join.</span>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!valid} loading={save.isPending} onClick={() => save.mutate()}>{e ? "Save" : "Create"}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Name" required>
          <Input value={form.name} maxLength={100} onChange={(ev) => set({ name: ev.target.value })} placeholder="Winter gifts" autoFocus />
        </Field>
        <Field label="Description" hint="Everyone who can join sees it.">
          <Textarea rows={3} value={form.description} onChange={(ev) => set({ description: ev.target.value })} placeholder="One gift each, sent by contract or ISK." />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Sign-up closes" required hint="The draw can be done after this.">
            <Input type="datetime-local" value={form.signup_closes_at} onChange={(ev) => set({ signup_closes_at: ev.target.value })} />
          </Field>
          <Field label="Gift deadline" required hint="A reminder goes out two days before.">
            <Input type="datetime-local" value={form.gift_deadline} onChange={(ev) => set({ gift_deadline: ev.target.value })} />
          </Field>
        </div>
        <Field label="Suggested budget (million ISK)" hint="Optional." error={budgetOk ? undefined : "A number of million ISK"}>
          <Input inputMode="decimal" value={form.budget} onChange={(ev) => set({ budget: ev.target.value })} placeholder="100" />
        </Field>
        <div>
          <div className="mb-1.5 text-[13px] font-medium">Who may join</div>
          <p className="mb-2 text-xs text-muted">Nothing picked means every member.</p>
          <div className="flex flex-wrap gap-1.5">
            {(audience?.states ?? []).map((s) => (
              <Chip key={`s${s.id}`} on={form.states.includes(s.id)} onClick={() => toggle("states", s.id)} color={s.color}>{s.name}</Chip>
            ))}
          </div>
          {(audience?.groups.length ?? 0) > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {audience!.groups.map((g) => (
                <Chip key={`g${g.id}`} on={form.groups.includes(g.id)} onClick={() => toggle("groups", g.id)}>{g.name}</Chip>
              ))}
            </div>
          )}
        </div>
        <Field label="Notes for organisers" hint="Optional. Only organisers see them.">
          <Textarea rows={2} value={form.notes} onChange={(ev) => set({ notes: ev.target.value })} />
        </Field>
        {!e && (
          <div className="border border-border px-3">
            <SwitchRow label="Tell people" description="A notification to everyone who may join." checked={form.announce} onCheckedChange={(announce) => set({ announce })} />
          </div>
        )}
      </div>
    </Dialog>
  );
}

function Chip({ on, onClick, color, children }: { on: boolean; onClick: () => void; color?: string; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 border px-2 py-1 text-xs transition-colors",
        on ? "border-accent/60 bg-accent-soft text-text" : "border-border text-muted hover:border-border-strong hover:text-text",
      )}
    >
      {color && <span className="size-1.5 rotate-45" style={{ background: color }} />}
      {children}
    </button>
  );
}
