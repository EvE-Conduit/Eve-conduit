import * as Tabs from "@radix-ui/react-tabs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, Ban, BookOpen, Check, Copy, KeyRound, Network, Pencil, Plus, Puzzle, Search, Trash2, TriangleAlert } from "lucide-react";
import { useDeferredValue, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { PagedTable, type Column } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Textarea } from "@/components/ui/input";
import { EmptyState, PageHeader } from "@/components/ui/page";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/api";
import { dateTime, num } from "@/lib/format";
import { cn, timeAgo } from "@/lib/utils";

interface ApiScope {
  scope: string;
  label: string;
  description: string;
  write: boolean;
}

interface ApiArea {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
  available: boolean;
  plugin: string | null;
  base_path: string;
  scopes: ApiScope[];
}

interface ApiKey {
  id: number;
  name: string;
  description: string;
  prefix: string;
  scopes: string[];
  allowed_ips: string[];
  expires_at: string | null;
  created_at: string;
  created_by: string | null;
  last_used_at: string | null;
  last_used_ip: string | null;
  revoked_at: string | null;
  status: "active" | "revoked" | "expired";
  requests_24h: number;
}

interface ApiRequest {
  id: number;
  at: string;
  key: { id: number; name: string; prefix: string } | null;
  method: string;
  path: string;
  query: string;
  status: number;
  duration_ms: number;
  ip: string;
  user_agent: string;
  area: string;
}

const AREAS_KEY = ["admin", "api", "areas"];
const KEYS_KEY = ["admin", "api", "keys"];

const STATUS_COLORS: Record<ApiKey["status"], string> = { active: "var(--success)", revoked: "var(--danger)", expired: "var(--warning)" };

const tabClass =
  "inline-flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm text-muted transition-colors data-[state=active]:bg-surface-3 data-[state=active]:text-text data-[state=active]:shadow";

