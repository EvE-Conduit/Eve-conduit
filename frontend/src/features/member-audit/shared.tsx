import { Link } from "react-router";

import { Avatar } from "@/components/ui/avatar";
import { Select } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tooltip } from "@/components/ui/tooltip";

export const BASE = "/api/member-audit";

export interface Corporation {
  id: number;
  name: string;
  ticker: string;
  characters: number;
}

/** A member character in reach, as the Member Audit API returns it. */
export interface Member {
  id: number;
  name: string;
  owner: string;
  corporation?: string;
}

/** Any EVE character, corporation or alliance. */
export interface Entity {
  id: number;
  name: string;
  type: string;
  image: string;
}

export const portrait = (id: number) => `https://images.evetech.net/characters/${id}/portrait?size=64`;

export function MemberCell({ member }: { member: Member }) {
  return (
    <Link to={`/characters/${member.id}`} onClick={(e) => e.stopPropagation()} className="flex min-w-0 items-center gap-2.5 hover:text-text" title={member.owner ? `Owned by ${member.owner}` : undefined}>
      <Avatar src={portrait(member.id)} name={member.name} size="xs" rounded="full" />
      <span className="truncate">{member.name}</span>
      {member.corporation && <span className="shrink-0 text-xs text-subtle">[{member.corporation}]</span>}
    </Link>
  );
}

export function EntityCell({ entity }: { entity: Entity | null }) {
  if (!entity) return <span className="text-subtle">—</span>;
  return (
    <span className="flex min-w-0 items-center gap-2">
      <img src={entity.image} alt="" className="size-5 shrink-0 rounded" />
      <span className="truncate">{entity.name}</span>
    </span>
  );
}

export function HeldBy({ holders }: { holders: Member[] }) {
  const shown = holders.slice(0, 3);
  return (
    <Tooltip content={holders.map((h) => h.name).join(", ")}>
      <div className="flex items-center gap-2">
        <div className="flex -space-x-1.5">
          {shown.map((h) => (
            <Avatar key={h.id} src={portrait(h.id)} name={h.name} size="xs" rounded="full" className="ring-2 ring-surface" />
          ))}
        </div>
        <span className="truncate text-xs text-muted">{holders.length === 1 ? holders[0]!.name : `${holders.length} characters`}</span>
      </div>
    </Tooltip>
  );
}

export function CorporationFilter({ corporations, value, onChange }: { corporations: Corporation[]; value: string; onChange: (v: string) => void }) {
  if (corporations.length < 2) return null;
  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)} aria-label="Corporation" className="w-56">
      <option value="">Every corporation</option>
      {corporations.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name} [{c.ticker}]
        </option>
      ))}
    </Select>
  );
}

/** Thresholds for "at least this much ISK" filters. */
export const ISK_FLOORS = [
  { value: "", label: "Any amount" },
  { value: "100000000", label: "100M+ ISK" },
  { value: "1000000000", label: "1B+ ISK" },
  { value: "10000000000", label: "10B+ ISK" },
];

/** Ticks the "outside" filter: only dealings with players or corporations not registered here. */
export function OutsideToggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-[13px] text-muted" title="Only players and corporations that aren't registered here">
      <Switch checked={checked} onCheckedChange={onChange} />
      With outsiders only
    </label>
  );
}
