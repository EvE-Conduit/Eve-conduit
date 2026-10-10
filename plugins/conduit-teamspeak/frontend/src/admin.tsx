// Server setup (teamspeak.manage_teamspeak): the ServerQuery connection, group mapping and linked members.
import {
  Alert, api, Avatar, Badge, Button, Card, CardBody, CardFooter, CardHeader, cn, ConfirmDialog, DropdownContent, DropdownItem, DropdownMenu,
  DropdownSeparator, DropdownTrigger, EmptyState, Field, Input, PageHeader, SearchInput, Select, Skeleton, StatCard, SwitchRow, Table, TableToolbar,
  TabPanel, Tabs, Td, Th, THead, timeAgo, toast, Tr,
} from "@conduit/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { Link } from "react-router";

import { ArrowLeft, Check, Headphones, Plug, Plus, Refresh, Trash, Unlink } from "./icons";
import { type Admin, BASE, type Check as CheckResult, type LinkedCharacter, type Mapping, type MemberAccount } from "./types";

const KEY = ["teamspeak", "admin"];

export function AdminPage() {
  const { data, isLoading } = useQuery({ queryKey: KEY, queryFn: () => api.get<Admin>(`${BASE}/admin`) });
  const [tab, setTab] = useState<string | null>(null);
  const current = tab ?? (data?.settings.checked_at ? "groups" : "setup");
  const ready = !!data?.settings.checked_at;

  return (
    <>
      <PageHeader
        eyebrow={<Link to="/p/teamspeak" className="inline-flex items-center gap-1 hover:text-text"><ArrowLeft className="size-3" /> TeamSpeak</Link>}
        title="Server setup"
        icon={<Headphones />}
        description="Connect your TeamSpeak server through ServerQuery, decide which groups and states get which server groups, and look after linked members."
      />
      {isLoading || !data ? (
        <Skeleton className="h-96" />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-4">
            <StatCard
              label="Server"
              value={data.settings.virtual_server_name || data.settings.query_host || "Not set"}
              tone={ready ? "success" : "warning"}
              hint={data.settings.checked_at ? `checked ${timeAgo(data.settings.checked_at)}${data.settings.server_version ? ` · ${data.settings.server_version}` : ""}` : "not checked yet"}
            />
            <StatCard label="Linked" value={data.stats.linked} hint={data.stats.pending ? `${data.stats.pending} still linking` : undefined} />
            <StatCard label="Sync problems" value={data.stats.errors} tone={data.stats.errors ? "danger" : "success"} />
            <StatCard label="Last full sync" value={data.settings.last_full_sync ? timeAgo(data.settings.last_full_sync) : "never"} hint="every 6 hours, and on changes" />
          </div>
          <Tabs
            variant="pills"
            value={current}
            onValueChange={setTab}
            className="space-y-4"
            items={[
              { value: "setup", label: "Setup" },
              { value: "groups", label: "Groups", count: data.mappings.length, disabled: !ready },
              { value: "members", label: "Members", count: data.stats.linked + data.stats.pending, disabled: !ready },
            ]}
          >
            <TabPanel value="setup"><SetupTab data={data} /></TabPanel>
            <TabPanel value="groups"><GroupsTab data={data} /></TabPanel>
            <TabPanel value="members"><MembersTab /></TabPanel>
          </Tabs>
        </div>
      )}
    </>
  );
}

// --- setup -------------------------------------------------------------------------------------------------------------

function Step({ n, title, done, children }: { n: number; title: string; done: boolean; children: ReactNode }) {
  return (
    <li className="grid grid-cols-[32px_1fr] gap-4">
      <span className={cn("grid size-8 place-items-center border font-mono text-sm", done ? "border-success/40 bg-success-soft text-success-fg" : "border-border-strong text-muted")}>
        {done ? <Check /> : n}
      </span>
      <div className="min-w-0 space-y-3 pb-2">
        <div className="pt-1 font-medium">{title}</div>
        {children}
      </div>
    </li>
  );
}

