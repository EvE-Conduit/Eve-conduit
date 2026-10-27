export type Level = "ok" | "warning" | "danger" | "empty" | "none";

export interface EveType {
  id: number;
  name: string;
  group: string;
  category: string;
  icon: string;
}

export interface ClaimInfo {
  user: string;
  user_id: number;
  note: string;
  portrait: string | null;
  created_at: string;
  expires_at: string;
}

export interface Module {
  module: string;
  name: string;
  online: boolean;
  rate: number;
}

export interface Corp {
  id: number;
  name: string;
  ticker: string;
}

export interface SystemRef {
  id: number;
  name: string;
  security: number | null;
  region: string;
}

export interface StructureRow {
  id: number;
  name: string;
  type: EveType;
  corporation: Corp;
  system: SystemRef;
  state: string;
  fuel_expires: string | null;
  hours_left: number | null;
  services: { name: string; state: string; module: string | null }[];
  modules: Module[];
  unknown_services: string[];
  burn: number;
  burn_all: number;
  blocks_left: number;
  need: number;
  level: Level;
  thresholds: number[];
  threshold_override: boolean;
  staging: string;
  reinforce_hour: number | null;
  state_timer_end: string | null;
  unanchors_at: string | null;
  claims: ClaimInfo[];
  my_claim: ClaimInfo | null;
  online_modules: number;
}

export interface Board {
  structures: StructureRow[];
  corporations: Corp[];
  thresholds: number[];
  plan_days: number;
  claim_hours: number;
  can_manage: boolean;
  can_view: boolean;
}

export interface PlanGroup {
  key: string;
  label: string;
  kind: "staging" | "system";
  systems: string[];
  region: string;
  blocks: number;
  burn: number;
  per_day: number;
  volume: number;
  structures: Pick<StructureRow, "id" | "name" | "type" | "corporation" | "system" | "hours_left" | "fuel_expires" | "burn" | "burn_all" | "need" | "level" | "claims">[];
}

export interface Plan {
  days: number;
  groups: PlanGroup[];
  blocks: number;
  volume: number;
  per_day: number;
  block_price: number | null;
  cost: number | null;
}

export interface Summary {
  structures: number;
  low: number;
  danger: number;
  can_view: boolean;
  worst: { id: number; name: string; icon: string; ticker: string; system: string; hours_left: number | null; fuel_expires: string | null; level: Level; claimed: boolean }[];
}

export interface Settings {
  thresholds: number[];
  groups: number[];
  notify: boolean;
  plan_days: number;
  claim_hours: number;
  core_warning_hours: number;
  group_options: { id: number; name: string }[];
}

export const LEVEL: Record<Level, { label: string; tone: "success" | "warning" | "danger" | "neutral" }> = {
  ok: { label: "Fuelled", tone: "success" },
  warning: { label: "Low", tone: "warning" },
  danger: { label: "Critical", tone: "danger" },
  empty: { label: "Out of fuel", tone: "danger" },
  none: { label: "No fuel use", tone: "neutral" },
};

export const STATE_TONE: Record<string, "success" | "warning" | "danger" | "info" | "neutral"> = {
  shield_vulnerable: "success",
  armor_vulnerable: "warning",
  hull_vulnerable: "danger",
  armor_reinforce: "danger",
  hull_reinforce: "danger",
  anchoring: "info",
  onlining_vulnerable: "info",
  unanchored: "neutral",
  low_power: "warning",
  abandoned: "danger",
};

/** 168 -> "7d", 12 -> "12h", 36 -> "36h". */
export function hoursLabel(h: number) {
  return h % 24 === 0 ? `${h / 24}d` : `${h}h`;
}

/** "7d, 3d, 12h" (a bare number is days) -> hours, or null when something can't be read. */
export function parseThresholds(text: string): number[] | null {
  const parts = text.split(/[\s,]+/).filter(Boolean);
  const out: number[] = [];
  for (const p of parts) {
    const m = /^(\d+(?:\.\d+)?)\s*([dh]?)$/i.exec(p);
    if (!m) return null;
    const n = Number(m[1]) * (m[2].toLowerCase() === "h" ? 1 : 24);
    if (!(n >= 1)) return null;
    out.push(Math.round(n));
  }
  return [...new Set(out)].sort((a, b) => b - a);
}

export const BASE = "/api/p/structures";
