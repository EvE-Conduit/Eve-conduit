// Server setup (discord.manage_discord): the Discord application and bot, role mapping, and linked members.
import {
  Alert, api, ApiError, Avatar, Badge, Button, Card, CardBody, CardFooter, CardHeader, cn, ConfirmDialog, DropdownContent, DropdownItem, DropdownMenu,
  DropdownSeparator, DropdownTrigger, EmptyState, Field, Input, PageHeader, SearchInput, Select, Skeleton, StatCard, SwitchRow, Table, TableToolbar,
  TabPanel, Tabs, Td, Th, THead, timeAgo, toast, Tr,
} from "@conduit/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { Link } from "react-router";

import { ArrowLeft, Check, Copy, DiscordLogo, ExternalLink, Plus, Refresh, Trash, Unlink } from "./icons";
import { type Admin, BASE, type Check as CheckResult, type LinkedCharacter, type LinkedMember, type Mapping } from "./types";

const KEY = ["discord", "admin"];

export function AdminPage() {
  const { data, isLoading } = useQuery({ queryKey: KEY, queryFn: () => api.get<Admin>(`${BASE}/admin`) });
  const [tab, setTab] = useState<string | null>(null);
  const current = tab ?? (data?.settings.configured ? "roles" : "setup");

  return (
    <>
      <PageHeader
        eyebrow={<Link to="/p/discord" className="inline-flex items-center gap-1 hover:text-text"><ArrowLeft className="size-3" /> Discord</Link>}
        title="Server setup"
        icon={<DiscordLogo />}
        description="Connect your Discord server, choose which groups and states get which roles, and keep an eye on linked members."
        actions={data?.settings.configured ? <SyncEveryone /> : undefined}
      />
      {isLoading || !data ? (
        <Skeleton className="h-96" />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Server" value={data.settings.guild_name || (data.settings.configured ? "Not checked yet" : "Not connected")} tone={data.settings.configured ? "success" : "warning"} />
            <StatCard label="Linked members" value={data.stats.linked} hint={data.settings.last_full_sync ? `full sync ${timeAgo(data.settings.last_full_sync)}` : "every 6 hours, and on every change"} />
            <StatCard label="Sync problems" value={data.stats.errors} tone={data.stats.errors ? "warning" : undefined} hint="see Members" />
          </div>
          <Tabs
            variant="pills"
            value={current}
            onValueChange={setTab}
            className="space-y-4"
            items={[
              { value: "setup", label: "Setup" },
              { value: "roles", label: "Roles", count: data.mappings.length, disabled: !data.settings.configured },
              { value: "members", label: "Members", count: data.stats.linked, disabled: !data.settings.configured },
            ]}
          >
            <TabPanel value="setup"><SetupTab data={data} /></TabPanel>
            <TabPanel value="roles"><RolesTab data={data} /></TabPanel>
            <TabPanel value="members"><MembersTab /></TabPanel>
          </Tabs>
        </div>
      )}
    </>
  );
}

