// The main page: income against spending per month, by category, with internal transfers kept apart.
import {
  api, Button, Callout, Card, CardBody, CardHeader, cn, EmptyState, isk, PageHeader, Segmented, Skeleton, StatCard, Table, Td, Th, THead, Tr,
} from "@conduit/sdk";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router";

import { FileText, Settings, Shuffle, Wallet } from "./icons";
import { CorpPicker, FlowChart, Legend, query, useMonths, useParam } from "./shared";
import { BASE, type Overview, type Summary } from "./types";

const RANGES = ["6", "12", "24"] as const;

export function OverviewPage() {
  const navigate = useNavigate();
  const [corporation, setCorporation] = useParam("corporation");
  const [range, setRange] = useParam("months");
  const months = (RANGES as readonly string[]).includes(range) ? range : "12";
  const { data: meta } = useMonths();
  const { data, isLoading } = useQuery({
    queryKey: ["finance", "overview", corporation, months],
    queryFn: () => api.get<Overview>(`${BASE}/overview${query({ corporation, months })}`),
  });
  const now = data?.months[data.months.length - 1];
  const last = data?.months[data.months.length - 2];
  const internal = data?.months.reduce((s, m) => s + m.internal_in + m.internal_out, 0) ?? 0;

  return (
    <>
      <PageHeader
        eyebrow="Finance"
        title="Corp finance"
        icon={<Wallet />}
        description="What your corporations earned and spent each month, by category, from their wallet journals. Money moved between their own divisions, or between the alliance's corporations, is kept apart."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {data && data.corporations.length > 1 && <CorpPicker corps={data.corporations} value={corporation} onChange={setCorporation} />}
            <Segmented value={months} onChange={(v) => setRange(v === "12" ? "" : v)} options={RANGES.map((r) => ({ value: r, label: `${r} mo` }))} aria-label="Months" size="sm" />
            <Link to={`/p/finance/report${query({ corporation })}`}><Button variant="ghost"><FileText /> Monthly report</Button></Link>
            {meta?.can_manage && <Link to="/p/finance/settings"><Button variant="ghost"><Settings /> Settings</Button></Link>}
          </div>
        }
      />
      {isLoading || !data ? (
        <div className="grid gap-4 sm:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}</div>
      ) : data.corporations.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Wallet />}
            title="No corporation wallets to show"
            description="Corp finance reads the wallets the corporation sheet syncs. You need to be allowed to see a corporation's finances there, and its wallets need to have synced (with an Accountant's or Director's login)."
          />
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label={`Income · ${now?.label ?? ""}`} value={isk(now?.income ?? 0)} mono hint={last ? `${isk(last.income)} in ${last.label}` : undefined} />
            <StatCard label="Spending" value={isk(now?.spending ?? 0)} mono hint={last ? `${isk(last.spending)} in ${last.label}` : undefined} />
            <StatCard
              label="Net"
              value={isk(now?.net ?? 0, { sign: true })}
              mono
              tone={(now?.net ?? 0) < 0 ? "danger" : "success"}
              hint="this month so far"
            />
            <StatCard
              label="Internal transfers"
              value={isk((now?.internal_in ?? 0) + (now?.internal_out ?? 0))}
              mono
              icon={<Shuffle />}
              hint="moved around, not counted"
            />
          </div>

          <Card>
            <CardHeader title="Income and spending" description="Per month, without internal transfers. Click a month for its report." actions={<Legend />} />
            <CardBody>
              <FlowChart data={data.months} onPick={(m) => navigate(`/p/finance/report${query({ month: m, corporation })}`)} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="By category" description={`Over the last ${months} months. Click one to see its entries.`} />
            {data.categories.length === 0 ? (
              <p className="px-card pb-card text-sm text-muted">No wallet entries in these months.</p>
            ) : (
              <Table>
                <THead>
                  <tr>
                    <Th>Category</Th>
                    <Th align="right">This month</Th>
                    <Th align="right">Income</Th>
                    <Th align="right">Spending</Th>
                    <Th align="right">Net</Th>
                  </tr>
                </THead>
                <tbody>
                  {data.categories.map((c) => {
                    const i = c.income.length - 1;
                    const thisMonth = (c.income[i] ?? 0) - (c.spending[i] ?? 0);
                    const net = c.total_income - c.total_spending;
                    return (
                      <Tr key={c.category} interactive onClick={() => navigate(`/p/finance/journal${query({ category: c.category, corporation })}`)}>
                        <Td className="font-medium">{c.category}</Td>
                        <Td numeric className={cn(thisMonth < 0 && "text-danger-fg")}>{thisMonth ? isk(thisMonth, { sign: true }) : "—"}</Td>
                        <Td numeric>{c.total_income ? isk(c.total_income) : "—"}</Td>
                        <Td numeric>{c.total_spending ? isk(c.total_spending) : "—"}</Td>
                        <Td numeric className={cn("font-semibold", net < 0 ? "text-danger-fg" : "text-success-fg")}>{isk(net, { sign: true })}</Td>
                      </Tr>
                    );
                  })}
                </tbody>
              </Table>
            )}
          </Card>

          {internal > 0 && (
            <Callout tone="info" title="Internal transfers">
              {isk(internal)} moved between divisions or between your corporations in these months. It's left out of the
              figures above; see it in the <Link className="underline" to={`/p/finance/journal${query({ internal: "yes", corporation })}`}>journal</Link>.
            </Callout>
          )}

          {!corporation && data.this_month.length > 1 && (
            <Card>
              <CardHeader title={`${now?.label ?? "This month"} per corporation`} />
              <Table>
                <THead>
                  <tr>
                    <Th>Corporation</Th>
                    <Th align="right">Income</Th>
                    <Th align="right">Spending</Th>
                    <Th align="right">Net</Th>
                  </tr>
                </THead>
                <tbody>
                  {data.this_month.map((c) => (
                    <Tr key={c.id} interactive onClick={() => setCorporation(String(c.id))}>
                      <Td>{c.name} <span className="text-subtle">[{c.ticker}]</span></Td>
                      <Td numeric>{isk(c.income)}</Td>
                      <Td numeric>{isk(c.spending)}</Td>
                      <Td numeric className={cn("font-semibold", c.net < 0 ? "text-danger-fg" : "text-success-fg")}>{isk(c.net, { sign: true })}</Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </Card>
          )}
        </div>
      )}
    </>
  );
}