function SetupTab({ data }: { data: Admin }) {
  const qc = useQueryClient();
  const s = data.settings;
  const [form, setForm] = useState({
    query_host: s.query_host,
    query_port: String(s.query_port),
    query_user: s.query_user,
    query_password: "",
    server_id: String(s.server_id),
    public_host: s.public_host,
    public_port: String(s.public_port),
    server_name: s.server_name,
    nickname_format: s.nickname_format,
    registered_sgid: String(s.registered_sgid),
    kick_without_access: s.kick_without_access,
    require_for_compliance: s.require_for_compliance,
    allowlisted: s.allowlisted,
  });
  const [check, setCheck] = useState<CheckResult | null>(null);
  const body = () => ({
    ...form, query_port: Number(form.query_port), server_id: Number(form.server_id), public_port: Number(form.public_port), registered_sgid: Number(form.registered_sgid) || 0,
  });
  const save = useMutation({
    mutationFn: () => api.put<Admin>(`${BASE}/admin/settings`, body()),
    onSuccess: (d) => {
      qc.setQueryData(KEY, d);
      qc.invalidateQueries({ queryKey: ["teamspeak", "me"] });
      setForm((f) => ({ ...f, query_password: "" }));
      toast.success("Saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const test = useMutation({
    mutationFn: async () => {
      const saved = await api.put<Admin>(`${BASE}/admin/settings`, body());
      qc.setQueryData(KEY, saved);
      setForm((f) => ({ ...f, query_password: "" }));
      return api.post<{ check: CheckResult; admin: Admin }>(`${BASE}/admin/check`);
    },
    onSuccess: (r) => {
      qc.setQueryData(KEY, r.admin);
      qc.invalidateQueries({ queryKey: ["teamspeak", "me"] });
      setCheck(r.check);
      setForm((f) => ({ ...f, registered_sgid: String(r.admin.settings.registered_sgid) }));
      toast.success(r.check.problems.length ? "Connected, with things to fix" : "Connected");
    },
    onError: (e: Error) => { setCheck(null); toast.error(e.message); },
  });
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
      <Card>
        <CardBody>
          <ol className="space-y-6">
            <Step n={1} title="ServerQuery login" done={s.configured}>
              <p className="text-xs text-subtle">
                Make a login for this site on the server (as serveradmin, in the client: Tools → ServerQuery Login, or <span className="font-mono">serverqueryadd</span>) and give it the Server Admin Query rights, or use <span className="font-mono">serveradmin</span> itself.
              </p>
              <div className="grid gap-4 sm:grid-cols-[1fr_120px_100px]">
                <Field label="Query address" hint="The server's host name; ServerQuery listens on 10011 by default.">
                  <Input value={form.query_host} onChange={(e) => set({ query_host: e.target.value })} placeholder="ts.example.com" className="font-mono" />
                </Field>
                <Field label="Query port">
                  <Input type="number" value={form.query_port} onChange={(e) => set({ query_port: e.target.value })} className="font-mono" />
                </Field>
                <Field label="Server id" hint="1 unless the host runs several.">
                  <Input type="number" min={1} value={form.server_id} onChange={(e) => set({ server_id: e.target.value })} className="font-mono" />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Query login">
                  <Input value={form.query_user} onChange={(e) => set({ query_user: e.target.value })} placeholder="conduit" className="font-mono" autoComplete="off" />
                </Field>
                <Field label="Query password" hint={s.query_password_set ? "Set; leave empty to keep it." : "From the server."}>
                  <Input type="password" value={form.query_password} onChange={(e) => set({ query_password: e.target.value })} className="font-mono" autoComplete="new-password" placeholder={s.query_password_set ? "••••••••" : ""} />
                </Field>
              </div>
              <div className="border border-border px-3">
                <SwitchRow
                  label="This site is on the server's query allow list"
                  description="Add its address to query_ip_allowlist.txt next to the server, so the server doesn't limit how fast it may send commands. Otherwise commands are spaced out and syncing everyone takes longer."
                  checked={form.allowlisted}
                  onCheckedChange={(v) => set({ allowlisted: v })}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="secondary" loading={test.isPending} onClick={() => test.mutate()}><Plug /> Save and check the connection</Button>
                {s.checked_at && !check && <span className="text-xs text-subtle">Last checked {timeAgo(s.checked_at)}.</span>}
              </div>
              {check && (
                <Alert tone={check.problems.length ? "warning" : "success"} title={`Connected to ${check.name}`}>
                  <div className="text-xs">
                    {check.version} · {check.online} of {check.max_clients} online · voice port {check.voice_port} · {check.groups.length} server groups · linked members get <b>{check.registered_group}</b>
                  </div>
                  {check.problems.length > 0 && (
                    <ul className="mt-2 list-disc space-y-1 pl-4 text-sm">{check.problems.map((p) => <li key={p}>{p}</li>)}</ul>
                  )}
                </Alert>
              )}
            </Step>
            <Step n={2} title="Where members connect" done={s.configured}>
              <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
                <Field label="Address" hint="Empty uses the query address.">
                  <Input value={form.public_host} onChange={(e) => set({ public_host: e.target.value })} placeholder={form.query_host || "ts.example.com"} className="font-mono" />
                </Field>
                <Field label="Voice port">
                  <Input type="number" value={form.public_port} onChange={(e) => set({ public_port: e.target.value })} className="font-mono" />
                </Field>
              </div>
              <Field label="Shown as" hint="A friendly name, e.g. Alliance comms. Empty shows the server's own name.">
                <Input value={form.server_name} onChange={(e) => set({ server_name: e.target.value })} className="max-w-sm" />
              </Field>
            </Step>
            <Step n={3} title="How members appear" done={s.configured}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nickname and description" hint="The connect link fills the nickname in; the description is set on the server so admins see who's who.">
                  <Input value={form.nickname_format} onChange={(e) => set({ nickname_format: e.target.value })} className="font-mono" />
                </Field>
                <Field label="Linked members' group" hint="Every linked member with access is in it. Made for you if none is picked.">
                  <Select value={form.registered_sgid} onChange={(e) => set({ registered_sgid: e.target.value })}>
                    <option value="0">Make one called Registered</option>
                    {data.server_groups.map((g) => <option key={g.sgid} value={String(g.sgid)}>{g.name}</option>)}
                  </Select>
                </Field>
              </div>
              <p className="text-xs text-subtle">Placeholders: {"{character}"} {"{corp_ticker}"} {"{corp}"} {"{alliance_ticker}"} {"{alliance}"}.</p>
              <div className="divide-y divide-border border border-border px-3">
                <SwitchRow
                  label="Kick people who lose access"
                  description="Besides taking their groups away, kick them off the server if they're on it (at the next sync and when unlinked)."
                  checked={form.kick_without_access}
                  onCheckedChange={(v) => set({ kick_without_access: v })}
                />
                <SwitchRow
                  label="Must be linked to be compliant"
                  description="Members who may use TeamSpeak count as non-compliant until they've linked (Administration → Compliance and the Compliant group rule)."
                  checked={form.require_for_compliance}
                  onCheckedChange={(v) => set({ require_for_compliance: v })}
                />
              </div>
            </Step>
          </ol>
        </CardBody>
        <CardFooter>
          <Button variant="primary" loading={save.isPending} onClick={() => save.mutate()}>Save</Button>
        </CardFooter>
      </Card>

      <Card className="h-fit">
        <CardHeader title="How it works" />
        <CardBody className="space-y-3 text-sm text-muted">
          <p>
            Members get a one-time <b className="text-text">privilege key</b>. Using it in their TeamSpeak client puts them in the linked members' group and marks their
            identity, so this site knows which identity is theirs without passwords or nickname matching.
          </p>
          <p>
            From then on the site keeps their <b className="text-text">server groups</b> in step with their groups and state here: at every change, every six hours,
            and when they press Fix my groups. Groups you give by hand on the server are left alone.
          </p>
          <p>
            The query login needs to manage server groups, privilege keys and client database entries (the Server Admin Query group has all of it).
            Works with TeamSpeak 3 and TeamSpeak 6 servers.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}

// --- groups ------------------------------------------------------------------------------------------------------------

function GroupsTab({ data }: { data: Admin }) {
  const qc = useQueryClient();
  const [rows, setRows] = useState<Mapping[] | null>(null);
  const mappings = rows ?? data.mappings;
  const [target, setTarget] = useState("");
  const [sgid, setSgid] = useState("");
  const names = new Map(data.server_groups.map((g) => [g.sgid, g.name]));
  const save = useMutation({
    mutationFn: (m: Mapping[]) => api.put<Admin>(`${BASE}/admin/mappings`, { mappings: m }),
    onSuccess: (d) => { qc.setQueryData(KEY, d); setRows(null); qc.invalidateQueries({ queryKey: ["teamspeak", "me"] }); toast.success("Saved; everyone's groups are being updated"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const add = () => {
    const [kind, id] = target.split(":");
    if (!kind || !sgid) return;
    const label = kind === "group" ? data.groups.find((g) => g.id === Number(id))?.name : data.states.find((st) => st.id === Number(id))?.name;
    setRows([...mappings, { kind: kind as "group" | "state", target_id: Number(id), target: label, sgid: Number(sgid), sg_name: names.get(Number(sgid)) }]);
    setSgid("");
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <Card>
        <CardHeader title="Who is in which server group" description="Members of a group, or everyone in a state, get the server group. A person can match several rows." />
        <CardBody className="border-b border-border">
          <div className="flex flex-wrap items-end gap-3">
            <Field label="Group or state" className="min-w-56 flex-1">
              <Select value={target} onChange={(e) => setTarget(e.target.value)}>
                <option value="">Choose…</option>
                <optgroup label="States">
                  {data.states.map((st) => <option key={`s${st.id}`} value={`state:${st.id}`}>{st.name}</option>)}
                </optgroup>
                <optgroup label="Groups">
                  {data.groups.map((g) => <option key={`g${g.id}`} value={`group:${g.id}`}>{g.name}</option>)}
                </optgroup>
              </Select>
            </Field>
            <Field label="Server group" className="min-w-56 flex-1" hint="As on the server; check the connection under Setup to refresh the list.">
              <Select value={sgid} onChange={(e) => setSgid(e.target.value)}>
                <option value="">Choose…</option>
                {data.server_groups.filter((g) => g.sgid !== data.settings.registered_sgid).map((g) => <option key={g.sgid} value={String(g.sgid)}>{g.name}</option>)}
              </Select>
            </Field>
            <Button disabled={!target || !sgid} onClick={add}><Plus /> Add</Button>
          </div>
        </CardBody>
        {mappings.length === 0 ? (
          <EmptyState icon={<Headphones />} title="No groups mapped yet" description={`Linked members only get ${names.get(data.settings.registered_sgid) ?? "the linked members' group"} until you add some.`} />
        ) : (
          <ul className="divide-y divide-border">
            {mappings.map((m, i) => (
              <li key={`${m.kind}-${m.target_id}-${m.sgid}`} className="flex items-center gap-3 px-card py-3 text-sm">
                <Badge tone={m.kind === "state" ? "info" : "neutral"}>{m.kind}</Badge>
                <span className="min-w-0 flex-1 truncate font-medium">{m.target}</span>
                <span className="text-subtle">→</span>
                <span className={cn("min-w-0 flex-1 truncate", !names.has(m.sgid) && "text-danger-fg")}>{m.sg_name || names.get(m.sgid) || `group ${m.sgid}`}{!names.has(m.sgid) && " (not on the server)"}</span>
                <Button variant="ghost" size="icon-xs" aria-label="Remove" onClick={() => setRows(mappings.filter((_, j) => j !== i))}><Trash /></Button>
              </li>
            ))}
          </ul>
        )}
        {rows && (
          <CardFooter className="justify-between">
            <span className="text-xs text-muted">Unsaved changes</span>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setRows(null)}>Discard</Button>
              <Button variant="primary" loading={save.isPending} onClick={() => save.mutate(mappings)}>Save</Button>
            </div>
          </CardFooter>
        )}
      </Card>
      <Card className="h-fit">
        <CardHeader title="How groups work" />
        <CardBody className="space-y-3 text-sm text-muted">
          <p>Make server groups on the server (Permissions → Server Groups) and give them rights on channels. Then map your site groups and states to them here.</p>
          <p>Every linked member with access is also in <b className="text-text">{names.get(data.settings.registered_sgid) ?? "the linked members' group"}</b>; use it for everything members may do.</p>
          <p>Saving starts a sync for everyone. A group taken out of the mapping is taken away from everyone it was given to.</p>
        </CardBody>
      </Card>
    </div>
  );
}

// --- members -----------------------------------------------------------------------------------------------------------

function MembersTab() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["teamspeak", "members"], queryFn: () => api.get<MemberAccount[]>(`${BASE}/admin/members`) });
  const [q, setQ] = useState("");
  const [remove, setRemove] = useState<MemberAccount | null>(null);
  const refresh = () => qc.invalidateQueries({ queryKey: ["teamspeak"] });
  const syncAll = useMutation({
    mutationFn: () => api.post(`${BASE}/admin/sync`),
    onSuccess: () => toast.success("Syncing everyone in the background"),
    onError: (e: Error) => toast.error(e.message),
  });
  const syncOne = useMutation({
    mutationFn: (id: number) => api.post<MemberAccount>(`${BASE}/admin/members/${id}/sync`),
    onSuccess: () => { toast.success("Groups updated"); refresh(); },
    onError: (e: Error) => { toast.error(e.message); refresh(); },
  });
  const unlink = useMutation({
    mutationFn: ({ id, force }: { id: number; force: boolean }) => api.delete(`${BASE}/admin/members/${id}?force=${force}`),
    onSuccess: () => { toast.success("Unlinked"); refresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading || !data) return <Skeleton className="h-64" />;
  const needle = q.trim().toLowerCase();
  const rows = needle
    ? data.filter((m) => [m.user.name, m.status === "linked" ? m.nickname : "", m.status === "linked" ? m.uid : "", ...(m.characters ?? []).map((c) => c.name)].some((s) => s.toLowerCase().includes(needle)))
    : data;
  return (
    <Card>
      <TableToolbar>
        <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Member, character, nickname or identity" className="w-80" />
        <Button variant="secondary" loading={syncAll.isPending} onClick={() => syncAll.mutate()}><Refresh /> Sync everyone</Button>
      </TableToolbar>
      {rows.length === 0 ? (
        <EmptyState icon={<Headphones />} title={data.length ? "Nobody matches" : "Nobody has linked TeamSpeak yet"} />
      ) : (
        <Table>
          <THead>
            <tr>
              <Th>Member</Th>
              <Th>TeamSpeak</Th>
              <Th>Groups</Th>
              <Th>Status</Th>
              <Th />
            </tr>
          </THead>
          <tbody>
            {rows.map((m) => (
              <Tr key={m.user.id}>
                <Td>
                  <div className="flex items-center gap-3">
                    <Avatar src={m.user.portrait} name={m.user.name} size="sm" />
                    <div className="min-w-0">
                      <div className="truncate font-medium">{m.user.name}</div>
                      {!m.has_access && <Badge tone="warning">no access</Badge>}
                      <Characters list={m.characters ?? []} needle={needle} />
                    </div>
                  </div>
                </Td>
                <Td>
                  {m.status === "linked" ? (
                    <>
                      <div className="text-sm">{m.nickname || "—"}</div>
                      <div className="max-w-48 truncate font-mono text-xs text-subtle" title={m.uid}>{m.uid}</div>
                      {m.last_connected_at && <div className="text-xs text-subtle">last connected {timeAgo(m.last_connected_at)}</div>}
                    </>
                  ) : (
                    <span className="text-xs text-subtle">key made {timeAgo(m.started_at)}, not used yet</span>
                  )}
                </Td>
                <Td>
                  <div className="flex max-w-72 flex-wrap gap-1">
                    {m.groups_due.length ? m.groups_due.map((g) => <Badge key={g} tone="accent">{g}</Badge>) : <span className="text-xs text-subtle">none</span>}
                  </div>
                </Td>
                <Td>
                  {m.status === "pending" ? (
                    <Badge tone="neutral">Linking</Badge>
                  ) : m.error ? (
                    <div>
                      <Badge tone="danger">Problem</Badge>
                      <div className="mt-1 max-w-64 text-xs text-muted">{m.error}</div>
                    </div>
                  ) : (
                    <div>
                      <Badge tone="success">Linked</Badge>
                      {m.synced_at && <div className="mt-1 text-xs text-subtle">checked {timeAgo(m.synced_at)}</div>}
                    </div>
                  )}
                </Td>
                <Td align="right">
                  <DropdownMenu>
                    <DropdownTrigger asChild>
                      <Button variant="ghost" size="sm">Actions</Button>
                    </DropdownTrigger>
                    <DropdownContent align="end">
                      {m.status === "linked" && <DropdownItem onSelect={() => syncOne.mutate(m.user.id)}><Refresh /> Sync now</DropdownItem>}
                      {m.status === "linked" && <DropdownSeparator />}
                      <DropdownItem danger onSelect={() => setRemove(m)}><Unlink /> {m.status === "pending" ? "Cancel link" : "Unlink"}</DropdownItem>
                    </DropdownContent>
                  </DropdownMenu>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
      <ConfirmDialog
        open={!!remove}
        onOpenChange={(o) => !o && setRemove(null)}
        title={remove?.status === "pending" ? `Cancel ${remove?.user.name}'s link?` : `Unlink ${remove?.user.name}'s TeamSpeak identity?`}
        description={remove?.status === "pending" ? "Their key stops working; they can start again." : "Their server groups are taken away and they're told why. If the server can't be reached, the link is kept; unlink again with Forget anyway to drop it regardless."}
        danger
        confirmLabel={remove?.status === "pending" ? "Cancel link" : "Unlink"}
        onConfirm={async () => {
          if (!remove) return;
          try {
            await unlink.mutateAsync({ id: remove.user.id, force: false });
          } catch {
            if (remove.status === "linked" && window.confirm("The server couldn't be reached to take the groups away. Forget the link anyway?")) {
              await unlink.mutateAsync({ id: remove.user.id, force: true });
            }
          }
        }}
      />
    </Card>
  );
}

/** A member's main and the alts you may see; long lists fold, but a character matching the search always shows. */
function Characters({ list, needle }: { list: LinkedCharacter[]; needle: string }) {
  const [open, setOpen] = useState(false);
  if (!list.length) return null;
  const shown = open ? list : list.filter((c, i) => i < 3 || (needle && c.name.toLowerCase().includes(needle)));
  const name = (c: LinkedCharacter) => (
    <span className={cn("truncate", c.main ? "text-text" : "text-muted")}>
      {c.name}
      {c.corporation && <span className="ml-1 text-subtle">[{c.corporation}]</span>}
    </span>
  );
  return (
    <div className="mt-1.5 space-y-1">
      {shown.map((c) => (
        <div key={c.id} className="flex items-center gap-1.5 text-xs">
          <img src={c.portrait} alt="" className="size-4 shrink-0" />
          {c.viewable ? <Link to={`/characters/${c.id}`} className="flex min-w-0 hover:text-accent-ink hover:underline">{name(c)}</Link> : name(c)}
          {c.main && <Badge size="xs">main</Badge>}
        </div>
      ))}
      {list.length > shown.length && (
        <button type="button" onClick={() => setOpen(true)} className="text-xs text-accent-ink hover:underline">
          {list.length - shown.length} more character{list.length - shown.length === 1 ? "" : "s"}
        </button>
      )}
    </div>
  );
}
