export const BASE = "/api/p/timers";

export type Kind = "armor" | "hull" | "anchoring" | "unanchoring" | "sov" | "moon" | "other";
export type Side = "friendly" | "hostile" | "neutral";
export type Status = "upcoming" | "now" | "past";

export interface System {
  id: number;
  name: string;
  region: string;
  security: number;
}

export interface Timer {
  id: number;
  name: string;
  structure_type: string;
  type_id: number | null;
  icon: string | null;
  system: System;
  kind: Kind;
  side: Side;
  owner: string;
  ends_at: string;
  notes: string;
  important: boolean;
  source: "manual" | "structure" | "notification";
  status: Status;
  going: boolean;
  going_count: number;
  going_names: string[];
  created_by: { id: number; name: string; portrait: string | null } | null;
  updated_at: string;
}

export interface Board {
  upcoming: Timer[];
  past: Timer[];
  /** Ids of the upcoming timers I'm going to. */
  going: number[];
  can_manage: boolean;
  reminder_minutes: number[];
}

export interface Settings {
  reminder_minutes: number[];
  import_structures: boolean;
  import_notifications: boolean;
  keep_days: number;
  notifications_seen_until: string | null;
}

export interface StructureType {
  name: string;
  type_id: number | null;
}

export const KINDS: { value: Kind; label: string }[] = [
  { value: "armor", label: "Armor" },
  { value: "hull", label: "Hull" },
  { value: "anchoring", label: "Anchoring" },
  { value: "unanchoring", label: "Unanchoring" },
  { value: "sov", label: "Sovereignty" },
  { value: "moon", label: "Moon extraction" },
  { value: "other", label: "Other" },
];

export const KIND_LABEL = Object.fromEntries(KINDS.map((k) => [k.value, k.label])) as Record<Kind, string>;

export const SIDE: Record<Side, { label: string; badge: "success" | "danger" | "neutral"; stripe: string }> = {
  friendly: { label: "Ours", badge: "success", stripe: "bg-success" },
  hostile: { label: "Hostile", badge: "danger", stripe: "bg-danger" },
  neutral: { label: "Neutral", badge: "neutral", stripe: "bg-border-strong" },
};

/** Theme text colour for a system's security status. */
export function secTone(sec: number) {
  return sec >= 0.5 ? "text-success-fg" : sec > 0 ? "text-warning-fg" : "text-danger-fg";
}
