export const BASE = "/api/p/fleets";

export interface FleetType {
  id: number;
  name: string;
  color: string;
}

export interface Person {
  id: number;
  name: string;
  portrait: string | null;
}

export interface FleetBrief {
  id: number;
  name: string;
  type: FleetType | null;
  fc: Person | null;
  started_at: string;
  ended_at: string | null;
  tracking: boolean;
  /** The current FAT round. */
  round: number;
}

export interface FleetRow extends FleetBrief {
  pilots: number;
  attended: boolean;
}

export interface FatRow {
  id: number;
  round: number;
  character: { id: number; name: string; portrait: string };
  member: { id: number; name: string } | null;
  ship: { id: number; name: string | null; icon: string } | null;
  system: string | null;
  via: "esi" | "link" | "manual";
  at: string;
}

export interface FleetDetail extends FleetBrief {
  notes: string;
  fats: FatRow[];
  fat_count: number;
  pilots: number;
  rounds: { round: number; pilots: number }[];
  round_started_at: string | null;
  members: number;
  ships: { name: string; count: number }[];
  attended: boolean;
  can_edit: boolean;
  link: { code: string; active: boolean; tracked_only: boolean; expires_at: string | null } | null;
  tracking_info: {
    character: { id: number; name: string } | null;
    last_at: string | null;
    error: string;
    motd: boolean;
    motd_error: string;
  } | null;
  warning?: string;
  added?: number;
}

export interface Attendance {
  counts: { days_30: number; days_90: number; all: number };
  by_type_30: { type: string; count: number }[];
  fleets: (FleetBrief & { characters: string[]; fats: number })[];
}

export interface Overview {
  fleets: FleetRow[];
  me: Attendance;
  types: FleetType[];
  can_run: boolean;
  can_manage: boolean;
}

export interface FcCharacter {
  id: number;
  name: string;
  portrait: string;
  can_track: boolean;
  can_motd: boolean;
}

export const VIA: Record<FatRow["via"], { label: string; tone: "accent" | "info" | "neutral" }> = {
  esi: { label: "In-game fleet", tone: "accent" },
  link: { label: "FAT link", tone: "info" },
  manual: { label: "Added by FC", tone: "neutral" },
};
