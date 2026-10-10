// The page a guest opens from a temporary link (/public/p/mumble/temp/<token>): pick a name, get a login.
import { Alert, api, Button, Card, CardBody, CardHeader, EmptyState, Field, Input, PageHeader, Skeleton, toast } from "@conduit/sdk";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useParams } from "react-router";

import { Clock, Mic } from "./icons";
import { ConnectDetails, untilText } from "./shared";
import { PUBLIC_BASE, type PublicLink, type Redeemed } from "./types";

export function PublicTempPage() {
  const { token } = useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ["mumble", "public", token],
    queryFn: () => api.get<PublicLink>(`${PUBLIC_BASE}/temp/${token}`),
    retry: false,
  });
  const [name, setName] = useState("");
  const [login, setLogin] = useState<Redeemed | null>(null);
  const redeem = useMutation({
    mutationFn: () => api.post<Redeemed>(`${PUBLIC_BASE}/temp/${token}`, { name: name.trim() }),
    onSuccess: setLogin,
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <Skeleton className="h-64" />;
  if (error || !data) {
    return (
      <Card className="mx-auto max-w-xl">
        <EmptyState icon={<Mic />} title="This link doesn't work" description="It may have been withdrawn, or it was copied wrongly. Ask whoever gave it to you for a new one." />
      </Card>
    );
  }
  const closed: Record<string, string> = {
    expired: "This link has expired. Ask whoever gave it to you for a new one.",
    revoked: "This link was withdrawn.",
    used_up: "This link has been used by as many people as it allows.",
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        icon={<Mic />}
        eyebrow="Temporary voice access"
        title={data.server}
        description={<>{data.invited_by ? <>{data.invited_by} invited you</> : "You're invited"} for <b>{data.label}</b>.</>}
      />
      {login ? (
        <Card>
          <CardHeader title={`Welcome, ${login.display_name}`} description="Keep this page open or copy the details: the password isn't shown again." />
          <CardBody className="space-y-4">
            <ConnectDetails server={{ name: login.server, host: login.host, port: login.port }} username={login.username} password={login.password} url={login.url} />
            <Alert tone="info" title={`Access ends ${new Date(login.expires_at).toLocaleString()}`} icon={<Clock />}>
              {untilText(login.expires_at)}. In the Mumble client: Server → Connect → Add New, paste the address, port and username, then connect and enter the password when asked.
            </Alert>
          </CardBody>
        </Card>
      ) : data.status !== "active" ? (
        <Card>
          <EmptyState icon={<Clock />} title="This link is closed" description={closed[data.status]} />
        </Card>
      ) : (
        <Card>
          <CardHeader title="Choose a name" description="That's how you'll appear in Mumble. Letters and digits work best." />
          <CardBody className="space-y-4">
            <form
              className="flex flex-col gap-3 sm:flex-row sm:items-end"
              onSubmit={(e) => { e.preventDefault(); if (name.trim().length >= 2) redeem.mutate(); }}
            >
              <Field label="Your name" className="flex-1">
                <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="e.g. Jane from Blue Corp" />
              </Field>
              <Button type="submit" variant="primary" size="lg" loading={redeem.isPending} disabled={name.trim().length < 2}><Mic /> Get my login</Button>
            </form>
            <p className="text-xs text-subtle">
              <Clock className="mr-1 inline size-3 align-[-2px]" />
              Valid until {new Date(data.expires_at).toLocaleString()} ({untilText(data.expires_at)}). You'll need the free Mumble client from mumble.info.
            </p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
