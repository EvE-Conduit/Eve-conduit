import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Building2, CheckCircle2, Fuel, Users } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/feedback";
import { EmptyState, PageHeader } from "@/components/ui/page";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { num } from "@/lib/format";
import { cn, timeAgo } from "@/lib/utils";

import type { CorpListItem } from "@/features/corp/types";

export function Corporations() {
  const { data, isLoading } = useQuery({ queryKey: ["corporations"], queryFn: () => api.get<CorpListItem[]>("/api/corporations") });
  return (
    <>
      <PageHeader
        eyebrow="Leadership"
        title="Corporations"
        description="Corporation sheets, kept in sync from ESI by registered members with the right in-game roles."
      />
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-52 rounded-xl" />)}</div>
      ) : !data?.length ? (
        <Card>
          <EmptyState icon={<Building2 />} title="No corporations to show" description="You can see corporations once you have a corporation permission and a member has registered." />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.map((c, i) => (
            <CorpCard key={c.id} corp={c} delay={i * 30} />
          ))}
        </div>
      )}
    </>
  );
}

function CorpCard({ corp, delay }: { corp: CorpListItem; delay: number }) {
  const members = corp.known_members ?? corp.member_count ?? 0;
  const coverage = members ? Math.min(1, corp.registered_characters / members) : 0;
  const problems = corp.health.error + corp.health.no_character;
  return (
    <Link to={`/corporations/${corp.id}`} className="group block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-accent/50">
      <Card interactive className="relative h-full overflow-hidden animate-fade-up" style={{ animationDelay: `${delay}ms` }}>
        <img src={corp.logo.replace("size=64", "size=256")} alt="" className="pointer-events-none absolute -right-8 -top-8 size-40 opacity-[0.06] transition-opacity group-hover:opacity-10" />
        <div className="relative p-card">
          <div className="flex items-center gap-3">
            <img src={corp.logo.replace("size=64", "size=128")} alt="" className="size-14 rounded-xl ring-1 ring-border" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="truncate font-semibold text-text">{corp.name}</h3>
                {corp.is_mine && <Badge tone="accent" size="xs">Yours</Badge>}
              </div>
              <div className="font-mono text-xs text-muted">[{corp.ticker}]</div>
              {corp.alliance && (
                <div className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted">
                  <img src={corp.alliance.logo} alt="" className="size-3.5 rounded-sm" /> {corp.alliance.name}
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3 text-center">
            <Figure label="Members" value={num(corp.member_count)} icon={<Users />} />
            <Figure label="Users" value={num(corp.registered_users)} />
            <Figure label="Structures" value={num(corp.structures)} warn={corp.low_fuel > 0} icon={corp.low_fuel ? <Fuel /> : undefined} />
          </div>

          <div className="mt-5">
            <div className="mb-1.5 flex justify-between text-xs">
              <span className="text-muted">Registered characters</span>
              <span className="font-mono tabular-nums text-text">{members ? `${Math.round(coverage * 100)}%` : num(corp.registered_characters)}</span>
            </div>
            <Progress value={coverage} tone="auto" size="sm" label="Registered characters" />
          </div>

          <div className="mt-4 flex items-center gap-2 border-t border-border pt-3 text-xs">
            {problems ? (
              <span className="inline-flex items-center gap-1.5 text-warning-fg">
                <AlertTriangle className="size-3.5" /> {problems} section{problems === 1 ? "" : "s"} can't sync
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-success-fg">
                <CheckCircle2 className="size-3.5" /> {corp.health.ok ? "All sections syncing" : "Waiting for first sync"}
              </span>
            )}
            <span className="ml-auto text-subtle">Updated {timeAgo(corp.health.last_success)}</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

function Figure({ label, value, warn, icon }: { label: string; value: string; warn?: boolean; icon?: ReactNode }) {
  return (
    <div className={cn("rounded-lg bg-surface-2 px-2 py-2.5 ring-1 ring-inset ring-border", warn && "bg-danger-soft ring-danger/30")}>
      <div className={cn("flex items-center justify-center gap-1 font-mono text-lg font-semibold tabular-nums text-text [&_svg]:size-3.5", warn && "text-danger-fg")}>
        {icon}
        {value}
      </div>
      <div className="text-[11px] text-muted">{label}</div>
    </div>
  );
}
