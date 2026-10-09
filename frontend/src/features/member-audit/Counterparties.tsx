import { useQuery } from "@tanstack/react-query";
import { ArrowDownLeft, ArrowUpRight, Handshake, UsersRound, X } from "lucide-react";
import { useDeferredValue, useState } from "react";

import { DataTable, type Column } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SearchInput } from "@/components/ui/input";
import { EmptyState, StatCard } from "@/components/ui/page";
import { SkeletonRows } from "@/components/ui/skeleton";
import { TableToolbar } from "@/components/ui/table";
import { api } from "@/lib/api";
import { dateTime, isk, num } from "@/lib/format";
import { cn } from "@/lib/utils";

import { BASE, CorporationFilter, MemberCell, type Corporation, type Entity, type Member } from "./shared";

interface Row {
  character: Member;
  journal: number;
  isk_in: number;
  isk_out: number;
  market: number;
  mail: number;
  contracts: number;
  standing: number | null;
  total: number;
  last: string | null;
}

interface Result {
  entity: Entity;
  member: boolean;
  characters: Row[];
  isk_in: number;
  isk_out: number;
}

const count = (n: number) => (n ? num(n) : <span className="text-subtle">—</span>);

export function CounterpartyAudit({ corporations }: { corporations: Corporation[] }) {
  const [q, setQ] = useState("");
  const query = useDeferredValue(q.trim());
  const [entity, setEntity] = useState<Entity | null>(null);
  const [corporation, setCorporation] = useState("");

  const hits = useQuery({
    queryKey: ["member-audit", "entities", query],
    queryFn: () => api.get<Entity[]>(`${BASE}/entities?q=${encodeURIComponent(query)}`),
    enabled: !entity && query.length >= 3,
  });
  const result = useQuery({
    queryKey: ["member-audit", "counterparty", entity?.id, corporation],
    queryFn: () => api.get<Result>(`${BASE}/counterparty?entity=${entity!.id}${corporation ? `&corporation=${corporation}` : ""}`),
    enabled: !!entity,
  });

  const columns: Column<Row>[] = [
    { header: "Member", cell: (r) => <MemberCell member={r.character} />, className: "max-w-[240px]", sortValue: (r) => r.character.name },
    { header: "Journal", cell: (r) => count(r.journal), align: "right", sortValue: (r) => r.journal },
    { header: "ISK sent", cell: (r) => (r.isk_out ? <span className="text-danger-fg">{isk(r.isk_out)}</span> : count(0)), align: "right", sortValue: (r) => r.isk_out },
    { header: "ISK received", cell: (r) => (r.isk_in ? <span className="text-success-fg">{isk(r.isk_in)}</span> : count(0)), align: "right", sortValue: (r) => r.isk_in },
    { header: "Market", cell: (r) => count(r.market), align: "right", sortValue: (r) => r.market },
    { header: "Mail", cell: (r) => count(r.mail), align: "right", sortValue: (r) => r.mail },
    { header: "Contracts", cell: (r) => count(r.contracts), align: "right", sortValue: (r) => r.contracts },
    {
      header: "Standing",
      cell: (r) => (r.standing == null ? <span className="text-subtle">—</span> : <span className={cn(r.standing > 0 ? "text-info-fg" : r.standing < 0 ? "text-danger-fg" : "text-muted")}>{r.standing > 0 ? `+${r.standing}` : r.standing}</span>),
      align: "right",
      sortValue: (r) => r.standing,
    },
    { header: "Last", cell: (r) => dateTime(r.last), className: "whitespace-nowrap text-xs text-muted", sortValue: (r) => r.last },
  ];

  const data = result.data;
  return (
    <div className="space-y-4">
      {data && data.characters.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Members involved" value={data.characters.length} icon={<UsersRound />} />
          <StatCard label="ISK sent to them" value={isk(data.isk_out)} mono icon={<ArrowUpRight />} tone={data.isk_out ? "warning" : undefined} />
          <StatCard label="ISK received from them" value={isk(data.isk_in)} mono icon={<ArrowDownLeft />} />
        </div>
      )}
      <Card>
        <TableToolbar>
          {entity ? (
            <div className="flex min-w-0 items-center gap-3">
              <img src={entity.image} alt="" className="size-8 rounded" />
              <div className="min-w-0">
                <div className="truncate font-semibold text-text">{entity.name}</div>
                <div className="flex items-center gap-1.5">
                  <Badge size="xs">{entity.type}</Badge>
                  {data?.member && (
                    <Badge size="xs" tone="info">
                      registered here
                    </Badge>
                  )}
                </div>
              </div>
              <Button size="icon-sm" variant="ghost" onClick={() => setEntity(null)} aria-label="Pick someone else">
                <X />
              </Button>
            </div>
          ) : (
            <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Character, corporation or alliance" className="w-full sm:w-80" aria-label="Counterparty" autoFocus />
          )}
          <CorporationFilter corporations={corporations} value={corporation} onChange={setCorporation} />
        </TableToolbar>
        {!entity &&
          (query.length < 3 ? (
            <EmptyState
              icon={<Handshake />}
              title="Who has dealt with them?"
              description="Name a character, corporation or alliance to see every member who paid, traded, mailed or contracted with them, or has them as a contact."
              className="py-10"
            />
          ) : hits.isLoading ? (
            <SkeletonRows rows={3} />
          ) : !hits.data?.length ? (
            <EmptyState icon={<Handshake />} title="Nobody by that name" description="Only names that appear in members' synced data can be picked, so no member has dealt with them." className="py-10" />
          ) : (
            <ul className="p-2">
              {hits.data.map((hit) => (
                <li key={hit.id}>
                  <button type="button" onClick={() => setEntity(hit)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-hover">
                    <img src={hit.image} alt="" className="size-6 rounded" />
                    <span className="flex-1 truncate text-text">{hit.name}</span>
                    <Badge size="xs">{hit.type}</Badge>
                  </button>
                </li>
              ))}
            </ul>
          ))}
        {entity && (
          <DataTable<Row>
            rows={data?.characters ?? []}
            columns={columns}
            rowKey={(r) => r.character.id}
            loading={result.isLoading}
            empty={{ icon: <Handshake />, title: "No dealings found", description: "No member in reach has dealt with them in their synced wallet, mail, contracts or contacts." }}
          />
        )}
      </Card>
    </div>
  );
}
