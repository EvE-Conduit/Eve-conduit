export type Status = "new" | "review" | "accepted" | "rejected" | "withdrawn";
export type Kind = "text" | "long" | "yesno" | "choice";

export interface Question {
  id: string;
  label: string;
  help: string;
  kind: Kind;
  choices: string[];
  required: boolean;
}

export interface FormInfo {
  id: number;
  name: string;
  description: string;
  questions: Question[];
  open: boolean;
  accept_groups?: { id: number; name: string }[];
  applications?: number;
  order?: number;
}

/** Whether the applicant has linked Discord and is on the server; null when Require Discord is off. */
export interface DiscordStatus {
  linked: boolean;
  username: string | null;
  on_server: boolean;
  error: string;
  ok: boolean;
}

export interface RecruitSettings {
  require_discord: boolean;
  discord_plugin: { installed: boolean; enabled: boolean; configured: boolean };
}

export interface Comment {
  id: number;
  author: string;
  author_id: number | null;
  portrait: string | null;
  text: string;
  internal: boolean;
  event: string;
  created_at: string;
}

export interface CharacterSummary {
  id: number;
  name: string;
  portrait: string;
  main: boolean;
  corporation: string | null;
  alliance: string | null;
  total_sp: number | null;
  wallet: number | null;
  birthday: string | null;
  security_status: number | null;
  kills: number;
  losses: number;
  login_ok: boolean;
}

export interface ApplicationInfo {
  id: number;
  status: Status;
  form: { id: number; name: string };
  user: { id: number; name: string; portrait: string | null };
  reviewer: string | null;
  reviewer_id: number | null;
  created_at: string;
  updated_at: string;
  decided_at: string | null;
  decision_message: string;
  questions?: (Question & { answer: string | boolean | null })[];
  comments?: Comment[];
  characters?: CharacterSummary[];
  accept_groups?: string[];
  history?: { id: number; status: Status; form: string; created_at: string }[];
}

export const STATUS: Record<Status, { label: string; tone: "info" | "accent" | "success" | "danger" | "neutral" }> = {
  new: { label: "New", tone: "info" },
  review: { label: "In review", tone: "accent" },
  accepted: { label: "Accepted", tone: "success" },
  rejected: { label: "Rejected", tone: "danger" },
  withdrawn: { label: "Withdrawn", tone: "neutral" },
};

export const BASE = "/api/p/recruit";
