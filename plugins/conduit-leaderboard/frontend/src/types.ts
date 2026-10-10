export interface Category {
  key: string;
  label: string;
  description: string;
  unit: "count" | "isk" | "sp";
  extra_label: string;
  extra_unit: "count" | "isk" | "sp" | "";
  all_time: boolean;
}

export interface Corporation {
  id: number;
  name: string;
  ticker: string;
}

export interface Periods {
  current: string;
  periods: { key: string; label: string }[];
  corporations: Corporation[];
  categories: Category[];
}

export interface Entry {
  rank: number;
  user_id: number;
  name: string;
  portrait: string;
  corporation: Corporation | null;
  score: number;
  extra: number;
  characters: { id: number; name: string; score: number }[];
}

export interface Board {
  category: Category;
  period: { key: string; label: string };
  places: number;
  participants: number;
  total: number;
  entries: Entry[];
  me: Entry | null;
  hidden: boolean;
}

export interface Overview {
  period: { key: string; label: string };
  corporation: number | null;
  hidden: boolean;
  boards: {
    category: Category;
    participants: number;
    podium: Entry[];
    me: { rank: number; score: number; extra: number } | null;
  }[];
}

export interface MyRanks {
  period: { key: string; label: string };
  hidden: boolean;
  ranks: { category: Category; rank: number | null; score: number; participants: number }[];
  medals: MedalCounts;
}

export interface MedalCounts {
  gold: number;
  silver: number;
  bronze: number;
}

export interface Award {
  id: number;
  month: string;
  label: string;
  category: Category;
  rank: 1 | 2 | 3;
  score: number;
  user_id: number;
  name: string;
  portrait: string;
}

export interface Medals {
  awards: Award[];
  hall_of_fame: ({ user_id: number; name: string; portrait: string } & MedalCounts)[];
  mine: MedalCounts;
}

export interface Settings {
  categories: string[];
  corporations: number[];
  show_characters: boolean;
  places: number;
  medals: boolean;
  available_categories: (Category & { available: boolean })[];
  available_corporations: Corporation[];
}
