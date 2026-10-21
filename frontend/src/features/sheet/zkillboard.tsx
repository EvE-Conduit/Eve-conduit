import { ExternalLink, Trophy } from "lucide-react";

import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { DescriptionList } from "@/components/ui/page";
import { Skeleton } from "@/components/ui/skeleton";
import { isk, num } from "@/lib/format";

import { TypeIcon } from "./components";
import type { EveType } from "./types";

/** zKillboard's all-time stats, from `.../killmails/zkillboard` on a character or corporation. */
export interface ZkillStats {
  available: boolean;
  url: string;
  kills?: number;
  losses?: number;
  solo_kills?: number;
  isk_destroyed?: number;
  isk_lost?: number;
  efficiency?: number | null;
  danger_ratio?: number;
  gang_ratio?: number;
  recent_kills?: number;
  top_ships?: { ship: EveType; kills: number }[];
}

/** The whole history from zKillboard, next to our own killmails (which only go back as far as ESI does). */
export function ZkillboardCard({ data, isLoading }: { data?: ZkillStats; isLoading: boolean }) {
  const link = data && (
    <a href={data.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-subtle hover:text-accent-ink">
      Open on zKillboard <ExternalLink className="size-3.5" />
    </a>
  );
  return (
    <Card>
      <CardHeader title="All time on zKillboard" icon={<Trophy />} actions={link} />
      <CardBody>
        {isLoading ? (
          <Skeleton className="h-24 rounded-lg" />
        ) : !data?.available ? (
          <p className="text-sm text-muted">zKillboard has no kills or losses for them, or didn't answer just now.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <DescriptionList
              items={[
                { label: "Kills / losses", value: `${num(data.kills)} / ${num(data.losses)}` },
                { label: "Solo kills", value: num(data.solo_kills) },
                { label: "ISK destroyed", value: isk(data.isk_destroyed) },
                { label: "ISK lost", value: isk(data.isk_lost) },
                { label: "Efficiency", value: data.efficiency != null ? `${data.efficiency}%` : "—" },
                { label: "Danger / gang", value: `${data.danger_ratio ?? 0}% dangerous · ${data.gang_ratio ?? 0}% in gangs` },
                { label: "Last 7 days", value: `${num(data.recent_kills)} kills` },
              ]}
            />
            {!!data.top_ships?.length && (
              <div>
                <div className="hud-label mb-2 text-subtle">Most kills in</div>
                <ul className="space-y-2">
                  {data.top_ships.map((s) => (
                    <li key={s.ship.id} className="flex items-center gap-2.5 text-sm">
                      <TypeIcon type={s.ship} size={24} />
                      <span className="min-w-0 flex-1 truncate">{s.ship.name}</span>
                      <span className="font-mono text-xs text-muted tabular-nums">{num(s.kills)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
