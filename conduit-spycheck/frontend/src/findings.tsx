// The main page: findings to review, members with findings, and (for managers) the watch list and settings.
import {
  api, Avatar, Badge, Button, Card, CardBody, date, EmptyState, PageHeader, SearchInput, Segmented, Select, Skeleton, TabPanel, Table, Tabs,
  Td, Th, THead, timeAgo, toast, Tr,
} from "@conduit/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";

import { Radar, Refresh } from "./icons";
import { SettingsTab, WatchTab } from "./manage";
import { EvidenceDialog, FindingsTable, NoFindings } from "./shared";
import { BASE, type Finding, KINDS, type MemberRow, type Page, type State, type Summary } from "./types";

const PAGE = 50;

export function SpyCheckPage() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") ?? "findings";
  const { data: summary } = useQuery({ queryKey: ["spycheck", "summary"], queryFn: () => api.get<Summary>(`${BASE}/summary`) });
  const canManage = summary?.can_manage ?? false;
  return (
    <>
      <PageHeader
        eyebrow="HR"
        title="Spy Check"
        icon={<Radar />}
        description="Members' wallets, market trades, contracts, mail, contacts and corporation history, checked every day against the watch list and the blacklist."
        actions={<ScanButton summary={summary} />}
      />
      <Tabs
        value={tab}
        onValueChange={(v) => setParams(v === "findings" ? {} : { tab: v }, { replace: true })}
        variant="pills"
        className="space-y-4"
        items={[
          { value: "findings", label: "Findings", count: summary?.new },
          { value: "members", label: "Members", count: summary?.members },
          { value: "watch", label: "Watch list", count: summary?.watched },
          ...(canManage ? [{ value: "settings", label: "Settings" }] : []),
        ]}
      >
        <TabPanel value="findings"><FindingsTab /></TabPanel>
        <TabPanel value="members"><MembersTab /></TabPanel>
        <TabPanel value="watch"><WatchTab /></TabPanel>
        {canManage && <TabPanel value="settings"><SettingsTab /></TabPanel>}
      </Tabs>
    </>
  );
}

function ScanButton({ summary }: { summary?: Summary }) {
  const qc = useQueryClient();
  const scan = useMutation({
    mutationFn: () => api.post<Summary & { flagged: number }>(`${BASE}/scan`),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["spycheck"] });
      toast.success(r.flagged ? `${r.flagged} new finding${r.flagged === 1 ? "" : "s"}` : "Scanned: nothing new");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  if (!summary) return null;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-subtle">
        {summary.last_scan_at ? `Scanned ${timeAgo(summary.last_scan_at)} · ${summary.last_scan_characters} characters` : "Not scanned yet"}
      </span>
      {summary.can_manage && (
        <Button size="sm" variant="outline" loading={scan.isPending} onClick={() => scan.mutate()}>{!scan.isPending && <Refresh />} Scan now</Button>
      )}
    </div>
  );
}

function useDebounced(value: string) {
  const [out, setOut] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setOut(value.trim()), 250);
    return () => clearTimeout(t);
  }, [value]);
  return out;
}

function FindingsTab() {
  const [state, setState] = useState<State | "all">("new");
  const [kind, setKind] = useState("");
  const [q, setQ] = useState("");
  const dq = useDebounced(q);
  const [offset, setOffset] = useState(0);
  const [open, setOpen] = useState<Finding | null>(null);
  useEffect(() => setOffset(0), [state, kind, dq]);
  const { data, isLoading } = useQuery({
    queryKey: ["spycheck", "findings", state, kind, dq, offset],
    queryFn: () => api.get<Page<Finding>>(`${BASE}/findings?state=${state}&kind=${kind}&q=${encodeURIComponent(dq)}&limit=${PAGE}&offset=${offset}`),
  });
  return (
    <Card>
      <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
        <Segmented<State | "all">
          value={state}
          onChange={setState}
          options={[
            { value: "new", label: "New" },
            { value: "acknowledged", label: "Acknowledged" },
            { value: "dismissed", label: "Dismissed" },
            { value: "all", label: "All" },
          ]}
        />
        <Select
          value={kind}
          onChange={(e) => setKind(e.target.value)}
          className="w-48"
          aria-label="Kind"
          options={[{ value: "", label: "Every kind" }, ...Object.entries(KINDS).map(([value, label]) => ({ value, label }))]}
        />
        <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Member, character or who they dealt with" className="w-72" aria-label="Search findings" />
      </div>
      {isLoading || !data ? (
        <CardBody><Skeleton className="h-40" /></CardBody>
      ) : data.items.length === 0 ? (
        <NoFindings state={state} />
      ) : (
        <>
          <FindingsTable items={data.items} onOpen={setOpen} />
          {data.count > PAGE && (
            <div className="flex items-center justify-between border-t border-border p-3 text-sm text-muted">
              <span>{offset + 1}–{Math.min(offset + PAGE, data.count)} of {data.count}</span>
              <span className="flex gap-2">
                <Button size="sm" variant="ghost" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE))}>Previous</Button>
                <Button size="sm" variant="ghost" disabled={offset + PAGE >= data.count} onClick={() => setOffset(offset + PAGE)}>Next</Button>
              </span>
            </div>
          )}
        </>
      )}
      <EvidenceDialog finding={open} onClose={() => setOpen(null)} />
    </Card>
  );
}

function MembersTab() {
  const [q, setQ] = useState("");
  const dq = useDebounced(q);
  const { data, isLoading } = useQuery({
    queryKey: ["spycheck", "members", dq],
    queryFn: () => api.get<{ items: MemberRow[] }>(`${BASE}/members?q=${encodeURIComponent(dq)}`),
  });
  return (
    <Card>
      <div className="border-b border-border p-3">
        <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a character" className="w-56" aria-label="Search members" />
      </div>
      {isLoading || !data ? (
        <CardBody><Skeleton className="h-40" /></CardBody>
      ) : data.items.length === 0 ? (
        <EmptyState icon={<Radar />} title={dq ? "Nobody matches" : "No member has a finding"} />
      ) : (
        <Table>
          <THead>
            <tr>
              <Th>Member</Th>
              <Th>Findings</Th>
              <Th>Entities</Th>
              <Th>Latest evidence</Th>
              <Th>Last flagged</Th>
            </tr>
          </THead>
          <tbody>
            {data.items.map((m) => (
              <Tr key={m.id}>
                <Td>
                  <Link to={`/p/spycheck/members/${m.id}`} className="flex items-center gap-3 hover:text-accent-ink">
                    <Avatar src={m.portrait} name={m.name} size="sm" />
                    <span>
                      <span className="block font-medium">{m.name}</span>
                      <span className="block text-xs text-muted">{m.corporation ?? "No corporation"}</span>
                    </span>
                  </Link>
                </Td>
                <Td>
                  <span className="inline-flex flex-wrap gap-1">
                    {m.new > 0 && <Badge tone="warning">{m.new} new</Badge>}
                    {m.acknowledged > 0 && <Badge tone="info">{m.acknowledged} acknowledged</Badge>}
                    {m.dismissed > 0 && <Badge tone="neutral">{m.dismissed} dismissed</Badge>}
                  </span>
                </Td>
                <Td className="tabular-nums">{m.entities}</Td>
                <Td className="text-muted">{date(m.last_seen)}</Td>
                <Td className="text-muted">{m.flagged_at ? timeAgo(m.flagged_at) : "—"}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </Card>
  );
}
