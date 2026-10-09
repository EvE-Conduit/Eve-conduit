import type { MissingScope } from "@/lib/types";

const MAX_GROUPS = 8;

/** Missing ESI scopes grouped by what needs them ("Fleets & FATs", "Character sheet: Mail"), for tooltips. */
export function MissingScopes({ missing, title }: { missing: MissingScope[]; title?: string }) {
  const groups = new Map<string, string[]>();
  for (const m of missing) {
    for (const who of m.needed_by.length ? m.needed_by : ["Required by the site"]) groups.set(who, [...(groups.get(who) ?? []), m.scope]);
  }
  // Plugins first, then character sheet sections.
  const ordered = [...groups].sort(([a], [b]) => Number(a.startsWith("Character sheet")) - Number(b.startsWith("Character sheet")) || a.localeCompare(b));
  const shown = ordered.slice(0, MAX_GROUPS);
  return (
    <div className="space-y-1.5 py-0.5">
      {title && <div className="font-semibold">{title}</div>}
      {shown.map(([who, scopes]) => (
        <div key={who}>
          <div className="text-muted">{who} needs</div>
          {scopes.map((s) => (
            <div key={s} className="break-all font-mono text-[11px]">
              {s}
            </div>
          ))}
        </div>
      ))}
      {ordered.length > shown.length && <div className="text-subtle">…and {ordered.length - shown.length} more</div>}
    </div>
  );
}
