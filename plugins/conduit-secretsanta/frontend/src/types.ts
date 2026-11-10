export const BASE = "/api/p/secretsanta";
export const ORGANISE = "secretsanta.organise_events";

export type Phase = "signup" | "closed" | "drawn" | "running" | "ended";

export interface Char {
  id: number;
  name: string;
  portrait: string | null;
}

export interface EventSummary {
  id: number;
  name: string;
  description: string;
  signup_closes_at: string;
  gift_deadline: string;
  budget_isk: number | null;
  phase: Phase;
  reveal_all: boolean;
  participants: number;
  joined: boolean;
}

export interface GivingTo {
  name: string;
  character: Char | null;
  wishlist: string;
  sent_at: string | null;
  sent_note: string;
  received_at: string | null;
  thanks: string;
}

export interface MyGift {
  sent_at: string | null;
  sent_note: string;
  received_at: string | null;
  thanks: string;
}

export interface Me {
  id: number;
  character: Char | null;
  wishlist: string;
  can_withdraw: boolean;
  giving_to: GivingTo | null;
  my_gift: MyGift | null;
}

export interface Person {
  id: number;
  name: string;
  portrait: string | null;
}

export interface Pair {
  giver: Person;
  giftee: Person & { character: Char | null };
  sent_at: string | null;
  received_at: string | null;
}

export interface Organiser {
  notes: string;
  states: { id: number; name: string; color: string }[];
  groups: { id: number; name: string }[];
  drawn_at: string | null;
  published_at: string | null;
  ended_at: string | null;
  participants: (Person & { character: Char | null; joined_at: string; has_wishlist: boolean; sent_at: string | null; received_at: string | null })[];
  exclusions: { id: number; first: number; second: number }[];
  sent: number;
  received: number;
}

export interface EventDetail extends EventSummary {
  may_join: boolean;
  characters: Char[];
  me: Me | null;
  pairs: Pair[] | null;
  organiser: Organiser | null;
}

export interface EventList {
  events: EventSummary[];
  can_organise: boolean;
}

export interface Widget {
  event: EventSummary | null;
  giving_to: { name: string; character: Char | null; sent_at: string | null } | null;
}

export interface Audience {
  states: { id: number; name: string; color: string }[];
  groups: { id: number; name: string }[];
}

export const PHASE: Record<Phase, { label: string; tone: "accent" | "neutral" | "warning" | "success" | "info" }> = {
  signup: { label: "Sign-up open", tone: "accent" },
  closed: { label: "Waiting for the draw", tone: "warning" },
  drawn: { label: "Drawn, not sent", tone: "warning" },
  running: { label: "Gifts under way", tone: "success" },
  ended: { label: "Ended", tone: "neutral" },
};
