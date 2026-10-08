export const BASE = "/api/p/doctrines";

export type Slot = "hi" | "med" | "low" | "rig" | "sub" | "service";
export type Bay = "drone" | "fighter" | "cargo";
export type Status = "ready" | "can_fly" | "missing" | "unknown";

export interface TypeBrief {
  id: number;
  name: string;
  group: string;
  icon: string;
}

export interface Ship extends TypeBrief {
  render: string;
}

export interface FitBrief {
  id: number;
  name: string;
  role: string;
  ship: Ship;
}

export interface FlyStatus {
  status: Status;
  /** Required skill levels still to train (missing only). */
  missing: number | null;
  /** Training time left: required skills when missing, recommended ones when they can fly. */
  seconds: number | null;
}

export interface DoctrineCard {
  id: number;
  name: string;
  description: string;
  active: boolean;
  render: string | null;
  ships: { id: number; name: string; icon: string }[];
  fits: number;
  flyable: number;
}

export interface LooseFit extends FitBrief {
  value: number;
  /** My best character's status (null without characters). */
  best: FlyStatus | null;
}

export interface Overview {
  doctrines: DoctrineCard[];
  /** Fits that aren't in any doctrine. */
  fits: LooseFit[];
  can_manage: boolean;
  can_see_readiness: boolean;
  roles: string[];
}

export interface DoctrineFitRow extends FitBrief {
  value: number;
  characters: ({ character: { id: number; name: string; portrait: string } } & FlyStatus)[];
  best: FlyStatus | null;
}

export interface DoctrineDetail {
  id: number;
  name: string;
  description: string;
  active: boolean;
  order: number;
  icon_type_id: number | null;
  render: string | null;
  fits: DoctrineFitRow[];
  can_manage: boolean;
}

export interface FitItem {
  slot: Slot | Bay;
  position: number;
  type_id: number;
  charge_id: number | null;
  quantity: number;
  offline: boolean;
}

export interface ViewItem extends FitItem {
  type: TypeBrief;
  charge: TypeBrief | null;
  turret: boolean;
  launcher: boolean;
  category: string;
}

export interface FitView {
  ship: Ship;
  slots: Record<Slot, number> & { turrets: number; launchers: number };
  /** False until the static data has fitting data (slot layout unknown). */
  known: boolean;
  items: ViewItem[];
  hardpoints_used: { turrets: number; launchers: number };
  /** With the fitting skills at V; base_* without skills. */
  resources: { key: string; label: string; used: number; total: number; base_used: number; base_total: number; unit: string }[];
  value: number;
}

export interface SkillStep {
  skill_id: number;
  name: string;
  level: number;
}

export interface MissingStep extends SkillStep {
  status: "queued" | "missing";
  sp: number;
  seconds: number;
  required: boolean;
}

export interface MyCharacterStatus extends FlyStatus {
  id: number;
  name: string;
  portrait: string;
  missing_steps: MissingStep[];
  can_save: boolean;
}

export interface FitDetail extends FitBrief {
  notes: string;
  recommended: SkillStep[];
  required: SkillStep[];
  required_steps: SkillStep[];
  all_steps: SkillStep[];
  eft: string;
  view: FitView;
  characters: MyCharacterStatus[];
  doctrines: { id: number; name: string }[];
  can_manage: boolean;
  items: FitItem[];
  updated_at: string;
  unknown?: string[];
}

export interface ParseResult {
  ship_type_id: number;
  name: string;
  items: FitItem[];
  unknown: string[];
  problems: string[];
  view: FitView;
}

export interface Readiness {
  doctrine: { id: number; name: string };
  fits: FitBrief[];
  members: { id: number; name: string; portrait: string | null; flyable: number; cells: Record<string, (FlyStatus & { character: string | null }) | null> }[];
  totals: Record<string, number>;
}

export interface CharacterDoctrine {
  /** None for the fits that aren't in a doctrine. */
  id: number | null;
  name: string;
  fits: (FitBrief & FlyStatus)[];
}
