import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Crown, Inbox, Search, Sparkles, UserMinus, UserPlus, Users, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Navigate } from "react-router";
import { toast } from "sonner";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Alert, Spinner } from "@/components/ui/feedback";
import { Input, SearchInput, Textarea } from "@/components/ui/input";
import { EmptyState, PageHeader } from "@/components/ui/page";
import { Skeleton } from "@/components/ui/skeleton";
import { TabPanel, Tabs } from "@/components/ui/tabs";
import { Tooltip } from "@/components/ui/tooltip";
import { Checklist } from "@/features/groups/Checklist";
import { JOIN_MODE_LABEL, type GroupMember, type GroupRequest, type LedGroup } from "@/features/groups/types";
import { api } from "@/lib/api";
import { BOOTSTRAP_KEY } from "@/lib/bootstrap";
import { cn, timeAgo } from "@/lib/utils";

export function GroupManage() {
  const { data: groups, isLoading } = useQuery({ queryKey: ["groups", "led"], queryFn: () => api.get<LedGroup[]>("/api/groups/led") });
  const [selected, setSelected] = useState<number | null>(null);
  const [tab, setTab] = useState("requests");

  if (!isLoading && groups && !groups.length) return <Navigate to="/groups" replace />;
  const group = groups?.find((g) => g.id === selected) ?? null;
  const pendingTotal = groups?.reduce((n, g) => n + g.pending_requests, 0) ?? 0;

  return (
    <>
      <PageHeader
        eyebrow="Groups"
        title="Manage groups"
        icon={<Crown />}
        description="Answer join and leave requests and look after the members of the groups you lead."
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        <nav aria-label="Groups you lead" className="space-y-1">
          <SideItem active={selected === null} onClick={() => setSelected(null)} color={null} label="All groups" count={pendingTotal} hint={`${groups?.length ?? 0} groups`} />
          <div className="my-2 h-px bg-border" />
          {isLoading
            ? [0, 1, 2].map((i) => <Skeleton key={i} className="h-12 rounded-lg" />)
            : groups?.map((g) => (
                <SideItem
                  key={g.id}
                  active={selected === g.id}
                  onClick={() => setSelected(g.id)}
                  color={g.color}
                  label={g.name}
                  count={g.pending_requests}
                  hint={`${g.member_count} members · ${g.auto ? "Smart" : JOIN_MODE_LABEL[g.join_mode]}`}
                />
              ))}
        </nav>

        <div className="min-w-0">
          {group ? (
            <Tabs
              value={tab}
              onValueChange={setTab}
              variant="pills"
              listClassName="mb-5"
              items={[
                { value: "requests", label: "Requests", count: group.pending_requests || undefined, icon: <Inbox /> },
                { value: "members", label: "Members", count: group.member_count, icon: <Users /> },
              ]}
            >
              <TabPanel value="requests">
                <RequestQueue groupId={group.id} />
              </TabPanel>
              <TabPanel value="members">
                <Members group={group} />
              </TabPanel>
            </Tabs>
          ) : (
            <RequestQueue groupId={null} />
          )}
        </div>
      </div>
    </>
  );
}

function SideItem({ active, onClick, color, label, count, hint }: { active: boolean; onClick: () => void; color: string | null; label: string; count: number; hint: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active || undefined}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors",
        active ? "bg-accent-soft text-text" : "text-muted hover:bg-hover hover:text-text",
      )}
    >
      {color ? <span className="size-2.5 shrink-0 rounded-none" style={{ background: color }} /> : <Inbox className="size-4 shrink-0" />}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{label}</span>
        <span className="block truncate text-xs text-subtle">{hint}</span>
      </span>
      {count > 0 && <Badge tone="warning" size="xs">{count}</Badge>}
    </button>
  );
}

function useRefresh() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["groups"] });
    qc.invalidateQueries({ queryKey: ["admin", "groups"] });
    qc.invalidateQueries({ queryKey: ["me", "leadership"] });
    qc.invalidateQueries({ queryKey: BOOTSTRAP_KEY });
  };
}