export function AdminApi() {
  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="API access"
        icon={<KeyRound />}
        description="Let external services such as Discord bots, killboards or recruitment tools read and change data through keys you control. Each API can be switched on and off on its own."
        actions={
          <a href="/api/v1/docs" target="_blank" rel="noreferrer" className={buttonVariants()}>
            <BookOpen /> API reference
          </a>
        }
      />
      <Tabs.Root defaultValue="keys">
        <Tabs.List className="mb-6 inline-flex rounded-xl border border-border bg-surface/70 p-1">
          {[
            { v: "keys", label: "Keys", icon: KeyRound },
            { v: "areas", label: "APIs", icon: Network },
            { v: "requests", label: "Requests", icon: Activity },
          ].map((t) => (
            <Tabs.Trigger key={t.v} value={t.v} className={tabClass}>
              <t.icon className="size-4" /> {t.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        <Tabs.Content value="keys">
          <Keys />
        </Tabs.Content>
        <Tabs.Content value="areas">
          <Areas />
        </Tabs.Content>
        <Tabs.Content value="requests">
          <Requests />
        </Tabs.Content>
      </Tabs.Root>
    </>
  );
}

function useAreas() {
  return useQuery({ queryKey: AREAS_KEY, queryFn: () => api.get<ApiArea[]>("/api/admin/api/areas") });
}

// --- Keys ----------------------------------------------------------------------

function Keys() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: KEYS_KEY, queryFn: () => api.get<ApiKey[]>("/api/admin/api/keys") });
  const [editing, setEditing] = useState<ApiKey | "new" | null>(null);
  const [confirming, setConfirming] = useState<{ key: ApiKey; action: "revoke" | "delete" } | null>(null);
  const [secret, setSecret] = useState<string | null>(null);

  const act = useMutation({
    mutationFn: ({ key, action }: { key: ApiKey; action: "revoke" | "delete" }) =>
      action === "revoke" ? api.post(`/api/admin/api/keys/${key.id}/revoke`) : api.delete(`/api/admin/api/keys/${key.id}`),
    onSuccess: (_, { action }) => {
      toast.success(action === "revoke" ? "Key revoked" : "Key deleted");
      qc.invalidateQueries({ queryKey: KEYS_KEY });
      setConfirming(null);
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="text-sm text-muted">A key can only use the scopes you give it, and only while their API is switched on.</p>
        <Button variant="primary" onClick={() => setEditing("new")}>
          <Plus /> New key
        </Button>
      </div>
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="space-y-2 p-4">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : !data?.length ? (
          <EmptyState
            icon={<KeyRound />}
            title="No API keys yet"
            description="Create a key for each external service, with only the scopes it needs."
            action={
              <Button variant="primary" onClick={() => setEditing("new")}>
                <Plus /> New key
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-subtle">
                  <th className="px-5 py-3 font-medium">Key</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Scopes</th>
                  <th className="px-5 py-3 font-medium">Last used</th>
                  <th className="px-5 py-3 text-right font-medium">Requests 24h</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {data.map((k) => (
                  <tr key={k.id} className="border-b border-border/60 last:border-0 hover:bg-hover">
                    <td className="px-5 py-3">
                      <div className="font-medium">{k.name}</div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-subtle">
                        <span className="font-mono">{k.prefix}…</span>
                        {k.description && <span className="max-w-xs truncate">{k.description}</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <Badge color={STATUS_COLORS[k.status]} variant="dot">
                        {k.status}
                      </Badge>
                      {k.status === "active" && k.expires_at && <div className="mt-1 text-[11px] text-subtle">expires {dateTime(k.expires_at)}</div>}
                    </td>
                    <td className="px-5 py-3">
                      <Badge>
                        {k.scopes.length} scope{k.scopes.length === 1 ? "" : "s"}
                      </Badge>
                      {k.allowed_ips.length > 0 && <Badge className="ml-1.5">{k.allowed_ips.length} IP rule{k.allowed_ips.length === 1 ? "" : "s"}</Badge>}
                    </td>
                    <td className="px-5 py-3 text-muted">
                      {timeAgo(k.last_used_at)}
                      {k.last_used_ip && <div className="font-mono text-[11px] text-subtle">{k.last_used_ip}</div>}
                    </td>
                    <td className="px-5 py-3 text-right font-mono tabular-nums text-muted">{num(k.requests_24h)}</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" onClick={() => setEditing(k)} disabled={k.status === "revoked"}>
                          <Pencil /> Edit
                        </Button>
                        {k.status !== "revoked" && (
                          <Button size="icon" variant="ghost" aria-label={`Revoke ${k.name}`} onClick={() => setConfirming({ key: k, action: "revoke" })}>
                            <Ban />
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" aria-label={`Delete ${k.name}`} onClick={() => setConfirming({ key: k, action: "delete" })}>
                          <Trash2 />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {editing && (
        <KeyEditor
          apiKey={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onCreated={(s) => {
            setEditing(null);
            setSecret(s);
          }}
        />
      )}
      {secret && <SecretDialog secret={secret} onClose={() => setSecret(null)} />}
      {confirming && (
        <Dialog
          open
          onOpenChange={(o) => !o && setConfirming(null)}
          title={confirming.action === "revoke" ? `Revoke ${confirming.key.name}?` : `Delete ${confirming.key.name}?`}
          description={
            confirming.action === "revoke"
              ? "The service using this key loses access immediately. The key stays listed so you can see its history."
              : "The key is removed for good and stops working immediately. Its entries in the request log are kept."
          }
          footer={
            <>
              <Button variant="ghost" onClick={() => setConfirming(null)}>
                Cancel
              </Button>
              <Button variant="danger" loading={act.isPending} onClick={() => act.mutate(confirming)}>
                {confirming.action === "revoke" ? <Ban /> : <Trash2 />}
                {confirming.action === "revoke" ? "Revoke key" : "Delete key"}
              </Button>
            </>
          }
        />
      )}
    </>
  );
}

function KeyEditor({ apiKey, onClose, onCreated }: { apiKey: ApiKey | null; onClose: () => void; onCreated: (secret: string) => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: apiKey?.name ?? "",
    description: apiKey?.description ?? "",
    scopes: apiKey?.scopes ?? [],
    ips: apiKey?.allowed_ips.join("\n") ?? "",
    expires: apiKey?.expires_at ? apiKey.expires_at.slice(0, 10) : "",
  });

  const save = useMutation({
    mutationFn: (): Promise<ApiKey | { key: ApiKey; secret: string }> => {
      const body = {
        name: form.name.trim(),
        description: form.description.trim(),
        scopes: form.scopes,
        allowed_ips: form.ips.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean),
        // End of the chosen day, EVE time.
        expires_at: form.expires ? `${form.expires}T23:59:59Z` : null,
      };
      return apiKey ? api.put<ApiKey>(`/api/admin/api/keys/${apiKey.id}`, body) : api.post<{ key: ApiKey; secret: string }>("/api/admin/api/keys", body);
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: KEYS_KEY });
      if ("secret" in res) onCreated(res.secret);
      else {
        toast.success("Key updated");
        onClose();
      }
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={apiKey ? `Edit ${apiKey.name}` : "New API key"}
      description={apiKey ? undefined : "Give the key only the scopes the service needs. The secret is shown once, right after you create it."}
      className="max-w-2xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" loading={save.isPending} disabled={!form.name.trim() || !form.scopes.length} onClick={() => save.mutate()}>
            {apiKey ? "Save changes" : "Create key"}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <Field label="Name">
          <Input value={form.name} maxLength={80} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Discord bot" autoFocus />
        </Field>
        <Field label="Description">
          <Input value={form.description} maxLength={300} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Syncs Discord roles from groups" />
        </Field>
        <ScopePicker value={form.scopes} onChange={(scopes) => setForm({ ...form, scopes })} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_180px]">
          <Field label="Allowed IP addresses" hint="One IP or CIDR range per line, e.g. 203.0.113.7 or 10.0.0.0/8. Leave empty to allow any address.">
            <Textarea value={form.ips} onChange={(e) => setForm({ ...form, ips: e.target.value })} placeholder="203.0.113.7" className="font-mono text-xs" rows={3} />
          </Field>
          <Field label="Expires" hint="Optional. Leave empty for no expiry.">
            <Input type="date" value={form.expires} onChange={(e) => setForm({ ...form, expires: e.target.value })} />
          </Field>
        </div>
      </div>
    </Dialog>
  );
}

function ScopePicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const { data, isLoading } = useAreas();
  const selected = new Set(value);
  const toggle = (scopes: string[], on: boolean) => {
    const next = new Set(selected);
    for (const s of scopes) {
      if (on) next.add(s);
      else next.delete(s);
    }
    onChange([...next]);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-medium text-muted">Scopes</span>
        <span className="text-xs text-subtle">{value.length} selected</span>
      </div>
      <div className="max-h-80 space-y-3 overflow-y-auto rounded-xl border border-border bg-bg/30 p-3">
        {isLoading && <Skeleton className="h-24" />}
        {data?.map((area) => {
          const all = area.scopes.map((s) => s.scope);
          const allOn = all.length > 0 && all.every((s) => selected.has(s));
          const off = !area.enabled || !area.available;
          return (
            <div key={area.key}>
              <div className="mb-1.5 flex items-center gap-2 px-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-subtle">{area.label}</span>
                {off && (
                  <Badge color="var(--warning)" className="text-[11px]">
                    {area.available ? "API is off" : "Plugin disabled"}
                  </Badge>
                )}
                {all.length > 1 && (
                  <button type="button" onClick={() => toggle(all, !allOn)} className="ml-auto text-[11px] text-accent-ink hover:underline">
                    {allOn ? "Clear all" : "Select all"}
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                {area.scopes.map((s) => (
                  <label key={s.scope} className={cn("flex cursor-pointer items-start gap-2.5 rounded-lg px-2 py-1.5 text-sm hover:bg-hover", off && "opacity-70")}>
                    <input type="checkbox" checked={selected.has(s.scope)} onChange={(e) => toggle([s.scope], e.target.checked)} className="mt-0.5 accent-[var(--site-accent)]" />
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5">
                        {s.label}
                        {s.write && (
                          <Badge color="#fb923c" className="px-1.5 text-[11px] leading-4">
                            write
                          </Badge>
                        )}
                      </span>
                      <span className="block truncate font-mono text-[11px] text-subtle" title={s.description}>
                        {s.scope}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
        {/* Scopes on the key that no API offers any more (e.g. an uninstalled plugin). */}
        {data && value.filter((s) => !data.some((a) => a.scopes.some((x) => x.scope === s))).length > 0 && (
          <div className="px-1 text-xs text-subtle">
            Also on this key, no longer offered:{" "}
            {value
              .filter((s) => !data.some((a) => a.scopes.some((x) => x.scope === s)))
              .map((s) => (
                <button key={s} type="button" onClick={() => toggle([s], false)} className="mr-1.5 font-mono text-danger-fg hover:underline" title="Remove">
                  {s} ×
                </button>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SecretDialog({ secret, onClose }: { secret: string; onClose: () => void }) {
  const [copied, setCopied] = useState<string | null>(null);
  const curl = `curl -H "Authorization: Bearer ${secret}" ${window.location.origin}/api/v1/me`;
  const copy = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      toast.error("Couldn't copy. Select the text and copy it by hand.");
    }
  };
  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title="Your new API key"
      className="max-w-2xl"
      footer={
        <Button variant="primary" onClick={onClose}>
          I've saved it
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl border border-warning/35 bg-warning-soft p-3 text-sm text-warning-fg">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <span>Copy it now and store it somewhere safe. It won't be shown again; if it's lost, create a new key and revoke this one.</span>
        </div>
        <CopyBox text={secret} copied={copied === "secret"} onCopy={() => copy(secret, "secret")} />
        <div className="space-y-1.5">
          <span className="text-xs font-medium text-muted">Try it</span>
          <CopyBox text={curl} copied={copied === "curl"} onCopy={() => copy(curl, "curl")} small />
        </div>
      </div>
    </Dialog>
  );
}

function CopyBox({ text, copied, onCopy, small }: { text: string; copied: boolean; onCopy: () => void; small?: boolean }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-border-strong bg-bg/70 p-3">
      <code className={cn("flex-1 select-all break-all font-mono text-text", small ? "text-xs" : "text-sm")}>{text}</code>
      <Button size="icon" variant="ghost" onClick={onCopy} aria-label="Copy">
        {copied ? <Check className="text-success-fg" /> : <Copy />}
      </Button>
    </div>
  );
}

// --- APIs ----------------------------------------------------------------------

function Areas() {
  const qc = useQueryClient();
  const { data, isLoading } = useAreas();
  const toggle = useMutation({
    mutationFn: ({ key, enabled }: { key: string; enabled: boolean }) => api.post<ApiArea>(`/api/admin/api/areas/${encodeURIComponent(key)}`, { enabled }),
    onSuccess: (area) => {
      toast.success(`${area.label} API switched ${area.enabled ? "on" : "off"}`);
      qc.invalidateQueries({ queryKey: AREAS_KEY });
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) return <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}</div>;

  return (
    <>
      <p className="mb-4 text-sm text-muted">
        Switched-off APIs refuse every request, whatever scopes a key has. Everything starts switched off.{" "}
        <a href="/api/v1/docs" target="_blank" rel="noreferrer" className="text-accent-ink hover:underline">
          Read the API reference
        </a>
        .
      </p>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {data?.map((area, i) => (
          <Card key={area.key} className={cn("flex animate-fade-up flex-col", !area.available && "opacity-70")} style={{ animationDelay: `${i * 30}ms` }}>
            <CardHeader
              title={area.label}
              description={<span className="font-mono">{area.base_path}</span>}
              icon={area.plugin ? <Puzzle /> : <Network />}
              actions={
                <Switch
                  checked={area.enabled}
                  disabled={!area.available || toggle.isPending}
                  onCheckedChange={(enabled) => toggle.mutate({ key: area.key, enabled })}
                  aria-label={`${area.label} API`}
                />
              }
            />
            <div className="flex-1 space-y-3 p-5">
              <p className="text-sm text-muted">{area.description}</p>
              {!area.available && <p className="text-xs text-warning-fg">The {area.plugin} plugin is disabled. Enable it under Plugins to offer this API.</p>}
              <ul className="space-y-1.5">
                {area.scopes.map((s) => (
                  <li key={s.scope} className="flex items-start gap-2 text-xs">
                    <code className="shrink-0 rounded bg-hover-strong px-1.5 py-0.5 font-mono text-text ring-1 ring-inset ring-border-strong">{s.scope}</code>
                    {s.write && (
                      <Badge color="#fb923c" className="px-1.5 text-[11px] leading-4">
                        write
                      </Badge>
                    )}
                    <span className="text-muted">{s.description || s.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

// --- Requests ------------------------------------------------------------------

const STATUS_CLASSES = [
  { value: "", label: "All" },
  { value: "2xx", label: "2xx" },
  { value: "4xx", label: "4xx" },
  { value: "5xx", label: "5xx" },
];

function statusColor(status: number) {
  if (status >= 500) return "var(--danger)";
  if (status >= 400) return "var(--warning)";
  if (status >= 300) return "var(--info)";
  return "var(--success)";
}

function Requests() {
  const keys = useQuery({ queryKey: KEYS_KEY, queryFn: () => api.get<ApiKey[]>("/api/admin/api/keys") });
  const areas = useAreas();
  const [key, setKey] = useState("");
  const [status, setStatus] = useState("");
  const [area, setArea] = useState("");
  const [q, setQ] = useState("");
  const path = useDeferredValue(q);
  const [open, setOpen] = useState<ApiRequest | null>(null);

  const params = new URLSearchParams();
  if (key) params.set("key", key);
  if (status) params.set("status", status);
  if (area) params.set("area", area);
  if (path.trim()) params.set("q", path.trim());

  const columns: Column<ApiRequest>[] = [
    { header: "Time", cell: (r) => <span className="whitespace-nowrap text-muted" title={dateTime(r.at)}>{timeAgo(r.at)}</span> },
    {
      header: "Key",
      cell: (r) =>
        r.key ? (
          <span className="whitespace-nowrap">
            {r.key.name} <span className="font-mono text-[11px] text-subtle">{r.key.prefix}</span>
          </span>
        ) : (
          <span className="text-subtle">no valid key</span>
        ),
    },
    {
      header: "Request",
      className: "max-w-md",
      cell: (r) => (
        <span className="font-mono text-xs">
          <span className="mr-2 font-semibold text-muted">{r.method}</span>
          {r.path}
          {r.query && <span className="text-subtle">?{r.query}</span>}
        </span>
      ),
    },
    {
      header: "Status",
      cell: (r) => (
        <Badge color={statusColor(r.status)} className="font-mono">
          {r.status}
        </Badge>
      ),
    },
    { header: "Duration", align: "right", cell: (r) => <span className="text-muted">{num(r.duration_ms)} ms</span> },
    { header: "IP", cell: (r) => <span className="font-mono text-xs text-muted">{r.ip}</span> },
  ];

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Path contains…" className="pl-9" />
        </div>
        <Select value={key} onChange={setKey} label="Key">
          <option value="">All keys</option>
          {keys.data?.map((k) => (
            <option key={k.id} value={k.id}>
              {k.name}
            </option>
          ))}
        </Select>
        <Select value={area} onChange={setArea} label="API">
          <option value="">All APIs</option>
          {areas.data?.map((a) => (
            <option key={a.key} value={a.key}>
              {a.label}
            </option>
          ))}
        </Select>
        <div className="flex gap-1.5">
          {STATUS_CLASSES.map((s) => (
            <FilterChip key={s.value} active={status === s.value} onClick={() => setStatus(s.value)}>
              {s.label}
            </FilterChip>
          ))}
        </div>
      </div>
      <Card className="overflow-hidden">
        <PagedTable<ApiRequest>
          key={params.toString()}
          url="/api/admin/api/requests"
          params={params.toString()}
          columns={columns}
          rowKey={(r) => r.id}
          onRowClick={setOpen}
          empty={{ icon: <Activity />, title: "No requests", description: params.toString() ? "Nothing matches these filters." : "Requests made with API keys show up here." }}
        />
      </Card>
      {open && (
        <Dialog open onOpenChange={(o) => !o && setOpen(null)} title={`${open.method} ${open.path}`} className="max-w-2xl">
          <dl className="grid grid-cols-[120px_1fr] gap-x-4 gap-y-2 text-sm">
            <Detail label="Time">{dateTime(open.at)}</Detail>
            <Detail label="Key">{open.key ? `${open.key.name} (${open.key.prefix})` : "No valid key"}</Detail>
            <Detail label="API">{open.area || "—"}</Detail>
            <Detail label="Status">
              <Badge color={statusColor(open.status)} className="font-mono">
                {open.status}
              </Badge>
            </Detail>
            <Detail label="Duration">{num(open.duration_ms)} ms</Detail>
            <Detail label="Query">
              <code className="break-all font-mono text-xs">{open.query || "—"}</code>
            </Detail>
            <Detail label="IP address">
              <code className="font-mono text-xs">{open.ip}</code>
            </Detail>
            <Detail label="User agent">
              <span className="break-all text-xs">{open.user_agent || "—"}</span>
            </Detail>
          </dl>
        </Dialog>
      )}
    </>
  );
}

// --- shared bits -----------------------------------------------------------------

export function Detail({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <>
      <dt className="text-muted">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </>
  );
}

export function Select({ value, onChange, label, children }: { value: string; onChange: (v: string) => void; label: string; children: ReactNode }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      className="h-9 rounded-lg border border-border-strong bg-bg/60 px-3 text-sm text-text focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/20"
    >
      {children}
    </select>
  );
}

export function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs transition-colors",
        active ? "border-accent/40 bg-accent-soft text-text" : "border-border bg-surface/60 text-muted hover:text-text",
      )}
    >
      {children}
    </button>
  );
}
