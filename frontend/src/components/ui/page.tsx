import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  icon,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  /** Optional icon tile shown left of the title. */
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between animate-fade-up", className)}>
      <div className="flex min-w-0 items-start gap-4">
        {icon && (
          <div className="mt-1 hidden size-11 shrink-0 place-items-center border border-border-strong text-accent-ink sm:grid [&_svg]:size-5">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          {eyebrow && <div className="eyebrow mb-1.5">{eyebrow}</div>}
          <h1 className="hud-title text-2xl text-text sm:text-[30px]">{title}</h1>
          {description && <p className="mt-1.5 max-w-2xl text-[15px] leading-relaxed text-muted">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** A heading inside a page, between groups of cards. */
export function SectionTitle({ children, actions, className }: { children: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <div className={cn("mb-3 mt-8 flex items-center justify-between gap-4 first:mt-0", className)}>
      <h2 className="hud-label text-text">{children}</h2>
      {actions}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-14 text-center", className)}>
      <div className="hex mb-5 grid size-14 place-items-center bg-accent-soft text-accent-ink [&_svg]:size-5">{icon}</div>
      <h3 className="hud-label text-text">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  mono = typeof value === "number",
  tone,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  /** Monospaced, tabular digits. Defaults to on for numbers. */
  mono?: boolean;
  /** Colours the icon tile (e.g. "warning" when something needs attention). */
  tone?: "accent" | "success" | "warning" | "danger" | "info";
  className?: string;
}) {
  const toneClass = {
    accent: "text-accent-ink",
    success: "text-success-fg",
    warning: "text-warning-fg",
    danger: "text-danger-fg",
    info: "text-info-fg",
  }[tone ?? "accent"];
  const edge = { accent: "", success: "border-t-success", warning: "border-t-warning", danger: "border-t-danger", info: "border-t-info" }[tone ?? "accent"];
  return (
    <div className={cn("panel panel-quiet border-t-2 p-4", tone && tone !== "accent" ? edge : "border-t-accent", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="hud-label text-subtle">{label}</span>
        {icon && <span className={cn("grid size-7 place-items-center [&_svg]:size-4", tone ? toneClass : "text-subtle")}>{icon}</span>}
      </div>
      <div className={cn("mt-2.5 truncate text-[28px] font-semibold leading-none text-text", mono && "font-mono tabular-nums")}>{value}</div>
      {hint && <div className={cn("mt-2 truncate text-[13px]", tone && tone !== "accent" ? toneClass : "text-muted")}>{hint}</div>}
    </div>
  );
}

/**
 * A KPI with an optional change indicator. `delta` is a number (positive is good unless
 * `invert`), shown with `deltaLabel` (e.g. "30d"). `chart` can hold a small sparkline.
 */
export function KpiTile({
  label,
  value,
  delta,
  deltaFormat = (n) => `${n > 0 ? "+" : ""}${n.toLocaleString("en")}`,
  deltaLabel,
  invert,
  icon,
  chart,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  delta?: number | null;
  deltaFormat?: (n: number) => string;
  deltaLabel?: ReactNode;
  invert?: boolean;
  icon?: ReactNode;
  chart?: ReactNode;
  className?: string;
}) {
  const good = delta == null || delta === 0 ? null : (delta > 0) !== !!invert;
  const Arrow = delta == null || delta === 0 ? Minus : delta > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <div className={cn("panel panel-quiet flex flex-col border-t-2 border-t-accent p-4", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="hud-label text-subtle">{label}</span>
        {icon && <span className="text-subtle [&_svg]:size-4">{icon}</span>}
      </div>
      <div className="mt-2.5 font-mono text-[28px] font-semibold leading-none tabular-nums text-text">{value}</div>
      {delta != null && (
        <div className="mt-1.5 flex items-center gap-1.5 text-xs">
          <span
            className={cn(
              "inline-flex items-center gap-0.5 font-mono font-medium tabular-nums",
              good === null ? "text-muted" : good ? "text-success-fg" : "text-danger-fg",
            )}
          >
            <Arrow className="size-3" />
            {deltaFormat(delta)}
          </span>
          {deltaLabel && <span className="text-muted">{deltaLabel}</span>}
        </div>
      )}
      {chart && <div className="mt-3">{chart}</div>}
    </div>
  );
}

/** Label/value pairs, e.g. on detail pages. */
export function DescriptionList({ items, className }: { items: { label: ReactNode; value: ReactNode }[]; className?: string }) {
  return (
    <dl className={cn("grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-[max-content_1fr]", className)}>
      {items.map((it, i) => (
        <div key={i} className="contents">
          <dt className="hud-label pt-0.5 text-subtle">{it.label}</dt>
          <dd className="min-w-0 text-sm text-text">{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}
