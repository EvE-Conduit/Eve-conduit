import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Building2, CheckCircle2, ChevronDown, ChevronRight, KeyRound, RefreshCw, ShieldAlert, UserX, Users, XCircle } from "lucide-react";
import { Fragment, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, Progress, Spinner } from "@/components/ui/feedback";
import { SearchInput, Select } from "@/components/ui/input";
import { EmptyState, PageHeader, StatCard } from "@/components/ui/page";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableToolbar, Td, Th, THead, Tr } from "@/components/ui/table";
import { Segmented, TabPanel, Tabs } from "@/components/ui/tabs";
import { Tooltip } from "@/components/ui/tooltip";
import { api } from "@/lib/api";
import { useHasPerm } from "@/lib/bootstrap";
import type { CharacterBrief, Entity, StateBrief } from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";

interface ComplianceRow {
  id: number;
  name: string;
  main: CharacterBrief | null;
  state: StateBrief | null;
  compliant: boolean | null;
  problems: string[];
  warnings: string[];
  checked_at: string | null;
  changed_at: string | null;
}

interface ComplianceOverview {
  summary: {
    users: number;
    compliant: number;
    noncompliant: number;
    unchecked: number;
    characters: number;
    invalid_tokens: number;
    rate: number | null;
    last_checked: string | null;
  };
  count: number;
  items: ComplianceRow[];
}

interface CharacterCompliance {
  id: number;
  name: string;
  portrait: string;
  corporation: { id: number; name: string; ticker: string } | null;
  token_valid: boolean;
  missing_scopes: string[];
  failing_sections: { section: string; label: string; message: string; failures: number }[];
  stale_sections: { section: string; label: string; last_success: string }[];
  problems: string[];
  ok: boolean;
}

interface CorpRow extends Entity {
  registered: number;
  member_count: number | null;
  unregistered: number | null;
}

type Status = "" | "noncompliant" | "compliant" | "unchecked";
const PAGE = 50;

