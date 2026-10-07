import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Clock, Crown, DoorOpen, Inbox, Lock, MailQuestion, Sparkles, Users } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

import { Badge, CountBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog, Dialog } from "@/components/ui/dialog";
import { Field, SearchInput, Textarea } from "@/components/ui/input";
import { EmptyState, PageHeader } from "@/components/ui/page";
import { Skeleton } from "@/components/ui/skeleton";
import { TabPanel, Tabs } from "@/components/ui/tabs";
import { Tooltip } from "@/components/ui/tooltip";
import { Checklist } from "@/features/groups/Checklist";
import type { GroupRequest, Leadership, MyGroupFull } from "@/features/groups/types";
import { api } from "@/lib/api";
import { BOOTSTRAP_KEY } from "@/lib/bootstrap";
import { cn, timeAgo } from "@/lib/utils";

export const myGroupsQuery = { queryKey: ["me", "groups"], queryFn: () => api.get<MyGroupFull[]>("/api/me/groups") };
export const leadershipQuery = { queryKey: ["me", "leadership"], queryFn: () => api.get<Leadership>("/api/me/leadership") };

export function Groups() {
  const { data, isLoading } = useQuery(myGroupsQuery);
  const { data: requests = [] } = useQuery({ queryKey: ["me", "group-requests"], queryFn: () => api.get<GroupRequest[]>("/api/me/group-requests") });
  const { data: leadership } = useQuery(leadershipQuery);
  const [tab, setTab] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const mine = data?.filter((g) => g.member) ?? [];
  const others = data?.filter((g) => !g.member) ?? [];
  const pending = requests.filter((r) => r.status === "pending").length;
  const current = tab ?? (mine.length ? "mine" : "browse");
  const filter = (list: MyGroupFull[]) =>
    q.trim() ? list.filter((g) => `${g.name} ${g.description}`.toLowerCase().includes(q.trim().toLowerCase())) : list;

  return (
    <>
      <PageHeader
        eyebrow="Account"
        title="Groups"
        icon={<Users />}
        description="Groups give roles and access on top of your membership state. Some are open, some you ask a leader for, and smart groups fill themselves."
        actions={
          leadership?.leads_groups && (
            <Link to="/groups/manage">
              <Button>
                <Crown /> Manage groups
                {leadership.pending_requests > 0 && <CountBadge count={leadership.pending_requests} />}
              </Button>
            </Link>
          )
        }
      />
      <Tabs
        value={current}
        onValueChange={setTab}
        variant="pills"
        listClassName="mb-5"
        items={[
          { value: "mine", label: "My groups", count: mine.length },
          { value: "browse", label: "Browse", count: others.length },
          { value: "requests", label: "Requests", count: pending || undefined, icon: <Inbox /> },
        ]}
      >
        {current !== "requests" && (data?.length ?? 0) > 6 && (
          <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter groups" className="mb-4 max-w-sm" aria-label="Filter groups" />
        )}
        <TabPanel value="mine">
          <GroupGrid
            loading={isLoading}
            groups={filter(mine)}
            empty={<EmptyState icon={<Users />} title="You're not in any groups yet" description="Have a look under Browse for groups you can join." action={<Button onClick={() => setTab("browse")}>Browse groups</Button>} />}
          />
        </TabPanel>
        <TabPanel value="browse">
          <GroupGrid
            loading={isLoading}
            groups={filter(others)}
            empty={<EmptyState icon={<Users />} title="Nothing else to join" description="You're in every group you can see. Leadership may add more later." />}
          />
        </TabPanel>
        <TabPanel value="requests">
          <MyRequests requests={requests} />
        </TabPanel>
      </Tabs>
    </>
  );
}

function GroupGrid({ groups, loading, empty }: { groups: MyGroupFull[]; loading: boolean; empty: React.ReactNode }) {
  if (loading) return <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>;
  if (!groups.length) return <Card>{empty}</Card>;
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {groups.map((g, i) => (
        <GroupCard key={g.id} group={g} index={i} />
      ))}
    </div>
  );
}

