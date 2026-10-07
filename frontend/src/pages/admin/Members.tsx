import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, LogIn, Search, Shield, Users } from "lucide-react";
import { useDeferredValue, useState, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState, PageHeader } from "@/components/ui/page";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip } from "@/components/ui/tooltip";
import { api } from "@/lib/api";
import { useBootstrap, useHasPerm } from "@/lib/bootstrap";
import type { CharacterBrief, StateBrief } from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";

interface Member {
  id: number;
  name: string;
  main: CharacterBrief | null;
  state: StateBrief | null;
  character_count: number;
  groups: string[];
  is_admin: boolean;
  last_login: string | null;
}

const PAGE = 50;

export function AdminMembers() {
  const [params0] = useSearchParams();
  const [q, setQ] = useState(params0.get("q") ?? "");
  const me = useBootstrap().user;
  const canImpersonate = useHasPerm("site.impersonate_users");
  const [switching, setSwitching] = useState<number | null>(null);
  const impersonate = async (m: Member) => {
    setSwitching(m.id);
    try {
      await api.post(`/api/admin/impersonate/${m.id}`);
      window.location.assign("/");
    } catch (err) {
      setSwitching(null);
      toast.error(err instanceof Error ? err.message : "Couldn't sign in as that user");
    }
  };
  const [state, setState] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const query = useDeferredValue(q);
  const navigate = useNavigate();

  const states = useQuery({ queryKey: ["admin", "states"], queryFn: () => api.get<(StateBrief & { user_count: number })[]>("/api/admin/states") });
  const params = new URLSearchParams({ q: query, limit: String(PAGE), offset: String(page * PAGE) });
  if (state) params.set("state", String(state));
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["admin", "members", query, state, page],
    queryFn: () => api.get<{ items: Member[]; count: number }>(`/api/admin/members?${params}`),
    placeholderData: keepPreviousData,
  });
  const pages = Math.max(1, Math.ceil((data?.count ?? 0) / PAGE));

  return (
    <>
      <PageHeader eyebrow="Administration" title="Members" description="Everyone who has signed in, by main character." />

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(0);
            }}
            placeholder="Search characters or corporations"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <FilterChip active={state === null} onClick={() => setState(null)}>
            All
          </FilterChip>
          {states.data?.map((s) => (
            <FilterChip
              key={s.id}
              active={state === s.id}
              onClick={() => {
                setState(s.id);
                setPage(0);
              }}
            >
              <span className="size-1.5 rounded-none" style={{ background: s.color }} />
              {s.name}
              <span className="text-subtle">{s.user_count}</span>
            </FilterChip>
          ))}
        </div>
      </div>

      <Card className={cn("overflow-hidden transition-opacity", isFetching && !isLoading && "opacity-70")}>
        {isLoading ? (
          <div className="space-y-2 p-4">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : !data?.items.length ? (
          <EmptyState icon={<Users />} title="No members found" description={q ? "Try a different search." : "Nobody has signed in yet."} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-subtle">
                  <th className="px-5 py-3 font-medium">Member</th>
                  <th className="px-5 py-3 font-medium">Corporation</th>
                  <th className="px-5 py-3 font-medium">State</th>
                  <th className="px-5 py-3 font-medium">Groups</th>
                  <th className="px-5 py-3 text-right font-medium">Alts</th>
                  <th className="px-5 py-3 text-right font-medium">Last seen</th>
                  {canImpersonate && <th className="w-12 px-3 py-3" />}
                </tr>
              </thead>
              <tbody>
                {data.items.map((m) => (
                  <tr
                    key={m.id}
                    onClick={() => m.main && navigate(`/characters/${m.main.id}`)}
                    className={cn("border-b border-border/60 transition-colors last:border-0 hover:bg-hover", m.main && "cursor-pointer")}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar src={m.main?.portrait} name={m.name} size="sm" />
                        <span className="font-medium">{m.name}</span>
                        {m.is_admin && <Shield className="size-3.5 text-accent" aria-label="Administrator" />}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-muted">
                      {m.main?.corporation ? (
                        <div className="flex items-center gap-2">
                          <img src={m.main.corporation.logo} alt="" className="size-5 rounded" />
                          <span className="truncate">{m.main.corporation.name}</span>
                          {m.main.alliance && <span className="font-mono text-xs text-subtle">{m.main.alliance.ticker}</span>}
                        </div>
                      ) : (
                        <span className="text-subtle">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">{m.state ? <Badge color={m.state.color} variant="dot">{m.state.name}</Badge> : <span className="text-subtle">—</span>}</td>
                    <td className="px-5 py-3">
                      <div className="flex max-w-xs flex-wrap gap-1">
                        {m.groups.slice(0, 3).map((g) => (
                          <Badge key={g}>{g}</Badge>
                        ))}
                        {m.groups.length > 3 && <Badge>+{m.groups.length - 3}</Badge>}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right font-mono tabular-nums text-muted">{m.character_count}</td>
                    <td className="px-5 py-3 text-right text-muted">{timeAgo(m.last_login)}</td>
                    {canImpersonate && (
                      <td className="px-3 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        {m.id !== me?.id && (!m.is_admin || me?.is_admin) && (
                          <Tooltip content={`Sign in as ${m.name}`}>
                            <Button size="icon" variant="ghost" aria-label={`Sign in as ${m.name}`} loading={switching === m.id} onClick={() => impersonate(m)}>
                              {switching !== m.id && <LogIn />}
                            </Button>
                          </Tooltip>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && data.count > PAGE && (
          <div className="flex items-center justify-between border-t border-border px-5 py-3 text-xs text-muted">
            <span>
              {page * PAGE + 1}–{Math.min((page + 1) * PAGE, data.count)} of {data.count}
            </span>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" disabled={page === 0} onClick={() => setPage(page - 1)} aria-label="Previous page">
                <ChevronLeft />
              </Button>
              <Button size="icon" variant="ghost" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)} aria-label="Next page">
                <ChevronRight />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs transition-colors",
        active ? "border-accent/40 bg-accent-soft text-text" : "border-border bg-surface/60 text-muted hover:text-text",
      )}
    >
      {children}
    </button>
  );
}
