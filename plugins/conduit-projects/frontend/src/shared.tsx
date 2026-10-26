// Pieces used on several pages.
import { Badge, duration, num, Progress } from "@conduit/sdk";
import type { ReactNode } from "react";
import { Link } from "react-router";

import { Back } from "./icons";
import type { ContributionStatus, IndustryHint, Progress as ProgressInfo, ProjectStatus } from "./types";

export function BackLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-text">
      <Back /> {children}
    </Link>
  );
}

const PROJECT: Record<ProjectStatus, { label: string; tone: "accent" | "success" | "neutral" }> = {
  open: { label: "Open", tone: "accent" },
  done: { label: "Done", tone: "success" },
  cancelled: { label: "Cancelled", tone: "neutral" },
};

export function ProjectBadge({ status }: { status: ProjectStatus }) {
  return <Badge tone={PROJECT[status].tone}>{PROJECT[status].label}</Badge>;
}

const CONTRIBUTION: Record<ContributionStatus, { label: string; tone: "info" | "warning" | "success" }> = {
  claimed: { label: "Building", tone: "info" },
  delivered: { label: "Delivered", tone: "warning" },
  confirmed: { label: "Confirmed", tone: "success" },
};

export function ContributionBadge({ status }: { status: ContributionStatus }) {
  return <Badge tone={CONTRIBUTION[status].tone}>{CONTRIBUTION[status].label}</Badge>;
}

/** Confirmed share of the project, with what's claimed behind it. */
export function ProjectProgress({ progress }: { progress: ProgressInfo }) {
  const done = Math.round(progress.done * 100);
  const claimed = Math.round(progress.claimed * 100);
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3 text-xs">
        <span className="text-muted">
          {progress.items_done} of {progress.items} item{progress.items === 1 ? "" : "s"} done
        </span>
        <span className="font-mono tabular-nums">
          {done}% <span className="text-subtle">· {claimed}% claimed</span>
        </span>
      </div>
      <Progress value={done} tone="success" size="sm" />
    </div>
  );
}

/** "3 runs in production, ends in 2d 4h" from the claimant's industry jobs. */
export function IndustryHintText({ hint }: { hint: IndustryHint | null }) {
  if (!hint) return null;
  const parts = [];
  if (hint.runs_in_production) parts.push(`${num(hint.runs_in_production)} run${hint.runs_in_production === 1 ? "" : "s"} in production${hint.ends_at ? `, ends in ${duration(hint.ends_at)}` : ""}`);
  if (hint.runs_ready) parts.push(`${num(hint.runs_ready)} ready to deliver`);
  if (hint.runs_delivered) parts.push(`${num(hint.runs_delivered)} delivered from the job`);
  if (!parts.length) parts.push(`${hint.jobs} job${hint.jobs === 1 ? "" : "s"} started`);
  return <span className="text-xs text-info-fg" title="From industry jobs making this item since the claim. Only a hint: a manager still confirms the delivery.">{parts.join(" · ")}</span>;
}

export function TypeIcon({ src, name }: { src: string; name: string }) {
  return <img src={src} alt="" title={name} className="size-6 shrink-0 bg-surface-2" loading="lazy" />;
}
