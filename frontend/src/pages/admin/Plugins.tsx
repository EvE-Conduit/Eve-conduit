import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpCircle, BadgeCheck, Check, Copy, Download, ExternalLink, GitBranch, KeyRound, Loader2, Puzzle, RefreshCw,
  Server, ShieldCheck, Trash2, X,
} from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { toast } from "sonner";

import { type AdminModule, PluginList } from "@/components/PluginList";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ConfirmDialog, Dialog } from "@/components/ui/dialog";
import { Alert } from "@/components/ui/feedback";
import { Field, Input } from "@/components/ui/input";
import { EmptyState, PageHeader } from "@/components/ui/page";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { TabPanel, Tabs } from "@/components/ui/tabs";
import { Tooltip } from "@/components/ui/tooltip";
import { UpdateSteps } from "@/components/updates/UpdateSteps";
import { api } from "@/lib/api";
import { BOOTSTRAP_KEY } from "@/lib/bootstrap";
import { iconFor } from "@/lib/icons";
import type { UpdateProgress } from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";

type Source = "catalog" | "git" | "server";

interface CatalogPlugin {
  id: string;
  package: string;
  name: string;
  version: string;
  description: string;
  author: string;
  homepage: string;
  icon: string;
  category: string;
  esi_scopes: string[];
  requires: string[];
  min_conduit: string;
  requirement: string;
  installed_version: string | null;
  installed_from: Source | null;
  update_available: boolean;
  compatible: boolean;
  auto_update: boolean;
}

interface InstalledPackage {
  package: string;
  version: string;
  source: Source;
  plugins: string[];
  url: string;
  update: string | null;
  auto_update: boolean;
}

interface Overview {
  kind: "windows" | "baremetal" | "docker" | "dev";
  can_install: boolean;
  instructions: string;
  allow_urls: boolean;
  catalog: CatalogPlugin[];
  catalog_checked_at: string | null;
  catalog_error: string;
  packages: InstalledPackage[];
  progress: UpdateProgress | null;
  job: {
    state: "none" | "requested" | "running" | "succeeded" | "failed";
    summary: string;
    automatic: boolean;
    requested_at: string | null;
    requested_by: string | null;
    message: string;
  };
}

type Action = { op: "install"; package?: string; url?: string } | { op: "remove"; package: string };
interface Confirm {
  title: string;
  description: ReactNode;
  actions: Action[];
  danger?: boolean;
}

