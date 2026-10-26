// The board: open projects first, with their progress. Managers start new ones here.
import { api, Badge, Button, Card, date, EmptyState, PageHeader, Segmented, Skeleton } from "@conduit/sdk";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate } from "react-router";

import { ProjectEditor } from "./editor";
import { Factory, Plus } from "./icons";
import { ProjectBadge, ProjectProgress } from "./shared";
import { BASE, type ProjectSummary } from "./types";

interface ListOut {
  projects: ProjectSummary[];
  can_manage: boolean;
}

export function ProjectsPage() {
  const navigate = useNavigate();
  const [show, setShow] = useState<"open" | "closed">("open");
  const [creating, setCreating] = useState(false);
  const { data, isLoading } = useQuery({ queryKey: ["projects", "list", show], queryFn: () => api.get<ListOut>(`${BASE}/projects?show=${show}`) });
  return (
    <>
      <PageHeader
        eyebrow="Industry"
        title="Projects"
        icon={<Factory />}
        description="What the corporation is building. Claim a part, build it, deliver it and mark it delivered."
        actions={data?.can_manage ? <Button variant="primary" onClick={() => setCreating(true)}><Plus /> New project</Button> : undefined}
      />
      <Segmented<"open" | "closed">
        className="mb-4"
        value={show}
        onChange={setShow}
        aria-label="Which projects"
        options={[{ value: "open", label: "Open" }, { value: "closed", label: "Finished" }]}
      />
      {isLoading || !data ? (
        <Skeleton className="h-48" />
      ) : data.projects.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Factory />}
            title={show === "open" ? "Nothing to build right now" : "No finished projects yet"}
            description={show === "open" ? (data.can_manage ? "Start a project and add what it needs." : "New projects show up here.") : undefined}
          />
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {data.projects.map((p) => (
            <Card key={p.id} interactive>
              <Link to={`/p/projects/${p.id}`} className="block space-y-3 p-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{p.name}</div>
                    <div className="truncate text-xs text-muted">
                      {[p.location, p.deadline ? `due ${date(p.deadline)}` : null].filter(Boolean).join(" · ") || "No deadline"}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {p.my_open_claims && <Badge tone="info">You're building</Badge>}
                    <ProjectBadge status={p.status} />
                  </div>
                </div>
                {p.description && <p className="line-clamp-2 text-sm text-muted">{p.description}</p>}
                <ProjectProgress progress={p.progress} />
              </Link>
            </Card>
          ))}
        </div>
      )}
      {creating && <ProjectEditor project={null} onClose={() => setCreating(false)} onSaved={(p) => navigate(`/p/projects/${p.id}`)} />}
    </>
  );
}

export function ProjectsWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ["projects", "list", "open"],
    queryFn: () => api.get<ListOut>(`${BASE}/projects?show=open`),
    refetchInterval: 300_000,
  });
  if (isLoading || !data) return <Skeleton className="h-24" />;
  if (data.projects.length === 0) return <p className="text-sm text-muted">Nothing to build right now.</p>;
  return (
    <ul className="space-y-3">
      {data.projects.slice(0, 4).map((p) => (
        <li key={p.id}>
          <Link to={`/p/projects/${p.id}`} className="block hover:text-accent-ink">
            <div className="mb-1 truncate text-sm font-medium">{p.name}</div>
            <ProjectProgress progress={p.progress} />
          </Link>
        </li>
      ))}
      {data.projects.length > 4 && (
        <li className="text-xs text-muted">
          <Link to="/p/projects" className="hover:text-text">and {data.projects.length - 4} more</Link>
        </li>
      )}
    </ul>
  );
}
