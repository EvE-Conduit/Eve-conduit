// Managers: deliveries waiting to be checked, oldest first.
import { api, Avatar, Button, Card, EmptyState, num, PageHeader, Segmented, Skeleton, Table, Td, Th, THead, timeAgo, toast, Tr } from "@conduit/sdk";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router";

import { NoteDialog } from "./editor";
import { Boxes, Check } from "./icons";
import { BackLink, ContributionBadge, IndustryHintText } from "./shared";
import { BASE, type ContributionRow } from "./types";

export function QueuePage() {
  const qc = useQueryClient();
  const [show, setShow] = useState<"delivered" | "claimed">("delivered");
  const [rejecting, setRejecting] = useState<ContributionRow | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["projects", "queue", show],
    queryFn: () => api.get<ContributionRow[]>(`${BASE}/queue?status=${show}`),
    refetchInterval: 60_000,
  });
  const confirm = (c: ContributionRow) =>
    api.post(`${BASE}/contributions/${c.id}/confirm`)
      .then(() => { toast.success(`Confirmed ${num(c.quantity)} × ${c.item} from ${c.user.name}`); qc.invalidateQueries({ queryKey: ["projects"] }); })
      .catch((e: Error) => toast.error(e.message));
  return (
    <>
      <BackLink to="/p/projects">Projects</BackLink>
      <PageHeader eyebrow="Industry" title="Deliveries" icon={<Boxes />} description="Check each delivery is where the project says, then confirm it. Confirming pays its Corp Store points." />
      <Segmented<"delivered" | "claimed">
        className="mb-4"
        value={show}
        onChange={setShow}
        aria-label="Which"
        options={[{ value: "delivered", label: "Waiting for you" }, { value: "claimed", label: "Every open claim" }]}
      />
      <Card>
        {isLoading || !data ? (
          <div className="p-card"><Skeleton className="h-40" /></div>
        ) : data.length === 0 ? (
          <EmptyState icon={<Boxes />} title={show === "delivered" ? "Nothing to check" : "No open claims"} description={show === "delivered" ? "Managers are told when someone marks a delivery." : undefined} />
        ) : (
          <Table>
            <THead>
              <tr>
                <Th>Member</Th>
                <Th>Item</Th>
                <Th>Project</Th>
                <Th>Status</Th>
                <Th align="right">When</Th>
                <Th align="right" />
              </tr>
            </THead>
            <tbody>
              {data.map((c) => (
                <Tr key={c.id}>
                  <Td>
                    <div className="flex items-center gap-2">
                      <Avatar src={c.user.portrait} name={c.user.name} size="sm" />
                      <span className="font-medium">{c.user.name}</span>
                    </div>
                  </Td>
                  <Td>
                    <div><span className="font-mono">{num(c.quantity)}</span> × {c.item}</div>
                    <IndustryHintText hint={c.industry} />
                    {c.note && <div className="text-xs italic text-muted">“{c.note}”</div>}
                  </Td>
                  <Td>
                    <Link to={`/p/projects/${c.project.id}`} className="hover:text-accent-ink">{c.project.name}</Link>
                    {c.project.location && <div className="text-xs text-muted">{c.project.location}</div>}
                  </Td>
                  <Td><ContributionBadge status={c.status} /></Td>
                  <Td align="right" className="text-xs text-muted">{timeAgo(c.delivered_at ?? c.created_at)}</Td>
                  <Td align="right">
                    <div className="flex justify-end gap-1.5">
                      <Button size="xs" variant="success" onClick={() => confirm(c)}><Check /> Confirm</Button>
                      {c.status === "delivered" && <Button size="xs" variant="ghost" onClick={() => setRejecting(c)}>Send back</Button>}
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
      {rejecting && (
        <NoteDialog
          title={`Send back ${rejecting.user.name}'s delivery?`}
          description="It becomes a claim again and they're told why."
          label="Why"
          placeholder="Not in the corp hangar"
          confirmLabel="Send back"
          onSubmit={(note) => api.post(`${BASE}/contributions/${rejecting.id}/reject`, { note })}
          onClose={() => setRejecting(null)}
        />
      )}
    </>
  );
}
