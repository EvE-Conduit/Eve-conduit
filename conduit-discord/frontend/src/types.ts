export const BASE = "/api/p/discord";

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
  };
  redirect_uri: string;
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
