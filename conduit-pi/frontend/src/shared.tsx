// Bits the member's and the officers' pages share: a ticking clock, expiry countdowns and tier labels.
import { Badge, dateTime, duration } from "@conduit/sdk";
import { useEffect, useState } from "react";

import type { Status, TypeInfo } from "./types";

/** The current time, updated every ``intervalMs`` while a component using it is mounted. */
export function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

/** The status the server worked out, moved on by the clock (a page left open keeps counting down). */
export function liveStatus(status: Status, expiry: string | null, now: number): Status {
  if (!expiry || status === "stopped") return status;
  return new Date(expiry).getTime() <= now ? "expired" : status;
}

export function Countdown({ expiry, status, now }: { expiry: string | null; status: Status; now: number }) {
  const s = liveStatus(status, expiry, now);
  if (s === "stopped" || !expiry) return <Badge tone="danger">Not running</Badge>;
  const at = new Date(expiry).getTime();
  if (s === "expired") return <span title={dateTime(expiry)}><Badge tone="danger">Expired {duration(new Date(now).toISOString(), at)} ago</Badge></span>;
  return (
    <span title={dateTime(expiry)}>
      <Badge tone={s === "soon" ? "warning" : "success"}>{duration(expiry, now)} left</Badge>
    </span>
  );
}

const TIER_TONE = ["neutral", "info", "accent", "warning", "success"] as const;

export function Tier({ tier }: { tier: number | null }) {
  if (tier == null) return null;
  return <Badge tone={TIER_TONE[tier] ?? "neutral"}>P{tier}</Badge>;
}

export function TypeName({ type, size = "size-6" }: { type: TypeInfo | null; size?: string }) {
  if (!type) return <span className="text-subtle">—</span>;
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <img src={type.icon} alt="" className={`${size} shrink-0`} />
      <span className="truncate">{type.name}</span>
    </span>
  );
}

export function ccLevel(level: number) {
  return `CC ${level}`;
}
