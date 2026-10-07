import { AlertTriangle, Bell, CheckCircle2, Info, XCircle } from "lucide-react";

import type { AppNotification } from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";

const LEVEL = {
  info: { Icon: Info, cls: "bg-info-soft text-info-fg" },
  success: { Icon: CheckCircle2, cls: "bg-success-soft text-success-fg" },
  warning: { Icon: AlertTriangle, cls: "bg-warning-soft text-warning-fg" },
  danger: { Icon: XCircle, cls: "bg-danger-soft text-danger-fg" },
} as const;

export function LevelIcon({ level, className }: { level: AppNotification["level"]; className?: string }) {
  const l = LEVEL[level] ?? { Icon: Bell, cls: "bg-hover-strong text-muted" };
  return (
    <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg", l.cls, className)}>
      <l.Icon className="size-4" />
    </span>
  );
}

/** One notification row; used in the bell popover and on the notifications page. */
export function NotificationItem({
  n,
  onOpen,
  compact,
  actions,
}: {
  n: AppNotification;
  onOpen?: () => void;
  compact?: boolean;
  actions?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "group relative flex gap-3 rounded-lg px-3 py-3 text-left transition-colors",
        onOpen && "cursor-pointer hover:bg-hover",
        !n.read && "bg-accent-soft/40",
      )}
      onClick={onOpen}
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onKeyDown={(e) => onOpen && (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onOpen())}
    >
      <LevelIcon level={n.level} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <span className={cn("min-w-0 flex-1 text-sm leading-snug", n.read ? "text-muted" : "font-medium text-text")}>{n.title}</span>
          {!n.read && <span className="mt-1.5 size-2 shrink-0 rounded-none bg-accent" aria-label="Unread" />}
        </div>
        {n.body && <p className={cn("mt-0.5 text-[13px] leading-relaxed text-muted", compact && "line-clamp-2")}>{n.body}</p>}
        <div className="mt-1 text-xs text-subtle">{timeAgo(n.created_at)}</div>
      </div>
      {actions && <div className="flex shrink-0 items-start gap-1" onClick={(e) => e.stopPropagation()}>{actions}</div>}
    </div>
  );
}
