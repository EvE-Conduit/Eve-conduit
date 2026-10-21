export const BASE = "/api/p/ops";

export type Kind = "cta" | "stratop" | "roam" | "defense" | "mining" | "training" | "social" | "other";
export type Status = "upcoming" | "live" | "past" | "cancelled";
export type Answer = "going" | "maybe" | "declined";

export interface Person {
  id: number;
  name: string;
  portrait: string | null;
}

export interface Rsvp {
  user: string;
  answer: Answer;
  /** Only shown to the FC, editors and the person themselves. */
  character: string | null;
  note: string;
}

export interface Op {
  id: number;
  title: string;
  kind: Kind;
  starts_at: string;
  ends_at: string;
  duration_minutes: number;
  fc: Person | null;
  /** Who leads it, as typed, when the FC isn't on the site. */
  fc_name: string;
  formup: string;
  comms: string;
  /** ``link`` is set while the Doctrines plugin is on. */
  doctrine: { id: number | null; name: string; link: string | null } | null;
  description: string;
  states: { id: number; name: string; color: string }[];
  groups: { id: number; name: string }[];
  important: boolean;
  ping: boolean;
  ping_roles: string[];
  status: Status;
  counts: Record<Answer, number>;
  my_answer: Answer | null;
  my_character: number | null;
  my_note: string;
  can_edit: boolean;
  rsvps: Rsvp[];
  created_by: Person | null;
  updated_at: string;
}

export interface Board {
  upcoming: Op[];
  past: Op[];
  characters: { id: number; name: string }[];
  main_character: number | null;
  can_schedule: boolean;
  can_manage: boolean;
  /** The Doctrines plugin is on, so ops can link to its doctrines. */
  doctrines: boolean;
  reminder_minutes: number[];
}

export interface Options {
  states: { id: number; name: string; color: string }[];
  groups: { id: number; name: string }[];
  doctrines: { id: number; name: string }[];
  default_ping_roles: string[];
}

export interface Settings {
  reminder_minutes: number[];
  keep_days: number;
  default_ping_roles: string[];
}

export interface DiscordRole {
  id: string;
  name: string;
  /** Discord's role colour as an integer, 0 for none. */
  color: number;
}

export interface DiscordRoles {
  /** False without the Discord plugin linked to a server; then only the webhook's own mention pings. */
  available: boolean;
  roles: DiscordRole[];
  error?: string;
}

export const KINDS: { value: Kind; label: string }[] = [
  { value: "cta", label: "CTA" },
  { value: "stratop", label: "Stratop" },
  { value: "roam", label: "Roam" },
  { value: "defense", label: "Home defense" },
  { value: "mining", label: "Mining" },
  { value: "training", label: "Training" },
  { value: "social", label: "Social" },
  { value: "other", label: "Other" },
];

export const KIND_LABEL = Object.fromEntries(KINDS.map((k) => [k.value, k.label])) as Record<Kind, string>;

/** Badge tone and the stripe down the left of an op, by kind. */
export const KIND_STYLE: Record<Kind, { badge: "danger" | "warning" | "accent" | "info" | "success" | "neutral"; stripe: string }> = {
  cta: { badge: "danger", stripe: "bg-danger" },
  stratop: { badge: "warning", stripe: "bg-warning" },
  defense: { badge: "warning", stripe: "bg-warning" },
  roam: { badge: "accent", stripe: "bg-accent" },
  mining: { badge: "info", stripe: "bg-info" },
  training: { badge: "success", stripe: "bg-success" },
  social: { badge: "neutral", stripe: "bg-border-strong" },
  other: { badge: "neutral", stripe: "bg-border-strong" },
};

export const ANSWERS: { value: Answer; label: string }[] = [
  { value: "going", label: "Going" },
  { value: "maybe", label: "Maybe" },
  { value: "declined", label: "Can't" },
];

export function fcName(op: Op): string {
  return op.fc?.name ?? op.fc_name;
}
