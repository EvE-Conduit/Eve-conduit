export const BASE = "/api/p/wiki";
export const PUBLIC_BASE = "/api/public/p/wiki";
export const HOME = "/p/wiki";
export const PUBLIC_HOME = "/public/p/wiki";

export interface Person {
  id: number;
  name: string;
  portrait: string | null;
}

/** A page in the tree, without its text. */
export interface Node {
  id: number;
  slug: string;
  title: string;
  parent: number | null;
  order: number;
  public: boolean;
  locked: boolean;
  updated_at: string;
  children?: Node[];
}

export interface Page extends Node {
  body: string;
  breadcrumbs: { slug: string; title: string }[];
  children: Node[];
  created_at: string;
  created_by?: Person | null;
  updated_by?: Person | null;
  revisions: number;
  can_edit?: boolean;
  // Only for people who manage the wiki:
  states?: { id: number; name: string; color: string }[];
  groups?: { id: number; name: string }[];
}

export interface Overview {
  tree: Node[];
  count: number;
  home: Page | null;
  recent: Node[];
  can_edit: boolean;
  can_manage: boolean;
}

export interface Revision {
  number: number;
  title: string;
  note: string;
  author: Person | null;
  created_at: string;
  body?: string;
}

export interface History {
  page: { slug: string; title: string };
  revisions: Revision[];
  can_edit: boolean;
}

export interface Audience {
  states: { id: number; name: string; color: string }[];
  groups: { id: number; name: string }[];
}
