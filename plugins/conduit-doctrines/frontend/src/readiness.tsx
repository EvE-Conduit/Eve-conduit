// Who can fly a doctrine (permission doctrines.view_readiness): every member against every fit, with their best
// character for each.
import { api, Avatar, Button, Card, EmptyState, PageHeader, SearchInput, Skeleton, Table, Td, Th, THead, Tooltip, Tr } from "@conduit/sdk";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useParams } from "react-router";

import { Download, Users } from "./icons";
import { StatusBadge } from "./shared";
import { BASE, type Readiness } from "./types";

export function ReadinessPage() {
  const { id } = useParams();
  const [q, setQ] = useState("");
  const [onlyMissing, setOnlyMissing] = useState(false);
  const { data, isLoading, error } = useQuery({ queryKey: ["doctrines", "readiness", id], queryFn: () => api.get<Readiness>(`${BASE}/doctrines/${id}/readiness`) });

  if (error) return <EmptyState icon={<Users />} title={(error as Error).message} />;
  if (isLoading || !data) return <Skeleton className="h-96" />;
  const members = data.members.filter((m) => m.name.toLowerCase().includes(q.trim().toLowerCase()) && (!onlyMissing || m.flyable === 0));

  return (
    <>
      <PageHeader
        eyebrow={<Link to={`/p/doctrines/${data.doctrine.id}`} className="hover:text-text">{data.doctrine.name}</Link>}
        title="Who can fly it"
        icon={<Users />}
        description="Each member's best character for each fit, from their synced skills."
        actions={<a href={`${BASE}/doctrines/${data.doctrine.id}/readiness.csv`}><Button variant="ghost"><Download /> CSV</Button></a>}
      />
      <Card>
        <div className="flex flex-wrap items-center gap-3 p-card pb-0">
          <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Member" className="w-56" />
          <label className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" checked={onlyMissing} onChange={(e) => setOnlyMissing(e.target.checked)} /> Only members who can't fly any
          </label>
        </div>
        {data.fits.length === 0 ? (
          <EmptyState icon={<Users />} title="This doctrine has no fits yet" />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <THead>
                <tr>
                  <Th>Member</Th>
                  {data.fits.map((f) => (
                    <Th key={f.id}>
                      <Link to={`/p/doctrines/fit/${f.id}`} className="flex items-center gap-2 hover:text-text">
                        <img src={f.ship.icon} alt="" className="size-6" />
                        <span className="normal-case tracking-normal">{f.name}</span>
                      </Link>
                      <div className="mt-0.5 text-[10px] normal-case tracking-normal text-subtle">{data.totals[String(f.id)]} can fly</div>
                    </Th>
                  ))}
                </tr>
              </THead>
              <tbody>
                {members.map((m) => (
                  <Tr key={m.id}>
                    <Td><span className="flex items-center gap-2 whitespace-nowrap"><Avatar src={m.portrait} name={m.name} size="xs" /> {m.name}</span></Td>
                    {data.fits.map((f) => {
                      const cell = m.cells[String(f.id)];
                      return (
                        <Td key={f.id}>
                          <Tooltip content={cell ? cell.character ?? "Their best character (you can't open their character sheets)" : "No characters"} disabled={!cell}>
                            <span><StatusBadge status={cell} /></span>
                          </Tooltip>
                        </Td>
                      );
                    })}
                  </Tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Card>
    </>
  );
}
