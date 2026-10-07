import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Crown,
  DoorOpen,
  EyeOff,
  Inbox,
  KeyRound,
  Layers,
  ListChecks,
  Lock,
  MailQuestion,
  Pencil,
  Plus,
  RefreshCw,
  Settings2,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { ConfirmDialog, Dialog } from "@/components/ui/dialog";
import { Alert } from "@/components/ui/feedback";
import { Field, Input, SearchInput } from "@/components/ui/input";
import { DescriptionList, EmptyState, PageHeader, StatCard } from "@/components/ui/page";
import { Skeleton } from "@/components/ui/skeleton";
import { Segmented, TabPanel, Tabs as UiTabs } from "@/components/ui/tabs";
import { RuleSetEditor } from "@/features/groups/RuleBuilder";
import { JOIN_MODE_LABEL, type AdminGroup, type JoinMode, type LeaveMode } from "@/features/groups/types";
import { UserPicker } from "@/features/groups/UserPicker";
import { api } from "@/lib/api";
import { BOOTSTRAP_KEY } from "@/lib/bootstrap";
import { cn, timeAgo } from "@/lib/utils";
import { Members, RequestQueue } from "@/pages/GroupManage";

import { type AdminState, ColorPicker, PermissionPicker, ToggleRow } from "./Access";

type Filter = "all" | "open" | "request" | "closed" | "smart";

const LEAVE_MODE_LABEL: Record<LeaveMode, string> = { open: "Free to leave", request: "Ask to leave", closed: "Managed" };

