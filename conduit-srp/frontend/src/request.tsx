// One request: the loss, its fitting, and what reviewers and payers can do with it.
import {
  Alert, api, Avatar, Badge, Button, Card, CardBody, CardHeader, ConfirmDialog, dateTime, DescriptionList, Dialog, EmptyState, Field, Input,
  isk, num, PageHeader, Skeleton, Textarea, timeAgo, toast,
} from "@conduit/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

import { ArrowLeft, Check, Coins, ExternalLink, LifeBuoy, Trash, Undo, X } from "./icons";
import { StatusBadge, SystemText } from "./shared";
import { BASE, type RequestDetail } from "./types";

export function RequestPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const key = ["srp", "request", id];
  const { data, isLoading, error } = useQuery({ queryKey: key, queryFn: () => api.get<RequestDetail>(`${BASE}/requests/${id}`), retry: false });
  const [dialog, setDialog] = useState<"approve" | "reject" | "pay" | "withdraw" | "reopen" | null>(null);

  const done = (d: RequestDetail, msg: string) => {
    qc.setQueryData(key, d);
    qc.invalidateQueries({ queryKey: ["srp", "queue"] });
    qc.invalidateQueries({ queryKey: ["srp", "me"] });
    toast.success(msg);
    setDialog(null);
  };
  const decide = useMutation({
    mutationFn: (body: { decision: string; payout?: number | null; note?: string }) => api.post<RequestDetail>(`${BASE}/requests/${id}/decide`, body),
    onSuccess: (d) => done(d, d.status === "approved" ? "Approved; the pilot has been told" : d.status === "rejected" ? "Rejected; the pilot has been told" : "Back in the queue"),
    onError: (e: Error) => toast.error(e.message),
  });
  const pay = useMutation({
    mutationFn: () => api.post(`${BASE}/paid`, { ids: [Number(id)] }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["srp"] });
      toast.success("Marked paid; the pilot has been told");
      setDialog(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const withdraw = useMutation({
    mutationFn: () => api.delete(`${BASE}/requests/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["srp"] });
      toast.success("Request withdrawn");
      navigate("/p/srp/me");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (error) return <EmptyState icon={<LifeBuoy />} title="This request doesn't exist" description="It may have been withdrawn." action={<Link to="/p/srp"><Button>Back to SRP</Button></Link>} />;
  if (isLoading || !data) return <Skeleton className="h-96" />;

  const decidable = data.can_review && !data.mine;
  return (
    <>
      <PageHeader
        eyebrow={<Link to={data.mine && !data.can_review ? "/p/srp/me" : "/p/srp"} className="inline-flex items-center gap-1 hover:text-text"><ArrowLeft className="size-3" /> Ship replacement</Link>}
        title={<span className="flex flex-wrap items-center gap-3">{data.character.name}'s {data.ship.name} <StatusBadge status={data.status} /></span>}
        description={<>Lost {dateTime(data.time)} in <SystemText system={data.system} /></>}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <a href={data.zkillboard} target="_blank" rel="noreferrer">
              <Button variant="ghost"><ExternalLink /> zKillboard</Button>
            </a>
            {data.mine && data.status === "pending" && <Button variant="danger" onClick={() => setDialog("withdraw")}><Trash /> Withdraw</Button>}
            {decidable && (data.status === "approved" || data.status === "rejected") && <Button variant="ghost" onClick={() => setDialog("reopen")}><Undo /> Reopen</Button>}
            {decidable && data.status !== "paid" && data.status !== "rejected" && <Button variant="danger" onClick={() => setDialog("reject")}><X /> Reject</Button>}
            {decidable && (data.status === "pending" || data.status === "rejected") && <Button variant="success" onClick={() => setDialog("approve")}><Check /> Approve</Button>}
            {data.can_pay && data.status === "approved" && <Button variant="primary" onClick={() => setDialog("pay")}><Coins /> Mark paid</Button>}
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Outcome data={data} />
          <Card>
            <div className="flex flex-col gap-5 p-card sm:flex-row sm:items-center">
              <img src={data.ship.icon.replace("/icon?", "/render?").replace(/size=\d+/, "size=256")} alt="" className="size-28 shrink-0 border border-border bg-bg object-cover" />
              <div className="grid flex-1 gap-4 sm:grid-cols-3">
                <Figure label="Loss value" value={isk(data.value, { full: true })} hint="ship and modules, average prices" />
                <Figure label="Rules suggest" value={isk(data.suggested, { full: true })} hint={ruleText(data)} />
                <Figure label="Payout" value={isk(data.payout, { full: true })} hint={data.status === "paid" ? `paid ${timeAgo(data.paid_at)}` : data.payout ? "approved" : "not decided yet"} strong />
              </div>
            </div>
          </Card>
          <Fitting data={data} />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Request" />
            <CardBody>
              <div className="mb-4 flex items-center gap-3">
                <Avatar src={data.user.portrait} name={data.user.name} />
                <div>
                  <div className="font-medium">{data.user.name}</div>
                  <div className="text-xs text-subtle">sent {timeAgo(data.created_at)}</div>
                </div>
              </div>
              <DescriptionList
                items={[
                  { label: "Pay to", value: data.character.name },
                  { label: "Fleet", value: data.fleet || "—" },
                  { label: "FC", value: data.fc || "—" },
                  { label: "Corporation", value: data.victim_corporation ?? "—" },
                  ...(data.victim_alliance ? [{ label: "Alliance", value: data.victim_alliance }] : []),
                  { label: "Final blow", value: data.final_blow ?? "NPC / structure" },
                  { label: "Attackers", value: num(data.attackers) },
                ]}
              />
              {data.notes && (
                <div className="mt-4 border-l-2 border-accent/50 bg-bg/40 px-3 py-2 text-sm whitespace-pre-line">{data.notes}</div>
              )}
            </CardBody>
          </Card>
          {data.can_review && (
            <Card>
              <CardHeader title="Earlier requests" description="This member's other SRP requests." />
              <CardBody className="flex flex-wrap gap-2">
                <Badge tone="success">{data.history.paid} paid</Badge>
                <Badge tone="accent">{data.history.approved} approved</Badge>
                <Badge tone="danger">{data.history.rejected} rejected</Badge>
                <Badge tone="info">{data.history.pending} pending</Badge>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      {dialog === "approve" && <ApproveDialog data={data} pending={decide.isPending} onClose={() => setDialog(null)} onApprove={(payout, note) => decide.mutate({ decision: "approve", payout, note })} />}
      {dialog === "reject" && <RejectDialog pending={decide.isPending} onClose={() => setDialog(null)} onReject={(note) => decide.mutate({ decision: "reject", note })} />}
      <ConfirmDialog
        open={dialog === "pay"}
        onOpenChange={(o) => !o && setDialog(null)}
        title="Mark this request paid?"
        description={`Send ${isk(data.payout, { full: true })} to ${data.character.name} first; they're told it has been paid.`}
        confirmLabel={<><Coins /> Mark paid</>}
        onConfirm={() => pay.mutateAsync()}
      />
      <ConfirmDialog
        open={dialog === "withdraw"}
        onOpenChange={(o) => !o && setDialog(null)}
        title="Withdraw this request?"
        description="The loss goes back to your list, so you can claim it again later."
        danger
        confirmLabel={<><Trash /> Withdraw</>}
        onConfirm={() => withdraw.mutateAsync()}
      />
      <ConfirmDialog
        open={dialog === "reopen"}
        onOpenChange={(o) => !o && setDialog(null)}
        title="Put this request back in the queue?"
        description="The decision and its note are cleared. The pilot isn't told."
        confirmLabel={<><Undo /> Reopen</>}
        onConfirm={() => decide.mutateAsync({ decision: "reopen" })}
      />
    </>
  );
}

function ruleText(d: RequestDetail) {
  const r = d.rule;
  if (!r) return "default rate";
  if (r.payout != null) return `fixed for ${r.name}`;
  if (r.percent != null) return `${r.percent}% for ${r.name}`;
  return `default rate (${r.name})`;
}

function Figure({ label, value, hint, strong }: { label: string; value: string; hint?: string; strong?: boolean }) {
  return (
    <div>
      <div className="text-xs text-muted">{label}</div>
      <div className={`mt-1 font-mono tabular-nums ${strong ? "text-xl font-semibold text-accent-ink" : "text-lg"}`}>{value}</div>
      {hint && <div className="text-xs text-subtle">{hint}</div>}
    </div>
  );
}

function Outcome({ data }: { data: RequestDetail }) {
  if (data.status === "pending") {
    return <Alert tone="info" title="Waiting for a reviewer">{data.mine ? "You'll get a notification once it's decided." : "Check the fit and the fleet, then approve or reject."}</Alert>;
  }
  if (data.status === "rejected") {
    return (
      <Alert tone="danger" title={`Rejected by ${data.decided_by ?? "a reviewer"} ${timeAgo(data.decided_at)}`}>
        <span className="whitespace-pre-line">{data.decision_note}</span>
      </Alert>
    );
  }
  if (data.status === "approved") {
    return (
      <Alert tone="accent" title={`Approved by ${data.decided_by ?? "a reviewer"}: ${isk(data.payout, { full: true })}`}>
        {data.decision_note ? <span className="whitespace-pre-line">{data.decision_note}</span> : "Waiting to be paid."}
      </Alert>
    );
  }
  return (
    <Alert tone="success" title={`Paid ${isk(data.payout, { full: true })} to ${data.character.name}`}>
      {data.paid_by ? `Marked paid by ${data.paid_by} on ${dateTime(data.paid_at)}.` : `Paid ${dateTime(data.paid_at)}.`}
      {data.decision_note ? <span className="mt-1 block whitespace-pre-line">{data.decision_note}</span> : null}
    </Alert>
  );
}

function Fitting({ data }: { data: RequestDetail }) {
  if (data.fitting.length === 0) {
    return <Card><EmptyState icon={<LifeBuoy />} title="Nothing fitted" description="The killmail lists no modules or cargo." /></Card>;
  }
  return (
    <Card>
      <CardHeader title="Fitting and cargo" description="Red was destroyed, green dropped." />
      <div className="grid gap-px bg-border sm:grid-cols-2">
        {data.fitting.map((slot) => (
          <div key={slot.label} className="bg-surface p-card">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{slot.label}</div>
            <ul className="space-y-1.5">
              {slot.items.map((i, n) => (
                <li key={n} className="flex items-center gap-2.5 text-sm">
                  <img src={i.icon} alt="" className="size-6 shrink-0" loading="lazy" />
                  <span className="min-w-0 flex-1 truncate" title={i.name}>
                    {i.destroyed + i.dropped > 1 && <span className="font-mono text-xs text-muted">{num(i.destroyed + i.dropped)}× </span>}
                    {i.name}
                  </span>
                  <span className={`size-2 shrink-0 rounded-full ${i.dropped ? "bg-success" : "bg-danger"}`} title={i.dropped ? "Dropped" : "Destroyed"} />
                  <span className="w-20 shrink-0 text-right font-mono text-xs tabular-nums text-subtle">{isk(i.value)}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ApproveDialog({ data, pending, onClose, onApprove }: { data: RequestDetail; pending: boolean; onClose: () => void; onApprove: (payout: number, note: string) => void }) {
  const [payout, setPayout] = useState(String(Math.round(data.suggested ?? data.value)));
  const [note, setNote] = useState("");
  const amount = Number(payout);
  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title="Approve SRP"
      description={`For ${data.character.name}'s ${data.ship.name}. The pilot is told the amount.`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="success" disabled={!(amount > 0)} loading={pending} onClick={() => onApprove(amount, note)}><Check /> Approve {amount > 0 ? isk(amount) : ""}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Payout (ISK)" hint={`Rules suggest ${isk(data.suggested, { full: true })}; the loss was worth ${isk(data.value, { full: true })}.`}>
          <Input type="number" min={0} step={1000} value={payout} onChange={(e) => setPayout(e.target.value)} className="w-60 font-mono" autoFocus />
        </Field>
        <Field label="Note to the pilot" hint="Optional.">
          <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Paid at the doctrine rate." />
        </Field>
      </div>
    </Dialog>
  );
}

function RejectDialog({ pending, onClose, onReject }: { pending: boolean; onClose: () => void; onReject: (note: string) => void }) {
  const [note, setNote] = useState("");
  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title="Reject SRP"
      description="The pilot sees the reason."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="solidDanger" disabled={!note.trim()} loading={pending} onClick={() => onReject(note)}><X /> Reject</Button>
        </>
      }
    >
      <Field label="Why" required>
        <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Not a doctrine fit / not on a fleet / lost while ratting…" autoFocus />
      </Field>
    </Dialog>
  );
}