export function AdminCompliance() {
  const qc = useQueryClient();
  const [tab, setTab] = useState("members");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<Status>("");
  const [state, setState] = useState("");
  const [corporation, setCorporation] = useState("");
  const [offset, setOffset] = useState(0);
  const canSeeStates = useHasPerm("site.manage_access");

  const params = new URLSearchParams({ q, status, limit: String(PAGE), offset: String(offset) });
  if (state) params.set("state", state);
  if (corporation) params.set("corporation", corporation);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "compliance", params.toString()],
    queryFn: () => api.get<ComplianceOverview>(`/api/admin/compliance?${params}`),
    placeholderData: keepPreviousData,
  });
  const corps = useQuery({ queryKey: ["admin", "compliance", "corporations"], queryFn: () => api.get<CorpRow[]>("/api/admin/compliance/corporations") });
  const states = useQuery({ queryKey: ["admin", "states"], queryFn: () => api.get<StateBrief[]>("/api/admin/states"), enabled: canSeeStates });
  const refresh = useMutation({
    mutationFn: () => api.post<{ checked: number }>("/api/admin/compliance/refresh"),
    onSuccess: (r) => {
      toast.success(`Checked ${r.checked} members`);
      qc.invalidateQueries({ queryKey: ["admin", "compliance"] });
    },
    onError: (e) => toast.error(e.message),
  });
  const s = data?.summary;
  const reset = (fn: () => void) => {
    fn();
    setOffset(0);
  };

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Compliance"
        icon={<ShieldAlert />}
        description="Whether every member's characters have a working login with all the ESI access the site needs, and who in your corporations hasn't registered."
        actions={
          <Button loading={refresh.isPending} onClick={() => refresh.mutate()}>
            {!refresh.isPending && <RefreshCw />} Check everyone now
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="panel rounded-xl p-4">
          <div className="flex items-center justify-between text-[13px] font-medium text-muted">
            Compliance rate
            <span className="grid size-7 place-items-center rounded-lg bg-accent-soft text-accent-ink [&_svg]:size-4">
              <ShieldAlert />
            </span>
          </div>
          <div className="mt-2 font-mono text-2xl font-semibold tabular-nums">{s?.rate == null ? "–" : `${s.rate}%`}</div>
          <Progress value={(s?.rate ?? 0) / 100} tone="auto" size="sm" className="mt-2" label="Compliance rate" />
        </div>
        <StatCard label="Compliant" value={s?.compliant ?? "–"} icon={<CheckCircle2 />} tone="success" hint={`of ${s?.users ?? 0} members`} />
        <StatCard label="Need attention" value={s?.noncompliant ?? "–"} icon={<AlertTriangle />} tone={s?.noncompliant ? "warning" : "success"} hint={s?.unchecked ? `${s.unchecked} not checked yet` : "members with problems"} />
        <StatCard label="Lost logins" value={s?.invalid_tokens ?? "–"} icon={<KeyRound />} tone={s?.invalid_tokens ? "danger" : "success"} hint={`of ${s?.characters ?? 0} characters`} />
      </div>

      <Tabs
        value={tab}
        onValueChange={setTab}
        variant="pills"
        listClassName="mb-5"
        items={[
          { value: "members", label: "Members", icon: <Users /> },
          { value: "unregistered", label: "Unregistered", icon: <UserX /> },
        ]}
      >
        <TabPanel value="members">
          <Card>
            <TableToolbar>
              <SearchInput value={q} onChange={(e) => reset(() => setQ(e.target.value))} placeholder="Find a character" className="w-full sm:w-64" aria-label="Find a character" />
              <Segmented
                value={status}
                onChange={(v) => reset(() => setStatus(v))}
                aria-label="Status"
                options={[
                  { value: "", label: "All" },
                  { value: "noncompliant", label: "Need attention" },
                  { value: "compliant", label: "Compliant" },
                  { value: "unchecked", label: "Unchecked" },
                ]}
              />
              {canSeeStates && !!states.data?.length && (
                <Select value={state} onChange={(e) => reset(() => setState(e.target.value))} aria-label="State" className="w-40">
                  <option value="">Every state</option>
                  {states.data.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name}
                    </option>
                  ))}
                </Select>
              )}
              {!!corps.data?.length && (
                <Select value={corporation} onChange={(e) => reset(() => setCorporation(e.target.value))} aria-label="Corporation" className="w-52">
                  <option value="">Every corporation</option>
                  {corps.data.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} [{c.ticker}]
                    </option>
                  ))}
                </Select>
              )}
              {s?.last_checked && <span className="ml-auto text-xs text-subtle">Checked {timeAgo(s.last_checked)}</span>}
            </TableToolbar>
            {isLoading ? (
              <div className="space-y-2 p-5">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-11 rounded-lg" />)}</div>
            ) : !data?.items.length ? (
              <EmptyState icon={<Users />} title="No members match" description="Try another filter." />
            ) : (
              <>
                <MembersTable rows={data.items} />
                {data.count > PAGE && (
                  <div className="flex items-center justify-between border-t border-border px-5 py-3 text-xs text-muted">
                    {offset + 1}–{Math.min(offset + PAGE, data.count)} of {data.count}
                    <div className="flex gap-2">
                      <Button size="xs" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE))}>
                        Previous
                      </Button>
                      <Button size="xs" disabled={offset + PAGE >= data.count} onClick={() => setOffset(offset + PAGE)}>
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </Card>
        </TabPanel>
        <TabPanel value="unregistered">
          <Unregistered corps={corps.data} loading={corps.isLoading} />
        </TabPanel>
      </Tabs>
    </>
  );
}

function StatusBadge({ compliant }: { compliant: boolean | null }) {
  if (compliant === null) return <Badge size="xs">Not checked</Badge>;
  return compliant ? (
    <Badge tone="success" size="xs">
      <CheckCircle2 className="size-3" /> Compliant
    </Badge>
  ) : (
    <Badge tone="warning" size="xs">
      <AlertTriangle className="size-3" /> Needs attention
    </Badge>
  );
}

