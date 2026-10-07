import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

const TONES = {
  neutral: "text-muted ring-border-strong",
  accent: "text-accent-ink ring-accent/60",
  success: "text-success-fg ring-success/55",
  warning: "text-warning-fg ring-warning/60",
  danger: "text-danger-fg ring-danger/55",
  info: "text-info-fg ring-info/55",
} as const;

export type BadgeTone = keyof typeof TONES;

/**
 * A small label. Pass `tone` for semantic colours, or `color` for any CSS colour (state and group
 * colours); custom colours are mixed so they stay readable in both themes.
 */
export function Badge({
  children,
  color,
  tone,
  className,
  variant = "soft",
  size = "sm",
}: {
  children: ReactNode;
  color?: string;
  tone?: BadgeTone;
  className?: string;
  variant?: "soft" | "outline" | "dot";
  size?: "xs" | "sm";
}) {
  const style = color ? ({ "--badge": color } as CSSProperties) : undefined;
  return (
    <span
      style={style}
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-none font-semibold uppercase tracking-[0.08em] ring-1 ring-inset",
        size === "xs" ? "px-1.5 text-[10.5px] leading-[18px]" : "px-2 py-0.5 text-[11px] leading-5",
        color
          ? variant === "outline"
            ? "ring-[color-mix(in_oklab,var(--badge)_50%,transparent)] text-[color-mix(in_oklab,var(--badge)_70%,var(--text))]"
            : "text-[color-mix(in_oklab,var(--badge)_62%,var(--text))] ring-[color-mix(in_oklab,var(--badge)_60%,transparent)]"
          : TONES[tone ?? "neutral"],
        variant === "outline" && !color && "bg-transparent",
        className,
      )}
    >
      {variant === "dot" && <span className="size-1.5 shrink-0 rotate-45 bg-[var(--badge,currentColor)]" />}
      {children}
    </span>
  );
}

/** A count bubble, e.g. unread notifications. */
export function CountBadge({ count, max = 99, className }: { count: number; max?: number; className?: string }) {
  if (!count) return null;
  return (
    <span className={cn("inline-grid h-[18px] min-w-[18px] place-items-center bg-warning px-1 font-mono text-[10.5px] font-semibold leading-none text-[#05080c] tabular-nums", className)}>
      {count > max ? `${max}+` : count}
    </span>
  );
}
