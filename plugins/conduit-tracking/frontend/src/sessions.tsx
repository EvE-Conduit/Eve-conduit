// The main page: who is being tracked, finished reports, and starting a new tracking.
import {
  api, Avatar, Badge, Button, Callout, date, Dialog, EmptyState, Field, Input, PageHeader, SearchInput, Segmented, Skeleton, Table, Td, Textarea,
  Th, THead, timeAgo, toast, Tr,
} from "@conduit/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";

import { Plus, Radar } from "./icons";
import { NewMembers } from "./newmembers";
import { BASE, type Candidate, type Page, QUICK_DAYS, type Session } from "./types";

type Filter = "" | "running" | "finished";

export function SessionsPage() {
  const [filter, setFilter] = useState<Filter>("");
  // true: pick anyone; a candidate: that member, from the new members list
  const [starting, setStarting] = useState<boolean | Candidate>(false);
  const { data, isLoading } = useQuery({
    queryKey: ["tracking", "sessions", filter],
    queryFn: () => api.get<Page<Session>>(`${BASE}/sessions?state=${filter}&limit=200`),
    refetchInterval: 60_000,
  });
  return (
    <>
      <PageHeader
        eyebrow="HR"
        title="Activity Tracking"
        icon={<Radar />}
        description="Follow a member and all their alts for 1 to 60 days: the systems they're in, the ships they fly, what they earn and when they play. The member is not told."
        actions={<Button variant="primary" onClick={() => setStarting(true)}><Plus /> Track a member</Button>}
      />
      <NewMembers onTrack={setStarting} />
      <div className="mb-4">
        <Segmented<Filter>
          size="sm"
          value={filter}
          onChange={setFilter}
          aria-label="Show"
          options={[{ value: "", label: "All" }, { value: "running", label: "Running" }, { value: "finished", label: "Finished" }]}
        />
      </div>
      {isLoading || !data ? (
        <Skeleton className="h-48" />
      ) : data.items.length === 0 ? (
        <EmptyState
          icon={<Radar />}
          title={filter === "finished" ? "No finished tracking" : "Nobody is being tracked"}
          description="Pick a member by their main or any alt; every character on their account is followed."
          action={<Button variant="primary" onClick={() => setStarting(true)}><Plus /> Track a member</Button>}
        />
      ) : (
        <Table>
          <THead>
            <tr>
              <Th>Member</Th>
              <Th>Period</Th>
              <Th>Status</Th>
              <Th>Started by</Th>
              <Th>Reason</Th>
            </tr>
          </THead>
          <tbody>
            {data.items.map((s) => (
              <Tr key={s.id}>
                <Td>
                  <Link to={`/p/tracking/${s.id}`} className="flex items-center gap-2 hover:text-accent-ink">
                    <Avatar src={s.target.portrait} name={s.target.name} size="sm" />
                    <span>
                      <span className="block font-medium">{s.target.name}</span>
                      <span className="block text-xs text-muted">{s.target.corporation ?? "No corporation"}</span>
                    </span>
                  </Link>
                </Td>
                <Td className="whitespace-nowrap text-muted">
                  {date(s.started_at)} – {date(s.ended_at ?? s.ends_at)} · {s.days} day{s.days === 1 ? "" : "s"}
                </Td>
                <Td><SessionBadge s={s} /></Td>
                <Td className="text-muted">{s.started_by ?? "—"}</Td>
                <Td className="max-w-xs truncate text-muted" title={s.reason}>{s.reason || "—"}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
      {starting && <StartDialog initial={starting === true ? null : starting} onClose={() => setStarting(false)} />}
    </>
  );
}

export function SessionBadge({ s }: { s: Session }) {
  if (s.running) return <Badge tone="accent">Running · ends {timeAgo(s.ends_at)}</Badge>;
  if (s.stopped_by) return <Badge tone="neutral">Stopped by {s.stopped_by}</Badge>;
  return <Badge tone="success">Finished</Badge>;
}

function useDebounced(value: string) {
  const [out, setOut] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setOut(value.trim()), 250);
    return () => clearTimeout(t);
  }, [value]);
  return out;
}

function StartDialog({ initial, onClose }: { initial: Candidate | null; onClose: () => void }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<Candidate | null>(initial);
  const [days, setDays] = useState("7");
  const [reason, setReason] = useState("");
  const search = useDebounced(q);
  const { data, isFetching } = useQuery({
    queryKey: ["tracking", "members", search],
    queryFn: () => api.get<{ items: Candidate[]; reason: "" | "own" | "no_reach" }>(`${BASE}/members?q=${encodeURIComponent(search)}`),
    enabled: search.length >= 2 && !picked,
  });
  const n = Number(days);
  const valid = picked && !picked.tracked && Number.isInteger(n) && n >= 1 && n <= 60;
  const start = useMutation({
    mutationFn: () => api.post<Session>(`${BASE}/sessions`, { user_id: picked!.id, days: n, reason }),
    onSuccess: (s) => {
      qc.invalidateQueries({ queryKey: ["tracking"] });
      toast.success(`Tracking ${s.target.name} for ${s.days} day${s.days === 1 ? "" : "s"}`);
      navigate(`/p/tracking/${s.id}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title="Track a member"
      description="Every character on their account is followed, including alts they link while it runs. They aren't told."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!valid} loading={start.isPending} onClick={() => start.mutate()}>Start tracking</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Member" hint="Search by their main or any alt.">
          {picked ? (
            <div className="flex items-center justify-between gap-2 border border-border px-3 py-2">
              <span className="flex items-center gap-2">
                <Avatar src={picked.portrait} name={picked.name} size="sm" />
                <span>
                  <span className="block font-medium">{picked.name}</span>
                  <span className="block text-xs text-muted">{picked.corporation ?? "No corporation"} · {picked.characters} character{picked.characters === 1 ? "" : "s"}</span>
                </span>
              </span>
              <Button size="sm" variant="ghost" onClick={() => setPicked(null)}>Change</Button>
            </div>
          ) : (
            <div className="space-y-2">
              <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Character name" aria-label="Character name" autoFocus />
              {search.length >= 2 && (
                <ul className="max-h-60 divide-y divide-border overflow-y-auto border border-border">
                  {isFetching && !data ? (
                    <li className="px-3 py-2 text-sm text-muted">Searching…</li>
                  ) : data?.items.length === 0 ? (
                    <li className="px-3 py-2 text-sm text-muted">
                      {data?.reason === "own"
                        ? "That's one of your own characters. Nobody can track themselves."
                        : data?.reason === "no_reach"
                          ? "You can't see anyone else's characters. Tracking also needs a character sheet permission (all, alliance or corporation characters) under Administration → Groups."
                          : "No member you can see has a character called that."}
                    </li>
                  ) : (
                    data?.items.map((c) => (
                      <li key={c.id}>
                        <button type="button" onClick={() => setPicked(c)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-hover">
                          <Avatar src={c.portrait} name={c.name} size="sm" />
                          <span className="flex-1">
                            <span className="block font-medium">{c.name}</span>
                            <span className="block text-xs text-muted">
                              {c.matched ? `Alt: ${c.matched} · ` : ""}{c.corporation ?? "No corporation"}
                            </span>
                          </span>
                          {c.tracked && <Badge tone="accent">Being tracked</Badge>}
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>
          )}
        </Field>
        {picked?.tracked && <Callout tone="warning">{picked.name} is already being tracked. Stop that first to start again.</Callout>}
        <Field label="For how many days" hint="1 to 60 days.">
          <div className="flex flex-wrap items-center gap-2">
            <Input className="w-24" type="number" min={1} max={60} value={days} onChange={(e) => setDays(e.target.value)} />
            {QUICK_DAYS.map((d) => (
              <Button key={d} size="sm" variant={String(d) === days ? "primary" : "outline"} onClick={() => setDays(String(d))}>{d}d</Button>
            ))}
          </div>
        </Field>
        <Field label="Reason" hint="Optional. Only other trackers and the audit log see it.">
          <Textarea rows={2} maxLength={1000} value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
      </div>
    </Dialog>
  );
}
