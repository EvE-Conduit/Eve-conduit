// What still needs research: originals short of ME 10 / TE 20, and research and copy jobs running now.
import { api, Badge, Card, CardHeader, date, duration, EmptyState, PageHeader, Skeleton, StatCard, Table, Td, Th, THead, Tr } from "@conduit/sdk";
import { useQuery } from "@tanstack/react-query";

import { Flask } from "./icons";
import { BackLink, BlueprintIcon, Research } from "./shared";
import { BASE, type Place } from "./types";

interface ResearchOut {
  summary: { originals: number; researched: number; me_short: number; te_short: number };
  unresearched: { id: number; type_id: number; name: string; icon: string; corporation: string; quantity: number; me: number; te: number; location: Place | null; division: string | null }[];
  jobs: { job_id: number; activity: string; name: string; icon: string; runs: number; status: string; end_date: string; installer: string; corporation: string; location: Place | null }[];
}

export function ResearchPage() {
  const { data, isLoading } = useQuery({ queryKey: ["blueprints", "research"], queryFn: () => api.get<ResearchOut>(`${BASE}/research`), refetchInterval: 300_000 });
  return (
    <>
      <BackLink to="/p/blueprints">Library</BackLink>
      <PageHeader eyebrow="Industry" title="Research" icon={<Flask />} description="Corporation originals that aren't fully researched, and the research and copy jobs running in the corporations." />
      {isLoading || !data ? (
        <Skeleton className="h-64" />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Originals" value={data.summary.originals} />
            <StatCard label="Fully researched" value={data.summary.researched} tone="success" hint="ME 10 and TE 20" />
            <StatCard label="ME below 10" value={data.summary.me_short} tone={data.summary.me_short ? "warning" : undefined} />
            <StatCard label="TE below 20" value={data.summary.te_short} tone={data.summary.te_short ? "warning" : undefined} />
          </div>
          <Card>
            <CardHeader title="Running jobs" description="ME and TE research, copying and invention in the corporations' industry jobs." />
            {data.jobs.length === 0 ? (
              <p className="px-card pb-card text-sm text-muted">Nothing running.</p>
            ) : (
              <Table>
                <THead>
                  <tr>
                    <Th>Blueprint</Th>
                    <Th>Job</Th>
                    <Th>Installed by</Th>
                    <Th>Where</Th>
                    <Th align="right">Ends</Th>
                  </tr>
                </THead>
                <tbody>
                  {data.jobs.map((j) => (
                    <Tr key={j.job_id}>
                      <Td><div className="flex items-center gap-2"><BlueprintIcon src={j.icon} name={j.name} /><span>{j.name}</span></div></Td>
                      <Td>
                        <div>{j.activity} · <span className="font-mono">{j.runs}</span> run{j.runs === 1 ? "" : "s"}</div>
                        {j.status !== "active" && <Badge tone={j.status === "ready" ? "success" : "neutral"}>{j.status}</Badge>}
                      </Td>
                      <Td>{j.installer || "—"}<div className="text-xs text-muted">{j.corporation}</div></Td>
                      <Td className="text-sm">{j.location?.name ?? "—"}</Td>
                      <Td align="right" className="text-xs text-muted" title={date(j.end_date)}>{j.status === "active" ? duration(j.end_date) : "—"}</Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
          <Card>
            <CardHeader title="Not fully researched" />
            {data.unresearched.length === 0 ? (
              <EmptyState icon={<Flask />} title="Everything is researched" description={data.summary.originals ? "Every corporation original is ME 10 / TE 20." : "No corporation originals yet."} />
            ) : (
              <Table>
                <THead>
                  <tr>
                    <Th>Blueprint</Th>
                    <Th>Research</Th>
                    <Th>Owner</Th>
                    <Th>Where</Th>
                  </tr>
                </THead>
                <tbody>
                  {data.unresearched.map((b) => (
                    <Tr key={b.id}>
                      <Td>
                        <div className="flex items-center gap-2">
                          <BlueprintIcon src={b.icon} name={b.name} />
                          <span>{b.name}</span>
                          {b.quantity > 1 && <span className="font-mono text-xs">× {b.quantity}</span>}
                        </div>
                      </Td>
                      <Td><Research me={b.me} te={b.te} /></Td>
                      <Td>{b.corporation}</Td>
                      <Td>
                        <div className="text-sm">{b.location?.name ?? "Unknown location"}</div>
                        {b.division && <div className="text-xs text-muted">{b.division}</div>}
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
