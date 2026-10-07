import type { CharacterBrief, StateBrief } from "@/lib/types";

export type JoinMode = "open" | "request" | "closed";
export type LeaveMode = "open" | "request" | "closed";

export interface Rule {
  type: string;
  params: Record<string, unknown>;
  negate?: boolean;
}

export interface RuleSet {
  match?: "all" | "any";
  rules?: Rule[];
}

export interface RuleParamSpec {
  name: string;
  type: "int" | "str" | "bool" | "choice" | "state" | "group" | "skill" | "corporation" | "alliance" | "ship" | "ship_group" | "item";
  label: string;
  multiple: boolean;
  choices: { value: string; label: string }[];
  default: unknown;
  min: number | null;
  max: number | null;
  help: string;
}

export interface RuleTypeSpec {
  key: string;
  label: string;
  description: string;
  category: string;
  plugin: string | null;
  params: RuleParamSpec[];
}

export interface UserBrief {
  id: number;
  name: string;
  portrait: string | null;
}

export interface AdminGroup {
  id: number;
  name: string;
  description: string;
  color: string;
  joinable: boolean;
  join_mode: JoinMode;
  leave_mode: LeaveMode;
  hidden: boolean;
  allowed_states: StateBrief[];
  permissions: string[];
  member_count: number;
  leaders: UserBrief[];
  leader_groups: { id: number; name: string }[];
  requirements: RuleSet;
  requirements_text: string[];
  auto: boolean;
  rules: RuleSet;
  rules_text: string;
  auto_remove: boolean;
  grace_hours: number;
  last_evaluated: string | null;
  pending_requests: number;
}

export interface Check {
  text: string;
  ok: boolean;
}

export interface MyGroupFull {
  id: number;
  name: string;
  description: string;
  color: string;
  joinable: boolean;
  member: boolean;
  join_mode: JoinMode;
  leave_mode: LeaveMode;
  auto: boolean;
  member_count: number;
  eligible: boolean;
  requirements: Check[];
  pending_request: { id: number; kind: "join" | "leave"; message: string; created_at: string } | null;
  leader: boolean;
}

export interface GroupMember {
  id: number;
  name: string;
  main: CharacterBrief | null;
  state: StateBrief | null;
  is_leader?: boolean;
  problems?: string[];
}

export interface GroupRequest {
  id: number;
  kind: "join" | "leave";
  status: "pending" | "approved" | "rejected" | "cancelled";
  message: string;
  response: string;
  created_at: string;
  decided_at: string | null;
  decided_by: string | null;
  group: { id: number; name: string; color: string };
  user: GroupMember;
  requirements?: Check[];
}

export interface LedGroup {
  id: number;
  name: string;
  description: string;
  color: string;
  join_mode: JoinMode;
  leave_mode: LeaveMode;
  auto: boolean;
  member_count: number;
  pending_requests: number;
}

export interface Leadership {
  leads_groups: boolean;
  group_count: number;
  pending_requests: number;
}

export const JOIN_MODE_LABEL: Record<JoinMode, string> = { open: "Open", request: "On request", closed: "Managed" };
