import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Download, ExternalLink, Loader2, RefreshCw, Rocket, ShieldCheck, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Alert, Progress } from "@/components/ui/feedback";
import { EmptyState, PageHeader, StatCard } from "@/components/ui/page";
import { Skeleton } from "@/components/ui/skeleton";
import { UpdateSteps } from "@/components/updates/UpdateSteps";
import { api } from "@/lib/api";
import { BOOTSTRAP_KEY } from "@/lib/bootstrap";
import { date } from "@/lib/format";
import { Markdown } from "@/lib/markdown";
import type { UpdateProgress } from "@/lib/types";
import { timeAgo } from "@/lib/utils";

interface Release {
  version: string;
  name: string;
  notes: string;
  published_at: string | null;
  url: string;
  prerelease: boolean;
  size: number | null;
}

interface UpdateStatus {
  current_version: string;
  kind: "windows" | "baremetal" | "docker" | "dev";
  can_install: boolean;
  instructions: string;
  repository: string;
  checked_at: string | null;
  check_error: string;
  latest: string | null;
  releases: Release[];
  progress: UpdateProgress | null;
  download: { state: "none" | "downloading" | "ready" | "failed"; version: string | null; size: number; received: number; error: string };
  install: { state: "none" | "requested" | "running" | "succeeded" | "failed"; version: string | null; requested_at: string | null; requested_by: string | null; message: string };
}

const KEY = ["admin", "updates"];
const KIND_LABEL = { windows: "Windows", baremetal: "Linux (bare metal)", docker: "Docker", dev: "Development checkout" };

