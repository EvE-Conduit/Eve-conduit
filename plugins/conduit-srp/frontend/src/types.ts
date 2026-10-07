export const BASE = "/api/p/srp";

export type Status = "pending" | "approved" | "rejected" | "paid";

export const STATUS: Record<Status, { label: string; tone: "info" | "success" | "danger" | "accent" }> = {
  pending: { label: "Pending", tone: "info" },
  approved: { label: "Approved", tone: "accent" },
  rejected: { label: "Rejected", tone: "danger" },
  paid: { label: "Paid", tone: "success" },
};

export interface Ship {
  id: number;
  name: string;
  group: string;
  icon: string;
}

export interface SystemInfo {
  id: number;
  name: string;
  security: number;
  region: string;
}

export interface Loss {
  killmail_id: number;
  time: string;
  character: { id: number; name: string };
  ship: Ship;
  system: SystemInfo | null;
  value: number;
  attackers: number;
  zkillboard: string;
  suggested: number | null;
}

export interface SrpRequest {
  id: number;
  status: Status;
  user: { id: number; name: string; portrait: string };
  character: { id: number; name: string };
  ship: Ship;
  system: SystemInfo | null;
  time: string;
  value: number;
  zkillboard: string;
  killmail_id: number;
  fleet: string;
  fc: string;
  notes: string;
  suggested: number | null;
  payout: number | null;
  created_at: string;
  decided_at: string | null;
  decided_by: string | null;
  decision_note: string;
  paid_at: string | null;
  paid_by: string | null;
}

export interface FitItem extends Ship {
  category: string;
  destroyed: number;
  dropped: number;
  value: number;
}

export interface Rule {
  id: number;
  kind: "ship" | "group";
  type_id: number | null;
  group_id: number | null;
  name: string;
  icon: string | null;
  covered: boolean;
  payout: number | null;
  percent: number | null;
  note: string;
}

export interface RequestDetail extends SrpRequest {
  fitting: { label: string; items: FitItem[] }[];
  victim_corporation: string | null;
  victim_alliance: string | null;
  final_blow: string | null;
  attackers: number;
  rule: Rule | null;
  history: Record<Status, number>;
  can_review: boolean;
  can_pay: boolean;
  mine: boolean;
}

export interface Settings {
  default_percent: number;
  covered_only: boolean;
  max_age_days: number;
  require_fleet: boolean;
  corporations: number[];
  rules_text: string;
}

export interface Me {
  settings: Settings;
  losses: Loss[];
  requests: SrpRequest[];
  totals: { pending: number; approved: number; paid: number };
}

export interface Queue {
  requests: SrpRequest[];
  counts: Record<Status, number>;
  totals: { pending: number; approved: number; paid_30d: number };
}

export interface FullSettings extends Settings {
  rules: Rule[];
  available_corporations: { id: number; name: string; ticker: string }[];
}
