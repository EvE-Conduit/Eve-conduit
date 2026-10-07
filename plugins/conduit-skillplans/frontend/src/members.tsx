// Leadership: every member's best character on a shared plan.
import { api, Avatar, Badge, Button, Card, EmptyState, PageHeader, Progress, SearchInput, Segmented, Skeleton, StatCard, Table, TableToolbar, Td, Th, THead, Tr } from "@conduit/sdk";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useParams } from "react-router";

import { Check, Download, Users } from "./icons";
import { BASE, type MemberRow, type PlanBrief, trainTime } from "./types";

type Show = "all" | "done" | "open";

export function MembersPage() {
  const { id } = useParams();
  const [q, setQ] = useState("");
  const [show, setShow] = useState<Show>("all");
  const { data, isLoading, error } = useQuery({
    queryKey: ["skillplans", "members", id],
    queryFn: () => api.get<{ plan: PlanBrief; members: MemberRow[] }>(`${BASE}/plans/${id}/members`),
  });
  if (error) return <EmptyState icon={<Users />} title="Not available" description={(error as Error).message} />;
  if (isLoading || !data) return <Skeleton className="h-96" />;

  const done = data.members.filter((m) => m.complete).length;
  const rows = data.members
    .filter((m) => show === "all" || (show === "done") === m.complete)
    .filter((m) => !q.trim() || `${m.name} ${m.character}`.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <>
      <PageHeader
        eyebrow={<Link to={`/p/skillplans/${data.plan.id}`} className="hover:text-text">{data.plan.name}</Link>}
        title="Members' progress"
        icon={<Users />}
        description="Each member's character closest to finishing the plan."
        actions={<a href={`${BASE}/plans/${data.plan.id}/members.csv`}><Button variant="ghost"><Download /> CSV</Button></a>}
      />
      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <StatCard label="Finished" value={done} tone="success" hint={`of ${data.members.length} members`} />
        <StatCard label="Still training" value={data.members.length - done} />
        <StatCard label="Finished share" value={data.members.length ? `${Math.round((done / data.members.length) * 100)}%` : "—"} />
      </div>
      <Card>
        <TableToolbar>
          <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Member or character" className="w-64" />
          <Segmented size="sm" value={show} onChange={setShow} aria-label="Show"
            options={[{ value: "all", label: "All" }, { value: "done", label: "Finished" }, { value: "open", label: "Training" }]} />
        </TableToolbar>
        {rows.length === 0 ? (
          <EmptyState icon={<Users />} title="Nobody here" />
        ) : (
          <Table>
            <THead>
              <tr>
                <Th>Member</Th>
                <Th>Best character</Th>
                <Th className="w-56">Progress</Th>
                <Th align="right">Time left</Th>
              </tr>
            </THead>
            <tbody>
              {rows.map((m) => (
                <Tr key={m.user_id}>
                  <Td>
                    <div className="flex items-center gap-2">
                      <Avatar src={m.portrait} name={m.name} size="xs" />
                      <span className="font-medium">{m.name}</span>
                    </div>
                  </Td>
                  <Td className="text-sm text-muted">{m.character}{!m.synced && <span className="text-xs text-subtle"> (not synced)</span>}</Td>
                  <Td>
                    {m.complete ? (
                      <Badge tone="success" size="xs"><Check className="size-3" /> Finished</Badge>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Progress value={m.percent} size="xs" className="flex-1" />
                        <span className="w-12 text-right font-mono text-xs tabular-nums">{m.percent}%</span>
                      </div>
                    )}
                  </Td>
                  <Td numeric className="whitespace-nowrap">{m.complete ? "—" : trainTime(m.seconds_left)}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
