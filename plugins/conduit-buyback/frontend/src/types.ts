export const BASE = "/api/p/buyback";
export const PUBLIC_BASE = "/api/public/p/buyback";

export interface SystemInfo {
  id: number;
  name: string;
  security: number;
  region: string;
}

export interface Place {
  id: number;
  name: string;
  structure_id: number | null;
  system: SystemInfo | null;
}

export interface Terms {
  assignee: { id: number | null; name: string; kind: "corporation" | "character" };
  locations: Place[];
  expiration_days: number;
}

export interface ItemRule {
  type_id: number;
  name: string;
  icon: string;
  tax: number;
  disallowed: boolean;
  static_price: number | null;
}

export interface Program {
  id: number;
  name: string;
  description: string;
  active: boolean;
  public: boolean;
  price_type: "buy" | "sell" | "split";
  tax: number;
  hauling_fuel_cost: number;
  price_density_threshold: number;
  price_density_tax: number;
  compressed_volume: boolean;
  allow_all_items: boolean;
  use_raw: boolean;
  use_compressed: boolean;
  use_refined: boolean;
  refining_rate: number;
  allow_unpacked: boolean;
  blue_loot_npc: boolean;
  red_loot_npc: boolean;
  t1_refined: boolean;
  t1_refining_rate: number;
  terms: Terms;
  item_rules: ItemRule[];
  can_manage: boolean;
}

export interface PriceInfo {
  source: string;
  hub: string;
  instant: boolean;
  guard: boolean;
  guard_days: number;
}

export interface ProgramList {
  programs: Program[];
  prices: PriceInfo;
  can_create: boolean;
  manages: boolean;
  can_see_leaderboards: boolean;
}

export type Method = "market" | "raw" | "compressed" | "refined" | "t1_refined" | "npc" | "fixed";

export interface Line {
  type_id: number;
  name: string;
  group: string;
  icon: string;
  quantity: number;
  volume: number;
  accepted: boolean;
  reason: string;
  method: Method | null;
  market_unit: number;
  tax: number;
  density_tax: boolean;
  hauling_unit: number;
  unit_price: number;
  value: number;
  options: Partial<Record<Method, number>>;
  watch: boolean;
  guard: Guard | null;
}

/** What the manipulation guard made of a line's market price. */
export type Guard =
  | { used: "current" | "average" | "lower"; current: number; average: number | null; deviation: number | null; days_traded: number; reliable: boolean }
  | { used: "materials"; materials: number };

export interface QuoteSummary {
  tracking_number: string;
  program: { id: number; name: string };
  value: number;
  volume: number;
  flagged: boolean;
  created_at: string;
  items: number;
  terms: Terms;
  lines?: Line[];
}

export interface Appraisal {
  lines: Line[];
  unknown: string[];
  value: number;
  volume: number;
  flagged: boolean;
  accepted_count: number;
  rejected_count: number;
  blocked?: string;
  quote: QuoteSummary | null;
}

export interface Problem {
  code: string;
  text: string;
  severe: boolean;
}

export interface ContractItem {
  type_id: number;
  name: string;
  icon: string;
  quantity: number;
  included: boolean;
}

export interface ContractRow {
  contract_id: number;
  program: { id: number; name: string } | null;
  tracking_number: string | null;
  title: string;
  status: string;
  status_label: string;
  open: boolean;
  issuer: { id: number; name: string };
  issuer_corporation: string | null;
  price: number;
  quoted: number | null;
  volume: number | null;
  date_issued: string;
  date_expired: string | null;
  date_completed: string | null;
  problems: Problem[];
  severe: boolean;
  items?: ContractItem[] | null;
  location?: string | null;
  quote?: QuoteSummary;
}

export interface QuoteDetail extends QuoteSummary {
  lines: Line[];
  seller: string | null;
  public: boolean;
  contracts: ContractRow[];
  mine: boolean;
  can_manage: boolean;
}

