export const BASE = "/api/p/discord";
export const PUBLIC_BASE = "/api/public/p/discord";

export interface Account {
  discord_id: string;
  username: string;
  avatar: string;
  linked_at: string;
  synced_at: string | null;
  error: string;
  nickname: string;
  roles: string[];
  /** On the server at the last sync. */
  on_server: boolean;
}

export interface Me {
  configured: boolean;
  server: string;
  server_url: string | null;
  can_link: boolean;
  /** May hand out temporary access links, and they are switched on. */
  can_invite_guests?: boolean;
  account: Account | null;
  roles: string[];
  roles_due: string[];
  nickname: string | null;
}

export interface Mapping {
  id?: number;
  kind: "group" | "state";
  target_id: number;
  target?: string;
  role_id: string;
  role_name: string;
}

export interface Admin {
  settings: {
    client_id: string;
    client_secret_set: boolean;
    bot_token_set: boolean;
    guild_id: string;
    guild_name: string;
    nickname_format: string;
    kick_without_access: boolean;
    require_for_compliance: boolean;
    configured: boolean;
    last_full_sync: string | null;
    guest_enabled: boolean;
    guest_role_id: string;
    guest_role_name: string;
    guest_max_hours: number;
    /** Channels guests may be let into; empty when channels aren't limited. */
    guest_channels: GuestChannel[];
  };
  redirect_uri: string;
  /** The second redirect the Discord application needs, for guests. */
  guest_redirect_uri: string;
  guest_hours_ceiling: number;
  /** After saving Temporary access: channels guests can still see although they shouldn't. */
  guest_channels_seen?: string[];
  /** After saving: hiding the other channels is still running in the background. */
  guest_channels_hiding?: boolean;
  invite_url: string | null;
  mappings: Mapping[];
  groups: { id: number; name: string }[];
  states: { id: number; name: string; color: string }[];
  stats: { linked: number; errors: number };
}

export interface DiscordRole {
  id: string;
  name: string;
  color: string | null;
  position: number;
  assignable: boolean;
}

export interface Check {
  guild: { id: string; name: string; icon: string | null; members: number | null };
  bot: { id: string; name: string; on_server: boolean };
  roles: DiscordRole[];
  problems: string[];
}

export interface LinkedCharacter {
  id: number;
  name: string;
  portrait: string;
  main: boolean;
  corporation: string | null;
  /** Whether you may open its character sheet. Alts you may not are left out. */
  viewable: boolean;
}

export interface LinkedMember extends Account {
  user: { id: number; name: string; portrait: string };
  has_access: boolean;
  role_names: string[];
  /** Main first, then the alts you're allowed to see. */
  characters?: LinkedCharacter[];
}

export interface GuestChannel {
  id: string;
  name: string;
  kind: "text" | "voice" | "announcement" | "stage" | "forum";
  /** Only in the list to choose from. */
  category?: string;
}

export type GuestLinkStatus = "active" | "expired" | "revoked" | "used_up" | "creator_lost";

export interface GuestUser {
  id: number;
  discord_id: string;
  username: string;
  avatar: string;
  joined_at: string;
  ended_at: string | null;
  /** expired, revoked, removed, creator_lost or member (they linked their account here since). */
  ended_reason: string;
  /** Why they couldn't be removed yet; tried again every couple of minutes. */
  error: string;
}

export interface GuestLink {
  id: number;
  label: string;
  url: string;
  status: GuestLinkStatus;
  created_at: string;
  expires_at: string;
  /** When it stopped (or will stop) working: withdrawn or run out. */
  ended_at: string;
  max_uses: number;
  uses: number;
  role: string;
  /** The channels it opens; empty when channels aren't limited. */
  channels: GuestChannel[];
  created_by: { id: number; name: string } | null;
  guests: GuestUser[];
}

export interface GuestOverview {
  enabled: boolean;
  can_manage: boolean;
  max_hours: number;
  role: string;
  /** The channels a link can open; empty when channels aren't limited. */
  channels: GuestChannel[];
  server: string;
  links: GuestLink[];
}

/** What a guest sees about a link before joining. */
export interface PublicGuestLink {
  label: string;
  server: string;
  expires_at: string;
  status: GuestLinkStatus;
  invited_by: string | null;
}

export interface GuestJoined extends PublicGuestLink {
  username: string;
  avatar: string;
  server_url: string;
}
