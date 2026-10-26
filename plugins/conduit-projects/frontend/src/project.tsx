// One project: what it needs, who's building what, and (for managers) editing it and confirming deliveries.
import {
  api, Avatar, Badge, Button, Card, CardBody, CardHeader, ConfirmDialog, date, dateTime, EmptyState, isk, num, PageHeader,
  Skeleton, toast, useCurrentUser,
} from "@conduit/sdk";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate, useParams } from "react-router";

import { ClaimDialog, ItemAdder, ItemEditor, NoteDialog, ProjectEditor } from "./editor";
import { Check, Factory, Hand, Pencil, Plus, Truck, X } from "./icons";
import { BackLink, ContributionBadge, IndustryHintText, ProjectBadge, ProjectProgress, TypeIcon } from "./shared";
import { BASE, type Contribution, type Item, type Project } from "./types";

type Dialogs =
  | { kind: "edit" }
  | { kind: "add" }
  | { kind: "item"; item: Item }
  | { kind: "claim"; item: Item; current: number }
  | { kind: "deliver"; c: Contribution; item: Item }
  | { kind: "reject"; c: Contribution; item: Item }
  | { kind: "close"; status: "done" | "cancelled" }
  | { kind: "delete" };

export function ProjectPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const me = useCurrentUser();
  const [dialog, setDialog] = useState<Dialogs | null>(null);
  const { data: p, isLoading, error } = useQuery({ queryKey: ["projects", "project", id], queryFn: () => api.get<Project>(`${BASE}/projects/${id}`) });
  const refresh = () => qc.invalidateQueries({ queryKey: ["projects"] });
  const act = (promise: Promise<unknown>, done?: string) =>
    promise.then(() => { if (done) toast.success(done); refresh(); }).catch((e: Error) => toast.error(e.message));

  if (error) return <Card><EmptyState icon={<Factory />} title="No such project" description="It may be for other states or groups, or it was deleted." /></Card>;
  if (isLoading || !p) return <Skeleton className="h-64" />;
  const open = p.status === "open";
  const close = () => setDialog(null);

  return (
    <>
      <BackLink to="/p/projects">Projects</BackLink>
      <PageHeader
        eyebrow="Industry project"
        title={p.name}
        icon={<Factory />}
        description={p.description || undefined}
        actions={
          p.can_manage ? (
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" onClick={() => setDialog({ kind: "edit" })}><Pencil /> Edit</Button>
              {open ? (
                <>
                  <Button variant="secondary" onClick={() => setDialog({ kind: "close", status: "done" })}><Check /> Close as done</Button>
                  <Button variant="ghost" onClick={() => setDialog({ kind: "close", status: "cancelled" })}><X /> Cancel</Button>
                </>
              ) : (
                <Button variant="secondary" onClick={() => act(api.post(`${BASE}/projects/${p.id}/reopen`), "Reopened")}>Reopen</Button>
              )}
            </div>
          ) : undefined
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card>
            <CardBody className="space-y-4">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                <ProjectBadge status={p.status} />
                {p.location && <span><span className="text-muted">Deliver to </span>{p.location}</span>}
                {p.deadline && <span><span className="text-muted">Due </span>{dateTime(p.deadline)}</span>}
                {(p.states.length > 0 || p.groups.length > 0) && (
                  <span className="flex flex-wrap items-center gap-1">
                    <span className="text-muted">For</span>
                    {p.states.map((s) => <Badge key={`s${s.id}`} size="xs" color={s.color}>{s.name}</Badge>)}
                    {p.groups.map((g) => <Badge key={`g${g.id}`} size="xs" tone="neutral">{g.name}</Badge>)}
                  </span>
                )}
              </div>
              <ProjectProgress progress={p.progress} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="What it needs"
              description="Claim what you'll build. When it's delivered, mark it; a manager confirms it."
              actions={p.can_manage && open ? <Button size="sm" variant="primary" onClick={() => setDialog({ kind: "add" })}><Plus /> Add items</Button> : undefined}
            />
            {p.items.length === 0 ? (
              <EmptyState icon={<Factory />} title="Nothing added yet" description={p.can_manage ? "Add the items, one by one or as a pasted list." : undefined} />
            ) : (
              <ul className="divide-y divide-border">
                {p.items.map((item) => {
                  const mine = item.contributions.find((c) => c.user.id === me?.id && c.status !== "confirmed");
                  const done = Math.min(100, Math.round((item.confirmed / item.quantity) * 100));
                  return (
                    <li key={item.id} className="space-y-3 px-card py-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <TypeIcon src={item.icon} name={item.name} />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium">{item.name}</div>
                          <div className="text-xs text-muted">
                            {num(item.confirmed)} of {num(item.quantity)} delivered · {num(item.claimed)} being built · {num(item.free)} free
                            {item.points_per_unit > 0 && <> · {num(item.points_per_unit)} pts/unit</>}
                            {item.isk_per_unit > 0 && <> · {isk(item.isk_per_unit)}/unit</>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {open && !mine && item.free > 0 && (
                            <Button size="sm" variant="primary" onClick={() => setDialog({ kind: "claim", item, current: 0 })}><Hand /> Claim</Button>
                          )}
                          {p.can_manage && open && (
                            <Button size="icon-sm" variant="ghost" aria-label={`Edit ${item.name}`} onClick={() => setDialog({ kind: "item", item })}><Pencil /></Button>
                          )}
                        </div>
                      </div>
                      <div className="h-1.5 bg-surface-3" aria-hidden>
                        <div className="h-full bg-success" style={{ width: `${done}%` }} />
                      </div>
                      {item.contributions.length > 0 && (
                        <ul className="space-y-1.5">
                          {item.contributions.map((c) => (
                            <ContributionLine
                              key={c.id}
                              c={c}
                              mine={c.user.id === me?.id}
                              manager={p.can_manage}
                              open={open}
                              onChange={() => setDialog({ kind: "claim", item, current: c.quantity })}
                              onRelease={() => act(api.post(`${BASE}/contributions/${c.id}/release`), "Claim released")}
                              onDeliver={() => setDialog({ kind: "deliver", c, item })}
                              onConfirm={() => act(api.post(`${BASE}/contributions/${c.id}/confirm`), "Delivery confirmed")}
                              onReject={() => setDialog({ kind: "reject", c, item })}
                            />
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Contributors" />
            {p.contributors.length === 0 ? (
              <CardBody><p className="text-sm text-muted">Nobody yet. Be the first to claim something.</p></CardBody>
            ) : (
              <ul className="divide-y divide-border">
                {p.contributors.map((t) => (
                  <li key={t.user.id} className="flex items-center gap-3 px-card py-2.5 text-sm">
                    <Avatar src={t.user.portrait} name={t.user.name} size="sm" />
                    <span className="min-w-0 flex-1 truncate">{t.user.name}</span>
                    <span className="text-right text-xs text-muted">
                      {num(t.confirmed_units)} delivered
                      {t.open_units > 0 && <span className="block">{num(t.open_units)} in progress</span>}
                      {t.points > 0 && <span className="block text-success-fg">{num(t.points)} pts</span>}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <p className="px-1 text-xs text-subtle">
            Started {date(p.created_at)}{p.created_by ? ` by ${p.created_by}` : ""}.
            {p.items.some((i) => i.points_per_unit > 0) && !p.store_enabled && " Points are paid by the Corp Store plugin, which isn't switched on."}
          </p>
          {p.can_manage && p.contributors.length === 0 && (
            <Button variant="ghost" className="w-full text-danger-fg" onClick={() => setDialog({ kind: "delete" })}>Delete project</Button>
          )}
        </div>
      </div>

      {dialog?.kind === "edit" && <ProjectEditor project={p} onClose={close} />}
      {dialog?.kind === "add" && <ItemAdder project={p} onClose={close} />}
      {dialog?.kind === "item" && <ItemEditor item={dialog.item} project={p} onClose={close} />}
      {dialog?.kind === "claim" && <ClaimDialog item={dialog.item} current={dialog.current} onClose={close} />}
      {dialog?.kind === "deliver" && (
        <NoteDialog
          title={`Delivered ${num(dialog.c.quantity)} × ${dialog.item.name}?`}
          description={p.location ? `It should be at: ${p.location}. A manager checks and confirms it.` : "A manager checks and confirms it."}
          label="Where is it? (optional)"
          placeholder="Corp hangar, 2nd division"
          confirmLabel="Mark delivered"
          onSubmit={(note) => api.post(`${BASE}/contributions/${dialog.c.id}/deliver`, { note })}
          onClose={close}
        />
      )}
      {dialog?.kind === "reject" && (
        <NoteDialog
          title={`Send back ${dialog.c.user.name}'s delivery?`}
          description="It becomes a claim again and they're told why."
          label="Why"
          placeholder="Not in the corp hangar"
          confirmLabel="Send back"
          onSubmit={(note) => api.post(`${BASE}/contributions/${dialog.c.id}/reject`, { note })}
          onClose={close}
        />
      )}
      <ConfirmDialog
        open={dialog?.kind === "close"}
        onOpenChange={(o) => !o && close()}
        title={dialog?.kind === "close" && dialog.status === "done" ? "Close the project as done?" : "Cancel the project?"}
        description={
          dialog?.kind === "close" && dialog.status === "done"
            ? "Contributors are told. Claims that weren't delivered stay as they are."
            : "Nobody can claim anything more. You can reopen it later."
        }
        danger={dialog?.kind === "close" && dialog.status === "cancelled"}
        confirmLabel={dialog?.kind === "close" && dialog.status === "done" ? "Close as done" : "Cancel project"}
        onConfirm={() => (dialog?.kind === "close" ? act(api.post(`${BASE}/projects/${p.id}/close`, { status: dialog.status })) : undefined)}
      />
      <ConfirmDialog
        open={dialog?.kind === "delete"}
        onOpenChange={(o) => !o && close()}
        title="Delete this project?"
        description="Nobody has claimed anything, so nothing is lost but the project itself."
        danger
        confirmLabel="Delete"
        onConfirm={() => api.delete(`${BASE}/projects/${p.id}`).then(() => { refresh(); navigate("/p/projects"); }).catch((e: Error) => toast.error(e.message))}
      />
    </>
  );
}

function ContributionLine({ c, mine, manager, open, onChange, onRelease, onDeliver, onConfirm, onReject }: {
  c: Contribution;
  mine: boolean;
  manager: boolean;
  open: boolean;
  onChange: () => void;
  onRelease: () => void;
  onDeliver: () => void;
  onConfirm: () => void;
  onReject: () => void;
}) {
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1 border border-border bg-surface-2/50 px-2.5 py-1.5 text-sm">
      <Avatar src={c.user.portrait} name={c.user.name} size="xs" />
      <span className="font-medium">{mine ? "You" : c.user.name}</span>
      <span className="font-mono text-xs tabular-nums">{num(c.quantity)}</span>
      <ContributionBadge status={c.status} />
      <IndustryHintText hint={c.industry} />
      {c.note && c.status === "delivered" && <span className="text-xs italic text-muted">“{c.note}”</span>}
      {c.review_note && c.status === "claimed" && <span className="text-xs text-warning-fg">Sent back: {c.review_note}</span>}
      <span className="ml-auto flex flex-wrap gap-1.5">
        {mine && open && c.status === "claimed" && (
          <>
            <Button size="xs" variant="primary" onClick={onDeliver}><Truck /> Delivered</Button>
            <Button size="xs" variant="ghost" onClick={onChange}>Change</Button>
            <Button size="xs" variant="ghost" onClick={onRelease}>Release</Button>
          </>
        )}
        {manager && c.status !== "confirmed" && (
          <Button size="xs" variant="success" onClick={onConfirm}><Check /> Confirm</Button>
        )}
        {manager && c.status === "delivered" && (
          <Button size="xs" variant="ghost" onClick={onReject}>Send back</Button>
        )}
      </span>
    </li>
  );
}
