import { AlertTriangle, Clock, KeyRound, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/page";
import { Tooltip } from "@/components/ui/tooltip";
import { cn, timeAgo } from "@/lib/utils";

import type { EveType, Place, SectionStatus } from "./types";

/** EVE's in-game security colours, from 1.0 (blue) down to null (red). */
const SEC_COLORS = ["#8f2f69", "#d73000", "#f02800", "#f04800", "#f06000", "#d77700", "#effc5f", "#8fef2f", "#00ef47", "#00f0a0", "#2fefef", "#3a9aeb"];

export function secColor(sec: number) {
  return SEC_COLORS[Math.max(0, Math.min(11, Math.round(sec * 10) + 1))]!;
}

export function Security({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("font-mono text-xs font-semibold tabular-nums", className)} style={{ color: secColor(value) }}>
      {value.toFixed(1)}
    </span>
  );
}

export function PlaceLabel({ place, className }: { place: Place | null | undefined; className?: string }) {
  if (!place) return <span className="text-subtle">Unknown location</span>;
  return (
    <span className={cn("inline-flex min-w-0 max-w-full items-center gap-2", className)} title={place.name}>
      {place.system && <Security value={place.system.security} className="shrink-0" />}
      <span className="min-w-0 truncate">{place.name}</span>
      {place.system && place.kind !== "solar_system" && <span className="hidden shrink-0 text-subtle xl:inline">· {place.system.region}</span>}
    </span>
  );
}

export function TypeIcon({ type, size = 32, className }: { type: Pick<EveType, "icon" | "name">; size?: number; className?: string }) {
  return (
    <img
      src={type.icon.replace(/size=\d+/, `size=${size > 32 ? 128 : 64}`)}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      className={cn("shrink-0 rounded-md bg-surface-3 ring-1 ring-border-strong", className)}
      style={{ width: size, height: size }}
    />
  );
}

/** Explains why a section has no data yet (missing scopes, pending, errors). */
export function SectionGate({
  status,
  isMine,
  tokenValid = true,
  children,
}: {
  status: SectionStatus | undefined;
  isMine: boolean;
  tokenValid?: boolean;
  children: ReactNode;
}) {
  if (!status) return <>{children}</>;
  if (!tokenValid && !status.last_success) {
    return (
      <Card>
        <EmptyState
          icon={<KeyRound />}
          title="This character's login has expired"
          description={isMine ? "EVE no longer accepts its saved login, so nothing can update. Log in with it again to resume." : "The owner needs to log in with this character again."}
          action={
            isMine ? (
              <a href="/sso/add-character?next=/characters">
                <Button variant="primary">
                  <KeyRound /> Log in again
                </Button>
              </a>
            ) : undefined
          }
        />
      </Card>
    );
  }
  if (!status.available && tokenValid) {
    return (
      <Card>
        <EmptyState
          icon={<KeyRound />}
          title={`${status.label} needs more access`}
          description={
            isMine
              ? "Re-authorise this character so the site may read this part of its data. You'll approve the exact permissions on EVE's login page."
              : "The owner hasn't granted access to this part of the character's data."
          }
          action={
            isMine ? (
              <a href="/sso/add-character?next=/characters">
                <Button variant="primary">
                  <KeyRound /> Grant access
                </Button>
              </a>
            ) : undefined
          }
        />
      </Card>
    );
  }
  if (!status.last_success) {
    return (
      <Card>
        <EmptyState
          icon={status.result === "error" ? <AlertTriangle /> : <Clock />}
          title={status.result === "error" ? "The last update failed" : "Fetching data from EVE…"}
          description={status.result === "error" ? status.message : "This usually takes a minute or two after a character is added."}
        />
      </Card>
    );
  }
  return <>{children}</>;
}

export function SyncedAt({ status, onRefresh, refreshing }: { status: SectionStatus | undefined; onRefresh?: () => void; refreshing?: boolean }) {
  if (!status) return null;
  return (
    <div className="flex items-center gap-2 text-xs text-subtle">
      {status.result === "error" && (
        <Tooltip content={status.message}>
          <AlertTriangle className="size-3.5 text-warning" />
        </Tooltip>
      )}
      <span>Updated {timeAgo(status.last_success)}</span>
      {onRefresh && (
        <button onClick={onRefresh} disabled={refreshing} className="rounded p-1 hover:bg-hover-strong hover:text-text disabled:opacity-50" aria-label="Refresh now">
          <RefreshCw className={cn("size-3.5", refreshing && "animate-spin")} />
        </button>
      )}
    </div>
  );
}
