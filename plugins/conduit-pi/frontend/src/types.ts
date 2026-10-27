export type Status = "running" | "soon" | "expired" | "stopped";

export interface TypeInfo {
  id: number;
  name: string;
  group: string;
  category: string;
  icon: string;
  tier: number | null;
}

export interface Extractor {
  pin_id: number;
  product: TypeInfo | null;
  qty_per_cycle: number;
  cycle_time: number;
  heads: number;
  per_day: number;
  installed: string | null;
  expiry: string | null;
  status: Status;
}

export interface FactoryGroup {
  schematic: string;
  product: TypeInfo | null;
  tier: number | null;
  count: number;
  running: number;
}

export interface Storage {
  name: string;
  capacity: number;
  used: number;
  pct: number;
  contents: { type: TypeInfo; amount: number }[];
}

export interface Flow {
  type: TypeInfo;
  per_day: number;
  isk_per_day?: number;
}

export interface Colony {
  id: number;
  planet_id: number;
  name: string;
  type: string;
  image: string;
  system: { id: number; name: string; security: number };
  upgrade_level: number;
  pins: number;
  last_update: string;
  character: { id: number; name: string; portrait: string };
  extractors: Extractor[];
  factories: FactoryGroup[];
  storage: Storage[];
  output: Flow[];
  inputs: Flow[];
  isk_per_day: number;
  next_expiry: string | null;
  expired: number;
  active: number;
}

export interface Settings {
  soon: boolean;
  lead_hours: number;
  expired: boolean;
  digest: boolean;
}

export interface Me {
  colonies: Colony[];
  totals: { colonies: number; extractors: number; active: number; expired: number; soon: number; isk_per_day: number; output: Flow[]; inputs: Flow[] };
  characters: { id: number; name: string; portrait: string; colonies: number; has_scope: boolean }[];
  settings: Settings;
  can_view_corp: boolean;
}

export interface Upcoming {
  expired: number;
  running: number;
  colonies: number;
  next: { character: string; planet: string; planet_type: string; image: string; product: TypeInfo | null; expiry: string; status: Status }[];
}

export interface Corp {
  totals: { members: number; colonies: number; active: number; expired: number; idle: number; isk_per_day: number };
  products: { type: TypeInfo; per_day: number; isk_per_day: number; producers: { id: number; name: string; per_day: number }[] }[];
  members: {
    id: number; name: string; portrait: string | null; corporation: string | null; characters: number; colonies: number;
    active: number; expired: number; idle: number; isk_per_day: number; products: string[];
  }[];
  idle: {
    colony: number; planet: string; type: string; image: string; system: string; upgrade_level: number; character: string;
    character_id: number; member: string; since: string; days: number; products: string[];
  }[];
  idle_days: number;
  corporations: { id: number; name: string }[];
  corporation: number | null;
}

export const BASE = "/api/p/pi";
export const PREFS = "/api/me/preferences/plugins/pi";
