import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, History, Pencil, Plus, RotateCcw, Send, Trash2, Webhook as WebhookIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/input";
import { EmptyState, PageHeader } from "@/components/ui/page";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/api";
import { cn, timeAgo } from "@/lib/utils";

type Kind = "discord" | "slack" | "json";

interface Hook {
  id: number;
  name: string;
  kind: Kind;
  url: string;
  events: string[];
  enabled: boolean;
  secret: string | null;
  last_status: number | null;
  last_error: string;
  last_delivery_at: string | null;
  failures: number;
}

interface EventType {
  name: string;
  label: string;
  description: string;
  plugin: string | null;
}

interface Delivery {
  id: number;
  at: string;
  event: string;
  status: number | null;
  ok: boolean;
  error: string;
  duration_ms: number;
  attempt: number;
}

const KINDS: { value: Kind; label: string; hint: string }[] = [
  { value: "discord", label: "Discord", hint: "Channel settings → Integrations → Webhooks → Copy URL" },
  { value: "slack", label: "Slack", hint: "An incoming-webhook URL from your Slack app" },
  { value: "json", label: "Any service (JSON)", hint: "Signed JSON: check X-Conduit-Signature (HMAC-SHA256 of the body with the secret)" },
];

const KEY = ["admin", "webhooks"];

