export type ProjectStatus = "open" | "done" | "cancelled";
export type ContributionStatus = "claimed" | "delivered" | "confirmed";

export interface Person {
  id: number;
  name: string;
  portrait: string | null;
}

export interface Progress {
  done: number;
  claimed: number;
  items: number;
  items_done: number;
}

/** What the claimant's industry jobs for the item look like since they claimed it. Only a hint. */
export interface IndustryHint {
  jobs: number;
  runs_in_production: number;
  runs_ready: number;
  runs_delivered: number;
  ends_at: string | null;
}

export interface Contribution {
  id: number;
  item_id: number;
  user: Person;
  quantity: number;
  status: ContributionStatus;
  note: string;
  review_note: string;
  created_at: string;
  delivered_at: string | null;
  confirmed_at: string | null;
  industry: IndustryHint | null;
}

export interface Item {
  id: number;
  type_id: number;
  name: string;
  icon: string;
  quantity: number;
  points_per_unit: number;
  isk_per_unit: number;
  confirmed: number;
  claimed: number;
  delivered: number;
  free: number;
  contributions: Contribution[];
}

export interface ProjectSummary {
  id: number;
  name: string;
  description: string;
  location: string;
  deadline: string | null;
  status: ProjectStatus;
  states: { id: number; name: string; color: string }[];
  groups: { id: number; name: string }[];
  created_by: string | null;
  created_at: string;
  closed_at: string | null;
  progress: Progress;
  my_open_claims?: boolean;
}

export interface Project extends ProjectSummary {
  items: Item[];
  contributors: { user: Person; confirmed_units: number; open_units: number; points: number }[];
  can_manage: boolean;
  store_enabled: boolean;
}

/** A contribution with the project and item it belongs to (My contributions, the deliveries queue). */
export interface ContributionRow extends Contribution {
  item: string;
  type_id: number;
  project: { id: number; name: string; status?: ProjectStatus; location?: string };
  points: number;
}

export interface Options {
  states: { id: number; name: string; color: string }[];
  groups: { id: number; name: string }[];
}

export const BASE = "/api/p/projects";
