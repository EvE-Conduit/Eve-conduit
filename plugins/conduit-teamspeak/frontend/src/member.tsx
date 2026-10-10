// A member's own TeamSpeak page: link the identity with a privilege key, see how they stand, fix groups, unlink.
import { Alert, api, Badge, Button, Card, CardBody, CardHeader, ConfirmDialog, EmptyState, PageHeader, Skeleton, timeAgo, toast, useHasPerm } from "@conduit/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";

import { Check, Headphones, Key, Refresh, Settings, Spinner, Unlink } from "./icons";
import { ConnectDetails, CopyField, GroupList } from "./shared";
import { BASE, type Checked, type Me, type PendingAccount } from "./types";

export const ME_KEY = ["teamspeak", "me"];

export function useMe() {
  return useQuery({ queryKey: ME_KEY, queryFn: () => api.get<Me>(`${BASE}/me`) });
}

/** How long the page keeps asking the server whether the key was used, before it leaves it to the Check button. */
const POLL_FOR_MS = 3 * 60_000;
const POLL_EVERY_MS = 5_000;

/** While the link is pending: the key, the link that uses it, and the page watching for it to be used. */
function PendingStep({ me, account }: { me: Me; account: PendingAccount }) {
  const qc = useQueryClient();
  const [polling, setPolling] = useState(true);
  const started = useRef(Date.now());
  const check = useMutation({
    mutationFn: () => api.post<Checked>(`${BASE}/link/check`),
    onSuccess: (d) => {
      qc.setQueryData(ME_KEY, d);
      if (d.found) toast.success("Linked! Your groups are set.");
    },
    onError: (e: Error) => { if (!e.message.includes("wait")) toast.error(e.message); },
  });
  const giveUp = useMutation({
    mutationFn: () => api.delete<Me>(`${BASE}/link`),
    onSuccess: (d) => qc.setQueryData(ME_KEY, d),
    onError: (e: Error) => toast.error(e.message),
  });
  const renew = useMutation({
    mutationFn: () => api.post<Me>(`${BASE}/link`),
    onSuccess: (d) => { qc.setQueryData(ME_KEY, d); started.current = Date.now(); setPolling(true); toast.success("New key made"); },
    onError: (e: Error) => toast.error(e.message),
  });
  useEffect(() => {
    if (!polling) return;
    const id = setInterval(() => {
      if (Date.now() - started.current > POLL_FOR_MS) { setPolling(false); return; }
      if (!check.isPending) check.mutate();
    }, POLL_EVERY_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [polling]);

  return (
    <Card>
      <div className="grid gap-8 p-card sm:p-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <div className="flex items-center gap-3 text-accent-ink">
            <Key className="size-8" />
            <span className="text-xl font-semibold text-text">Use your key in TeamSpeak</span>
          </div>
          <ol className="list-decimal space-y-3 pl-5 text-sm text-muted">
            <li>
              Press <b className="text-text">Connect and use key</b>: TeamSpeak opens, connects to {me.server.name} as <b className="text-text">{me.nickname}</b> and
              uses the key for you.
            </li>
            <li>
              Or, if you're already connected, paste the key under <span className="text-text">Permissions → Use Privilege Key</span> in the TeamSpeak client.
            </li>
            <li>This page notices within a few seconds and gives you your groups.</li>
          </ol>
          <ConnectDetails server={me.server} nickname={me.nickname} url={account.connect_url} label="Connect and use key" />
          <div>
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Your privilege key</div>
            <CopyField value={account.privilege_key} label="privilege key" />
            <p className="mt-1 text-xs text-subtle">Works once, for you only. Made {timeAgo(account.started_at)}.</p>
          </div>
        </div>
        <div className="flex flex-col justify-between gap-4 border border-border bg-bg/40 p-4 text-sm">
          <div className="flex items-center gap-2">
            {polling ? <Spinner className="size-4 text-accent-ink" /> : <Key className="size-4 text-muted" />}
            <span className="text-muted">{polling ? "Waiting for the key to be used…" : "Stopped watching; check when you're done."}</span>
          </div>
          <div className="space-y-2">
            <Button variant="primary" className="w-full" loading={check.isPending} onClick={() => { started.current = Date.now(); setPolling(true); check.mutate(); }}>
              <Refresh /> I've used the key
            </Button>
            <Button variant="secondary" className="w-full" loading={renew.isPending} onClick={() => renew.mutate()}>New key</Button>
            <Button variant="ghost" className="w-full" loading={giveUp.isPending} onClick={() => giveUp.mutate()}>Give up for now</Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function MemberPage() {
  const qc = useQueryClient();
  const canManage = useHasPerm("teamspeak.manage_teamspeak");
  const { data, isLoading } = useMe();
  const [confirmUnlink, setConfirmUnlink] = useState(false);
  const start = useMutation({
    mutationFn: () => api.post<Me>(`${BASE}/link`),
    onSuccess: (d) => qc.setQueryData(ME_KEY, d),
    onError: (e: Error) => toast.error(e.message),
  });
  const sync = useMutation({
    mutationFn: () => api.post<Me>(`${BASE}/sync`),
    onSuccess: (d) => { qc.setQueryData(ME_KEY, d); toast.success("Your groups are up to date"); },
    onError: (e: Error) => { toast.error(e.message); qc.invalidateQueries({ queryKey: ME_KEY }); },
  });
  const unlink = useMutation({
    mutationFn: () => api.delete<Me>(`${BASE}/link`),
    onSuccess: (d) => { qc.setQueryData(ME_KEY, d); toast.success("TeamSpeak unlinked"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader
        eyebrow="Communication"
        title="TeamSpeak"
        icon={<Headphones />}
        description="Voice comms. Link your TeamSpeak identity once; your server groups then follow your groups and state."
        actions={canManage ? <Link to="/p/teamspeak/admin"><Button><Settings /> Server setup</Button></Link> : undefined}
      />

      {isLoading || !data ? (
        <Skeleton className="h-56" />
      ) : !data.configured ? (
        <Card>
          <EmptyState
            icon={<Headphones />}
            title="TeamSpeak isn't set up yet"
            description={canManage ? "Enter the server's ServerQuery login under Server setup." : "Your leadership hasn't connected a TeamSpeak server to this site yet."}
            action={canManage ? <Link to="/p/teamspeak/admin"><Button variant="primary"><Settings /> Server setup</Button></Link> : undefined}
          />
        </Card>
      ) : !data.account ? (
        <Card>
          <div className="grid gap-8 p-card sm:p-8 lg:grid-cols-[1fr_320px] lg:items-center">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-accent-ink">
                <Headphones className="size-8" />
                <span className="text-xl font-semibold text-text">{data.server.name}</span>
              </div>
              {data.can_link ? (
                <>
                  <p className="max-w-prose text-sm text-muted">
                    You'll get a one-time privilege key. Use it in your TeamSpeak client (the connect link does it for you) and this site
                    recognises your identity from then on: no passwords, and your server groups come from here.
                  </p>
                  <Button variant="primary" size="lg" loading={start.isPending} onClick={() => start.mutate()}><Key /> Link my TeamSpeak</Button>
                </>
              ) : (
                <Alert tone="warning" title="You don't have access to TeamSpeak">
                  Access comes with your membership. Ask your corporation's leadership if you think you should have it.
                </Alert>
              )}
            </div>
            {data.can_link && (
              <div className="border border-border bg-bg/40 p-4 text-sm">
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">You'll be</div>
                <div className="mb-3 font-medium">{data.nickname}</div>
                <GroupList groups={[...(data.registered_group ? [data.registered_group] : []), ...data.groups_due]} empty="No server groups yet; they come with your groups." />
              </div>
            )}
          </div>
        </Card>
      ) : data.account.status === "pending" ? (
        <PendingStep me={data} account={data.account} />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            {data.account.error && (
              <Alert tone="danger" title="Your groups couldn't be set">{data.account.error}</Alert>
            )}
            <Card>
              <div className="flex flex-col gap-5 p-card sm:flex-row sm:items-start">
                <span className="grid size-14 shrink-0 place-items-center bg-accent-soft text-accent-ink"><Headphones className="size-7" /></span>
                <div className="min-w-0 flex-1 space-y-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-lg font-semibold">{data.account.nickname || "Your identity"}</span>
                      <Badge tone={data.account.error ? "danger" : "success"}><Check className="size-3" /> Linked</Badge>
                    </div>
                    <div className="text-sm text-muted">on {data.server.name}</div>
                    <div className="mt-1 text-xs text-subtle">
                      Linked {timeAgo(data.account.linked_at)}
                      {data.account.last_connected_at ? ` · last connected ${timeAgo(data.account.last_connected_at)}` : ""}
                      {data.account.synced_at ? ` · groups checked ${timeAgo(data.account.synced_at)}` : ""}
                    </div>
                    <div className="mt-1 font-mono text-xs text-subtle">identity {data.account.uid}</div>
                  </div>
                  <ConnectDetails server={data.server} url={data.url} />
                </div>
              </div>
              <div className="flex flex-wrap gap-2 border-t border-border px-card py-3">
                <Button variant="secondary" loading={sync.isPending} onClick={() => sync.mutate()}><Refresh /> Fix my groups</Button>
                <Button variant="danger" onClick={() => setConfirmUnlink(true)}><Unlink /> Unlink</Button>
              </div>
            </Card>
            <p className="text-xs text-subtle">
              Your identity is the one TeamSpeak made on the computer you linked from. On another computer, export it from TeamSpeak's identity settings and
              import it there, or unlink and link again.
            </p>
          </div>
          <Card className="h-fit">
            <CardHeader title="Your server groups" description="For the server's channel permissions. They follow your groups and state on this site." />
            <CardBody>
              <GroupList groups={[...(data.registered_group ? [data.registered_group] : []), ...data.groups_due]} empty="None of your groups come with a server group." />
              {data.account.groups.join() !== data.groups_due.join() && (
                <p className="mt-3 text-xs text-subtle">Changed since the last check; press Fix my groups.</p>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      <ConfirmDialog
        open={confirmUnlink}
        onOpenChange={setConfirmUnlink}
        title="Unlink your TeamSpeak identity?"
        description="Your server groups are taken away. You can link again at any time with a new key."
        danger
        confirmLabel={<><Unlink /> Unlink</>}
        onConfirm={() => unlink.mutateAsync()}
      />
    </>
  );
}