function MembersTable({ rows }: { rows: ComplianceRow[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <Table>
      <THead>
        <tr>
          <Th className="w-8" aria-label="Expand" />
          <Th>Member</Th>
          <Th className="hidden md:table-cell">State</Th>
          <Th>Status</Th>
          <Th className="hidden lg:table-cell">Problems</Th>
          <Th align="right" className="hidden sm:table-cell">
            Changed
          </Th>
        </tr>
      </THead>
      <tbody>
        {rows.map((r) => {
          const expanded = open === r.id;
          return (
            <Fragment key={r.id}>
              <Tr interactive onClick={() => setOpen(expanded ? null : r.id)} aria-expanded={expanded}>
                <Td className="pr-0 text-subtle">{expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}</Td>
                <Td>
                  <div className="flex items-center gap-3">
                    <Avatar src={r.main?.portrait} name={r.name} size="sm" />
                    <div className="min-w-0">
                      <div className="truncate font-medium">{r.name}</div>
                      <div className="truncate text-xs text-muted">{r.main?.corporation?.name ?? "No corporation"}</div>
                    </div>
                  </div>
                </Td>
                <Td className="hidden md:table-cell">
                  {r.state ? (
                    <Badge color={r.state.color} variant="dot" size="xs">
                      {r.state.name}
                    </Badge>
                  ) : (
                    <span className="text-xs text-subtle">None</span>
                  )}
                </Td>
                <Td>
                  <StatusBadge compliant={r.compliant} />
                </Td>
                <Td className="hidden max-w-sm lg:table-cell">
                  <span className="line-clamp-1 text-xs text-muted">
                    {r.problems.length ? r.problems.join(" · ") : r.warnings.length ? `${r.warnings.length} warning(s)` : "–"}
                  </span>
                </Td>
                <Td align="right" className="hidden text-xs text-muted sm:table-cell">
                  {timeAgo(r.changed_at)}
                </Td>
              </Tr>
              {expanded && (
                <tr>
                  <td colSpan={6} className="border-b border-border bg-surface-2 px-5 py-4">
                    <UserDetail userId={r.id} />
                  </td>
                </tr>
              )}
            </Fragment>
          );
        })}
      </tbody>
    </Table>
  );
}

function UserDetail({ userId }: { userId: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "compliance", "user", userId],
    queryFn: () =>
      api.get<{ compliant: boolean; problems: string[]; account_problems?: string[]; warnings: string[]; characters: CharacterCompliance[] }>(
        `/api/admin/compliance/users/${userId}`,
      ),
  });
  if (isLoading || !data) return <Spinner label="Checking characters…" />;
  return (
    <div className="space-y-3">
      {!!data.account_problems?.length && (
        <ul className="space-y-1 rounded-lg border border-warning/40 bg-surface p-3 text-sm">
          {data.account_problems.map((p) => (
            <li key={p} className="flex items-center gap-2 text-warning-fg">
              <XCircle className="size-4 shrink-0" /> {p}
            </li>
          ))}
        </ul>
      )}
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {data.characters.map((c) => (
          <div key={c.id} className={cn("flex gap-3 rounded-lg border bg-surface p-3", c.ok ? "border-border" : "border-warning/40")}>
            <Avatar src={c.portrait} name={c.name} size="sm" />
            <div className="min-w-0 flex-1 text-sm">
              <div className="flex items-center gap-2">
                <Link to={`/characters/${c.id}`} className="truncate font-medium hover:underline" onClick={(e) => e.stopPropagation()}>
                  {c.name}
                </Link>
                {c.ok ? <CheckCircle2 className="size-4 text-success-fg" /> : <XCircle className="size-4 text-warning-fg" />}
              </div>
              <div className="truncate text-xs text-muted">{c.corporation ? `${c.corporation.name} [${c.corporation.ticker}]` : "No corporation"}</div>
              <ul className="mt-1.5 space-y-0.5 text-xs">
                {!c.token_valid && <li className="text-danger-fg">Login stopped working: needs to log in again</li>}
                {c.missing_scopes.length > 0 && (
                  <li className="text-warning-fg">
                    <Tooltip content={<span className="font-mono text-[11px]">{c.missing_scopes.join(", ")}</span>}>
                      <span className="cursor-help underline decoration-dotted">Missing {c.missing_scopes.length} ESI scopes</span>
                    </Tooltip>
                  </li>
                )}
                {c.failing_sections.map((f) => (
                  <li key={f.section} className="text-muted">
                    {f.label} failing ({f.failures}×){f.message && `: ${f.message}`}
                  </li>
                ))}
                {c.stale_sections.map((f) => (
                  <li key={f.section} className="text-muted">
                    {f.label} last updated {timeAgo(f.last_success)}
                  </li>
                ))}
                {c.ok && !c.failing_sections.length && !c.stale_sections.length && <li className="text-muted">All good</li>}
              </ul>
            </div>
          </div>
        ))}
      </div>
      {data.characters.length === 0 && <p className="text-sm text-muted">No characters linked.</p>}
    </div>
  );
}

