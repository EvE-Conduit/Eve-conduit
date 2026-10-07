import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import type { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

/**
 * Low-level table pieces with the site's styling, for tables DataTable can't express.
 *   <Table><THead><tr><Th>Name</Th></tr></THead><tbody><Tr><Td>…</Td></Tr></tbody></Table>
 */
export function Table({ className, children, stickyHeader, ...props }: HTMLAttributes<HTMLTableElement> & { stickyHeader?: boolean }) {
  return (
    <div className={cn("overflow-x-auto", stickyHeader && "max-h-[70vh] overflow-y-auto")}>
      <table className={cn("w-full border-separate border-spacing-0 text-sm", stickyHeader && "[&_thead_th]:sticky [&_thead_th]:top-0 [&_thead_th]:z-10", className)} {...props}>
        {children}
      </table>
    </div>
  );
}

export function THead({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("text-left", className)} {...props} />;
}

export function Th({
  className,
  align,
  sort,
  onSort,
  children,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement> & { align?: "left" | "right" | "center"; sort?: "asc" | "desc" | false; onSort?: () => void }) {
  const Icon = sort === "asc" ? ArrowUp : sort === "desc" ? ArrowDown : ChevronsUpDown;
  return (
    <th
      aria-sort={sort === "asc" ? "ascending" : sort === "desc" ? "descending" : undefined}
      className={cn(
        "whitespace-nowrap border-b border-border bg-surface-2 px-cell-x py-2.5 text-[11.5px] font-semibold uppercase tracking-[0.16em] text-subtle",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className,
      )}
      {...props}
    >
      {onSort ? (
        <button type="button" onClick={onSort} className={cn("group inline-flex items-center gap-1 uppercase hover:text-text", align === "right" && "flex-row-reverse", sort && "text-text")}>
          {children}
          <Icon className={cn("size-3.5", !sort && "opacity-40 group-hover:opacity-80")} />
        </button>
      ) : (
        children
      )}
    </th>
  );
}

export function Tr({ className, interactive, ...props }: HTMLAttributes<HTMLTableRowElement> & { interactive?: boolean }) {
  return <tr className={cn("group/row transition-colors hover:bg-hover [&:last-child>td]:border-b-0", interactive && "cursor-pointer", className)} {...props} />;
}

export function Td({ className, align, numeric, ...props }: TdHTMLAttributes<HTMLTableCellElement> & { align?: "left" | "right" | "center"; numeric?: boolean }) {
  return (
    <td
      className={cn(
        "border-b border-border px-cell-x py-cell-y align-middle text-text",
        (align === "right" || numeric) && "whitespace-nowrap text-right",
        numeric && "font-mono tabular-nums",
        align === "center" && "text-center",
        className,
      )}
      {...props}
    />
  );
}

/** "12 rows" style footers and toolbars above tables. */
export function TableToolbar({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex flex-wrap items-center gap-2 border-b border-border px-card py-3", className)}>{children}</div>;
}
