import type { DiscordRole } from "@conduit/sdk";

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
  roles: { id: string; name: string }[];
  /** The panel button it was opened from; empty if staff opened it. */
  panel: string;
  opened_by: string;
  opened_at: string;
  closed_at: string | null;
  closed_by: string | null;
  url: string | null;
}

export interface TicketDetail extends Ticket {
  message: string;
  /** The viewer opened it themselves from a panel. */
  mine: boolean;
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

export interface RoleChoices {
  roles: DiscordRole[];
  defaults: string[];
  error: string;
}

export interface Settings {
  category_id: string;
  default_role_ids: string[];
  roles: DiscordRole[];
  invite_url: string | null;
  problems: string[];
}

export interface PanelButton {
  id?: number;
  label: string;
  role_ids: string[];
  category_id: string;
}

export interface Panel {
  id: number;
  channel_id: string;
  title: string;
  text: string;
  buttons: PanelButton[];
}

export interface Panels {
  panels: Panel[];
  channels: { id: string; name: string }[];
  categories: { id: string; name: string }[];
  roles: DiscordRole[];
  endpoint_url: string;
  problems: string[];
}
