// What a guest sees: the page a temporary link opens (/public/p/discord/guest/<token>), and the one Discord sends
// them back to after signing in (/public/p/discord/guest?code=…&state=…).
import { Alert, api, Avatar, Button, Card, CardBody, CardHeader, EmptyState, PageHeader, Skeleton, Spinner, toast } from "@conduit/sdk";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router";

import { untilText } from "./guests";
import { Clock, DiscordLogo, ExternalLink } from "./icons";
import { type GuestJoined, PUBLIC_BASE, type PublicGuestLink } from "./types";

const CLOSED: Record<string, string> = {
  expired: "This link has expired. Ask whoever gave it to you for a new one.",
  revoked: "This link was withdrawn.",
  used_up: "This link has been used by as many people as it allows.",
  creator_lost: "Whoever gave you this link can't hand out access any more. Ask someone else for a new one.",
};

export function PublicGuestPage() {
  const { token } = useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ["discord", "public", token],
    queryFn: () => api.get<PublicGuestLink>(`${PUBLIC_BASE}/guest/${token}`),
    retry: false,
  });
  const start = useMutation({
    mutationFn: () => api.post<{ url: string }>(`${PUBLIC_BASE}/guest/${token}/start`),
    onSuccess: (r) => window.location.assign(r.url),
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <Skeleton className="h-64" />;
  if (error || !data) {
    return (
      <Card className="mx-auto max-w-xl">
        <EmptyState icon={<DiscordLogo />} title="This link doesn't work" description="It may have been withdrawn, or it was copied wrongly. Ask whoever gave it to you for a new one." />
      </Card>
    );
  }
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        icon={<DiscordLogo />}
        eyebrow="Temporary Discord access"
        title={data.server || "Discord server"}
        description={<>{data.invited_by ? <>{data.invited_by} invited you</> : "You're invited"} for <b>{data.label}</b>.</>}
      />
      {data.status !== "active" ? (
        <Card><EmptyState icon={<Clock />} title="This link is closed" description={CLOSED[data.status]} /></Card>
      ) : (
        <Card>
          <CardHeader title="Join with your Discord account" description="Discord asks you to confirm, then you're added to the server as a guest." />
          <CardBody className="space-y-4">
            <Button variant="primary" size="lg" loading={start.isPending || start.isSuccess} onClick={() => start.mutate()}><DiscordLogo /> Join with Discord</Button>
            <p className="text-xs text-subtle">
              <Clock className="mr-1 inline size-3 align-[-2px]" />
              Your access ends {new Date(data.expires_at).toLocaleString()} ({untilText(data.expires_at)}); you are removed from the server then.
              This site learns your Discord name and nothing else.
            </p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

/** Discord sends guests here with ?code=…&state=… (or ?error=… when they cancelled). */
export function PublicGuestCallbackPage() {
  const [params] = useSearchParams();
  const sent = useRef(false);
  const [joined, setJoined] = useState<GuestJoined | null>(null);
  const [error, setError] = useState<string | null>(params.get("error") ? "You cancelled the sign-in with Discord. Open your link again to retry." : null);

  useEffect(() => {
    const code = params.get("code");
    const state = params.get("state");
    if (sent.current || error) return;
    if (!code || !state) {
      setError("Discord didn't send a sign-in code back. Open your link again.");
      return;
    }
    sent.current = true; // React may run effects twice; the code only works once
    api.post<GuestJoined>(`${PUBLIC_BASE}/guest-finish`, { code, state }).then(setJoined).catch((e: Error) => setError(e.message));
  }, [params, error]);

  if (error) {
    return (
      <Card className="mx-auto max-w-xl">
        <EmptyState icon={<DiscordLogo />} title="You weren't added to the server" description={error} />
      </Card>
    );
  }
  if (!joined) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <div className="flex flex-col items-center gap-3 text-sm text-muted">
          <Spinner />
          Adding you to the server…
        </div>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader icon={<DiscordLogo />} eyebrow="Temporary Discord access" title={joined.server || "Discord server"} description={<>You're in for <b>{joined.label}</b>.</>} />
      <Card>
        <CardBody className="space-y-4">
          <div className="flex items-center gap-3">
            <Avatar src={joined.avatar} name={joined.username} size="lg" />
            <div>
              <div className="font-medium">Welcome, {joined.username}</div>
              <div className="text-xs text-subtle">The server is in your Discord server list now.</div>
            </div>
          </div>
          <a href={joined.server_url} target="_blank" rel="noreferrer">
            <Button variant="primary"><ExternalLink /> Open Discord</Button>
          </a>
          <Alert tone="info" title={`Access ends ${new Date(joined.expires_at).toLocaleString()}`} icon={<Clock />}>
            {untilText(joined.expires_at)}. You are removed from the server then.
          </Alert>
        </CardBody>
      </Card>
    </div>
  );
}
