export type Kind = "journal" | "market" | "contract" | "mail" | "contact" | "corp_history";
export type State = "new" | "acknowledged" | "dismissed";
export type EntityKind = "character" | "corporation" | "alliance";

export interface Person {
  id: number;
  name: string;
  portrait: string | null;
  corporation: string | null;
}

export interface Entity {
  id: number;
  kind: EntityKind;
  name: string;
  image: string | null;
}

export interface Finding {
  id: number;
  user: Person;
  character: { id: number; name: string; portrait: string };
  kind: Kind;
  kind_label: string;
  entity: Entity;
  source: "blacklist" | "watch";
  count: number;
  amount: number;
  first_seen: string | null;
  last_seen: string | null;
  present: boolean;
  state: State;
  note: string;
  decided_by: string | null;
  decided_at: string | null;
  found_at: string;
  flagged_at: string | null;
  reopened: boolean;
  new_evidence: boolean;
  sheet_link: string;
}

/** One record behind a finding; which fields are set depends on the kind. */
export interface EvidenceRow {
  date?: string | null;
  // journal
  ref_type?: string;
  amount?: number | null;
  description?: string;
  reason?: string;
  first_party?: Entity | null;
  second_party?: Entity | null;
  // market
  type?: { id: number; name: string; icon?: string } | string;
  quantity?: number;
  unit_price?: number;
  total?: number;
  is_buy?: boolean;
  // contract
  contract_id?: number;
  status?: string;
  title?: string;
  issuer?: Entity | null;
  assignee?: Entity | null;
  acceptor?: Entity | null;
  price?: number;
  reward?: number;
  // mail
  mail_id?: number;
  subject?: string;
  sender?: Entity | null;
  recipients?: (Entity | null)[];
  from_them?: boolean;
  // contact
  standing?: number;
  labels?: string[];
  is_watched?: boolean;
  is_blocked?: boolean;
  // corp_history
  corporation?: Entity | null;
  start?: string | null;
  end?: string | null;
  current?: boolean;
}

export interface Evidence extends Finding {
  rows: EvidenceRow[];
  rows_limited: boolean;
  character_registered: boolean;
}

export interface Page<T> {
  count: number;
  items: T[];
}

export interface Summary {
  new: number;
  acknowledged: number;
  dismissed: number;
  members: number;
  by_kind: Partial<Record<Kind, number>>;
  watched: number;
  last_scan_at: string | null;
  last_scan_characters: number;
  last_scan_new: number;
  blacklist_available: boolean;
  can_manage: boolean;
}

export interface MemberRow extends Person {
  new: number;
  acknowledged: number;
  dismissed: number;
  entities: number;
  last_seen: string | null;
  flagged_at: string | null;
}

export interface MemberDetail {
  user: Person;
  characters: { id: number; name: string; portrait: string; corporation: string | null; findings: number }[];
  findings: Finding[];
}

export interface WatchItem extends Entity {
  id: number;
  eve_id: number;
  source: "blacklist" | "watch";
  reason: string;
  severity: string;
  added_by: string | null;
  created_at: string | null;
  open: number;
}

export interface WatchList {
  items: WatchItem[];
  blacklist: WatchItem[];
  blacklist_available: boolean;
  use_blacklist: boolean;
  can_manage: boolean;
}

export interface Hit extends Entity {
  watched: boolean;
}

export interface Settings {
  notify_group: number | null;
  use_blacklist: boolean;
  blacklist_watch_entries: boolean;
  min_standing: number;
  skip_kinds: Kind[];
  blacklist_available: boolean;
  kind_options: { value: Kind; label: string }[];
  group_options: { id: number; name: string }[];
  recipients: number;
}

export const KINDS: Record<Kind, string> = {
  journal: "Wallet journal",
  market: "Market",
  contract: "Contracts",
  mail: "Mail",
  contact: "Contact",
  corp_history: "Corporation history",
};

export const STATES: Record<State, { label: string; tone: "warning" | "info" | "neutral" }> = {
  new: { label: "New", tone: "warning" },
  acknowledged: { label: "Acknowledged", tone: "info" },
  dismissed: { label: "Dismissed", tone: "neutral" },
};

export const ENTITY_KINDS: Record<EntityKind, string> = { character: "Character", corporation: "Corporation", alliance: "Alliance" };

export const BASE = "/api/p/spycheck";
