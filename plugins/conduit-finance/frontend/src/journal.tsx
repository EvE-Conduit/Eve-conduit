// The wallet journal with each entry's category, filtered by month, corporation and category, and as CSV.
import { api, Badge, Button, Card, cn, dateTime, EmptyState, isk, PageHeader, SearchInput, Select, Skeleton, Table, TableToolbar, Td, Th, THead, Tr } from "@conduit/sdk";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { Download, Scroll } from "./icons";
import { CorpPicker, MonthPicker, query, useMonths, useParam } from "./shared";
import { BASE, type Journal } from "./types";

const KINDS = [
  { value: "", label: "Everything" },
  { value: "no", label: "Without internal transfers" },
  { value: "yes", label: "Only internal transfers" },
];

export function JournalPage() {
  const { data: meta } = useMonths();
  const [monthParam, setMonth] = useParam("month");
  const [corporation, setCorporation] = useParam("corporation");
  const [category, setCategory] = useParam("category");
  const [internal, setInternal] = useParam("internal");
  const [q, setQ] = useState("");
  const month = monthParam || meta?.current || "";
  const params = { month, corporation, category, internal, q: q.trim() };
  const { data, isLoading } = useQuery({
    queryKey: ["finance", "journal", params],
    queryFn: () => api.get<Journal>(`${BASE}/journal${query(params)}`),
    enabled: !!month,
  });
  const categories = [...new Set([...(category ? [category] : []), ...(data?.categories ?? [])])];

  return (
    <>
      <PageHeader
        eyebrow="Corp finance"
        title="Journal"
        icon={<Scroll />}
        description="Every wallet journal entry of the month with the category it counts under. Categories and tags are set under Settings."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <MonthPicker value={month} onChange={setMonth} />
            {meta && meta.corporations.length > 1 && <CorpPicker corps={meta.corporations} value={corporation} onChange={setCorporation} />}
            <a href={`${BASE}/journal.csv${query(params)}`} download>
              <Button variant="ghost"><Download /> CSV</Button>
            </a>
          </div>
        }
      />
      <Card>
        <TableToolbar>
          <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search reason, description or ref type" className="w-72" />
          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={[{ value: "", label: "Every category" }, ...categories.map((c) => ({ value: c, label: c }))]}
            aria-label="Category"
            className="w-56"
          />
          <Select value={internal} onChange={(e) => setInternal(e.target.value)} options={KINDS} aria-label="Internal transfers" className="w-64" />
          {data?.truncated && <span className="text-xs text-subtle">Showing the newest {data.limit}; the CSV has them all.</span>}
        </TableToolbar>
        {isLoading || !data ? (
          <Skeleton className="m-card h-48" />
        ) : data.rows.length === 0 ? (
          <EmptyState icon={<Scroll />} title="No entries" description={`Nothing in ${data.label} with these filters.`} />
        ) : (
          <Table stickyHeader>
            <THead>
              <tr>
                <Th>Date (EVE)</Th>
                <Th>Category</Th>
                <Th>Counterparty</Th>
                <Th>Wallet</Th>
                <Th align="right">Amount</Th>
                <Th align="right">Balance</Th>
              </tr>
            </THead>
            <tbody>
              {data.rows.map((r) => (
                <Tr key={r.id}>
                  <Td className="whitespace-nowrap text-muted">{dateTime(r.date)}</Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      {r.internal ? <Badge tone="info">{r.category}</Badge> : <span className="font-medium">{r.category}</span>}
                    </div>
                    <div className="text-xs text-subtle">{r.ref_type_label}</div>
                  </Td>
                  <Td className="max-w-72">
                    <div className="truncate">{r.counterparty || "—"}</div>
                    {(r.reason || r.description) && <div className="truncate text-xs text-subtle" title={r.description}>{r.reason || r.description}</div>}
                  </Td>
                  <Td className="whitespace-nowrap">
                    <div>{r.ticker ? `[${r.ticker}]` : r.corporation}</div>
                    <div className="text-xs text-subtle">{r.division}</div>
                  </Td>
                  <Td numeric className={cn(r.internal ? "text-muted" : r.amount < 0 ? "text-danger-fg" : "text-success-fg")}>{isk(r.amount, { sign: true, full: true })}</Td>
                  <Td numeric className="text-muted">{r.balance == null ? "—" : isk(r.balance)}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