export function RequestQueue({ groupId }: { groupId: number | null }) {
  const [view, setView] = useState<"pending" | "decided">("pending");
  const { data, isLoading } = useQuery({
    queryKey: ["groups", "requests", view, groupId],
    queryFn: () => api.get<GroupRequest[]>(`/api/groups/requests?status=${view}${groupId ? `&group=${groupId}` : ""}`),
  });
  return (
    <Card>
      <CardHeader
        title={view === "pending" ? "Waiting for an answer" : "Answered"}
        description={view === "pending" ? "Oldest first. The person gets a notification with your answer." : "The latest decisions"}
        actions={
          <div className="flex gap-1">
            <Button size="xs" variant={view === "pending" ? "subtle" : "ghost"} onClick={() => setView("pending")}>
              Pending
            </Button>
            <Button size="xs" variant={view === "decided" ? "subtle" : "ghost"} onClick={() => setView("decided")}>
              History
            </Button>
          </div>
        }
      />
      {isLoading ? (
        <div className="space-y-3 p-5">{[0, 1].map((i) => <Skeleton key={i} className="h-24 rounded-lg" />)}</div>
      ) : !data?.length ? (
        <EmptyState
          icon={view === "pending" ? <Check /> : <Inbox />}
          title={view === "pending" ? "All caught up" : "Nothing answered yet"}
          description={view === "pending" ? "No one is waiting for an answer." : undefined}
        />
      ) : (
        <ul className="divide-y divide-border">
          {data.map((r) => (
            <RequestItem key={r.id} request={r} showGroup={groupId === null} />
          ))}
        </ul>
      )}
    </Card>
  );
}