function ModeBadge({ group }: { group: MyGroupFull }) {
  if (group.auto)
    return (
      <Tooltip content="Membership is automatic, based on rules set by leadership">
        <span>
          <Badge tone="accent" size="xs">
            <Sparkles className="size-3" /> Smart
          </Badge>
        </span>
      </Tooltip>
    );
  if (group.join_mode === "open") return <Badge tone="success" size="xs">Open</Badge>;
  if (group.join_mode === "request")
    return (
      <Badge tone="info" size="xs">
        <MailQuestion className="size-3" /> On request
      </Badge>
    );
  return (
    <Badge size="xs">
      <Lock className="size-3" /> Managed
    </Badge>
  );
}

function useGroupAction() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["me", "groups"] });
    qc.invalidateQueries({ queryKey: ["me", "group-requests"] });
    qc.invalidateQueries({ queryKey: BOOTSTRAP_KEY });
  };
}

function GroupCard({ group: g, index }: { group: MyGroupFull; index: number }) {
  const refresh = useGroupAction();
  const [asking, setAsking] = useState<"join" | "leave" | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const act = useMutation({
    mutationFn: ({ kind, message }: { kind: "join" | "leave"; message?: string }) =>
      api.post<{ result: string }>(`/api/me/groups/${g.id}/${kind}`, { message: message ?? "" }),
    onSuccess: (r) => {
      toast.success(
        r.result === "joined" ? `Joined ${g.name}` : r.result === "left" ? `Left ${g.name}` : "Request sent. A group leader will get back to you.",
      );
      setAsking(null);
      refresh();
    },
    onError: (e) => toast.error(e.message),
  });
  const cancel = useMutation({
    mutationFn: (id: number) => api.post(`/api/me/group-requests/${id}/cancel`),
    onSuccess: () => {
      toast.success("Request withdrawn");
      refresh();
    },
    onError: (e) => toast.error(e.message),
  });

  const missing = g.requirements.filter((c) => !c.ok);
  let action: React.ReactNode;
  if (g.pending_request) {
    action = (
      <div className="flex flex-col items-end gap-1">
        <Badge tone="warning">
          <Clock className="size-3" /> {g.pending_request.kind === "join" ? "Asked to join" : "Asked to leave"}
        </Badge>
        <Button size="xs" variant="link" loading={cancel.isPending} onClick={() => cancel.mutate(g.pending_request!.id)}>
          Withdraw
        </Button>
      </div>
    );
  } else if (g.auto) {
    action = null;
  } else if (g.member) {
    action =
      g.leave_mode === "closed" ? null : (
        <Button size="sm" variant="ghost" onClick={() => (g.leave_mode === "request" ? setAsking("leave") : setConfirmLeave(true))}>
          {g.leave_mode === "request" ? "Ask to leave" : "Leave"}
        </Button>
      );
  } else if (g.join_mode === "closed") {
    action = (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted">
        <Lock className="size-3.5" /> Leaders add members
      </span>
    );
  } else {
    action = (
      <Tooltip content={!g.eligible ? "You don't meet the requirements yet" : undefined}>
        <span>
          <Button
            size="sm"
            variant="primary"
            disabled={!g.eligible}
            loading={act.isPending}
            onClick={() => (g.join_mode === "request" ? setAsking("join") : act.mutate({ kind: "join" }))}
          >
            {g.join_mode === "request" ? (
              <>
                <MailQuestion /> Ask to join
              </>
            ) : (
              <>
                <DoorOpen /> Join
              </>
            )}
          </Button>
        </span>
      </Tooltip>
    );
  }

  return (
    <div className="panel flex animate-fade-up flex-col rounded-xl p-5" style={{ animationDelay: `${Math.min(index, 12) * 30}ms` }}>
      <div className="flex gap-4">
        <div className="mt-1.5 size-2.5 shrink-0 rounded-none" style={{ background: g.color, boxShadow: `0 0 10px ${g.color}` }} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-medium">{g.name}</span>
            <ModeBadge group={g} />
            {g.leader && (
              <Badge tone="warning" size="xs">
                <Crown className="size-3" /> Leader
              </Badge>
            )}
            {g.member && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-success-fg">
                <Check className="size-3.5" /> Member
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted">{g.description || "No description."}</p>
          <p className="mt-1.5 text-xs text-subtle">
            {g.member_count} member{g.member_count === 1 ? "" : "s"}
          </p>
        </div>
        <div className="shrink-0 self-start">{action}</div>
      </div>
      {!g.member && g.requirements.length > 0 && !g.auto && (
        <div className={cn("mt-4 rounded-lg border p-3", missing.length ? "border-warning/35 bg-warning-soft" : "border-border bg-surface-2")}>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            {missing.length ? `Requirements · ${missing.length} missing` : "Requirements · all met"}
          </div>
          <Checklist items={g.requirements} />
        </div>
      )}
      {asking && (
        <RequestDialog
          group={g}
          kind={asking}
          busy={act.isPending}
          onClose={() => setAsking(null)}
          onSend={(message) => act.mutate({ kind: asking, message })}
        />
      )}
      <ConfirmDialog
        open={confirmLeave}
        onOpenChange={setConfirmLeave}
        title={`Leave ${g.name}?`}
        description={g.join_mode === "open" ? "You can join again whenever you like." : "Getting back in may need a leader's approval."}
        confirmLabel="Leave group"
        onConfirm={() => act.mutateAsync({ kind: "leave" })}
      />
    </div>
  );
}

function RequestDialog({ group, kind, busy, onClose, onSend }: { group: MyGroupFull; kind: "join" | "leave"; busy: boolean; onClose: () => void; onSend: (message: string) => void }) {
  const [message, setMessage] = useState("");
  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={kind === "join" ? `Ask to join ${group.name}` : `Ask to leave ${group.name}`}
      description="A group leader reviews your request. You'll get a notification when they answer."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" loading={busy} onClick={() => onSend(message)}>
            Send request
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Message to the leaders" hint="Optional. Why you'd like to join, what you fly, who can vouch for you…">
          <Textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={500} autoFocus rows={4} />
        </Field>
        {kind === "join" && group.requirements.length > 0 && <Checklist items={group.requirements} />}
      </div>
    </Dialog>
  );
}

