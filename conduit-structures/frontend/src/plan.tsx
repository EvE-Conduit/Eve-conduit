// The fuel plan: blocks to top every structure up to N days, as a shopping list per staging or system.
import { api, Badge, Card, CardHeader, cn, duration, EmptyState, Field, Input, isk, num, PageHeader, Skeleton, StatCard, Table, Td, Th, THead, Tooltip, Tr } from "@conduit/sdk";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link } from "react-router";

import { useNow } from "./board";
import { Back, Fuel, Hand, Truck } from "./icons";
import { BASE, type Board, LEVEL, type Plan } from "./types";

export function PlanPage() {
  const { data: board } = useQuery({ queryKey: ["structures", "board"], queryFn: () => api.get<Board>(`${BASE}/board`) });
  const [days, setDays] = useState("");
  const [asked, setAsked] = useState(0);
  useEffect(() => {
    if (board && !days) setDays(String(board.plan_days));
  }, [board, days]);
  // Ask once the number has settled, not on every keystroke.
  useEffect(() => {
    const n = Number(days);
    const id = window.setTimeout(() => n >= 1 && n <= 365 && setAsked(n), 400);
    return () => window.clearTimeout(id);
  }, [days]);
  const { data, isLoading } = useQuery({
    queryKey: ["structures", "plan", asked],
    queryFn: () => api.get<Plan>(`${BASE}/plan?days=${asked}`),
    enabled: asked > 0,
  });
  const now = useNow();

  return (
    <>
      <Link to="/p/structures" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-text"><Back /> Structures & Fuel</Link>
      <PageHeader
        eyebrow="Structures & Fuel"
        title="Fuel plan"
        icon={<Truck />}
        description="Fuel blocks to top every structure up, from what its online services burn. Any race's blocks work in any Upwell structure."
        actions={
          <Field label="Top up to (days)">
            <Input type="number" min={1} max={365} value={days} onChange={(e) => setDays(e.target.value)} className="w-28 font-mono" />
          </Field>
        }
      />
      {isLoading || !data ? (
        <Skeleton className="h-64" />
      ) : data.groups.length === 0 ? (
        <Card><EmptyState icon={<Fuel />} title="Nothing burns fuel" description="None of the structures you can see have services online." /></Card>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Blocks to buy" value={num(data.blocks)} icon={<Fuel />} hint={`for ${data.days} days`} />
            <StatCard label="Volume" value={`${num(data.volume)} m³`} icon={<Truck />} mono />
            <StatCard label="Burn" value={num(data.per_day)} hint="blocks a day, all structures" />
            <StatCard label="Cost" value={data.cost != null ? isk(data.cost) : "—"} hint={data.block_price != null ? `at ${isk(data.block_price)} a block (cheapest average price)` : "no fuel block prices yet"} mono />
          </div>
          {data.groups.map((g) => (
            <Card key={g.key}>
              <CardHeader
                title={g.label}
                description={[g.kind === "staging" ? g.systems.join(", ") : null, g.region, `${num(g.per_day)} blocks a day`].filter(Boolean).join(" · ")}
                actions={
                  g.blocks > 0 ? (
                    <div className="text-right">
                      <div className="font-mono text-lg font-semibold tabular-nums">{num(g.blocks)} blocks</div>
                      <div className="text-xs text-muted">{num(g.volume)} m³</div>
                    </div>
                  ) : <Badge tone="success">Topped up</Badge>
                }
              />
              <Table>
                <THead>
                  <tr>
                    <Th>Structure</Th>
                    <Th>Fuel left</Th>
                    <Th align="right">Burn</Th>
                    <Th align="right">Needs</Th>
                  </tr>
                </THead>
                <tbody>
                  {g.structures.map((s) => (
                    <Tr key={s.id}>
                      <Td>
                        <div className="flex items-center gap-2.5">
                          <img src={s.type.icon} alt="" className="size-7 rounded-md" />
                          <div className="min-w-0">
                            <div className="truncate font-medium">{s.name}</div>
                            <div className="truncate text-xs text-muted">{s.type.name} · [{s.corporation.ticker}]{g.kind === "staging" && ` · ${s.system.name}`}</div>
                          </div>
                          {s.claims.length > 0 && (
                            <Tooltip content={`${s.claims.map((c) => c.user).join(", ")} ${s.claims.length === 1 ? "is" : "are"} refuelling it`}>
                              <span><Hand className="size-3.5 text-success-fg" /></span>
                            </Tooltip>
                          )}
                        </div>
                      </Td>
                      <Td>
                        <span className={cn("font-mono text-xs tabular-nums", s.level === "ok" ? "text-text" : LEVEL[s.level].tone === "danger" ? "text-danger-fg" : "text-warning-fg")}>
                          {s.fuel_expires ? duration(s.fuel_expires, now) : LEVEL[s.level].label}
                        </span>
                      </Td>
                      <Td numeric>{num(s.fuel_expires ? s.burn : s.burn_all)}/h</Td>
                      <Td numeric className={cn(s.need === 0 && "text-subtle")}>{num(s.need)}</Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </Card>
          ))}
          <p className="text-xs text-subtle">
            Structures out of fuel are planned at what all their fitted services would burn. Fuel blocks are 5 m³ each.
          </p>
        </div>
      )}
    </>
  );
}
