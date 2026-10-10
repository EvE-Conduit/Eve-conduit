// The FAT link page: a pilot picks the characters they flew with.
import { Alert, api, Avatar, Button, Card, CardBody, EmptyState, PageHeader, Skeleton, timeAgo, toast } from "@conduit/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useParams } from "react-router";

import { TypeBadge } from "./home";
import { Check, Rocket } from "./icons";
import { BASE, type FleetBrief } from "./types";

interface LinkInfo extends FleetBrief {
  notes: string;
  open: boolean;
  tracked: boolean;
  round: number;
  characters: { id: number; name: string; portrait: string; registered: boolean; allowed: boolean }[];
}

export function FatPage() {
  const { code } = useParams();
  const qc = useQueryClient();
  const key = ["fleets", "link", code];
  const { data, isLoading, error } = useQuery({ queryKey: key, queryFn: () => api.get<LinkInfo>(`${BASE}/fat/${code}`), retry: false });
  const [picked, setPicked] = useState<Set<number> | null>(null);
  const register = useMutation({
    mutationFn: (ids: number[]) => api.post<{ added: number }>(`${BASE}/fat/${code}`, { characters: ids }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["fleets"] });
      toast.success(r.added ? `FAT registered for ${r.added} character${r.added === 1 ? "" : "s"}. o7` : "Already registered");
      setPicked(new Set());
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (error) return <EmptyState icon={<Rocket />} title="This FAT link doesn't exist" description="Check the link with your FC." />;
  if (isLoading || !data) return <Skeleton className="mx-auto h-80 max-w-xl" />;
  const open = data.characters.filter((c) => !c.registered && c.allowed);
  // The main (first) character is ticked to start with.
  const chosen = picked ?? new Set(open.slice(0, 1).map((c) => c.id));
  const toggle = (id: number) => {
    const n = new Set(chosen);
    if (n.has(id)) n.delete(id); else n.add(id);
    setPicked(n);
  };

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader eyebrow="FAT link" title={<span className="flex flex-wrap items-center gap-3">{data.name} <TypeBadge type={data.type} /></span>}
        icon={<Rocket />} description={`FC ${data.fc?.name ?? "unknown"} · started ${timeAgo(data.started_at)}`} />
      <Card>
        <CardBody className="space-y-4">
          {data.notes && <p className="whitespace-pre-line border-l-2 border-accent/50 pl-3 text-sm text-muted">{data.notes}</p>}
          {!data.open ? (
            <Alert tone="warning" title="This link has closed">Ask the FC to add you if you flew in this fleet.</Alert>
          ) : (
            <>
              {data.tracked && (
                <Alert tone="info" title="This fleet is tracked">
                  Everyone in the in-game fleet gets a FAT by itself within a minute. Characters that weren't in it can't be registered here.
                </Alert>
              )}
              <div className="text-sm font-medium">Which characters flew in this fleet{data.round > 1 ? ` (FAT round ${data.round})` : ""}?</div>
              <ul className="divide-y divide-border border border-border">
                {data.characters.map((c) => (
                  <li key={c.id}>
                    <label className={`flex items-center gap-3 px-3 py-2.5 ${c.registered || !c.allowed ? "opacity-60" : "cursor-pointer hover:bg-hover"}`}>
                      <input type="checkbox" className="size-4 accent-accent" disabled={c.registered || !c.allowed} checked={c.registered || chosen.has(c.id)} onChange={() => toggle(c.id)} />
                      <Avatar src={c.portrait} name={c.name} size="sm" />
                      <span className="flex-1 text-sm">{c.name}</span>
                      {c.registered ? <span className="flex items-center gap-1 text-xs text-success-fg"><Check className="size-3.5" /> FAT</span>
                        : !c.allowed && <span className="text-xs text-subtle">not in the fleet</span>}
                    </label>
                  </li>
                ))}
              </ul>
              <Button variant="primary" className="w-full" disabled={chosen.size === 0 || !open.length} loading={register.isPending} onClick={() => register.mutate([...chosen])}>
                <Check /> Register {chosen.size || ""} FAT{chosen.size === 1 ? "" : "s"}
              </Button>
            </>
          )}
          <Link to="/p/fleets" className="block text-center text-xs text-muted hover:text-text">My fleets</Link>
        </CardBody>
      </Card>
    </div>
  );
}
