// Pages marked public, for anyone with the link: the list of them and each page, without the members' frame.
import { api, ApiError, Card, EmptyState, PageHeader, Skeleton } from "@conduit/sdk";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router";

import { Book } from "./icons";
import { Article } from "./pages";
import { WikiShell } from "./shell";
import { type Node, type Page, PUBLIC_BASE, PUBLIC_HOME } from "./types";

function usePublicTree() {
  return useQuery({ queryKey: ["wiki", "public", "tree"], queryFn: () => api.get<{ tree: Node[]; count: number }>(`${PUBLIC_BASE}/pages`), staleTime: 60_000 });
}

function usePublicPage(slug: string | undefined) {
  return useQuery({
    queryKey: ["wiki", "public", "page", slug],
    queryFn: () => api.get<Page>(`${PUBLIC_BASE}/pages/${encodeURIComponent(slug!)}`),
    enabled: !!slug,
    retry: (count, err) => !(err instanceof ApiError && err.status === 404) && count < 2,
  });
}

export function PublicList() {
  const { data, isLoading } = usePublicTree();
  const home = usePublicPage(data?.tree.some((n) => n.slug === "home") ? "home" : undefined);
  return (
    <WikiShell current="home" tree={data?.tree} loading={isLoading} linkBase={PUBLIC_HOME}>
      {isLoading || !data ? (
        <Skeleton className="h-64" />
      ) : home.data ? (
        <Article page={home.data} linkBase={PUBLIC_HOME} readOnly />
      ) : (
        <>
          <PageHeader eyebrow="Wiki" title="Wiki" icon={<Book />} description="Pages shared with everyone." />
          {data.count === 0 && <Card><EmptyState icon={<Book />} title="Nothing public yet" /></Card>}
        </>
      )}
    </WikiShell>
  );
}

export function PublicPage() {
  const { slug } = useParams();
  const tree = usePublicTree();
  const { data, isLoading, error } = usePublicPage(slug);
  const missing = error instanceof ApiError && error.status === 404;
  return (
    <WikiShell current={slug ?? null} tree={tree.data?.tree} loading={tree.isLoading} linkBase={PUBLIC_HOME}>
      {isLoading ? (
        <Skeleton className="h-64" />
      ) : missing || !data ? (
        <Card><EmptyState icon={<Book />} title="No such page" description="There's no public page at this address. Members may find it after signing in." /></Card>
      ) : (
        <Article page={data} linkBase={PUBLIC_HOME} readOnly />
      )}
    </WikiShell>
  );
}
