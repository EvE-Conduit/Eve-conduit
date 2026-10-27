// The registry: one member's characters (those the viewer may read).
import { api, Avatar, PageHeader, Skeleton } from "@conduit/sdk";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router";

import { BackLink, CharacterCard } from "./shared";
import { BASE, type MemberDetail } from "./types";

export function MemberPage() {
  const { id } = useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ["capitals", "member", id],
    queryFn: () => api.get<MemberDetail>(`${BASE}/registry/members/${id}`),
  });
  return (
    <>
      <BackLink to="/p/capitals/registry?tab=members">Registry</BackLink>
      {error ? (
        <p className="text-sm text-muted">{(error as Error).message}</p>
      ) : isLoading || !data ? (
        <Skeleton className="h-64" />
      ) : (
        <>
          <PageHeader
            eyebrow="Capital Registry"
            title={data.member.name}
            icon={<Avatar src={data.member.portrait} name={data.member.name} size="sm" />}
            description={`${data.characters.length} character${data.characters.length === 1 ? "" : "s"} you may view.`}
          />
          <div className="grid gap-6 xl:grid-cols-2">
            {data.characters.map((c) => <CharacterCard key={c.id} c={c} hulls={data.hulls} classes={data.classes} />)}
          </div>
        </>
      )}
    </>
  );
}
