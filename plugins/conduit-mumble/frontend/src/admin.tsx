// Server setup (mumble.manage_mumble): the server and its authenticator, group mapping, accounts and all temp links.
import {
  Alert, api, Avatar, Badge, Button, Card, CardBody, CardFooter, CardHeader, cn, ConfirmDialog, Dialog, DropdownContent, DropdownItem, DropdownMenu,
  DropdownSeparator, DropdownTrigger, EmptyState, Field, Input, PageHeader, SearchInput, Select, Skeleton, StatCard, SwitchRow, Table, TableToolbar,
  TabPanel, Tabs, Td, Th, THead, timeAgo, toast, Tr,
} from "@conduit/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { Link } from "react-router";

import { ArrowLeft, Check, Download, Key, Mic, Plus, Trash } from "./icons";
import { ConnectDetails, CopyField } from "./shared";
import { LinkCard } from "./temp";
import { type Admin, BASE, type LinkedCharacter, type Mapping, type MemberAccount, type TempLink } from "./types";

const KEY = ["mumble", "admin"];

export function AdminPage() {
  const { data, isLoading } = useQuery({ queryKey: KEY, queryFn: () => api.get<Admin>(`${BASE}/admin`) });
  const [tab, setTab] = useState<string | null>(null);
  const current = tab ?? (data?.settings.configured ? "groups" : "setup");
  const seen = data?.settings.authenticator_seen_at ? Date.now() - new Date(data.settings.authenticator_seen_at).getTime() : null;
  const alive = seen !== null && seen < 10 * 60_000;

  return (
    <>
      <PageHeader
        eyebrow={<Link to="/p/mumble" className="inline-flex items-center gap-1 hover:text-text"><ArrowLeft className="size-3" /> Mumble</Link>}
        title="Server setup"
        icon={<Mic />}
        description="Connect your Mumble server through its authenticator, decide which groups and states get which Mumble groups, and look after accounts and guest links."
      />
      {isLoading || !data ? (
        <Skeleton className="h-96" />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-4">
            <StatCard label="Server" value={data.settings.server_name || data.settings.host || "Not set"} tone={data.settings.configured ? "success" : "warning"} />
            <StatCard
              label="Authenticator"
              value={seen === null ? "Never seen" : alive ? "Running" : "Silent"}
              tone={seen === null ? "warning" : alive ? "success" : "danger"}
              hint={data.settings.authenticator_seen_at ? `last call ${timeAgo(data.settings.authenticator_seen_at)}${data.settings.authenticator_version ? ` · v${data.settings.authenticator_version}` : ""}` : "set it up under Setup"}
            />
            <StatCard label="Accounts" value={data.stats.accounts} />
            <StatCard label="Guests on comms" value={data.stats.temp_active} hint={`${data.stats.temp_links} open link${data.stats.temp_links === 1 ? "" : "s"}`} />
          </div>
          <Tabs
            variant="pills"
            value={current}
            onValueChange={setTab}
            className="space-y-4"
            items={[
              { value: "setup", label: "Setup" },
              { value: "groups", label: "Groups", count: data.mappings.length, disabled: !data.settings.configured },
              { value: "members", label: "Accounts", count: data.stats.accounts, disabled: !data.settings.configured },
              { value: "temp", label: "Guest links", count: data.stats.temp_links, disabled: !data.settings.configured },
            ]}
          >
            <TabPanel value="setup"><SetupTab data={data} /></TabPanel>
            <TabPanel value="groups"><GroupsTab data={data} /></TabPanel>
            <TabPanel value="members"><MembersTab /></TabPanel>
            <TabPanel value="temp"><TempTab /></TabPanel>
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
    host: s.host,
    port: String(s.port),
    server_name: s.server_name,
    username_format: s.username_format,
    display_format: s.display_format,
    allow_cert_auth: s.allow_cert_auth,
    temp_enabled: s.temp_enabled,
    temp_group: s.temp_group,
    temp_display_format: s.temp_display_format,
    temp_max_hours: String(s.temp_max_hours),
  });
  const save = useMutation({
    mutationFn: () => api.put<Admin>(`${BASE}/admin/settings`, { ...form, port: Number(form.port), temp_max_hours: Number(form.temp_max_hours) }),
    onSuccess: (d) => {
      qc.setQueryData(KEY, d);
      qc.invalidateQueries({ queryKey: ["mumble", "me"] });
      qc.invalidateQueries({ queryKey: ["mumble", "temp"] });
      toast.success("Saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));
  const seen = !!s.authenticator_seen_at;
  const file = (name: string) => `${BASE}/admin/authenticator/${name}`;

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
      <Card>
        <CardBody>
          <ol className="space-y-6">
            <Step n={1} title="Where members connect" done={!!s.host}>
              <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
                <Field label="Server address" hint="The host name members type into Mumble.">
                  <Input value={form.host} onChange={(e) => set({ host: e.target.value })} placeholder="voice.example.com" className="font-mono" />
                </Field>
                <Field label="Port">
                  <Input type="number" value={form.port} onChange={(e) => set({ port: e.target.value })} className="font-mono" />
                </Field>
              </div>
              <Field label="Shown as" hint="A friendly name, e.g. Alliance comms. Empty shows the address.">
                <Input value={form.server_name} onChange={(e) => set({ server_name: e.target.value })} className="max-w-sm" />
              </Field>
            </Step>
            <Step n={2} title="How members appear" done={!!s.host}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Login name" hint="Fixed when the account is made. Spaces become underscores.">
                  <Input value={form.username_format} onChange={(e) => set({ username_format: e.target.value })} className="font-mono" />
                </Field>
                <Field label="Name in Mumble" hint="Follows the main character at every login.">
                  <Input value={form.display_format} onChange={(e) => set({ display_format: e.target.value })} className="font-mono" />
                </Field>
              </div>
              <p className="text-xs text-subtle">Placeholders: {"{character}"} {"{corp_ticker}"} {"{corp}"} {"{alliance_ticker}"} {"{alliance}"}.</p>
              <div className="border border-border px-3">
                <SwitchRow
                  label="Remember client certificates"
                  description="After a member's first login with the password, their Mumble certificate alone gets them in (how Mumble normally works). Off: the password every time."
                  checked={form.allow_cert_auth}
                  onCheckedChange={(v) => set({ allow_cert_auth: v })}
                />
              </div>
            </Step>
            <Step n={3} title="Temporary access for guests" done={!!s.host}>
              <div className="border border-border px-3">
                <SwitchRow
                  label="Temporary access links"
                  description="People with the permission can make links that give guests a login for a while."
                  checked={form.temp_enabled}
                  onCheckedChange={(v) => set({ temp_enabled: v })}
                />
              </div>
              {form.temp_enabled && (
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Guests' Mumble group" hint="Give it rights on the guest channels in the server's ACLs.">
                    <Input value={form.temp_group} onChange={(e) => set({ temp_group: e.target.value })} className="font-mono" />
                  </Field>
                  <Field label="Guests appear as" hint="Placeholder: {name}.">
                    <Input value={form.temp_display_format} onChange={(e) => set({ temp_display_format: e.target.value })} className="font-mono" />
                  </Field>
                  <Field label="Longest link (hours)">
                    <Input type="number" min={1} max={720} value={form.temp_max_hours} onChange={(e) => set({ temp_max_hours: e.target.value })} className="font-mono" />
                  </Field>
                </div>
              )}
            </Step>
          </ol>
        </CardBody>
        <CardFooter>
          <Button variant="primary" loading={save.isPending} onClick={() => save.mutate()}>Save</Button>
        </CardFooter>
      </Card>

      <Card className="h-fit">
        <CardHeader title="The authenticator" description="A small program next to the Mumble server that asks this site about every login." />
        <CardBody className="space-y-4 text-sm">
          {seen ? (
            <Alert tone="success" title="It has called this site">Last call {timeAgo(s.authenticator_seen_at!)}{s.authenticator_version ? `, version ${s.authenticator_version}` : ""}.</Alert>
          ) : (
            <Alert tone="warning" title="Not running yet">Until it runs, nobody can sign in to Mumble with their account here.</Alert>
          )}
          <ol className="list-decimal space-y-3 pl-4 text-muted">
            <li>
              Under <Link to="/admin/api" className="text-accent-ink hover:underline">Administration → API</Link> switch on the <b>Mumble</b> API and make a key
              with the scope below. Copy the key: it's shown once.
              <div className="mt-2"><CopyField value={data.scope} label="scope" /></div>
            </li>
            <li>
              On the Mumble server, turn on Ice in <span className="font-mono">murmur.ini</span> (<span className="font-mono">ice="tcp -h 127.0.0.1 -p 6502"</span> and an
              <span className="font-mono"> icesecretwrite</span>), restart it, and install <span className="font-mono">zeroc-ice</span> for Python 3.
            </li>
            <li>
              Download these, put them in one folder, fill in the key and the Ice secret in the config, and start the authenticator (the unit file runs it
              as a service).
              <div className="mt-2 flex flex-wrap gap-2">
                <a href={file("conduit_mumble_authenticator.py")} download><Button variant="secondary" size="sm"><Download /> Authenticator</Button></a>
                <a href={file("authenticator.ini")} download><Button variant="secondary" size="sm"><Download /> Config</Button></a>
                <a href={file("conduit-mumble-authenticator.service")} download><Button variant="secondary" size="sm"><Download /> systemd unit</Button></a>
              </div>
            </li>
            <li>
              In Mumble, give the groups from the next tab (and the guests' group) their rights on the channels under Edit → ACL. The
              authenticator puts each person into their groups when they connect.
            </li>
          </ol>
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
  const [name, setName] = useState("");
  const save = useMutation({
    mutationFn: (m: Mapping[]) => api.put<Admin>(`${BASE}/admin/mappings`, { mappings: m }),
    onSuccess: (d) => { qc.setQueryData(KEY, d); setRows(null); toast.success("Saved; it applies at everyone's next connect"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const add = () => {
    const [kind, id] = target.split(":");
    const group = name.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "");
    if (!kind || !group) return;
    const label = kind === "group" ? data.groups.find((g) => g.id === Number(id))?.name : data.states.find((st) => st.id === Number(id))?.name;
    setRows([...mappings, { kind: kind as "group" | "state", target_id: Number(id), target: label, mumble_group: group }]);
    setName("");
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <Card>
        <CardHeader title="Who is in which Mumble group" description="Members of a group, or everyone in a state, are in the Mumble group. A person can match several rows." />
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
            <Field label="Mumble group" className="min-w-56 flex-1" hint="Lower-case letters, digits, - and _; as named in the server's ACLs.">
              <Input list="mumble-known-groups" value={name} onChange={(e) => setName(e.target.value)} placeholder="capitals" className="font-mono" onKeyDown={(e) => e.key === "Enter" && add()} />
              <datalist id="mumble-known-groups">{data.known_groups.map((g) => <option key={g} value={g} />)}</datalist>
            </Field>
            <Button disabled={!target || !name.trim()} onClick={add}><Plus /> Add</Button>
          </div>
        </CardBody>
        {mappings.length === 0 ? (
          <EmptyState icon={<Mic />} title="No groups mapped yet" description="Members connect without any Mumble group until you add some." />
        ) : (
          <ul className="divide-y divide-border">
            {mappings.map((m, i) => (
              <li key={`${m.kind}-${m.target_id}-${m.mumble_group}`} className="flex items-center gap-3 px-card py-3 text-sm">
                <Badge tone={m.kind === "state" ? "info" : "neutral"}>{m.kind}</Badge>
                <span className="min-w-0 flex-1 truncate font-medium">{m.target}</span>
                <span className="text-subtle">→</span>
                <span className="min-w-0 flex-1 truncate font-mono">{m.mumble_group}</span>
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
          <p>Mumble groups are just names. Create the same names on the server's root channel ACL (Edit → ACL → Groups) and give them rights on channels.</p>
          <p>Every time someone connects, the authenticator puts them into the groups their site groups and state map to. Changes apply when they next connect.</p>
          <p>Guests from temporary links get the guests' group from Setup (and more if a manager chose so on the link).</p>
        </CardBody>
      </Card>
    </div>
  );
}

// --- members -----------------------------------------------------------------------------------------------------------

function MembersTab() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["mumble", "members"], queryFn: () => api.get<MemberAccount[]>(`${BASE}/admin/members`) });
  const [q, setQ] = useState("");
  const [remove, setRemove] = useState<MemberAccount | null>(null);
  const [reset, setReset] = useState<{ m: MemberAccount; password?: string } | null>(null);
  const refresh = () => qc.invalidateQueries({ queryKey: ["mumble"] });
  const resetPw = useMutation({
    mutationFn: (id: number) => api.post<{ username: string; password: string }>(`${BASE}/admin/members/${id}/password`),
    onSuccess: (r) => { setReset((cur) => (cur ? { ...cur, password: r.password } : cur)); refresh(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: (id: number) => api.delete(`${BASE}/admin/members/${id}`),
    onSuccess: () => { toast.success("Account deleted"); refresh(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const { data: admin } = useQuery({ queryKey: KEY, queryFn: () => api.get<Admin>(`${BASE}/admin`) });

  if (isLoading || !data) return <Skeleton className="h-64" />;
  const needle = q.trim().toLowerCase();
  const rows = needle
    ? data.filter((m) => [m.user.name, m.username, m.display_name, ...(m.characters ?? []).map((c) => c.name)].some((s) => s.toLowerCase().includes(needle)))
    : data;
  return (
    <Card>
      <TableToolbar>
        <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Member, character or Mumble name" className="w-80" />
      </TableToolbar>
      {rows.length === 0 ? (
        <EmptyState icon={<Mic />} title={data.length ? "Nobody matches" : "Nobody has a Mumble account yet"} />
      ) : (
        <Table>
          <THead>
            <tr>
              <Th>Member</Th>
              <Th>Mumble</Th>
              <Th>Groups</Th>
              <Th>Last connected</Th>
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
                  <div className="text-sm">{m.display_name}</div>
                  <div className="font-mono text-xs text-subtle">{m.username}{m.certificate_remembered ? " · cert" : ""}</div>
                </Td>
                <Td>
                  <div className="flex max-w-72 flex-wrap gap-1">
                    {m.groups_due.length ? m.groups_due.map((g) => <Badge key={g} tone="accent">{g}</Badge>) : <span className="text-xs text-subtle">none</span>}
                  </div>
                </Td>
                <Td className="text-sm text-muted">{m.last_login_at ? timeAgo(m.last_login_at) : "never"}</Td>
                <Td align="right">
                  <DropdownMenu>
                    <DropdownTrigger asChild>
                      <Button variant="ghost" size="sm">Actions</Button>
                    </DropdownTrigger>
                    <DropdownContent align="end">
                      <DropdownItem onSelect={() => setReset({ m })}><Key /> New password</DropdownItem>
                      <DropdownSeparator />
                      <DropdownItem danger onSelect={() => setRemove(m)}><Trash /> Delete account</DropdownItem>
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
        title={`Delete ${remove?.user.name}'s Mumble account?`}
        description="They can't connect until they make a new one; they're told why."
        danger
        confirmLabel="Delete"
        onConfirm={() => remove && del.mutateAsync(remove.user.id)}
      />
      <Dialog
        open={!!reset}
        onOpenChange={(o) => !o && setReset(null)}
        title={`New password for ${reset?.m.user.name}`}
        description={reset?.password ? "Pass it on to them; it isn't shown again. They've been told you reset it." : "Their old password stops working straight away."}
        footer={
          reset?.password ? (
            <Button variant="primary" onClick={() => setReset(null)}>Done</Button>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setReset(null)}>Cancel</Button>
              <Button variant="primary" loading={resetPw.isPending} onClick={() => reset && resetPw.mutate(reset.m.user.id)}><Key /> Reset password</Button>
            </>
          )
        }
      >
        {reset?.password && admin && (
          <ConnectDetails server={{ name: admin.settings.server_name || admin.settings.host, host: admin.settings.host, port: admin.settings.port }} username={reset.m.username} password={reset.password} />
        )}
      </Dialog>
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

// --- all temporary links -----------------------------------------------------------------------------------------------

function TempTab() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["mumble", "admin", "temp"], queryFn: () => api.get<TempLink[]>(`${BASE}/admin/temp`) });
  const [revoking, setRevoking] = useState<TempLink | null>(null);
  const revoke = useMutation({
    mutationFn: (id: number) => api.delete<TempLink>(`${BASE}/temp/${id}`),
    onSuccess: () => { toast.success("Link withdrawn"); qc.invalidateQueries({ queryKey: ["mumble"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  if (isLoading || !data) return <Skeleton className="h-64" />;
  if (data.length === 0) {
    return <Card><EmptyState icon={<Mic />} title="No temporary links yet" description="People with the permission make them under Mumble → Temporary access." /></Card>;
  }
  return (
    <>
      <div className="grid gap-4 lg:grid-cols-2">
        {data.map((l) => <LinkCard key={l.id} link={l} showOwner onRevoke={() => setRevoking(l)} />)}
      </div>
      <ConfirmDialog
        open={!!revoking}
        onOpenChange={(o) => !o && setRevoking(null)}
        title={`Withdraw "${revoking?.label}"?`}
        description="The link stops working and its guests are cut off at their next connect."
        danger
        confirmLabel="Withdraw"
        onConfirm={() => revoking && revoke.mutateAsync(revoking.id)}
      />
    </>
  );
}
