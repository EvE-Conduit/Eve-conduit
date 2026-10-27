// One member's findings across all their characters. Opening it is noted in the snooper log for each of them.
import { api, Avatar, Badge, Card, CardHeader, EmptyState, PageHeader, Skeleton } from "@conduit/sdk";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useParams } from "react-router";

import { ArrowLeft, Check } from "./icons";
import { EvidenceDialog, FindingsTable } from "./shared";
import { BASE, type Finding, type MemberDetail } from "./types";

export function MemberPage() {
  const { id } = useParams();
  const [open, setOpen] = useState<Finding | null>(null);
  const { data, isLoading } = useQuery({ queryKey: ["spycheck", "member", id], queryFn: () => api.get<MemberDetail>(`${BASE}/members/${id}`) });
  if (isLoading || !data) return <Skeleton className="h-64" />;
  const open_ = data.findings.filter((f) => f.state === "new").length;
  return (
    <>
      <Link to="/p/spycheck?tab=members" className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-text"><ArrowLeft /> Members</Link>
      <PageHeader
        eyebrow="Spy Check"
        title={data.user.name}
        icon={<Avatar src={data.user.portrait} name={data.user.name} size="md" />}
        description={`${data.user.corporation ?? "No corporation"} · ${data.characters.length} character${data.characters.length === 1 ? "" : "s"} · ${open_} new finding${open_ === 1 ? "" : "s"}`}
      />
      <div className="space-y-6">
        <Card>
          <CardHeader title="Characters" />
          <ul className="flex flex-wrap gap-2 px-card pb-4">
            {data.characters.map((c) => (
              <li key={c.id}>
                <Link to={`/characters/${c.id}`} className="flex items-center gap-2 border border-border px-2 py-1 text-sm hover:bg-hover">
                  <Avatar src={c.portrait} name={c.name} size="sm" />
                  {c.name}
                  {c.findings > 0 ? <Badge tone="warning">{c.findings}</Badge> : <Badge tone="success">Clean</Badge>}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardHeader title="Findings" description="Every kind of dealing with a watched entity, on any of their characters." />
          {data.findings.length === 0 ? (
            <EmptyState icon={<Check />} title="No findings" />
          ) : (
            <FindingsTable items={data.findings} onOpen={setOpen} showMember={false} />
          )}
        </Card>
      </div>
      <EvidenceDialog finding={open} onClose={() => setOpen(null)} />
    </>
  );
}
