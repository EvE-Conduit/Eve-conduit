import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Wallet } from "lucide-react";
import { useDeferredValue, useState } from "react";

import { PagedTable, type Column } from "@/components/DataTable";
import { Card } from "@/components/ui/card";
import { SearchInput, Select } from "@/components/ui/input";
import { TableToolbar } from "@/components/ui/table";
import { Segmented } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { dateTime, humanize, isk } from "@/lib/format";
import { cn } from "@/lib/utils";

import { BASE, CorporationFilter, EntityCell, ISK_FLOORS, MemberCell, OutsideToggle, type Corporation, type Entity, type Member } from "./shared";

interface Entry {
  id: string;
  character: Member;
  date: string;
  ref_type: string;
  amount: number | null;
  description: string;
  reason: string;
  first_party: Entity | null;
  second_party: Entity | null;
}

export function WalletAudit({ corporations }: { corporations: Corporation[] }) {
  const [q, setQ] = useState("");
  const query = useDeferredValue(q.trim());
  const [corporation, setCorporation] = useState("");
  const [refType, setRefType] = useState("");
  const [direction, setDirection] = useState<"" | "in" | "out">("");
  const [floor, setFloor] = useState("");
  const [outside, setOutside] = useState(false);
  const refTypes = useQuery({ queryKey: ["member-audit", "ref-types"], queryFn: () => api.get<string[]>(`${BASE}/wallet/ref-types`) });

  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (corporation) params.set("corporation", corporation);
  if (refType) params.set("ref_type", refType);
  if (direction) params.set("direction", direction);
  if (floor) params.set("min_amount", floor);
  if (outside) params.set("outside", "true");

  const columns: Column<Entry>[] = [
    { header: "Member", cell: (e) => <MemberCell member={e.character} />, className: "max-w-[220px]" },
    {
      header: "From → to",
      cell: (e) => (
        <div className="flex min-w-0 items-center gap-2">
          <EntityCell entity={e.first_party} />
          <ArrowRight className="size-3.5 shrink-0 text-subtle" />
          <EntityCell entity={e.second_party} />
        </div>
      ),
      className: "max-w-sm",
    },
    {
      header: "Type",
      cell: (e) => (
        <div className="min-w-0">
          <div className="truncate">{humanize(e.ref_type)}</div>
          {(e.reason || e.description) && <div className="truncate text-xs text-subtle">{e.reason || e.description}</div>}
        </div>
      ),
      className: "max-w-xs",
    },
    {
      header: "Amount",
      cell: (e) => <span className={cn("font-mono", e.amount != null && (e.amount < 0 ? "text-danger-fg" : "text-success-fg"))}>{isk(e.amount, { sign: true })}</span>,
      align: "right",
    },
    { header: "Date", cell: (e) => dateTime(e.date), className: "whitespace-nowrap text-xs text-muted" },
  ];

  return (
    <Card>
      <TableToolbar>
        <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search reason, description or party" className="w-full sm:w-72" aria-label="Search wallets" />
        <CorporationFilter corporations={corporations} value={corporation} onChange={setCorporation} />
        <Select value={refType} onChange={(e) => setRefType(e.target.value)} aria-label="Type" className="w-52">
          <option value="">Every type</option>
          {refTypes.data?.map((t) => (
            <option key={t} value={t}>
              {humanize(t)}
            </option>
          ))}
        </Select>
        <Select value={floor} onChange={(e) => setFloor(e.target.value)} aria-label="Amount" className="w-36" options={ISK_FLOORS} />
        <Segmented
          value={direction}
          onChange={setDirection}
          aria-label="Direction"
          options={[
            { value: "", label: "Both" },
            { value: "in", label: "In" },
            { value: "out", label: "Out" },
          ]}
        />
        <OutsideToggle checked={outside} onChange={setOutside} />
      </TableToolbar>
      <PagedTable<Entry>
        url={`${BASE}/wallet`}
        params={params.toString()}
        columns={columns}
        rowKey={(e) => e.id}
        empty={{ icon: <Wallet />, title: params.size ? "Nothing matches" : "No wallet journals yet", description: params.size ? "Loosen the filters." : "Journals show up once members' characters have synced their wallet." }}
      />
    </Card>
  );
}
