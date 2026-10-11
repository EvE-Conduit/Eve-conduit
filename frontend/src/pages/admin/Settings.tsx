import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Construction, DoorOpen, KeyRound, Link2, Palette, PencilLine, Plus, Save, Search, Settings2, ShieldPlus, Trash2, UserMinus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

import { BrandingForm, type BrandingValues } from "@/components/BrandingForm";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Alert, Spinner } from "@/components/ui/feedback";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/api";
import { applyBranding, useBootstrap, useRefreshBootstrap } from "@/lib/bootstrap";
import type { Bootstrap, CharacterBrief, SiteNavLink } from "@/lib/types";
import { timeAgo } from "@/lib/utils";

import { IconPicker } from "./LandingEditor";

const MAX_NAV_LINKS = 20;

interface Values extends BrandingValues {
  maintenance_mode: boolean;
  maintenance_message: string;
  start_page: string;
  nav_links: SiteNavLink[];
  nav_links_title: string;
}

export function AdminSettings() {
  const { site, user, plugins } = useBootstrap();
  const refresh = useRefreshBootstrap();
  const initial: Values = {
    name: site.name,
    tagline: site.tagline,
    accent: site.accent,
    logo_url: site.logo_url,
    maintenance_mode: site.maintenance.enabled,
    maintenance_message: site.maintenance.message,
    start_page: site.start_page,
    nav_links: site.nav_links ?? [],
    nav_links_title: site.nav_links_title ?? "Links",
  };
  const [values, setValues] = useState<Values>(initial);
  const [confirmMaintenance, setConfirmMaintenance] = useState(false);
  const dirty = JSON.stringify(values) !== JSON.stringify(initial);

  const save = useMutation({
    mutationFn: (v: Values) => api.put<Bootstrap["site"]>("/api/admin/site", v),
    onSuccess: (saved) => {
      applyBranding(saved);
      refresh();
      toast.success("Settings saved");
    },
    onError: (e) => toast.error(e.message),
  });

  // Turning maintenance mode on locks members out, so that asks first.
  const submit = () => (values.maintenance_mode && !initial.maintenance_mode ? setConfirmMaintenance(true) : save.mutate(values));

  const discard = () => {
    setValues(initial);
    applyBranding(site);
  };

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Settings"
        icon={<Settings2 />}
        description="How your site looks, where members land after signing in, sidebar links, who the administrators are, and maintenance mode."
        actions={
          <>
            <Button variant="ghost" disabled={!dirty} onClick={discard}>
              Discard
            </Button>
            <Button
              variant="primary"
              disabled={!dirty}
              loading={save.isPending}
              onClick={submit}
            >
              Save changes
            </Button>
          </>
        }
      />
      <div className="space-y-6">
        <Card>
          <CardHeader icon={<Palette />} title="Branding" description="Name, tagline, logo and accent colour. The accent previews live across the site." />
          <CardBody className="p-6 sm:p-8">
            <BrandingForm value={values} onChange={(b) => setValues({ ...values, ...b })} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            icon={<DoorOpen />}
            title="Start page"
            description="Where people land after signing in. Links to other pages still take them there."
            actions={
              <Link to="/admin/settings/landing">
                <Button size="sm" variant="subtle">
                  <PencilLine /> Edit landing page
                </Button>
              </Link>
            }
          />
          <CardBody>
            <Field label="After signing in, show" hint="Plugin pages appear here once the plugin is enabled, e.g. Announcements.">
              <Select value={values.start_page} onChange={(e) => setValues({ ...values, start_page: e.target.value })} className="max-w-sm">
                {startPages(plugins, values.start_page).map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </Select>
            </Field>
          </CardBody>
        </Card>

        <SidebarLinks
          title={values.nav_links_title}
          links={values.nav_links}
          onChange={(patch) => setValues({ ...values, ...patch })}
          dirty={dirty}
          saving={save.isPending}
          onSave={submit}
        />

        <EveApplication />

        {user?.is_admin && <Administrators />}

        <Card>
          <CardHeader
            icon={<Construction />}
            title="Maintenance mode"
            description="While it's on, only people who can manage the site get in. Everyone else sees your message."
            actions={
              <Switch
                aria-label="Maintenance mode"
                checked={values.maintenance_mode}
                onCheckedChange={(maintenance_mode) => setValues({ ...values, maintenance_mode })}
              />
            }
          />
          <CardBody className="space-y-4">
            {initial.maintenance_mode && (
              <Alert tone="warning" title="Maintenance mode is on">
                Members can't use the site until you switch it off.
              </Alert>
            )}
            <Field label="Message" hint={`Shown on the maintenance screen. ${300 - values.maintenance_message.length} characters left.`}>
              <Textarea
                value={values.maintenance_message}
                maxLength={300}
                onChange={(e) => setValues({ ...values, maintenance_message: e.target.value })}
                placeholder="We're upgrading the server. Back within the hour, o7"
              />
            </Field>
          </CardBody>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmMaintenance}
        onOpenChange={setConfirmMaintenance}
        danger
        title="Turn on maintenance mode?"
        description="Everyone without site-management permission is locked out until you switch it off again."
        confirmLabel="Turn on and save"
        onConfirm={() => save.mutateAsync(values)}
      />
    </>
  );
}

