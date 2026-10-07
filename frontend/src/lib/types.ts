export interface Entity {
  id: number;
  name: string;
  ticker: string;
  logo: string;
}

export interface CharacterBrief {
  id: number;
  name: string;
  portrait: string;
  corporation: Entity | null;
  alliance: Entity | null;
}

export interface StateBrief {
  id: number;
  name: string;
  color: string;
}

export interface Preferences {
  theme: "system" | "dark" | "light";
  density: "comfortable" | "compact";
  timezone: string;
  clock_24h: boolean;
  reduce_motion: boolean;
  /** 0 normal, 1 larger, 2 largest */
  text_scale: number;
  high_contrast: boolean;
  muted_categories: string[];
  dashboard: { hidden?: string[]; order?: string[] };
}

export interface CurrentUser {
  id: number;
  name: string;
  main: CharacterBrief | null;
  state: StateBrief | null;
  is_admin: boolean;
  permissions: string[];
  unread_notifications: number;
  preferences: Preferences;
  /** Set while an admin is signed in as this user. */
  impersonated_by: { id: number; name: string } | null;
  /** Leads at least one group (or manages access): show "Manage groups". */
  leads_groups?: boolean;
  /** Join/leave requests waiting for this user as a group leader. */
  pending_group_requests?: number;
}

export interface AppNotification {
  id: number;
  created_at: string;
  level: "info" | "success" | "warning" | "danger";
  category: string;
  title: string;
  body: string;
  link: string;
  read: boolean;
}

/** GET /api/search?q= */
export interface SearchHit {
  id: string;
  title: string;
  subtitle?: string;
  /** Image URL (portrait, logo, item icon) */
  image?: string | null;
  /** Lucide icon name when there's no image */
  icon?: string | null;
  url: string;
}
export interface SearchGroup {
  key: string;
  label: string;
  hits: SearchHit[];
}

export interface NavItem {
  label: string;
  path: string;
  icon: string;
  permission: string | null;
}

export interface PluginEntry {
  id: string;
  name: string;
  version: string;
  nav: NavItem[];
  entry: string | null;
}

export interface Bootstrap {
  site: {
    name: string;
    tagline: string;
    accent: string;
    logo_url: string;
    version: string;
    maintenance: { enabled: boolean; message: string };
    /** Whether the Django back-office at /django-admin/ is switched on. */
    django_admin: boolean;
    /** Newest available EvE Conduit version; only sent to people who can manage the site. */
    update_available?: string | null;
  };
  setup: { completed: boolean; sso_configured: boolean; callback_url: string; admin_claimed: boolean };
  user: CurrentUser | null;
  plugins: PluginEntry[];
}

export interface MyCharacter extends CharacterBrief {
  is_main: boolean;
  token: { valid: boolean; scopes: string[]; missing_scopes: string[] } | null;
}

export interface MyGroup {
  id: number;
  name: string;
  description: string;
  color: string;
  joinable: boolean;
  member: boolean;
}
