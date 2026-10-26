export type OrderStatus = "pending" | "fulfilled" | "cancelled";
export type Source = "referral" | "fleet" | "mentor" | "projects" | "manual" | "order" | "refund";

export interface Member {
  id: number;
  name: string;
  portrait: string | null;
}

export interface Item {
  id: number;
  name: string;
  description: string;
  type_id: number | null;
  icon: string | null;
  price: number;
  stock: number | null;
  per_member_limit: number | null;
  active: boolean;
  order: number;
  /** On the manage page. */
  type_name?: string | null;
  /** How many the viewer has ordered, when the item has a limit per member. */
  bought?: number;
}

export interface Entry {
  id: number;
  points: number;
  reason: string;
  source: Source;
  by: string | null;
  created_at: string;
}

export interface Order {
  id: number;
  item: { id: number; name: string; icon: string | null };
  quantity: number;
  points: number;
  status: OrderStatus;
  note: string;
  handled_by: string | null;
  created_at: string;
  handled_at: string | null;
  user?: Member;
}

export type Ranked = Member & { points: number };

export interface StoreInfo {
  balance: number;
  items: Item[];
  leaderboard: { month: Ranked[]; all_time: Ranked[] };
  can_manage: boolean;
  can_fulfil: boolean;
  pending: number | null;
}

export interface History {
  balance: number;
  entries: Entry[];
  orders: Order[];
}

type PluginState = { installed: boolean; enabled: boolean };

export interface StoreSettings {
  referral_points: number;
  fleet_points: number;
  mentor_points: number;
  projects_enabled: boolean;
  sources: Record<"recruit" | "fleets" | "mentors" | "projects", PluginState>;
}

export interface Manage {
  items: Item[];
  settings: StoreSettings;
  awards: (Entry & { user: Member })[];
}

export const STATUS: Record<OrderStatus, { label: string; tone: "info" | "success" | "neutral" }> = {
  pending: { label: "Waiting", tone: "info" },
  fulfilled: { label: "Handed over", tone: "success" },
  cancelled: { label: "Cancelled", tone: "neutral" },
};

export const SOURCES: Record<Source, string> = {
  referral: "Referral",
  fleet: "Fleet",
  mentor: "Mentoring",
  projects: "Industry project",
  manual: "Awarded by hand",
  order: "Order",
  refund: "Refund",
};

export const BASE = "/api/p/store";
