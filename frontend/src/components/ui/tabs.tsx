import * as TabsPrimitive from "@radix-ui/react-tabs";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Tabs. `variant="underline"` sits on a card edge; `"pills"` floats on the page.
 *
 *   <Tabs value={tab} onValueChange={setTab} items={[{ value: "a", label: "A" }]}>
 *     <TabPanel value="a">…</TabPanel>
 *   </Tabs>
 */
export function Tabs({
  value,
  defaultValue,
  onValueChange,
  items,
  variant = "underline",
  className,
  listClassName,
  children,
}: {
  value?: string;
  defaultValue?: string;
  onValueChange?: (v: string) => void;
  items: { value: string; label: ReactNode; count?: number; icon?: ReactNode; disabled?: boolean }[];
  variant?: "underline" | "pills";
  className?: string;
  listClassName?: string;
  children?: ReactNode;
}) {
  return (
    <TabsPrimitive.Root value={value} defaultValue={defaultValue ?? items[0]?.value} onValueChange={onValueChange} className={className}>
      <TabsPrimitive.List
        className={cn(
          "flex gap-1 overflow-x-auto",
          variant === "underline" ? "border-b border-border px-3" : "w-fit rounded-xl border border-border bg-surface-2 p-1",
          listClassName,
        )}
      >
        {items.map((it) => (
          <TabsPrimitive.Trigger
            key={it.value}
            value={it.value}
            disabled={it.disabled}
            className={cn(
              "relative inline-flex shrink-0 items-center gap-2 whitespace-nowrap text-sm font-medium text-muted outline-none transition-colors hover:text-text focus-visible:ring-2 focus-visible:ring-accent/50 disabled:opacity-40 [&_svg]:size-4",
              variant === "underline"
                ? "px-3 py-2.5 data-[state=active]:text-text data-[state=active]:after:absolute data-[state=active]:after:inset-x-2 data-[state=active]:after:-bottom-px data-[state=active]:after:h-0.5 data-[state=active]:after:rounded-none data-[state=active]:after:bg-accent"
                : "rounded-lg px-3 py-1.5 data-[state=active]:bg-surface-raised data-[state=active]:text-text data-[state=active]:shadow-e1",
            )}
          >
            {it.icon}
            {it.label}
            {it.count != null && (
              <span className="rounded-none bg-hover-strong px-1.5 text-[11px] font-semibold leading-[18px] tabular-nums text-muted">{it.count}</span>
            )}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
      {children}
    </TabsPrimitive.Root>
  );
}

export function TabPanel({ value, className, children }: { value: string; className?: string; children: ReactNode }) {
  return (
    <TabsPrimitive.Content value={value} className={cn("outline-none animate-fade-in", className)}>
      {children}
    </TabsPrimitive.Content>
  );
}

/** A compact segmented control for 2–5 mutually exclusive options (view modes, ranges). */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  size = "md",
  className,
  "aria-label": ariaLabel,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode; icon?: ReactNode }[];
  size?: "sm" | "md";
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className={cn("inline-flex rounded-lg border border-border bg-surface-2 p-0.5", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md font-medium transition-colors [&_svg]:size-3.5",
            size === "sm" ? "h-6 px-2 text-xs" : "h-7 px-3 text-[13px]",
            value === o.value ? "bg-surface-raised text-text shadow-e1 ring-1 ring-border" : "text-muted hover:text-text",
          )}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}
