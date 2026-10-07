import { Badge, toast, Tooltip, useBootstrap } from "@conduit/sdk";

import { Check, Clock } from "./icons";
import type { FlyStatus } from "./types";

/** Training time like the game shows it: 3d 4h, 5h 12m, 40m. */
export function trainTime(seconds: number | null | undefined): string {
  if (!seconds) return "0m";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.ceil((seconds % 3600) / 60);
  if (d) return `${d}d ${h}h`;
  if (h) return `${h}h ${m}m`;
  return `${m}m`;
}

export function StatusBadge({ status, size = "xs" }: { status: FlyStatus | null | undefined; size?: "xs" | "sm" }) {
  if (!status) return <Badge size={size}>No characters</Badge>;
  switch (status.status) {
    case "ready":
      return <Badge tone="success" size={size}><Check className="size-3" /> Ready</Badge>;
    case "can_fly":
      return (
        <Tooltip content={status.seconds ? `Has the required skills; the recommended ones take ${trainTime(status.seconds)} more` : "Has the required skills"}>
          <span><Badge tone="accent" size={size}>Can fly</Badge></span>
        </Tooltip>
      );
    case "missing":
      return (
        <Badge tone="warning" size={size}>
          <Clock className="size-3" /> {status.missing} skill{status.missing === 1 ? "" : "s"} · {trainTime(status.seconds)}
        </Badge>
      );
    default:
      return <Badge size={size}>Skills not synced</Badge>;
  }
}

export async function copyText(text: string, done: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(done);
  } catch {
    toast.error("Your browser didn't allow copying; select the text and copy it yourself");
  }
}

/** Whether the Skill Plans plugin is switched on (and usable by this user). */
export function useSkillPlans(): boolean {
  return useBootstrap().plugins.some((p) => p.id === "skillplans");
}

export const ROLE_TONE: Record<string, "accent" | "success" | "warning" | "danger" | "info" | "neutral"> = {
  DPS: "danger",
  Logistics: "success",
  Tackle: "warning",
  Ewar: "info",
  Support: "accent",
  Booster: "accent",
  Command: "accent",
  Scout: "neutral",
};

export function RoleBadge({ role }: { role: string }) {
  if (!role) return null;
  return <Badge tone={ROLE_TONE[role] ?? "neutral"} size="xs">{role}</Badge>;
}
