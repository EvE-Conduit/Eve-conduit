export const BASE = "/api/p/teamspeak";

export interface Server {
  name: string;
  host: string;
  port: number;
}

export interface PendingAccount {
  status: "pending";
  privilege_key: string;
  started_at: string;
  /** ts3server:// link with the nickname and the key filled in. */
  connect_url: string | null;
}

export interface LinkedAccount {
  status: "linked";
  cldbid: number;
  uid: string;
  nickname: string;
  linked_at: string;
  synced_at: string | null;
  last_connected_at: string | null;
  error: string;
  /** Names of the mapped server groups given at the last sync. */
  groups: string[];
}

export type Account = PendingAccount | LinkedAccount;

export interface Me {
  configured: boolean;
  server: Server;
  can_link: boolean;
  account: Account | null;
  groups_due: string[];
  registered_group: string | null;
  nickname: string | null;
  /** ts3server:// link without a key. */
  url: string | null;
}

export interface Checked extends Me {
  found: boolean;
}

export interface ServerGroup {
  sgid: number;
  name: string;
}

export interface Mapping {
  id?: number;
  kind: "group" | "state";
  target_id: number;
  target?: string;
  sgid: number;
  sg_name?: string;
}

export interface Admin {
  settings: {
    query_host: string;
    query_port: number;
    query_user: string;
    query_password_set: boolean;
    server_id: number;
    public_host: string;
    public_port: number;
    server_name: string;
    nickname_format: string;
    registered_sgid: number;
    kick_without_access: boolean;
    require_for_compliance: boolean;
    allowlisted: boolean;
    configured: boolean;
    virtual_server_name: string;
    server_version: string;
    checked_at: string | null;
    last_full_sync: string | null;
  };
  server_groups: ServerGroup[];
  mappings: Mapping[];
  groups: { id: number; name: string }[];
  states: { id: number; name: string; color: string }[];
  stats: { linked: number; pending: number; errors: number };
}

export interface Check {
  name: string;
  version: string;
  online: number;
  max_clients: number;
  voice_port: number;
  registered_group: string;
  groups: ServerGroup[];
  problems: string[];
}

export interface LinkedCharacter {
  id: number;
  name: string;
  portrait: string;
  main: boolean;
  corporation: string | null;
  viewable: boolean;
}

export type MemberAccount = Account & {
  user: { id: number; name: string; portrait: string };
  has_access: boolean;
  groups_due: string[];
  characters?: LinkedCharacter[];
};
