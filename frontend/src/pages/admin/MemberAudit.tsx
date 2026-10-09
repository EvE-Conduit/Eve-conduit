import { useQuery } from "@tanstack/react-query";
import { Building2, Inbox, Lock, Mail, MailCheck, ScanSearch, UsersRound } from "lucide-react";
import { useDeferredValue, useState } from "react";
import { Link } from "react-router";

import { PagedTable, type Column } from "@/components/DataTable";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { SearchInput, Select } from "@/components/ui/input";
import { EmptyState, PageHeader, StatCard } from "@/components/ui/page";
import { Skeleton } from "@/components/ui/skeleton";
import { TableToolbar } from "@/components/ui/table";
import { TabPanel, Tabs } from "@/components/ui/tabs";
import { Tooltip } from "@/components/ui/tooltip";
import { api } from "@/lib/api";
import { useHasPerm } from "@/lib/bootstrap";
import { dateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const BASE = "/api/member-audit";

interface Summary {
  characters: number;
  mail_synced: number;
  corporations: { id: number; name: string; ticker: string; characters: number }[];
}

interface Holder {
  id: number;
  name: string;
  owner: string;
  is_read: boolean;
}

interface AuditMail {
  mail_id: number;
  subject: string;
  sender: { id: number; name: string } | null;
  recipients: { id: number; type: string; name: string }[];
  timestamp: string;
  preview: string;
  held_by: Holder[];
}

const portrait = (id: number) => `https://images.evetech.net/characters/${id}/portrait?size=64`;

export function AdminMemberAudit() {
  const allowed = useHasPerm("sheet.use_member_audit");
  const summary = useQuery({ queryKey: ["member-audit", "summary"], queryFn: () => api.get<Summary>(`${BASE}/summary`), enabled: allowed });
  const s = summary.data;

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Member Audit"
        icon={<ScanSearch />}
        description="Look through every member character you can see in one place. Opening a mail is recorded in the snooper log, and searches in the audit log."
      />
      {!allowed ? (
        <Card>
          <EmptyState icon={<Lock />} title="No access" description="Member Audit needs the “Can use Member Audit” permission." />
        </Card>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Characters in reach" value={s?.characters ?? "–"} icon={<UsersRound />} hint="from your character-sheet permissions" />
            <StatCard label="Mail synced" value={s?.mail_synced ?? "–"} icon={<MailCheck />} tone={s && s.mail_synced < s.characters ? "warning" : "success"} hint={s ? `of ${s.characters} characters` : undefined} />
            <StatCard label="Corporations" value={s?.corporations.length ?? "–"} icon={<Building2 />} />
          </div>
          <Tabs variant="pills" listClassName="mb-5" items={[{ value: "mail", label: "Mail", icon: <Mail /> }]}>
            <TabPanel value="mail">
              <MailAudit corporations={s?.corporations ?? []} />
            </TabPanel>
          </Tabs>
        </>
      )}
    </>
  );
}

function HeldBy({ holders }: { holders: Holder[] }) {
  const shown = holders.slice(0, 3);
  return (
    <Tooltip content={holders.map((h) => h.name).join(", ")}>
      <div className="flex items-center gap-2">
        <div className="flex -space-x-1.5">
          {shown.map((h) => (
            <Avatar key={h.id} src={portrait(h.id)} name={h.name} size="xs" rounded="full" className="ring-2 ring-surface" />
          ))}
        </div>
        <span className="truncate text-xs text-muted">{holders.length === 1 ? holders[0]!.name : `${holders.length} characters`}</span>
      </div>
    </Tooltip>
  );
}

function MailAudit({ corporations }: { corporations: Summary["corporations"] }) {
  const [q, setQ] = useState("");
  const query = useDeferredValue(q.trim());
  const [corporation, setCorporation] = useState("");
  const [open, setOpen] = useState<AuditMail | null>(null);
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (corporation) params.set("corporation", corporation);

  const columns: Column<AuditMail>[] = [
    {
      header: "From",
      cell: (m) => (
        <div className="flex items-center gap-2.5">
          {m.sender && <Avatar src={portrait(m.sender.id)} name={m.sender.name} size="xs" rounded="full" />}
          <span className="truncate">{m.sender?.name ?? "—"}</span>
        </div>
      ),
      className: "max-w-[200px]",
    },
    {
      header: "Subject",
      cell: (m) => (
        <div className="min-w-0">
          <div className="truncate text-text">{m.subject}</div>
          <div className="truncate text-xs text-subtle">{m.preview}</div>
        </div>
      ),
      className: "max-w-lg",
    },
    { header: "Held by", cell: (m) => <HeldBy holders={m.held_by} />, className: "max-w-[220px]" },
    { header: "Received", cell: (m) => dateTime(m.timestamp), className: "whitespace-nowrap text-xs text-muted" },
  ];

  return (
    <Card>
      <TableToolbar>
        <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search subject, text or sender" className="w-full sm:w-72" aria-label="Search mail" />
        {corporations.length > 1 && (
          <Select value={corporation} onChange={(e) => setCorporation(e.target.value)} aria-label="Corporation" className="w-56">
            <option value="">Every corporation</option>
            {corporations.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} [{c.ticker}]
              </option>
            ))}
          </Select>
        )}
      </TableToolbar>
      <PagedTable<AuditMail>
        url={`${BASE}/mail`}
        params={params.toString()}
        columns={columns}
        rowKey={(m) => m.mail_id}
        onRowClick={setOpen}
        empty={{ icon: <Inbox />, title: query ? "No mail matches" : "No mail yet", description: query ? "Try other words." : "Mail shows up once members' characters have synced it." }}
      />
      {open && <MailDialog mail={open} onClose={() => setOpen(null)} />}
    </Card>
  );
}

function MailDialog({ mail, onClose }: { mail: AuditMail; onClose: () => void }) {
  const { data } = useQuery({ queryKey: ["member-audit", "mail", mail.mail_id], queryFn: () => api.get<AuditMail & { body: string; body_loaded: boolean }>(`${BASE}/mail/${mail.mail_id}`) });
  const holders = data?.held_by ?? mail.held_by;
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()} title={mail.subject} description={`From ${mail.sender?.name ?? "unknown"} · ${dateTime(mail.timestamp)}`} className="max-w-2xl">
      <div className="mb-3 flex flex-wrap items-center gap-1.5 text-xs">
        <span className="text-subtle">To</span>
        {mail.recipients.map((r) => (
          <Badge key={r.id}>{r.name}</Badge>
        ))}
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-1.5 text-xs">
        <span className="text-subtle">Held by</span>
        {holders.map((h) => (
          <Link key={h.id} to={`/characters/${h.id}`} className="inline-flex items-center gap-1.5 rounded-md bg-hover px-1.5 py-0.5 hover:bg-hover-strong" title={h.owner ? `Owned by ${h.owner}` : undefined}>
            <Avatar src={portrait(h.id)} name={h.name} size="xs" rounded="full" />
            <span className={cn(!h.is_read && "font-semibold text-text")}>{h.name}</span>
            {!h.is_read && <span className="text-subtle">· unread</span>}
          </Link>
        ))}
      </div>
      {!data ? <Skeleton className="h-40" /> : <div className="whitespace-pre-wrap text-sm leading-relaxed text-muted">{data.body_loaded ? data.body || "(empty)" : "The message text is still being fetched."}</div>}
    </Dialog>
  );
}