function SyncEveryone() {
  const qc = useQueryClient();
  const sync = useMutation({
    mutationFn: () => api.post(`${BASE}/admin/sync`),
    onSuccess: () => {
      toast.success("Syncing everyone's roles; this takes a moment with many members");
      setTimeout(() => qc.invalidateQueries({ queryKey: ["discord"] }), 4000);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return <Button loading={sync.isPending} onClick={() => sync.mutate()}><Refresh /> Sync everyone</Button>;
}

// --- setup -------------------------------------------------------------------------------------------------------------

function CopyField({ value }: { value: string }) {
  return (
    <div className="flex items-stretch">
      <Input readOnly value={value} className="font-mono text-xs" onFocus={(e) => e.target.select()} />
      <Button
        variant="secondary"
        size="icon"
        aria-label="Copy"
        onClick={() => navigator.clipboard.writeText(value).then(() => toast.success("Copied"), () => toast.error("Couldn't copy; select the text instead"))}
      >
        <Copy />
      </Button>
    </div>
  );
}

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
    client_id: s.client_id,
    guild_id: s.guild_id,
    nickname_format: s.nickname_format,
    kick_without_access: s.kick_without_access,
    require_for_compliance: s.require_for_compliance,
  });
  const [secret, setSecret] = useState("");
  const [token, setToken] = useState("");
  const [check, setCheck] = useState<CheckResult | null>(null);
  const save = useMutation({
    mutationFn: () => api.put<Admin>(`${BASE}/admin/settings`, { ...form, client_secret: secret || null, bot_token: token || null }),
    onSuccess: (d) => {
      qc.setQueryData(KEY, d);
      qc.invalidateQueries({ queryKey: ["discord", "me"] });
      setSecret("");
      setToken("");
      toast.success("Saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const runCheck = useMutation({
    mutationFn: () => api.post<CheckResult>(`${BASE}/admin/check`),
    onSuccess: (r) => {
      setCheck(r);
      qc.setQueryData(["discord", "check"], r);
      qc.invalidateQueries({ queryKey: KEY });
    },
    onError: (e: Error) => { setCheck(null); toast.error(e.message); },
  });
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <Card>
        <CardBody>
          <ol className="space-y-6">
            <Step n={1} title="Create a Discord application" done={!!s.client_id && s.client_secret_set}>
              <p className="text-sm text-muted">
                Open the{" "}
                <a href="https://discord.com/developers/applications" target="_blank" rel="noreferrer" className="text-accent-ink underline-offset-4 hover:underline">
                  Discord developer portal
                </a>{" "}
                and press <b>New Application</b>. On its <b>OAuth2</b> page, add this redirect and copy the client id and secret here.
              </p>
              <Field label="Redirect">
                <CopyField value={data.redirect_uri} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Client id">
                  <Input value={form.client_id} onChange={(e) => set({ client_id: e.target.value })} placeholder="1234567890123456789" className="font-mono" />
                </Field>
                <Field label="Client secret" hint={s.client_secret_set ? "Saved. Type a new one to replace it." : undefined}>
                  <Input type="password" autoComplete="off" value={secret} onChange={(e) => setSecret(e.target.value)} placeholder={s.client_secret_set ? "••••••••••••" : ""} className="font-mono" />
                </Field>
              </div>
            </Step>
            <Step n={2} title="Add the bot to your server" done={s.bot_token_set && !!s.guild_id}>
              <p className="text-sm text-muted">
                On the application's <b>Bot</b> page press <b>Reset Token</b> and paste it here. For the server id, turn on Developer Mode in Discord
                (Settings → Advanced), then right-click the server → <b>Copy Server ID</b>.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Bot token" hint={s.bot_token_set ? "Saved. Paste a new one to replace it." : undefined}>
                  <Input type="password" autoComplete="off" value={token} onChange={(e) => setToken(e.target.value)} placeholder={s.bot_token_set ? "••••••••••••" : ""} className="font-mono" />
                </Field>
                <Field label="Server id">
                  <Input value={form.guild_id} onChange={(e) => set({ guild_id: e.target.value })} placeholder="1234567890123456789" className="font-mono" />
                </Field>
              </div>
              {data.invite_url ? (
                <a href={data.invite_url} target="_blank" rel="noreferrer">
                  <Button variant="outline"><DiscordLogo /> Invite the bot to the server</Button>
                </a>
              ) : (
                <p className="text-xs text-subtle">Save the client id to get the link that invites the bot.</p>
              )}
              <p className="text-xs text-subtle">
                It asks for Manage Roles, Manage Nicknames, Create Invite and Kick Members. Afterwards drag the bot's role above every role it should give
                (Server Settings → Roles).
              </p>
            </Step>
            <Step n={3} title="Choose how members appear" done={s.configured}>
              <Field label="Nickname" hint={<>Placeholders: {"{character}"} {"{corp_ticker}"} {"{corp}"} {"{alliance_ticker}"} {"{alliance}"}. Leave empty to let people pick their own.</>}>
                <Input value={form.nickname_format} onChange={(e) => set({ nickname_format: e.target.value })} placeholder="[{corp_ticker}] {character}" className="max-w-sm font-mono" />
              </Field>
              <div className="border border-border px-3">
                <SwitchRow
                  label="Remove people who lose access from the server"
                  description="Off: they only lose the roles this site gave them. On: they're kicked and have to link again once they have access."
                  checked={form.kick_without_access}
                  onCheckedChange={(v) => set({ kick_without_access: v })}
                />
                <SwitchRow
                  label="Must be on the Discord server to be compliant"
                  description="Members who may link Discord count as not compliant until they've linked it and while they're not on the server (Administration → Compliance, and the Compliant group rule). Leaving is noticed at the next sync, at most 6 hours later."
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
        <CardHeader title="Connection" description="Asks Discord whether everything is in place." />
        <CardBody className="space-y-4">
          {check ? (
            <>
              <div className="flex items-center gap-3">
                {check.guild.icon ? <img src={check.guild.icon} alt="" className="size-12" /> : <span className="grid size-12 place-items-center bg-accent-soft text-accent-ink"><DiscordLogo className="size-6" /></span>}
                <div>
                  <div className="font-medium">{check.guild.name}</div>
                  <div className="text-xs text-subtle">bot: {check.bot.name} {check.bot.on_server ? "· on the server" : "· not on the server"}</div>
                </div>
              </div>
              {check.problems.length === 0 ? (
                <Alert tone="success" title="All good">The bot can add members, give the mapped roles and set nicknames.</Alert>
              ) : (
                <Alert tone="warning" title={`${check.problems.length} thing${check.problems.length === 1 ? "" : "s"} to fix`}>
                  <ul className="list-disc space-y-1 pl-4">
                    {check.problems.map((p) => <li key={p}>{p}</li>)}
                  </ul>
                </Alert>
              )}
            </>
          ) : (
            <p className="text-sm text-muted">{s.bot_token_set && s.guild_id ? "Not checked yet." : "Save the bot token and server id first."}</p>
          )}
          <Button className="w-full" disabled={!s.bot_token_set || !s.guild_id} loading={runCheck.isPending} onClick={() => runCheck.mutate()}>
            <Refresh /> Check connection
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}

// --- roles -------------------------------------------------------------------------------------------------------------

function RolesTab({ data }: { data: Admin }) {
  const qc = useQueryClient();
  const { data: check, isLoading, error } = useQuery({
    queryKey: ["discord", "check"],
    queryFn: () => api.post<CheckResult>(`${BASE}/admin/check`),
    staleTime: 60_000,
    retry: false,
  });
  const [rows, setRows] = useState<Mapping[] | null>(null);
  const mappings = rows ?? data.mappings;
  const [target, setTarget] = useState("");
  const [role, setRole] = useState("");
  const save = useMutation({
    mutationFn: (m: Mapping[]) => api.put<Admin>(`${BASE}/admin/mappings`, { mappings: m }),
    onSuccess: (d) => {
      qc.setQueryData(KEY, d);
      setRows(null);
      toast.success("Saved; everyone's roles are being updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const roles = check?.roles ?? [];
  const roleById = Object.fromEntries(roles.map((r) => [r.id, r]));
  const add = () => {
    const [kind, id] = target.split(":");
    const r = roleById[role];
    if (!kind || !r) return;
    const name = kind === "group" ? data.groups.find((g) => g.id === Number(id))?.name : data.states.find((st) => st.id === Number(id))?.name;
    setRows([...mappings, { kind: kind as "group" | "state", target_id: Number(id), target: name, role_id: r.id, role_name: r.name }]);
    setRole("");
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <Card>
        <CardHeader title="Who gets which role" description="Members of a group, or everyone in a state, get the role. A person can match several rows." />
        {error ? (
          <CardBody><Alert tone="warning" title="Couldn't load the server's roles">{(error as Error).message}</Alert></CardBody>
        ) : (
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
              <Field label="Discord role" className="min-w-56 flex-1">
                <Select value={role} onChange={(e) => setRole(e.target.value)} disabled={isLoading}>
                  <option value="">{isLoading ? "Loading roles…" : "Choose…"}</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id} disabled={!r.assignable}>
                      @{r.name}{r.assignable ? "" : " (above the bot)"}
                    </option>
                  ))}
                </Select>
              </Field>
              <Button disabled={!target || !role} onClick={add}><Plus /> Add</Button>
            </div>
          </CardBody>
        )}
        {mappings.length === 0 ? (
          <EmptyState icon={<DiscordLogo />} title="No roles mapped yet" description="Linked members join the server without any roles until you add some." />
        ) : (
          <ul className="divide-y divide-border">
            {mappings.map((m, i) => {
              const r = roleById[m.role_id];
              return (
                <li key={`${m.kind}-${m.target_id}-${m.role_id}`} className="flex items-center gap-3 px-card py-3 text-sm">
                  <Badge tone={m.kind === "state" ? "info" : "neutral"}>{m.kind}</Badge>
                  <span className="min-w-0 flex-1 truncate font-medium">{m.target}</span>
                  <span className="text-subtle">→</span>
                  <span className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="size-2.5 shrink-0 rounded-full border border-border" style={{ background: r?.color ?? "transparent" }} />
                    <span className="truncate">@{r?.name ?? m.role_name ?? m.role_id}</span>
                    {check && !r && <Badge tone="danger">deleted</Badge>}
                    {r && !r.assignable && <Badge tone="warning">above the bot</Badge>}
                  </span>
                  <Button variant="ghost" size="icon-xs" aria-label="Remove" onClick={() => setRows(mappings.filter((_, j) => j !== i))}><Trash /></Button>
                </li>
              );
            })}
          </ul>
        )}
        {rows && (
          <CardFooter className="justify-between">
            <span className="text-xs text-muted">Unsaved changes</span>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setRows(null)}>Discard</Button>
              <Button variant="primary" loading={save.isPending} onClick={() => save.mutate(mappings)}>Save and sync</Button>
            </div>
          </CardFooter>
        )}
      </Card>
      <Card className="h-fit">
        <CardHeader title="How roles are kept" />
        <CardBody className="space-y-3 text-sm text-muted">
          <p>Roles change as soon as someone joins or leaves a group, their state changes or they pick another main, and everyone is checked again every 6 hours.</p>
          <p>Only mapped roles are touched. Roles you give by hand on Discord stay.</p>
          <p>The bot can only give roles below its own; drag its role up in Server Settings → Roles if a role shows "above the bot".</p>
        </CardBody>
      </Card>
    </div>
  );
}

// --- members -----------------------------------------------------------------------------------------------------------

function MembersTab() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["discord", "members"], queryFn: () => api.get<LinkedMember[]>(`${BASE}/admin/members`) });
  const [q, setQ] = useState("");
  const [remove, setRemove] = useState<{ m: LinkedMember; kick: boolean } | null>(null);
  const refresh = () => qc.invalidateQueries({ queryKey: ["discord"] });
  const sync = useMutation({
    mutationFn: (id: number) => api.post<{ error?: string; removed?: boolean }>(`${BASE}/admin/members/${id}/sync`),
    onSuccess: (r) => {
      if (r.removed) toast.success("They no longer have access and were removed from the server");
      else if (r.error) toast.error(r.error);
      else toast.success("Roles updated");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const unlink = useMutation({
    mutationFn: ({ id, kick, force = false }: { id: number; kick: boolean; force?: boolean }) =>
      api.delete(`${BASE}/admin/members/${id}?kick=${kick}${force ? "&force=true" : ""}`),
    onSuccess: () => { toast.success("Unlinked"); refresh(); },
    onError: (e: Error, vars) => {
      // Discord couldn't take the roles away, so the link was kept. Forgetting it anyway leaves the roles on Discord.
      if (e instanceof ApiError && e.status === 502 && !vars.force) {
        toast.error(e.message, {
          action: { label: "Forget anyway", onClick: () => unlink.mutate({ ...vars, force: true }) },
          description: "Forgetting it leaves their roles on Discord; take them off there by hand.",
        });
      } else toast.error(e.message);
    },
  });

  if (isLoading || !data) return <Skeleton className="h-64" />;
  const needle = q.trim().toLowerCase();
  // Match the member, their Discord name and nickname, or any of their characters you can see (find the Discord
  // account behind an alt).
  const rows = needle
    ? data.filter((m) =>
        [m.user.name, m.username, m.nickname ?? "", ...(m.characters ?? []).map((c) => c.name)].some((s) => s.toLowerCase().includes(needle)),
      )
    : data;
  return (
    <Card>
      <TableToolbar>
        <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Member, character or Discord name" className="w-80" />
      </TableToolbar>
      {rows.length === 0 ? (
        <EmptyState icon={<DiscordLogo />} title={data.length ? "Nobody matches" : "Nobody has linked Discord yet"} />
      ) : (
        <Table>
          <THead>
            <tr>
              <Th>Member</Th>
              <Th>Discord</Th>
              <Th>Roles</Th>
              <Th>Checked</Th>
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
                      {!m.on_server && <Badge tone="danger">not on the server</Badge>}
                      <Characters list={m.characters ?? []} needle={needle} />
                    </div>
                  </div>
                </Td>
                <Td>
                  <div className="flex items-center gap-2.5">
                    <Avatar src={m.avatar} name={m.username} size="xs" rounded="full" />
                    <div className="min-w-0">
                      <div className="truncate text-sm">{m.username}</div>
                      {m.nickname && <div className="truncate text-xs text-subtle">{m.nickname}</div>}
                    </div>
                  </div>
                </Td>
                <Td>
                  <div className="flex max-w-72 flex-wrap gap-1">
                    {m.role_names.length ? m.role_names.map((r) => <Badge key={r} tone="accent">@{r}</Badge>) : <span className="text-xs text-subtle">none</span>}
                  </div>
                </Td>
                <Td className="text-sm">
                  {m.error ? <span className="text-warning-fg" title={m.error}>{m.error.length > 60 ? `${m.error.slice(0, 60)}…` : m.error}</span> : <span className="text-muted">{timeAgo(m.synced_at)}</span>}
                </Td>
                <Td align="right">
                  <DropdownMenu>
                    <DropdownTrigger asChild>
                      <Button variant="ghost" size="sm">Actions</Button>
                    </DropdownTrigger>
                    <DropdownContent align="end">
                      <DropdownItem onSelect={() => sync.mutate(m.user.id)}><Refresh /> Sync now</DropdownItem>
                      <DropdownItem onSelect={() => window.open(`https://discord.com/users/${m.discord_id}`, "_blank", "noreferrer")}><ExternalLink /> Discord profile</DropdownItem>
                      <DropdownSeparator />
                      <DropdownItem onSelect={() => setRemove({ m, kick: false })}><Unlink /> Unlink</DropdownItem>
                      <DropdownItem danger onSelect={() => setRemove({ m, kick: true })}><Trash /> Unlink and kick</DropdownItem>
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
        title={remove?.kick ? `Kick ${remove?.m.user.name} from the server?` : `Unlink ${remove?.m.user.name}'s Discord?`}
        description={remove?.kick ? "They're removed from the server and the link is forgotten. They can link again while they have access." : "The roles this site gave them are taken away and the link is forgotten. They stay on the server."}
        danger
        confirmLabel={remove?.kick ? "Kick" : "Unlink"}
        onConfirm={() => remove && unlink.mutateAsync({ id: remove.m.user.id, kick: remove.kick })}
      />
    </Card>
  );
}

/** A member's main and the alts you may see; long lists fold, but a character matching the search always shows. */
function Characters({ list, needle }: { list: LinkedCharacter[]; needle: string }) {
  const [open, setOpen] = useState(false);
  const alts = list.filter((c) => !c.main);
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
      {open && list.length > 3 && (
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-subtle hover:underline">Show fewer</button>
      )}
      {alts.length === 0 && <div className="text-[11px] text-subtle">No alts you can see</div>}
    </div>
  );
}
