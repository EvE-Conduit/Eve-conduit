// Sellers: the programs they can use, the calculator, their quotes and contracts.
import { api, Badge, Button, buttonVariants, Card, CardBody, dateTime, EmptyState, isk, num, PageHeader, Skeleton, StatCard, timeAgo } from "@conduit/sdk";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router";

import { ArrowLeft, Cart, Globe, Package, Settings } from "./icons";
import { Calculator, Compare, ContractSteps, CopyButton, LinesTable, PlacesList, Problems, ProgramFacts, StatusBadge } from "./shared";
import { BASE, type ContractRow, type MyQuotes, type Program, type ProgramList, type QuoteDetail } from "./types";

export const HOME = "/p/buyback";

export function usePrograms() {
  return useQuery({ queryKey: ["buyback", "programs"], queryFn: () => api.get<ProgramList>(`${BASE}/programs`) });
}

export function useMine() {
  return useQuery({ queryKey: ["buyback", "me"], queryFn: () => api.get<MyQuotes>(`${BASE}/me`) });
}

export function ProgramCard({ program, to }: { program: Program; to: string }) {
  return (
    <Link to={to} className="block">
      <Card interactive className="h-full">
        <CardBody className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="hud-label truncate text-[15px] text-text">{program.name}</h2>
              {program.description && <p className="mt-1 line-clamp-2 text-sm text-muted">{program.description}</p>}
            </div>
            <div className="shrink-0 text-right">
              <div className="font-mono text-2xl font-semibold tabular-nums text-accent-ink">{program.tax}%</div>
              <div className="text-[11px] uppercase tracking-wider text-subtle">tax</div>
            </div>
          </div>
          <PlacesList terms={program.terms} />
          <ProgramFacts program={program} />
          <div className="flex flex-wrap gap-1.5">
            {!program.active && <Badge tone="warning">Closed</Badge>}
            {program.public && (
              <Badge tone="info">
                <Globe className="size-3" /> Public
              </Badge>
            )}
          </div>
        </CardBody>
      </Card>
    </Link>
  );
}

export function HomePage() {
  const { data, isLoading } = usePrograms();
  const mine = useMine();
  const open = mine.data?.quotes.filter((q) => q.contract?.open) ?? [];
  return (
    <div>
      <PageHeader
        icon={<Cart />}
        eyebrow="Buyback"
        title="Sell your loot and ore"
        description={
          data
            ? `Paste your items for an instant quote, then contract them. Prices: ${data.prices.source}${data.prices.instant ? " (best order)" : " (top 5% of orders)"} at each program's market${data.prices.guard ? `, checked against the last ${data.prices.guard_days} days of trading` : ""}.`
            : "Paste your items for an instant quote, then contract them."
        }
        actions={
          <>
            <Link to={`${HOME}/me`} className={buttonVariants({ variant: "secondary" })}>
              <Package /> My quotes
            </Link>
            {(data?.manages || data?.can_create) && (
              <Link to={`${HOME}/manage`} className={buttonVariants({ variant: "secondary" })}>
                <Settings /> Run programs
              </Link>
            )}
          </>
        }
      />
      {mine.data && (mine.data.totals.open > 0 || mine.data.totals.sold_value > 0) && (
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <StatCard label="Waiting to be accepted" value={mine.data.totals.open} hint={isk(mine.data.totals.open_value)} />
          <StatCard label="Sold so far" value={isk(mine.data.totals.sold_value)} mono tone="success" />
          <StatCard label="Quotes" value={mine.data.quotes.length} hint={open.length ? `${open.length} contract${open.length === 1 ? "" : "s"} open` : "none open"} />
        </div>
      )}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-56" />
          <Skeleton className="h-56" />
        </div>
      ) : !data?.programs.length ? (
        <Card>
          <EmptyState
            icon={<Cart />}
            title="No buyback programs for you yet"
            description={data?.can_create ? "Set one up: who buys, where, and at what tax." : "Leadership hasn't opened a buyback you can use."}
            action={data?.can_create ? <Link to={`${HOME}/manage/new`} className={buttonVariants({ variant: "primary" })}>Create a program</Link> : undefined}
          />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.programs.map((p) => (
            <ProgramCard key={p.id} program={p} to={`${HOME}/programs/${p.id}`} />
          ))}
        </div>
      )}
    </div>
  );
}