/** Pages that make sense to land on: the dashboard, a few core pages, and every enabled plugin's pages. */
function startPages(plugins: Bootstrap["plugins"], current: string) {
  const pages = [
    { value: "/home", label: "Home (landing page)" },
    { value: "", label: "Dashboard" },
    { value: "/characters", label: "Characters" },
    { value: "/groups", label: "Groups" },
    ...plugins.flatMap((p) =>
      p.nav.map((n) => ({ value: `/p/${p.id}${n.path ? `/${n.path.replace(/^\//, "")}` : ""}`, label: `${n.label} (${p.name})` })),
    ),
  ];
  if (current && !pages.some((p) => p.value === current)) pages.push({ value: current, label: `${current} (plugin not enabled)` });
  return pages;
}

/** Extra links in everyone's sidebar, e.g. the alliance wiki, killboard or Discord invite. */
function SidebarLinks({
  title,
  links,
  onChange,
  dirty,
  saving,
  onSave,
}: {
  title: string;
  links: SiteNavLink[];
  onChange: (patch: { nav_links_title?: string; nav_links?: SiteNavLink[] }) => void;
  /** Saves the whole page, like the button at the top. */
  dirty: boolean;
  saving: boolean;
  onSave: () => void;
}) {
  const set = (next: SiteNavLink[]) => onChange({ nav_links: next });
  const update = (i: number, patch: Partial<SiteNavLink>) => set(links.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const move = (i: number, d: -1 | 1) => {
    const next = [...links];
    [next[i], next[i + d]] = [next[i + d]!, next[i]!];
    set(next);
  };
  return (
    <Card>
      <CardHeader
        icon={<Link2 />}
        title="Sidebar links"
        description="Extra links in everyone's sidebar, like your wiki, killboard or Discord invite. Other websites open in a new tab."
        actions={
          <>
            <Button
              size="sm"
              variant="subtle"
              disabled={links.length >= MAX_NAV_LINKS}
              onClick={() => set([...links, { label: "", url: "https://", icon: "globe" }])}
            >
              <Plus /> Add link
            </Button>
            <Button size="sm" variant="primary" disabled={!dirty} loading={saving} onClick={onSave}>
              <Save /> Save settings
            </Button>
          </>
        }
      />
      <CardBody className="space-y-4">
        <Field label="Section heading" hint="Shown above the links in the sidebar.">
          <Input value={title} maxLength={40} onChange={(e) => onChange({ nav_links_title: e.target.value })} placeholder="Links" className="max-w-sm" />
        </Field>
        {!links.length && <p className="text-sm text-subtle">No links yet. The section stays hidden until you add one.</p>}
        {links.map((link, i) => (
          <div key={i} className="flex gap-3 border border-border p-4">
            <div className="grid min-w-0 flex-1 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1.5fr_200px]">
              <Field label="Label">
                <Input value={link.label} maxLength={40} onChange={(e) => update(i, { label: e.target.value })} placeholder="Alliance wiki" />
              </Field>
              <Field label="Address" hint="An https:// address, or a page on this site like /p/timers.">
                <Input value={link.url} maxLength={500} onChange={(e) => update(i, { url: e.target.value })} placeholder="https://wiki.example.com" />
              </Field>
              <IconPicker value={link.icon} onChange={(icon) => update(i, { icon })} />
            </div>
            <div className="flex shrink-0 flex-col gap-1">
              <Button size="icon-xs" variant="ghost" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
                <ArrowUp />
              </Button>
              <Button size="icon-xs" variant="ghost" aria-label="Move down" disabled={i === links.length - 1} onClick={() => move(i, 1)}>
                <ArrowDown />
              </Button>
              <Button size="icon-xs" variant="ghost" aria-label="Remove" className="hover:text-danger-fg" onClick={() => set(links.filter((_, j) => j !== i))}>
                <Trash2 />
              </Button>
            </div>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}

interface AdminUser {
  id: number;
  name: string;
  main: CharacterBrief | null;
  is_you: boolean;
  is_owner: boolean;
  last_login: string | null;
}

/** Who has full access. Only administrators see this; changes apply straight away. */
function Administrators() {
  const qc = useQueryClient();
  const refresh = useRefreshBootstrap();
  const key = ["admin", "admins"];
  const { data } = useQuery({ queryKey: key, queryFn: () => api.get<AdminUser[]>("/api/admin/admins") });
  const [q, setQ] = useState("");
  const [dq, setDq] = useState("");
  const [adding, setAdding] = useState<{ id: number; name: string } | null>(null);
  const [removing, setRemoving] = useState<AdminUser | null>(null);
  useEffect(() => {
    const t = setTimeout(() => setDq(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);
  const { data: hits, isLoading: searching } = useQuery({
    queryKey: ["admin", "user-lookup", dq],
    queryFn: () => api.get<{ id: number; name: string; portrait: string | null }[]>(`/api/admin/users/lookup?q=${encodeURIComponent(dq)}`),
    enabled: dq.length >= 2,
  });
  const done = (list: AdminUser[], msg: string) => {
    qc.setQueryData(key, list);
    setQ("");
    refresh();
    toast.success(msg);
  };
  const add = useMutation({
    mutationFn: (id: number) => api.post<AdminUser[]>(`/api/admin/admins/${id}`),
    onSuccess: (list) => done(list, `${adding?.name} is now an administrator`),
    onError: (e) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: (id: number) => api.delete<AdminUser[]>(`/api/admin/admins/${id}`),
    onSuccess: (list) => done(list, `${removing?.name} is no longer an administrator`),
    onError: (e) => toast.error(e.message),
  });
  const ids = new Set((data ?? []).map((a) => a.id));
  const candidates = (hits ?? []).filter((h) => !ids.has(h.id));

  return (
    <Card>
      <CardHeader
        icon={<ShieldPlus />}
        title="Administrators"
        description="Administrators can do everything, including choosing other administrators. The super admin, who claimed the site, always stays one. For narrower jobs, give a group the permissions it needs instead."
      />
      <CardBody className="space-y-4">
        <ul className="divide-y divide-border border border-border">
          {(data ?? []).map((a) => (
            <li key={a.id} className="flex items-center gap-3 px-3 py-2.5">
              <Avatar src={a.main?.portrait} name={a.name} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-sm font-medium">
                  {a.name}
                  {a.is_owner && <Badge size="xs" tone="warning">Super admin</Badge>}
                  {a.is_you && <Badge size="xs" tone="accent">You</Badge>}
                </div>
                <div className="truncate text-xs text-muted">
                  {a.main?.corporation?.name ?? "No corporation"} · last signed in {timeAgo(a.last_login)}
                </div>
              </div>
              {a.is_owner ? (
                <span className="px-3 text-xs text-subtle" title="Claimed the site with the setup code, so always stays an administrator">
                  Can't be removed
                </span>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={(data ?? []).length <= 1}
                  title={(data ?? []).length <= 1 ? "The site needs at least one administrator" : undefined}
                  onClick={() => setRemoving(a)}
                >
                  <UserMinus /> Remove
                </Button>
              )}
            </li>
          ))}
        </ul>
        <div>
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Add an administrator: search by character name" className="pl-9" aria-label="Add an administrator" />
          </div>
          {dq.length >= 2 && (
            <div className="mt-2 max-w-md">
              {searching ? (
                <Spinner className="px-2 py-1.5" />
              ) : !candidates.length ? (
                <p className="px-2 py-1.5 text-xs text-subtle">Nobody by that name who isn't already an administrator.</p>
              ) : (
                <ul className="space-y-1">
                  {candidates.map((h) => (
                    <li key={h.id} className="flex items-center gap-3 px-2 py-1.5 hover:bg-hover">
                      <Avatar src={h.portrait ?? undefined} name={h.name} size="xs" />
                      <span className="min-w-0 flex-1 truncate text-sm">{h.name}</span>
                      <Button size="xs" variant="subtle" onClick={() => setAdding(h)}>
                        <ShieldPlus /> Make admin
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </CardBody>
      <ConfirmDialog
        open={!!adding}
        onOpenChange={(o) => !o && setAdding(null)}
        danger
        title={`Make ${adding?.name} an administrator?`}
        description="They get every permission on the site, including changing settings, signing in as members and choosing administrators. They're told by notification."
        confirmLabel={<><ShieldPlus /> Make administrator</>}
        onConfirm={() => adding && add.mutateAsync(adding.id)}
      />
      <ConfirmDialog
        open={!!removing}
        onOpenChange={(o) => !o && setRemoving(null)}
        danger
        title={removing?.is_you ? "Stop being an administrator?" : `Remove ${removing?.name} as an administrator?`}
        description={
          removing?.is_you
            ? "You keep only what your state and groups give you, and can't undo this yourself."
            : "They keep only what their state and groups give them."
        }
        confirmLabel={<><UserMinus /> Remove</>}
        onConfirm={() => removing && remove.mutateAsync(removing.id)}
      />
    </Card>
  );
}

interface SsoInfo {
  configured: boolean;
  source: "env" | "site" | "";
  client_id: string;
  callback_url: string;
}

/** The EVE application members sign in through. Entered here (or in the setup wizard) unless the config file sets it. */
function EveApplication() {
  const qc = useQueryClient();
  const refresh = useRefreshBootstrap();
  const key = ["admin", "sso"];
  const { data } = useQuery({ queryKey: key, queryFn: () => api.get<SsoInfo>("/api/admin/site/sso") });
  const [editing, setEditing] = useState(false);
  const [clientId, setClientId] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [confirm, setConfirm] = useState<"change" | "remove" | null>(null);
  const save = useMutation({
    mutationFn: (v: { client_id: string; secret_key: string }) => api.put<SsoInfo>("/api/admin/site/sso", v),
    onSuccess: (info) => {
      qc.setQueryData(key, info);
      setEditing(false);
      setClientId("");
      setSecretKey("");
      refresh();
      toast.success(info.configured ? "EVE application saved" : "EVE application removed");
    },
    onError: (e) => toast.error(e.message),
  });
  if (!data) return null;
  const fromEnv = data.source === "env";
  const submit = () => (data.configured ? setConfirm("change") : save.mutate({ client_id: clientId, secret_key: secretKey }));

  return (
    <Card>
      <CardHeader
        icon={<KeyRound />}
        title="EVE application"
        description="Members sign in through an application registered with CCP at developers.eveonline.com. Its callback URL must be exactly the one shown here, with every scope selected."
      />
      <CardBody className="space-y-4">
        <div className="grid gap-3 text-sm sm:grid-cols-[10rem_1fr]">
          <span className="text-muted">Status</span>
          <span>
            {data.configured ? (
              <Badge tone="success">Connected</Badge>
            ) : (
              <Badge tone="warning">Not connected: nobody can sign in</Badge>
            )}
          </span>
          <span className="text-muted">Client ID</span>
          <code className="font-mono text-xs">{data.client_id || "—"}</code>
          <span className="text-muted">Callback URL</span>
          <code className="font-mono text-xs">{data.callback_url}</code>
          <span className="text-muted">Set in</span>
          <span>{fromEnv ? "the server's config file (ESI_CLIENT_ID / ESI_SECRET_KEY)" : data.configured ? "this page" : "nowhere yet"}</span>
        </div>
        {fromEnv ? (
          <Alert tone="info">To change the application, edit the config file on the server and restart EvE Conduit.</Alert>
        ) : editing || !data.configured ? (
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <Field label="Client ID" required>
              <Input value={clientId} onChange={(e) => setClientId(e.target.value)} className="font-mono" autoComplete="off" spellCheck={false} />
            </Field>
            <Field label="Secret Key" required>
              <Input type="password" value={secretKey} onChange={(e) => setSecretKey(e.target.value)} className="font-mono" autoComplete="new-password" />
            </Field>
            <div className="flex gap-2 sm:col-span-2">
              <Button variant="primary" loading={save.isPending} disabled={!clientId.trim() || !secretKey.trim()}>
                <Save /> {data.configured ? "Change application" : "Connect EVE login"}
              </Button>
              {data.configured && (
                <Button variant="ghost" type="button" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        ) : (
          <div className="flex gap-2">
            <Button variant="subtle" onClick={() => setEditing(true)}>
              <PencilLine /> Change application
            </Button>
            <Button variant="ghost" onClick={() => setConfirm("remove")}>
              <Trash2 /> Remove
            </Button>
          </div>
        )}
      </CardBody>
      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(o) => !o && setConfirm(null)}
        danger
        title={confirm === "remove" ? "Remove the EVE application?" : "Switch to a different EVE application?"}
        description={
          confirm === "remove"
            ? "Nobody can sign in, and no character data is synced, until one is connected again."
            : "Stored EVE logins only work for the application that issued them. Every member will have to sign in again, and character data stops syncing until they do."
        }
        confirmLabel={confirm === "remove" ? "Remove" : "Switch application"}
        onConfirm={() => save.mutateAsync(confirm === "remove" ? { client_id: "", secret_key: "" } : { client_id: clientId, secret_key: secretKey })}
      />
    </Card>
  );
}
