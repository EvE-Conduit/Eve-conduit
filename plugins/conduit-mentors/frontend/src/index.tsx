import { api, Badge, Button, definePlugin, Skeleton } from "@conduit/sdk";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";

import { HomePage } from "./home";
import { MentorshipPage } from "./mentorship";
import { ProgramPage } from "./program";
import { GoalProgress } from "./shared";
import { BASE, STATUS, type Widget } from "./types";

/** Mentees see their mentor and goals, mentors their load, and new members an invitation. */
function MentoringWidget() {
  const { data, isLoading } = useQuery({ queryKey: ["mentors", "widget"], queryFn: () => api.get<Widget>(`${BASE}/widget`), refetchInterval: 120_000 });
  if (isLoading) return <Skeleton className="h-16" />;
  if (!data) return null;
  if (data.mine) {
    const m = data.mine;
    return (
      <Link to={`/p/mentors/m/${m.id}`} className="block space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xs text-muted">{m.mentor ? "Your mentor" : "Mentoring"}</div>
            <div className="truncate text-lg font-semibold">{m.mentor?.name ?? "Waiting for a mentor"}</div>
          </div>
          <Badge tone={STATUS[m.status].tone}>{STATUS[m.status].label}</Badge>
        </div>
        {m.progress && <GoalProgress {...m.progress} />}
      </Link>
    );
  }
  if (data.is_mentor) {
    return (
      <Link to="/p/mentors" className="block">
        <div className="flex items-end justify-between gap-6">
          <div>
            <div className="text-xs text-muted">Your mentees</div>
            <div className="mt-1 font-mono text-3xl font-semibold tabular-nums">
              {data.mentees}
              <span className="text-base text-subtle"> / {data.capacity}</span>
            </div>
          </div>
          {data.waiting ? <Badge tone="info">{data.waiting} waiting</Badge> : <Badge tone="success">Nobody waiting</Badge>}
        </div>
      </Link>
    );
  }
  if (data.suggested) {
    return (
      <div className="space-y-3">
        <div>
          <div className="font-medium">New here? Get a mentor</div>
          <p className="text-sm text-muted">An experienced member helps you find your feet: ships, fleets, ISK and who's who.</p>
        </div>
        <Link to="/p/mentors"><Button variant="primary" size="sm">Ask for a mentor</Button></Link>
      </div>
    );
  }
  return (
    <Link to="/p/mentors" className="block text-sm text-muted hover:text-text">
      Mentors help new members find their feet. Open Mentoring to ask for one.
    </Link>
  );
}

export default definePlugin({
  routes: [
    { path: "", Component: HomePage },
    { path: "program", Component: ProgramPage },
    { path: "m/:id", Component: MentorshipPage },
  ],
  widgets: [{ id: "mentoring", title: "Mentoring", Component: MentoringWidget, size: "sm", order: 40 }],
});