export function BackLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-text">
      <ArrowLeft /> {children}
    </Link>
  );
}

export function ProgramPage() {
  const { id } = useParams();
  const { data, isLoading, error } = useQuery({ queryKey: ["buyback", "program", id], queryFn: () => api.get<Program>(`${BASE}/programs/${id}`) });
  if (isLoading) return <Skeleton className="h-96" />;
  if (!data) return <EmptyState icon={<Cart />} title="No such program" description={(error as Error | null)?.message} />;
  return (
    <div>
      <BackLink to={HOME}>All programs</BackLink>
      <PageHeader
        icon={<Cart />}
        eyebrow={`Buyback · ${data.tax}% tax · priced at ${data.prices.hub}`}
        title={data.name}
        description={data.description || undefined}
        actions={
          data.can_manage && (
            <Link to={`${HOME}/manage/${data.id}`} className={buttonVariants({ variant: "secondary" })}>
              <Settings /> Manage
            </Link>
          )
        }
      />
      {!data.active && <p className="mb-4 text-sm text-warning-fg">This program is closed; only its managers see it.</p>}
      <Calculator program={data} base={BASE} quoteLink={(t) => `${HOME}/quotes/${t}`} />
    </div>
  );
}

export function MyPage() {
  const { data, isLoading } = useMine();
  return (
    <div>
      <BackLink to={HOME}>Buyback</BackLink>
      <PageHeader icon={<Package />} title="My quotes" description="Every quote you made and what happened to its contract. Quotes without a contract are removed after a while." />
      {isLoading ? (
        <Skeleton className="h-64" />
      ) : !data?.quotes.length ? (
        <Card>
          <EmptyState icon={<Package />} title="No quotes yet" action={<Link to={HOME} className={buttonVariants({ variant: "primary" })}>Get a quote</Link>} />
        </Card>
      ) : (
        <Card>
          <ul className="divide-y divide-border">
            {data.quotes.map((q) => (
              <li key={q.tracking_number}>
                <Link to={`${HOME}/quotes/${q.tracking_number}`} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 hover:bg-hover">
                  <div className="min-w-0">
                    <div className="font-mono text-sm">{q.tracking_number}</div>
                    <div className="text-xs text-subtle">
                      {q.program.name} · {q.items} item{q.items === 1 ? "" : "s"} · {timeAgo(q.created_at)}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {q.contract && q.contract.problems.length > 0 && <Problems problems={q.contract.problems} compact />}
                    <StatusBadge status={q.state} label={q.contract?.status_label} />
                    <span className="w-36 text-right font-mono text-sm tabular-nums">{isk(q.value, { full: true })}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

export function ContractPanel({ c, lines }: { c: ContractRow; lines?: QuoteDetail["lines"] }) {
  return (
    <Card>
      <CardBody className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="hud-label text-subtle">Contract</div>
            <div className="mt-1 text-sm">
              From <span className="font-medium">{c.issuer.name}</span>
              {c.issuer_corporation && <span className="text-subtle"> · {c.issuer_corporation}</span>}
            </div>
            <div className="text-xs text-subtle">
              Made {dateTime(c.date_issued)}
              {c.location && <> at {c.location}</>}
              {c.date_completed && <> · settled {dateTime(c.date_completed)}</>}
            </div>
          </div>
          <div className="text-right">
            <StatusBadge status={c.status} label={c.status_label} />
            <div className="mt-1 font-mono text-lg tabular-nums">{isk(c.price, { full: true })}</div>
            {c.quoted != null && c.quoted !== c.price && <div className="text-xs text-subtle">quoted {isk(c.quoted, { full: true })}</div>}
          </div>
        </div>
        <Problems problems={c.problems} />
      </CardBody>
      {lines && <Compare lines={lines} items={c.items} />}
    </Card>
  );
}

export function QuotePage() {
  const { tracking } = useParams();
  const { data, isLoading } = useQuery({ queryKey: ["buyback", "quote", tracking], queryFn: () => api.get<QuoteDetail>(`${BASE}/quotes/${tracking}`) });
  if (isLoading) return <Skeleton className="h-96" />;
  if (!data) return <EmptyState icon={<Package />} title="No such quote" description="It may have been removed because no contract was made for it." />;
  return (
    <div>
      <BackLink to={data.mine ? `${HOME}/me` : data.can_manage ? `${HOME}/manage/${data.program.id}` : HOME}>{data.mine ? "My quotes" : "Back"}</BackLink>
      <PageHeader
        icon={<Package />}
        eyebrow={data.program.name}
        title={
          <span className="inline-flex flex-wrap items-center gap-3 font-mono">
            {data.tracking_number} <CopyButton value={data.tracking_number} />
          </span>
        }
        description={`Quoted ${dateTime(data.created_at)}${data.hub ? ` at ${data.hub} prices` : ""}${data.seller && !data.mine ? ` for ${data.seller}` : ""}${data.public ? " (public calculator)" : ""}.`}
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-4">
          {data.contracts.map((c) => (
            <ContractPanel key={c.contract_id} c={c} lines={data.lines} />
          ))}
          <Card>
            <div className="border-b border-border px-4 py-3">
              <div className="hud-label text-subtle">Quote</div>
            </div>
            <LinesTable lines={data.lines} />
          </Card>
        </div>
        <div>
          {data.contracts.length === 0 ? (
            <ContractSteps quote={data} />
          ) : (
            <Card>
              <CardBody>
                <div className="hud-label text-subtle">Quoted</div>
                <div className="mt-1 font-mono text-2xl tabular-nums">{isk(data.value, { full: true })}</div>
                <div className="text-xs text-subtle">{num(data.volume)} m³</div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export function ContractPage() {
  const { id } = useParams();
  const { data, isLoading } = useQuery({ queryKey: ["buyback", "contract", id], queryFn: () => api.get<ContractRow>(`${BASE}/contracts/${id}`) });
  if (isLoading) return <Skeleton className="h-96" />;
  if (!data) return <EmptyState icon={<Package />} title="No such contract" />;
  return (
    <div>
      {data.program && <BackLink to={`${HOME}/manage/${data.program.id}`}>{data.program.name}</BackLink>}
      <PageHeader
        icon={<Package />}
        eyebrow={data.program?.name ?? "Buyback"}
        title={data.title || `Contract ${data.contract_id}`}
        actions={
          data.tracking_number && (
            <Link to={`${HOME}/quotes/${data.tracking_number}`} className={buttonVariants({ variant: "secondary" })}>
              Open the quote
            </Link>
          )
        }
      />
      <ContractPanel c={data} lines={data.quote?.lines ?? []} />
      {!data.quote && (
        <p className="mt-4 text-sm text-muted">
          No quote has this contract's tracking number, so there's nothing to compare it with. Check every item by hand, or reject it.
        </p>
      )}
    </div>
  );
}

export function SellerWidget() {
  const { data, isLoading } = useMine();
  if (isLoading) return <Skeleton className="h-16" />;
  if (!data) return null;
  return (
    <Link to={HOME} className="block">
      <div className="flex items-end justify-between gap-6">
        <div>
          <div className="text-xs text-muted">Buyback contracts waiting</div>
          <div className="mt-1 font-mono text-3xl font-semibold tabular-nums">{data.totals.open}</div>
          <div className="text-xs text-subtle">{isk(data.totals.open_value)} to come</div>
        </div>
        <Button variant="secondary" size="sm" tabIndex={-1}>
          Get a quote
        </Button>
      </div>
    </Link>
  );
}