/** Administration → Groups: create, edit and delete groups, and look after their members and requests. */
export function AdminGroups() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin", "groups"], queryFn: () => api.get<AdminGroup[]>("/api/admin/groups") });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [tab, setTab] = useState("members");
  const [editing, setEditing] = useState<AdminGroup | "new" | null>(null);
  const [deleting, setDeleting] = useState<AdminGroup | null>(null);

  const groups = data ?? [];
  const needle = q.trim().toLowerCase();
  const shown = groups.filter(
    (g) =>
      (!needle || g.name.toLowerCase().includes(needle) || g.description.toLowerCase().includes(needle)) &&
      (filter === "all" || (filter === "smart" ? g.auto : !g.auto && g.join_mode === filter)),
  );
  const selected = groups.find((g) => g.id === selectedId) ?? shown[0] ?? null;

  const del = useMutation({
    mutationFn: (id: number) => api.delete(`/api/admin/groups/${id}`),
    onSuccess: (_, id) => {
      toast.success("Group deleted");
      if (selectedId === id) setSelectedId(null);
      qc.invalidateQueries({ queryKey: ["admin", "groups"] });
      qc.invalidateQueries({ queryKey: ["groups"] });
      qc.invalidateQueries({ queryKey: BOOTSTRAP_KEY });
    },
    onError: (e) => toast.error(e.message),
  });
  const run = useMutation({
    mutationFn: (id: number) => api.post<{ added: number; removed: number; grace: number }>(`/api/admin/groups/${id}/evaluate`),
    onSuccess: (r) => {
      toast.success(`Rules applied: ${r.added} added, ${r.removed} removed${r.grace ? `, ${r.grace} in grace period` : ""}`);
      qc.invalidateQueries({ queryKey: ["admin", "groups"] });
      qc.invalidateQueries({ queryKey: ["groups"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const pending = groups.reduce((n, g) => n + g.pending_requests, 0);
  const memberships = groups.reduce((n, g) => n + g.member_count, 0);

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Groups"
        icon={<Layers />}
        description="Groups carry roles and permissions on top of someone's state. Create them, choose how people join and leave, pick leaders, and look after members."
        actions={
          <Button variant="primary" onClick={() => setEditing("new")}>
            <Plus /> New group
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}</div>
      ) : !groups.length ? (
        <Card>
          <EmptyState
            icon={<Layers />}
            title="No groups yet"
            description="Create groups like Fleet Commanders, Industry or Leadership. Members can join them, ask to, or be added by leaders; smart groups fill themselves from rules."
            action={
              <Button variant="primary" onClick={() => setEditing("new")}>
                <Plus /> Create the first group
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Groups" value={groups.length} hint={`${groups.filter((g) => g.hidden).length} hidden`} />
            <StatCard label="Memberships" value={memberships} hint="people counted once per group" />
            <StatCard label="Smart groups" value={groups.filter((g) => g.auto).length} hint="filled from rules" />
            <StatCard label="Waiting requests" value={pending} tone={pending ? "warning" : undefined} hint="to join or leave" />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
            <div className="space-y-3">
              <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a group" aria-label="Find a group" />
              <Segmented<Filter>
                value={filter}
                onChange={setFilter}
                size="sm"
                className="w-full"
                options={[
                  { value: "all", label: "All" },
                  { value: "open", label: "Open" },
                  { value: "request", label: "Ask" },
                  { value: "closed", label: "Managed" },
                  { value: "smart", label: "Smart" },
                ]}
              />
              <nav aria-label="Groups" className="space-y-1">
                {shown.length === 0 ? (
                  <p className="px-3 py-6 text-center text-sm text-subtle">No group matches.</p>
                ) : (
                  shown.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setSelectedId(g.id)}
                      aria-current={selected?.id === g.id || undefined}
                      className={cn(
                        "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors",
                        selected?.id === g.id ? "bg-accent-soft text-text" : "text-muted hover:bg-hover hover:text-text",
                      )}
                    >
                      <span className="size-2.5 shrink-0" style={{ background: g.color, boxShadow: `0 0 8px ${g.color}` }} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5 truncate text-sm font-medium">
                          {g.name}
                          {g.auto && <Sparkles className="size-3 shrink-0 text-accent-ink" aria-label="Smart group" />}
                          {g.hidden && <EyeOff className="size-3 shrink-0 text-subtle" aria-label="Hidden" />}
                        </span>
                        <span className="block truncate text-xs text-subtle">
                          {g.member_count} member{g.member_count === 1 ? "" : "s"} · {g.auto ? "Smart" : JOIN_MODE_LABEL[g.join_mode]}
                        </span>
                      </span>
                      {g.pending_requests > 0 && <Badge tone="warning" size="xs">{g.pending_requests}</Badge>}
                    </button>
                  ))
                )}
              </nav>
            </div>

            {selected && (
              <div className="min-w-0 space-y-5">
                <GroupHeader
                  group={selected}
                  onEdit={() => setEditing(selected)}
                  onDelete={() => setDeleting(selected)}
                  onRun={selected.auto ? () => run.mutate(selected.id) : undefined}
                  running={run.isPending && run.variables === selected.id}
                />
                <UiTabs
                  value={tab}
                  onValueChange={setTab}
                  variant="pills"
                  items={[
                    { value: "members", label: "Members", count: selected.member_count, icon: <Users /> },
                    { value: "requests", label: "Requests", count: selected.pending_requests || undefined, icon: <Inbox /> },
                    { value: "settings", label: "Settings", icon: <Settings2 /> },
                  ]}
                >
                  <TabPanel value="members">
                    <Members key={selected.id} group={selected} />
                  </TabPanel>
                  <TabPanel value="requests">
                    <RequestQueue key={selected.id} groupId={selected.id} />
                  </TabPanel>
                  <TabPanel value="settings">
                    <GroupSummary group={selected} onEdit={() => setEditing(selected)} />
                  </TabPanel>
                </UiTabs>
              </div>
            )}
          </div>
        </div>
      )}

      {editing && (
        <GroupEditor
          group={editing === "new" ? null : editing}
          groups={groups}
          onClose={() => setEditing(null)}
          onSaved={(g) => {
            setSelectedId(g.id);
            setFilter("all");
            setQ("");
          }}
        />
      )}
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        danger
        title={`Delete ${deleting?.name}?`}
        description={`${deleting?.member_count ?? 0} member${deleting?.member_count === 1 ? "" : "s"} lose the group and every permission it gives. Pending requests are dropped. This can't be undone.`}
        confirmLabel={<><Trash2 /> Delete group</>}
        onConfirm={() => deleting && del.mutateAsync(deleting.id)}
      />
    </>
  );
}

