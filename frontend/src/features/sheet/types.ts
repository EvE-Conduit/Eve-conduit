import type { CharacterBrief } from "@/lib/types";

export interface SectionStatus {
  key: string;
  label: string;
  available: boolean;
  missing_scopes: string[];
  result: "pending" | "ok" | "error" | "missing_scopes" | "token_invalid";
  message: string;
  last_success: string | null;
}

export interface CharacterHeader extends CharacterBrief {
  owner: { id: number; name: string };
  is_mine: boolean;
  is_main: boolean;
  token_valid: boolean;
  /** Has sheet.refresh_characters, so may ask ESI for fresh data now. */
  can_refresh: boolean;
  sections: SectionStatus[];
}

export interface EveType {
  id: number;
  name: string;
  group: string;
  category: string;
  icon: string;
}

export interface Place {
  id: number;
  name: string;
  kind: string;
  system: { id: number; name: string; security: number; region: string } | null;
}
