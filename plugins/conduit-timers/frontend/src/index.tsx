import { api, Badge, cn, definePlugin, Skeleton } from "@conduit/sdk";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";

import { BoardPage, Countdown } from "./board";
import { useNow } from "./now";
import { BASE, type Board, SIDE } from "./types";

/** The next few timers on the dashboard, counting down. */
function NextTimersWidget() {
  const { data, isLoading } = useQuery({ queryKey: ["timers", "widget"], queryFn: () => api.get<Board>(BASE), refetchInterval: 120_000 });
  const now = useNow();
  if (isLoading) return <Skeleton className="h-24" />;
  if (!data) return null;
  const next = data.upcoming.filter((t) => new Date(t.ends_at).getTime() > now - 3_600_000).slice(0, 4);
  if (next.length === 0) return <p className="text-sm text-subtle">No timers on the board.</p>;
  return (
    <ul className="divide-y divide-border">
      {next.map((t) => (
        <li key={t.id}>
          <Link to={`/p/timers#t${t.id}`} className="flex items-center gap-3 py-2 hover:text-text">
            <span className={cn("h-8 w-0.5 shrink-0", SIDE[t.side].stripe)} aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{t.name}</span>
              <span className="block truncate text-xs text-subtle">
                {t.system.name} · {t.structure_type || "Structure"}
                {t.going && <> · <Badge tone="success" size="xs">Going</Badge></>}
              </span>
            </span>
            <Countdown t={t} now={now} className="text-xs" />
          </Link>
        </li>
      ))}
      {data.upcoming.length > next.length && (
        <li className="pt-2 text-xs text-subtle">
          <Link to="/p/timers" className="hover:text-text">{data.upcoming.length - next.length} more on the board</Link>
        </li>
      )}
    </ul>
  );
}

export default definePlugin({
  routes: [{ path: "", Component: BoardPage }],
  widgets: [{ id: "next", title: "Timers", Component: NextTimersWidget, size: "md", order: 8 }],
});
