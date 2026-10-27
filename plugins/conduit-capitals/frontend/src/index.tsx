import { api, definePlugin, num, Skeleton } from "@conduit/sdk";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";

import { MemberPage } from "./member";
import { MyCapitalsPage } from "./mine";
import { ClassPage, RegistryPage } from "./registry";
import { BASE, type Summary } from "./types";

function RegistryWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ["capitals", "summary", ""],
    queryFn: () => api.get<Summary>(`${BASE}/registry/summary`),
    refetchInterval: 600_000,
  });
  if (isLoading || !data) return <Skeleton className="h-24" />;
  return (
    <Link to="/p/capitals/registry" className="block">
      <ul className="space-y-1 text-sm">
        {data.classes.filter((k) => k.pilots || k.owned).map((k) => (
          <li key={k.key} className="flex items-baseline justify-between gap-3">
            <span className="text-muted">{k.label}</span>
            <span className="font-mono tabular-nums">{num(k.pilots)} <span className="text-subtle">pilots ·</span> {num(k.owned)} <span className="text-subtle">owned</span></span>
          </li>
        ))}
        {!data.classes.some((k) => k.pilots || k.owned) && <li className="text-muted">No capital pilots found yet.</li>}
      </ul>
    </Link>
  );
}

export default definePlugin({
  routes: [
    { path: "", Component: MyCapitalsPage },
    { path: "registry", Component: RegistryPage },
    { path: "registry/class/:key", Component: ClassPage },
    { path: "registry/member/:id", Component: MemberPage },
  ],
  widgets: [{ id: "registry", title: "Capitals", Component: RegistryWidget, size: "sm", order: 50, permission: "capitals.view_registry" }],
});
