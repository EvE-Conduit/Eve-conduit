// Pieces used on several pages.
import { Badge, Button, Dialog, duration, Field, Input, num, toast } from "@conduit/sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useState } from "react";
import { Link } from "react-router";

import { Back } from "./icons";
import type { BlueprintRequest, Job, RequestStatus } from "./types";

export function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["blueprints"] });
}

export function errorToast(e: Error) {
  toast.error(e.message);
}

export function BackLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-text">
      <Back /> {children}
    </Link>
  );
}

const STATUS: Record<RequestStatus, { label: string; tone: "accent" | "info" | "warning" | "success" | "neutral" | "danger" }> = {
  open: { label: "Waiting", tone: "accent" },
  accepted: { label: "Accepted", tone: "info" },
  in_progress: { label: "In progress", tone: "info" },
  delivered: { label: "Delivered", tone: "success" },
  returned: { label: "Returned", tone: "neutral" },
  declined: { label: "Declined", tone: "danger" },
  cancelled: { label: "Cancelled", tone: "neutral" },
};

export function StatusBadge({ r }: { r: BlueprintRequest }) {
  if (r.kind === "loan" && r.status === "delivered") return <Badge tone={r.overdue ? "danger" : "warning"}>{r.overdue ? "Overdue" : "On loan"}</Badge>;
  return <Badge tone={STATUS[r.status].tone}>{STATUS[r.status].label}</Badge>;
}

/** "ME 10 / TE 20", or a dash for a stat that isn't known. */
export function Research({ me, te }: { me: number | null; te: number | null }) {
  if (me === null && te === null) return <span className="text-subtle">—</span>;
  return (
    <span className="font-mono tabular-nums">
      <span className={me === 10 ? "text-success-fg" : undefined}>ME {me ?? "—"}</span>
      <span className="text-subtle"> / </span>
      <span className={te === 20 ? "text-success-fg" : undefined}>TE {te ?? "—"}</span>
    </span>
  );
}

/** What was asked for: "2 × 10 runs, ME 10" or "Borrow for 7 days". */
export function Asked({ r }: { r: BlueprintRequest }) {
  if (r.kind === "loan") return <span>Borrow the original{r.loan_days ? ` for ${r.loan_days} day${r.loan_days === 1 ? "" : "s"}` : ""}</span>;
  const wants = [r.min_me !== null ? `ME ${r.min_me}+` : null, r.min_te !== null ? `TE ${r.min_te}+` : null].filter(Boolean).join(", ");
  return (
    <span>
      <span className="font-mono">{num(r.copies)}</span> × <span className="font-mono">{num(r.runs)}</span> run{r.runs === 1 ? "" : "s"}
      {wants && <span className="text-muted"> · {wants}</span>}
    </span>
  );
}

export function JobText({ job }: { job: Job | null }) {
  if (!job) return null;
  const when = job.status === "active" && job.end_date ? `, ready in ${duration(job.end_date)}` : "";
  return <span className="text-xs text-info-fg">Copy job {job.job_id}: {job.status}{when}</span>;
}

export function BlueprintIcon({ src, name }: { src: string; name: string }) {
  return <img src={src} alt="" title={name} className="size-8 shrink-0 bg-surface-2" loading="lazy" />;
}

/** A short note for the member, then one action. */
export function NoteDialog({ title, description, placeholder, confirmLabel, onSubmit, onClose, children, withNote = true }: {
  title: string;
  description?: string;
  placeholder: string;
  confirmLabel: string;
  onSubmit: (note: string) => Promise<unknown>;
  onClose: () => void;
  children?: ReactNode;
  /** False when the action takes no note. */
  withNote?: boolean;
}) {
  const invalidate = useInvalidate();
  const [note, setNote] = useState("");
  const run = useMutation({
    mutationFn: () => onSubmit(note),
    onSuccess: () => {
      invalidate();
      onClose();
    },
    onError: errorToast,
  });
  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={run.isPending} onClick={() => run.mutate()}>{confirmLabel}</Button>
        </>
      }
    >
      <div className="space-y-4">
        {children}
        {withNote && (
          <Field label="Note for the member" hint="Optional. They see it in the notification.">
            <Input value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} placeholder={placeholder} autoFocus />
          </Field>
        )}
      </div>
    </Dialog>
  );
}