function GroupHeader({ group: g, onEdit, onDelete, onRun, running }: { group: AdminGroup; onEdit: () => void; onDelete: () => void; onRun?: () => void; running: boolean }) {
  return (
    <Card className="relative overflow-hidden">
      <span className="absolute inset-y-0 left-0 w-1" style={{ background: g.color }} aria-hidden />
      <div className="flex flex-col gap-4 p-card pl-6 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold">{g.name}</h2>
          {g.description && <p className="mt-0.5 text-sm text-muted">{g.description}</p>}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {g.auto ? (
              <Badge tone="accent">
                <Sparkles className="size-3" /> Smart
              </Badge>
            ) : g.join_mode === "open" ? (
              <Badge tone="success">
                <DoorOpen className="size-3" /> Open
              </Badge>
            ) : g.join_mode === "request" ? (
              <Badge tone="info">
                <MailQuestion className="size-3" /> On request
              </Badge>
            ) : (
              <Badge>
                <Lock className="size-3" /> Managed
              </Badge>
            )}
            {g.hidden && (
              <Badge>
                <EyeOff className="size-3" /> Hidden
              </Badge>
            )}
            {g.permissions.length > 0 && (
              <Badge>
                <KeyRound className="size-3" /> {g.permissions.length} permission{g.permissions.length === 1 ? "" : "s"}
              </Badge>
            )}
            {g.requirements_text.length > 0 && (
              <Badge>
                <ListChecks className="size-3" /> {g.requirements_text.length} requirement{g.requirements_text.length === 1 ? "" : "s"}
              </Badge>
            )}
            {g.allowed_states.map((s) => (
              <Badge key={s.id} color={s.color} variant="outline">
                {s.name}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {onRun && (
            <Button variant="ghost" loading={running} onClick={onRun}>
              {!running && <RefreshCw />} Apply rules
            </Button>
          )}
          <Button onClick={onEdit}>
            <Pencil /> Edit
          </Button>
          <Button variant="danger" size="icon" aria-label={`Delete ${g.name}`} onClick={onDelete}>
            <Trash2 />
          </Button>
        </div>
      </div>
    </Card>
  );
}

function GroupSummary({ group: g, onEdit }: { group: AdminGroup; onEdit: () => void }) {
  const { data: perms } = useQuery({ queryKey: ["admin", "permissions"], queryFn: () => api.get<{ name: string; label: string }[]>("/api/admin/permissions") });
  const label = Object.fromEntries((perms ?? []).map((p) => [p.name, p.label]));
  const none = <span className="text-subtle">None</span>;
  const leaders = [...g.leaders.map((l) => l.name), ...g.leader_groups.map((x) => `everyone in ${x.name}`)];
  return (
    <Card>
      <CardHeader
        title="How this group works"
        actions={
          <Button size="sm" onClick={onEdit}>
            <Pencil /> Edit
          </Button>
        }
      />
      <div className="p-card">
        <DescriptionList
          items={[
            { label: "Joining", value: g.auto ? "Filled by its rules" : JOIN_MODE_LABEL[g.join_mode] },
            { label: "Leaving", value: g.auto ? "Removed by its rules" : LEAVE_MODE_LABEL[g.leave_mode] },
            { label: "Listed", value: g.hidden ? "Hidden from people who aren't members" : "Shown to everyone allowed in" },
            { label: "States", value: g.allowed_states.length ? g.allowed_states.map((s) => s.name).join(", ") : "Any state" },
            { label: "Leaders", value: leaders.length ? leaders.join(", ") : none },
            { label: "Requirements", value: g.requirements_text.length ? <ul className="list-disc space-y-0.5 pl-4">{g.requirements_text.map((t) => <li key={t}>{t}</li>)}</ul> : none },
            ...(g.auto
              ? [
                  { label: "Rules", value: g.rules_text || none },
                  { label: "Applied", value: g.last_evaluated ? timeAgo(g.last_evaluated) : "Not yet" },
                  { label: "Removal", value: g.auto_remove ? (g.grace_hours ? `After ${g.grace_hours} h of not matching` : "As soon as they stop matching") : "Never removed automatically" },
                ]
              : []),
            {
              label: "Permissions",
              value: g.permissions.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {g.permissions.map((p) => (
                    <Badge key={p} size="xs">{label[p] ?? p}</Badge>
                  ))}
                </div>
              ) : (
                none
              ),
            },
          ]}
        />
      </div>
    </Card>
  );
}

const JOIN_OPTIONS: { value: JoinMode; title: string; description: string; icon: ReactNode }[] = [
  { value: "open", title: "Open", description: "Anyone allowed can join straight away.", icon: <DoorOpen /> },
  { value: "request", title: "On request", description: "People ask; a leader approves or declines.", icon: <MailQuestion /> },
  { value: "closed", title: "Managed", description: "Only leaders and admins add members.", icon: <Lock /> },
];

const LEAVE_OPTIONS: { value: LeaveMode; title: string; description: string; icon: ReactNode }[] = [
  { value: "open", title: "Free to leave", description: "Members can leave whenever they like.", icon: <DoorOpen /> },
  { value: "request", title: "Ask to leave", description: "A leader confirms that someone leaves.", icon: <MailQuestion /> },
  { value: "closed", title: "Managed", description: "Only leaders and admins remove members.", icon: <Lock /> },
];

function ModeCards<T extends string>({ value, onChange, options, disabled }: { value: T; onChange: (v: T) => void; options: { value: T; title: string; description: string; icon: ReactNode }[]; disabled?: boolean }) {
  return (
    <div role="radiogroup" className={cn("grid grid-cols-1 gap-2 sm:grid-cols-3", disabled && "pointer-events-none opacity-50")}>
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={cn(
              "flex flex-col gap-1.5 rounded-xl border p-3 text-left transition-colors",
              on ? "border-accent/50 bg-accent-soft" : "border-border bg-surface-2 hover:border-border-strong hover:bg-hover",
            )}
          >
            <span className={cn("flex items-center gap-2 text-sm font-medium [&_svg]:size-4", on ? "text-text" : "text-muted")}>
              <span className={on ? "text-accent-ink" : "text-subtle"}>{o.icon}</span>
              {o.title}
            </span>
            <span className="text-xs text-muted">{o.description}</span>
          </button>
        );
      })}
    </div>
  );
}

