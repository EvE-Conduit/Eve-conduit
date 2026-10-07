import { api, Badge, definePlugin, EmptyState, Skeleton } from "@conduit/sdk";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";

import { DoctrinePage } from "./doctrine";
import { AllFitsPage, FitEditorPage } from "./edit";
import { FitPage } from "./fit";
import { HomePage } from "./home";
import { Swords } from "./icons";
import { ReadinessPage } from "./readiness";
import { RoleBadge, StatusBadge } from "./shared";
import { BASE, type CharacterDoctrine, type Ship } from "./types";

/** How many of the active doctrine fits I can fly, on the dashboard. */
function DoctrinesWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ["doctrines", "me"],
    queryFn: () => api.get<{ total: number; flyable: number; ships: Ship[] }>(`${BASE}/me`),
  });
  if (isLoading) return <Skeleton className="h-16" />;
  if (!data) return null;
  return (
    <Link to="/p/doctrines" className="block">
      <div className="flex items-end justify-between gap-6">
        <div>
          <div className="text-xs text-muted">Doctrine fits you can fly</div>
          <div className="mt-1 font-mono text-3xl font-semibold tabular-nums">
            {data.flyable}<span className="text-lg text-subtle"> / {data.total}</span>
          </div>
        </div>
        <div className="flex -space-x-1.5">
          {data.ships.map((s) => <img key={s.id} src={s.icon} alt={s.name} title={s.name} className="size-8 rounded-full bg-surface-3 ring-2 ring-surface" />)}
        </div>
      </div>
    </Link>
  );
}

/** The character sheet's Doctrines tab: which doctrine fits this character can fly. */
function CharacterDoctrines({ characterId }: { characterId: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ["doctrines", "character", characterId],
    queryFn: () => api.get<CharacterDoctrine[]>(`${BASE}/characters/${characterId}`),
  });
  if (isLoading) return <Skeleton className="h-40" />;
  if (!data?.length) return <EmptyState icon={<Swords />} title="No doctrines yet" />;
  return (
    <div className="space-y-6">
      {data.map((d) => (
        <section key={d.id}>
          <Link to={`/p/doctrines/${d.id}`} className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-subtle hover:text-text">{d.name}</Link>
          <ul className="divide-y divide-border border border-border">
            {d.fits.map((f) => (
              <li key={f.id}>
                <Link to={`/p/doctrines/fit/${f.id}`} className="flex items-center gap-3 px-3 py-2 hover:bg-hover">
                  <img src={f.ship.icon} alt="" className="size-8" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-sm font-medium">{f.name} <RoleBadge role={f.role} /></span>
                    <span className="text-xs text-muted">{f.ship.name}</span>
                  </span>
                  <StatusBadge status={f} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <p className="text-xs text-subtle"><Badge size="xs">Ready</Badge> has the recommended skills too; <Badge size="xs">Can fly</Badge> has what the fit needs.</p>
    </div>
  );
}

export default definePlugin({
  routes: [
    { path: "", Component: HomePage },
    { path: "fits", Component: AllFitsPage },
    { path: "fit/new", Component: FitEditorPage },
    { path: "fit/:id", Component: FitPage },
    { path: "fit/:id/edit", Component: FitEditorPage },
    { path: ":id", Component: DoctrinePage },
    { path: ":id/readiness", Component: ReadinessPage },
  ],
  widgets: [{ id: "flyable", title: "Doctrines", Component: DoctrinesWidget, size: "sm", order: 36 }],
  characterTabs: [{ id: "doctrines", label: "Doctrines", Component: CharacterDoctrines, order: 300 }],
});
