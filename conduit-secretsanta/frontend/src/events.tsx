// The list of events: the ones you can join, the ones you're in, and for organisers all of them.
import { api, Badge, Button, Card, CardBody, dateTime, EmptyState, isk, PageHeader, Skeleton } from "@conduit/sdk";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router";

import { Editor } from "./editor";
import { Gift, Plus } from "./icons";
import { BASE, type EventList, PHASE } from "./types";

export function EventsPage() {
  const [creating, setCreating] = useState(false);
  const { data, isLoading } = useQuery({ queryKey: ["secretsanta", "events"], queryFn: () => api.get<EventList>(`${BASE}/events`) });
  const create = data?.can_organise && <Button variant="primary" onClick={() => setCreating(true)}><Plus /> New event</Button>;
  return (
    <>
      <PageHeader
        eyebrow="Community"
        title="Secret Santa"
        icon={<Gift />}
        description="Sign up, get someone to give to, and send them a gift. Nobody knows who their Secret Santa is."
        actions={create}
      />
      {isLoading || !data ? (
        <Skeleton className="h-40" />
      ) : data.events.length === 0 ? (
        <EmptyState
          icon={<Gift />}
          title="No Secret Santa right now"
          description={data.can_organise ? "Create an event and people can sign up." : "When organisers start one, it shows here."}
          action={create || undefined}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.events.map((e) => (
            <Link key={e.id} to={`/p/secretsanta/${e.id}`} className="block">
              <Card className="h-full transition-colors hover:border-border-strong">
                <CardBody className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-semibold">{e.name}</span>
                    <span className="flex shrink-0 gap-1.5">
                      {e.joined && <Badge tone="info">You're in</Badge>}
                      <Badge tone={PHASE[e.phase].tone}>{PHASE[e.phase].label}</Badge>
                    </span>
                  </div>
                  {e.description && <p className="line-clamp-2 text-sm text-muted">{e.description}</p>}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-subtle">
                    <span>Sign-up closes {dateTime(e.signup_closes_at)}</span>
                    <span>Gifts by {dateTime(e.gift_deadline)}</span>
                    {e.budget_isk != null && <span>About {isk(e.budget_isk)}</span>}
                    <span>{e.participants} signed up</span>
                  </div>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      )}
      {creating && <Editor event={null} onClose={() => setCreating(false)} />}
    </>
  );
}
