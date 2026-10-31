// One ticket's page: what was mailed and the saved transcript of its channel.
import { api, Avatar, Badge, Button, Callout, Card, CardBody, dateTime, EmptyState, PageHeader, Skeleton } from "@conduit/sdk";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router";

import { ArrowLeft, TicketIcon } from "./icons";
import { type Attachment, BASE, type Message, type Page, type TicketDetail, VIA_LABEL } from "./types";

const PAGE = 200;

export function TranscriptPage() {
  const { id } = useParams();
  const { data: t, isError } = useQuery({
    queryKey: ["tickets", "ticket", id],
    queryFn: () => api.get<TicketDetail>(`${BASE}/tickets/${id}`),
    refetchInterval: (q) => (q.state.data?.archive_state === "pending" ? 15_000 : false),
  });
  const messages = useInfiniteQuery({
    // Follows the state, so the messages load once they've been saved.
    queryKey: ["tickets", "messages", id, t?.archive_state],
    queryFn: ({ pageParam }) => api.get<Page<Message>>(`${BASE}/tickets/${id}/messages?limit=${PAGE}&offset=${pageParam}`),
    initialPageParam: 0,
    getNextPageParam: (last, all) => {
      const loaded = all.reduce((n, p) => n + p.items.length, 0);
      return loaded < last.count ? loaded : undefined;
    },
    enabled: !!t,
  });
  if (isError) return <EmptyState icon={<TicketIcon />} title="No such ticket" />;
  if (!t) return <Skeleton className="h-48" />;
  const items = messages.data?.pages.flatMap((p) => p.items) ?? [];
  return (
    <>
      <PageHeader
        eyebrow={<Link to={t.mine ? "/p/tickets/mine" : "/p/tickets"} className="inline-flex items-center gap-1 hover:text-accent-ink"><ArrowLeft className="size-3.5" /> {t.mine ? "My tickets" : "Discord Tickets"}</Link>}
        title={t.subject}
        icon={<TicketIcon />}
        description={[
          t.panel ? `Opened by ${t.opened_by} from the ${t.panel} button on ${dateTime(t.opened_at)}.` : `With ${t.target_name}. Opened by ${t.opened_by} on ${dateTime(t.opened_at)}.`,
          t.closed_at ? `Closed${t.closed_by ? ` by ${t.closed_by}` : ""} on ${dateTime(t.closed_at)}.` : "",
          t.roles.length > 0 ? `Visible to ${t.roles.map((r) => `@${r.name}`).join(", ")}.` : "",
        ].filter(Boolean).join(" ")}
        actions={t.closed_at ? <Badge tone="neutral">Closed{t.closed_by ? ` by ${t.closed_by}` : ""}</Badge> : <Badge tone="accent">Open</Badge>}
      />
      <div className="space-y-4">
        {t.message && t.via !== "discord" && (
          <Card>
            <CardBody className="space-y-1">
              <p className="text-xs text-muted">{VIA_LABEL.mail} from {t.opened_by}{t.mail_sent ? "" : " (not sent)"}</p>
              <p className="whitespace-pre-wrap break-words text-sm">{t.message}</p>
            </CardBody>
          </Card>
        )}
        {t.via === "mail" && <p className="text-sm text-muted">Replies in the game aren't saved here.</p>}
        {t.via !== "mail" && !t.closed_at && <Callout tone="info">The transcript is saved when the ticket closes. Until then the conversation is on Discord.</Callout>}
        {t.archive_state === "pending" && <Callout tone={t.archive_error ? "warning" : "info"}>{t.archive_error || "Saving the transcript, then removing the channel from Discord…"}</Callout>}
        {t.archive_state === "lost" && <Callout tone="warning">The channel was deleted on Discord before the ticket closed, so there's no transcript.</Callout>}
        {items.length > 0 && (
          <Card>
            <CardBody className="divide-y divide-border p-0">
              {items.map((m) => <MessageRow key={m.id} m={m} />)}
            </CardBody>
          </Card>
        )}
        {messages.hasNextPage && <Button variant="outline" loading={messages.isFetchingNextPage} onClick={() => messages.fetchNextPage()}>Show more</Button>}
      </div>
    </>
  );
}

function AttachmentRow({ a }: { a: Attachment }) {
  if (a.state !== "saved") {
    return <p className="mt-1 text-xs text-muted">{a.name}: not kept ({a.state === "too_big" ? "too large" : "no longer on Discord"})</p>;
  }
  const url = `${BASE}/attachments/${a.id}`;
  if (a.image) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="mt-2 block w-fit">
        <img src={url} alt={a.name} loading="lazy" className="max-h-80 max-w-full border border-border" />
      </a>
    );
  }
  return <a href={url} download={a.name} className="mt-1 block w-fit text-xs text-accent-ink hover:underline">{a.name} ({(a.size / 1024 / 1024).toFixed(1)} MB)</a>;
}

function MessageRow({ m }: { m: Message }) {
  return (
    <div className="flex gap-3 px-4 py-3">
      <Avatar src={null} name={m.author} size="sm" />
      <div className="min-w-0 flex-1 text-sm">
        <p>
          <span className="font-medium">{m.author}</span>
          {m.is_bot && <Badge tone="neutral" className="ml-2">Bot</Badge>}
          <span className="ml-2 text-xs text-muted">{dateTime(m.sent_at)}{m.edited_at ? " (edited)" : ""}</span>
        </p>
        {m.content && <p className="whitespace-pre-wrap break-words">{m.content}</p>}
        {m.embeds.map((e, i) => (
          <div key={i} className="mt-1 border-l-2 border-border pl-2">
            {e.title && <p className="font-medium">{e.title}</p>}
            {e.description && <p className="whitespace-pre-wrap break-words text-muted">{e.description}</p>}
          </div>
        ))}
        {m.attachments.map((a) => <AttachmentRow key={a.id} a={a} />)}
      </div>
    </div>
  );
}
