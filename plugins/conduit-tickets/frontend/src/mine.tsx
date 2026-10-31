// The tickets someone opened themselves from a panel on Discord, with their transcripts.
import { api, Badge, dateTime, EmptyState, PageHeader, Skeleton, Table, Td, Th, THead, Tr } from "@conduit/sdk";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";

import { External, TicketIcon } from "./icons";
import { BASE, type Page, type Ticket } from "./types";

export function MyTicketsPage() {
  const { data } = useQuery({ queryKey: ["tickets", "mine"], queryFn: () => api.get<Page<Ticket>>(`${BASE}/mine?limit=200`) });
  return (
    <>
      <PageHeader eyebrow="Discord" title="My tickets" icon={<TicketIcon />} description="Tickets you opened from a panel on Discord. You can read each one here once it's closed." />
      {!data ? (
        <Skeleton className="h-48" />
      ) : data.items.length === 0 ? (
        <EmptyState icon={<TicketIcon />} title="No tickets" description="Use a ticket panel on the Discord server to open one." />
      ) : (
        <Table>
          <THead>
            <tr>
              <Th>Subject</Th>
              <Th>Opened</Th>
              <Th>Closed</Th>
              <Th />
            </tr>
          </THead>
          <tbody>
            {data.items.map((t) => (
              <Tr key={t.id}>
                <Td className="max-w-xs font-medium">
                  <Link to={`/p/tickets/${t.id}`} className="block truncate hover:text-accent-ink" title={t.subject}>{t.subject}</Link>
                  <span className="block text-xs font-normal text-muted">{t.panel}</span>
                </Td>
                <Td className="whitespace-nowrap text-muted">{dateTime(t.opened_at)}</Td>
                <Td className="whitespace-nowrap text-muted">{t.closed_at ? dateTime(t.closed_at) : <Badge tone="accent">Open</Badge>}</Td>
                <Td>
                  {t.url && !t.closed_at && (
                    <a href={t.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm hover:text-accent-ink">
                      Open in Discord <External className="size-3.5" />
                    </a>
                  )}
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
