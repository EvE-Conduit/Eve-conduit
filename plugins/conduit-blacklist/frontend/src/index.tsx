import {
  api, Badge, Button, Card, CardBody, CardHeader, ConfirmDialog, date, dateTime, definePlugin, Dialog, EmptyState, Field, Input,
  PageHeader, SearchInput, Segmented, Select, Skeleton, TabPanel, Table, Tabs, Td, Textarea, Th, THead, timeAgo, toast, Tr,
} from "@conduit/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

import { Back, Check, Pencil, Plus, Search, Shield, Trash, Warning } from "./icons";

// --- data -------------------------------------------------------------------------------------------------

type Kind = "character" | "corporation" | "alliance";
type Severity = "watch" | "banned";

interface Entry {
  id: number;
  kind: Kind;
  eve_id: number;
  name: string;
  image: string;
  reason: string;
  severity: Severity;
  expires_at: string | null;
  expired: boolean;
  added_by: string | null;
  created_at: string;
  updated_at: string;
  open_matches: number;
  notes?: { id: number; author: string; text: string; created_at: string }[];
  matches?: Match[];
  can_manage?: boolean;
}

interface Match {
  id: number;
  entry: { id: number; name: string; kind: Kind; severity: Severity };
  user_id: number;
  user: string;
  character_id: number;
  character_name: string;
  portrait: string;
  source: "linked" | "applied" | "check";
  found_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
}

interface Hit {
  kind: Kind;
  eve_id: number;
  name: string;
  image: string;
  entry_id: number | null;
  entries?: Entry[];
}

const BASE = "/api/p/blacklist";
const KINDS: Record<Kind, string> = { character: "Character", corporation: "Corporation", alliance: "Alliance" };
const SOURCES: Record<Match["source"], string> = { linked: "Linked", applied: "Applied", check: "Regular check" };

function SeverityBadge({ severity }: { severity: Severity }) {
  return severity === "banned" ? <Badge tone="danger">Banned</Badge> : <Badge tone="warning">Watch</Badge>;
}

function Pic({ src, round }: { src: string; round?: boolean }) {
  return <img src={src} alt="" className={`size-8 shrink-0 ${round ? "rounded-full" : "rounded"}`} loading="lazy" />;
}

// --- list ---------------------------------------------------------------------------------------------------

function HomePage() {
  const [tab, setTab] = useState("entries");
  const [adding, setAdding] = useState(false);
  const { data: entries } = useQuery({ queryKey: ["blacklist", "entries", "active", "", ""], queryFn: () => api.get<{ items: Entry[]; can_manage: boolean }>(`${BASE}/entries`) });
  const { data: matches } = useQuery({ queryKey: ["blacklist", "matches", "open"], queryFn: () => api.get<{ counts: { open: number } }>(`${BASE}/matches?status=open`) });
  return (
    <>
      <PageHeader
        title="Blacklist"
        icon={<Shield />}
        description="Characters, corporations and alliances you don't want. Whoever can see this list is warned when one of them links a character or applies."
        actions={entries?.can_manage && <Button variant="primary" onClick={() => setAdding(true)}><Plus /> Add</Button>}
      />
      <Tabs
        value={tab}
        onValueChange={setTab}
        variant="pills"
        className="space-y-4"
        items={[
          { value: "entries", label: "Entries" },
          { value: "warnings", label: "Warnings", count: matches?.counts.open },
          { value: "check", label: "Check a name" },
        ]}
      >
        <TabPanel value="entries"><EntriesTab /></TabPanel>
        <TabPanel value="warnings"><WarningsTab /></TabPanel>
        <TabPanel value="check"><CheckTab /></TabPanel>
      </Tabs>
      {adding && <AddDialog onClose={() => setAdding(false)} />}
    </>
  );
}