function RequestItem({ request: r, showGroup }: { request: GroupRequest; showGroup: boolean }) {
  const refresh = useRefresh();
  const [response, setResponse] = useState("");
  const [declining, setDeclining] = useState(false);
  const decide = useMutation({
    mutationFn: (approve: boolean) => api.post(`/api/groups/requests/${r.id}/${approve ? "approve" : "reject"}`, { response }),
    onSuccess: (_, approve) => {
      toast.success(approve ? `${r.user.name} ${r.kind === "join" ? "joined" : "left"} ${r.group.name}` : "Request declined");
      refresh();
    },
    onError: (e) => toast.error(e.message),
  });
  const pending = r.status === "pending";
  const missing = r.requirements?.filter((c) => !c.ok).length ?? 0;
  return (
    <li className="p-5">
      <div className="flex flex-col gap-4 sm:flex-row">
        <Avatar src={r.user.main?.portrait} name={r.user.name} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-medium">{r.user.name}</span>
            {r.user.state && (
              <Badge color={r.user.state.color} variant="dot" size="xs">
                {r.user.state.name}
              </Badge>
            )}
            <span className="text-sm text-muted">
              wants to {r.kind}
              {showGroup && (
                <>
                  {" "}
                  <span className="font-medium text-text">{r.group.name}</span>
                </>
              )}
            </span>
            <span className="text-xs text-subtle">{timeAgo(r.created_at)}</span>
          </div>
          {r.user.main?.corporation && (
            <div className="mt-0.5 text-xs text-muted">
              {r.user.main.corporation.name}
              {r.user.main.alliance && ` · ${r.user.main.alliance.name}`}
            </div>
          )}
          {r.message && <blockquote className="mt-2 border-l-2 border-border-strong pl-3 text-sm text-text">{r.message}</blockquote>}
          {!!r.requirements?.length && (
            <div className={cn("mt-3 rounded-lg border p-3", missing ? "border-warning/35 bg-warning-soft" : "border-border bg-surface-2")}>
              <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">{missing ? `${missing} requirement(s) not met` : "Meets every requirement"}</div>
              <Checklist items={r.requirements} />
            </div>
          )}
          {!pending && (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
              <Badge tone={r.status === "approved" ? "success" : r.status === "rejected" ? "danger" : "neutral"} size="xs">
                {r.status}
              </Badge>
              {r.decided_by && <>by {r.decided_by}</>}
              {r.decided_at && <>· {timeAgo(r.decided_at)}</>}
              {r.response && <>· “{r.response}”</>}
            </div>
          )}
          {pending && declining && (
            <div className="mt-3 space-y-2">
              <Textarea value={response} onChange={(e) => setResponse(e.target.value)} placeholder="Why? (optional, shown to them)" rows={2} maxLength={500} autoFocus />
            </div>
          )}
        </div>
        {pending && (
          <div className="flex shrink-0 gap-2 sm:flex-col sm:items-stretch">
            {declining ? (
              <>
                <Button size="sm" variant="solidDanger" loading={decide.isPending && decide.variables === false} onClick={() => decide.mutate(false)}>
                  <X /> Decline
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setDeclining(false)}>
                  Back
                </Button>
              </>
            ) : (
              <>
                <Button size="sm" variant="success" loading={decide.isPending && decide.variables === true} onClick={() => decide.mutate(true)}>
                  <Check /> Approve
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setDeclining(true)}>
                  Decline…
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

export function Members({ group }: { group: LedGroup }) {
  const refresh = useRefresh();
  const [q, setQ] = useState("");
  const [removing, setRemoving] = useState<GroupMember | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["groups", "members", group.id],
    queryFn: () => api.get<{ members: GroupMember[] }>(`/api/groups/${group.id}/members`),
  });
  const remove = useMutation({
    mutationFn: (userId: number) => api.delete(`/api/groups/${group.id}/members/${userId}`),
    onSuccess: () => {
      toast.success(`Removed ${removing?.name}`);
      refresh();
    },
    onError: (e) => toast.error(e.message),
  });
  const members = (data?.members ?? []).filter((m) => !q.trim() || m.name.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <div className="space-y-4">
      {group.auto ? (
        <Alert tone="accent" icon={<Sparkles />} title="Smart group">
          Membership follows the group's rules, so members can't be added or removed by hand.
        </Alert>
      ) : (
        <AddMember groupId={group.id} onAdded={refresh} />
      )}
      <Card>
        <div className="flex items-center gap-3 border-b border-border px-5 py-3">
          <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter members" className="max-w-xs flex-1" aria-label="Filter members" />
          <span className="ml-auto text-xs text-muted">{data?.members.length ?? 0} members</span>
        </div>
        {isLoading ? (
          <div className="space-y-2 p-5">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-10 rounded-lg" />)}</div>
        ) : !members.length ? (
          <EmptyState icon={<Users />} title={q ? "No member matches" : "No members yet"} />
        ) : (
          <ul className="divide-y divide-border">
            {members.map((m) => (
              <li key={m.id} className="flex items-center gap-3 px-5 py-3">
                <Avatar src={m.main?.portrait} name={m.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    {m.name}
                    {m.is_leader && (
                      <Tooltip content="Leads this group">
                        <Crown className="size-3.5 text-warning-fg" />
                      </Tooltip>
                    )}
                  </div>
                  <div className="truncate text-xs text-muted">{m.main?.corporation?.name ?? "No corporation"}</div>
                </div>
                {m.state && (
                  <Badge color={m.state.color} variant="dot" size="xs">
                    {m.state.name}
                  </Badge>
                )}
                {!group.auto && (
                  <Button size="icon-sm" variant="ghost" aria-label={`Remove ${m.name}`} onClick={() => setRemoving(m)}>
                    <UserMinus />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
      <ConfirmDialog
        open={!!removing}
        onOpenChange={(o) => !o && setRemoving(null)}
        danger
        title={`Remove ${removing?.name} from ${group.name}?`}
        description="They get a notification and lose whatever the group gives them."
        confirmLabel="Remove"
        onConfirm={() => removing && remove.mutateAsync(removing.id)}
      />
    </div>
  );
}

function AddMember({ groupId, onAdded }: { groupId: number; onAdded: () => void }) {
  const [q, setQ] = useState("");
  const [dq, setDq] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDq(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);
  const { data, isLoading } = useQuery({
    queryKey: ["groups", "candidates", groupId, dq],
    queryFn: () => api.get<GroupMember[]>(`/api/groups/${groupId}/candidates?q=${encodeURIComponent(dq)}`),
    enabled: dq.length >= 2,
  });
  const add = useMutation({
    mutationFn: (m: GroupMember) => api.post(`/api/groups/${groupId}/members/${m.id}`),
    onSuccess: (_, m) => {
      toast.success(`Added ${m.name}`);
      setQ("");
      onAdded();
    },
    onError: (e) => toast.error(e.message),
  });
  return (
    <Card className="p-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Add a member: search by character name" className="pl-9" aria-label="Add a member" />
      </div>
      {dq.length >= 2 && (
        <div className="mt-2">
          {isLoading ? (
            <Spinner className="px-2 py-1.5" />
          ) : !data?.length ? (
            <p className="px-2 py-1.5 text-xs text-subtle">No one by that name who isn't already a member.</p>
          ) : (
            <ul className="space-y-1">
              {data.map((m) => (
                <li key={m.id} className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-hover">
                  <Avatar src={m.main?.portrait} name={m.name} size="xs" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm">{m.name}</div>
                    {!!m.problems?.length && <div className="truncate text-xs text-warning-fg">{m.problems.join(" · ")}</div>}
                  </div>
                  <Button size="xs" variant={m.problems?.length ? "ghost" : "subtle"} loading={add.isPending && add.variables?.id === m.id} onClick={() => add.mutate(m)}>
                    <UserPlus /> Add
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Card>
  );
}
