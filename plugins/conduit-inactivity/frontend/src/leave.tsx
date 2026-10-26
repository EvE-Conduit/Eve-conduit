// A member's own leave of absence: post one, see what HR said, cancel it.
import {
  Alert, api, Badge, Button, Card, CardBody, CardHeader, ConfirmDialog, EmptyState, Field, Input, PageHeader, Skeleton, Textarea,
  timeAgo, toast,
} from "@conduit/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router";

import { Calendar, Plus, Users, X } from "./icons";
import { BASE, LEAVE, type Leave, type Me } from "./types";

const KEY = ["inactivity", "me"];

/** "2026-10-26" as a local date, so it never shifts a day with the time zone. */
export function day(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y!, m! - 1, d!).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export function span(lv: { start: string; end: string }) {
  return lv.start === lv.end ? day(lv.start) : `${day(lv.start)} – ${day(lv.end)}`;
}

function todayIso(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function LeaveBadge({ lv }: { lv: Leave }) {
  if (lv.running) return <Badge tone="success">On leave now</Badge>;
  if (lv.status === "approved" && lv.over) return <Badge tone="neutral">Over</Badge>;
  return <Badge tone={LEAVE[lv.status].tone}>{LEAVE[lv.status].label}</Badge>;
}

export function LeavePage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: KEY, queryFn: () => api.get<Me>(`${BASE}/me`) });
  const [start, setStart] = useState(todayIso());
  const [end, setEnd] = useState(todayIso(14));
  const [reason, setReason] = useState("");
  const [cancelling, setCancelling] = useState<Leave | null>(null);
  const refresh = () => qc.invalidateQueries({ queryKey: ["inactivity"] });

  const post = useMutation({
    mutationFn: () => api.post<Leave>(`${BASE}/leave`, { start, end, reason }),
    onSuccess: (lv) => {
      toast.success(lv.status === "pending" ? "Sent. HR will look at it." : "Your leave is posted. Enjoy the break.");
      setReason("");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading || !data) return <Skeleton className="h-64" />;
  const open = data.leaves.filter((lv) => !lv.over && (lv.status === "pending" || lv.status === "approved"));
  const past = data.leaves.filter((lv) => !open.includes(lv));

  return (
    <>
      <PageHeader
        eyebrow="Inactivity"
        title="Leave of absence"
        icon={<Calendar />}
        description={`Going away for a while? Post it here so nobody chases you. Members with no activity for ${data.days} days are otherwise flagged to HR.`}
        actions={data.can_see_list ? <Link to="/p/inactivity/members"><Button variant="ghost"><Users /> Inactive members</Button></Link> : undefined}
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="space-y-6">
          <Card>
            <CardHeader title="Your leave" />
            {open.length === 0 ? (
              <EmptyState icon={<Calendar />} title="No leave posted" description="Your next leave shows up here." />
            ) : (
              <ul className="divide-y divide-border">
                {open.map((lv) => (
                  <li key={lv.id} className="flex flex-wrap items-start justify-between gap-3 px-card py-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 font-medium">{span(lv)} <LeaveBadge lv={lv} /></div>
                      {lv.reason && <p className="mt-1 whitespace-pre-line text-sm text-muted">{lv.reason}</p>}
                      {lv.note && <p className="mt-1 text-sm italic text-muted">“{lv.note}”{lv.decided_by ? ` — ${lv.decided_by}` : ""}</p>}
                    </div>
                    <Button size="sm" variant="ghost" className="text-danger-fg" onClick={() => setCancelling(lv)}><X /> Cancel</Button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          {past.length > 0 && (
            <Card>
              <CardHeader title="Earlier" />
              <ul className="divide-y divide-border">
                {past.map((lv) => (
                  <li key={lv.id} className="flex flex-wrap items-center justify-between gap-3 px-card py-3 text-sm">
                    <span>{span(lv)}{lv.note && <span className="ml-2 italic text-muted">“{lv.note}”</span>}</span>
                    <LeaveBadge lv={lv} />
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
        <Card>
          <CardHeader title="Post a leave" description={data.needs_approval ? "HR approves it; you'll get a notification." : "It counts as soon as you post it."} />
          <CardBody className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="From"><Input type="date" value={start} onChange={(e) => setStart(e.target.value)} /></Field>
              <Field label="Until"><Input type="date" value={end} min={start} onChange={(e) => setEnd(e.target.value)} /></Field>
            </div>
            <Field label="Reason (optional)" hint="HR sees this.">
              <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Moving house, back in two weeks" />
            </Field>
            <p className="text-xs text-subtle">Up to {data.max_leave_days} days at a time.</p>
            <Button variant="primary" loading={post.isPending} disabled={!start || !end} onClick={() => post.mutate()}>
              {!post.isPending && <Plus />} Post leave
            </Button>
            {data.last_active && (
              <Alert tone="info">Your last activity on record: {timeAgo(data.last_active)}.</Alert>
            )}
          </CardBody>
        </Card>
      </div>
      <ConfirmDialog
        open={!!cancelling}
        onOpenChange={(o) => !o && setCancelling(null)}
        title="Cancel this leave?"
        description={cancelling ? span(cancelling) : undefined}
        danger
        confirmLabel="Cancel leave"
        cancelLabel="Keep it"
        onConfirm={() => api.post(`${BASE}/leave/${cancelling!.id}/cancel`).then(refresh)}
      />
    </>
  );
}