function EntriesTab() {
  const [q, setQ] = useState("");
  const [kind, setKind] = useState("");
  const [status, setStatus] = useState<"active" | "expired" | "all">("active");
  const { data, isLoading } = useQuery({
    queryKey: ["blacklist", "entries", status, kind, q],
    queryFn: () => api.get<{ items: Entry[] }>(`${BASE}/entries?status=${status}&kind=${kind}&q=${encodeURIComponent(q)}`),
  });
  return (
    <Card>
      <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
        <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search names and reasons" className="w-64" />
        <Select value={kind} onChange={(e) => setKind(e.target.value)} className="w-44" aria-label="Kind"
          options={[{ value: "", label: "Everything" }, ...Object.entries(KINDS).map(([value, label]) => ({ value, label }))]} />
        <Segmented<"active" | "expired" | "all">
          value={status}
          onChange={setStatus}
          options={[{ value: "active", label: "Active" }, { value: "expired", label: "Expired" }, { value: "all", label: "All" }]}
        />
      </div>
      {isLoading || !data ? (
        <CardBody><Skeleton className="h-40" /></CardBody>
      ) : data.items.length === 0 ? (
        <EmptyState icon={<Shield />} title={q || kind || status !== "active" ? "Nothing matches" : "The blacklist is empty"} />
      ) : (
        <Table>
          <THead>
            <tr>
              <Th>Name</Th>
              <Th>Severity</Th>
              <Th>Reason</Th>
              <Th>Added</Th>
              <Th>Expires</Th>
              <Th align="right">Warnings</Th>
            </tr>
          </THead>
          <tbody>
            {data.items.map((e) => (
              <Tr key={e.id}>
                <Td>
                  <Link to={`/p/blacklist/entries/${e.id}`} className="flex items-center gap-3 hover:text-accent-ink">
                    <Pic src={e.image} round={e.kind === "character"} />
                    <span>
                      <span className="block font-medium">{e.name}</span>
                      <span className="block text-xs text-muted">{KINDS[e.kind]}</span>
                    </span>
                  </Link>
                </Td>
                <Td><SeverityBadge severity={e.severity} /></Td>
                <Td className="max-w-md truncate text-muted" title={e.reason}>{e.reason || "—"}</Td>
                <Td className="text-muted">{date(e.created_at)}{e.added_by ? ` · ${e.added_by}` : ""}</Td>
                <Td className="text-muted">{e.expires_at ? (e.expired ? `Expired ${date(e.expires_at)}` : date(e.expires_at)) : "Never"}</Td>
                <Td numeric>{e.open_matches > 0 ? <Badge tone="danger">{e.open_matches}</Badge> : <span className="text-subtle">0</span>}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </Card>
  );
}

function MatchesTable({ items, onResolve }: { items: Match[]; onResolve: (m: Match, resolved: boolean) => void }) {
  return (
    <Table>
      <THead>
        <tr>
          <Th>Character</Th>
          <Th>Account</Th>
          <Th>Blacklisted as</Th>
          <Th>Found</Th>
          <Th align="right" />
        </tr>
      </THead>
      <tbody>
        {items.map((m) => (
          <Tr key={m.id}>
            <Td>
              <span className="flex items-center gap-3">
                <Pic src={m.portrait} round />
                <span className="font-medium">{m.character_name}</span>
              </span>
            </Td>
            <Td>{m.user}</Td>
            <Td>
              <Link to={`/p/blacklist/entries/${m.entry.id}`} className="inline-flex items-center gap-2 hover:text-accent-ink">
                {m.entry.name} <span className="text-xs text-muted">{KINDS[m.entry.kind]}</span> <SeverityBadge severity={m.entry.severity} />
              </Link>
            </Td>
            <Td className="text-muted">{timeAgo(m.found_at)} · {SOURCES[m.source]}</Td>
            <Td align="right">
              {m.resolved_at ? (
                <span className="inline-flex items-center gap-2 text-xs text-muted">
                  Dealt with{m.resolved_by ? ` by ${m.resolved_by}` : ""}
                  <Button size="xs" variant="ghost" onClick={() => onResolve(m, false)}>Reopen</Button>
                </span>
              ) : (
                <Button size="sm" onClick={() => onResolve(m, true)}><Check /> Dealt with</Button>
              )}
            </Td>
          </Tr>
        ))}
      </tbody>
    </Table>
  );
}

function useResolve() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ m, resolved }: { m: Match; resolved: boolean }) => api.post<Match>(`${BASE}/matches/${m.id}`, { resolved }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["blacklist"] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

function WarningsTab() {
  const [status, setStatus] = useState<"open" | "resolved">("open");
  const resolve = useResolve();
  const { data, isLoading } = useQuery({ queryKey: ["blacklist", "matches", status], queryFn: () => api.get<{ items: Match[] }>(`${BASE}/matches?status=${status}`) });
  return (
    <Card>
      <div className="flex items-center justify-between gap-3 border-b border-border p-3">
        <p className="text-sm text-muted">Members' and applicants' characters that are blacklisted, or in a blacklisted corporation or alliance.</p>
        <Segmented<"open" | "resolved"> value={status} onChange={setStatus} options={[{ value: "open", label: "Open" }, { value: "resolved", label: "Dealt with" }]} />
      </div>
      {isLoading || !data ? (
        <CardBody><Skeleton className="h-32" /></CardBody>
      ) : data.items.length === 0 ? (
        <EmptyState icon={<Check />} title={status === "open" ? "No open warnings" : "Nothing dealt with yet"} description={status === "open" ? "Characters are checked when they're linked, when someone applies and every hour." : undefined} />
      ) : (
        <MatchesTable items={data.items} onResolve={(m, resolved) => resolve.mutate({ m, resolved })} />
      )}
    </Card>
  );
}

function CheckTab() {
  const [q, setQ] = useState("");
  const check = useMutation({ mutationFn: (name: string) => api.get<Hit[]>(`${BASE}/check?q=${encodeURIComponent(name)}`), onError: (e: Error) => toast.error(e.message) });
  return (
    <Card>
      <CardHeader title="Check a name" description="Someone who hasn't registered yet? Type their exact character, corporation or alliance name. Characters are checked with their current corporation and alliance." />
      <CardBody className="space-y-4">
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (q.trim().length >= 3) check.mutate(q.trim()); }}>
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Exact name" className="max-w-sm" />
          <Button type="submit" loading={check.isPending}><Search /> Check</Button>
        </form>
        {check.data && check.data.length === 0 && <p className="text-sm text-muted">EVE knows nobody by that exact name.</p>}
        {check.data?.map((h) => (
          <div key={`${h.kind}:${h.eve_id}`} className="flex items-start gap-3 rounded-lg border border-border p-3">
            <Pic src={h.image} round={h.kind === "character"} />
            <div className="min-w-0 flex-1">
              <div className="font-medium">{h.name} <span className="text-xs font-normal text-muted">{KINDS[h.kind]}</span></div>
              {(h.entries ?? []).length === 0 ? (
                <div className="mt-1 text-sm text-success-fg">Not blacklisted</div>
              ) : (
                <ul className="mt-1 space-y-1 text-sm">
                  {h.entries!.map((e) => (
                    <li key={e.id} className="flex flex-wrap items-center gap-2">
                      <SeverityBadge severity={e.severity} />
                      <Link to={`/p/blacklist/entries/${e.id}`} className="hover:text-accent-ink">{e.name}</Link>
                      <span className="text-muted">{e.kind === h.kind && e.eve_id === h.eve_id ? "" : `(their ${e.kind})`} {e.reason}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}

// --- adding and changing --------------------------------------------------------------------------------------

/** `<input type="datetime-local">` value from an ISO date, and back. */
const toLocal = (iso: string | null) => (iso ? new Date(new Date(iso).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "");
const fromLocal = (v: string) => (v ? new Date(v).toISOString() : null);

function EntryFields({ severity, reason, expires, set }: {
  severity: Severity; reason: string; expires: string;
  set: (patch: Partial<{ severity: Severity; reason: string; expires: string }>) => void;
}) {
  return (
    <>
      <Field label="Severity" hint="Banned: they must not join. Watch: keep an eye on them.">
        <div>
          <Segmented<Severity> value={severity} onChange={(v) => set({ severity: v })} options={[{ value: "banned", label: "Banned" }, { value: "watch", label: "Watch" }]} />
        </div>
      </Field>
      <Field label="Reason" hint="Only people who can see the blacklist read this.">
        <Textarea rows={3} value={reason} onChange={(e) => set({ reason: e.target.value })} placeholder="Awoxed a fleet in Delve, March 2026" />
      </Field>
      <Field label="Expires (optional)" hint="Left empty, it never runs out.">
        <Input type="datetime-local" value={expires} onChange={(e) => set({ expires: e.target.value })} className="w-60" />
      </Field>
    </>
  );
}

function AddDialog({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<Hit | null>(null);
  const [form, setForm] = useState({ severity: "banned" as Severity, reason: "", expires: "" });
  const lookup = useMutation({ mutationFn: (name: string) => api.get<Hit[]>(`${BASE}/lookup?q=${encodeURIComponent(name)}`), onError: (e: Error) => toast.error(e.message) });
  const save = useMutation({
    mutationFn: () => api.post<Entry>(`${BASE}/entries`, { kind: picked!.kind, eve_id: picked!.eve_id, severity: form.severity, reason: form.reason, expires_at: fromLocal(form.expires) }),
    onSuccess: (e) => {
      qc.invalidateQueries({ queryKey: ["blacklist"] });
      toast.success(`${e.name} is on the blacklist`);
      navigate(`/p/blacklist/entries/${e.id}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title="Add to the blacklist"
      description="Registered members it covers are looked for straight away."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!picked} loading={save.isPending} onClick={() => save.mutate()}><Plus /> Add</Button>
        </>
      }
    >
      <div className="space-y-5">
        <Field label="Who" hint="The exact character, corporation or alliance name.">
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (q.trim().length >= 3) lookup.mutate(q.trim()); }}>
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Exact name" />
            <Button type="submit" loading={lookup.isPending}><Search /> Find</Button>
          </form>
        </Field>
        {lookup.data && lookup.data.length === 0 && <p className="text-sm text-muted">EVE knows nobody by that exact name.</p>}
        {(lookup.data ?? []).length > 0 && (
          <div className="divide-y divide-border rounded-lg border border-border">
            {lookup.data!.map((h) => (
              <label key={`${h.kind}:${h.eve_id}`} className={`flex items-center gap-3 px-3 py-2.5 text-sm ${h.entry_id ? "opacity-60" : "cursor-pointer"}`}>
                <input type="radio" name="who" disabled={!!h.entry_id} checked={picked?.eve_id === h.eve_id && picked.kind === h.kind} onChange={() => setPicked(h)} />
                <Pic src={h.image} round={h.kind === "character"} />
                <span className="flex-1">{h.name} <span className="text-xs text-muted">{KINDS[h.kind]}</span></span>
                {h.entry_id && <Link to={`/p/blacklist/entries/${h.entry_id}`} className="text-xs text-accent-ink">Already on it</Link>}
              </label>
            ))}
          </div>
        )}
        <EntryFields {...form} set={(patch) => setForm({ ...form, ...patch })} />
      </div>
    </Dialog>
  );
}

function EditDialog({ entry, onClose }: { entry: Entry; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ severity: entry.severity, reason: entry.reason, expires: toLocal(entry.expires_at) });
  const save = useMutation({
    mutationFn: () => api.put<Entry>(`${BASE}/entries/${entry.id}`, { severity: form.severity, reason: form.reason, expires_at: fromLocal(form.expires) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["blacklist"] });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={`Change ${entry.name}`}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={save.isPending} onClick={() => save.mutate()}>Save</Button>
        </>
      }
    >
      <div className="space-y-5">
        <EntryFields {...form} set={(patch) => setForm({ ...form, ...patch })} />
      </div>
    </Dialog>
  );
}

// --- one entry ----------------------------------------------------------------------------------------------

function EntryPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const resolve = useResolve();
  const key = ["blacklist", "entry", id];
  const { data, isLoading, error } = useQuery({ queryKey: key, queryFn: () => api.get<Entry>(`${BASE}/entries/${id}`) });
  const [editing, setEditing] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [note, setNote] = useState("");
  const addNote = useMutation({
    mutationFn: () => api.post<Entry>(`${BASE}/entries/${id}/notes`, { text: note }),
    onSuccess: (d) => {
      qc.setQueryData(key, { ...d, can_manage: data?.can_manage });
      setNote("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (error) return <EmptyState icon={<Shield />} title="Not on the blacklist" action={<Link to="/p/blacklist"><Button>Back to the blacklist</Button></Link>} />;
  if (isLoading || !data) return <Skeleton className="h-96" />;

  return (
    <>
      <Link to="/p/blacklist" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-text">
        <Back /> Blacklist
      </Link>
      <PageHeader
        eyebrow={KINDS[data.kind]}
        title={data.name}
        icon={<img src={data.image} alt="" className="size-full object-cover" />}
        description={`Added ${date(data.created_at)}${data.added_by ? ` by ${data.added_by}` : ""}${data.expires_at ? ` · ${data.expired ? "expired" : "expires"} ${dateTime(data.expires_at)}` : ""}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <SeverityBadge severity={data.severity} />
            {data.expired && <Badge>Expired</Badge>}
            {data.can_manage && (
              <>
                <Button onClick={() => setEditing(true)}><Pencil /> Change</Button>
                <Button variant="danger" onClick={() => setRemoving(true)}><Trash /> Remove</Button>
              </>
            )}
          </div>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="space-y-6">
          <Card>
            <CardHeader title="Reason" />
            <CardBody className="whitespace-pre-wrap text-sm">{data.reason || <span className="text-muted">No reason given.</span>}</CardBody>
          </Card>
          <Card>
            <CardHeader title="Warnings" description="Registered characters this entry covers." />
            {(data.matches ?? []).length === 0 ? (
              <CardBody className="text-sm text-muted">None of your members' or applicants' characters, so far.</CardBody>
            ) : (
              <MatchesTable items={data.matches!} onResolve={(m, resolved) => resolve.mutate({ m, resolved })} />
            )}
          </Card>
        </div>
        <Card>
          <CardHeader title="Notes" description="Shared with everyone who can see the blacklist." />
          <CardBody className="space-y-4">
            {(data.notes ?? []).length === 0 && <p className="text-sm text-muted">No notes yet.</p>}
            {data.notes?.map((n) => (
              <div key={n.id} className="text-sm">
                <div className="text-xs text-subtle">{n.author} · {timeAgo(n.created_at)}</div>
                <div className="mt-0.5 whitespace-pre-wrap">{n.text}</div>
              </div>
            ))}
            <div className="space-y-2 border-t border-border pt-4">
              <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note" />
              <Button size="sm" variant="primary" disabled={!note.trim()} loading={addNote.isPending} onClick={() => addNote.mutate()}>Add note</Button>
            </div>
          </CardBody>
        </Card>
      </div>
      {editing && <EditDialog entry={data} onClose={() => setEditing(false)} />}
      <ConfirmDialog
        open={removing}
        onOpenChange={setRemoving}
        title={`Remove ${data.name} from the blacklist?`}
        description="Its notes and warnings are deleted with it. The removal is kept in the audit log."
        danger
        confirmLabel={<><Trash /> Remove</>}
        onConfirm={() =>
          api.delete(`${BASE}/entries/${data.id}`).then(() => {
            qc.invalidateQueries({ queryKey: ["blacklist"] });
            toast.success(`${data.name} removed`);
            navigate("/p/blacklist");
          })
        }
      />
    </>
  );
}

// --- dashboard ------------------------------------------------------------------------------------------------

function WarningsWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ["blacklist", "summary"],
    queryFn: () => api.get<{ entries: number; open_matches: number; latest: Match[] }>(`${BASE}/summary`),
    refetchInterval: 300_000,
  });
  if (isLoading || !data) return <Skeleton className="h-16" />;
  return (
    <Link to="/p/blacklist" className="block">
      <div className="flex items-end justify-between gap-6">
        <div>
          <div className="text-xs text-muted">Open warnings</div>
          <div className="mt-1 font-mono text-3xl font-semibold tabular-nums">{data.open_matches}</div>
          <div className="text-xs text-subtle">{data.entries} on the blacklist</div>
        </div>
        {data.open_matches > 0 ? <Badge tone="danger"><Warning className="size-3.5" /> Look at them</Badge> : <Badge tone="success">All clear</Badge>}
      </div>
      {data.latest.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm">
          {data.latest.map((m) => (
            <li key={m.id} className="truncate"><span className="font-medium">{m.character_name}</span> <span className="text-muted">· {m.user} · {m.entry.name}</span></li>
          ))}
        </ul>
      )}
    </Link>
  );
}

export default definePlugin({
  routes: [
    { path: "", Component: HomePage },
    { path: "entries/:id", Component: EntryPage },
  ],
  widgets: [{ id: "warnings", title: "Blacklist", Component: WarningsWidget, size: "sm", order: 35, permission: "blacklist.view_blacklist" }],
});
