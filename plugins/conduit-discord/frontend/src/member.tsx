// A member's own Discord page, and the page Discord sends them back to after signing in.
import {
  Alert, api, Avatar, Badge, Button, Card, CardBody, CardHeader, ConfirmDialog, EmptyState, PageHeader, Skeleton, Spinner, timeAgo, toast,
  useHasPerm,
} from "@conduit/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";

import { Check, DiscordLogo, ExternalLink, Refresh, Settings, Unlink } from "./icons";
import { BASE, type Me } from "./types";

export function useMe() {
  return useQuery({ queryKey: ["discord", "me"], queryFn: () => api.get<Me>(`${BASE}/me`) });
}

/** Ask the server for the Discord sign-in page and go there. */
export function useStartLink() {
  return useMutation({
    mutationFn: () => api.post<{ url: string }>(`${BASE}/link`),
    onSuccess: ({ url }) => window.location.assign(url),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function MemberPage() {
  const qc = useQueryClient();
  const canManage = useHasPerm("discord.manage_discord");
  const { data, isLoading } = useMe();
  const start = useStartLink();
  const [confirmUnlink, setConfirmUnlink] = useState(false);
  const sync = useMutation({
    mutationFn: () => api.post<Me>(`${BASE}/sync`),
    onSuccess: (d) => { qc.setQueryData(["discord", "me"], d); toast.success("Your roles are up to date"); },
    onError: (e: Error) => { qc.invalidateQueries({ queryKey: ["discord", "me"] }); toast.error(e.message); },
  });
  const unlink = useMutation({
    mutationFn: () => api.post<Me>(`${BASE}/unlink`),
    onSuccess: (d) => { qc.setQueryData(["discord", "me"], d); toast.success("Discord account unlinked"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader
        eyebrow="Communication"
        title="Discord"
        icon={<DiscordLogo />}
        description="Link your Discord account to join the server. Your roles and nickname follow your groups and main character."
        actions={canManage ? <Link to="/p/discord/admin"><Button><Settings /> Server setup</Button></Link> : undefined}
      />

      {isLoading || !data ? (
        <Skeleton className="h-56" />
      ) : !data.configured ? (
        <Card>
          <EmptyState
            icon={<DiscordLogo />}
            title="Discord isn't set up yet"
            description={canManage ? "Connect a Discord application and server under Server setup." : "Your leadership hasn't connected a Discord server to this site yet."}
            action={canManage ? <Link to="/p/discord/admin"><Button variant="primary"><Settings /> Server setup</Button></Link> : undefined}
          />
        </Card>
      ) : !data.account ? (
        <Card>
          <div className="grid gap-8 p-card sm:p-8 lg:grid-cols-[1fr_320px] lg:items-center">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-accent-ink">
                <DiscordLogo className="size-8" />
                <span className="text-xl font-semibold text-text">{data.server || "Our Discord server"}</span>
              </div>
              {data.can_link ? (
                <>
                  <p className="max-w-prose text-sm text-muted">
                    Sign in with Discord and you're put on the server straight away, with the roles that go with your groups. Nobody here sees your Discord
                    password or messages; the site only learns your Discord name.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="primary" size="lg" loading={start.isPending} onClick={() => start.mutate()}>
                      <DiscordLogo /> Link Discord and join
                    </Button>
                  </div>
                </>
              ) : (
                <Alert tone="warning" title="You don't have access to the Discord server">
                  Access comes with your membership. Ask your corporation's leadership if you think you should have it.
                </Alert>
              )}
            </div>
            {data.can_link && (
              <div className="border border-border bg-bg/40 p-4 text-sm">
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">You'll get</div>
                <div className="mb-3 font-medium">{data.nickname ?? "Your Discord name"}</div>
                <RoleList roles={data.roles_due} empty="No roles yet; they come with your groups." />
              </div>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            {data.account.error ? (
              <Alert
                tone="warning"
                title="Your Discord roles couldn't be updated"
                action={data.account.error.startsWith("Not on the server") ? <Button size="sm" variant="primary" loading={start.isPending} onClick={() => start.mutate()}>Join the server</Button> : undefined}
              >
                {data.account.error}
              </Alert>
            ) : null}
            <Card>
              <div className="flex flex-col gap-5 p-card sm:flex-row sm:items-center">
                <Avatar src={data.account.avatar} name={data.account.username} size="lg" rounded="full" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-lg font-semibold">{data.account.username}</span>
                    <Badge tone="success"><Check className="size-3" /> Linked</Badge>
                  </div>
                  <div className="text-sm text-muted">
                    on {data.server || "the server"}{data.account.nickname ? <> as <span className="text-text">{data.account.nickname}</span></> : null}
                  </div>
                  <div className="mt-1 text-xs text-subtle">Linked {timeAgo(data.account.linked_at)} · roles checked {timeAgo(data.account.synced_at)}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {data.server_url && (
                    <a href={data.server_url} target="_blank" rel="noreferrer">
                      <Button variant="primary"><ExternalLink /> Open Discord</Button>
                    </a>
                  )}
                  <Button variant="ghost" loading={sync.isPending} onClick={() => sync.mutate()}><Refresh /> Fix my roles</Button>
                  <Button variant="danger" onClick={() => setConfirmUnlink(true)}><Unlink /> Unlink</Button>
                </div>
              </div>
            </Card>
          </div>
          <Card className="h-fit">
            <CardHeader title="Your roles" description="Given by this site. Roles given by hand on Discord aren't touched." />
            <CardBody>
              <RoleList roles={data.roles} empty="None of your groups come with a Discord role." />
            </CardBody>
          </Card>
        </div>
      )}

      <ConfirmDialog
        open={confirmUnlink}
        onOpenChange={setConfirmUnlink}
        title="Unlink your Discord account?"
        description="The roles this site gave you are taken away (you may be removed from the server). You can link again at any time."
        danger
        confirmLabel={<><Unlink /> Unlink</>}
        onConfirm={() => unlink.mutateAsync()}
      />
    </>
  );
}

function RoleList({ roles, empty }: { roles: string[]; empty: string }) {
  if (roles.length === 0) return <p className="text-sm text-subtle">{empty}</p>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {roles.map((r) => (
        <Badge key={r} tone="accent">@{r}</Badge>
      ))}
    </div>
  );
}

/** Discord sends people here with ?code=…&state=… (or ?error=… when they cancelled). */
export function CallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const sent = useRef(false);
  const [error, setError] = useState<string | null>(params.get("error") ? "You cancelled the sign-in with Discord." : null);
  const start = useStartLink();

  useEffect(() => {
    const code = params.get("code");
    const state = params.get("state");
    if (sent.current || error) return;
    if (!code || !state) {
      setError("Discord didn't send a sign-in code back.");
      return;
    }
    sent.current = true; // React may run effects twice; the code only works once
    api
      .post<Me>(`${BASE}/link/finish`, { code, state })
      .then((d) => {
        qc.setQueryData(["discord", "me"], d);
        toast.success(`Welcome to ${d.server || "the server"}, ${d.account?.username ?? ""}`);
        navigate("/p/discord", { replace: true });
      })
      .catch((e: Error) => setError(e.message));
  }, [params, error, navigate, qc]);

  if (!error) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <div className="flex flex-col items-center gap-3 text-sm text-muted">
          <Spinner />
          Linking your Discord account and adding you to the server…
        </div>
      </div>
    );
  }
  return (
    <Card className="mx-auto max-w-xl">
      <EmptyState
        icon={<DiscordLogo />}
        title="Discord wasn't linked"
        description={error}
        action={
          <div className="flex gap-2">
            <Link to="/p/discord"><Button variant="ghost">Back</Button></Link>
            <Button variant="primary" loading={start.isPending} onClick={() => start.mutate()}>Try again</Button>
          </div>
        }
      />
    </Card>
  );
}
