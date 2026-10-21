// The members' pages: services and their calculators, and the contracts they made.
import { api, Button, Card, CardBody, DataTable, dateTime, EmptyState, isk, num, PageHeader, Skeleton } from "@conduit/sdk";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router";

import { Settings, Truck } from "./icons";
import { BackLink, Calculator, Problems, RateFacts, RouteLabel, StatusBadge } from "./shared";
import { BASE, type Contract, type Service } from "./types";

const HOME = "/p/freight";

interface ServicesOut {
  services: Service[];
  can_manage: boolean;
  sees_queue: boolean;
}

export function ServiceCard({ service, to }: { service: Service; to: string }) {
  return (
    <Card interactive>
      <Link to={to} className="block">
        <CardBody className="space-y-3">
          <div>
            <div className="text-base font-semibold">{service.name}</div>
            {service.description && <p className="mt-1 line-clamp-2 text-sm text-muted">{service.description}</p>}
          </div>
          <ul className="space-y-2">
            {service.routes.slice(0, 4).map((r) => (
              <li key={r.id}>
                <RouteLabel route={r} compact />
              </li>
            ))}
            {service.routes.length > 4 && <li className="text-xs text-subtle">and {service.routes.length - 4} more</li>}
          </ul>
        </CardBody>
      </Link>
    </Card>
  );
}

export function HomePage() {
  const { data, isLoading } = useQuery({ queryKey: ["freight", "services"], queryFn: () => api.get<ServicesOut>(`${BASE}/services`) });
  return (
    <div>
      <PageHeader
        icon={<Truck />}
        eyebrow="Freight"
        title="Ship it with us"
        description="Pick a route for the reward and the exact courier contract to make."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to={`${HOME}/me`}>
              <Button size="sm">My contracts</Button>
            </Link>
            {data?.sees_queue && (
              <Link to={`${HOME}/queue`}>
                <Button size="sm">Hauling queue</Button>
              </Link>
            )}
            {data?.can_manage && (
              <Link to={`${HOME}/manage`}>
                <Button size="sm">
                  <Settings /> Services
                </Button>
              </Link>
            )}
          </div>
        }
      />
      {isLoading ? (
        <Skeleton className="h-56" />
      ) : !data?.services.length ? (
        <Card>
          <EmptyState icon={<Truck />} title="No freight services yet" description={data?.can_manage ? "Create one under Services." : undefined} />
        </Card>
      ) : data.services.length === 1 ? (
        <Calculator service={data.services[0]} base={BASE} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.services.map((s) => (
            <ServiceCard key={s.id} service={s} to={`${HOME}/services/${s.id}`} />
          ))}
        </div>
      )}
    </div>
  );
}

export function ServicePage() {
  const { id } = useParams();
  const { data, isLoading } = useQuery({ queryKey: ["freight", "service", id], queryFn: () => api.get<Service>(`${BASE}/services/${id}`) });
  if (isLoading) return <Skeleton className="h-96" />;
  if (!data) return <EmptyState icon={<Truck />} title="No such service" />;
  return (
    <div>
      <BackLink to={HOME}>All services</BackLink>
      <PageHeader icon={<Truck />} eyebrow="Freight" title={data.name} description={data.description || undefined} />
      <Calculator service={data} base={BASE} />
      <RouteList service={data} />
    </div>
  );
}

export function RouteList({ service }: { service: Service }) {
  if (service.routes.length < 2) return null;
  return (
    <Card className="mt-6">
      <CardBody>
        <div className="hud-label mb-3 text-subtle">Routes and rates</div>
        <ul className="divide-y divide-border">
          {service.routes.map((r) => (
            <li key={r.id} className="grid gap-2 py-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <RouteLabel route={r} />
              <RateFacts route={r} />
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}

export function contractColumns(withIssuer: boolean) {
  return [
    {
      header: "Route",
      cell: (c: Contract) => (
        <div className="min-w-0">
          <div className="truncate font-medium">{c.route ?? `${c.start ?? "?"} → ${c.end ?? "?"}`}</div>
          <div className="truncate text-xs text-subtle">
            {c.service?.name ?? "No service"} · {dateTime(c.date_issued)}
          </div>
        </div>
      ),
    },
    ...(withIssuer
      ? [{ header: "From", cell: (c: Contract) => <span>{c.issuer.name}</span>, sortValue: (c: Contract) => c.issuer.name }]
      : []),
    { header: "Volume", align: "right" as const, cell: (c: Contract) => <span className="font-mono tabular-nums">{num(c.volume)} m³</span>, sortValue: (c: Contract) => c.volume },
    { header: "Collateral", align: "right" as const, cell: (c: Contract) => <span className="font-mono tabular-nums">{isk(c.collateral)}</span>, sortValue: (c: Contract) => c.collateral },
    {
      header: "Reward",
      align: "right" as const,
      cell: (c: Contract) => (
        <div className="font-mono tabular-nums">
          {isk(c.reward)}
          {c.expected_reward !== null && Math.abs(c.expected_reward - c.reward) > 1 && <div className="text-xs text-subtle">asks {isk(c.expected_reward)}</div>}
        </div>
      ),
      sortValue: (c: Contract) => c.reward,
    },
    {
      header: "Status",
      cell: (c: Contract) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge status={c.status} label={c.status_label} />
          {c.acceptor && <span className="text-xs text-subtle">{c.acceptor.name}</span>}
        </div>
      ),
    },
    { header: "Checks", cell: (c: Contract) => (c.open ? <Problems problems={c.problems} compact /> : null) },
  ];
}

export function MyPage() {
  const { data, isLoading } = useQuery({ queryKey: ["freight", "me"], queryFn: () => api.get<{ contracts: Contract[] }>(`${BASE}/me`) });
  return (
    <div>
      <BackLink to={HOME}>Freight</BackLink>
      <PageHeader icon={<Truck />} eyebrow="Freight" title="My contracts" description="Courier contracts your characters made to the freight services." />
      <Card>
        <DataTable
          rows={data?.contracts ?? []}
          loading={isLoading}
          rowKey={(c) => c.contract_id}
          columns={contractColumns(false)}
          empty={{ icon: <Truck />, title: "No courier contracts yet" }}
        />
      </Card>
    </div>
  );
}
