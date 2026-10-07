import { CheckCircle2, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";

import type { Check } from "./types";

/** Requirements as a list of ticks and crosses. */
export function Checklist({ items, className }: { items: Check[]; className?: string }) {
  if (!items.length) return null;
  return (
    <ul className={cn("space-y-1.5", className)}>
      {items.map((c, i) => (
        <li key={i} className="flex items-start gap-2 text-sm">
          {c.ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success-fg" /> : <XCircle className="mt-0.5 size-4 shrink-0 text-danger-fg" />}
          <span className={c.ok ? "text-muted" : "text-text"}>{c.text}</span>
        </li>
      ))}
    </ul>
  );
}
