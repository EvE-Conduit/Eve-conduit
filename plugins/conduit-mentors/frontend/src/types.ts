import type { RuleSet } from "@conduit/sdk";

export const BASE = "/api/p/mentors";

export type Status = "waiting" | "active" | "graduated" | "ended";
export type Role = "mentee" | "mentor" | "manager" | "candidate" | null;

export interface Person {
  id: number;
  name: string;
  portrait: string | null;
}

export interface Brief {
  id: number;
  status: Status;
  mentee: Person;
  mentor: Person | null;
  requested_mentor: Person | null;
  focus: string[];
  play_time: string;
  note: string;
  created_at: string;
  assigned_at: string | null;
  ended_at: string | null;
  end_reason: string;
  progress: { done: number; total: number } | null;
}

export interface GoalState {
  id: number;
  title: string;
  description: string;
  auto: boolean;
  mentee_can_tick: boolean;
  rules_text: string;
  checks: { text: string; ok: boolean }[];
  done: boolean;
  by_rules: boolean;
  done_by: string | null;
  done_at: string | null;
}

export interface Message {
  id: number;
  author: string;
  author_id: number | null;
  portrait: string | null;
  text: string;
  private: boolean;
  event: string;
  created_at: string;
}

export interface MenteeCharacter {
  id: number;
  name: string;
  portrait: string;
  main: boolean;
  corporation: string | null;
  total_sp: number | null;
}

export interface Detail extends Brief {
  role: Role;
  goals: GoalState[];
  progress: { done: number; total: number };
  messages: Message[];
  mentor_profile?: { bio: string; play_time: string; focus: string[] } | null;
  sheet_access?: boolean;
  characters?: MenteeCharacter[];
  can: { message: boolean; private_notes: boolean; claim: boolean; assign: boolean; graduate: boolean; end: boolean; withdraw: boolean; tick: boolean };
}

export interface MentorCard extends Person {
  active: boolean;
  capacity: number;
  mentees: number;
  bio: string;
  play_time: string;
  focus: string[];
  graduated: number;
}

export interface Profile {
  active: boolean;
  capacity: number;
  bio: string;
  play_time: string;
  focus: string[];
  mentees: number;
}

export interface Overview {
  focus_areas: string[];
  mine: Detail | null;
  past: Brief[];
  suggested: boolean;
  mentors: MentorCard[];
  is_mentor: boolean;
  can_manage: boolean;
  profile?: Profile;
  mentees?: Brief[];
  waiting?: (Brief & { for_me: boolean; matches: number })[];
}

export interface Goal {
  id: number;
  title: string;
  description: string;
  rules: RuleSet;
  rules_text: string;
  mentee_can_tick: boolean;
  order: number;
}

export interface ProgramSettings {
  focus_areas: string[];
  sheet_access: boolean;
  suggest_rules: RuleSet;
  suggest_text: string;
}

export interface Program {
  mentorships: Brief[];
  mentors: MentorCard[];
  stats: { waiting: number; active: number; graduated: number; ended: number; avg_days_to_graduate: number | null; avg_days_waiting: number | null };
  settings: ProgramSettings;
  goals: Goal[];
  can_edit_rules: boolean;
}

export interface Widget {
  is_mentor: boolean;
  suggested: boolean;
  mine: Brief | null;
  mentees?: number;
  capacity?: number;
  waiting?: number;
}

export const STATUS: Record<Status, { label: string; tone: "info" | "accent" | "success" | "neutral" }> = {
  waiting: { label: "Waiting for a mentor", tone: "info" },
  active: { label: "Being mentored", tone: "accent" },
  graduated: { label: "Graduated", tone: "success" },
  ended: { label: "Ended", tone: "neutral" },
};
