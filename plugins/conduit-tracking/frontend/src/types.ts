export const BASE = "/api/p/tracking";

export interface Page<T> {
  count: number;
  items: T[];
}

export interface Person {
  id: number;
  name: string;
  portrait: string | null;
  corporation: string | null;
}

export interface Session {
  id: number;
  target: Person;
  target_name: string;
  started_by: string | null;
  stopped_by: string | null;
  reason: string;
  days: number;
  started_at: string;
  ends_at: string;
  ended_at: string | null;
  running: boolean;
}

export interface Candidate extends Person {
  /** The alt whose name matched, when it wasn't the main. */
  matched: string | null;
  characters: number;
  tracked: boolean;
}

export interface System {
  id: number;
  name: string;
  security: number | null;
  region: string;
}

export interface ItemType {
  id: number;
  name: string;
  group: string;
  icon: string;
}

export type Status = "ok" | "missing_scopes" | "token_invalid" | "error" | "gone" | "pending";

export interface TrackedCharacter {
  id: number;
  name: string;
  portrait: string;
  status: Status;
  status_label: string;
  status_detail: string;
  online: boolean | null;
  last_polled_at: string | null;
  seconds: number;
  docked_seconds: number;
  top_system: System | null;
  top_ship: ItemType | null;
  earned: number;
  now: { system: System; ship: ItemType | null; docked: boolean } | null;
}

type Ranked = { seconds: number; characters: string[] };

export interface Report {
  session: Session;
  period: { start: string; end: string };
  totals: {
    online_seconds: number;
    docked_seconds: number;
    systems: number;
    regions: number;
    ships: number;
    earned: number;
    spent: number;
    kills: number;
    losses: number;
    isk_destroyed: number;
    isk_lost: number;
    mined_value: number;
  };
  characters: TrackedCharacter[];
  systems: (System & Ranked)[];
  regions: ({ name: string } & Ranked)[];
  ships: (ItemType & Ranked)[];
  docked: ({ id: number; name: string } & Ranked)[];
  by_day: { day: string; seconds: number }[];
  by_hour: number[];
  income: { ref_type: string; amount: number }[];
  spending: { ref_type: string; amount: number }[];
  isk_systems: (System & { amount: number })[];
  mining: (ItemType & { quantity: number; value: number })[];
  mining_systems: (System & { value: number })[];
  killmails: {
    id: number;
    hash: string;
    time: string;
    is_loss: boolean;
    character: string;
    system: System;
    victim_ship: ItemType;
    value: number;
  }[];
  killmail_ships: (ItemType & { count: number })[];
  timeline: {
    character: string;
    system: System;
    ship: ItemType | null;
    ship_name: string;
    docked: string | null;
    started_at: string;
    ended_at: string;
    seconds: number;
  }[];
  timeline_total: number;
}

/** "3h 20m", "45m", "under a minute". */
export function hours(seconds: number): string {
  if (seconds < 60) return seconds > 0 ? "under a minute" : "0m";
  const m = Math.round(seconds / 60);
  const h = Math.floor(m / 60);
  return h ? `${h}h ${m % 60}m` : `${m}m`;
}
