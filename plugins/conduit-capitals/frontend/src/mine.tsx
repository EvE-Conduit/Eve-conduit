// Every member: their own characters' capitals, jump skills and clones, and saying which hulls are available for ops.
import { api, EmptyState, PageHeader, Skeleton } from "@conduit/sdk";
import { useQuery } from "@tanstack/react-query";

import { Anchor } from "./icons";
import { CharacterCard } from "./shared";
import { BASE, type Me } from "./types";

export function MyCapitalsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["capitals", "me"], queryFn: () => api.get<Me>(`${BASE}/me`) });
  return (
    <>
      <PageHeader
        eyebrow="Capital Registry"
        title="My capitals"
        icon={<Anchor />}
        description="The capitals your characters can fly and own, from their synced skills and assets, with jump skills and clones. Mark a hull available for ops so fleet commanders know whom to ask."
      />
      {isLoading || !data ? (
        <Skeleton className="h-64" />
      ) : data.characters.length === 0 ? (
        <EmptyState icon={<Anchor />} title="No characters" />
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          {data.characters.map((c) => <CharacterCard key={c.id} c={c} hulls={data.hulls} classes={data.classes} editable />)}
        </div>
      )}
    </>
  );
}
