import { useQuery } from "@tanstack/react-query";
import { FileText } from "lucide-react";
import { useDeferredValue, useState } from "react";

import { DataTable, PagedTable, type Column } from "@/components/DataTable";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { SearchInput, Select } from "@/components/ui/input";
import { DescriptionList } from "@/components/ui/page";
import { Skeleton } from "@/components/ui/skeleton";
import { TableToolbar } from "@/components/ui/table";
import { Segmented } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { dateTime, humanize, isk, num } from "@/lib/format";

import { BASE, CorporationFilter, HeldBy, ISK_FLOORS, MemberCell, OutsideToggle, type Corporation, type Member } from "./shared";

interface AuditContract {
  contract_id: number;
  type: string;
  status: string;
  title: string;
  availability: string;
  issuer: string;
  assignee: string | null;
  acceptor: string | null;
  price: number | null;
  reward: number | null;
  collateral: number | null;
  buyout: number | null;
  start: { name: string } | null;
  end: { name: string } | null;
  date_issued: string;
  date_expired: string;
  date_completed: string | null;
  held_by: Member[];
  matches: { name: string; quantity: number }[];
}

interface Item {
  id: number;
  type: { id: number; name: string; icon: string; group: string };
  quantity: number;
  included: boolean;
  value: number;
}

const STATUS_TONE: Record<string, BadgeTone> = { outstanding: "info", in_progress: "warning", finished: "success", deleted: "neutral", rejected: "danger", failed: "danger" };

/** The ISK a contract is about: its price, or the reward for couriers. */
const value = (c: AuditContract) => (c.type === "courier" ? c.reward : c.type === "auction" ? (c.buyout ?? c.price) : c.price);

export function ContractAudit({ corporations }: { corporations: Corporation[] }) {
  const [q, setQ] = useState("");
  const query = useDeferredValue(q.trim());
  const [corporation, setCorporation] = useState("");
  const [state, setState] = useState<"all" | "open" | "finished">("all");
  const [type, setType] = useState("");
  const [floor, setFloor] = useState("");
  const [outside, setOutside] = useState(false);
  const [open, setOpen] = useState<AuditContract | null>(null);

  const params = new URLSearchParams({ state });
  if (query) params.set("q", query);
  if (corporation) params.set("corporation", corporation);
  if (type) params.set("type", type);
  if (floor) params.set("min_value", floor);
  if (outside) params.set("outside", "true");

  const columns: Column<AuditContract>[] = [
    {
      header: "Contract",
      cell: (c) => (
        <div className="min-w-0">
          <div className="truncate text-text">{c.title || humanize(c.type)}</div>
          <div className="truncate text-xs text-subtle">
            {humanize(c.type)}
            {c.matches.length > 0 && ` · ${c.matches.map((m) => `${num(m.quantity)}× ${m.name}`).join(", ")}`}
          </div>
        </div>
      ),
      className: "max-w-xs",
    },
    {
      header: "Issuer → assignee",
      cell: (c) => (
        <div className="min-w-0 truncate text-[13px]">
          {c.issuer} <span className="text-subtle">→</span> {c.acceptor ?? c.assignee ?? <span className="text-subtle">public</span>}
        </div>
      ),
      className: "max-w-xs",
    },
    { header: "Value", cell: (c) => <span className="font-mono">{isk(value(c))}</span>, align: "right" },
    {
      header: "Status",
      cell: (c) => (
        <Badge size="xs" tone={STATUS_TONE[c.status] ?? "neutral"}>
          {humanize(c.status)}
        </Badge>
      ),
    },
    { header: "Held by", cell: (c) => <HeldBy holders={c.held_by} />, className: "max-w-[200px]" },
    { header: "Issued", cell: (c) => dateTime(c.date_issued), className: "whitespace-nowrap text-xs text-muted" },
  ];

  return (
    <Card>
      <TableToolbar>
        <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, item or party" className="w-full sm:w-72" aria-label="Search contracts" />
        <CorporationFilter corporations={corporations} value={corporation} onChange={setCorporation} />
        <Select
          value={type}
          onChange={(e) => setType(e.target.value)}
          aria-label="Contract type"
          className="w-40"
          options={[
            { value: "", label: "Every type" },
            { value: "item_exchange", label: "Item exchange" },
            { value: "courier", label: "Courier" },
            { value: "auction", label: "Auction" },
          ]}
        />
        <Select value={floor} onChange={(e) => setFloor(e.target.value)} aria-label="Value" className="w-36" options={ISK_FLOORS} />
        <Segmented
          value={state}
          onChange={setState}
          aria-label="State"
          options={[
            { value: "all", label: "All" },
            { value: "open", label: "Open" },
            { value: "finished", label: "Closed" },
          ]}
        />
        <OutsideToggle checked={outside} onChange={setOutside} />
      </TableToolbar>
      <PagedTable<AuditContract>
        url={`${BASE}/contracts`}
        params={params.toString()}
        columns={columns}
        rowKey={(c) => c.contract_id}
        onRowClick={setOpen}
        empty={{ icon: <FileText />, title: params.size > 1 ? "No contracts match" : "No contracts yet", description: params.size > 1 ? "Loosen the filters." : "Contracts show up once members' characters have synced them." }}
      />
      {open && <ContractDialog contract={open} onClose={() => setOpen(null)} />}
    </Card>
  );
}

