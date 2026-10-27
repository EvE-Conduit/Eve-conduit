// Library managers: requests waiting on someone, blueprints out on loan, and what's finished.
import { api, Avatar, Badge, Button, Card, date, DiscordPings, EmptyState, Field, Input, PageHeader, Segmented, Select, Skeleton, Table, Td, Th, THead, timeAgo, Tr } from "@conduit/sdk";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { Check, Wrench } from "./icons";
import { Asked, BackLink, BlueprintIcon, JobText, NoteDialog, StatusBadge } from "./shared";
import { BASE, type BlueprintRequest, type JobOption } from "./types";

type Show = "active" | "loans" | "done";
type Action = "accept" | "start" | "deliver" | "decline" | "due";

interface QueueOut {
  requests: BlueprintRequest[];
  counts: { active: number; loans: number; overdue: number };
}

export function QueuePage() {
  const [show, setShow] = useState<Show>("active");
  const [acting, setActing] = useState<{ r: BlueprintRequest; action: Action } | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["blueprints", "queue", show],
    queryFn: () => api.get<QueueOut>(`${BASE}/queue?show=${show}`),
    refetchInterval: 60_000,
  });
  const act = (r: BlueprintRequest, action: Action) => setActing({ r, action });
  return (
    <>
      <BackLink to="/p/blueprints">Library</BackLink>
      <PageHeader eyebrow="Industry" title="Request queue" icon={<Wrench />} description="Accept a request, mark it in progress with the copy job, then deliver it. The member is told at each step." />
      <Segmented<Show>
        className="mb-4"
        value={show}
        onChange={setShow}
        aria-label="Which requests"
        options={[
          { value: "active", label: `Waiting${data?.counts.active ? ` (${data.counts.active})` : ""}` },
          { value: "loans", label: `On loan${data?.counts.loans ? ` (${data.counts.loans}${data.counts.overdue ? `, ${data.counts.overdue} overdue` : ""})` : ""}` },
          { value: "done", label: "Finished" },
        ]}
      />
      <Card>
        {isLoading || !data ? (
          <div className="p-card"><Skeleton className="h-40" /></div>
        ) : data.requests.length === 0 ? (
          <EmptyState icon={<Wrench />} title={show === "loans" ? "Nothing out on loan" : show === "active" ? "Nothing waiting" : "Nothing finished yet"} />
        ) : (
          <Table>
            <THead>
              <tr>
                <Th>Member</Th>
                <Th>Blueprint</Th>
                <Th>Asked for</Th>
                <Th>Status</Th>
                <Th align="right">{show === "loans" ? "Due" : "Asked"}</Th>
                <Th align="right" />
              </tr>
            </THead>
            <tbody>
              {data.requests.map((r) => (
                <Tr key={r.id}>
                  <Td>
                    <div className="flex items-center gap-2">
                      <Avatar src={r.user.portrait} name={r.user.name} size="sm" />
                      <span className="font-medium">{r.user.name}</span>
                    </div>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <BlueprintIcon src={r.icon} name={r.name} />
                      <div>
                        <div>{r.name}</div>
                        {r.project && <div className="text-xs text-muted">For {r.project.name}</div>}
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <Asked r={r} />
                    {r.note && <div className="text-xs italic text-muted">“{r.note}”</div>}
                  </Td>
                  <Td>
                    <StatusBadge r={r} />
                    {r.handled_by && <div className="text-xs text-muted">{r.handled_by.name}</div>}
                    <JobText job={r.job} />
                  </Td>
                  <Td align="right" className="text-xs text-muted">
                    {show === "loans" && r.due_at ? <span className={r.overdue ? "text-danger-fg" : undefined}>{date(r.due_at)}</span> : timeAgo(r.created_at)}
                  </Td>
                  <Td align="right"><Actions r={r} act={act} /></Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
      <DiscordPings plugin="blueprints" className="panel mt-6 p-card" />
      {acting && <ActionDialog r={acting.r} action={acting.action} onClose={() => setActing(null)} />}
    </>
  );
}

function Actions({ r, act }: { r: BlueprintRequest; act: (r: BlueprintRequest, a: Action) => void }) {
  if (r.kind === "loan" && r.status === "delivered") {
    return (
      <div className="flex justify-end gap-1.5">
        <Button size="xs" variant="ghost" onClick={() => act(r, "due")}>Due date</Button>
        <ReturnedButton r={r} />
      </div>
    );
  }
  if (!["open", "accepted", "in_progress"].includes(r.status)) return null;
  return (
    <div className="flex justify-end gap-1.5">
      {r.status === "open" && <Button size="xs" variant="secondary" onClick={() => act(r, "accept")}>Accept</Button>}
      {r.kind === "copy" && <Button size="xs" variant="secondary" onClick={() => act(r, "start")}>{r.status === "in_progress" ? "Copy job" : "In progress"}</Button>}
      <Button size="xs" variant="success" onClick={() => act(r, "deliver")}><Check /> Deliver</Button>
      <Button size="xs" variant="ghost" onClick={() => act(r, "decline")}>Decline</Button>
    </div>
  );
}

function ReturnedButton({ r }: { r: BlueprintRequest }) {
  const [asking, setAsking] = useState(false);
  return (
    <>
      <Button size="xs" variant="success" onClick={() => setAsking(true)}><Check /> Returned</Button>
      {asking && (
        <NoteDialog
          title={`Has ${r.user.name} brought back ${r.name}?`}
          placeholder=""
          withNote={false}
          confirmLabel="It's back"
          onSubmit={() => api.post(`${BASE}/requests/${r.id}/returned`)}
          onClose={() => setAsking(false)}
        />
      )}
    </>
  );
}

function ActionDialog({ r, action, onClose }: { r: BlueprintRequest; action: Action; onClose: () => void }) {
  const [jobId, setJobId] = useState(r.job ? String(r.job.job_id) : "");
  const [due, setDue] = useState(() => {
    const base = r.due_at ? new Date(r.due_at) : new Date(Date.now() + (r.loan_days ?? 7) * 86_400_000);
    return base.toISOString().slice(0, 10);
  });
  const jobs = useQuery({
    queryKey: ["blueprints", "jobs", r.id],
    queryFn: () => api.get<JobOption[]>(`${BASE}/requests/${r.id}/jobs`),
    enabled: action === "start",
  });
  const url = `${BASE}/requests/${r.id}/${action}`;
  const dueAt = `${due}T11:00:00Z`; // downtime, EVE time
  const common = { onClose, placeholder: "" };
  switch (action) {
    case "accept":
      return <NoteDialog {...common} title={`Accept ${r.user.name}'s request?`} placeholder="Copying tonight" confirmLabel="Accept" onSubmit={(note) => api.post(url, { note })} />;
    case "decline":
      return <NoteDialog {...common} title={`Decline ${r.user.name}'s request?`} placeholder="We don't lend capital blueprints" confirmLabel="Decline" onSubmit={(note) => api.post(url, { note })} />;
    case "start":
      return (
        <NoteDialog {...common} title="Copies in progress" description="Link the corporation copying job making them, if it's synced already." placeholder="" confirmLabel="Save"
          onSubmit={(note) => api.post(url, { note, job_id: jobId ? Number(jobId) : 0 })}>
          <Field label="Copy job" hint={jobs.data && jobs.data.length === 0 ? "No corporation copying job of this blueprint since the request (jobs sync every 30 minutes)." : undefined}>
            <Select value={jobId} onChange={(e) => setJobId(e.target.value)}
              options={[{ value: "", label: "No job" }, ...(jobs.data ?? []).map((j) => ({
                value: String(j.job_id),
                label: `${j.corporation} · ${j.installer || "?"} · ${j.runs} run${j.runs === 1 ? "" : "s"} · ${j.status} · ends ${date(j.end_date)}`,
              }))]} />
          </Field>
        </NoteDialog>
      );
    case "deliver":
      return (
        <NoteDialog {...common} title={r.kind === "loan" ? `Hand ${r.name} to ${r.user.name}` : `Deliver to ${r.user.name}`} placeholder="In your hangar at staging" confirmLabel="Delivered"
          onSubmit={(note) => api.post(url, { note, due_at: r.kind === "loan" ? dueAt : null })}>
          {r.kind === "loan" && <Field label="Due back"><Input type="date" value={due} onChange={(e) => setDue(e.target.value)} /></Field>}
        </NoteDialog>
      );
    case "due":
      return (
        <NoteDialog {...common} title={`New due date for ${r.name}`} placeholder="" confirmLabel="Save" withNote={false}
          onSubmit={() => api.post(url, { due_at: dueAt })}>
          <Field label="Due back"><Input type="date" value={due} onChange={(e) => setDue(e.target.value)} /></Field>
          {r.overdue && <Badge tone="danger">Overdue now</Badge>}
        </NoteDialog>
      );
  }
}
