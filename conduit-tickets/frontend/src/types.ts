export const BASE = "/api/p/tickets";

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

export interface Candidate extends Person {
  matched: string | null;
  discord: string;
  on_server: boolean;
  open_ticket: number | null;
}

export interface Ticket {
  id: number;
  subject: string;
  target: Person | null;
  target_name: string;
  opened_by: string;
  opened_at: string;
  closed_at: string | null;
  closed_by: string | null;
  url: string | null;
  can_delete_channel: boolean;
}

export interface Settings {
  category_id: string;
  staff_role_id: string;
  roles: { id: string; name: string }[];
  invite_url: string | null;
  problems: string[];
}
