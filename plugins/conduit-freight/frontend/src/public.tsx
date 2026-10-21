// Pages for everyone, signed in or not (/public/p/freight/...): public services and their calculators.
import { api, Card, EmptyState, PageHeader, Skeleton } from "@conduit/sdk";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router";

import { Truck } from "./icons";
import { RouteList, ServiceCard } from "./member";
import { BackLink, Calculator } from "./shared";
import { PUBLIC_BASE, type Service } from "./types";

const PUBLIC_HOME = "/public/p/freight";

export function PublicList() {
  const { data, isLoading } = useQuery({
    queryKey: ["freight", "public", "services"],
    queryFn: () => api.get<{ services: Service[] }>(`${PUBLIC_BASE}/services`),
  });
  return (
    <div>
      <PageHeader icon={<Truck />} eyebrow="Freight" title="Ship it with us" description="Pick a route for the reward and the exact courier contract to make." />
      {isLoading ? (
        <Skeleton className="h-56" />
      ) : !data?.services.length ? (
        <Card>
          <EmptyState icon={<Truck />} title="No public freight services" />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.services.map((s) => (
            <ServiceCard key={s.id} service={s} to={`${PUBLIC_HOME}/${s.id}`} />
          ))}
        </div>
      )}
    </div>
  );
}

export function PublicService() {
  const { id } = useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["freight", "public", "service", id],
    queryFn: () => api.get<Service>(`${PUBLIC_BASE}/services/${id}`),
  });
  if (isLoading) return <Skeleton className="h-96" />;
  if (!data) return <EmptyState icon={<Truck />} title="No such service" description="It may be closed, or no longer public." />;
  return (
    <div>
      <BackLink to={PUBLIC_HOME}>All services</BackLink>
      <PageHeader icon={<Truck />} eyebrow="Freight" title={data.name} description={data.description || undefined} />
      <Calculator service={data} base={PUBLIC_BASE} />
      <RouteList service={data} />
    </div>
  );
}
