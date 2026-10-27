// Each wallet division's balance over time, rebuilt from the journal's running balances.
import { AreaChart, api, Card, CardBody, CardHeader, cn, date, EmptyState, isk, PageHeader, Segmented, Skeleton, StatCard } from "@conduit/sdk";
import { useQuery } from "@tanstack/react-query";

import { Activity } from "./icons";
import { CorpPicker, query, useMonths, useParam } from "./shared";
import { BASE, type Balances } from "./types";

const RANGES = [
  { value: "30", label: "30 d" },
  { value: "90", label: "90 d" },
  { value: "180", label: "6 mo" },
  { value: "365", label: "1 y" },
  { value: "0", label: "All" },
];

export function BalancesPage() {
  const { data: meta } = useMonths();
  const [corporation, setCorporation] = useParam("corporation");
  const [range, setRange] = useParam("days");
  const days = RANGES.some((r) => r.value === range) ? range : "180";
  const { data, isLoading, error } = useQuery({
    queryKey: ["finance", "balances", corporation, days],
    queryFn: () => api.get<Balances>(`${BASE}/balances${query({ corporation, days })}`),
  });
  const corps = meta?.corporations ?? [];
  const total = data && data.series.length > 0 ? data.series[data.series.length - 1]!.value - data.series[0]!.value : 0;

  return (
    <>
      <PageHeader
        eyebrow="Corp finance"
        title="Balances"
        icon={<Activity />}
        description="Each wallet division's balance at the end of every day, from the balance the journal records after each entry. Today's comes from the last wallet sync."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {corps.length > 1 && <CorpPicker corps={corps} value={corporation || String(data?.corporation ?? "")} onChange={setCorporation} allowAll={false} />}
            <Segmented value={days} onChange={(v) => setRange(v === "180" ? "" : v)} options={RANGES} aria-label="Range" size="sm" />
          </div>
        }
      />
      {error ? (
        <Card><EmptyState icon={<Activity />} title="No corporation wallets to show" description={(error as Error).message} /></Card>
      ) : isLoading || !data ? (
        <Skeleton className="h-72" />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="All divisions" value={isk(data.balance)} mono hint="now" />
            <StatCard label="Change" value={isk(total, { sign: true })} mono tone={total < 0 ? "danger" : "success"} hint={`since ${date(data.since)}`} />
            <StatCard label="History from" value={date(data.coverage)} hint="the oldest journal entry kept" />
          </div>
          <Card>
            <CardHeader title="All divisions" description="Added up, internal transfers included (they cancel out)" />
            <CardBody><AreaChart data={data.series} format={(n) => isk(n)} label="Balance" /></CardBody>
          </Card>
          <div className="grid gap-6 lg:grid-cols-2">
            {data.divisions.map((d) => (
              <Card key={d.division}>
                <CardHeader
                  title={d.name}
                  description={`Division ${d.division}`}
                  actions={
                    <div className="text-right">
                      <div className="font-mono text-sm font-semibold tabular-nums">{isk(d.balance)}</div>
                      <div className={cn("font-mono text-xs tabular-nums", d.change < 0 ? "text-danger-fg" : d.change > 0 ? "text-success-fg" : "text-muted")}>
                        {isk(d.change, { sign: true })}
                      </div>
                    </div>
                  }
                />
                <CardBody><AreaChart data={d.series} format={(n) => isk(n)} label={d.name} height={160} /></CardBody>
              </Card>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