export interface MyQuotes {
  quotes: (QuoteSummary & { contract: ContractRow | null; state: string })[];
  totals: { open: number; open_value: number; sold_value: number };
}

export interface Owner {
  id: number;
  name: string;
  corporation: string | null;
  login_ok: boolean;
}

export interface Wallet {
  division: number;
  balance: number | null;
  updated_at: string | null;
}

export interface ManagedProgram {
  id: number;
  name: string;
  active: boolean;
  public: boolean;
  can_manage: boolean;
  open: number;
  open_value: number;
  problems: number;
  month_value: number;
  month_count: number;
  total_value: number;
  wallet: Wallet | null;
  owner: Owner | null;
}

export interface Stats {
  program: { id: number; name: string; can_manage: boolean };
  open: number;
  open_value: number;
  problems: number;
  month_count: number;
  month_value: number;
  total_value: number;
  total_count: number;
  months: { month: string; value: number; count: number }[];
  wallet: Wallet | null;
  owner: Owner | null;
  top_items: { type_id: number; name: string; icon: string; quantity: number; value: number }[];
  leaderboard: Seller[];
}

export interface Seller {
  id: number;
  name: string;
  value: number;
  count: number;
}

export interface WatchRule {
  id: number;
  kind: "type" | "group";
  target_id: number;
  name: string;
  icon: string | null;
}

export interface ProgramForm {
  name: string;
  description: string;
  owner_id: number | null;
  is_corporation: boolean;
  location_ids: number[];
  manager_ids: number[];
  expiration_days: number;
  price_type: "buy" | "sell" | "split";
  tax: number;
  hauling_fuel_cost: number;
  price_density_threshold: number;
  price_density_tax: number;
  compressed_volume: boolean;
  allow_all_items: boolean;
  use_raw: boolean;
  use_compressed: boolean;
  use_refined: boolean;
  refining_rate: number;
  allow_unpacked: boolean;
  blue_loot_npc: boolean;
  red_loot_npc: boolean;
  t1_refined: boolean;
  t1_refining_rate: number;
  state_ids: number[];
  group_ids: number[];
  public: boolean;
  notify_managers: boolean;
  wallet_division: number | null;
  tracking_prefix: string;
  active: boolean;
}

export interface ManagedDetail extends Program, Omit<ProgramForm, "price_type"> {
  managers: { id: number; name: string }[];
  owner: Owner | null;
  watch_rules: WatchRule[];
}

export interface Options {
  characters: { id: number; name: string; corporation: string | null; login_ok: boolean }[];
  locations: Place[];
  states: { id: number; name: string; color: string }[];
  groups: { id: number; name: string }[];
  managers: { id: number; name: string }[];
  default_prefix: string;
}

export interface Hit {
  id: number;
  name: string;
  subtitle: string;
  icon?: string;
  solar_system_id?: number | null;
  solar_system_name?: string | null;
}

export interface Settings {
  price_source: "fuzzwork" | "janice" | "esi";
  hub_id: number;
  hub_name: string;
  instant_prices: boolean;
  janice_key_set: boolean;
  price_max_age_hours: number;
  tracking_prefix: string;
  unlinked_purge_hours: number;
  reject_disallowed: boolean;
  restrict_quotes: boolean;
  prices_stored: number;
  hubs: { id: number; name: string; full_name: string; region: string }[];
  esi_character: { id: number; name: string } | null;
  esi_character_id?: number | null;
  characters: { id: number; name: string; can_read: boolean }[];
  hub_kind: "region" | "system" | "station" | "structure";
  history_region: string | null;
  market_pulled_at: string | null;
  market_note: string;
  guard_enabled: boolean;
  guard_threshold: number;
  guard_days: number;
  guard_min_days: number;
  guard_both_ways: boolean;
}

export const METHOD_LABEL: Record<Method, string> = {
  market: "Market",
  raw: "Raw ore",
  compressed: "Compressed",
  refined: "Refined",
  t1_refined: "Reprocessed",
  npc: "NPC buy",
  fixed: "Fixed price",
};
