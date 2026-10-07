import { AlertTriangle, CheckCircle2, Info, Loader2, XCircle } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const TONE = {
  info: { box: "border-info/30 bg-info-soft", icon: "text-info-fg", Icon: Info },
  success: { box: "border-success/30 bg-success-soft", icon: "text-success-fg", Icon: CheckCircle2 },
  warning: { box: "border-warning/35 bg-warning-soft", icon: "text-warning-fg", Icon: AlertTriangle },
  danger: { box: "border-danger/30 bg-danger-soft", icon: "text-danger-fg", Icon: XCircle },
  accent: { box: "border-accent/30 bg-accent-soft", icon: "text-accent-ink", Icon: Info },
} as const;

export type Tone = keyof typeof TONE;

/** A callout box: something the reader should notice. */
export function Alert({
  tone = "info",
  title,
  children,
  icon,
  action,
  className,
}: {
  tone?: Tone;
  title?: ReactNode;
  children?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  const t = TONE[tone];
  return (
    <div role={tone === "danger" || tone === "warning" ? "alert" : "status"} className={cn("flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center", t.box, className)}>
      <div className="flex min-w-0 flex-1 gap-3">
        <span className={cn("mt-0.5 shrink-0 [&_svg]:size-[18px]", t.icon)}>{icon ?? <t.Icon />}</span>
        <div className="min-w-0 text-sm">
          {title && <div className="font-semibold text-text">{title}</div>}
          {children && <div className={cn("text-muted", title && "mt-0.5")}>{children}</div>}
        </div>
      </div>
      {action && <div className="shrink-0 sm:ml-auto">{action}</div>}
    </div>
  );
}
export { Alert as Callout };

export function Spinner({ className, label }: { className?: string; label?: string }) {
  return (
    <span role="status" className={cn("inline-flex items-center gap-2 text-sm text-muted", className)}>
      <Loader2 className="size-4 animate-spin" />
      {label ?? <span className="sr-only">Loading</span>}
    </span>
  );
}

/** A keyboard key. */
export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd className={cn("inline-flex h-5 min-w-5 items-center justify-center rounded border border-border-strong bg-surface-2 px-1.5 font-mono text-[10.5px] font-medium text-muted shadow-[0_1px_0_var(--border-strong)]", className)}>
      {children}
    </kbd>
  );
}

export function Separator({ className, vertical, label }: { className?: string; vertical?: boolean; label?: ReactNode }) {
  if (vertical) return <span role="separator" aria-orientation="vertical" className={cn("mx-1 inline-block h-5 w-px self-center bg-border", className)} />;
  if (label)
    return (
      <div role="separator" className={cn("my-4 flex items-center gap-3 text-xs text-subtle", className)}>
        <span className="h-px flex-1 bg-border" />
        {label}
        <span className="h-px flex-1 bg-border" />
      </div>
    );
  return <hr className={cn("my-4 border-0 border-t border-border", className)} />;
}

/**
 * A progress bar. `value` 0–1. Tones colour it; "auto" goes from danger to success as it fills
 * (or the reverse with `invert`, e.g. fuel used).
 */
export function Progress({
  value,
  tone = "accent",
  size = "md",
  className,
  label,
  invert,
  segments,
}: {
  value: number;
  tone?: "accent" | "success" | "warning" | "danger" | "info" | "auto";
  size?: "xs" | "sm" | "md";
  className?: string;
  label?: string;
  invert?: boolean;
  /** Draw as this many separate blocks (the HUD's segmented bar) instead of one fill. */
  segments?: number;
}) {
  const v = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
  const fill = tone === "auto" ? (invert ? 1 - v : v) : 0;
  const color =
    tone === "auto"
      ? fill < 0.25 ? "bg-danger" : fill < 0.5 ? "bg-warning" : "bg-success"
      : { accent: "bg-accent", success: "bg-success", warning: "bg-warning", danger: "bg-danger", info: "bg-info" }[tone];
  const height = { xs: "h-1", sm: "h-1.5", md: "h-2" }[size];
  if (segments && segments > 1) {
    const on = Math.round(v * segments);
    return (
      <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(v * 100)} className={cn("flex w-full gap-[3px]", className)}>
        {Array.from({ length: segments }, (_, i) => (
          <span key={i} className={cn("flex-1", height, i < on ? color : "bg-surface-3")} />
        ))}
      </div>
    );
  }
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(v * 100)}
      className={cn("w-full overflow-hidden bg-surface-3", height, className)}
    >
      <div className={cn("h-full transition-[width] duration-500", color)} style={{ width: `${v * 100}%` }} />
    </div>
  );
}

/** Labelled meter: name, value text and a bar. */
export function Meter({ label, valueText, value, tone, invert }: { label: ReactNode; valueText: ReactNode; value: number; tone?: "accent" | "success" | "warning" | "danger" | "info" | "auto"; invert?: boolean }) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
        <span className="text-muted">{label}</span>
        <span className="font-mono text-xs tabular-nums text-text">{valueText}</span>
      </div>
      <Progress value={value} tone={tone} invert={invert} size="sm" segments={20} />
    </div>
  );
}

/** Status dot with optional pulse, for live/online states. */
export function StatusDot({ tone = "success", pulse, className }: { tone?: "success" | "warning" | "danger" | "info" | "neutral"; pulse?: boolean; className?: string }) {
  const color = { success: "bg-success", warning: "bg-warning", danger: "bg-danger", info: "bg-info", neutral: "bg-subtle" }[tone];
  return (
    <span className={cn("relative inline-flex size-2 shrink-0", className)}>
      {pulse && <span className={cn("absolute inset-0 animate-ping rounded-full opacity-60", color)} />}
      <span className={cn("relative size-2 rounded-full", color)} />
    </span>
  );
}
