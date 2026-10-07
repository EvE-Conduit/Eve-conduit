// Doctrines overview: a card per doctrine with its ships and how many of its fits I can fly.
import { api, Badge, Button, Card, EmptyState, PageHeader, Skeleton } from "@conduit/sdk";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router";

import { DoctrineDialog } from "./edit";
import { List, Plus, Swords } from "./icons";
import { BASE, type Overview } from "./types";

export function useOverview() {
  return useQuery({ queryKey: ["doctrines", "overview"], queryFn: () => api.get<Overview>(BASE) });
}

export function HomePage() {
  const { data, isLoading } = useOverview();
  const [creating, setCreating] = useState(false);

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Doctrines"
        icon={<Swords />}
        description="The ships and fits we fly. Open a fit to see it like the in-game fitting window, copy it into the game, and see which of your characters can fly it."
        actions={
          data?.can_manage && (
            <div className="flex flex-wrap gap-2">
              <Link to="/p/doctrines/fits"><Button variant="ghost"><List /> All fits</Button></Link>
              <Button variant="primary" onClick={() => setCreating(true)}><Plus /> New doctrine</Button>
            </div>
          )
        }
      />

      {isLoading || !data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-56" />)}</div>
      ) : data.doctrines.length === 0 ? (
        <Card>
          <EmptyState icon={<Swords />} title="No doctrines yet"
            description={data.can_manage ? "Create one with New doctrine, then add fits by pasting them from the game." : "Your FCs haven't added any doctrines yet."} />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.doctrines.map((d) => (
            <Link key={d.id} to={`/p/doctrines/${d.id}`} className="block">
              <Card interactive className={d.active ? "h-full overflow-hidden" : "h-full overflow-hidden opacity-60"}>
                <div className="relative h-36 overflow-hidden bg-surface-2">
                  {d.render && <img src={d.render} alt="" className="absolute inset-0 size-full object-cover opacity-90" loading="lazy" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/30 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-2">
                    <div className="text-lg font-semibold">{d.name}</div>
                    {!d.active && <Badge size="xs">Retired</Badge>}
                  </div>
                </div>
                <div className="space-y-3 p-card">
                  {d.description && <p className="line-clamp-2 text-sm text-muted">{d.description}</p>}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex -space-x-1.5">
                      {d.ships.map((s) => (
                        <img key={s.id} src={s.icon} alt={s.name} title={s.name} className="size-8 rounded-full bg-surface-3 ring-2 ring-surface" loading="lazy" />
                      ))}
                    </div>
                    <Badge tone={d.fits && d.flyable === d.fits ? "success" : d.flyable ? "accent" : "neutral"} size="xs">
                      You fly {d.flyable} of {d.fits}
                    </Badge>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {creating && data && <DoctrineDialog onClose={() => setCreating(false)} />}
    </>
  );
}
