import { api, cn, definePlugin, Skeleton } from "@conduit/sdk";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";

import { AnswerBadge, CalendarPage, Countdown } from "./board";
import { useNow } from "./now";
import { eveClock } from "./time";
import { BASE, type Board, KIND_LABEL, KIND_STYLE } from "./types";

/** The next few ops on the dashboard, counting down, with the user's answer. */
function UpcomingOpsWidget() {
  const { data, isLoading } = useQuery({ queryKey: ["ops", "widget"], queryFn: () => api.get<Board>(BASE), refetchInterval: 120_000 });
  const now = useNow();
  if (isLoading) return <Skeleton className="h-24" />;
  if (!data) return null;
  const next = data.upcoming.slice(0, 4);
  if (next.length === 0) return <p className="text-sm text-subtle">No ops scheduled.</p>;
  return (
    <ul className="divide-y divide-border">
      {next.map((op) => (
        <li key={op.id}>
          <Link to={`/p/ops#o${op.id}`} className="flex items-center gap-3 py-2 hover:text-text">
            <span className={cn("h-8 w-0.5 shrink-0", KIND_STYLE[op.kind].stripe)} aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{op.title}</span>
              <span className="block truncate text-xs text-subtle">
                {KIND_LABEL[op.kind]} · {eveClock(op.starts_at)} ET
                {op.my_answer && <> · <AnswerBadge answer={op.my_answer} /></>}
              </span>
            </span>
            <Countdown op={op} now={now} className="text-xs" />
          </Link>
        </li>
      ))}
      {data.upcoming.length > next.length && (
        <li className="pt-2 text-xs text-subtle">
          <Link to="/p/ops" className="hover:text-text">{data.upcoming.length - next.length} more on the calendar</Link>
        </li>
      )}
    </ul>
  );
}

export default definePlugin({
  routes: [{ path: "", Component: CalendarPage }],
  widgets: [{ id: "upcoming", title: "Upcoming ops", Component: UpcomingOpsWidget, size: "md", order: 7 }],
});
