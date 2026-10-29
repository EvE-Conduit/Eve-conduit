import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArchiveRestore, DatabaseBackup, Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Alert } from "@/components/ui/feedback";
import { Field, Input } from "@/components/ui/input";
import { EmptyState, PageHeader } from "@/components/ui/page";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, Td, Th, THead, Tr } from "@/components/ui/table";
import { UpdateSteps } from "@/components/updates/UpdateSteps";
import { api } from "@/lib/api";
import { dateTime } from "@/lib/format";
import type { UpdateProgress } from "@/lib/types";
import { timeAgo } from "@/lib/utils";

interface Backup {
  name: string;
  size: number;
  created_at: string;
  version: string;
  before_restore: boolean;
}

interface BackupJob {
  id: string;
  action: "backup" | "restore";
  name: string;
  status: "requested" | "running" | "succeeded" | "failed";
  message: string;
  requested_by?: string;
  requested_at?: string | null;
  at?: string | null;
}

interface BackupStatus {
  kind: "windows" | "baremetal" | "docker" | "dev";
  can_manage: boolean;
  instructions: string;
  backups: Backup[];
  indexed_at: string | null;
  job: BackupJob | null;
  progress: UpdateProgress | null;
  confirm_word: string;
}

const KEY = ["admin", "backups"];