export function GroupEditor({ group, groups, onClose, onSaved }: { group: AdminGroup | null; groups: AdminGroup[]; onClose: () => void; onSaved?: (g: AdminGroup) => void }) {
  const qc = useQueryClient();
  const states = useQuery({ queryKey: ["admin", "states"], queryFn: () => api.get<AdminState[]>("/api/admin/states") });
  const [tab, setTab] = useState("general");
  const [form, setForm] = useState({
    name: group?.name ?? "",
    description: group?.description ?? "",
    color: group?.color ?? "#38bdf8",
    join_mode: group?.join_mode ?? ("closed" as JoinMode),
    leave_mode: group?.leave_mode ?? ("open" as LeaveMode),
    hidden: group?.hidden ?? false,
    allowed_states: group?.allowed_states.map((s) => s.id) ?? [],
    permissions: group?.permissions ?? [],
    leaders: group?.leaders ?? [],
    leader_groups: group?.leader_groups.map((g) => g.id) ?? [],
    requirements: group?.requirements ?? {},
    auto: group?.auto ?? false,
    rules: group?.rules ?? {},
    auto_remove: group?.auto_remove ?? true,
    grace_hours: group?.grace_hours ?? 0,
  });
  const set = (patch: Partial<typeof form>) => setForm({ ...form, ...patch });
  const save = useMutation({
    mutationFn: () => {
      const body = { ...form, leaders: form.leaders.map((l) => l.id) };
      return group ? api.put<AdminGroup>(`/api/admin/groups/${group.id}`, body) : api.post<AdminGroup>("/api/admin/groups", body);
    },
    onSuccess: (saved) => {
      toast.success(group ? "Group updated" : "Group created");
      qc.invalidateQueries({ queryKey: ["admin", "groups"] });
      qc.invalidateQueries({ queryKey: ["groups"] });
      onSaved?.(saved);
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });
  const smartNeedsRules = form.auto && !(form.rules.rules?.length);

  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={group ? `Edit ${group.name}` : "New group"}
      size="xl"
      footer={
        <>
          {smartNeedsRules && <span className="mr-auto self-center text-xs text-warning-fg">A smart group needs at least one rule.</span>}
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" loading={save.isPending} disabled={!form.name.trim() || smartNeedsRules} onClick={() => save.mutate()}>
            {group ? "Save changes" : "Create group"}
          </Button>
        </>
      }
    >
      <UiTabs
        value={tab}
        onValueChange={setTab}
        listClassName="-mx-6 -mt-5 mb-5 px-4"
        items={[
          { value: "general", label: "General", icon: <Settings2 /> },
          { value: "joining", label: "Joining", icon: <DoorOpen /> },
          { value: "leaders", label: "Leaders", icon: <Crown />, count: form.leaders.length + form.leader_groups.length || undefined },
          { value: "smart", label: "Smart group", icon: <Sparkles /> },
          { value: "permissions", label: "Permissions", icon: <KeyRound />, count: form.permissions.length || undefined },
        ]}
      >
        <TabPanel value="general" className="space-y-5">
          <Field label="Name" required>
            <Input value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="Fleet Commanders" autoFocus />
          </Field>
          <Field label="Description">
            <Input value={form.description} onChange={(e) => set({ description: e.target.value })} placeholder="What this group is for" />
          </Field>
          <ColorPicker value={form.color} onChange={(color) => set({ color })} />
          <ToggleRow title="Hidden" description="Only members (and leaders) can see this group exists." checked={form.hidden} onChange={(v) => set({ hidden: v })} />
          <div className="space-y-2">
            <span className="text-[13px] font-medium">Allowed states</span>
            <div className="flex flex-wrap gap-1.5">
              {states.data?.map((s) => {
                const on = form.allowed_states.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => set({ allowed_states: on ? form.allowed_states.filter((x) => x !== s.id) : [...form.allowed_states, s.id] })}
                    className={cn("inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors", on ? "border-accent/45 bg-accent-soft text-text" : "border-border text-muted hover:bg-hover hover:text-text")}
                  >
                    <span className="size-1.5 rounded-none" style={{ background: s.color }} />
                    {s.name}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted">None selected means any state. Users who lose an allowed state are removed automatically.</p>
          </div>
        </TabPanel>

        <TabPanel value="joining" className="space-y-6">
          {form.auto && (
            <Alert tone="accent" title="This is a smart group">
              Its rules decide who is in it, so nobody joins or leaves by hand. Turn it off under Smart group to use these settings.
            </Alert>
          )}
          <div className="space-y-2">
            <span className="text-[13px] font-medium">Joining</span>
            <ModeCards value={form.join_mode} onChange={(join_mode) => set({ join_mode })} options={JOIN_OPTIONS} disabled={form.auto} />
          </div>
          <div className="space-y-2">
            <span className="text-[13px] font-medium">Leaving</span>
            <ModeCards value={form.leave_mode} onChange={(leave_mode) => set({ leave_mode })} options={LEAVE_OPTIONS} disabled={form.auto} />
          </div>
          <div className="space-y-2">
            <div>
              <span className="text-[13px] font-medium">Requirements</span>
              <p className="text-xs text-muted">What someone needs before they can join or ask to. They see a checklist of what they're missing.</p>
            </div>
            <RuleSetEditor
              value={form.requirements}
              onChange={(requirements) => set({ requirements })}
              allowedStates={form.allowed_states}
              preview
              emptyText="No requirements: anyone in an allowed state can join or ask."
            />
          </div>
        </TabPanel>

        <TabPanel value="leaders" className="space-y-6">
          <p className="text-sm text-muted">
            Leaders answer join and leave requests and add or remove members from <span className="font-medium text-text">Manage groups</span>. They can't change the group's settings.
          </p>
          <div className="space-y-2">
            <span className="text-[13px] font-medium">Leaders</span>
            <UserPicker value={form.leaders} onChange={(leaders) => set({ leaders })} />
          </div>
          <div className="space-y-2">
            <span className="text-[13px] font-medium">Leader groups</span>
            <p className="text-xs text-muted">Everyone in these groups leads this one too, e.g. Directors.</p>
            <div className="flex flex-wrap gap-1.5">
              {groups
                .filter((g) => g.id !== group?.id)
                .map((g) => {
                  const on = form.leader_groups.includes(g.id);
                  return (
                    <button
                      key={g.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => set({ leader_groups: on ? form.leader_groups.filter((x) => x !== g.id) : [...form.leader_groups, g.id] })}
                      className={cn("inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors", on ? "border-accent/45 bg-accent-soft text-text" : "border-border text-muted hover:bg-hover hover:text-text")}
                    >
                      <span className="size-1.5 rounded-none" style={{ background: g.color }} />
                      {g.name}
                    </button>
                  );
                })}
              {groups.filter((g) => g.id !== group?.id).length === 0 && <span className="text-xs text-subtle">No other groups yet.</span>}
            </div>
          </div>
        </TabPanel>

        <TabPanel value="smart" className="space-y-5">
          <ToggleRow
            title="Smart group"
            description="Membership is managed entirely by rules, checked every 15 minutes and whenever someone's characters or state change."
            checked={form.auto}
            onChange={(v) => set({ auto: v })}
          />
          {form.auto && (
            <>
              <RuleSetEditor
                value={form.rules}
                onChange={(rules) => set({ rules })}
                allowedStates={form.allowed_states}
                preview
                emptyText="Add a rule to decide who belongs here."
              />
              <ToggleRow
                title="Remove people who stop matching"
                description="Otherwise the group only ever adds members."
                checked={form.auto_remove}
                onChange={(v) => set({ auto_remove: v })}
              />
              {form.auto_remove && (
                <Field label="Grace period (hours)" hint="How long someone may fail the rules before being removed, e.g. while a token is being fixed. 0 removes at once.">
                  <Input type="number" min={0} max={2160} value={form.grace_hours} onChange={(e) => set({ grace_hours: Math.max(0, Number(e.target.value)) })} className="max-w-40" />
                </Field>
              )}
            </>
          )}
        </TabPanel>

        <TabPanel value="permissions">
          <PermissionPicker value={form.permissions} onChange={(permissions) => set({ permissions })} />
        </TabPanel>
      </UiTabs>
    </Dialog>
  );
}
