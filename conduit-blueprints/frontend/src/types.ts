export type RequestKind = "copy" | "loan";
export type RequestStatus = "open" | "accepted" | "in_progress" | "delivered" | "returned" | "declined" | "cancelled";

export interface Person {
  id: number;
  name: string;
  portrait: string | null;
}

export interface Product {
  id: number;
  name: string;
  icon: string;
  group: string;
  category: string;
}

export interface Place {
  id: number;
  name: string;
  system: string | null;
}

/** One blueprint type in the library, with everything of it added up. */
export interface Group {
  type_id: number;
  name: string;
  icon: string;
  product: Product | null;
  category: string;
  originals: number;
  copies: number;
  copy_runs: number;
  best_me: number | null;
  best_te: number | null;
  personal: number;
  owners: string[];
}

export interface Library {
  groups: Group[];
  total: number;
  truncated: boolean;
  categories: { name: string; count: number }[];
  corporations: { id: number; name: string; ticker: string; synced_at: string | null }[];
  can_manage: boolean;
}

/** One blueprint (or stack of originals): a corporation's, or a member's shared original. */
export interface Entry {
  id: string;
  source: "corporation" | "personal";
  type_id: number;
  owner: { id: number; name: string; ticker: string };
  copy: boolean;
  quantity: number;
  runs: number;
  me: number;
  te: number;
  location: Place | null;
  division: string | null;
}

export interface TypeDetail {
  type_id: number;
  name: string;
  icon: string;
  product: Product | null;
  best_me: number | null;
  best_te: number | null;
  has_original: boolean;
  entries: Entry[];
  open_requests: number;
}

export interface Job {
  job_id: number;
  status: string;
  runs: number | null;
  end_date: string | null;
}

export interface BlueprintRequest {
  id: number;
  user: Person;
  kind: RequestKind;
  type_id: number;
  name: string;
  icon: string;
  runs: number;
  copies: number;
  min_me: number | null;
  min_te: number | null;
  loan_days: number | null;
  note: string;
  project: { id: number; name: string } | null;
  status: RequestStatus;
  handled_by: Person | null;
  response: string;
  job: Job | null;
  created_at: string;
  updated_at: string;
  delivered_at: string | null;
  due_at: string | null;
  returned_at: string | null;
  overdue: boolean;
}

export interface JobOption {
  job_id: number;
  corporation: string;
  runs: number;
  status: string;
  start_date: string;
  end_date: string;
  installer: string;
}

export const BASE = "/api/p/blueprints";
