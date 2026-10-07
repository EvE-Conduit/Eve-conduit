import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Crown,
  DoorOpen,
  EyeOff,
  Globe,
  KeyRound,
  ListChecks,
  Loader2,
  Lock,
  MailQuestion,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog, Dialog } from "@/components/ui/dialog";
import { Alert } from "@/components/ui/feedback";
import { Field, Input } from "@/components/ui/input";
import { EmptyState, PageHeader } from "@/components/ui/page";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { TabPanel, Tabs as UiTabs } from "@/components/ui/tabs";
import { Tooltip } from "@/components/ui/tooltip";
import { RuleSetEditor } from "@/features/groups/RuleBuilder";
import type { AdminGroup, JoinMode, LeaveMode } from "@/features/groups/types";
import { UserPicker } from "@/features/groups/UserPicker";
import { api } from "@/lib/api";
import { BOOTSTRAP_KEY } from "@/lib/bootstrap";
import type { Entity } from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";

interface AdminState {
  id: number;
  name: string;
  priority: number;
  description: string;
  color: string;
  public: boolean;
  user_count: number;
  member_characters: { id: number; name: string; portrait: string }[];
  member_corporations: Entity[];
  member_alliances: Entity[];
  permissions: string[];
}

interface PermissionOption {
  name: string;
  label: string;
  app: string;
}

const APP_LABELS: Record<string, string> = { site: "Site administration", sheet: "Character sheet access" };

const COLORS = ["#64748b", "#22d3ee", "#38bdf8", "#818cf8", "#a78bfa", "#f472b6", "#f43f5e", "#fb923c", "#fbbf24", "#34d399"];

export function AdminAccess() {
  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Access control"
        description="States decide who someone is (member, blue, guest) from their main character. Groups add roles on top."
      />
      <UiTabs
        defaultValue="states"
        variant="pills"
        listClassName="mb-6"
        items={[
          { value: "states", label: "States", icon: <ShieldCheck /> },
          { value: "groups", label: "Groups", icon: <Users /> },
        ]}
      >
        <TabPanel value="states">
          <States />
        </TabPanel>
        <TabPanel value="groups">
          <Groups />
        </TabPanel>
      </UiTabs>
    </>
  );
}

// --- States ------------------------------------------------------------------

