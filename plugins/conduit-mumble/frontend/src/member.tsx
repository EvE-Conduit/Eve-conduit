// A member's own Mumble page: make the account, see how to connect, new password, forget the certificate, delete.
import {
  Alert, api, Badge, Button, Card, CardBody, CardHeader, ConfirmDialog, Dialog, EmptyState, Input, PageHeader, Skeleton, timeAgo, toast,
  useHasPerm,
} from "@conduit/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router";

import { Check, Clock, Key, Mic, Settings, Shield, Trash } from "./icons";
import { ConnectDetails, GroupList } from "./shared";
import { BASE, type Me, type MeWithPassword } from "./types";

export const ME_KEY = ["mumble", "me"];

export function useMe() {
  return useQuery({ queryKey: ME_KEY, queryFn: () => api.get<Me>(`${BASE}/me`) });
}

/** Choose a password or let the site make one; used for the new account and for a new password. */
function PasswordDialog({ open, onOpenChange, title, description, submitLabel, onSubmit, pending }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description: string;
  submitLabel: string;
  onSubmit: (password: string) => void;
  pending: boolean;
}) {
  const [own, setOwn] = useState(false);
  const [password, setPassword] = useState("");
  const tooShort = own && password.trim().length < 8;
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => { onOpenChange(o); if (!o) { setOwn(false); setPassword(""); } }}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="primary" loading={pending} disabled={tooShort} onClick={() => onSubmit(own ? password.trim() : "")}>{submitLabel}</Button>
        </>
      }
    >
      <div className="space-y-3">
        <label className="flex cursor-pointer items-start gap-3 border border-border p-3 text-sm has-[:checked]:border-accent">
          <input type="radio" name="pw" className="mt-0.5" checked={!own} onChange={() => setOwn(false)} />
          <span>
            <span className="font-medium">Make one up for me</span>
            <span className="block text-xs text-muted">A random password, shown once. Mumble remembers it for you.</span>
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-3 border border-border p-3 text-sm has-[:checked]:border-accent">
          <input type="radio" name="pw" className="mt-0.5" checked={own} onChange={() => setOwn(true)} />
          <span className="min-w-0 flex-1">
            <span className="font-medium">I'll choose one</span>
            <span className="block text-xs text-muted">At least 8 characters. Don't reuse your EVE or email password.</span>
            {own && (
              <Input type="password" autoComplete="new-password" autoFocus value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2" placeholder="Mumble password" />
            )}
          </span>
        </label>
      </div>
    </Dialog>
  );
}

