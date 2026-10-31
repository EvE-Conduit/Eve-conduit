// The main page: every ticket, opening a new one, and closing.
import {
  api, Avatar, Badge, Button, Callout, ConfirmDialog, dateTime, Dialog, EmptyState, Field, Input, PageHeader, SearchInput, Segmented, Skeleton,
  Table, Td, Textarea, Th, THead, toast, Tr,
} from "@conduit/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link } from "react-router";

import { External, Plus, TicketIcon } from "./icons";
import { BASE, type Candidate, type Page, type Sender, type Ticket, type Via, VIA_LABEL } from "./types";

type Filter = "" | "open" | "closed";

export function TicketsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Filter>("open");
  const [opening, setOpening] = useState(false);
  const [confirm, setConfirm] = useState<Ticket | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["tickets", "list", filter],
    queryFn: () => api.get<Page<Ticket>>(`${BASE}/tickets?state=${filter}&limit=200`),
    refetchInterval: 60_000,
  });
  const act = useMutation({
    mutationFn: (ticket: Ticket) => api.post<Ticket>(`${BASE}/tickets/${ticket.id}/close`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tickets"] });
      toast.success("Ticket closed");
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
        description="Reach a member you pick through a private Discord channel, an EVE mail or both. Only the two of you and the staff role can see the channel."
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
          description="Pick a member by their main, an alt or their Discord name. A Discord channel needs both of you to have linked Discord."
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
                <Td className="max-w-xs font-medium">
                  <Link to={`/p/tickets/${t.id}`} className="block truncate hover:text-accent-ink" title={t.subject}>{t.subject}</Link>
                  <span className="block text-xs font-normal text-muted">{VIA_LABEL[t.via]}</span>
                  {t.mail_error && <span className="block text-xs font-normal text-danger-fg">Mail not sent: {t.mail_error}</span>}
                </Td>
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
                    {t.closed_at && <Link to={`/p/tickets/${t.id}`} className="text-sm hover:text-accent-ink">Transcript</Link>}
                    {t.url && (
                      <a href={t.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm hover:text-accent-ink">
                        Open in Discord <External className="size-3.5" />
                      </a>
                    )}
                    {!t.closed_at && <Button size="sm" variant="outline" onClick={() => setConfirm(t)}>Close</Button>}
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
        title={`Close the ticket with ${confirm?.target_name}?`}
        description={confirm?.via === "mail"
          ? "This only marks the ticket closed. The mail they already have stays."
          : "They lose the channel now. Its messages and files are saved here, then the channel is removed from Discord for good."}
        confirmLabel="Close ticket"
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
  const [via, setVia] = useState<Via>("discord");
  const search = useDebounced(q);
  const { data: sender } = useQuery({ queryKey: ["tickets", "sender"], queryFn: () => api.get<Sender>(`${BASE}/sender`) });
  const { data, isFetching } = useQuery({
    queryKey: ["tickets", "members", search],
    queryFn: () => api.get<{ items: Candidate[] }>(`${BASE}/members?q=${encodeURIComponent(search)}`),
    enabled: search.length >= 2 && !picked,
  });
  const usesDiscord = via !== "mail";
  const usesMail = via !== "discord";
  const noDiscord = usesDiscord && picked && !picked.discord;
  const noMail = usesMail && sender && !sender.can_mail;
  const valid = picked && !picked.open_ticket && !noDiscord && !noMail && subject.trim().length > 0 && (via !== "mail" || message.trim().length > 0);
  const open = useMutation({
    mutationFn: () => api.post<Ticket>(`${BASE}/tickets`, { user_id: picked!.id, subject, message, via }),
    onSuccess: (t) => {
      qc.invalidateQueries({ queryKey: ["tickets"] });
      if (t.mail_error) toast.warning(`Channel made, but the mail didn't go: ${t.mail_error}`);
      else toast.success(`Ticket opened with ${t.target_name}`);
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title="Open a ticket"
      description="A Discord ticket makes a private channel and pings the member. An EVE mail can't be taken back once it's sent."
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
                  <span className="block text-xs text-muted">{picked.discord ? `@${picked.discord}` : "No Discord linked"}</span>
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
                    <li className="px-3 py-2 text-sm text-muted">No member matches that.</li>
                  ) : (
                    data?.items.map((c) => (
                      <li key={c.id}>
                        <button type="button" onClick={() => setPicked(c)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-hover">
                          <Avatar src={c.portrait} name={c.name} size="sm" />
                          <span className="flex-1">
                            <span className="block font-medium">{c.name}</span>
                            <span className="block text-xs text-muted">{c.matched ? `Alt: ${c.matched} · ` : ""}{c.discord ? `@${c.discord}` : "No Discord linked"}</span>
                          </span>
                          {c.open_ticket && <Badge tone="accent">Open ticket</Badge>}
                          {c.discord && !c.on_server && <Badge tone="neutral">Not on server</Badge>}
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
        <Field label="Send by" hint={usesMail && sender?.name ? `The mail goes from ${sender.name} to their main character.` : undefined}>
          <Segmented<Via>
            size="sm"
            value={via}
            onChange={setVia}
            aria-label="Send by"
            options={[{ value: "discord", label: "Discord ticket" }, { value: "mail", label: "EVE mail" }, { value: "both", label: "Both" }]}
          />
        </Field>
        {noDiscord && <Callout tone="warning">{picked.name} hasn't linked Discord. Send an EVE mail instead.</Callout>}
        {noMail && <Callout tone="warning">{sender.problem}</Callout>}
        <Field label="Subject">
          <Input maxLength={100} value={subject} onChange={(e) => setSubject(e.target.value)} />
        </Field>
        <Field label={via === "mail" ? "Message" : "First message"} hint={via === "mail" ? undefined : via === "both" ? "Optional. It goes in the channel and the mail, which also links to the channel." : "Optional. The bot posts it in the channel."}>
          <Textarea rows={3} maxLength={1500} value={message} onChange={(e) => setMessage(e.target.value)} />
        </Field>
      </div>
    </Dialog>
  );
}
