// A member's own page: losses they can claim and their requests.
import {
  Alert, api, Button, Card, CardHeader, EmptyState, isk, PageHeader, Skeleton, StatCard, Table, Td, Th, THead, timeAgo, Tr, useHasPerm,
} from "@conduit/sdk";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate } from "react-router";

import { ExternalLink, LifeBuoy, LinkIcon } from "./icons";
import { ClaimDialog, ShipCell, StatusBadge, SystemText } from "./shared";
import { BASE, type Loss, type Me } from "./types";

/** Reviewers and payers both work from the queue. */
export function useCanReview() {
  const review = useHasPerm("srp.review_requests");
  const pay = useHasPerm("srp.pay_requests");
  return review || pay;
}

export function useMe() {
  return useQuery({ queryKey: ["srp", "me"], queryFn: () => api.get<Me>(`${BASE}/me`) });
}

export function MySrpPage() {
  const navigate = useNavigate();
  const canReview = useCanReview();
  const { data, isLoading } = useMe();
  const [claim, setClaim] = useState<Loss | "link" | null>(null);

  return (
    <>
      <PageHeader
        eyebrow="Ship replacement"
        title="My SRP"
        icon={<LifeBuoy />}
        description="Claim ships you lost on fleet. A reviewer checks the loss, approves a payout and the ISK is sent to the character."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {canReview && (
              <Link to="/p/srp">
                <Button variant="ghost">Review queue</Button>
              </Link>
            )}
            <Button onClick={() => setClaim("link")}>
              <LinkIcon /> Claim from kill link
            </Button>
          </div>
        }
      />

      {isLoading || !data ? (
        <div className="grid gap-4 sm:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-28" />)}</div>
      ) : (
        <div className="space-y-6">
          {data.settings.rules_text && (
            <Alert tone="info" title="How SRP works here">
              <span className="whitespace-pre-line">{data.settings.rules_text}</span>
            </Alert>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Waiting for review" value={data.totals.pending} hint={data.totals.pending === 1 ? "request" : "requests"} tone={data.totals.pending ? "info" : undefined} />
            <StatCard label="Approved, not paid yet" value={isk(data.totals.approved)} mono tone={data.totals.approved ? "accent" : undefined} />
            <StatCard label="Paid to you" value={isk(data.totals.paid)} mono tone={data.totals.paid ? "success" : undefined} hint="all time" />
          </div>

          <Card>
            <CardHeader
              title="Losses you can claim"
              description={`From the last ${data.settings.max_age_days} days, found in your characters' killmails.`}
            />
            {data.losses.length === 0 ? (
              <EmptyState
                icon={<LifeBuoy />}
                title="No unclaimed losses"
                description="Losses show up here once your characters' killmails have synced (they need the killmail scope). Missing one? Claim it from its kill link."
              />
            ) : (
              <Table>
                <THead>
                  <tr>
                    <Th>Ship</Th>
                    <Th>Where</Th>
                    <Th>When</Th>
                    <Th align="right">Loss</Th>
                    <Th align="right">Payout</Th>
                    <Th />
                  </tr>
                </THead>
                <tbody>
                  {data.losses.map((l) => (
                    <Tr key={l.killmail_id}>
                      <Td><ShipCell ship={l.ship} sub={l.character.name} /></Td>
                      <Td className="text-sm"><SystemText system={l.system} /></Td>
                      <Td className="whitespace-nowrap text-sm text-muted">{timeAgo(l.time)}</Td>
                      <Td numeric className="text-muted">{isk(l.value)}</Td>
                      <Td numeric>{l.suggested == null ? <span className="text-subtle">not covered</span> : isk(l.suggested)}</Td>
                      <Td align="right">
                        <div className="flex items-center justify-end gap-1">
                          <a href={l.zkillboard} target="_blank" rel="noreferrer" title="Open on zKillboard">
                            <Button variant="ghost" size="icon-sm" aria-label="Open on zKillboard"><ExternalLink /></Button>
                          </a>
                          <Button size="sm" variant="primary" disabled={l.suggested == null} onClick={() => setClaim(l)}>Claim</Button>
                        </div>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>

          <Card>
            <CardHeader title="My requests" />
            {data.requests.length === 0 ? (
              <EmptyState icon={<LifeBuoy />} title="You haven't asked for SRP yet" />
            ) : (
              <Table>
                <THead>
                  <tr>
                    <Th>Ship</Th>
                    <Th>Fleet</Th>
                    <Th>Sent</Th>
                    <Th align="right">Payout</Th>
                    <Th align="right">Status</Th>
                  </tr>
                </THead>
                <tbody>
                  {data.requests.map((r) => (
                    <Tr key={r.id} interactive onClick={() => navigate(`/p/srp/requests/${r.id}`)}>
                      <Td><ShipCell ship={r.ship} sub={r.character.name} /></Td>
                      <Td className="text-sm text-muted">{r.fleet || "—"}</Td>
                      <Td className="whitespace-nowrap text-sm text-muted">{timeAgo(r.created_at)}</Td>
                      <Td numeric>{isk(r.payout ?? r.suggested)}</Td>
                      <Td align="right"><StatusBadge status={r.status} /></Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
        </div>
      )}

      {claim && <ClaimDialog loss={claim === "link" ? null : claim} requireFleet={data?.settings.require_fleet ?? true} onClose={() => setClaim(null)} />}
    </>
  );
}
