// Ops calendar settings (ops.manage_ops): reminders, default Discord roles, and how long past ops stay listed.
import { api, Button, cn, Dialog, Field, Input, Skeleton, toast } from "@conduit/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { RoleChips, useDiscordRoles } from "./roles";
import { BASE, type Settings } from "./types";

const PRESETS: { minutes: number; label: string }[] = [
  { minutes: 1440, label: "1 day" },
  { minutes: 720, label: "12 h" },
  { minutes: 360, label: "6 h" },
  { minutes: 120, label: "2 h" },
  { minutes: 60, label: "1 h" },
  { minutes: 30, label: "30 min" },
  { minutes: 15, label: "15 min" },
  { minutes: 5, label: "5 min" },
];

export function SettingsDialog({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["ops", "settings"], queryFn: () => api.get<Settings>(`${BASE}/settings`) });
  const discord = useDiscordRoles();
  const [form, setForm] = useState<Settings | null>(null);
  const value = form ?? data ?? null;
  const set = (patch: Partial<Settings>) => value && setForm({ ...value, ...patch });
  const save = useMutation({
    mutationFn: (s: Settings) => api.put<Settings>(`${BASE}/settings`, s),
    onSuccess: (s) => {
      qc.setQueryData(["ops", "settings"], s);
      qc.invalidateQueries({ queryKey: ["ops"] });
      toast.success("Saved");
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const toggle = (m: number) => value && set({ reminder_minutes: value.reminder_minutes.includes(m) ? value.reminder_minutes.filter((x) => x !== m) : [...value.reminder_minutes, m] });

  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title="Ops calendar settings"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!value} loading={save.isPending} onClick={() => value && save.mutate(value)}>Save</Button>
        </>
      }
    >
      {!value ? (
        <Skeleton className="h-64" />
      ) : (
        <div className="space-y-5">
          <div>
            <div className="mb-1.5 text-[13px] font-medium">Reminders</div>
            <p className="mb-2 text-xs text-muted">How long before form-up people who said going or maybe get a reminder. Ops marked "everyone is expected" remind their whole audience.</p>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((p) => {
                const on = value.reminder_minutes.includes(p.minutes);
                return (
                  <button
                    key={p.minutes}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(p.minutes)}
                    className={cn(
                      "border px-2 py-1 text-xs transition-colors",
                      on ? "border-accent/60 bg-accent-soft text-text" : "border-border text-muted hover:border-border-strong hover:text-text",
                    )}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
            {value.reminder_minutes.length === 0 && <p className="mt-1.5 text-xs text-warning-fg">No reminders will be sent.</p>}
          </div>

          <div>
            <div className="mb-1.5 text-[13px] font-medium">Discord roles to ping</div>
            <p className="mb-2 text-xs text-muted">
              Picked for new ops with <em>Ping Discord</em> on (each op can change them). Pings go through Discord webhooks that ping, under Administration → Integrations.
            </p>
            {discord.data?.available ? (
              discord.data.error ? <p className="text-xs text-warning-fg">{discord.data.error}</p> : <RoleChips roles={discord.data.roles} value={value.default_ping_roles} onChange={(default_ping_roles) => set({ default_ping_roles })} />
            ) : (
              <p className="text-xs text-muted">Link the Discord plugin to your server to pick roles; until then a ping mentions what the webhook is set to.</p>
            )}
          </div>

          <Field label="Keep finished ops for" hint="Days. Afterwards they drop off the Recent list (the calendar still shows them).">
            <Input type="number" min={1} max={90} value={value.keep_days} onChange={(e) => set({ keep_days: Math.max(1, Math.min(90, Number(e.target.value) || 1)) })} className="w-28" />
          </Field>
        </div>
      )}
    </Dialog>
  );
}
