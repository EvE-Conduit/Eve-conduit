// The officers' side: PI of every character their character sheet access covers, for running a corp PI program.
import {
  api, Avatar, Badge, Callout, Card, CardHeader, EmptyState, Input, isk, num, PageHeader, SearchInput, Segmented, Select, Skeleton, StatCard,
  TabPanel, Table, Tabs, Td, Th, THead, Tooltip, Tr, useHasPerm,
} from "@conduit/sdk";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";

import { Moon, Users } from "./icons";
import { ccLevel, Tier, TypeName } from "./shared";
import { BASE, type Corp } from "./types";

type TierFilter = "all" | "0" | "1" | "2" | "3" | "4";

export function CorpPage() {
  const allowed = useHasPerm("pi.view_corp_pi");
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") ?? "products";
  const [corporation, setCorporation] = useState("0");
  const [idleInput, setIdleInput] = useState("3");
  const [idleDays, setIdleDays] = useState(3);
  useEffect(() => {
    const t = setTimeout(() => setIdleDays(Math.max(0, Math.min(365, Number(idleInput) || 0))), 400);
    return () => clearTimeout(t);
  }, [idleInput]);
  const { data, isLoading, error } = useQuery({
    queryKey: ["pi", "corp", corporation, idleDays],
    queryFn: () => api.get<Corp>(`${BASE}/corp?idle_days=${idleDays}&corporation=${corporation}`),
    enabled: allowed,
  });
  return (
    <>
      <PageHeader
        eyebrow="Industry"
        title="Corporation PI"
        icon={<Users />}
        description="What the members you can see make on their planets, who makes what, and colonies left idle. Covers the characters your character sheet access lets you see."
        actions={
          data && data.corporations.length > 1 ? (
            <Select value={corporation} onChange={(e) => setCorporation(e.target.value)} aria-label="Corporation" className="w-56"
              options={[{ value: "0", label: "Every corporation" }, ...data.corporations.map((c) => ({ value: String(c.id), label: c.name }))]} />
          ) : undefined
        }
      />
      {!allowed || error ? (
        <Card><EmptyState icon={<Users />} title="Not for you" description="This page needs the Corporation PI permission." /></Card>
      ) : isLoading || !data ? (
        <Skeleton className="h-64" />
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Members" value={data.totals.members} hint={`${data.totals.colonies} colonies`} />
            <StatCard label="Extractors running" value={num(data.totals.active)} tone="success" hint={`${num(data.totals.expired)} not running`} />
            <StatCard label="Idle colonies" value={data.totals.idle} tone={data.totals.idle ? "warning" : undefined} hint={`no extractor for over ${data.idle_days} days`} />
            <StatCard label="Output a day" value={isk(data.totals.isk_per_day)} mono hint="estimate at average prices" />
          </div>
          {data.totals.colonies === 0 && (
            <Callout tone="info" title="No colonies to show">
              Either nobody you can see runs PI yet, or your character sheet access doesn't reach their characters. Corporation or
              alliance character access is given under Administration → Groups.
            </Callout>
          )}
          <Tabs
            value={tab}
            onValueChange={(v) => setParams(v === "products" ? {} : { tab: v }, { replace: true })}
            variant="pills"
            className="space-y-4"
            items={[
              { value: "products", label: "Products", count: data.products.length },
              { value: "members", label: "Members", count: data.members.length },
              { value: "idle", label: "Idle colonies", count: data.idle.length },
            ]}
          >
            <TabPanel value="products"><ProductsTab data={data} /></TabPanel>
            <TabPanel value="members"><MembersTab data={data} /></TabPanel>
            <TabPanel value="idle"><IdleTab data={data} idle={idleInput} onIdle={setIdleInput} /></TabPanel>
          </Tabs>
        </div>
      )}
    </>
  );
}