function bytes(n: number | null | undefined) {
  if (!n) return "—";
  return n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`;
}

export function AdminUpdates() {
  const qc = useQueryClient();
  const [confirm, setConfirm] = useState<"download" | "install" | null>(null);
  const { data, isLoading, isError } = useQuery({
    queryKey: KEY,
    queryFn: () => api.get<UpdateStatus>("/api/admin/updates"),
    retry: true,
    // Fast while something is happening; while the site restarts the requests fail and simply keep retrying.
    refetchInterval: (q) => {
      const d = q.state.data;
      if (d?.download.state === "downloading") return 1000;
      if (d && (d.install.state === "requested" || d.install.state === "running" || d.progress)) return 5000;
      return false;
    },
  });

  const set = (d: UpdateStatus) => qc.setQueryData(KEY, d);
  const onError = (e: Error) => toast.error(e.message);
  const check = useMutation({ mutationFn: () => api.post<UpdateStatus>("/api/admin/updates/check"), onSuccess: (d) => { set(d); toast.success(d.latest ? `EvE Conduit ${d.latest} is available` : "You're up to date"); }, onError });
  const download = useMutation({ mutationFn: (version: string) => api.post<UpdateStatus>("/api/admin/updates/download", { version }), onSuccess: set, onError });
  const install = useMutation({ mutationFn: () => api.post<UpdateStatus>("/api/admin/updates/install"), onSuccess: set, onError });
  const cancel = useMutation({ mutationFn: () => api.post<UpdateStatus>("/api/admin/updates/cancel"), onSuccess: (d) => { set(d); toast.success("Install cancelled"); }, onError });

  // The new version is up: reload so the browser gets its front end too.
  useEffect(() => {
    if (data?.install.state === "succeeded" && data.install.version === data.current_version) {
      const key = `conduit:updated-to:${data.current_version}`;
      try {
        if (sessionStorage.getItem(key)) return;
        sessionStorage.setItem(key, "1");
      } catch {
        return;
      }
      qc.invalidateQueries({ queryKey: BOOTSTRAP_KEY });
      toast.success(`EvE Conduit ${data.current_version} is installed`);
      setTimeout(() => window.location.reload(), 1200);
    }
  }, [data, qc]);

  if (isLoading || !data) {
    return (
      <>
        <PageHeader eyebrow="Administration" title="Updates" />
        {isError ? <Alert tone="warning" title="Can't reach the server">If an update is installing, the site is restarting. This page reconnects by itself.</Alert> : <Skeleton className="h-40" />}
      </>
    );
  }

  const latest = data.releases[0];
  const busy = data.install.state === "requested" || data.install.state === "running";

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Updates"
        description="New versions of EvE Conduit, what changed in them, and installing them. Nothing is downloaded or installed until you say so."
        actions={
          <Button onClick={() => check.mutate()} loading={check.isPending} disabled={busy}>
            {!check.isPending && <RefreshCw />} Check now
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Running" value={data.current_version} mono hint={KIND_LABEL[data.kind]} />
        <StatCard label="Latest" value={data.latest ?? data.current_version} mono tone={data.latest ? "warning" : "success"} hint={data.latest ? "update available" : "up to date"} />
        <StatCard label="Last checked" value={data.checked_at ? timeAgo(data.checked_at) : "never"} mono={false} hint="daily, after EVE downtime" />
      </div>

      {isError && busy && (
        <Alert tone="info" className="mb-6" title="The site is restarting">
          The update is being installed. This page reconnects by itself.
        </Alert>
      )}
      {data.check_error && <Alert tone="warning" className="mb-6" title="Couldn't check for updates">{data.check_error}</Alert>}

      <InstallStatus data={data} onCancel={() => cancel.mutate()} cancelling={cancel.isPending} onRetry={() => setConfirm("install")} />

      {!latest ? (
        <Card>
          <EmptyState icon={<CheckCircle2 />} title="You're up to date" description={`EvE Conduit ${data.current_version} is the newest version.`} />
        </Card>
      ) : (
        <Card>
          <CardHeader
            icon={<Rocket />}
            title={`EvE Conduit ${latest.version} is available`}
            description={data.releases.length > 1 ? `${data.releases.length} new versions since ${data.current_version}. Everything that changed is below.` : `What changed since ${data.current_version}.`}
            actions={<Action data={data} latest={latest} onDownload={() => setConfirm("download")} onInstall={() => setConfirm("install")} />}
          />
          {data.download.state === "downloading" && (
            <div className="border-b border-border px-card py-4">
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-muted">Downloading {data.download.version}…</span>
                <span className="font-mono tabular-nums">{bytes(data.download.received)} / {bytes(data.download.size)}</span>
              </div>
              <Progress value={data.download.size ? data.download.received / data.download.size : 0} segments={24} label="Download progress" />
            </div>
          )}
          {data.download.state === "failed" && (
            <div className="border-b border-border px-card py-4">
              <Alert tone="danger" title="The download failed">{data.download.error}</Alert>
            </div>
          )}
          {data.download.state === "ready" && data.install.state !== "requested" && data.install.state !== "running" && (
            <div className="border-b border-border px-card py-4">
              <Alert tone="success" icon={<ShieldCheck />} title={`EvE Conduit ${data.download.version} is downloaded and verified`}>
                Its signature checks out. Install it whenever it suits you.
              </Alert>
            </div>
          )}
          {!data.can_install && (
            <div className="border-b border-border px-card py-4">
              <Alert tone="info" title="Update this install from git">
                <pre className="mt-2 whitespace-pre-wrap font-mono text-[13px] text-text">{data.instructions}</pre>
              </Alert>
            </div>
          )}
          <CardBody className="divide-y divide-border p-0">
            {data.releases.map((r) => (
              <article key={r.version} className="px-card py-5">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <h3 className="hud-title text-lg">{r.name || `EvE Conduit ${r.version}`}</h3>
                  <Badge tone="accent">{r.version}</Badge>
                  {r.prerelease && <Badge tone="warning">pre-release</Badge>}
                  <span className="text-sm text-muted">{r.published_at ? date(r.published_at) : ""}</span>
                  {r.url && (
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="ml-auto inline-flex items-center gap-1 text-sm text-accent-ink hover:underline">
                      On GitHub <ExternalLink className="size-3.5" />
                    </a>
                  )}
                </div>
                {r.notes ? <Markdown source={r.notes} /> : <p className="text-sm text-muted">No release notes.</p>}
              </article>
            ))}
          </CardBody>
        </Card>
      )}

      {latest && (
        <>
          <ConfirmDialog
            open={confirm === "download"}
            onOpenChange={(o) => !o && setConfirm(null)}
            title={`Download EvE Conduit ${latest.version}?`}
            description={`About ${bytes(latest.size)} from GitHub. It's checked against the project's signing key once it arrives. Nothing is installed yet; you'll be asked again before that.`}
            confirmLabel={<><Download /> Download</>}
            onConfirm={() => download.mutateAsync(latest.version)}
          />
          <ConfirmDialog
            open={confirm === "install"}
            onOpenChange={(o) => !o && setConfirm(null)}
            title={`Install EvE Conduit ${data.download.version ?? latest.version} now?`}
            description="The site goes offline for a few minutes while the updater backs up the database, installs the new version and updates the database. If anything fails, the previous version is put back. Members who are online will see the site come back by itself."
            confirmLabel={<><Rocket /> Install now</>}
            onConfirm={() => install.mutateAsync()}
          />
        </>
      )}
    </>
  );
}

