import { Brain, ChevronDown, GraduationCap, ListOrdered, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState, StatCard } from "@/components/ui/page";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip } from "@/components/ui/tooltip";
import { dateTime, duration, num, ROMAN, sp } from "@/lib/format";
import { cn } from "@/lib/utils";

import { useSection } from "../sheet/hooks";
import type { CharacterHeader } from "../sheet/types";

export interface QueueEntry {
  position: number;
  skill_id: number;
  name: string;
  level: number;
  start_date: string | null;
  finish_date: string | null;
  progress: number | null;
}

interface Skill {
  id: number;
  name: string;
  level: number;
  trained_level: number;
  skillpoints: number;
  rank: number;
}

interface SkillsData {
  synced: boolean;
  total_sp: number;
  unallocated_sp: number;
  attributes: Record<string, number> | null;
  bonus_remaps: number | null;
  remap_available: string | null;
  skill_count: number;
  levels: number[];
  queue: QueueEntry[];
  queue_ends: string | null;
  groups: { name: string; skillpoints: number; skills: Skill[] }[];
}

export function LevelPips({ level, trained, training }: { level: number; trained?: number; training?: number }) {
  return (
    <span className="inline-flex gap-[3px]" aria-label={`Level ${level}`}>
      {[1, 2, 3, 4, 5].map((l) => (
        <span
          key={l}
          className={cn(
            "h-2.5 w-2.5 ring-1 ring-inset",
            l <= level
              ? "bg-accent ring-accent"
              : l <= (trained ?? 0)
                ? "bg-accent/40 ring-accent/50"
                : l === training
                  ? "animate-pulse bg-accent/25 ring-accent/60"
                  : "bg-transparent ring-border-strong",
          )}
        />
      ))}
    </span>
  );
}

export function SkillsTab({ header }: { header: CharacterHeader }) {
  const { data, isLoading } = useSection<SkillsData>(header.id, "skills");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Set<string>>(new Set());
  const training = useMemo(() => new Map(data?.queue.map((e) => [e.skill_id, e.level]) ?? []), [data]);

  if (isLoading || !data) return <Skeleton className="h-96 rounded-xl" />;
  if (!data.synced) return <Card><EmptyState icon={<Brain />} title="No skill data yet" /></Card>;

  const needle = q.trim().toLowerCase();
  const groups = data.groups
    .map((g) => ({ ...g, skills: needle ? g.skills.filter((s) => s.name.toLowerCase().includes(needle)) : g.skills }))
    .filter((g) => g.skills.length);
  const attrs = data.attributes ? Object.entries(data.attributes) : [];
  const maxAttr = Math.max(...attrs.map(([, v]) => v), 1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total skill points" value={sp(data.total_sp).replace(" SP", "")} mono hint={`${num(data.total_sp)} SP`} />
        <StatCard label="Skills known" value={data.skill_count} hint={`${data.levels[5] ?? 0} at level V`} />
        <StatCard label="Unallocated" value={sp(data.unallocated_sp).replace(" SP", "")} mono hint="SP to assign" />
        <StatCard label="Queue" value={data.queue.length ? duration(data.queue_ends) : "Empty"} mono={!!data.queue.length} hint={data.queue.length ? `${data.queue.length} skills · ends ${dateTime(data.queue_ends)}` : "nothing training"} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Training queue" icon={<ListOrdered />} />
          {data.queue.length === 0 ? (
            <EmptyState icon={<ListOrdered />} title="Nothing in training" description="The skill queue is empty." className="py-10" />
          ) : (
            <ol className="divide-y divide-border">
              {data.queue.map((e, i) => (
                <li key={e.position} className="flex items-center gap-4 px-5 py-3">
                  <span className="w-5 text-right font-mono text-xs text-subtle">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="truncate text-sm font-medium">
                        {e.name} <span className="font-mono text-muted">{ROMAN[e.level]}</span>
                      </span>
                      <span className="shrink-0 font-mono text-xs text-muted">{e.finish_date ? duration(e.finish_date) : "paused"}</span>
                    </div>
                    {i === 0 && e.progress != null ? (
                      <div className="mt-2 h-1.5 overflow-hidden rounded-none bg-surface-3">
                        <div className="h-full bg-accent" style={{ width: `${Math.round(e.progress * 100)}%` }} />
                      </div>
                    ) : (
                      <div className="mt-0.5 text-xs text-subtle">{e.finish_date ? `Finishes ${dateTime(e.finish_date)}` : ""}</div>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Card>

        <Card>
          <CardHeader title="Attributes" icon={<GraduationCap />} description={data.bonus_remaps ? `${data.bonus_remaps} bonus remap${data.bonus_remaps === 1 ? "" : "s"} available` : undefined} />
          <CardBody className="space-y-3">
            {attrs.map(([name, value]) => (
              <div key={name}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="capitalize text-muted">{name}</span>
                  <span className="font-mono tabular-nums">{value}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-none bg-surface-3">
                  <div className="h-full rounded-none bg-accent/80" style={{ width: `${(value / maxAttr) * 100}%` }} />
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="All skills"
          icon={<Brain />}
          actions={
            <div className="relative w-56">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-subtle" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a skill" className="h-8 pl-8 text-xs" />
            </div>
          }
        />
        <div className="divide-y divide-border">
          {groups.map((g) => {
            const expanded = !!needle || open.has(g.name);
            return (
              <div key={g.name}>
                <button
                  className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-hover"
                  onClick={() => setOpen((prev) => {
                    const next = new Set(prev);
                    if (next.has(g.name)) next.delete(g.name);
                    else next.add(g.name);
                    return next;
                  })}
                  aria-expanded={expanded}
                >
                  <ChevronDown className={cn("size-4 text-subtle transition-transform", !expanded && "-rotate-90")} />
                  <span className="flex-1 text-sm font-medium">{g.name}</span>
                  <span className="text-xs text-subtle">{g.skills.length} skills</span>
                  <span className="w-24 text-right font-mono text-xs text-muted">{sp(g.skillpoints)}</span>
                </button>
                {expanded && (
                  <ul className="grid grid-cols-1 gap-x-8 px-5 pb-4 pl-12 sm:grid-cols-2">
                    {g.skills.map((s) => (
                      <li key={s.id} className="flex items-center gap-3 border-b border-border/50 py-2 text-sm last:border-0">
                        <span className="min-w-0 flex-1 truncate">
                          {s.name} <span className="text-xs text-subtle">×{s.rank}</span>
                        </span>
                        <Tooltip content={`${num(s.skillpoints)} SP`}>
                          <span>
                            <LevelPips level={s.level} trained={s.trained_level} training={training.get(s.id)} />
                          </span>
                        </Tooltip>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
