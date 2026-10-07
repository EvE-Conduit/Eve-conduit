// One doctrine: its fits grouped by role, with whether each of my characters can fly them.
import { api, Avatar, Button, Card, EmptyState, isk, PageHeader, Skeleton, Tooltip } from "@conduit/sdk";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useParams } from "react-router";

import { DoctrineDialog } from "./edit";
import { Pencil, Plus, Swords, Users } from "./icons";
import { useOverview } from "./home";
import { RoleBadge, StatusBadge } from "./shared";
import { BASE, type DoctrineDetail, type DoctrineFitRow } from "./types";

export function DoctrinePage() {
  const { id } = useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ["doctrines", "doctrine", id],
    queryFn: () => api.get<DoctrineDetail>(`${BASE}/doctrines/${id}`),
  });
  const overview = useOverview();
  const [editing, setEditing] = useState(false);

  if (error) return <EmptyState icon={<Swords />} title="No such doctrine" action={<Link to="/p/doctrines"><Button variant="secondary">All doctrines</Button></Link>} />;
  if (isLoading || !data) return <Skeleton className="h-64" />;

  const byRole = new Map<string, DoctrineFitRow[]>();
  for (const f of data.fits) {
    const key = f.role || "Fits";
    byRole.set(key, [...(byRole.get(key) ?? []), f]);
  }

  return (
    <>
      <PageHeader
        eyebrow={<Link to="/p/doctrines" className="hover:text-text">Doctrines</Link>}
        title={data.name}
        icon={<Swords />}
        description={data.description || undefined}
        actions={
          <div className="flex flex-wrap gap-2">
            {overview.data?.can_see_readiness && (
              <Link to={`/p/doctrines/${data.id}/readiness`}><Button variant="ghost"><Users /> Who can fly it</Button></Link>
            )}
            {data.can_manage && (
              <>
                <Link to={`/p/doctrines/fit/new?doctrine=${data.id}`}><Button variant="secondary"><Plus /> Add fit</Button></Link>
                <Button variant="ghost" onClick={() => setEditing(true)}><Pencil /> Edit</Button>
              </>
            )}
          </div>
        }
      />

      {data.render && (
        <div className="relative mb-6 h-40 overflow-hidden border border-border bg-surface-2 sm:h-56">
          <img src={data.render} alt="" className="absolute inset-0 size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-surface/90 via-surface/20 to-transparent" />
          <div className="absolute bottom-4 left-5 text-sm text-muted">{data.fits.length} fit{data.fits.length === 1 ? "" : "s"}</div>
        </div>
      )}

      {data.fits.length === 0 ? (
        <Card>
          <EmptyState icon={<Swords />} title="No fits in this doctrine yet" description={data.can_manage ? "Add one by pasting it from the game." : undefined} />
        </Card>
      ) : (
        <div className="space-y-6">
          {[...byRole.entries()].map(([role, fits]) => (
            <section key={role}>
              <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-subtle">{role}</h2>
              <div className="grid gap-3 md:grid-cols-2">
                {fits.map((f) => <FitCard key={f.id} fit={f} />)}
              </div>
            </section>
          ))}
        </div>
      )}

      {editing && <DoctrineDialog doctrine={data} onClose={() => setEditing(false)} />}
    </>
  );
}

function FitCard({ fit }: { fit: DoctrineFitRow }) {
  return (
    <Link to={`/p/doctrines/fit/${fit.id}`} className="block">
      <Card interactive className="flex h-full items-center gap-4 p-card">
        <img src={fit.ship.render} alt="" className="size-20 shrink-0 rounded-full bg-surface-2 object-cover ring-1 ring-border" loading="lazy" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate font-medium">{fit.name}</span>
            <RoleBadge role={fit.role} />
          </div>
          <div className="text-xs text-muted">{fit.ship.name} · {fit.ship.group} · {isk(fit.value)}</div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={fit.best} />
            <span className="flex -space-x-1">
              {fit.characters.map((c) => (
                <Tooltip key={c.character.id} content={`${c.character.name}: ${{ ready: "ready", can_fly: "can fly", missing: `${c.missing} skills missing`, unknown: "skills not synced" }[c.status]}`}>
                  <span className={c.status === "ready" || c.status === "can_fly" ? "" : "opacity-40 grayscale"}>
                    <Avatar src={c.character.portrait} name={c.character.name} size="xs" />
                  </span>
                </Tooltip>
              ))}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
