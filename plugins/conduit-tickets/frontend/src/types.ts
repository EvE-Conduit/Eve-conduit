export const BASE = "/api/p/tickets";

export type Via = "discord" | "mail" | "both";

export const VIA_LABEL: Record<Via, string> = { discord: "Discord", mail: "EVE mail", both: "Discord + EVE mail" };

export interface Sender {
  name: string | null;
  can_mail: boolean;
  problem: string;
}

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
  discord: string | null;
  on_server: boolean;
  open_ticket: number | null;
}

export interface Ticket {
  id: number;
  via: Via;
  subject: string;
  mail_sent: boolean;
  mail_error: string;
  archive_state: "" | "pending" | "done" | "lost";
  archive_error: string;
  target: Person | null;
  target_name: string;
  opened_by: string;
  opened_at: string;
  closed_at: string | null;
  closed_by: string | null;
  url: string | null;
}

export interface TicketDetail extends Ticket {
  message: string;
}

export interface Attachment {
  id: number;
  name: string;
  size: number;
  state: "saved" | "too_big" | "unavailable";
  image: boolean;
}

export interface Message {
  id: number;
  author: string;
  is_bot: boolean;
  content: string;
  attachments: Attachment[];
  embeds: { title: string; description: string }[];
  sent_at: string;
  edited_at: string | null;
}

export interface Settings {
  category_id: string;
  staff_role_id: string;
  roles: { id: string; name: string }[];
  invite_url: string | null;
  problems: string[];
}
