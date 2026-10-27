// Discord pings for a plugin's alerts, for its settings page: <DiscordPings plugin="stock" />. Shows nothing until a
// Discord webhook exists (Administration → Integrations) or when the user may not set any of the plugin's alerts.
// Each change is saved straight away, so it works inside a settings dialog with its own Save button too.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export interface DiscordRole {
  id: string;
  name: string;
  color: number;
}

interface PingSetting {
  event: string;
  label: string;
  description: string;
  ping: boolean;
  roles: string[];
  webhooks: number;
  webhook_mentions: number;
}

interface PingSettings {
  configured: boolean;
  events: PingSetting[];
  discord: { available: boolean; roles: DiscordRole[]; error?: string };
}

function swatch(color: number) {
  return color ? `#${color.toString(16).padStart(6, "0")}` : undefined;
}

/** Toggle chips, one per role; unknown ids (roles deleted on Discord) are shown by id so they can be taken off. */
export function RoleChips({ roles, value, onChange, disabled }: { roles: DiscordRole[]; value: string[]; onChange: (ids: string[]) => void; disabled?: boolean }) {
  const known = new Set(roles.map((r) => r.id));
  const all: DiscordRole[] = [...roles, ...value.filter((id) => !known.has(id)).map((id) => ({ id, name: `Role ${id}`, color: 0 }))];
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  if (all.length === 0) return <p className="text-xs text-muted">The Discord server has no roles to pick.</p>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {all.map((r) => {
        const on = value.includes(r.id);
        return (
          <button
            key={r.id}
            type="button"
            aria-pressed={on}
            disabled={disabled}
            onClick={() => toggle(r.id)}
            className={cn(
              "flex items-center gap-1.5 border px-2 py-1 text-xs transition-colors disabled:opacity-50",
              on ? "border-accent/60 bg-accent-soft text-text" : "border-border text-muted hover:border-border-strong hover:text-text",
            )}
          >
            <span className="size-2 rounded-full border border-border-strong" style={{ background: swatch(r.color) }} />@{r.name}
          </button>
        );
      })}
    </div>
  );
}

export function DiscordPings({ plugin, className }: { plugin: string; className?: string }) {
  const qc = useQueryClient();
  const key = ["pings", plugin];
  const { data } = useQuery({ queryKey: key, queryFn: () => api.get<PingSettings>(`/api/pings?plugin=${encodeURIComponent(plugin)}`), staleTime: 60_000 });
  const save = useMutation({
    mutationFn: (s: PingSetting) => api.put<PingSetting>(`/api/pings/${encodeURIComponent(s.event)}`, { ping: s.ping, roles: s.roles }),
    onMutate: (s) => qc.setQueryData<PingSettings>(key, (old) => old && { ...old, events: old.events.map((e) => (e.event === s.event ? s : e)) }),
    onSuccess: (s) => qc.setQueryData<PingSettings>(key, (old) => old && { ...old, events: old.events.map((e) => (e.event === s.event ? s : e)) }),
    onError: (e: Error) => {
      toast.error(e.message);
      qc.invalidateQueries({ queryKey: key });
    },
  });
  if (!data?.configured || data.events.length === 0) return null;
  const { discord } = data;

  return (
    <div className={cn("space-y-2", className)}>
      <div>
        <div className="text-[13px] font-medium">Discord pings</div>
        <p className="mt-0.5 text-xs text-muted">
          Alerts that ping on Discord. Each Discord webhook that gets the alert mentions its own @here, @everyone or role
          (Administration → Integrations){discord.available ? ", plus the roles picked here" : ""}.
        </p>
      </div>
      <div className="divide-y divide-border border border-border">
        {data.events.map((e) => (
          <div key={e.event} className="space-y-2 px-3 py-2.5">
            <label className="flex cursor-pointer items-start justify-between gap-6">
              <span className="min-w-0">
                <span className="block text-sm font-medium text-text">{e.label}</span>
                {e.description && <span className="mt-0.5 block text-xs text-muted">{e.description}</span>}
              </span>
              <Switch checked={e.ping} onCheckedChange={(ping) => save.mutate({ ...e, ping })} className="mt-0.5" />
            </label>
            {e.ping && e.webhooks === 0 && (
              <p className="text-xs text-warning-fg">No Discord webhook gets this alert yet: pick it for one under Administration → Integrations.</p>
            )}
            {e.ping && e.webhooks > 0 && e.webhook_mentions === 0 && e.roles.length === 0 && (
              <p className="text-xs text-warning-fg">
                {discord.available ? "Pick roles to ping, or give" : "Give"} a webhook that gets it someone to mention under Administration → Integrations; until then nobody is pinged.
              </p>
            )}
            {e.ping && discord.available && (
              discord.error ? <p className="text-xs text-muted">{discord.error}</p> : <RoleChips roles={discord.roles} value={e.roles} onChange={(roles) => save.mutate({ ...e, roles })} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
