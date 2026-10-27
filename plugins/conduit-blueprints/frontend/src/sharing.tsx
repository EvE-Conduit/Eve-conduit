// Members choose which of their characters' originals show in the library. Copies always stay private.
import { api, Avatar, Card, CardHeader, EmptyState, PageHeader, Skeleton, Switch, toast } from "@conduit/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Briefcase } from "./icons";
import { BackLink, errorToast } from "./shared";
import { BASE } from "./types";

interface MyCharacter {
  id: number;
  name: string;
  portrait: string;
  shared: boolean;
  originals: number;
  copies: number;
}

export function SharingPage() {
  const qc = useQueryClient();
  const key = ["blueprints", "sharing"];
  const { data, isLoading } = useQuery({ queryKey: key, queryFn: () => api.get<MyCharacter[]>(`${BASE}/sharing`) });
  const save = useMutation({
    mutationFn: ({ id, shared }: { id: number; shared: boolean }) => api.put<MyCharacter[]>(`${BASE}/sharing/${id}`, { shared }),
    onSuccess: (rows, v) => {
      qc.setQueryData(key, rows);
      qc.invalidateQueries({ queryKey: ["blueprints", "library"] });
      toast.success(v.shared ? "Its originals are in the library now" : "Taken out of the library");
    },
    onError: errorToast,
  });
  return (
    <>
      <BackLink to="/p/blueprints">Library</BackLink>
      <PageHeader
        eyebrow="Industry"
        title="Share my blueprints"
        icon={<Briefcase />}
        description="Put a character's blueprint originals in the library, labelled as yours, so members can ask for copies. Copies stay private. Nothing leaves your hangar unless you hand it over."
      />
      <Card>
        <CardHeader title="Your characters" description="Blueprints come from each character's sheet, read every hour." />
        {isLoading || !data ? (
          <div className="p-card"><Skeleton className="h-32" /></div>
        ) : data.length === 0 ? (
          <EmptyState icon={<Briefcase />} title="No characters" />
        ) : (
          <ul className="divide-y divide-border">
            {data.map((c) => (
              <li key={c.id} className="flex items-center gap-3 px-card py-3">
                <Avatar src={c.portrait} name={c.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-muted">{c.originals} original{c.originals === 1 ? "" : "s"} · {c.copies} cop{c.copies === 1 ? "y" : "ies"}</div>
                </div>
                <Switch
                  checked={c.shared}
                  disabled={save.isPending}
                  onCheckedChange={(shared) => save.mutate({ id: c.id, shared })}
                  aria-label={`Share ${c.name}'s originals`}
                />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