const KEY = ["admin", "plugin-installs"];
const SOURCE: Record<Source, { label: string; tone: "accent" | "info" | "neutral"; icon: typeof BadgeCheck; hint: string }> = {
  catalog: { label: "Official", tone: "accent", icon: BadgeCheck, hint: "From the signed EvE Conduit plugin catalog" },
  git: { label: "Git", tone: "info", icon: GitBranch, hint: "Installed here from a git URL" },
  server: { label: "Server", tone: "neutral", icon: Server, hint: "Installed on the server (plugins.txt or the Docker image), so it's managed there" },
};
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export function AdminPlugins() {
  const qc = useQueryClient();
  const [tab, setTab] = useState("installed");
  const [selected, setSelected] = useState<string[]>([]);
  const [enable, setEnable] = useState(true);
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [linesOpen, setLinesOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: KEY,
    queryFn: () => api.get<Overview>("/api/admin/plugin-installs"),
    retry: true,
    // While the updater works the site restarts; failed requests simply keep retrying.
    refetchInterval: (q) => (q.state.data && (["requested", "running"].includes(q.state.data.job.state) || q.state.data.progress) ? 5000 : false),
  });
  const set = (d: Overview) => {
    qc.setQueryData(KEY, d);
    qc.invalidateQueries({ queryKey: ["admin", "plugins"] });
  };
  const onError = (e: Error) => toast.error(e.message);

  const refresh = useMutation({
    mutationFn: () => api.post<Overview>("/api/admin/plugin-installs/refresh"),
    onSuccess: (d) => {
      set(d);
      toast.success(`Catalog refreshed: ${plural(d.catalog.length, "plugin")}`);
    },
    onError,
  });
  const install = useMutation({
    mutationFn: (actions: Action[]) => api.post<Overview>("/api/admin/plugin-installs", { actions, enable, auto_update: autoUpdate }),
    onSuccess: (d) => {
      set(d);
      setSelected([]);
      qc.invalidateQueries({ queryKey: BOOTSTRAP_KEY });
    },
    onError,
  });
  const cancel = useMutation({
    mutationFn: () => api.post<Overview>("/api/admin/plugin-installs/cancel"),
    onSuccess: (d) => {
      set(d);
      toast.success("Cancelled");
    },
    onError,
  });
  const toggleAuto = useMutation({
    mutationFn: (v: { package: string; enabled: boolean }) => api.post<Overview>("/api/admin/plugin-installs/auto-update", v),
    onSuccess: (d, v) => {
      set(d);
      toast.success(v.enabled ? "New versions will install automatically" : "New versions will wait for you");
    },
    onError,
  });

  const busy = data ? ["requested", "running"].includes(data.job.state) : false;
  // When the updater finishes, the list of installed plugins and the menu change.
  const jobState = data?.job.state;
  useEffect(() => {
    if (jobState === "succeeded" || jobState === "failed") {
      qc.invalidateQueries({ queryKey: ["admin", "plugins"] });
      qc.invalidateQueries({ queryKey: BOOTSTRAP_KEY });
    }
  }, [jobState, qc]);
  const byPlugin = new Map<string, InstalledPackage>();
  data?.packages.forEach((p) => p.plugins.forEach((id) => byPlugin.set(id, p)));
  const updatable = data?.catalog.filter((c) => c.update_available && c.installed_from === "catalog") ?? [];
  const picked = data?.catalog.filter((c) => selected.includes(c.package)) ?? [];

  const askInstall = (plugins: CatalogPlugin[]) =>
    setConfirm({
      title: plugins.length === 1 ? `Install ${plugins[0].name} ${plugins[0].version}?` : `Install ${plural(plugins.length, "plugin")}?`,
      description: `The updater takes a backup, installs ${plugins.length === 1 ? "it" : "them"} and restarts the site, which is offline for a minute or so. If anything goes wrong, the previous plugins are put back.`,
      actions: plugins.map((p) => ({ op: "install", package: p.package })),
    });

  const extra = (m: AdminModule) => {
    const pkg = byPlugin.get(m.id);
    if (!pkg) return null;
    const src = SOURCE[pkg.source];
    const name = m.manifest?.name ?? m.id;
    const entry = data?.catalog.find((c) => c.package === pkg.package);
    return (
      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-2">
        <Tooltip content={src.hint}>
          <span>
            <Badge tone={src.tone}>
              <src.icon className="size-3" /> {src.label}
            </Badge>
          </span>
        </Tooltip>
        {pkg.url && <span className="min-w-0 truncate font-mono text-[11px] text-subtle">{pkg.url}</span>}
        {pkg.update && entry && (
          <Button size="xs" variant="outline" disabled={busy || !data?.can_install} onClick={() => askInstall([entry])}>
            <ArrowUpCircle /> Update to {pkg.update}
          </Button>
        )}
        {pkg.source === "catalog" && (
          <label className="inline-flex items-center gap-2 text-xs text-muted">
            <Switch
              checked={pkg.auto_update}
              disabled={toggleAuto.isPending}
              onCheckedChange={(enabled) => toggleAuto.mutate({ package: pkg.package, enabled })}
              aria-label={`Update ${name} automatically`}
            />
            Update automatically
          </label>
        )}
        {pkg.source !== "server" && data?.can_install && (
          <Button
            size="xs"
            variant="ghost"
            className="ml-auto text-danger-fg"
            disabled={busy}
            onClick={() =>
              setConfirm({
                title: `Remove ${name}?`,
                description:
                  "It's switched off and uninstalled, and the site restarts for a moment. Its data stays in the database, so installing it again picks up where it left off.",
                actions: [{ op: "remove", package: pkg.package }],
                danger: true,
              })
            }
          >
            <Trash2 /> Remove
          </Button>
        )}
      </div>
    );
  };

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Plugins"
        icon={<Puzzle />}
        description="Install plugins from the official catalog, keep them up to date, and switch them on and off. Disabled plugins disappear from the menu and their API stops responding."
        actions={
          <Button onClick={() => refresh.mutate()} loading={refresh.isPending}>
            {!refresh.isPending && <RefreshCw />} Refresh catalog
          </Button>
        }
      />

      {data && <JobStatus data={data} onCancel={() => cancel.mutate()} cancelling={cancel.isPending} />}

      <Tabs
        value={tab}
        onValueChange={setTab}
        variant="pills"
        className="space-y-6"
        items={[
          { value: "installed", label: "Installed", count: data?.packages.length, icon: <Check className="size-4" /> },
          { value: "browse", label: "Browse", count: data?.catalog.length, icon: <Download className="size-4" /> },
        ]}
      >
        <TabPanel value="installed">
          {updatable.length > 0 && data?.can_install && (
            <Alert
              tone="info"
              icon={<ArrowUpCircle />}
              className="mb-6"
              title={updatable.length === 1 ? "An update is available" : `${updatable.length} updates are available`}
              action={
                <Button size="sm" variant="primary" disabled={busy} onClick={() => askInstall(updatable)}>
                  <ArrowUpCircle /> Update {updatable.length === 1 ? "" : "all"}
                </Button>
              }
            >
              {updatable.map((c) => `${c.name} ${c.installed_version} → ${c.version}`).join(", ")}
            </Alert>
          )}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_340px]">
            <PluginList extra={extra} />
            <SourcesCard data={data} />
          </div>
        </TabPanel>

        <TabPanel value="browse">
          {isLoading || !data ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-44" />
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {data.catalog_error && (
                <Alert tone="warning" title="Couldn't refresh the catalog">
                  {data.catalog_error}
                  {data.catalog.length > 0 && ". Showing the last copy that checked out."}
                </Alert>
              )}
              {data.catalog.length === 0 ? (
                <Card>
                  <EmptyState
                    icon={<Puzzle />}
                    title={data.catalog_checked_at ? "The catalog is empty" : "The catalog hasn't been loaded yet"}
                    description="The catalog lists the official plugins. It's signed with the EvE Conduit release key and checked when it arrives."
                    action={
                      <Button variant="primary" onClick={() => refresh.mutate()} loading={refresh.isPending}>
                        {!refresh.isPending && <RefreshCw />} Load the catalog
                      </Button>
                    }
                  />
                </Card>
              ) : (
                <>
                  <p className="flex items-center gap-2 text-sm text-muted">
                    <ShieldCheck className="size-4 shrink-0 text-success-fg" />
                    Signed catalog, checked {data.catalog_checked_at ? timeAgo(data.catalog_checked_at) : "never"}. Pick the plugins you want, then install them together.
                  </p>
                  <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
                    {data.catalog.map((p) => (
                      <CatalogCard
                        key={p.package}
                        plugin={p}
                        selected={selected.includes(p.package)}
                        disabled={busy}
                        onToggle={() => setSelected((s) => (s.includes(p.package) ? s.filter((x) => x !== p.package) : [...s, p.package]))}
                      />
                    ))}
                  </ul>
                </>
              )}
              <GitCard
                data={data}
                busy={busy}
                onInstall={(url) =>
                  setConfirm({
                    title: "Install a plugin from git?",
                    description: (
                      <>
                        <span className="block break-all font-mono text-xs text-text">{url}</span>
                        <span className="mt-2 block">
                          Plugins from outside the catalog aren't checked by EvE Conduit. They run with the site's access to your server, database and members' tokens, so only install code you trust.
                        </span>
                      </>
                    ),
                    actions: [{ op: "install", url }],
                    danger: true,
                  })
                }
              />
            </div>
          )}
        </TabPanel>
      </Tabs>

      {picked.length > 0 && data && (
        <div className="sticky bottom-4 z-20 mt-6">
          <div className="flex flex-col gap-4 rounded-xl border border-accent/40 bg-surface-raised/95 p-4 shadow-e3 backdrop-blur lg:flex-row lg:items-center">
            <div className="min-w-0 flex-1">
              <div className="font-medium">{plural(picked.length, "plugin")} selected</div>
              <div className="truncate text-sm text-muted">{picked.map((p) => `${p.name} ${p.version}`).join(", ")}</div>
            </div>
            {data.can_install && (
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                <label className="inline-flex items-center gap-2">
                  <Switch checked={enable} onCheckedChange={setEnable} /> Switch on after installing
                </label>
                <label className="inline-flex items-center gap-2">
                  <Switch checked={autoUpdate} onCheckedChange={setAutoUpdate} /> Update automatically
                </label>
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setSelected([])}>
                <X /> Clear
              </Button>
              {data.can_install ? (
                <Button variant="primary" disabled={busy} onClick={() => askInstall(picked)}>
                  <Download /> Install {picked.length}
                </Button>
              ) : (
                <Button variant="primary" onClick={() => setLinesOpen(true)}>
                  <Copy /> How to install
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={confirm?.title ?? ""}
        description={confirm?.description}
        danger={confirm?.danger}
        confirmLabel={confirm?.actions[0]?.op === "remove" ? <><Trash2 /> Remove</> : <><Download /> Install</>}
        onConfirm={() => install.mutateAsync(confirm!.actions)}
      />
      {data && <InstallLines open={linesOpen} onOpenChange={setLinesOpen} data={data} plugins={picked} />}
    </>
  );
}

function CatalogCard({ plugin: p, selected, disabled, onToggle }: { plugin: CatalogPlugin; selected: boolean; disabled: boolean; onToggle: () => void }) {
  const Icon = iconFor(p.icon);
  const installed = p.installed_version !== null;
  const selectable = p.compatible && p.installed_from !== "server" && (!installed || p.update_available);
  let status: ReactNode = null;
  if (!p.compatible) status = <Badge tone="warning">Needs EvE Conduit {p.min_conduit}</Badge>;
  else if (p.update_available) {
    status = (
      <Badge tone="warning">
        <ArrowUpCircle className="size-3" /> {p.installed_version} → {p.version}
      </Badge>
    );
  } else if (installed) {
    status = (
      <Badge tone="success">
        <Check className="size-3" /> Installed
      </Badge>
    );
  }

  return (
    <li className="relative">
      <button
        type="button"
        onClick={onToggle}
        disabled={!selectable || disabled}
        aria-pressed={selectable ? selected : undefined}
        aria-label={`${selected ? "Deselect" : "Select"} ${p.name}`}
        className={cn(
          "peer absolute inset-0 rounded-xl border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70",
          selected ? "border-accent bg-accent-soft/50" : "border-border bg-surface-2/60",
          selectable && !disabled ? "cursor-pointer hover:border-accent/60" : "cursor-default",
        )}
      />
      {/* The content sits above the button so the source link stays a real link. */}
      <div className="pointer-events-none relative flex h-full flex-col gap-3 p-4">
        <div className="flex items-start gap-3">
          <div className={cn("grid size-10 shrink-0 place-items-center rounded-xl ring-1", selected || installed ? "bg-accent-soft text-accent-ink ring-accent/25" : "bg-surface-3 text-subtle ring-border-strong")}>
            <Icon className="size-4.5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{p.name}</span>
              <span className="font-mono text-[11px] text-subtle">v{p.version}</span>
            </div>
            <div className="text-xs text-muted">{[p.category, p.author].filter(Boolean).join(" · ")}</div>
          </div>
          {selectable && (
            <span className={cn("grid size-5 shrink-0 place-items-center rounded border transition-colors", selected ? "border-accent bg-accent text-accent-fg" : "border-border-strong")}>
              {selected && <Check className="size-3.5" />}
            </span>
          )}
        </div>
        <p className="flex-1 text-sm text-muted">{p.description}</p>
        <div className="flex flex-wrap items-center gap-1.5">
          {status}
          {p.esi_scopes.length > 0 && (
            <Badge>
              <KeyRound className="size-3" /> {plural(p.esi_scopes.length, "ESI scope")}
            </Badge>
          )}
          {p.requires.map((r) => (
            <Badge key={r}>needs {r}</Badge>
          ))}
          {p.homepage && (
            <a href={p.homepage} target="_blank" rel="noopener noreferrer" className="pointer-events-auto ml-auto inline-flex items-center gap-1 text-xs text-subtle hover:text-text">
              Source <ExternalLink className="size-3" />
            </a>
          )}
        </div>
      </div>
    </li>
  );
}

function GitCard({ data, busy, onInstall }: { data: Overview; busy: boolean; onInstall: (url: string) => void }) {
  const [url, setUrl] = useState("");
  const valid = /^(git\+)?https:\/\/\S+$/.test(url.trim());
  return (
    <Card>
      <CardHeader icon={<GitBranch />} title="Install from a git URL" description="Plugins that aren't in the catalog, from any git repository over HTTPS." />
      <CardBody>
        {data.allow_urls && data.can_install ? (
          <form
            className="flex flex-col gap-3 sm:flex-row sm:items-start"
            onSubmit={(e) => {
              e.preventDefault();
              if (valid) onInstall(url.trim());
            }}
          >
            <Field
              label="Repository"
              hint="Add @tag or @commit to pin a version, and #subdirectory=folder if the plugin isn't at the top. The server needs git installed."
              className="flex-1"
            >
              <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://github.com/someone/conduit-thing@v1.0.0" spellCheck={false} className="font-mono" />
            </Field>
            <Button type="submit" disabled={!valid || busy} className="sm:mt-[26px]">
              <Download /> Install
            </Button>
          </form>
        ) : (
          <p className="text-sm text-muted">
            {data.can_install ? (
              <>
                Turned off. A plugin runs with the site's access to your server, so only the server owner can allow this: set{" "}
                <code className="font-mono text-text">CONDUIT_PLUGIN_URLS=true</code> in the config file and restart.
              </>
            ) : (
              <>
                Add the URL to <code className="font-mono text-text">requirements-plugins.txt</code> and rebuild.
              </>
            )}
          </p>
        )}
      </CardBody>
    </Card>
  );
}

function SourcesCard({ data }: { data: Overview | undefined }) {
  return (
    <Card className="h-fit">
      <CardHeader title="Where plugins come from" icon={<Puzzle />} />
      <CardBody className="space-y-3 text-sm text-muted">
        {(["catalog", "git", "server"] as const).map((s) => {
          const src = SOURCE[s];
          return (
            <div key={s} className="flex items-start gap-3">
              <Badge tone={src.tone} className="shrink-0">
                <src.icon className="size-3" /> {src.label}
              </Badge>
              <span>{src.hint}.</span>
            </div>
          );
        })}
        {data && !data.can_install && (
          <>
            <p className="pt-2">This install can't change its own code, so plugins are added on the server. Pick them under Browse to get the lines:</p>
            <pre className="overflow-x-auto rounded-lg border border-border bg-bg/70 p-3 font-mono text-xs text-text">
              {data.kind === "docker" ? "# requirements-plugins.txt\n<the plugin's line>\n\ndocker compose up -d --build" : "pip install '<the plugin's line>'"}
            </pre>
          </>
        )}
        <p className="pt-2">Plugins that need ESI scopes ask members to re-authorise their characters.</p>
      </CardBody>
    </Card>
  );
}

function JobStatus({ data, onCancel, cancelling }: { data: Overview; onCancel: () => void; cancelling: boolean }) {
  const qc = useQueryClient();
  const { job } = data;
  const who = job.automatic ? "Automatic update" : `Asked by ${job.requested_by ?? "an administrator"}`;
  if (job.state === "requested") {
    return (
      <Alert
        tone="info"
        className="mb-6"
        icon={<Loader2 className="animate-spin" />}
        title={`Waiting for the updater: ${job.summary}`}
        action={
          <Button size="sm" onClick={onCancel} loading={cancelling}>
            {!cancelling && <X />} Cancel
          </Button>
        }
      >
        {job.message || `${who} ${timeAgo(job.requested_at)}. The updater usually starts within a few seconds.`}
      </Alert>
    );
  }
  if (job.state === "running") {
    return (
      <div className="mb-6 space-y-3">
        <Alert tone="warning" icon={<Loader2 className="animate-spin" />} title={`Installing: ${job.summary}`}>
          The site restarts near the end. This page reconnects by itself.
        </Alert>
        {data.progress?.kind === "plugins" && <UpdateSteps progress={data.progress} />}
      </div>
    );
  }
  if (job.state === "failed") {
    return (
      <Alert tone="danger" className="mb-6" title={`Didn't work: ${job.summary}`}>
        {job.message}
      </Alert>
    );
  }
  // Mention a finished install for a few hours, with a way to load the new pages.
  if (job.state === "succeeded" && job.requested_at && Date.now() - Date.parse(job.requested_at) < 6 * 3600_000) {
    return (
      <Alert
        tone="success"
        className="mb-6"
        title={`Done: ${job.summary}`}
        action={
          <Button
            size="sm"
            onClick={() => {
              qc.invalidateQueries({ queryKey: BOOTSTRAP_KEY });
              window.location.reload();
            }}
          >
            <RefreshCw /> Reload
          </Button>
        }
      >
        <span className="whitespace-pre-line">{job.message || "Reload to see new pages and menu entries."}</span>
      </Alert>
    );
  }
  return null;
}

function InstallLines({ open, onOpenChange, data, plugins }: { open: boolean; onOpenChange: (o: boolean) => void; data: Overview; plugins: CatalogPlugin[] }) {
  const lines = plugins.map((p) => p.requirement).join("\n");
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title="Install on the server"
      description={data.instructions}
      footer={
        <Button onClick={() => navigator.clipboard.writeText(lines).then(() => toast.success("Copied"), () => toast.error("Couldn't copy"))}>
          <Copy /> Copy
        </Button>
      }
    >
      <pre className="overflow-x-auto whitespace-pre rounded-lg border border-border bg-bg/70 p-3 font-mono text-xs text-text">{lines}</pre>
    </Dialog>
  );
}
