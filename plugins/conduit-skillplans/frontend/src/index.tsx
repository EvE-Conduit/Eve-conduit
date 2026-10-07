import { api, Badge, definePlugin, Progress, Skeleton } from "@conduit/sdk";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";

import { EditorPage } from "./editor";
import { HomePage } from "./home";
import { MembersPage } from "./members";
import { PlanPage } from "./plan";
import { BASE, type PlanBrief, trainTime } from "./types";

/** The shared plan I'm closest to finishing, on the dashboard. */
function NextPlanWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ["skillplans", "me"],
    queryFn: () => api.get<{ plans: number; complete: number; next: PlanBrief | null }>(`${BASE}/me`),
  });
  if (isLoading) return <Skeleton className="h-16" />;
  if (!data) return null;
  const next = data.next;
  return (
    <Link to={next ? `/p/skillplans/${next.id}` : "/p/skillplans"} className="block space-y-2">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs text-muted">{next ? "Closest to done" : "Shared skill plans"}</div>
          <div className="truncate font-medium">{next ? next.name : data.plans ? "All finished" : "None shared yet"}</div>
          {next?.me && <div className="truncate text-xs text-subtle">{next.me.character} · {trainTime(next.me.seconds_left)} left</div>}
        </div>
        <Badge tone="accent">{data.complete}/{data.plans} done</Badge>
      </div>
      {next?.me && <Progress value={next.me.percent} size="xs" />}
    </Link>
  );
}

export default definePlugin({
  routes: [
    { path: "", Component: HomePage },
    { path: "new", Component: EditorPage },
    { path: ":id", Component: PlanPage },
    { path: ":id/edit", Component: EditorPage },
    { path: ":id/members", Component: MembersPage },
  ],
  widgets: [{ id: "next-plan", title: "Skill plans", Component: NextPlanWidget, size: "sm", order: 40 }],
});