export function FinanceWidget() {
  const { data, isLoading } = useQuery({ queryKey: ["finance", "summary"], queryFn: () => api.get<Summary>(`${BASE}/summary`), refetchInterval: 600_000 });
  if (isLoading || !data) return <Skeleton className="h-16" />;
  if (data.corporations.length === 0) return <p className="text-sm text-muted">No corporation wallets you may see.</p>;
  return (
    <Link to="/p/finance" className="block space-y-3">
      <div>
        <div className="text-xs text-muted">Net in {data.label}</div>
        <div className={cn("mt-1 font-mono text-3xl font-semibold tabular-nums", data.net < 0 ? "text-danger-fg" : "text-text")}>{isk(data.net, { sign: true })}</div>
        <div className="text-xs text-subtle">without internal transfers</div>
      </div>
      {data.corporations.length > 1 && (
        <ul className="space-y-1.5">
          {data.corporations.slice(0, 6).map((c) => (
            <li key={c.id} className="flex items-center gap-2 text-sm">
              <span className="min-w-0 flex-1 truncate">{c.name} <span className="text-subtle">[{c.ticker}]</span></span>
              <span className={cn("font-mono text-xs tabular-nums", c.net < 0 ? "text-danger-fg" : "text-success-fg")}>{isk(c.net, { sign: true })}</span>
            </li>
          ))}
        </ul>
      )}
    </Link>
  );
}
