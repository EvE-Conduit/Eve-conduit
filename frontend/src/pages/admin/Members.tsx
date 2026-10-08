import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRightLeft, ChevronLeft, ChevronRight, LogIn, Search, Shield, Users } from "lucide-react";
import { useDeferredValue, useState, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Alert } from "@/components/ui/feedback";
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
  const canMove = useHasPerm("site.manage_access");
  const [moving, setMoving] = useState<Member | null>(null);
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
                  {(canImpersonate || canMove) && <th className="w-24 px-3 py-3" />}
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
                    {(canImpersonate || canMove) && (
                      <td className="whitespace-nowrap px-3 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        {canMove && (!m.is_admin || me?.is_admin) && (
                          <Tooltip content="Move characters to another account">
                            <Button size="icon" variant="ghost" aria-label={`Move ${m.name}'s characters to another account`} onClick={() => setMoving(m)}>
                              <ArrowRightLeft />
                            </Button>
                          </Tooltip>
                        )}
                        {canImpersonate && m.id !== me?.id && (!m.is_admin || me?.is_admin) && (
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
      {moving && <MoveCharacters member={moving} onClose={() => setMoving(null)} />}
    </>
  );
}

interface MoveResult {
  moved: string[];
  emptied: boolean;
  /** When records were moved too: how many of each kind, and those left behind. */
  records: { moved: Record<string, number>; kept: Record<string, number> } | null;
}

interface MemberCharacter extends CharacterBrief {
  main: boolean;
}

type Person = { id: number; name: string; portrait: string | null };

/**
 * Move characters to another member's account, e.g. someone who signed up twice instead of adding an alt. Moving all
 * of them merges the accounts: the old one is switched off.
 */
function MoveCharacters({ member, onClose }: { member: Member; onClose: () => void }) {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin", "member-characters", member.id],
    queryFn: () => api.get<{ characters: MemberCharacter[] }>(`/api/admin/members/${member.id}/characters`),
  });
  const [picked, setPicked] = useState<number[] | null>(null);
  const chosen = picked ?? (data?.characters ?? []).map((c) => c.id);
  const [q, setQ] = useState("");
  const dq = useDeferredValue(q.trim());
  const [target, setTarget] = useState<Person | null>(null);
  const [withRecords, setWithRecords] = useState(true);
  const hits = useQuery({
    queryKey: ["admin", "user-lookup", dq],
    queryFn: () => api.get<Person[]>(`/api/admin/users/lookup?q=${encodeURIComponent(dq)}`),
    enabled: dq.length >= 2,
  });
  const all = !!data && chosen.length === data.characters.length;
  const move = useMutation({
    mutationFn: () =>
      api.post<MoveResult>(`/api/admin/members/${member.id}/move-characters`, { target: target!.id, characters: chosen, move_records: all && withRecords }),
    onSuccess: (r) => {
      const moved = Object.entries(r.records?.moved ?? {}).map(([what, n]) => `${n} ${what}`);
      const kept = Object.entries(r.records?.kept ?? {}).map(([what, n]) => `${n} ${what}`);
      toast.success(`Moved ${r.moved.join(", ")} to ${target!.name}` + (r.emptied ? `; ${member.name}'s old account is switched off` : ""), {
        description: [
          moved.length ? `Records moved: ${moved.join(", ")}.` : "",
          kept.length ? `Left with the old account because ${target!.name} already has their own: ${kept.join(", ")}.` : "",
        ].filter(Boolean).join(" ") || undefined,
        duration: kept.length ? 15000 : undefined,
      });
      qc.invalidateQueries({ queryKey: ["admin", "members"] });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const flip = (id: number) => setPicked(chosen.includes(id) ? chosen.filter((x) => x !== id) : [...chosen, id]);

  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={`Move ${member.name}'s characters`}
      description="For someone who signed up twice instead of adding an alt to their main. Logins and everything synced for the characters go with them."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!target || !chosen.length} loading={move.isPending} onClick={() => move.mutate()}>
            <ArrowRightLeft /> {all ? "Merge accounts" : `Move ${chosen.length} character${chosen.length === 1 ? "" : "s"}`}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <div className="mb-1.5 text-[13px] font-medium">Characters</div>
          {!data ? (
            <Skeleton className="h-16" />
          ) : (
            <div className="space-y-1 rounded-lg border border-border p-2">
              {data.characters.map((c) => (
                <label key={c.id} className="flex cursor-pointer items-center gap-3 rounded-md px-1.5 py-1 text-sm hover:bg-hover">
                  <input type="checkbox" checked={chosen.includes(c.id)} onChange={() => flip(c.id)} className="size-4 accent-[var(--site-accent)]" />
                  <Avatar src={c.portrait} name={c.name} size="xs" />
                  <span className="flex-1 truncate">{c.name}</span>
                  {c.main && <Badge size="xs">main</Badge>}
                  {c.corporation && <span className="text-xs text-subtle">{c.corporation.ticker ? `[${c.corporation.ticker}]` : c.corporation.name}</span>}
                </label>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="mb-1.5 text-[13px] font-medium">Move them to</div>
          {target ? (
            <div className="flex items-center gap-3 rounded-lg border border-accent/40 bg-accent-soft px-3 py-2 text-sm">
              <Avatar src={target.portrait ?? undefined} name={target.name} size="xs" />
              <span className="flex-1 font-medium">{target.name}</span>
              <Button size="sm" variant="ghost" onClick={() => setTarget(null)}>Change</Button>
            </div>
          ) : (
            <>
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name of any of their characters" autoFocus />
              <div className="mt-1 space-y-0.5">
                {(hits.data ?? [])
                  .filter((p) => p.id !== member.id)
                  .map((p) => (
                    <button key={p.id} type="button" onClick={() => setTarget(p)} className="flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left text-sm hover:bg-hover">
                      <Avatar src={p.portrait ?? undefined} name={p.name} size="xs" />
                      {p.name}
                    </button>
                  ))}
              </div>
            </>
          )}
        </div>

        {all && (
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border px-3 py-2.5 text-sm">
            <input type="checkbox" checked={withRecords} onChange={(e) => setWithRecords(e.target.checked)} className="mt-0.5 size-4 accent-[var(--site-accent)]" />
            <span>
              <span className="font-medium">Also move their records</span>
              <span className="block text-xs text-muted">
                SRP requests, skill plans, applications, mentoring, moon invoices, notifications and anything else plugins keep for them. Where only one is
                allowed per member (e.g. a moon invoice for the same month, preferences, a Discord link) and the main account already has one, the old
                one stays behind and you're told which.
              </span>
            </span>
          </label>
        )}

        {target && chosen.length > 0 && (
          <Alert tone={all ? "warning" : "info"}>
            {all
              ? `All of ${member.name}'s characters move to ${target.name}, so ${member.name}'s account is switched off (it can't sign in any more) and leaves its groups. ${withRecords ? "Their records move too." : "Its records stay with it for the record."} A linked Discord account moves too, if ${target.name} hasn't linked one.`
              : `${chosen.length} character${chosen.length === 1 ? "" : "s"} move to ${target.name}; ${member.name} keeps the rest.`}{" "}
            Whoever owns these characters signs in to {target.name}'s account with them from now on.
          </Alert>
        )}
      </div>
    </Dialog>
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
