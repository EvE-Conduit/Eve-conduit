// A member's own requests: where each one is, and cancelling one nobody has delivered yet.
import { api, Button, Card, date, EmptyState, PageHeader, Skeleton, Table, Td, Th, THead, timeAgo, toast, Tr } from "@conduit/sdk";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "react-router";

import { FileText } from "./icons";
import { Asked, BackLink, BlueprintIcon, errorToast, JobText, StatusBadge, useInvalidate } from "./shared";
import { BASE, type BlueprintRequest } from "./types";

const ACTIVE = ["open", "accepted", "in_progress"];

export function MyRequestsPage() {
  const invalidate = useInvalidate();
  const { data, isLoading } = useQuery({ queryKey: ["blueprints", "mine"], queryFn: () => api.get<BlueprintRequest[]>(`${BASE}/requests`) });
  const cancel = useMutation({
    mutationFn: (r: BlueprintRequest) => api.post(`${BASE}/requests/${r.id}/cancel`),
    onSuccess: () => { toast.success("Cancelled"); invalidate(); },
    onError: errorToast,
  });
  return (
    <>
      <BackLink to="/p/blueprints">Library</BackLink>
      <PageHeader eyebrow="Industry" title="My requests" icon={<FileText />} description="Copies and loans you asked for. You're told each time a manager moves one on." />
      <Card>
        {isLoading || !data ? (
          <div className="p-card"><Skeleton className="h-40" /></div>
        ) : data.length === 0 ? (
          <EmptyState icon={<FileText />} title="No requests yet" description={<>Open a blueprint in the <Link to="/p/blueprints" className="text-accent-ink hover:underline">library</Link> to ask for copies.</>} />
        ) : (
          <Table>
            <THead>
              <tr>
                <Th>Blueprint</Th>
                <Th>Asked for</Th>
                <Th>Status</Th>
                <Th>From the library</Th>
                <Th align="right">Asked</Th>
                <Th align="right" />
              </tr>
            </THead>
            <tbody>
              {data.map((r) => (
                <Tr key={r.id}>
                  <Td>
                    <div className="flex items-center gap-2">
                      <BlueprintIcon src={r.icon} name={r.name} />
                      <div>
                        <div className="font-medium">{r.name}</div>
                        {r.project && <div className="text-xs text-muted">For <Link to={`/p/projects/${r.project.id}`} className="hover:text-accent-ink">{r.project.name}</Link></div>}
                      </div>
                    </div>
                  </Td>
                  <Td><Asked r={r} />{r.note && <div className="text-xs italic text-muted">“{r.note}”</div>}</Td>
                  <Td>
                    <StatusBadge r={r} />
                    {r.due_at && r.status === "delivered" && <div className="text-xs text-muted">due back {date(r.due_at)}</div>}
                  </Td>
                  <Td>
                    {r.handled_by && <div className="text-sm">{r.handled_by.name}</div>}
                    {r.response && <div className="text-xs italic text-muted">“{r.response}”</div>}
                    <JobText job={r.job} />
                  </Td>
                  <Td align="right" className="text-xs text-muted">{timeAgo(r.created_at)}</Td>
                  <Td align="right">
                    {ACTIVE.includes(r.status) && (
                      <Button size="xs" variant="ghost" loading={cancel.isPending && cancel.variables?.id === r.id} onClick={() => cancel.mutate(r)}>Cancel</Button>
                    )}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