function bytes(n: number) {
  if (n > 1024 * 1024 * 1024) return `${(n / 1024 / 1024 / 1024).toFixed(1)} GB`;
  return n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`;
}

export function AdminBackups() {
  const qc = useQueryClient();
  const [restoring, setRestoring] = useState<Backup | null>(null);
  const [typed, setTyped] = useState("");
  const { data, isLoading, isError } = useQuery({
    queryKey: KEY,
    queryFn: () => api.get<BackupStatus>("/api/admin/backups"),
    retry: true,
    // Fast while the updater works; during a restore the site is down and the requests simply keep retrying.
    refetchInterval: (q) => {
      const d = q.state.data;
      return d && (d.job?.status === "requested" || d.job?.status === "running" || d.progress) ? 3000 : false;
    },
  });

  const set = (d: BackupStatus) => qc.setQueryData(KEY, d);
  const onError = (e: Error) => toast.error(e.message);
  const backup = useMutation({ mutationFn: () => api.post<BackupStatus>("/api/admin/backups/backup"), onSuccess: set, onError });
  const restore = useMutation({
    mutationFn: (name: string) => api.post<BackupStatus>("/api/admin/backups/restore", { name, confirm: typed }),
    onSuccess: set,
    onError,
  });
  const cancel = useMutation({ mutationFn: () => api.post<BackupStatus>("/api/admin/backups/cancel"), onSuccess: (d) => { set(d); toast.success("Cancelled"); }, onError });

  // After a restore everything on the page (and the session) comes from the restored database: start afresh.
  const job = data?.job;
  useEffect(() => {
    if (job?.action !== "restore" || job.status !== "succeeded" || !job.id) return;
    const key = `conduit:restored:${job.id}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      return;
    }
    toast.success(`Restored ${job.name}`);
    setTimeout(() => window.location.reload(), 1500);
  }, [job]);

  if (isLoading || !data) {
    return (
      <>
        <PageHeader eyebrow="Administration" title="Backups" />
        {isError ? <Alert tone="warning" title="Can't reach the server">If a backup is being restored, the site is offline. This page reconnects by itself.</Alert> : <Skeleton className="h-40" />}
      </>
    );
  }

  const busy = data.job?.status === "requested" || data.job?.status === "running" || !!data.progress;
  const closeRestore = () => {
    setRestoring(null);
    setTyped("");
  };

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Backups"
        description="Copies of the database made by the server, and putting one back. Backups are made before every update and plugin install, and whenever the server's own schedule says."
        actions={
          data.can_manage && (
            <Button variant="primary" onClick={() => backup.mutate()} loading={backup.isPending} disabled={busy}>
              {!backup.isPending && <DatabaseBackup />} Back up now
            </Button>
          )
        }
      />

      {!data.can_manage && (
        <Alert tone="info" className="mb-6" title="Back up this install on the server">
          <pre className="mt-2 whitespace-pre-wrap font-mono text-[13px] text-text">{data.instructions}</pre>
        </Alert>
      )}
      {isError && busy && (
        <Alert tone="info" className="mb-6" title="The site is offline">
          A backup is being restored. This page reconnects by itself.
        </Alert>
      )}

      <JobStatus data={data} onCancel={() => cancel.mutate()} cancelling={cancel.isPending} />

      {data.can_manage && (
        <Card>
          <CardHeader
            icon={<DatabaseBackup />}
            title="Backups on the server"
            description={
              data.indexed_at
                ? `Listed by the updater ${timeAgo(data.indexed_at)}. Each one holds the database and this server's settings; keep copies somewhere else too.`
                : "The updater hasn't listed the backups yet. It does within two minutes, and after every backup."
            }
          />
          {data.backups.length === 0 ? (
            <EmptyState icon={<DatabaseBackup />} title="No backups yet" description="Back up now, or wait for the next update or scheduled backup." />
          ) : (
            <Table>
              <THead>
                <Tr>
                  <Th>Made</Th>
                  <Th>File</Th>
                  <Th>Version</Th>
                  <Th align="right">Size</Th>
                  <Th />
                </Tr>
              </THead>
              <tbody>
                {data.backups.map((b) => (
                  <Tr key={b.name}>
                    <Td>
                      <span title={dateTime(b.created_at)}>{timeAgo(b.created_at)}</span>
                    </Td>
                    <Td>
                      <span className="font-mono text-[13px]">{b.name}</span>
                      {b.before_restore && <Badge tone="info" className="ml-2">made before a restore</Badge>}
                    </Td>
                    <Td className="font-mono">{b.version || "—"}</Td>
                    <Td numeric>{bytes(b.size)}</Td>
                    <Td align="right">
                      <Button size="sm" variant="danger" disabled={busy} onClick={() => setRestoring(b)}>
                        <ArchiveRestore /> Restore
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      )}

      <ConfirmDialog
        open={!!restoring}
        onOpenChange={(o) => !o && closeRestore()}
        danger
        title={`Restore ${restoring?.name ?? ""}?`}
        description={`The database goes back to how it was ${restoring ? timeAgo(restoring.created_at) : ""}: everything since then is lost for everyone. The site is offline while it runs. The current database is backed up first, and if anything fails it is put back. Members, you included, may have to sign in again.`}
        confirmLabel={<><ArchiveRestore /> Restore</>}
        confirmDisabled={typed.trim().toLowerCase() !== data.confirm_word}
        onConfirm={() => restoring && restore.mutateAsync(restoring.name).then(closeRestore)}
      >
        <Field label={`Type "${data.confirm_word}" to confirm`}>
          <Input value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" spellCheck={false} />
        </Field>
      </ConfirmDialog>
    </>
  );
}

function JobStatus({ data, onCancel, cancelling }: { data: BackupStatus; onCancel: () => void; cancelling: boolean }) {
  const { job, progress } = data;
  if (progress?.kind === "restore" || (job?.status === "running" && job.action === "restore")) {
    return (
      <div className="mb-6 space-y-3">
        <Alert tone="warning" icon={<Loader2 className="animate-spin" />} title={`Restoring ${job?.name || "a backup"}`}>
          The site is offline until it's done. This page reconnects and reloads by itself.
        </Alert>
        {progress?.kind === "restore" && <UpdateSteps progress={progress} />}
      </div>
    );
  }
  if (!job) return null;
  const what = job.action === "restore" ? `restore ${job.name}` : "back up";
  if (job.status === "requested") {
    return (
      <Alert
        tone="info"
        className="mb-6"
        icon={<Loader2 className="animate-spin" />}
        title={`Waiting for the updater to ${what}`}
        action={
          <Button size="sm" onClick={onCancel} loading={cancelling}>
            {!cancelling && <X />} Cancel
          </Button>
        }
      >
        {job.message || `Asked by ${job.requested_by || "an administrator"} ${timeAgo(job.requested_at)}. The updater usually starts within a few seconds.`}
      </Alert>
    );
  }
  if (job.status === "running") {
    return (
      <Alert tone="info" className="mb-6" icon={<Loader2 className="animate-spin" />} title="Backing up">
        The site stays online. The new backup shows up below when it's done.
      </Alert>
    );
  }
  if (job.status === "failed") {
    return (
      <Alert tone="danger" className="mb-6" title={job.action === "restore" ? `Restoring ${job.name} failed` : "The backup failed"}>
        {job.message}
      </Alert>
    );
  }
  return (
    <Alert tone="success" className="mb-6" title={job.action === "restore" ? `Restored ${job.name}` : "Backed up"}>
      {job.message}
    </Alert>
  );
}