function Action({ data, latest, onDownload, onInstall }: { data: UpdateStatus; latest: Release; onDownload: () => void; onInstall: () => void }) {
  if (!data.can_install) return null;
  const { download, install } = data;
  if (install.state === "requested" || install.state === "running") return <Badge tone="warning">Installing</Badge>;
  if (download.state === "downloading") return <Badge tone="info">Downloading</Badge>;
  if (download.state === "ready") {
    return (
      <div className="flex items-center gap-2">
        {download.version !== latest.version && (
          <Button size="sm" onClick={onDownload}>
            Download {latest.version} instead
          </Button>
        )}
        <Button variant="primary" onClick={onInstall}>
          <Rocket /> Install {download.version}
        </Button>
      </div>
    );
  }
  return (
    <Button variant="primary" onClick={onDownload}>
      <Download /> {download.state === "failed" ? "Try again" : `Download ${latest.version}`}
    </Button>
  );
}

function InstallStatus({ data, onCancel, cancelling, onRetry }: { data: UpdateStatus; onCancel: () => void; cancelling: boolean; onRetry: () => void }) {
  const { install } = data;
  // Also when someone runs "conduit upgrade" on the server: the progress file says so.
  if (install.state === "running" || data.progress?.kind === "release") {
    return (
      <div className="mb-6 space-y-3">
        <Alert tone="warning" icon={<Loader2 className="animate-spin" />} title={`Installing EvE Conduit ${data.progress?.target || install.version}`}>
          The site restarts near the end. This page reconnects and reloads by itself.
        </Alert>
        {data.progress?.kind === "release" && <UpdateSteps progress={data.progress} />}
      </div>
    );
  }
  if (install.state === "requested") {
    return (
      <Alert
        tone="info"
        className="mb-6"
        icon={<Loader2 className="animate-spin" />}
        title={`Waiting for the updater to install ${install.version}`}
        action={
          <Button size="sm" onClick={onCancel} loading={cancelling}>
            {!cancelling && <X />} Cancel
          </Button>
        }
      >
        {install.message || `Asked by ${install.requested_by ?? "an administrator"} ${timeAgo(install.requested_at)}. The updater checks every two minutes.`}
      </Alert>
    );
  }
  if (install.state === "failed") {
    return (
      <Alert
        tone="danger"
        className="mb-6"
        title={`Installing ${install.version} failed`}
        action={data.download.state === "ready" ? <Button size="sm" onClick={onRetry}>Try again</Button> : undefined}
      >
        {install.message}
      </Alert>
    );
  }
  if (install.state === "succeeded" && install.version === data.current_version) {
    return (
      <Alert tone="success" className="mb-6" title={`EvE Conduit ${install.version} is installed`}>
        {install.message || "Everything is up to date."}
      </Alert>
    );
  }
  return null;
}
