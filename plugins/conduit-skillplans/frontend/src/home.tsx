// Skill plans overview: shared plans and my own, with my best character's progress on each.
import {
  api, Badge, Button, Card, EmptyState, PageHeader, Progress, SearchInput, Skeleton, Table, TableToolbar, TabPanel, Tabs, Td, Th,
  THead, Tr,
} from "@conduit/sdk";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router";

import { Cap, Check, Plus } from "./icons";
import { BASE, type Overview, type PlanBrief, trainTime } from "./types";

export function useOverview() {
  return useQuery({ queryKey: ["skillplans", "overview"], queryFn: () => api.get<Overview>(BASE) });
}

export function HomePage() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const { data, isLoading } = useOverview();
  const match = (p: PlanBrief) => !q.trim() || `${p.name} ${p.category}`.toLowerCase().includes(q.trim().toLowerCase());
  const shared = (data?.plans ?? []).filter((p) => p.shared && match(p));
  const mine = (data?.plans ?? []).filter((p) => !p.shared && match(p));

  return (
    <>
      <PageHeader
        eyebrow="Character"
        title="Skill Plans"
        icon={<Cap />}
        description="What to train, in order, with how far each of your characters is and how long the rest takes. Copy a plan into the game's Skill Plans or skill queue."
        actions={<Button variant="primary" onClick={() => navigate("/p/skillplans/new")}><Plus /> New plan</Button>}
      />

      {isLoading || !data ? (
        <Skeleton className="h-64" />
      ) : (
        <Tabs
          variant="pills"
          defaultValue="shared"
          className="space-y-4"
          items={[
            { value: "shared", label: "Shared plans", count: shared.length },
            { value: "mine", label: "My plans", count: mine.length },
          ]}
        >
          <TabPanel value="shared">
            <PlanTable plans={shared} q={q} setQ={setQ}
              empty={data.can_manage ? "Make one with New plan and tick Shared." : "Leadership hasn't shared any plans yet."} />
          </TabPanel>
          <TabPanel value="mine">
            <PlanTable plans={mine} q={q} setQ={setQ} empty="Make your own with New plan, or copy a shared one." />
          </TabPanel>
        </Tabs>
      )}
    </>
  );
}

function PlanTable({ plans, q, setQ, empty }: { plans: PlanBrief[]; q: string; setQ: (q: string) => void; empty: string }) {
  const navigate = useNavigate();
  return (
    <Card>
      <TableToolbar>
        <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Plan or category" className="w-64" />
      </TableToolbar>
      {plans.length === 0 ? (
        <EmptyState icon={<Cap />} title={q ? "No plan matches" : "No plans here yet"} description={q ? undefined : empty} />
      ) : (
        <Table>
          <THead>
            <tr>
              <Th>Plan</Th>
              <Th align="right">Skills</Th>
              <Th>My best character</Th>
              <Th align="right">Time left</Th>
            </tr>
          </THead>
          <tbody>
            {plans.map((p) => (
              <Tr key={p.id} interactive onClick={() => navigate(`/p/skillplans/${p.id}`)}>
                <Td>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{p.name}</span>
                    {p.category && <Badge size="xs">{p.category}</Badge>}
                  </div>
                  {p.description && <div className="line-clamp-1 max-w-md text-xs text-subtle">{p.description}</div>}
                </Td>
                <Td numeric>{p.skills}</Td>
                <Td className="min-w-48">
                  {p.me ? (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="truncate text-muted">{p.me.character}</span>
                        {p.me.complete
                          ? <Badge tone="success" size="xs"><Check className="size-3" /> Done</Badge>
                          : <span className="font-mono tabular-nums">{p.me.percent}%</span>}
                      </div>
                      <Progress value={p.me.percent} size="xs" tone={p.me.complete ? "success" : "accent"} />
                    </div>
                  ) : <span className="text-xs text-subtle">No characters</span>}
                </Td>
                <Td numeric className="whitespace-nowrap">{p.me && !p.me.complete ? trainTime(p.me.seconds_left) : "—"}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </Card>
  );
}
