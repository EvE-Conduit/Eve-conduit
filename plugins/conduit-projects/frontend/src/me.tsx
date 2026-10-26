// A member's own claims and deliveries, across every project.
import { api, Card, EmptyState, num, PageHeader, Skeleton, StatCard, Table, Td, Th, THead, timeAgo, Tr } from "@conduit/sdk";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";

import { Package } from "./icons";
import { ContributionBadge, IndustryHintText } from "./shared";
import { BASE, type ContributionRow } from "./types";

interface MeOut {
  contributions: ContributionRow[];
  totals: { open: number; confirmed: number; points: number; projects: number };
}

export function MyPage() {
  const { data, isLoading } = useQuery({ queryKey: ["projects", "me"], queryFn: () => api.get<MeOut>(`${BASE}/me`) });
  return (
    <>
      <PageHeader eyebrow="Industry" title="My contributions" icon={<Package />} description="What you claimed and delivered. Open a project to mark something delivered." />
      {isLoading || !data ? (
        <Skeleton className="h-64" />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Being built" value={data.totals.open} hint="claimed or waiting for a manager" />
            <StatCard label="Delivered" value={data.totals.confirmed} tone="success" hint="confirmed deliveries" />
            <StatCard label="Projects helped" value={data.totals.projects} />
            <StatCard label="Points earned" value={data.totals.points} hint="paid by the Corp Store" />
          </div>
          <Card>
            {data.contributions.length === 0 ? (
              <EmptyState icon={<Package />} title="Nothing yet" description={<>Claim something on the <Link to="/p/projects" className="text-accent-ink hover:underline">projects board</Link>.</>} />
            ) : (
              <Table>
                <THead>
                  <tr>
                    <Th>Item</Th>
                    <Th>Project</Th>
                    <Th align="right">Quantity</Th>
                    <Th>Status</Th>
                    <Th align="right">Points</Th>
                    <Th align="right">Claimed</Th>
                  </tr>
                </THead>
                <tbody>
                  {data.contributions.map((c) => (
                    <Tr key={c.id}>
                      <Td>
                        <div className="font-medium">{c.item}</div>
                        <IndustryHintText hint={c.industry} />
                        {c.review_note && c.status === "claimed" && <div className="text-xs text-warning-fg">Sent back: {c.review_note}</div>}
                      </Td>
                      <Td><Link to={`/p/projects/${c.project.id}`} className="hover:text-accent-ink">{c.project.name}</Link></Td>
                      <Td align="right" className="font-mono">{num(c.quantity)}</Td>
                      <Td><ContributionBadge status={c.status} /></Td>
                      <Td align="right" className="font-mono">{c.points ? num(c.points) : "—"}</Td>
                      <Td align="right" className="text-xs text-muted">{timeAgo(c.created_at)}</Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
