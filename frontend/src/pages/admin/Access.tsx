import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Globe,
  Loader2,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog, Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/input";
import { EmptyState, PageHeader } from "@/components/ui/page";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/api";
import { BOOTSTRAP_KEY } from "@/lib/bootstrap";
import type { Entity } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface AdminState {
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

export const COLORS = ["#64748b", "#22d3ee", "#38bdf8", "#818cf8", "#a78bfa", "#f472b6", "#f43f5e", "#fb923c", "#fbbf24", "#34d399"];

export function AdminAccess() {
  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="States"
        icon={<ShieldCheck />}
        description="States decide who someone is (member, blue, guest) from their main character. Groups, under Administration → Groups, add roles on top."
      />
      <States />
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

// --- shared bits -------------------------------------------------------------

export function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
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

export function ToggleRow({ title, description, checked, onChange }: { title: ReactNode; description: ReactNode; checked: boolean; onChange: (v: boolean) => void }) {
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

export function PermissionPicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
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
