// Pages for everyone, signed in or not (/public/p/buyback/...): public programs, their calculator and quotes.
import { api, Card, CardBody, EmptyState, isk, num, PageHeader, Skeleton } from "@conduit/sdk";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router";

import { Cart, Package } from "./icons";
import { BackLink, ProgramCard } from "./member";
import { Calculator, ContractSteps, CopyButton, LinesTable, StatusBadge } from "./shared";
import { type PriceInfo, type Program, PUBLIC_BASE, type QuoteSummary } from "./types";

const PUBLIC_HOME = "/public/p/buyback";

export function PublicList() {
  const { data, isLoading } = useQuery({
    queryKey: ["buyback", "public", "programs"],
    queryFn: () => api.get<{ programs: Program[]; prices: PriceInfo }>(`${PUBLIC_BASE}/programs`),
  });
  return (
    <div>
      <PageHeader icon={<Cart />} eyebrow="Buyback" title="Sell to us" description="Paste your items for an instant quote, then contract them in game." />
      {isLoading ? (
        <Skeleton className="h-56" />
      ) : !data?.programs.length ? (
        <Card>
          <EmptyState icon={<Cart />} title="No public buyback programs" />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.programs.map((p) => (
            <ProgramCard key={p.id} program={p} to={`${PUBLIC_HOME}/${p.id}`} />
          ))}
        </div>
      )}
    </div>
  );
}

export function PublicProgram() {
  const { id } = useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["buyback", "public", "program", id],
    queryFn: () => api.get<Program>(`${PUBLIC_BASE}/programs/${id}`),
  });
  if (isLoading) return <Skeleton className="h-96" />;
  if (!data) return <EmptyState icon={<Cart />} title="No such program" description="It may be closed, or no longer public." />;
  return (
    <div>
      <BackLink to={PUBLIC_HOME}>All programs</BackLink>
      <PageHeader
        icon={<Cart />}
        eyebrow={`Buyback · ${data.tax}% tax · priced at ${data.prices.hub}`}
        title={data.name}
        description={data.description || undefined}
      />
      <Calculator program={data} base={PUBLIC_BASE} quoteLink={(t) => `${PUBLIC_HOME}/quotes/${t}`} />
    </div>
  );
}

export function PublicQuote() {
  const { tracking } = useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["buyback", "public", "quote", tracking],
    queryFn: () => api.get<QuoteSummary & { lines: QuoteSummary["lines"]; contract: { status: string; status_label: string } | null }>(`${PUBLIC_BASE}/quotes/${tracking}`),
  });
  if (isLoading) return <Skeleton className="h-96" />;
  if (!data) return <EmptyState icon={<Package />} title="No such quote" description="It may have been removed because no contract was made for it." />;
  return (
    <div>
      <BackLink to={`${PUBLIC_HOME}/${data.program.id}`}>{data.program.name}</BackLink>
      <PageHeader
        icon={<Package />}
        eyebrow={data.program.name}
        title={
          <span className="inline-flex flex-wrap items-center gap-3 font-mono">
            {data.tracking_number} <CopyButton value={data.tracking_number} />
          </span>
        }
        description="Keep this page's address to follow the contract."
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <Card>
          <LinesTable lines={data.lines ?? []} />
        </Card>
        <div className="space-y-4">
          {data.contract ? (
            <Card>
              <CardBody className="space-y-2">
                <div className="hud-label text-subtle">Contract</div>
                <StatusBadge status={data.contract.status} label={data.contract.status_label} />
                <div className="font-mono text-2xl tabular-nums">{isk(data.value, { full: true })}</div>
                <div className="text-xs text-subtle">{num(data.volume)} m³</div>
              </CardBody>
            </Card>
          ) : (
            <ContractSteps quote={data} />
          )}
        </div>
      </div>
    </div>
  );
}
