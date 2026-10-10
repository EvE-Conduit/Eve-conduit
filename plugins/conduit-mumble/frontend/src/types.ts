export const BASE = "/api/p/mumble";
export const PUBLIC_BASE = "/api/public/p/mumble";

export interface Server {
  name: string;
  host: string;
  port: number;
}

export interface Account {
  username: string;
  display_name: string;
  groups: string[];
  created_at: string;
  password_changed_at: string;
  last_login_at: string | null;
  certificate_remembered: boolean;
  /** mumble:// link without the password. */
  url: string | null;
}

export interface Me {
  configured: boolean;
  server: Server;
  can_link: boolean;
  can_temp: boolean;
  cert_auth: boolean;
  account: Account | null;
  groups_due: string[];
  username_preview: string | null;
  display_preview: string | null;
}

/** After creating an account or a new password: shown once. */
export interface MeWithPassword extends Me {
  password: string;
  connect_url: string | null;
}

export interface TempUser {
  id: number;
  username: string;
  display_name: string;
  created_at: string;
  expires_at: string;
  last_login_at: string | null;
  revoked: boolean;
  active: boolean;
}

export type LinkStatus = "active" | "revoked" | "expired" | "used_up";

export interface TempLink {
  id: number;
  label: string;
  url: string;
  created_at: string;
  created_by: { id: number; name: string } | null;
  expires_at: string;
  max_uses: number;
  groups: string[];
  status: LinkStatus;
  uses: number;
  users?: TempUser[];
}

export interface TempOverview {
  enabled: boolean;
  max_hours: number;
  default_group: string;
  known_groups: string[];
  can_manage: boolean;
  server: Server;
  links: TempLink[];
}

export interface PublicLink {
  label: string;
  server: string;
  host: string;
  port: number;
  expires_at: string;
  status: LinkStatus;
  invited_by: string | null;
}

export interface Redeemed extends PublicLink {
  username: string;
  display_name: string;
  password: string;
  url: string | null;
  groups: string[];
}

export interface Mapping {
  id?: number;
  kind: "group" | "state";
  target_id: number;
  target?: string;
  mumble_group: string;
}

export interface Admin {
  settings: {
    host: string;
    port: number;
    server_name: string;
    username_format: string;
    display_format: string;
    allow_cert_auth: boolean;
    temp_enabled: boolean;
    temp_group: string;
    temp_display_format: string;
    temp_max_hours: number;
    configured: boolean;
    authenticator_seen_at: string | null;
    authenticator_version: string;
  };
  site_url: string;
  scope: string;
  mappings: Mapping[];
  known_groups: string[];
  groups: { id: number; name: string }[];
  states: { id: number; name: string; color: string }[];
  stats: { accounts: number; temp_active: number; temp_links: number };
}

export interface LinkedCharacter {
  id: number;
  name: string;
  portrait: string;
  main: boolean;
  corporation: string | null;
  viewable: boolean;
}

export interface MemberAccount extends Account {
  user: { id: number; name: string; portrait: string };
  has_access: boolean;
  groups_due: string[];
  characters?: LinkedCharacter[];
}
