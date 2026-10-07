import { Card, CardBody, CardHeader, defineModule, PageHeader, Skeleton, StatCard, api, timeAgo } from "@evecsm/sdk";
import { useQuery } from "@tanstack/react-query";

interface Status {
  players: number;
  server_version: string;
  start_time: string;
  vip: boolean;
}

function useStatus() {
  return useQuery({
    queryKey: ["example", "status"],
    queryFn: () => api.get<Status>("/api/m/example/status"),
    refetchInterval: 60_000,
  });
}

function StatusWidget() {
  const { data, isLoading, error } = useStatus();
  if (isLoading) return <Skeleton className="h-16" />;
  if (error || !data) return <p className="text-sm text-muted">Tranquility isn't answering right now.</p>;
  return (
    <div className="flex items-end justify-between gap-6">
      <div>
        <div className="flex items-center gap-2 text-xs text-muted">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-success" />
          </span>
          Tranquility online
        </div>
        <div className="mt-2 font-mono text-3xl font-semibold tabular-nums">{data.players.toLocaleString()}</div>
        <div className="text-xs text-subtle">capsuleers in space</div>
      </div>
      <div className="text-right text-xs text-muted">
        <div>Up since {timeAgo(data.start_time)}</div>
        <div className="font-mono text-subtle">build {data.server_version}</div>
      </div>
    </div>
  );
}

function StatusPage() {
  const { data } = useStatus();
  return (
    <>
      <PageHeader eyebrow="Example module" title="Server status" description="A tiny page served by a module. Copy this module to start your own." />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Players online" value={data ? data.players.toLocaleString() : "…"} mono />
        <StatCard label="Server version" value={data?.server_version ?? "…"} mono />
        <StatCard label="Last restart" value={data ? timeAgo(data.start_time) : "…"} />
      </div>
      <Card className="mt-6">
        <CardHeader title="How this page got here" description="Everything below is ordinary React inside a module bundle." />
        <CardBody className="space-y-2 text-sm text-muted">
          <p>The Python side declares the module and an API router. The front end is built to a single ES module that the site loads at runtime.</p>
          <p>Components, data fetching and styles come from the host through <code className="font-mono text-accent">@evecsm/sdk</code>, so modules always match the site's look.</p>
        </CardBody>
      </Card>
    </>
  );
}

function CharacterTab({ characterId }: { characterId: number }) {
  return (
    <Card>
      <CardBody className="text-sm text-muted">
        Modules can add tabs to the character sheet. This one received character <span className="font-mono text-text">{characterId}</span>.
      </CardBody>
    </Card>
  );
}

export default defineModule({
  routes: [{ path: "", Component: StatusPage }],
  widgets: [{ id: "status", title: "Tranquility", Component: StatusWidget, size: "sm", order: 10 }],
  characterTabs: [{ id: "example", label: "Example", Component: CharacterTab, order: 900 }],
});
