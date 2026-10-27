// Pieces every page uses: the findings table, a finding's state, and the evidence dialog (where it's reviewed).
import {
  api, Avatar, Badge, Button, date, dateTime, Dialog, EmptyState, Field, isk, num, Segmented, Skeleton, Table, Td, Textarea, Th, THead,
  timeAgo, toast, Tr,
} from "@conduit/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link } from "react-router";

import { Check, External, Radar } from "./icons";
import { BASE, type Entity, type Evidence, type EvidenceRow, type Finding, KINDS, type State, STATES } from "./types";

export function Pic({ src, round }: { src: string | null; round?: boolean }) {
  return src ? <img src={src} alt="" className={`size-6 shrink-0 ${round ? "rounded-full" : "rounded"}`} /> : <span className="size-6 shrink-0" />;
}

export function Who({ e }: { e: Entity | null | undefined }) {
  if (!e) return <span className="text-subtle">—</span>;
  return (
    <span className="inline-flex items-center gap-1.5">
      <Pic src={e.image} round={e.kind === "character"} />
      {e.name}
    </span>
  );
}

export function StateBadge({ f }: { f: Finding }) {
  return (
    <span className="inline-flex flex-wrap gap-1">
      <Badge tone={STATES[f.state].tone}>{STATES[f.state].label}</Badge>
      {f.reopened && <Badge tone="danger">Reopened: newer evidence</Badge>}
      {f.new_evidence && <Badge tone="warning">Newer evidence</Badge>}
      {!f.present && <Badge tone="neutral">No longer found</Badge>}
    </span>
  );
}

/** What the evidence adds up to, in a few words. */
export function measure(f: Finding): string {
  if (f.kind === "contact") return `Standing ${f.amount > 0 ? "+" : ""}${f.amount}`;
  if (f.kind === "corp_history") return f.count === 1 ? "1 stint" : `${f.count} stints`;
  const n = `${num(f.count)} ${f.kind === "mail" ? "mail" : f.kind === "contract" ? "contract" : f.kind === "market" ? "trade" : "line"}${f.count === 1 ? "" : "s"}`;
  return f.amount ? `${n} · ${isk(f.amount)}` : n;
}

export function seen(f: Finding): string {
  if (!f.last_seen) return f.kind === "contact" ? "In their contacts now" : "Now";
  if (f.first_seen && f.first_seen.slice(0, 10) !== f.last_seen.slice(0, 10)) return `${date(f.first_seen)} – ${date(f.last_seen)}`;
  return date(f.last_seen);
}

export function FindingsTable({ items, onOpen, showMember = true }: { items: Finding[]; onOpen: (f: Finding) => void; showMember?: boolean }) {
  return (
    <Table>
      <THead>
        <tr>
          {showMember && <Th>Member</Th>}
          <Th>Character</Th>
          <Th>Dealt with</Th>
          <Th>How</Th>
          <Th>Evidence</Th>
          <Th>Seen</Th>
          <Th>Status</Th>
          <Th />
        </tr>
      </THead>
      <tbody>
        {items.map((f) => (
          <Tr key={f.id}>
            {showMember && (
              <Td>
                <Link to={`/p/spycheck/members/${f.user.id}`} className="flex items-center gap-2 hover:text-accent-ink">
                  <Avatar src={f.user.portrait} name={f.user.name} size="sm" />
                  <span>
                    <span className="block font-medium">{f.user.name}</span>
                    <span className="block text-xs text-muted">{f.user.corporation ?? "No corporation"}</span>
                  </span>
                </Link>
              </Td>
            )}
            <Td>{f.character.name}</Td>
            <Td>
              <Who e={f.entity} />
              {f.source === "blacklist" && <span className="ml-1.5 text-xs text-muted">Blacklist</span>}
            </Td>
            <Td>{KINDS[f.kind]}</Td>
            <Td className="text-muted">{measure(f)}</Td>
            <Td className="text-muted">{seen(f)}</Td>
            <Td><StateBadge f={f} /></Td>
            <Td className="text-right">
              <Button size="sm" variant="outline" onClick={() => onOpen(f)}>Evidence</Button>
            </Td>
          </Tr>
        ))}
      </tbody>
    </Table>
  );
}

