import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/page";
import { SkeletonRows } from "@/components/ui/skeleton";
import { Table, Td, Th, THead, Tr } from "@/components/ui/table";
import { api } from "@/lib/api";
import { num } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface Column<T> {
  header: ReactNode;
  cell: (row: T) => ReactNode;
  align?: "left" | "right";
  className?: string;
  /** Makes the column sortable by this value (client-side). */
  sortValue?: (row: T) => number | string | null | undefined;
}

export function DataTable<T>({
  rows,
  columns,
  rowKey,
  empty,
  onRowClick,
  loading,
  stickyHeader,
  defaultSort,
  className,
}: {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string | number;
  empty?: { icon: ReactNode; title: string; description?: string };
  onRowClick?: (row: T) => void;
  loading?: boolean;
  /** Keep the header visible while the table scrolls (caps height at 70vh). */
  stickyHeader?: boolean;
  /** Initial sort: column index and direction. */
  defaultSort?: { column: number; dir: "asc" | "desc" };
  className?: string;
}) {
  const [sort, setSort] = useState(defaultSort ?? null);
  const sorted = useMemo(() => {
    const col = sort ? columns[sort.column] : undefined;
    if (!sort || !col?.sortValue) return rows;
    const get = col.sortValue;
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const va = get(a);
      const vb = get(b);
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      return (typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb))) * dir;
    });
  }, [rows, columns, sort]);

  if (loading) return <SkeletonRows />;
  if (!rows.length && empty) return <EmptyState {...empty} className="py-10" />;
  const toggle = (i: number) =>
    setSort((s) => (s?.column === i ? (s.dir === "desc" ? { column: i, dir: "asc" } : null) : { column: i, dir: columns[i]!.align === "right" ? "desc" : "asc" }));

  return (
    <Table stickyHeader={stickyHeader} className={className}>
      <THead>
        <tr>
          {columns.map((c, i) => (
            <Th
              key={i}
              align={c.align}
              sort={c.sortValue ? (sort?.column === i ? sort.dir : false) : undefined}
              onSort={c.sortValue ? () => toggle(i) : undefined}
            >
              {c.header}
            </Th>
          ))}
        </tr>
      </THead>
      <tbody>
        {sorted.map((row) => (
          <Tr key={rowKey(row)} interactive={!!onRowClick} onClick={onRowClick ? () => onRowClick(row) : undefined}>
            {columns.map((c, i) => (
              <Td key={i} align={c.align} numeric={c.align === "right"}>
                {/* Width limits and truncation only work on a block inside the cell. */}
                {c.className ? <div className={cn("min-w-0", c.className, c.className.includes("max-w") && "truncate")}>{c.cell(row)}</div> : c.cell(row)}
              </Td>
            ))}
          </Tr>
        ))}
      </tbody>
    </Table>
  );
}

const PAGE = 50;

/** A DataTable fed by a paginated API endpoint ({items, count}). */
export function PagedTable<T>({
  url,
  params = "",
  ...table
}: {
  url: string;
  params?: string;
  columns: Column<T>[];
  rowKey: (row: T) => string | number;
  empty?: { icon: ReactNode; title: string; description?: string };
  onRowClick?: (row: T) => void;
}) {
  const [page, setPage] = useState(0);
  const { data, isLoading } = useQuery({
    queryKey: [url, params, page],
    queryFn: () => api.get<{ items: T[]; count: number }>(`${url}?limit=${PAGE}&offset=${page * PAGE}${params ? `&${params}` : ""}`),
    placeholderData: keepPreviousData,
  });
  if (isLoading) return <SkeletonRows />;
  const count = data?.count ?? 0;
  const pages = Math.max(1, Math.ceil(count / PAGE));
  return (
    <>
      <DataTable rows={data?.items ?? []} {...table} />
      {count > PAGE && (
        <div className="flex items-center justify-between border-t border-border px-card py-2.5 text-xs text-muted">
          <span className="tabular-nums">
            {page * PAGE + 1}–{Math.min((page + 1) * PAGE, count)} of {num(count)}
          </span>
          <div className="flex items-center gap-1">
            <span className="mr-2 tabular-nums">
              Page {page + 1} of {pages}
            </span>
            <Button size="icon-sm" variant="ghost" disabled={page === 0} onClick={() => setPage(page - 1)} aria-label="Previous page">
              <ChevronLeft />
            </Button>
            <Button size="icon-sm" variant="ghost" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)} aria-label="Next page">
              <ChevronRight />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

/** Underlined tab buttons used inside cards. */
export function SegmentTabs<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[] }) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-border px-3 pt-2">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "relative shrink-0 whitespace-nowrap px-3 py-2.5 text-sm font-medium transition-colors",
            value === o.value ? "text-text after:absolute after:inset-x-2 after:-bottom-px after:h-0.5 after:rounded-none after:bg-accent" : "text-muted hover:text-text",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
