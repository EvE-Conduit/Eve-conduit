import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Package, Search } from "lucide-react";
import { useDeferredValue, useState } from "react";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState, StatCard } from "@/components/ui/page";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { humanize, isk, num } from "@/lib/format";
import { cn } from "@/lib/utils";

import { PlaceLabel, TypeIcon } from "../sheet/components";
import type { EveType, Place } from "../sheet/types";

interface LocationRow {
  location: Place;
  item_count: number;
  value: number;
}

interface Item {
  item_id: number;
  type: EveType;
  name: string;
  quantity: number;
  flag: string;
  singleton: boolean;
  bpc: boolean;
  value: number;
  children: Item[];
  character?: { id: number; name: string };
}

interface SearchResult {
  item_id: number;
  type: EveType;
  name: string;
  quantity: number;
  flag: string;
  value: number;
  inside: string | null;
  location: Place | null;
  character?: { id: number; name: string };
}

/** Assets of one character (`base` = /api/characters/<id>) or all of mine (`base` = /api/me). */
export function AssetsView({ base, multiCharacter = false }: { base: string; multiCharacter?: boolean }) {
  const [q, setQ] = useState("");
  const query = useDeferredValue(q.trim());
  const locations = useQuery({ queryKey: [base, "assets", "locations"], queryFn: () => api.get<LocationRow[]>(`${base}/assets/locations`) });
  const search = useQuery({
    queryKey: [base, "assets", "search", query],
    queryFn: () => api.get<{ results: SearchResult[]; truncated: boolean }>(`${base}/assets/search?q=${encodeURIComponent(query)}`),
    enabled: query.length >= 2,
  });

  if (locations.isLoading) return <Skeleton className="h-96 rounded-xl" />;
  const rows = locations.data ?? [];
  if (!rows.length) return <Card><EmptyState icon={<Package />} title="No assets yet" description="Assets appear after the first sync." /></Card>;
  const total = rows.reduce((s, r) => s + r.value, 0);
  const items = rows.reduce((s, r) => s + r.item_count, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Estimated value" value={isk(total).replace(" ISK", "")} mono hint="at CCP average prices" />
        <StatCard label="Items" value={items} hint="stacks, ships and containers" />
        <StatCard label="Locations" value={rows.length} />
        <StatCard label="Most valuable" value={<span className="block truncate text-lg">{rows[0]?.location.name}</span>} hint={isk(rows[0]?.value)} />
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find an item, ship or container name…" className="h-10 pl-9" />
      </div>

      {query.length >= 2 ? (
        <SearchResults data={search.data} loading={search.isLoading} multiCharacter={multiCharacter} />
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-border">
            {rows.map((r) => (
              <LocationItem key={r.location.id} row={r} base={base} multiCharacter={multiCharacter} />
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

function LocationItem({ row, base, multiCharacter }: { row: LocationRow; base: string; multiCharacter: boolean }) {
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: [base, "assets", "location", row.location.id],
    queryFn: () => api.get<Item[]>(`${base}/assets/locations/${row.location.id}`),
    enabled: open,
  });
  return (
    <li>
      <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-hover" aria-expanded={open}>
        <ChevronRight className={cn("size-4 shrink-0 text-subtle transition-transform", open && "rotate-90")} />
        <PlaceLabel place={row.location} className="min-w-0 flex-1 text-sm font-medium" />
        <span className="hidden text-xs text-subtle sm:inline">{num(row.item_count)} items</span>
        <span className="w-28 text-right font-mono text-sm tabular-nums">{isk(row.value)}</span>
      </button>
      {open && (
        <div className="border-t border-border bg-bg/40 py-1">
          {isLoading ? (
            <div className="space-y-1.5 px-5 py-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-8" />)}</div>
          ) : (
            data?.map((item) => <ItemRow key={item.item_id} item={item} depth={0} multiCharacter={multiCharacter} />)
          )}
        </div>
      )}
    </li>
  );
}

const SLOT_NAMES: Record<string, string> = { HiSlot: "High slot", MedSlot: "Mid slot", LoSlot: "Low slot", RigSlot: "Rig slot", SubSystemSlot: "Subsystem" };

/** "HiSlot0" -> "High slot 1", "DroneBay" -> "Drone bay" */
function flagLabel(flag: string) {
  const slot = flag.match(/^(HiSlot|MedSlot|LoSlot|RigSlot|SubSystemSlot)(\d)$/);
  if (slot) return `${SLOT_NAMES[slot[1]!]} ${Number(slot[2]) + 1}`;
  return humanize(flag.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase());
}

function ItemRow({ item, depth, multiCharacter }: { item: Item; depth: number; multiCharacter: boolean }) {
  const [open, setOpen] = useState(false);
  const hasKids = item.children.length > 0;
  return (
    <>
      <div
        className={cn("flex items-center gap-3 py-1.5 pr-5 text-sm", hasKids && "cursor-pointer hover:bg-hover")}
        style={{ paddingLeft: 44 + depth * 22 }}
        onClick={() => hasKids && setOpen(!open)}
      >
        <span className="w-4">{hasKids && <ChevronRight className={cn("size-3.5 text-subtle transition-transform", open && "rotate-90")} />}</span>
        <TypeIcon type={item.type} size={28} />
        <div className="min-w-0 flex-1">
          <div className="truncate">
            {item.name || item.type.name}
            {item.bpc && <span className="ml-2 rounded bg-[color-mix(in_oklab,var(--chart-2)_16%,transparent)] px-1 text-[11px] font-medium text-[color-mix(in_oklab,var(--chart-2)_65%,var(--text))]">BPC</span>}
          </div>
          <div className="truncate text-xs text-subtle">
            {item.name ? `${item.type.name} · ` : ""}
            {depth > 0 ? flagLabel(item.flag) : item.type.group}
            {hasKids && ` · ${item.children.length} inside`}
            {multiCharacter && item.character && ` · ${item.character.name}`}
          </div>
        </div>
        <span className="w-20 text-right font-mono text-xs tabular-nums text-muted">{item.singleton ? "" : `×${num(item.quantity)}`}</span>
        <span className="w-24 text-right font-mono text-xs tabular-nums">{item.value ? isk(item.value) : "—"}</span>
      </div>
      {open && item.children.map((c) => <ItemRow key={c.item_id} item={c} depth={depth + 1} multiCharacter={multiCharacter} />)}
    </>
  );
}

function SearchResults({ data, loading, multiCharacter }: { data?: { results: SearchResult[]; truncated: boolean }; loading: boolean; multiCharacter: boolean }) {
  if (loading || !data) return <Skeleton className="h-48 rounded-xl" />;
  if (!data.results.length) return <Card><EmptyState icon={<Search />} title="Nothing found" description="No items match that name." /></Card>;
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-subtle">
              <th className="px-5 py-2.5 font-medium">Item</th>
              {multiCharacter && <th className="px-5 py-2.5 font-medium">Character</th>}
              <th className="px-5 py-2.5 font-medium">Where</th>
              <th className="px-5 py-2.5 text-right font-medium">Qty</th>
              <th className="px-5 py-2.5 text-right font-medium">Value</th>
            </tr>
          </thead>
          <tbody>
            {data.results.map((r) => (
              <tr key={r.item_id} className="border-b border-border/60 last:border-0 hover:bg-hover">
                <td className="px-5 py-2">
                  <div className="flex items-center gap-2.5">
                    <TypeIcon type={r.type} size={28} />
                    <div className="min-w-0">
                      <div className="truncate">{r.name || r.type.name}</div>
                      {r.name && <div className="truncate text-xs text-subtle">{r.type.name}</div>}
                    </div>
                  </div>
                </td>
                {multiCharacter && <td className="whitespace-nowrap px-5 py-2 text-muted">{r.character?.name}</td>}
                <td className="max-w-sm px-5 py-2 text-muted">
                  <PlaceLabel place={r.location} />
                  {r.inside && <div className="truncate text-xs text-subtle">in {r.inside}</div>}
                </td>
                <td className="px-5 py-2 text-right font-mono tabular-nums">{num(r.quantity)}</td>
                <td className="whitespace-nowrap px-5 py-2 text-right font-mono tabular-nums">{r.value ? isk(r.value) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.truncated && <div className="border-t border-border px-5 py-2.5 text-xs text-subtle">Showing the first 500 matches. Narrow the search to see more.</div>}
    </Card>
  );
}