export function NoFindings({ state }: { state: State | "all" }) {
  return (
    <EmptyState
      icon={state === "new" ? <Check /> : <Radar />}
      title={state === "new" ? "Nothing new" : "Nothing here"}
      description={state === "new" ? "No member dealt with anyone watched since the last review." : undefined}
    />
  );
}

/** The records behind a finding. Opening it is recorded in the snooper and audit logs. */
export function EvidenceDialog({ finding, onClose }: { finding: Finding | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [state, setState] = useState<State>("acknowledged");
  const [note, setNote] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["spycheck", "evidence", finding?.id],
    queryFn: () => api.get<Evidence>(`${BASE}/findings/${finding!.id}`),
    enabled: !!finding,
  });
  useEffect(() => {
    if (data) {
      setState(data.state === "new" ? "acknowledged" : data.state);
      setNote(data.note);
    }
  }, [data]);
  const decide = useMutation({
    mutationFn: () => api.post<Finding>(`${BASE}/findings/${finding!.id}/state`, { state, note }),
    onSuccess: (f) => {
      toast.success(`Marked ${STATES[f.state].label.toLowerCase()}`);
      qc.invalidateQueries({ queryKey: ["spycheck"] });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Dialog
      open={!!finding}
      onOpenChange={(o) => !o && onClose()}
      size="xl"
      title={finding ? `${finding.character.name} · ${KINDS[finding.kind]} with ${finding.entity.name}` : ""}
      description="Opening this is noted in the snooper log, like opening that tab of their character sheet."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Close</Button>
          <Button variant={state === "dismissed" ? "danger" : "primary"} loading={decide.isPending} disabled={!data} onClick={() => decide.mutate()}>
            Save review
          </Button>
        </>
      }
    >
      {isLoading || !data ? (
        <Skeleton className="h-48" />
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <span className="flex items-center gap-2"><Avatar src={data.user.portrait} name={data.user.name} size="sm" /> {data.user.name}</span>
            <span className="text-muted">{measure(data)} · {seen(data)}</span>
            <StateBadge f={data} />
            <Link to={data.sheet_link} className="ml-auto inline-flex items-center gap-1 text-accent-ink"><External /> Character sheet</Link>
          </div>
          {data.decided_by && (
            <p className="text-sm text-muted">
              {STATES[data.state === "new" ? "dismissed" : data.state].label} by {data.decided_by} {data.decided_at ? timeAgo(data.decided_at) : ""}
              {data.note ? `: “${data.note}”` : ""}
            </p>
          )}
          <div className="max-h-[45vh] overflow-auto rounded-lg border border-border">
            {!data.character_registered ? (
              <p className="p-4 text-sm text-muted">The character isn't registered here any more, so its data is gone.</p>
            ) : data.rows.length === 0 ? (
              <p className="p-4 text-sm text-muted">The records aren't in the synced data any more.</p>
            ) : (
              <Rows kind={data.kind} rows={data.rows} />
            )}
          </div>
          {data.rows_limited && <p className="text-xs text-subtle">The latest {data.rows.length} are shown; the rest are on the character sheet.</p>}
          <div className="space-y-3 border-t border-border pt-4">
            <Segmented<State>
              value={state}
              onChange={setState}
              options={[
                { value: "new", label: "New" },
                { value: "acknowledged", label: "Acknowledged" },
                { value: "dismissed", label: "Dismissed" },
              ]}
            />
            <Field
              label={state === "dismissed" ? "Why it's fine (needed)" : "Note (optional)"}
              hint={state === "dismissed" ? "It stays dismissed until there's newer evidence than what's here now." : undefined}
            >
              <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
            </Field>
          </div>
        </div>
      )}
    </Dialog>
  );
}

