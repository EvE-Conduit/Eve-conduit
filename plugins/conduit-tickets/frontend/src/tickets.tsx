// The main page: every ticket, opening a new one, closing, and deleting a closed ticket's channel.
import {
  api, Avatar, Badge, Button, Callout, ConfirmDialog, dateTime, Dialog, EmptyState, Field, Input, PageHeader, SearchInput, Segmented, Skeleton,
  Table, Td, Textarea, Th, THead, toast, Tr,
} from "@conduit/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { External, Plus, TicketIcon } from "./icons";
import { BASE, type Candidate, type Page, type Ticket } from "./types";

type Filter = "" | "open" | "closed";
type Confirm = { ticket: Ticket; action: "close" | "delete" };

export function TicketsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Filter>("open");
  const [opening, setOpening] = useState(false);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["tickets", "list", filter],
    queryFn: () => api.get<Page<Ticket>>(`${BASE}/tickets?state=${filter}&limit=200`),
  });
  const act = useMutation({
    mutationFn: ({ ticket, action }: Confirm) => action === "close"
      ? api.post<Ticket>(`${BASE}/tickets/${ticket.id}/close`, {})
      : api.delete<Ticket>(`${BASE}/tickets/${ticket.id}/channel`),
    onSuccess: (_t, { action }) => {
      qc.invalidateQueries({ queryKey: ["tickets"] });
      toast.success(action === "close" ? "Ticket closed" : "Channel deleted");
      setConfirm(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <>
      <PageHeader
        eyebrow="Discord"
        title="Discord Tickets"
        icon={<TicketIcon />}
        description="Open a private Discord channel with a member you pick. Only the two of you and the staff role can see it."
        actions={<Button variant="primary" onClick={() => setOpening(true)}><Plus /> Open a ticket</Button>}
      />
      <div className="mb-4">
        <Segmented<Filter>
          size="sm"
          value={filter}
          onChange={setFilter}
          aria-label="Show"
          options={[{ value: "open", label: "Open" }, { value: "closed", label: "Closed" }, { value: "", label: "All" }]}
        />
      </div>
      {isLoading || !data ? (
        <Skeleton className="h-48" />
      ) : data.items.length === 0 ? (
        <EmptyState
          icon={<TicketIcon />}
          title={filter === "closed" ? "No closed tickets" : "No tickets"}
          description="Pick a member by their main, an alt or their Discord name. They need a linked Discord account."
          action={<Button variant="primary" onClick={() => setOpening(true)}><Plus /> Open a ticket</Button>}
        />
      ) : (
        <Table>
          <THead>
            <tr>
              <Th>Subject</Th>
              <Th>Member</Th>
              <Th>Opened</Th>
              <Th>Status</Th>
              <Th />
            </tr>
          </THead>
          <tbody>
            {data.items.map((t) => (
              <Tr key={t.id}>
                <Td className="max-w-xs truncate font-medium" title={t.subject}>{t.subject}</Td>
                <Td>
                  <span className="flex items-center gap-2">
                    <Avatar src={t.target?.portrait ?? null} name={t.target_name} size="sm" />
                    <span>
                      <span className="block font-medium">{t.target_name}</span>
                      <span className="block text-xs text-muted">{t.target?.corporation ?? "No corporation"}</span>
                    </span>
                  </span>
                </Td>
                <Td className="whitespace-nowrap text-muted">
                  <span className="block">{dateTime(t.opened_at)}</span>
                  <span className="block text-xs">by {t.opened_by}</span>
                </Td>
                <Td>
                  {t.closed_at
                    ? <Badge tone="neutral">Closed{t.closed_by ? ` by ${t.closed_by}` : ""}</Badge>
                    : <Badge tone="accent">Open</Badge>}
                </Td>
                <Td>
                  <span className="flex items-center justify-end gap-2">
                    {t.url && (
                      <a href={t.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm hover:text-accent-ink">
                        Open in Discord <External className="size-3.5" />
                      </a>
                    )}
                    {!t.closed_at && <Button size="sm" variant="outline" onClick={() => setConfirm({ ticket: t, action: "close" })}>Close</Button>}
                    {t.can_delete_channel && <Button size="sm" variant="ghost" onClick={() => setConfirm({ ticket: t, action: "delete" })}>Delete channel</Button>}
                  </span>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
      {opening && <OpenDialog onClose={() => setOpening(false)} />}
      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(o) => !o && setConfirm(null)}
        danger={confirm?.action === "delete"}
        title={confirm?.action === "delete" ? "Delete this channel?" : `Close the ticket with ${confirm?.ticket.target_name}?`}
        description={confirm?.action === "delete"
          ? "The channel and everything said in it are deleted from Discord for good. The ticket stays in this list."
          : "They can no longer see the channel. You and the staff role still can."}
        confirmLabel={confirm?.action === "delete" ? "Delete channel" : "Close ticket"}
        onConfirm={() => (confirm ? act.mutateAsync(confirm) : undefined)}
      />
    </>
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

function OpenDialog({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<Candidate | null>(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const search = useDebounced(q);
  const { data, isFetching } = useQuery({
    queryKey: ["tickets", "members", search],
    queryFn: () => api.get<{ items: Candidate[] }>(`${BASE}/members?q=${encodeURIComponent(search)}`),
    enabled: search.length >= 2 && !picked,
  });
  const valid = picked && !picked.open_ticket && subject.trim().length > 0;
  const open = useMutation({
    mutationFn: () => api.post<Ticket>(`${BASE}/tickets`, { user_id: picked!.id, subject, message }),
    onSuccess: (t) => {
      qc.invalidateQueries({ queryKey: ["tickets"] });
      toast.success(`Ticket opened with ${t.target_name}`);
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title="Open a ticket"
      description="This makes a private channel on the Discord server and pings the member."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!valid} loading={open.isPending} onClick={() => open.mutate()}>Open ticket</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Member" hint="Search by their main, an alt you can see, or their Discord name.">
          {picked ? (
            <div className="flex items-center justify-between gap-2 border border-border px-3 py-2">
              <span className="flex items-center gap-2">
                <Avatar src={picked.portrait} name={picked.name} size="sm" />
                <span>
                  <span className="block font-medium">{picked.name}</span>
                  <span className="block text-xs text-muted">@{picked.discord}</span>
                </span>
              </span>
              <Button size="sm" variant="ghost" onClick={() => setPicked(null)}>Change</Button>
            </div>
          ) : (
            <div className="space-y-2">
              <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Character or Discord name" aria-label="Character or Discord name" autoFocus />
              {search.length >= 2 && (
                <ul className="max-h-60 divide-y divide-border overflow-y-auto border border-border">
                  {isFetching && !data ? (
                    <li className="px-3 py-2 text-sm text-muted">Searching…</li>
                  ) : data?.items.length === 0 ? (
                    <li className="px-3 py-2 text-sm text-muted">Nobody with a linked Discord account matches that.</li>
                  ) : (
                    data?.items.map((c) => (
                      <li key={c.id}>
                        <button type="button" onClick={() => setPicked(c)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-hover">
                          <Avatar src={c.portrait} name={c.name} size="sm" />
                          <span className="flex-1">
                            <span className="block font-medium">{c.name}</span>
                            <span className="block text-xs text-muted">{c.matched ? `Alt: ${c.matched} · ` : ""}@{c.discord}</span>
                          </span>
                          {c.open_ticket && <Badge tone="accent">Open ticket</Badge>}
                          {!c.on_server && <Badge tone="neutral">Not on server</Badge>}
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>
          )}
        </Field>
        {picked?.open_ticket && <Callout tone="warning">You already have an open ticket with {picked.name}. Close it to open another.</Callout>}
        <Field label="Subject" hint="Everyone in the channel sees it.">
          <Input maxLength={100} value={subject} onChange={(e) => setSubject(e.target.value)} />
        </Field>
        <Field label="First message" hint="Optional. The bot posts it in the channel.">
          <Textarea rows={3} maxLength={1500} value={message} onChange={(e) => setMessage(e.target.value)} />
        </Field>
      </div>
    </Dialog>
  );
}
