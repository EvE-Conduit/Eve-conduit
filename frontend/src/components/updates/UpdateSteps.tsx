import { Check, Loader2 } from "lucide-react";

import type { UpdateProgress } from "@/lib/types";
import { cn } from "@/lib/utils";

const LABEL: Record<UpdateProgress["step"], string> = {
  backup: "Backing up",
  install: "Installing",
  migrate: "Updating the database",
  restart: "Restarting",
};

/** Where the updater has got to, as a row of steps: done, working, still to come. */
export function UpdateSteps({ progress, className }: { progress: UpdateProgress; className?: string }) {
  const current = progress.steps.indexOf(progress.step);
  return (
    <ol className={cn("grid grid-cols-2 gap-2 sm:grid-cols-4", className)} aria-label="Update progress">
      {progress.steps.map((step, i) => {
        const state = i < current ? "done" : i === current ? "active" : "todo";
        return (
          <li
            key={step}
            aria-current={state === "active" ? "step" : undefined}
            className={cn(
              "flex items-center gap-2 border px-3 py-2 text-[13px] transition-colors",
              state === "done" && "border-success/35 bg-success-soft text-success-fg",
              state === "active" && "border-accent/50 bg-accent-soft text-text",
              state === "todo" && "border-border text-subtle",
            )}
          >
            <span className="grid size-5 shrink-0 place-items-center">
              {state === "done" ? <Check className="size-4" /> : state === "active" ? <Loader2 className="size-4 animate-spin text-accent-ink" /> : <span className="font-mono text-[11px]">{i + 1}</span>}
            </span>
            <span className="truncate">{LABEL[step]}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function updateTitle(progress: UpdateProgress) {
  if (progress.kind === "plugins") return "Installing plugins";
  return progress.target ? `Updating to EvE Conduit ${progress.target}` : "Updating EvE Conduit";
}
