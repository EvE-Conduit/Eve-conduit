export type Status = "ok" | "short" | "low";

export interface ClaimInfo {
  user: string;
  user_id: number;
  quantity: number;
  portrait: string | null;
  expires_at: string;
}

export interface TargetRow {
  id: number;
  type_id: number;
  name: string;
  icon: string;
  fit: { id: number; name: string } | null;
  quantity: number;
  low: number;
  note: string;
  have: number;
  on_market: number;
  on_contract: number;
  cheapest_order: number | null;
  cheapest_contract: number | null;
  short: number;
  claimed: number;
  still_short: number;
  status: Status;
  claims: ClaimInfo[];
  my_claim: number | null;
  order: number;
}

export interface PlaceRow {
  id: number;
  name: string;
  label: string;
  location_id: number;
  system: string | null;
  order: number;
  targets: TargetRow[];
}

export interface Board {
  places: PlaceRow[];
  claim_days: number;
  can_manage: boolean;
}

export interface Manage {
  places: PlaceRow[];
  settings: { claim_days: number };
  doctrines: boolean;
}

export interface Summary {
  targets: number;
  short: number;
  low: number;
  worst: { id: number; name: string; icon: string; place: string; have: number; quantity: number; short: number; claimed: number; status: Status }[];
}

export interface Hit {
  id: number;
  name: string;
  subtitle: string;
  icon?: string;
  type_id?: number;
}

export const STATUS: Record<Status, { label: string; tone: "success" | "warning" | "danger" }> = {
  ok: { label: "Stocked", tone: "success" },
  short: { label: "Short", tone: "warning" },
  low: { label: "Low", tone: "danger" },
};

export const BASE = "/api/p/stock";
