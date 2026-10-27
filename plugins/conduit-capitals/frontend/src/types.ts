export type ClassKey = "carrier" | "dreadnought" | "lancer" | "fax" | "supercarrier" | "titan" | "industrial" | "jump_freighter";
export type DataState = "ok" | "stale" | "missing_scopes" | "token_invalid" | "error" | "never";
export type Where = "space" | "hangar" | "ship_bay" | "asset_safety" | "deliveries" | "container" | "other";

export interface ClassInfo {
  key: ClassKey;
  label: string;
}

export interface Hull {
  id: number;
  name: string;
  class: ClassKey;
  icon: string;
}

export interface Place {
  id: number;
  name: string;
  kind: "station" | "structure" | "solar_system" | "unknown";
  system: { id: number; name: string; security: number; region: string | null } | null;
}

export interface Availability {
  available: boolean;
  note: string;
  updated_at: string;
}

export interface Owned {
  item_id: number;
  type_id: number;
  class: ClassKey;
  name: string;
  packaged: boolean;
  quantity: number;
  place: Place | null;
  where: Where;
  where_label: string;
  availability: Availability | null;
}

export type DataStatus = Record<"skills" | "assets" | "clones", { status: DataState; at: string | null }>;

export interface CharacterBrief {
  id: number;
  name: string;
  portrait: string;
  corporation: { id: number; name: string; ticker: string } | null;
  owner: string;
  owner_id: number;
  data: DataStatus;
  problem: boolean;
}

export interface Jump {
  skills: { jdo: number; jdc: number; jfc: number; infomorph: number } | null;
  home: Place | null;
  clones: { id: number; name: string; place: Place | null; implants: number }[];
  clone_jump_ready_at: string | null;
  fatigue_until: string | null;
  location: Place | null;
  flying: number | null;
}

export interface CharacterCaps extends CharacterBrief {
  fly: Record<ClassKey, number[]>;
  owned: Owned[];
  availability: Record<string, Availability | null>;
  jump: Jump;
}

export interface Characters {
  characters: CharacterCaps[];
  hulls: Record<string, Hull>;
  classes: ClassInfo[];
}

export interface Me extends Characters {
  can_view_registry: boolean;
}

export interface MemberDetail extends Characters {
  member: { id: number; name: string; portrait: string | null };
}

export interface HullRow {
  id: number;
  name: string;
  icon: string;
  pilots: number;
  owned: number;
  available: number;
  unavailable: number;
}

export interface ClassRow extends ClassInfo {
  pilots: number;
  members: number;
  owners: number;
  owner_members: number;
  owned: number;
  available: number;
  unavailable: number;
  hulls: HullRow[];
}

export interface Summary {
  classes: ClassRow[];
  characters: number;
  members: number;
  problems: Record<"skills" | "assets" | "clones", number>;
  hulls_known: number;
}

export interface Options {
  characters: number;
  corporations: { id: number; name: string; ticker: string }[];
  states: { id: number; name: string }[];
  groups: { id: number; name: string }[];
  classes: ClassInfo[];
}

export interface ClassPilots {
  class: ClassInfo;
  pilots: (CharacterBrief & { fly: number[]; owned: Owned[] })[];
  unknown: CharacterBrief[];
  unknown_count: number;
  hulls: Record<string, Hull>;
}

export interface Locations {
  locations: { place: Place | null; count: number; ships: (Owned & { character: CharacterBrief })[] }[];
  hulls: Record<string, Hull>;
}

export interface MemberRow {
  id: number;
  name: string;
  portrait: string | null;
  characters: number;
  problems: number;
  flyable: number;
  owned: number;
  classes: Record<ClassKey, { fly: number; own: number }>;
}

export interface Filters {
  corporation: string;
  state: string;
  group: string;
}

export const BASE = "/api/p/capitals";
