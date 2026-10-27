export const BASE = "/api/p/finance";

export interface Corp {
  id: number;
  name: string;
  ticker: string;
}

export interface MonthOption {
  month: string;
  label: string;
  reported: boolean;
  current: boolean;
}

export interface Months {
  current: string;
  months: MonthOption[];
  corporations: Corp[];
  can_manage: boolean;
}

export interface MonthRow {
  month: string;
  label: string;
  income: number;
  spending: number;
  net: number;
  internal_in: number;
  internal_out: number;
}

export interface CategorySeries {
  category: string;
  income: number[];
  spending: number[];
  total_income: number;
  total_spending: number;
}

export interface CorpNet extends Corp {
  income: number;
  spending: number;
  net: number;
}

export interface Overview {
  corporations: Corp[];
  corporation: number | null;
  current: string;
  months: MonthRow[];
  categories: CategorySeries[];
  this_month: CorpNet[];
}

export interface Summary {
  month: string;
  label: string;
  corporations: CorpNet[];
  net: number;
}

export interface Totals {
  income: number;
  spending: number;
  net: number;
  internal_in: number;
  internal_out: number;
  entries: number;
}

export interface Change {
  amount: number;
  percent: number | null;
}

export interface ReportCategory {
  category: string;
  income: number;
  spending: number;
  net: number;
  entries: number;
  previous_income: number;
  previous_spending: number;
  previous_net: number;
}

export interface Party {
  id: number;
  name: string;
  amount: number;
  entries: number;
  categories: string[];
}

export interface ReportCorp extends CorpNet {
  internal_in: number;
  internal_out: number;
  opening: number | null;
  closing: number | null;
}

export interface Report {
  month: string;
  label: string;
  previous_label: string;
  complete: boolean;
  corporation: number | null;
  corporations: ReportCorp[];
  totals: Totals;
  previous: Totals;
  change: { income: Change; spending: Change; net: Change };
  categories: ReportCategory[];
  top_income: Party[];
  top_spending: Party[];
  generated_at: string;
}

export interface Point {
  date: string;
  value: number;
}

export interface Balances {
  corporation: number;
  corporations: Corp[];
  days: number;
  since: string;
  coverage: string;
  balance: number;
  divisions: { division: number; name: string; balance: number; change: number; series: Point[] }[];
  series: Point[];
}

export interface JournalRow {
  id: string;
  date: string;
  corporation: string;
  ticker: string;
  division: string;
  ref_type: string;
  ref_type_label: string;
  category: string;
  internal: boolean;
  amount: number;
  balance: number | null;
  counterparty: string;
  counterparty_id: number | null;
  reason: string;
  description: string;
}

export interface Journal {
  month: string;
  label: string;
  truncated: boolean;
  limit: number;
  categories: string[];
  rows: JournalRow[];
}

export type Direction = "in" | "out" | "both";

export interface Rule {
  id: number;
  party_id: number;
  party_name: string;
  direction: Direction;
  category: string;
  corporation_id: number | null;
  note: string;
}

export interface RefTypeRow {
  ref_type: string;
  label: string;
  default: string;
  override: string | null;
  seen: boolean;
}

export interface FinanceSettings {
  corporations: number[];
  report_group: number | null;
  available_corporations: Corp[];
  group_options: { id: number; name: string }[];
  categories: string[];
  internal_label: string;
  ref_types: RefTypeRow[];
  rules: Rule[];
}

export interface PartyHit {
  id: number;
  name: string;
  category: string;
}