function ProductsTab({ data }: { data: Corp }) {
  const [tier, setTier] = useState<TierFilter>("all");
  const rows = tier === "all" ? data.products : data.products.filter((p) => String(p.type.tier) === tier);
  return (
    <Card>
      <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
        <Segmented<TierFilter>
          value={tier}
          onChange={setTier}
          options={[{ value: "all", label: "Every tier" }, ...(["0", "1", "2", "3", "4"] as const).map((t) => ({ value: t, label: `P${t}` }))]}
        />
      </div>
      {rows.length === 0 ? (
        <EmptyState icon={<Users />} title="Nothing made at this tier" />
      ) : (
        <Table>
          <THead>
            <tr>
              <Th>Product</Th>
              <Th>Tier</Th>
              <Th align="right">A day</Th>
              <Th align="right">ISK a day</Th>
              <Th>Made by</Th>
            </tr>
          </THead>
          <tbody>
            {rows.map((p) => (
              <Tr key={p.type.id}>
                <Td><TypeName type={p.type} /></Td>
                <Td><Tier tier={p.type.tier} /></Td>
                <Td align="right" className="font-mono">{num(p.per_day)}</Td>
                <Td align="right" className="font-mono">{isk(p.isk_per_day)}</Td>
                <Td>
                  <Tooltip content={p.producers.map((x) => `${x.name}: ${num(x.per_day)}/day`).join(", ")}>
                    <span className="text-sm text-muted">
                      {p.producers.slice(0, 3).map((x) => x.name).join(", ")}
                      {p.producers.length > 3 && ` and ${p.producers.length - 3} more`}
                    </span>
                  </Tooltip>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </Card>
  );
}

function MembersTab({ data }: { data: Corp }) {
  const [q, setQ] = useState("");
  const rows = data.members.filter((m) => !q.trim() || m.name.toLowerCase().includes(q.trim().toLowerCase()) || m.products.some((p) => p.toLowerCase().includes(q.trim().toLowerCase())));
  return (
    <Card>
      <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
        <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a member or product" className="w-64" aria-label="Search members" />
      </div>
      {rows.length === 0 ? (
        <EmptyState icon={<Users />} title={q ? "Nobody matches" : "Nobody runs PI yet"} />
      ) : (
        <Table>
          <THead>
            <tr>
              <Th>Member</Th>
              <Th align="right">Colonies</Th>
              <Th align="right">Extractors</Th>
              <Th>Makes</Th>
              <Th align="right">ISK a day</Th>
            </tr>
          </THead>
          <tbody>
            {rows.map((m) => (
              <Tr key={m.id}>
                <Td>
                  <div className="flex items-center gap-3">
                    <Avatar src={m.portrait} name={m.name} size="sm" />
                    <span>
                      <span className="block font-medium">{m.name}</span>
                      <span className="block text-xs text-muted">{m.corporation ?? "No corporation"} · {m.characters} character{m.characters !== 1 ? "s" : ""}</span>
                    </span>
                  </div>
                </Td>
                <Td align="right">
                  <span className="font-mono">{m.colonies}</span>
                  {m.idle > 0 && <Badge tone="warning" className="ml-2">{m.idle} idle</Badge>}
                </Td>
                <Td align="right">
                  <span className="font-mono">{m.active}</span>
                  {m.expired > 0 && <span className="ml-1 text-xs text-danger-fg">+{m.expired} stopped</span>}
                </Td>
                <Td className="text-sm text-muted">{m.products.join(", ") || "—"}</Td>
                <Td align="right" className="font-mono">{isk(m.isk_per_day)}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </Card>
  );
}

function IdleTab({ data, idle, onIdle }: { data: Corp; idle: string; onIdle: (v: string) => void }) {
  return (
    <Card>
      <CardHeader
        title="Idle colonies"
        description="Colonies whose extractors have all been stopped for longer than this. A nudge for the member, or a planet to hand to someone else."
        actions={
          <label className="flex items-center gap-2 text-sm text-muted">
            Idle for over
            <Input type="number" min={0} max={365} value={idle} onChange={(e) => onIdle(e.target.value)} className="w-20" aria-label="Days idle" />
            days
          </label>
        }
      />
      {data.idle.length === 0 ? (
        <EmptyState icon={<Moon />} title="No idle colonies" description="Every colony with extractors had one running recently." />
      ) : (
        <Table>
          <THead>
            <tr>
              <Th>Planet</Th>
              <Th>Member</Th>
              <Th>Extracted</Th>
              <Th align="right">Idle</Th>
            </tr>
          </THead>
          <tbody>
            {data.idle.map((c) => (
              <Tr key={c.colony}>
                <Td>
                  <div className="flex items-center gap-3">
                    <img src={c.image} alt="" className="size-8" />
                    <span>
                      <span className="block font-medium">{c.planet}</span>
                      <span className="block text-xs text-muted">{c.system} · {c.type} · {ccLevel(c.upgrade_level)}</span>
                    </span>
                  </div>
                </Td>
                <Td>
                  <span className="block">{c.member}</span>
                  {c.character !== c.member && <span className="block text-xs text-muted">{c.character}</span>}
                </Td>
                <Td className="text-sm text-muted">{c.products.join(", ") || "—"}</Td>
                <Td align="right"><Badge tone={c.days >= 14 ? "danger" : "warning"}>{c.days} days</Badge></Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </Card>
  );
}
