// Who joined a corporation recently, at the top of the main page, to start tracking them one by one or together.
import {
  api, Avatar, Badge, Button, Card, CardHeader, date, Dialog, Field, Input, Segmented, Skeleton, Table, Td, Textarea, Th, THead, timeAgo, toast,
  Tr,
} from "@conduit/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router";

import { Plus } from "./icons";
import { BASE, type Candidate, type NewMember, type NewMembers as Data, QUICK_DAYS, type Session } from "./types";

type Within = "3" | "7" | "14" | "30";

function candidate(m: NewMember): Candidate {
  return { id: m.id, name: m.name, portrait: m.portrait, corporation: m.corporation, matched: null, characters: m.characters.length, tracked: m.tracked };
}

export function NewMembers({ onTrack }: { onTrack: (c: Candidate) => void }) {
  const [within, setWithin] = useState<Within>("7");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulk, setBulk] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["tracking", "new-members", within],
    queryFn: () => api.get<Data>(`${BASE}/new-members?days=${within}`),
  });
  const untracked = data?.members.filter((m) => !m.tracked) ?? [];
  const picked = untracked.filter((m) => selected.has(m.id));
  const toggle = (id: number) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const allPicked = untracked.length > 0 && picked.length === untracked.length;
  return (
    <Card className="mb-6">
      <CardHeader
        title="New members"
        description="Members with a character that joined its corporation recently, from the corporation's member tracking or the character's corporation history."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Segmented<Within>
              size="sm"
              value={within}
              onChange={(v) => { setWithin(v); setSelected(new Set()); }}
              aria-label="Joined within"
              options={[{ value: "3", label: "3 days" }, { value: "7", label: "7 days" }, { value: "14", label: "14 days" }, { value: "30", label: "30 days" }]}
            />
            <Button size="sm" variant="primary" disabled={!picked.length} onClick={() => setBulk(true)}>
              <Plus /> Track {picked.length ? picked.length : ""} selected
            </Button>
          </div>
        }
      />
      {isLoading || !data ? (
        <Skeleton className="mx-card mb-4 h-24" />
      ) : data.members.length === 0 && data.unregistered.length === 0 ? (
        <p className="px-card pb-4 text-sm text-muted">Nobody joined in the last {data.days} days.</p>
      ) : (
        <>
          {data.members.length > 0 && (
            <Table>
              <THead>
                <tr>
                  <Th className="w-8">
                    <input
                      type="checkbox"
                      aria-label="Select everyone not tracked yet"
                      checked={allPicked}
                      disabled={!untracked.length}
                      onChange={() => setSelected(allPicked ? new Set() : new Set(untracked.map((m) => m.id)))}
                    />
                  </Th>
                  <Th>Member</Th>
                  <Th>Joined</Th>
                  <Th>Characters that joined</Th>
                  <Th />
                </tr>
              </THead>
              <tbody>
                {data.members.map((m) => (
                  <Tr key={m.id}>
                    <Td>
                      <input type="checkbox" aria-label={`Select ${m.name}`} disabled={m.tracked} checked={selected.has(m.id)} onChange={() => toggle(m.id)} />
                    </Td>
                    <Td>
                      <span className="flex items-center gap-2">
                        <Avatar src={m.portrait} name={m.name} size="sm" />
                        <span>
                          <span className="block font-medium">{m.name}</span>
                          <span className="block text-xs text-muted">{m.corporation ?? "No corporation"}</span>
                        </span>
                      </span>
                    </Td>
                    <Td className="whitespace-nowrap text-muted" title={date(m.joined_at)}>{timeAgo(m.joined_at)}</Td>
                    <Td className="text-sm">
                      {m.characters.map((c) => (
                        <span key={c.id} className="mr-3 inline-block">
                          {c.name}
                          {c.main && <span className="text-muted"> (main)</span>}
                          <span className="text-muted"> → {c.corporation ?? "?"}, {date(c.joined_at)}</span>
                        </span>
                      ))}
                    </Td>
                    <Td className="text-right">
                      {m.tracked ? (
                        <Link to={`/p/tracking/${m.session_id}`}><Badge tone="accent">Being tracked</Badge></Link>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => onTrack(candidate(m))}>Track</Button>
                      )}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
          {data.unregistered.length > 0 && (
            <div className="px-card pb-4 pt-3 text-sm">
              <div className="mb-1 font-medium">Not on the site yet</div>
              <p className="mb-2 text-xs text-muted">
                These joined but nobody has added them to the site, so they can't be tracked until they log in with them.
              </p>
              <div className="flex flex-wrap gap-2">
                {data.unregistered.map((u) => (
                  <span key={u.id} className="inline-flex items-center gap-1.5 border border-border px-2 py-1" title={`Joined ${u.corporation} ${date(u.joined_at)}`}>
                    <Avatar src={u.portrait} name={u.name} size="sm" />
                    {u.name}
                    <span className="text-xs text-muted">{timeAgo(u.joined_at)}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
      {bulk && <BulkDialog members={picked} onClose={(done) => { setBulk(false); if (done) setSelected(new Set()); }} />}
    </Card>
  );
}

function BulkDialog({ members, onClose }: { members: NewMember[]; onClose: (done: boolean) => void }) {
  const qc = useQueryClient();
  const [days, setDays] = useState("7");
  const [reason, setReason] = useState("New member");
  const n = Number(days);
  const valid = Number.isInteger(n) && n >= 1 && n <= 60;
  const start = useMutation({
    mutationFn: () =>
      api.post<{ started: Session[]; failed: { user_id: number; error: string }[] }>(`${BASE}/sessions/many`, {
        user_ids: members.map((m) => m.id), days: n, reason,
      }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["tracking"] });
      if (r.started.length) toast.success(`Tracking ${r.started.length} member${r.started.length === 1 ? "" : "s"} for ${n} day${n === 1 ? "" : "s"}`);
      for (const f of r.failed) toast.error(`${members.find((m) => m.id === f.user_id)?.name ?? "A member"}: ${f.error}`);
      onClose(true);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose(false)}
      title={`Track ${members.length} new member${members.length === 1 ? "" : "s"}`}
      description={members.map((m) => m.name).join(", ")}
      footer={
        <>
          <Button variant="ghost" onClick={() => onClose(false)}>Cancel</Button>
          <Button variant="primary" disabled={!valid} loading={start.isPending} onClick={() => start.mutate()}>Start tracking</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="For how many days" hint="1 to 60 days. Each member is followed with all their characters; they aren't told.">
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
