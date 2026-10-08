export const BASE = "/api/p/announcements";

export type Tone = "info" | "important" | "urgent";

export interface Announcement {
  id: number;
  title: string;
  body: string;
  tone: Tone;
  pinned: boolean;
  on_landing: boolean;
  publish_at: string;
  expires_at: string | null;
  edited: boolean;
  updated_at: string;
  author: { id: number; name: string; portrait: string | null } | null;
  unread: boolean;
  status: "live" | "scheduled" | "expired";
  // Only for people who can write announcements:
  notify?: boolean;
  announced_at?: string | null;
  states?: { id: number; name: string; color: string }[];
  groups?: { id: number; name: string }[];
}

export interface Feed {
  announcements: Announcement[];
  unread: number;
  can_post: boolean;
}

/** The landing page's Bulletin: the latest announcements posted there, and how many more there are. */
export interface Bulletin {
  announcements: Announcement[];
  more: number;
}

export interface Audience {
  states: { id: number; name: string; color: string }[];
  groups: { id: number; name: string }[];
}