function Unregistered({ corps, loading }: { corps?: CorpRow[]; loading: boolean }) {
  const [open, setOpen] = useState<number | null>(null);
  if (loading) return <Skeleton className="h-40 rounded-xl" />;
  if (!corps?.length)
    return (
      <Card>
        <EmptyState icon={<Building2 />} title="No corporations yet" description="Corporations show up here once members link characters in them." />
      </Card>
    );
  const anyKnown = corps.some((c) => c.unregistered !== null);
  return (
    <div className="space-y-4">
      {!anyKnown && (
        <Alert tone="info" title="Member lists aren't available yet">
          Unregistered members come from each corporation's member list, which needs the corporation sheet and a director's login with the member tracking scope.
        </Alert>
      )}
      <Card className="divide-y divide-border">
        {corps.map((c) => (
          <div key={c.id}>
            <button
              type="button"
              disabled={c.unregistered === null}
              onClick={() => setOpen(open === c.id ? null : c.id)}
              className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-hover disabled:cursor-default disabled:hover:bg-transparent"
              aria-expanded={open === c.id}
            >
              <img src={c.logo} alt="" className="size-8 rounded-md" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">
                  {c.name} <span className="font-mono text-xs text-subtle">[{c.ticker}]</span>
                </div>
                <div className="text-xs text-muted">
                  {c.registered} registered{c.member_count != null && ` of ${c.member_count} members`}
                </div>
              </div>
              {c.member_count ? <Progress value={c.registered / c.member_count} tone="auto" size="sm" className="hidden w-32 sm:block" label="Registered" /> : null}
              {c.unregistered === null ? (
                <span className="text-xs text-subtle">No member list</span>
              ) : c.unregistered === 0 ? (
                <Badge tone="success" size="xs">
                  Everyone registered
                </Badge>
              ) : (
                <Badge tone="warning" size="xs">
                  {c.unregistered} unregistered
                </Badge>
              )}
            </button>
            {open === c.id && <UnregisteredList corporationId={c.id} />}
          </div>
        ))}
      </Card>
    </div>
  );
}

function UnregisteredList({ corporationId }: { corporationId: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "compliance", "unregistered", corporationId],
    queryFn: () => api.get<{ available: boolean; characters: { id: number; name: string; portrait: string }[] }>(`/api/admin/compliance/corporations/${corporationId}/unregistered`),
  });
  return (
    <div className="bg-surface-2 px-5 py-4">
      {isLoading ? (
        <Spinner />
      ) : !data?.characters.length ? (
        <p className="text-sm text-muted">Everyone in this corporation has registered.</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {data.characters.map((c) => (
            <span key={c.id} className="inline-flex items-center gap-1.5 rounded-none bg-surface py-0.5 pl-0.5 pr-2.5 text-xs ring-1 ring-border">
              <Avatar src={c.portrait} name={c.name} size="xs" rounded="full" />
              {c.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