export function AdminIntegrations() {
  const qc = useQueryClient();
  const hooks = useQuery({ queryKey: KEY, queryFn: () => api.get<Hook[]>("/api/admin/webhooks") });
  const events = useQuery({ queryKey: ["admin", "events"], queryFn: () => api.get<EventType[]>("/api/admin/events") });
  const [editing, setEditing] = useState<Hook | "new" | null>(null);
  const [history, setHistory] = useState<Hook | null>(null);

  const refresh = () => qc.invalidateQueries({ queryKey: KEY });
  const toggle = useMutation({
    mutationFn: (h: Hook) => api.put<Hook>(`/api/admin/webhooks/${h.id}`, { name: h.name, kind: h.kind, url: h.url, events: h.events, enabled: !h.enabled }),
    onSuccess: refresh,
    onError: (e) => toast.error(e.message),
  });
  const test = useMutation({
    mutationFn: (h: Hook) => api.post<{ result: string; webhook: Hook }>(`/api/admin/webhooks/${h.id}/test`),
    onSuccess: (r) => {
      if (r.result === "ok") toast.success(`Test sent to ${r.webhook.name}`);
      else toast.error(`${r.webhook.name} refused the test: ${r.webhook.last_error || `HTTP ${r.webhook.last_status}`}`);
      refresh();
    },
    onError: (e) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: (h: Hook) => api.delete(`/api/admin/webhooks/${h.id}`),
    onSuccess: () => {
      toast.success("Webhook deleted");
      refresh();
    },
    onError: (e) => toast.error(e.message),
  });

  const labels = useMemo(() => Object.fromEntries((events.data ?? []).map((e) => [e.name, e.label])), [events.data]);

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Integrations"
        description="Send what happens on the site to Discord, Slack or your own services: new members, lost logins, group requests and anything plugins announce."
        actions={
          <Button variant="primary" onClick={() => setEditing("new")}>
            <Plus /> New webhook
          </Button>
        }
      />

      {hooks.isLoading ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      ) : !hooks.data?.length ? (
        <Card>
          <EmptyState
            icon={<WebhookIcon />}
            title="No webhooks yet"
            description="Post member changes to a leadership Discord channel, or feed every event into your own tools."
            action={
              <Button variant="primary" onClick={() => setEditing("new")}>
                <Plus /> Create a webhook
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {hooks.data.map((h) => (
            <Card key={h.id} className={cn("animate-fade-up", !h.enabled && "opacity-70")}>
              <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{h.name}</span>
                    <Badge>{KINDS.find((k) => k.value === h.kind)?.label}</Badge>
                    <HealthBadge hook={h} />
                  </div>
                  <div className="mt-1 truncate font-mono text-xs text-subtle">{h.url}</div>
                  <div className="mt-2.5 flex flex-wrap gap-1">
                    {h.events.length === 0 ? (
                      <Badge color="var(--site-accent)">Every event</Badge>
                    ) : (
                      h.events.slice(0, 6).map((e) => <Badge key={e}>{labels[e] ?? e}</Badge>)
                    )}
                    {h.events.length > 6 && <Badge>+{h.events.length - 6} more</Badge>}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Switch checked={h.enabled} onCheckedChange={() => toggle.mutate(h)} aria-label={h.enabled ? "Switch off" : "Switch on"} />
                  <Button size="sm" variant="ghost" onClick={() => test.mutate(h)} loading={test.isPending && test.variables?.id === h.id} disabled={!h.enabled}>
                    <Send /> Test
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setHistory(h)} aria-label="Delivery history">
                    <History />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setEditing(h)} aria-label="Edit">
                    <Pencil />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Delete"
                    onClick={() => confirm(`Delete the webhook "${h.name}"?`) && remove.mutate(h)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {editing && (
        <HookEditor
          hook={editing === "new" ? null : editing}
          events={events.data ?? []}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            refresh();
          }}
        />
      )}
      {history && <Deliveries hook={history} labels={labels} onClose={() => setHistory(null)} />}
    </>
  );
}

function HealthBadge({ hook }: { hook: Hook }) {
  if (!hook.last_delivery_at) return <Badge>Never sent</Badge>;
  if (hook.failures > 0)
    return (
      <Badge color="var(--danger)" variant="dot">
        Failing ({hook.failures})
      </Badge>
    );
  return (
    <Badge color="var(--success)" variant="dot">
      Delivered {timeAgo(hook.last_delivery_at)}
    </Badge>
  );
}

function HookEditor({ hook, events, onClose, onSaved }: { hook: Hook | null; events: EventType[]; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(hook?.name ?? "");
  const [kind, setKind] = useState<Kind>(hook?.kind ?? "discord");
  const [url, setUrl] = useState(hook?.url ?? "");
  const [all, setAll] = useState(hook ? hook.events.length === 0 : false);
  const [selected, setSelected] = useState<Set<string>>(new Set(hook?.events ?? []));
  const [secret, setSecret] = useState(hook?.secret ?? null);
  const [copied, setCopied] = useState(false);

  const save = useMutation({
    mutationFn: () => {
      const body = { name, kind, url, events: all ? [] : [...selected], enabled: hook?.enabled ?? true };
      return hook ? api.put<Hook>(`/api/admin/webhooks/${hook.id}`, body) : api.post<Hook>("/api/admin/webhooks", body);
    },
    onSuccess: (h) => {
      toast.success(hook ? "Webhook saved" : `Webhook ${h.name} created`);
      onSaved();
    },
    onError: (e) => toast.error(e.message),
  });
  const rotate = useMutation({
    mutationFn: () => api.post<Hook>(`/api/admin/webhooks/${hook!.id}/rotate-secret`),
    onSuccess: (h) => {
      setSecret(h.secret);
      toast.success("New secret created. Update the receiving service.");
    },
  });

  const grouped = useMemo(() => {
    const out: Record<string, EventType[]> = {};
    for (const e of events) (out[e.plugin ? `Plugin: ${e.plugin}` : e.name.split(".")[0]!] ??= []).push(e);
    return Object.entries(out);
  }, [events]);

  const flip = (name: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={hook ? `Edit ${hook.name}` : "New webhook"}
      description="Events are sent as they happen. Failed deliveries are retried a few times."
      className="max-w-2xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" loading={save.isPending} disabled={!name.trim() || !url.trim() || (!all && selected.size === 0)} onClick={() => save.mutate()}>
            {hook ? "Save" : "Create webhook"}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Leadership channel" maxLength={80} />
          </Field>
          <Field label="Send to">
            <div className="grid grid-cols-3 gap-1 rounded-lg border border-border-strong p-1">
              {KINDS.map((k) => (
                <button
                  key={k.value}
                  type="button"
                  onClick={() => setKind(k.value)}
                  className={cn(
                    "rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                    kind === k.value ? "bg-accent-soft text-text ring-1 ring-accent/40" : "text-muted hover:bg-hover hover:text-text",
                  )}
                >
                  {k.value === "json" ? "JSON" : k.label}
                </button>
              ))}
            </div>
          </Field>
        </div>
        <Field label="Webhook URL" hint={KINDS.find((k) => k.value === kind)?.hint}>
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" className="font-mono" />
        </Field>

        {kind === "json" && hook && secret && (
          <Field label="Signing secret" hint="Keep this in the receiving service only.">
            <div className="flex gap-2">
              <Input readOnly value={secret} className="font-mono" />
              <Button
                size="icon"
                aria-label="Copy secret"
                onClick={() => {
                  navigator.clipboard.writeText(secret);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
              >
                {copied ? <Check /> : <Copy />}
              </Button>
              <Button size="icon" aria-label="Create a new secret" onClick={() => rotate.mutate()} loading={rotate.isPending}>
                {!rotate.isPending && <RotateCcw />}
              </Button>
            </div>
          </Field>
        )}

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-muted">Events</span>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={all} onCheckedChange={setAll} /> Every event
            </label>
          </div>
          {!all && (
            <div className="max-h-72 space-y-4 overflow-y-auto rounded-lg border border-border p-3">
              {grouped.map(([group, list]) => (
                <div key={group}>
                  <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-subtle">{group}</div>
                  <div className="grid gap-1 sm:grid-cols-2">
                    {list.map((e) => (
                      <label
                        key={e.name}
                        className={cn(
                          "flex cursor-pointer items-start gap-2.5 rounded-lg border p-2.5 transition-colors",
                          selected.has(e.name) ? "border-accent/40 bg-accent-soft" : "border-transparent hover:bg-hover",
                        )}
                      >
                        <input type="checkbox" checked={selected.has(e.name)} onChange={() => flip(e.name)} className="mt-0.5 accent-[var(--site-accent)]" />
                        <span className="min-w-0">
                          <span className="block text-sm font-medium">{e.label}</span>
                          <span className="block text-xs text-muted">{e.description}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
}

function Deliveries({ hook, labels, onClose }: { hook: Hook; labels: Record<string, string>; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: [...KEY, hook.id, "deliveries"],
    queryFn: () => api.get<{ items: Delivery[]; count: number }>(`/api/admin/webhooks/${hook.id}/deliveries?limit=100`),
  });
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()} title={`Deliveries: ${hook.name}`} description="The last 100 attempts." className="max-w-2xl">
      {isLoading ? (
        <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-10" />)}</div>
      ) : !data?.items.length ? (
        <p className="py-8 text-center text-sm text-muted">Nothing has been sent yet.</p>
      ) : (
        <Card>
          <CardHeader title={`${data.count} deliveries`} />
          <CardBody className="divide-y divide-border p-0">
            {data.items.map((d) => (
              <div key={d.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <span className={cn("size-2 shrink-0 rounded-none", d.ok ? "bg-success" : "bg-danger")} />
                <span className="font-medium">{labels[d.event] ?? d.event}</span>
                {d.attempt > 1 && <Badge>retry {d.attempt - 1}</Badge>}
                <span className="min-w-0 flex-1 truncate text-xs text-danger-fg">{d.error}</span>
                <span className="font-mono text-xs text-muted">{d.status ?? "—"}</span>
                <span className="w-20 text-right text-xs text-subtle">{timeAgo(d.at)}</span>
              </div>
            ))}
          </CardBody>
        </Card>
      )}
    </Dialog>
  );
}
