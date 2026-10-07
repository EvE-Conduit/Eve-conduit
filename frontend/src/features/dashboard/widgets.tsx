import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";

import { AreaChart } from "@/components/AreaChart";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { clock, duration, isk, ROMAN, sp } from "@/lib/format";
import { useNotifications } from "@/lib/notifications";

import { Progress } from "@/components/ui/feedback";

import { LevelPips, type QueueEntry } from "../skills/SkillsTab";
import type { WalletSummary } from "../wallet/WalletView";

export function NetWorthWidget() {
  const { data, isLoading } = useQuery({ queryKey: ["/api/me", "wallet"], queryFn: () => api.get<WalletSummary>("/api/me/wallet") });
  if (isLoading) return <Skeleton className="h-28" />;
  if (!data?.synced) return <p className="text-sm text-muted">Wallets appear once your characters have synced.</p>;
  const change = data.balance - (data.series[0]?.balance ?? data.balance);
  return (
    <Link to="/wallet" className="block">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="font-mono text-3xl font-semibold tabular-nums">{isk(data.balance).replace(" ISK", "")}</div>
          <div className="text-xs text-subtle">ISK across {data.characters.length} character{data.characters.length === 1 ? "" : "s"}</div>
        </div>
        <div className={`font-mono text-sm tabular-nums ${change >= 0 ? "text-success" : "text-danger-fg"}`}>{isk(change, { sign: true }).replace(" ISK", "")} <span className="text-subtle">30d</span></div>
      </div>
      <AreaChart data={data.series.map((p) => ({ date: p.date, value: p.balance }))} format={(n) => isk(n)} height={64} compact className="mt-4" label="Total balance" />
    </Link>
  );
}

interface QueueRow {
  character: { id: number; name: string; portrait: string };
  total_sp: number | null;
  training: QueueEntry | null;
  queue_length: number;
  queue_ends: string | null;
  synced: boolean;
}

export function SkillTrainingWidget() {
  const { data, isLoading } = useQuery({ queryKey: ["me", "skillqueues"], queryFn: () => api.get<QueueRow[]>("/api/me/skillqueues"), refetchInterval: 60_000 });
  if (isLoading) return <Skeleton className="h-28" />;
  const rows = (data ?? []).filter((r) => r.synced);
  if (!rows.length) return <p className="text-sm text-muted">Skill queues appear once your characters have synced.</p>;
  return (
    <ul className="-my-1 divide-y divide-border">
      {rows.map((r) => (
        <li key={r.character.id}>
          <Link to={`/characters/${r.character.id}?tab=skills`} className="flex items-center gap-3 py-2.5">
            <Avatar src={r.character.portrait} name={r.character.name} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-sm font-medium">{r.character.name}</span>
                <span className="shrink-0 font-mono text-xs text-subtle">{sp(r.total_sp)}</span>
              </div>
              {r.training ? (
                <>
                  <div className="flex justify-between gap-2 text-xs text-muted">
                    <span className="truncate">
                      {r.training.name} {ROMAN[r.training.level]}
                    </span>
                    <span className="shrink-0 font-mono">{duration(r.training.finish_date)}</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-3">
                    <LevelPips level={r.training.level - 1} training={r.training.level} />
                    <Progress value={r.training.progress ?? 0} size="xs" segments={16} className="flex-1" />
                  </div>
                </>
              ) : (
                <div className="text-xs text-warning-fg">Not training</div>
              )}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

const TAG_TONE: Record<string, string> = {
  danger: "text-danger-fg",
  warning: "text-warning-fg",
  success: "text-success-fg",
  info: "text-accent-ink",
};

/** The comms log: the latest notifications as a timestamped feed, newest first. */
export function CommsWidget() {
  const { data, isLoading } = useNotifications({ limit: 8 });
  if (isLoading) return <Skeleton className="h-48" />;
  if (!data?.items.length) return <p className="text-sm text-muted">Nothing yet. Alerts, group requests and lost logins show up here.</p>;
  return (
    <div className="font-mono text-[13px]">
      {data.items.map((n) => (
        <Link
          key={n.id}
          to={n.link && n.link.startsWith("/") && !n.link.startsWith("//") ? n.link : "/notifications"}
          className="flex gap-3 border-t border-hairline py-2 first:border-t-0 first:pt-0 hover:bg-hover"
        >
          <span className="w-12 shrink-0 text-subtle">{clock(new Date(n.created_at))}</span>
          <span className={`w-16 shrink-0 uppercase ${TAG_TONE[n.level] ?? "text-accent-ink"}`}>{n.category.split(".").pop()}</span>
          <span className={`min-w-0 flex-1 truncate font-sans text-sm ${n.read ? "text-muted" : "text-text"}`}>{n.title}</span>
        </Link>
      ))}
    </div>
  );
}
