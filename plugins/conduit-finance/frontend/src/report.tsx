// The monthly report: one month's totals, categories, biggest payers and payees and corporations, against the month
// before. Printable: the print styles below leave only the report on the page.
import { api, Badge, Button, Card, CardHeader, cn, dateTime, EmptyState, isk, KpiTile, num, PageHeader, Skeleton, StatCard, Table, Td, Th, THead, Tr } from "@conduit/sdk";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";

import { Download, FileText, Printer, Shuffle } from "./icons";
import { CorpPicker, Delta, MonthPicker, query, useMonths, useParam } from "./shared";
import { BASE, type Party, type Report } from "./types";

// The site's frame (sidebar, top bar) has no print styles; hide everything but the report, in plain black on white.
const PRINT_CSS = `
@media print {
  @page { margin: 14mm; }
  body * { visibility: hidden !important; }
  #finance-report, #finance-report * { visibility: visible !important; }
  #finance-report { position: absolute; inset: 0 auto auto 0; width: 100%; }
  #finance-report, #finance-report * { color: #000 !important; background: transparent !important; box-shadow: none !important; border-color: #ccc !important; }
  #finance-report .finance-no-print { display: none !important; }
  #finance-report .finance-card { break-inside: avoid; }
}`;

function compactDelta(n: number) {
  return isk(n, { sign: true });
}

