import type { Entity } from "@/lib/types";

import type { EveType, Place } from "../sheet/types";

export interface CorpHealth {
  ok: number;
  error: number;
  no_character: number;
  pending: number;
  last_success: string | null;
}

export interface CorpListItem extends Entity {
  alliance: Entity | null;
  member_count: number | null;
  registered_characters: number;
  registered_users: number;
  known_members: number | null;
  structures: number;
  low_fuel: number;
  is_mine: boolean;
  health: CorpHealth;
}

export interface CorpSectionStatus {
  key: string;
  label: string;
  description: string;
  requirement: string;
  roles: string[];
  scopes: string[];
  allowed: boolean;
  result: "pending" | "ok" | "error" | "no_character";
  message: string;
  last_success: string | null;
  synced_as: { id: number; name: string } | null;
}

export interface CorpHeader extends Entity {
  logo_large: string;
  alliance: Entity | null;
  member_count: number | null;
  registered_characters: number;
  can_view_wallets: boolean;
  /** Has corp.refresh_corporations, so may ask ESI for fresh data now. */
  can_refresh: boolean;
  sections: CorpSectionStatus[];
}

export interface CorpOverview {
  synced: boolean;
  ceo: { id: number; name: string; portrait: string } | null;
  creator: { id: number; name: string } | null;
  founded: string | null;
  description: string;
  url: string;
  tax_rate: number | null;
  shares: number | null;
  war_eligible: boolean | null;
  home_station: Place | null;
  hangar_divisions: { division: number; name?: string }[];
  wallet_divisions: { division: number; name?: string }[];
  member_count: number | null;
  known_members: number | null;
  registered: number;
  active_7d: number | null;
  active_30d: number | null;
  structures: number;
  low_fuel: number;
  wallet_total: number | null;
}

export interface CorpMember {
  id: number;
  name: string;
  portrait: string;
  registered: boolean;
  owner: { id: number; name: string; main_id: number | null } | null;
  tracked: boolean;
  online: boolean;
  start_date: string | null;
  logon_date: string | null;
  logoff_date: string | null;
  location: Place | null;
  ship: EveType | null;
  roles: string[];
  titles: string[];
}

export interface SystemRef {
  id: number;
  name: string;
  security: number | null;
  region: string;
}

export interface CorpStructure {
  id: number;
  name: string;
  type: EveType;
  system: SystemRef | null;
  state: string;
  fuel_expires: string | null;
  fuel_hours: number | null;
  state_timer_start: string | null;
  state_timer_end: string | null;
  unanchors_at: string | null;
  reinforce_hour: number | null;
  services: { name: string; state: string }[];
}

export interface CorpWallets {
  synced: boolean;
  balance: number;
  divisions: { division: number; name: string; balance: number; income: number; spending: number; series: { date: string; balance: number }[] }[];
  series: { date: string; balance: number }[];
  income: number;
  spending: number;
  top_income: { ref_type: string; amount: number }[];
  top_spending: { ref_type: string; amount: number }[];
}