function ContractDialog({ contract, onClose }: { contract: AuditContract; onClose: () => void }) {
  const { data } = useQuery({
    queryKey: ["member-audit", "contract", contract.contract_id],
    queryFn: () => api.get<AuditContract & { items: Item[]; items_loaded: boolean }>(`${BASE}/contracts/${contract.contract_id}`),
  });
  const c = data ?? contract;
  const itemColumns: Column<Item>[] = [
    {
      header: "Item",
      cell: (i) => (
        <span className="flex min-w-0 items-center gap-2">
          <img src={i.type.icon} alt="" className="size-6 rounded" />
          <span className="truncate">{i.type.name}</span>
          {!i.included && (
            <Badge size="xs" tone="warning">
              asked for
            </Badge>
          )}
        </span>
      ),
      className: "max-w-sm",
    },
    { header: "Qty", cell: (i) => num(i.quantity), align: "right", sortValue: (i) => i.quantity },
    { header: "Est. value", cell: (i) => isk(i.value), align: "right", sortValue: (i) => i.value },
  ];
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()} title={c.title || humanize(c.type)} description={`${humanize(c.type)} · ${humanize(c.status)} · issued ${dateTime(c.date_issued)}`} className="max-w-2xl">
      <DescriptionList
        className="mb-4"
        items={[
          { label: "Issuer", value: c.issuer },
          { label: "Assignee", value: c.assignee ?? "Public" },
          ...(c.acceptor ? [{ label: "Accepted by", value: c.acceptor }] : []),
          { label: c.type === "courier" ? "Reward" : "Price", value: isk(value(c)) },
          ...(c.type === "courier" ? [{ label: "Collateral", value: isk(c.collateral) }] : []),
          ...(c.start ? [{ label: c.type === "courier" ? "From" : "Location", value: c.start.name }] : []),
          ...(c.type === "courier" && c.end ? [{ label: "To", value: c.end.name }] : []),
        ]}
      />
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-subtle">Held by</span>
        {c.held_by.map((m) => (
          <span key={m.id} className="rounded-md bg-hover px-1.5 py-0.5">
            <MemberCell member={m} />
          </span>
        ))}
      </div>
      {!data ? (
        <Skeleton className="h-32" />
      ) : data.items_loaded ? (
        <DataTable<Item> rows={data.items} columns={itemColumns} rowKey={(i) => i.id} empty={{ icon: <FileText />, title: "No items", description: "This contract has no items." }} />
      ) : (
        <p className="text-sm text-muted">The items are still being fetched.</p>
      )}
    </Dialog>
  );
}