export function ReportPage() {
  const { data: meta } = useMonths();
  const [monthParam, setMonth] = useParam("month");
  const [corporation, setCorporation] = useParam("corporation");
  // Last finished month unless one was asked for.
  const month = monthParam || meta?.months.find((m) => !m.current)?.month || meta?.current || "";
  const { data, isLoading } = useQuery({
    queryKey: ["finance", "report", month, corporation],
    queryFn: () => api.get<Report>(`${BASE}/report${query({ month, corporation })}`),
    enabled: !!month,
  });

  return (
    <div id="finance-report">
      <style>{PRINT_CSS}</style>
      <PageHeader
        eyebrow="Corp finance"
        title={data ? `Report · ${data.label}` : "Monthly report"}
        icon={<FileText />}
        description={
          data
            ? `${data.corporations.map((c) => c.name).join(", ") || "No corporations"}. Internal transfers are left out of income and spending.`
            : "One month's income, spending and where the money came from and went."
        }
        actions={
          <div className="finance-no-print flex flex-wrap items-center gap-2">
            <MonthPicker value={month} onChange={setMonth} />
            {meta && meta.corporations.length > 1 && <CorpPicker corps={meta.corporations} value={corporation} onChange={setCorporation} />}
            <a href={`${BASE}/journal.csv${query({ month, corporation })}`} download>
              <Button variant="ghost"><Download /> CSV</Button>
            </a>
            <Button onClick={() => window.print()}><Printer /> Print</Button>
          </div>
        }
      />
      {isLoading || !data ? (
        <div className="grid gap-4 sm:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}</div>
      ) : data.corporations.length === 0 ? (
        <Card><EmptyState icon={<FileText />} title="No corporation wallets to report on" /></Card>
      ) : (
        <div className="space-y-6">
          {!data.complete && <Badge tone="warning">{data.label} isn't over yet: these are the figures so far</Badge>}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiTile label="Income" value={isk(data.totals.income)} delta={data.change.income.amount} deltaFormat={compactDelta} deltaLabel={`vs ${data.previous_label}`} />
            <KpiTile label="Spending" value={isk(data.totals.spending)} delta={data.change.spending.amount} deltaFormat={compactDelta} deltaLabel={`vs ${data.previous_label}`} invert />
            <KpiTile label="Net" value={isk(data.totals.net, { sign: true })} delta={data.change.net.amount} deltaFormat={compactDelta} deltaLabel={`vs ${data.previous_label}`} />
            <StatCard
              label="Internal transfers"
              value={isk(data.totals.internal_in + data.totals.internal_out)}
              mono
              icon={<Shuffle />}
              hint={`${isk(data.totals.internal_in)} in · ${isk(data.totals.internal_out)} out, not counted`}
            />
          </div>

          <Card className="finance-card">
            <CardHeader title="Categories" description={`Biggest first, against ${data.previous_label}`} />
            {data.categories.length === 0 ? (
              <p className="px-card pb-card text-sm text-muted">No wallet entries this month.</p>
            ) : (
              <Table>
                <THead>
                  <tr>
                    <Th>Category</Th>
                    <Th align="right">Income</Th>
                    <Th align="right">Spending</Th>
                    <Th align="right">Net</Th>
                    <Th align="right">{data.previous_label}</Th>
                    <Th align="right">Change</Th>
                  </tr>
                </THead>
                <tbody>
                  {data.categories.map((c) => (
                    <Tr key={c.category}>
                      <Td>
                        <Link className="font-medium hover:underline" to={`/p/finance/journal${query({ month: data.month, category: c.category, corporation })}`}>{c.category}</Link>
                        {c.entries > 0 && <span className="ml-2 text-xs text-subtle">{num(c.entries)} entries</span>}
                      </Td>
                      <Td numeric>{c.income ? isk(c.income) : "—"}</Td>
                      <Td numeric>{c.spending ? isk(c.spending) : "—"}</Td>
                      <Td numeric className={cn("font-semibold", c.net < 0 && "text-danger-fg")}>{isk(c.net, { sign: true })}</Td>
                      <Td numeric className="text-muted">{isk(c.previous_net, { sign: true })}</Td>
                      <Td numeric><Delta amount={c.net - c.previous_net} percent={null} /></Td>
                    </Tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-semibold">
                    <Td>Total</Td>
                    <Td numeric>{isk(data.totals.income)}</Td>
                    <Td numeric>{isk(data.totals.spending)}</Td>
                    <Td numeric>{isk(data.totals.net, { sign: true })}</Td>
                    <Td numeric className="text-muted">{isk(data.previous.net, { sign: true })}</Td>
                    <Td numeric><Delta amount={data.change.net.amount} percent={data.change.net.percent} /></Td>
                  </tr>
                </tfoot>
              </Table>
            )}
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <PartyTable title="Top income from" rows={data.top_income} total={data.totals.income} />
            <PartyTable title="Top spending to" rows={data.top_spending} total={data.totals.spending} />
          </div>

          <Card className="finance-card">
            <CardHeader title="Corporations" description="Wallet balances from the journal's running balances, at the start and end of the month" />
            <Table>
              <THead>
                <tr>
                  <Th>Corporation</Th>
                  <Th align="right">Opening</Th>
                  <Th align="right">Income</Th>
                  <Th align="right">Spending</Th>
                  <Th align="right">Net</Th>
                  <Th align="right">Internal in / out</Th>
                  <Th align="right">Closing</Th>
                </tr>
              </THead>
              <tbody>
                {data.corporations.map((c) => (
                  <Tr key={c.id}>
                    <Td>{c.name} <span className="text-subtle">[{c.ticker}]</span></Td>
                    <Td numeric className="text-muted">{isk(c.opening)}</Td>
                    <Td numeric>{isk(c.income)}</Td>
                    <Td numeric>{isk(c.spending)}</Td>
                    <Td numeric className={cn("font-semibold", c.net < 0 ? "text-danger-fg" : "text-success-fg")}>{isk(c.net, { sign: true })}</Td>
                    <Td numeric className="text-subtle">{isk(c.internal_in)} / {isk(c.internal_out)}</Td>
                    <Td numeric>{isk(c.closing)}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </Card>
          <p className="text-xs text-subtle">Made {dateTime(data.generated_at)} from {num(data.totals.entries)} wallet journal entries (EVE time months).</p>
        </div>
      )}
    </div>
  );
}

function PartyTable({ title, rows, total }: { title: string; rows: Party[]; total: number }) {
  return (
    <Card className="finance-card">
      <CardHeader title={title} description="Internal transfers left out" />
      {rows.length === 0 ? (
        <p className="px-card pb-card text-sm text-muted">Nobody this month.</p>
      ) : (
        <Table>
          <tbody>
            {rows.map((p) => (
              <Tr key={p.id}>
                <Td>
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-subtle">{p.categories.join(", ")} · {num(p.entries)} entries</div>
                </Td>
                <Td numeric>
                  {isk(p.amount)}
                  <div className="text-xs text-subtle">{total ? `${Math.round((p.amount / total) * 100)} %` : ""}</div>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </Card>
  );
}
