// Picking which Discord roles a timer pings. The roles come from the Discord plugin (when it's linked to a server).
import { api, cn } from "@conduit/sdk";
import { useQuery } from "@tanstack/react-query";

import { BASE, type DiscordRole, type DiscordRoles } from "./types";

export function useDiscordRoles(enabled = true) {
  return useQuery({ queryKey: ["timers", "discord-roles"], queryFn: () => api.get<DiscordRoles>(`${BASE}/discord-roles`), enabled, staleTime: 600_000 });
}

function swatch(color: number) {
  return color ? `#${color.toString(16).padStart(6, "0")}` : undefined;
}

/** Toggle chips, one per role; unknown ids (roles deleted on Discord) are shown by id so they can be taken off. */
export function RoleChips({ roles, value, onChange }: { roles: DiscordRole[]; value: string[]; onChange: (ids: string[]) => void }) {
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
            onClick={() => toggle(r.id)}
            className={cn(
              "flex items-center gap-1.5 border px-2 py-1 text-xs transition-colors",
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