export function MemberPage() {
  const qc = useQueryClient();
  const canManage = useHasPerm("mumble.manage_mumble");
  const { data, isLoading } = useMe();
  const [creating, setCreating] = useState(false);
  const [changing, setChanging] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  // The password is shown right after it's made, and nowhere else afterwards.
  const [fresh, setFresh] = useState<{ password: string; url: string | null } | null>(null);

  const done = (d: MeWithPassword, message: string) => {
    qc.setQueryData(ME_KEY, d);
    setFresh({ password: d.password, url: d.connect_url });
    setCreating(false);
    setChanging(false);
    toast.success(message);
  };
  const create = useMutation({
    mutationFn: (password: string) => api.post<MeWithPassword>(`${BASE}/account`, { password }),
    onSuccess: (d) => done(d, "Your Mumble account is ready"),
    onError: (e: Error) => toast.error(e.message),
  });
  const change = useMutation({
    mutationFn: (password: string) => api.post<MeWithPassword>(`${BASE}/account/password`, { password }),
    onSuccess: (d) => done(d, "New password set"),
    onError: (e: Error) => toast.error(e.message),
  });
  const forget = useMutation({
    mutationFn: () => api.delete<Me>(`${BASE}/account/certificate`),
    onSuccess: (d) => { qc.setQueryData(ME_KEY, d); toast.success("Certificate forgotten; next time Mumble asks for your password"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: () => api.delete<Me>(`${BASE}/account`),
    onSuccess: (d) => { qc.setQueryData(ME_KEY, d); setFresh(null); toast.success("Mumble account deleted"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader
        eyebrow="Communication"
        title="Mumble"
        icon={<Mic />}
        description="Voice comms. Your Mumble account follows your groups and main character; you only need a password."
        actions={
          <div className="flex gap-2">
            {data?.can_temp && <Link to="/p/mumble/temp"><Button><Clock /> Temporary access</Button></Link>}
            {canManage && <Link to="/p/mumble/admin"><Button><Settings /> Server setup</Button></Link>}
          </div>
        }
      />

      {isLoading || !data ? (
        <Skeleton className="h-56" />
      ) : !data.configured ? (
        <Card>
          <EmptyState
            icon={<Mic />}
            title="Mumble isn't set up yet"
            description={canManage ? "Enter the server's address under Server setup." : "Your leadership hasn't connected a Mumble server to this site yet."}
            action={canManage ? <Link to="/p/mumble/admin"><Button variant="primary"><Settings /> Server setup</Button></Link> : undefined}
          />
        </Card>
      ) : !data.account ? (
        <Card>
          <div className="grid gap-8 p-card sm:p-8 lg:grid-cols-[1fr_320px] lg:items-center">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-accent-ink">
                <Mic className="size-8" />
                <span className="text-xl font-semibold text-text">{data.server.name}</span>
              </div>
              {data.can_link ? (
                <>
                  <p className="max-w-prose text-sm text-muted">
                    Make your Mumble account here, then connect with the Mumble client. Your name and groups in Mumble come from this site, so
                    there's nothing to register on the server itself.
                  </p>
                  <Button variant="primary" size="lg" onClick={() => setCreating(true)}><Key /> Create my Mumble account</Button>
                </>
              ) : (
                <Alert tone="warning" title="You don't have access to Mumble">
                  Access comes with your membership. Ask your corporation's leadership if you think you should have it.
                </Alert>
              )}
            </div>
            {data.can_link && (
              <div className="border border-border bg-bg/40 p-4 text-sm">
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">You'll be</div>
                <div className="font-medium">{data.display_preview}</div>
                <div className="mb-3 font-mono text-xs text-muted">login: {data.username_preview}</div>
                <GroupList groups={data.groups_due} empty="No Mumble groups yet; they come with your groups." />
              </div>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            {fresh && (
              <Alert tone="success" title="Your password. Keep it: it isn't shown again." action={<Button size="sm" variant="ghost" onClick={() => setFresh(null)}>Done</Button>}>
                <div className="mt-2">
                  <ConnectDetails server={data.server} username={data.account.username} password={fresh.password} url={fresh.url} />
                </div>
              </Alert>
            )}
            <Card>
              <div className="flex flex-col gap-5 p-card sm:flex-row sm:items-start">
                <span className="grid size-14 shrink-0 place-items-center bg-accent-soft text-accent-ink"><Mic className="size-7" /></span>
                <div className="min-w-0 flex-1 space-y-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-lg font-semibold">{data.account.display_name}</span>
                      <Badge tone="success"><Check className="size-3" /> Account ready</Badge>
                    </div>
                    <div className="text-sm text-muted">on {data.server.name}</div>
                    <div className="mt-1 text-xs text-subtle">
                      Created {timeAgo(data.account.created_at)} · {data.account.last_login_at ? `last connected ${timeAgo(data.account.last_login_at)}` : "never connected yet"}
                    </div>
                  </div>
                  {!fresh && <ConnectDetails server={data.server} username={data.account.username} url={data.account.url} />}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 border-t border-border px-card py-3">
                <Button variant="secondary" onClick={() => setChanging(true)}><Key /> New password</Button>
                {data.account.certificate_remembered && (
                  <Button variant="ghost" loading={forget.isPending} onClick={() => forget.mutate()}><Shield /> Forget my certificate</Button>
                )}
                <Button variant="danger" onClick={() => setConfirmDelete(true)}><Trash /> Delete account</Button>
              </div>
            </Card>
            {data.cert_auth && (
              <p className="text-xs text-subtle">
                {data.account.certificate_remembered
                  ? "Your Mumble certificate is remembered: that computer gets in without the password. Forget it if you've switched machines or want to be asked again."
                  : "After your first login with the password, the server remembers your Mumble certificate and lets that computer in without it."}
              </p>
            )}
          </div>
          <Card className="h-fit">
            <CardHeader title="Your Mumble groups" description="For the server's channel permissions. They're worked out fresh every time you connect." />
            <CardBody>
              <GroupList groups={data.groups_due} empty="None of your groups come with a Mumble group." />
              {data.account.groups.join() !== data.groups_due.join() && data.account.last_login_at && (
                <p className="mt-3 text-xs text-subtle">Changed since you last connected; reconnect to pick them up.</p>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      <PasswordDialog
        open={creating}
        onOpenChange={setCreating}
        title="Create your Mumble account"
        description={`You'll sign in as ${data?.username_preview ?? "…"}.`}
        submitLabel="Create account"
        pending={create.isPending}
        onSubmit={(pw) => create.mutate(pw)}
      />
      <PasswordDialog
        open={changing}
        onOpenChange={setChanging}
        title="New Mumble password"
        description="The old one stops working straight away. Update it in your Mumble client's server list."
        submitLabel="Set password"
        pending={change.isPending}
        onSubmit={(pw) => change.mutate(pw)}
      />
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete your Mumble account?"
        description="You can't connect to Mumble until you make a new one. Your username may be taken by then."
        danger
        confirmLabel={<><Trash /> Delete</>}
        onConfirm={() => remove.mutateAsync()}
      />
    </>
  );
}
