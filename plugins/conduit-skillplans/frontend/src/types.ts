export const BASE = "/api/p/skillplans";

export interface MyBest {
  character: string;
  percent: number;
  complete: boolean;
  seconds_left: number;
}

export interface PlanBrief {
  id: number;
  name: string;
  description: string;
  category: string;
  shared: boolean;
  owner: string | null;
  skills: number;
  steps: number;
  updated_at: string;
  me: MyBest | null;
}

export interface Step {
  skill_id: number;
  level: number;
  name: string;
  group: string;
  rank: number;
  sp: number;
  icon: string;
}

export type StepStatus = "done" | "queued" | "missing";

export interface CharacterProgress {
  id: number;
  name: string;
  portrait: string;
  synced: boolean;
  percent: number;
  done: number;
  total: number;
  complete: boolean;
  sp_left: number;
  seconds_left: number;
  seconds_missing: number;
  steps: { status: StepStatus; seconds: number }[];
  missing_text: string;
}

export interface PlanDetail extends PlanBrief {
  steps_detail: Step[];
  total_sp: number;
  text: string;
  characters: CharacterProgress[];
  can_edit: boolean;
  can_view_progress: boolean;
  created_by: string | null;
}

export interface Overview {
  plans: PlanBrief[];
  can_manage: boolean;
  can_view_progress: boolean;
}

export interface MemberRow {
  user_id: number;
  name: string;
  portrait: string | null;
  character: string;
  percent: number;
  complete: boolean;
  seconds_left: number;
  synced: boolean;
}

export interface Lookup {
  id: number;
  name: string;
  group: string;
  icon: string;
}

export const ROMAN = ["", "I", "II", "III", "IV", "V"];

/** Training time from seconds: "12d 4h", "3h 20m", "45m". */
export function trainTime(seconds: number): string {
  if (seconds <= 0) return "—";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.max(1, Math.floor((seconds % 3600) / 60));
  if (d) return `${d}d ${h}h`;
  if (h) return `${h}h ${m}m`;
  return `${m}m`;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