function States() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin", "states"], queryFn: () => api.get<AdminState[]>("/api/admin/states") });
  const [editing, setEditing] = useState<AdminState | "new" | null>(null);
  const [deleting, setDeleting] = useState<AdminState | null>(null);
  const del = useMutation({
    mutationFn: (id: number) => api.delete(`/api/admin/states/${id}`),
    onSuccess: () => {
      toast.success("State deleted");
      qc.invalidateQueries({ queryKey: ["admin", "states"] });
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted">Checked from the top: a user gets the first state their main character matches.</p>
        <Button variant="primary" onClick={() => setEditing("new")}>
          <Plus /> New state
        </Button>
      </div>
      {isLoading ? (
        <Skeleton className="h-40 rounded-xl" />
      ) : !data?.length ? (
        <Card>
          <EmptyState icon={<ShieldCheck />} title="No states" description="Create a Member state for your corporation or alliance." />
        </Card>
      ) : (
        <ol className="space-y-3">
          {data.map((s, i) => (
            <li key={s.id} className="panel flex animate-fade-up flex-col gap-4 rounded-xl p-5 md:flex-row md:items-center" style={{ animationDelay: `${i * 30}ms` }}>
              <div className="flex min-w-0 flex-1 items-start gap-4">
                <div className="grid size-10 shrink-0 place-items-center rounded-xl font-mono text-xs" style={{ background: `color-mix(in oklab, ${s.color} 18%, transparent)`, color: s.color }}>
                  {s.priority}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{s.name}</span>
                    <span className="text-xs text-subtle">
                      {s.user_count} user{s.user_count === 1 ? "" : "s"}
                    </span>
                  </div>
                  {s.description && <p className="mt-0.5 text-sm text-muted">{s.description}</p>}
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {s.public && (
                      <Badge>
                        <Globe className="size-3" /> Everyone
                      </Badge>
                    )}
                    {s.member_alliances.map((a) => (
                      <EntityBadge key={a.id} entity={a} />
                    ))}
                    {s.member_corporations.map((c) => (
                      <EntityBadge key={c.id} entity={c} />
                    ))}
                    {s.member_characters.map((c) => (
                      <Badge key={c.id}>
                        <img src={c.portrait} alt="" className="size-3.5 rounded-sm" /> {c.name}
                      </Badge>
                    ))}
                    {s.permissions.length > 0 && <Badge color={s.color}>{s.permissions.length} permissions</Badge>}
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button size="sm" onClick={() => setEditing(s)}>
                  <Pencil /> Edit
                </Button>
                <Button size="icon" variant="ghost" aria-label={`Delete ${s.name}`} onClick={() => setDeleting(s)}>
                  <Trash2 />
                </Button>
              </div>
            </li>
          ))}
        </ol>
      )}
      {editing && <StateEditor state={editing === "new" ? null : editing} nextPriority={(data?.[0]?.priority ?? 0) + 10} onClose={() => setEditing(null)} />}
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        danger
        title={`Delete the ${deleting?.name} state?`}
        description={`${deleting?.user_count ?? 0} user(s) will fall back to the next state they match, and may lose groups limited to this one.`}
        confirmLabel="Delete state"
        onConfirm={() => deleting && del.mutateAsync(deleting.id)}
      />
    </>
  );
}

function EntityBadge({ entity }: { entity: Entity }) {
  return (
    <Badge>
      <img src={entity.logo} alt="" className="size-3.5 rounded-sm" />
      {entity.name || entity.id}
      {entity.ticker && <span className="font-mono text-subtle">[{entity.ticker}]</span>}
    </Badge>
  );
}

function StateEditor({ state, nextPriority, onClose }: { state: AdminState | null; nextPriority: number; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: state?.name ?? "",
    priority: state?.priority ?? nextPriority,
    description: state?.description ?? "",
    color: state?.color ?? "#22d3ee",
    public: state?.public ?? false,
    permissions: state?.permissions ?? [],
  });
  const [members, setMembers] = useState<{ kind: "alliance" | "corporation" | "character"; id: number; name: string }[]>([
    ...(state?.member_alliances.map((a) => ({ kind: "alliance" as const, id: a.id, name: a.name })) ?? []),
    ...(state?.member_corporations.map((c) => ({ kind: "corporation" as const, id: c.id, name: c.name })) ?? []),
    ...(state?.member_characters.map((c) => ({ kind: "character" as const, id: c.id, name: c.name })) ?? []),
  ]);

  const save = useMutation({
    mutationFn: () => {
      const body = {
        ...form,
        member_alliances: members.filter((m) => m.kind === "alliance").map((m) => m.id),
        member_corporations: members.filter((m) => m.kind === "corporation").map((m) => m.id),
        member_characters: members.filter((m) => m.kind === "character").map((m) => m.id),
      };
      return state ? api.put(`/api/admin/states/${state.id}`, body) : api.post("/api/admin/states", body);
    },
    onSuccess: () => {
      toast.success(state ? "State updated" : "State created");
      qc.invalidateQueries({ queryKey: ["admin", "states"] });
      qc.invalidateQueries({ queryKey: BOOTSTRAP_KEY });
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={state ? `Edit ${state.name}` : "New state"}
      className="max-w-2xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" loading={save.isPending} disabled={!form.name.trim()} onClick={() => save.mutate()}>
            {state ? "Save changes" : "Create state"}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_120px]">
          <Field label="Name">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Member" autoFocus />
          </Field>
          <Field label="Priority" hint="Higher wins">
            <Input type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} />
          </Field>
        </div>
        <Field label="Description">
          <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Full alliance members" />
        </Field>
        <ColorPicker value={form.color} onChange={(color) => setForm({ ...form, color })} />

        <ToggleRow title="Everyone" description="Matches every user. Use this for your Guest fallback." checked={form.public} onChange={(v) => setForm({ ...form, public: v })} />

        {!form.public && (
          <div className="space-y-2">
            <span className="text-[13px] font-medium">Who is in this state</span>
            <EntityPicker
              onPick={(hit) => !members.some((m) => m.id === hit.id) && setMembers([...members, hit])}
            />
            {members.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {members.map((m) => (
                  <span key={m.id} className="inline-flex items-center gap-1.5 rounded-md bg-surface-3 py-1 pl-2 pr-1 text-xs ring-1 ring-border">
                    <span className="text-[10px] uppercase tracking-wide text-subtle">{m.kind.slice(0, 4)}</span>
                    {m.name}
                    <button onClick={() => setMembers(members.filter((x) => x.id !== m.id))} className="rounded p-0.5 text-subtle hover:bg-hover-strong hover:text-text" aria-label={`Remove ${m.name}`}>
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <PermissionPicker value={form.permissions} onChange={(permissions) => setForm({ ...form, permissions })} />
      </div>
    </Dialog>
  );
}

function EntityPicker({ onPick }: { onPick: (hit: { kind: "alliance" | "corporation" | "character"; id: number; name: string }) => void }) {
  const [q, setQ] = useState("");
  const search = useMutation({
    mutationFn: (name: string) => api.get<{ category: "alliance" | "corporation" | "character"; id: number; name: string }[]>(`/api/admin/eve/search?q=${encodeURIComponent(name)}`),
    onError: (e) => toast.error(e.message),
  });
  return (
    <div className="rounded-xl border border-border bg-surface-2 p-3">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (q.trim().length >= 3) search.mutate(q.trim());
        }}
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Exact alliance, corporation or character name" className="pl-9" />
        </div>
        <Button type="submit" disabled={q.trim().length < 3 || search.isPending}>
          {search.isPending ? <Loader2 className="animate-spin" /> : "Look up"}
        </Button>
      </form>
      {search.data && (
        <ul className="mt-2 space-y-1">
          {search.data.length === 0 && <li className="px-2 py-1.5 text-xs text-subtle">No exact match on ESI. Check the spelling.</li>}
          {search.data.map((hit) => (
            <li key={hit.id}>
              <button
                type="button"
                onClick={() => onPick({ kind: hit.category, id: hit.id, name: hit.name })}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-hover"
              >
                <img src={`https://images.evetech.net/${hit.category === "character" ? "characters" : hit.category === "corporation" ? "corporations" : "alliances"}/${hit.id}/${hit.category === "character" ? "portrait" : "logo"}?size=64`} alt="" className="size-6 rounded" />
                <span className="flex-1">{hit.name}</span>
                <Badge>{hit.category}</Badge>
                <Plus className="size-4 text-accent-ink" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-2 text-[11px] text-subtle">Characters only count once they have signed in here.</p>
    </div>
  );
}

// --- Groups ------------------------------------------------------------------

function Groups() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin", "groups"], queryFn: () => api.get<AdminGroup[]>("/api/admin/groups") });
  const [editing, setEditing] = useState<AdminGroup | "new" | null>(null);
  const [deleting, setDeleting] = useState<AdminGroup | null>(null);
  const del = useMutation({
    mutationFn: (id: number) => api.delete(`/api/admin/groups/${id}`),
    onSuccess: () => {
      toast.success("Group deleted");
      qc.invalidateQueries({ queryKey: ["admin", "groups"] });
    },
    onError: (e) => toast.error(e.message),
  });
  const run = useMutation({
    mutationFn: (id: number) => api.post<{ added: number; removed: number; grace: number }>(`/api/admin/groups/${id}/evaluate`),
    onSuccess: (r) => {
      toast.success(`Rules applied: ${r.added} added, ${r.removed} removed${r.grace ? `, ${r.grace} in grace period` : ""}`);
      qc.invalidateQueries({ queryKey: ["admin", "groups"] });
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">Groups carry roles and permissions. Leaders handle requests; smart groups fill themselves from rules.</p>
        <Button variant="primary" onClick={() => setEditing("new")}>
          <Plus /> New group
        </Button>
      </div>
      {isLoading ? (
        <Skeleton className="h-40 rounded-xl" />
      ) : !data?.length ? (
        <Card>
          <EmptyState icon={<Users />} title="No groups yet" description="Create groups like Fleet Commanders, Industry or Leadership." />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {data.map((g) => (
            <div key={g.id} className="panel flex gap-4 rounded-xl p-5">
              <div className="mt-1.5 size-2.5 shrink-0 rounded-none" style={{ background: g.color, boxShadow: `0 0 10px ${g.color}` }} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-medium">{g.name}</span>
                  <span className="text-xs text-muted">{g.member_count} members</span>
                  {g.pending_requests > 0 && <Badge tone="warning" size="xs">{g.pending_requests} pending</Badge>}
                </div>
                {g.description && <p className="mt-0.5 text-sm text-muted">{g.description}</p>}
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {g.auto ? (
                    <Badge tone="accent">
                      <Sparkles className="size-3" /> Smart
                    </Badge>
                  ) : g.join_mode === "open" ? (
                    <Badge tone="success">Open</Badge>
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
                  {g.leaders.length + g.leader_groups.length > 0 && (
                    <Badge>
                      <Crown className="size-3" /> {[...g.leaders.map((l) => l.name), ...g.leader_groups.map((x) => x.name)].join(", ")}
                    </Badge>
                  )}
                  {g.requirements_text.length > 0 && (
                    <Tooltip content={g.requirements_text.join(" · ")}>
                      <span>
                        <Badge>
                          <ListChecks className="size-3" /> {g.requirements_text.length} requirement{g.requirements_text.length === 1 ? "" : "s"}
                        </Badge>
                      </span>
                    </Tooltip>
                  )}
                  {g.allowed_states.map((s) => (
                    <Badge key={s.id} color={s.color} variant="outline">
                      {s.name}
                    </Badge>
                  ))}
                </div>
                {g.auto && g.rules_text && (
                  <p className="mt-2 text-xs text-muted">
                    <span className="font-medium text-text">Rules:</span> {g.rules_text}
                    {g.last_evaluated && <span className="text-subtle"> · applied {timeAgo(g.last_evaluated)}</span>}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 flex-col gap-1">
                <Button size="icon-sm" variant="ghost" aria-label={`Edit ${g.name}`} onClick={() => setEditing(g)}>
                  <Pencil />
                </Button>
                {g.auto && (
                  <Tooltip content="Apply the rules now">
                    <Button size="icon-sm" variant="ghost" aria-label={`Apply the rules of ${g.name} now`} loading={run.isPending && run.variables === g.id} onClick={() => run.mutate(g.id)}>
                      {!(run.isPending && run.variables === g.id) && <RefreshCw />}
                    </Button>
                  </Tooltip>
                )}
                <Button size="icon-sm" variant="ghost" aria-label={`Delete ${g.name}`} onClick={() => setDeleting(g)}>
                  <Trash2 />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      {editing && <GroupEditor group={editing === "new" ? null : editing} groups={data ?? []} onClose={() => setEditing(null)} />}
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        danger
        title={`Delete ${deleting?.name}?`}
        description="Members lose the group and every permission it gives. Pending requests are dropped."
        confirmLabel="Delete group"
        onConfirm={() => deleting && del.mutateAsync(deleting.id)}
      />
    </>
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

function GroupEditor({ group, groups, onClose }: { group: AdminGroup | null; groups: AdminGroup[]; onClose: () => void }) {
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
      return group ? api.put(`/api/admin/groups/${group.id}`, body) : api.post("/api/admin/groups", body);
    },
    onSuccess: () => {
      toast.success(group ? "Group updated" : "Group created");
      qc.invalidateQueries({ queryKey: ["admin", "groups"] });
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

// --- shared bits -------------------------------------------------------------

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="space-y-2">
      <span className="text-[13px] font-medium">Colour</span>
      <div className="flex flex-wrap gap-1.5">
        {COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            className={cn("size-7 rounded-md ring-1 ring-border-strong transition hover:scale-110", value === c && "ring-2 ring-text ring-offset-2 ring-offset-surface-raised")}
            style={{ background: c }}
            aria-label={`Colour ${c}`}
          />
        ))}
      </div>
    </div>
  );
}

function ToggleRow({ title, description, checked, onChange }: { title: ReactNode; description: ReactNode; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-4 rounded-xl border border-border bg-surface-2 px-4 py-3">
      <div className="flex-1">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-muted">{description}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}

function PermissionPicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const { data } = useQuery({ queryKey: ["admin", "permissions"], queryFn: () => api.get<PermissionOption[]>("/api/admin/permissions") });
  const byApp = Object.groupBy(data ?? [], (p) => p.app);
  return (
    <div className="space-y-2">
      <span className="text-[13px] font-medium">Permissions</span>
      <div className="max-h-72 space-y-3 overflow-y-auto rounded-xl border border-border bg-surface-2 p-3">
        {Object.entries(byApp).map(([app, perms]) => (
          <div key={app}>
            <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-subtle">{APP_LABELS[app] ?? app}</div>
            {perms?.map((p) => {
              const on = value.includes(p.name);
              return (
                <label key={p.name} className="flex cursor-pointer items-center gap-3 rounded-md px-1.5 py-1 text-sm hover:bg-hover">
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => onChange(on ? value.filter((v) => v !== p.name) : [...value, p.name])}
                    className="size-4 rounded accent-[var(--site-accent)]"
                  />
                  <span className="flex-1">{p.label}</span>
                  <code className="font-mono text-[10px] text-subtle">{p.name}</code>
                </label>
              );
            })}
          </div>
        ))}
        {!data?.length && <div className="text-xs text-subtle">No permissions available.</div>}
      </div>
    </div>
  );
}
