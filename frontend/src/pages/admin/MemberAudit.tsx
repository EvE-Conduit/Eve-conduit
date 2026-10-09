import { useQuery } from "@tanstack/react-query";
import { Building2, FileText, GraduationCap, Handshake, Inbox, Lock, Mail, MailCheck, ScanSearch, UsersRound, Wallet } from "lucide-react";
import { useDeferredValue, useState } from "react";
import { Link } from "react-router";

import { PagedTable, type Column } from "@/components/DataTable";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { SearchInput } from "@/components/ui/input";
import { EmptyState, PageHeader, StatCard } from "@/components/ui/page";
import { Skeleton } from "@/components/ui/skeleton";
import { TableToolbar } from "@/components/ui/table";
import { TabPanel, Tabs } from "@/components/ui/tabs";
import { ContractAudit } from "@/features/member-audit/Contracts";
import { CounterpartyAudit } from "@/features/member-audit/Counterparties";
import { BASE, CorporationFilter, HeldBy, portrait, type Corporation, type Member } from "@/features/member-audit/shared";
import { SkillCheck } from "@/features/member-audit/SkillCheck";
import { WalletAudit } from "@/features/member-audit/Wallets";
import { api } from "@/lib/api";
import { useHasPerm } from "@/lib/bootstrap";
import { dateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Summary {
  characters: number;
  mail_synced: number;
  corporations: Corporation[];
}

interface Holder extends Member {
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

export function AdminMemberAudit() {
  const allowed = useHasPerm("sheet.use_member_audit");
  const summary = useQuery({ queryKey: ["member-audit", "summary"], queryFn: () => api.get<Summary>(`${BASE}/summary`), enabled: allowed });
  const s = summary.data;
  const corporations = s?.corporations ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Member Audit"
        icon={<ScanSearch />}
        description="Look through every member character you can see in one place. Characters whose wallet, contracts or dealings you see here, and mail you open, are recorded in the snooper log; searches and skill checks go in the audit log."
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
          <Tabs
            variant="pills"
            listClassName="mb-5 max-w-full"
            items={[
              { value: "mail", label: "Mail", icon: <Mail /> },
              { value: "counterparties", label: "Counterparties", icon: <Handshake /> },
              { value: "wallets", label: "Wallets", icon: <Wallet /> },
              { value: "contracts", label: "Contracts", icon: <FileText /> },
              { value: "skills", label: "Skill check", icon: <GraduationCap /> },
            ]}
          >
            <TabPanel value="mail">
              <MailAudit corporations={corporations} />
            </TabPanel>
            <TabPanel value="counterparties">
              <CounterpartyAudit corporations={corporations} />
            </TabPanel>
            <TabPanel value="wallets">
              <WalletAudit corporations={corporations} />
            </TabPanel>
            <TabPanel value="contracts">
              <ContractAudit corporations={corporations} />
            </TabPanel>
            <TabPanel value="skills">
              <SkillCheck corporations={corporations} />
            </TabPanel>
          </Tabs>
        </>
      )}
    </>
  );
}

function MailAudit({ corporations }: { corporations: Corporation[] }) {
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
        <CorporationFilter corporations={corporations} value={corporation} onChange={setCorporation} />
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
