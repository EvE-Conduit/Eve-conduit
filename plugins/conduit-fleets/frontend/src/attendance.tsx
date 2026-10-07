// Attendance per member (fleets.manage_fleets), and the fleet types.
import {
  api, Avatar, Badge, Button, Card, CardHeader, EmptyState, Input, PageHeader, Segmented, Select, Skeleton, Table, TableToolbar, Td, Th,
  THead, timeAgo, toast, Tr,
} from "@conduit/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router";

import { useOverview } from "./home";
import { ArrowLeft, Chart, Download, Plus, Trash } from "./icons";
import { BASE } from "./types";

interface Row {
  key: string;
  user_id: number | null;
  registered: boolean;
  name: string;
  portrait: string;
  fleets: number;
  characters: string[];
  last: string;
}

type Days = "30" | "90" | "365";

export function AttendancePage() {
  const [days, setDays] = useState<Days>("30");
  const [type, setType] = useState("");
  const { data: overview } = useOverview();
  const { data, isLoading } = useQuery({
    queryKey: ["fleets", "stats", days, type],
    queryFn: () => api.get<{ members: Row[] }>(`${BASE}/stats/members?days=${days}${type ? `&type=${type}` : ""}`),
    placeholderData: (prev) => prev,
  });
  const max = Math.max(1, ...(data?.members ?? []).map((m) => m.fleets));
  return (
    <>
      <PageHeader
        eyebrow={<Link to="/p/fleets" className="inline-flex items-center gap-1 hover:text-text"><ArrowLeft className="size-3" /> Fleets</Link>}
        title="Attendance"
        icon={<Chart />}
        description="Fleets each member flew in, with any of their characters. Use the Fleet attendance rule on a group to require it."
        actions={<a href={`${BASE}/stats/members.csv?days=${days}${type ? `&type=${type}` : ""}`} download><Button variant="ghost"><Download /> CSV</Button></a>}
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <Card>
          <TableToolbar>
            <Segmented<Days> value={days} onChange={setDays} size="sm" options={[{ value: "30", label: "30 days" }, { value: "90", label: "90 days" }, { value: "365", label: "1 year" }]} />
            <Select value={type} onChange={(e) => setType(e.target.value)} className="w-44" aria-label="Fleet type">
              <option value="">All types</option>
              {(overview?.types ?? []).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </Select>
          </TableToolbar>
          {isLoading || !data ? (
            <Skeleton className="m-card h-40" />
          ) : data.members.length === 0 ? (
            <EmptyState icon={<Chart />} title="No FATs in this period" />
          ) : (
            <Table>
              <THead>
                <tr>
                  <Th>Member</Th>
                  <Th>Fleets</Th>
                  <Th>Last fleet</Th>
                </tr>
              </THead>
              <tbody>
                {data.members.map((m) => (
                  <Tr key={m.key}>
                    <Td>
                      <div className="flex items-center gap-3">
                        <Avatar src={m.portrait} name={m.name} size="sm" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 font-medium">{m.name}{!m.registered && <Badge tone="warning" size="xs">not registered</Badge>}</div>
                          <div className="truncate text-xs text-subtle">{m.characters.join(", ")}</div>
                        </div>
                      </div>
                    </Td>
                    <Td className="w-1/3">
                      <div className="flex items-center gap-3">
                        <div className="h-1.5 flex-1 bg-hover"><div className="h-full bg-accent" style={{ width: `${(m.fleets / max) * 100}%` }} /></div>
                        <span className="w-8 text-right font-mono tabular-nums">{m.fleets}</span>
                      </div>
                    </Td>
                    <Td className="whitespace-nowrap text-sm text-muted">{timeAgo(m.last)}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
        <FleetTypes />
      </div>
    </>
  );
}

function FleetTypes() {
  const qc = useQueryClient();
  const { data } = useOverview();
  const [name, setName] = useState("");
  const [color, setColor] = useState("#38bdf8");
  const refresh = () => qc.invalidateQueries({ queryKey: ["fleets"] });
  const add = useMutation({
    mutationFn: () => api.post(`${BASE}/types`, { name, color }),
    onSuccess: () => { setName(""); refresh(); toast.success("Fleet type added"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({ mutationFn: (id: number) => api.delete(`${BASE}/types/${id}`), onSuccess: refresh, onError: (e: Error) => toast.error(e.message) });
  return (
    <Card className="h-fit">
      <CardHeader title="Fleet types" description="FCs pick one per fleet; the FAT rule can count only some." />
      <ul className="divide-y divide-border">
        {(data?.types ?? []).map((t) => (
          <li key={t.id} className="flex items-center gap-2.5 px-card py-2 text-sm">
            <span className="size-2.5 rotate-45" style={{ background: t.color }} />
            <span className="flex-1">{t.name}</span>
            <Button variant="ghost" size="icon-xs" aria-label={`Remove ${t.name}`} onClick={() => remove.mutate(t.id)}><Trash /></Button>
          </li>
        ))}
      </ul>
      <div className="flex gap-2 border-t border-border p-card">
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-9 w-10 cursor-pointer border border-border bg-transparent" aria-label="Colour" />
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="New type, e.g. Capital op" />
        <Button size="icon" disabled={!name.trim()} loading={add.isPending} onClick={() => add.mutate()} aria-label="Add fleet type"><Plus /></Button>
      </div>
    </Card>
  );
}
