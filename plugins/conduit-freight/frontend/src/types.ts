export const BASE = "/api/p/freight";
export const PUBLIC_BASE = "/api/public/p/freight";

export interface SystemInfo {
  id: number;
  name: string;
  security: number;
  region: string;
}

export interface RouteEnd {
  name: string;
  location_id: number | null;
  system: SystemInfo | null;
}

export interface Route {
  id: number;
  start: RouteEnd;
  end: RouteEnd;
  both_ways: boolean;
  jumps: number | null;
  base_price: number;
  price_per_m3: number;
  price_per_jump: number;
  collateral_percent: number;
  min_reward: number;
  max_volume: number;
  max_collateral: number;
  active: boolean;
}

export interface Terms {
  assignee: { id: number | null; name: string; kind: "corporation" | "character" };
  days_to_complete: number;
  expiration_days: number;
}

export interface Service {
  id: number;
  name: string;
  description: string;
  active: boolean;
  public: boolean;
  terms: Terms;
  routes: Route[];
  can_manage: boolean;
}

export interface Quote {
  route: Route;
  volume: number;
  collateral: number;
  reward: number;
  breakdown: { base: number; volume: number; jumps: number; collateral: number; minimum: number };
  problems: string[];
  terms: Terms;
}

export interface Problem {
  code: string;
  text: string;
  severe: boolean;
}

export interface Contract {
  contract_id: number;
  service: { id: number; name: string } | null;
  route: string | null;
  title: string;
  status: string;
  status_label: string;
  open: boolean;
  issuer: { id: number; name: string };
  issuer_corporation: string | null;
  acceptor: { id: number; name: string } | null;
  start: string | null;
  end: string | null;
  reward: number;
  expected_reward: number | null;
  collateral: number;
  volume: number;
  days_to_complete: number | null;
  date_issued: string;
  date_expired: string | null;
  date_accepted: string | null;
  date_completed: string | null;
  problems: Problem[];
  severe: boolean;
}

export interface Owner {
  id: number;
  name: string;
  corporation: string | null;
  login_ok: boolean;
}

export interface ManagedService extends Service {
  owner_id: number | null;
  owner: Owner | null;
  is_corporation: boolean;
  days_to_complete: number;
  expiration_days: number;
  state_ids: number[];
  group_ids: number[];
  notify: boolean;
}
