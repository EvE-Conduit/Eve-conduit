export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface Person {
  id: number;
  name: string;
  portrait: string | null;
  corporation: string | null;
}

export interface Leave {
  id: number;
  start: string;
  end: string;
  reason: string;
  status: LeaveStatus;
  note: string;
  decided_by: string | null;
  decided_at: string | null;
  created_at: string;
  running: boolean;
  over: boolean;
  user?: Person;
}

export interface Me {
  leaves: Leave[];
  needs_approval: boolean;
  max_leave_days: number;
  days: number;
  last_active: string | null;
  can_see_list: boolean;
}

export interface MemberRow extends Person {
  last_site: string | null;
  last_game: string | null;
  last_fleet: string | null;
  last_active: string | null;
  days_inactive: number | null;
  inactive: boolean;
  inactive_since: string | null;
  on_leave_until: string | null;
}

export interface Members {
  items: MemberRow[];
  counts: { all: number; inactive: number; leave: number };
  checked_at: string | null;
  can_manage: boolean;
}

export interface Summary {
  inactive: number;
  on_leave: number;
  pending: number;
  checked: number;
  days: number;
}

export interface Settings {
  days: number;
  use_site: boolean;
  use_game: boolean;
  use_fleets: boolean;
  states: number[];
  groups: number[];
  leave_needs_approval: boolean;
  max_leave_days: number;
  notify_member: boolean;
  fleets_available: boolean;
  state_options: { id: number; name: string }[];
  group_options: { id: number; name: string }[];
}

export const LEAVE: Record<LeaveStatus, { label: string; tone: "info" | "success" | "danger" | "neutral" }> = {
  pending: { label: "Waiting for approval", tone: "info" },
  approved: { label: "Approved", tone: "success" },
  rejected: { label: "Not approved", tone: "danger" },
  cancelled: { label: "Cancelled", tone: "neutral" },
};

export const BASE = "/api/p/inactivity";