function Rows({ kind, rows }: { kind: Finding["kind"]; rows: EvidenceRow[] }) {
  if (kind === "journal")
    return (
      <Table>
        <THead><tr><Th>Date</Th><Th>Type</Th><Th>From</Th><Th>To</Th><Th className="text-right">Amount</Th><Th>Reason</Th></tr></THead>
        <tbody>
          {rows.map((r, i) => (
            <Tr key={i}>
              <Td className="whitespace-nowrap text-muted">{dateTime(r.date)}</Td>
              <Td>{r.ref_type?.replaceAll("_", " ")}</Td>
              <Td><Who e={r.first_party} /></Td>
              <Td><Who e={r.second_party} /></Td>
              <Td className={`text-right font-mono tabular-nums ${(r.amount ?? 0) < 0 ? "text-danger-fg" : "text-success-fg"}`}>{isk(r.amount, { full: true })}</Td>
              <Td className="text-muted">{r.reason || r.description}</Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    );
  if (kind === "market")
    return (
      <Table>
        <THead><tr><Th>Date</Th><Th>Item</Th><Th>They</Th><Th className="text-right">Quantity</Th><Th className="text-right">Total</Th></tr></THead>
        <tbody>
          {rows.map((r, i) => (
            <Tr key={i}>
              <Td className="whitespace-nowrap text-muted">{dateTime(r.date)}</Td>
              <Td>{typeof r.type === "object" ? r.type.name : r.type}</Td>
              <Td>{r.is_buy ? "Sold to the member" : "Bought from the member"}</Td>
              <Td className="text-right tabular-nums">{num(r.quantity)}</Td>
              <Td className="text-right font-mono tabular-nums">{isk(r.total, { full: true })}</Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    );
  if (kind === "contract")
    return (
      <Table>
        <THead><tr><Th>Issued</Th><Th>Type</Th><Th>Title</Th><Th>Issuer</Th><Th>Assignee</Th><Th>Acceptor</Th><Th>Status</Th><Th className="text-right">Price</Th></tr></THead>
        <tbody>
          {rows.map((r) => (
            <Tr key={r.contract_id}>
              <Td className="whitespace-nowrap text-muted">{dateTime(r.date)}</Td>
              <Td>{typeof r.type === "string" ? r.type.replaceAll("_", " ") : ""}</Td>
              <Td>{r.title || <span className="text-subtle">—</span>}</Td>
              <Td><Who e={r.issuer} /></Td>
              <Td><Who e={r.assignee} /></Td>
              <Td><Who e={r.acceptor} /></Td>
              <Td>{r.status?.replaceAll("_", " ")}</Td>
              <Td className="text-right font-mono tabular-nums">{isk((r.price ?? 0) + (r.reward ?? 0))}</Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    );
  if (kind === "mail")
    return (
      <Table>
        <THead><tr><Th>Date</Th><Th>From</Th><Th>To</Th><Th>Subject</Th></tr></THead>
        <tbody>
          {rows.map((r) => (
            <Tr key={r.mail_id}>
              <Td className="whitespace-nowrap text-muted">{dateTime(r.date)}</Td>
              <Td><Who e={r.sender} /></Td>
              <Td className="text-muted">{(r.recipients ?? []).map((x) => x?.name).filter(Boolean).join(", ")}</Td>
              <Td>{r.subject || <span className="text-subtle">(no subject)</span>}</Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    );
  if (kind === "contact")
    return (
      <div className="space-y-1 p-4 text-sm">
        {rows.map((r, i) => (
          <p key={i}>
            Standing <span className="font-mono">{(r.standing ?? 0) > 0 ? "+" : ""}{r.standing}</span>
            {r.is_watched ? " · on their watch list" : ""}{r.is_blocked ? " · blocked" : ""}
            {r.labels && r.labels.length > 0 ? ` · labels: ${r.labels.join(", ")}` : ""}
          </p>
        ))}
      </div>
    );
  return (
    <Table>
      <THead><tr><Th>Corporation</Th><Th>From</Th><Th>Until</Th></tr></THead>
      <tbody>
        {rows.map((r, i) => (
          <Tr key={i}>
            <Td><Who e={r.corporation} /></Td>
            <Td className="text-muted">{r.start ? date(r.start) : "—"}</Td>
            <Td className="text-muted">{r.current ? "Now" : date(r.end)}</Td>
          </Tr>
        ))}
      </tbody>
    </Table>
  );
}