const STATUS_TONE = { pending: "warning", approved: "success", rejected: "danger", cancelled: "neutral" } as const;

function MyRequests({ requests }: { requests: GroupRequest[] }) {
  const refresh = useGroupAction();
  const cancel = useMutation({
    mutationFn: (id: number) => api.post(`/api/me/group-requests/${id}/cancel`),
    onSuccess: () => {
      toast.success("Request withdrawn");
      refresh();
    },
    onError: (e) => toast.error(e.message),
  });
  if (!requests.length)
    return (
      <Card>
        <EmptyState icon={<Inbox />} title="No requests" description="When you ask to join or leave a group, you can follow it here." />
      </Card>
    );
  return (
    <Card className="divide-y divide-border">
      {requests.map((r) => (
        <div key={r.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <span className="size-2.5 shrink-0 rounded-none" style={{ background: r.group.color }} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-medium">
                {r.kind === "join" ? "Join" : "Leave"} {r.group.name}
              </span>
              <Badge tone={STATUS_TONE[r.status]} size="xs">
                {r.status}
              </Badge>
              <span className="text-xs text-subtle">{timeAgo(r.created_at)}</span>
            </div>
            {r.message && <p className="mt-1 text-sm text-muted">“{r.message}”</p>}
            {r.decided_by && (
              <p className="mt-1 text-xs text-muted">
                {r.status === "approved" ? "Approved" : "Declined"} by {r.decided_by}
                {r.response && <>: “{r.response}”</>}
              </p>
            )}
          </div>
          {r.status === "pending" && (
            <Button size="sm" variant="ghost" loading={cancel.isPending && cancel.variables === r.id} onClick={() => cancel.mutate(r.id)}>
              Withdraw
            </Button>
          )}
        </div>
      ))}
    </Card>
  );
}
