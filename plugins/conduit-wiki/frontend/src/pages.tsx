// Reading the wiki: the home page (or a welcome when nobody wrote one yet) and single pages.
import {
  api, ApiError, Avatar, Badge, Button, buttonVariants, Card, cn, ConfirmDialog, dateTime, DropdownContent, DropdownItem, DropdownMenu,
  DropdownSeparator, DropdownTrigger, EmptyState, PageHeader, Skeleton, timeAgo, toast,
} from "@conduit/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

import { Book, ChevronRight, Clock, Dots, Globe, Lock, Pencil, Plus, Trash } from "./icons";
import { Markdown } from "./markdown";
import { PageIcon, Toc, useOverview, WikiShell } from "./shell";
import { BASE, HOME, type Node, type Page } from "./types";

export function usePage(slug: string | undefined) {
  return useQuery({
    queryKey: ["wiki", "page", slug],
    queryFn: () => api.get<Page>(`${BASE}/pages/${encodeURIComponent(slug!)}`),
    enabled: !!slug,
    retry: (count, err) => !(err instanceof ApiError && err.status === 404) && count < 2,
  });
}

export function HomePage() {
  const { data, isLoading } = useOverview();
  return (
    <WikiShell current="home" tree={data?.tree} loading={isLoading} canEdit={data?.can_edit} aside={data?.home ? <Toc body={data.home.body} /> : null}>
      {isLoading || !data ? (
        <Skeleton className="h-64" />
      ) : data.home ? (
        <Article page={data.home} canManage={data.can_manage} />
      ) : (
        <Welcome recent={data.recent} count={data.count} canEdit={data.can_edit} />
      )}
    </WikiShell>
  );
}

function Welcome({ recent, count, canEdit }: { recent: Node[]; count: number; canEdit: boolean }) {
  return (
    <>
      <PageHeader
        eyebrow="Wiki"
        title="Wiki"
        icon={<Book />}
        description="Guides, rules and reference pages written by your corporation."
        actions={canEdit ? <Link to={`${HOME}/new?slug=home&title=Home`} className={buttonVariants({ variant: "primary" })}><Plus /> Write the home page</Link> : undefined}
      />
      {count === 0 ? (
        <Card>
          <EmptyState
            icon={<Book />}
            title="Nothing written yet"
            description={canEdit ? "Start with a home page: what the wiki is for and where to find things. Pages can be nested under each other and linked with [[Page Title]]." : "Nobody has written a page yet. Check back later."}
            action={canEdit ? <Link to={`${HOME}/new?slug=home&title=Home`} className={buttonVariants({ variant: "primary" })}><Plus /> Write the home page</Link> : undefined}
          />
        </Card>
      ) : (
        <Card className="p-card">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-subtle">Recently updated</h2>
          <RecentList pages={recent} />
          {canEdit && <p className="mt-4 text-xs text-subtle">Tip: a page saved at the address <code className="bg-hover px-1">home</code> is shown here instead of this list.</p>}
        </Card>
      )}
    </>
  );
}

export function RecentList({ pages, linkBase = HOME }: { pages: Node[]; linkBase?: string }) {
  if (pages.length === 0) return <p className="text-sm text-subtle">No pages yet.</p>;
  return (
    <ul className="divide-y divide-border">
      {pages.map((p) => (
        <li key={p.id}>
          <Link to={p.slug === "home" ? linkBase : `${linkBase}/${p.slug}`} className="flex items-center gap-3 py-2 text-sm hover:text-text">
            <PageIcon node={p} className="size-4 shrink-0 text-subtle" />
            <span className="min-w-0 flex-1 truncate font-medium">{p.title}</span>
            <span className="shrink-0 text-xs text-subtle">{timeAgo(p.updated_at)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function PageView() {
  const { slug } = useParams();
  const overview = useOverview();
  const { data, isLoading, error } = usePage(slug);
  const missing = error instanceof ApiError && error.status === 404;
  return (
    <WikiShell current={slug ?? null} tree={overview.data?.tree} loading={overview.isLoading} canEdit={overview.data?.can_edit} aside={data ? <Toc body={data.body} /> : null}>
      {isLoading ? (
        <Skeleton className="h-64" />
      ) : missing || !data ? (
        <Card>
          <EmptyState
            icon={<Book />}
            title="No such page"
            description={overview.data?.can_edit ? "There's no page at this address yet. You can write it." : "There's no page at this address, or it isn't meant for you."}
            action={
              <div className="flex gap-2">
                <Link to={HOME} className={buttonVariants({ variant: "secondary" })}>Back to the wiki</Link>
                {overview.data?.can_edit && slug && (
                  <Link to={`${HOME}/new?slug=${encodeURIComponent(slug)}&title=${encodeURIComponent(slug.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()))}`} className={buttonVariants({ variant: "primary" })}>
                    <Plus /> Write this page
                  </Link>
                )}
              </div>
            }
          />
        </Card>
      ) : (
        <Article page={data} canManage={!!overview.data?.can_manage} />
      )}
    </WikiShell>
  );
}

/** A page as readers see it: breadcrumbs, title, who wrote it, the text and its sub-pages. */
export function Article({ page, canManage, linkBase = HOME, readOnly }: { page: Page; canManage?: boolean; linkBase?: string; readOnly?: boolean }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);
  const del = useMutation({
    mutationFn: () => api.delete(`${BASE}/pages/${encodeURIComponent(page.slug)}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wiki"] });
      toast.success("Page deleted");
      navigate(page.breadcrumbs.length ? `${HOME}/${page.breadcrumbs[page.breadcrumbs.length - 1]!.slug}` : HOME);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Links to #headings: scroll there once the text is in.
  useEffect(() => {
    if (window.location.hash) document.getElementById(decodeURIComponent(window.location.hash.slice(1)))?.scrollIntoView({ block: "start" });
  }, [page.slug]);

  const audience = [...(page.states ?? []).map((s) => s.name), ...(page.groups ?? []).map((g) => g.name)];
  const canEdit = !readOnly && !!page.can_edit;
  const href = (slug: string) => (slug === "home" ? linkBase : `${linkBase}/${slug}`);

  return (
    <article className="mx-auto max-w-3xl">
      {(page.breadcrumbs.length > 0 || page.slug !== "home") && (
        <nav aria-label="Breadcrumb" className="mb-3 flex flex-wrap items-center gap-1 text-xs text-subtle">
          <Link to={linkBase} className="hover:text-text">Wiki</Link>
          {page.breadcrumbs.map((b) => (
            <span key={b.slug} className="flex items-center gap-1">
              <ChevronRight className="size-3" />
              <Link to={href(b.slug)} className="hover:text-text">{b.title}</Link>
            </span>
          ))}
        </nav>
      )}
      <header className="mb-6 flex items-start gap-3 border-b border-border pb-5">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5 empty:hidden">
            {page.public && <Badge tone="info"><Globe className="size-3" /> Public</Badge>}
            {page.locked && <Badge><Lock className="size-3" /> Locked</Badge>}
            {canManage && audience.length > 0 && <Badge tone="accent">For {audience.join(", ")}</Badge>}
          </div>
          <h1 className="text-2xl font-semibold leading-tight text-text sm:text-3xl">{page.title}</h1>
          {!readOnly && (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-subtle">
              {page.updated_by && <Avatar src={page.updated_by.portrait ?? undefined} name={page.updated_by.name} size="xs" />}
              <span className="text-muted">{page.updated_by?.name ?? page.created_by?.name ?? "Unknown"}</span>
              <span>·</span>
              <time dateTime={page.updated_at} title={dateTime(page.updated_at)}>{timeAgo(page.updated_at)}</time>
              <span>·</span>
              <Link to={`${HOME}/${page.slug}/history`} className="inline-flex items-center gap-1 hover:text-text"><Clock className="size-3" /> {page.revisions} {page.revisions === 1 ? "revision" : "revisions"}</Link>
            </div>
          )}
        </div>
        {!readOnly && (canEdit || canManage) && (
          <div className="flex shrink-0 items-center gap-2">
            {canEdit && <Link to={`${HOME}/${page.slug}/edit`} className={buttonVariants({ variant: "secondary", size: "sm" })}><Pencil /> Edit</Link>}
            <DropdownMenu>
              <DropdownTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label="More"><Dots /></Button>
              </DropdownTrigger>
              <DropdownContent align="end">
                {canEdit && <DropdownItem onSelect={() => navigate(`${HOME}/new?parent=${page.id}`)}><Plus /> New page under this one</DropdownItem>}
                <DropdownItem onSelect={() => navigate(`${HOME}/${page.slug}/history`)}><Clock /> History</DropdownItem>
                {canManage && (
                  <>
                    <DropdownSeparator />
                    <DropdownItem danger onSelect={() => setDeleting(true)}><Trash /> Delete</DropdownItem>
                  </>
                )}
              </DropdownContent>
            </DropdownMenu>
          </div>
        )}
      </header>

      {page.body.trim() ? (
        <Markdown text={page.body} linkBase={linkBase} />
      ) : (
        <p className="text-sm text-subtle">This page is empty{canEdit ? ": edit it to write something." : "."}</p>
      )}

      {page.children.length > 0 && (
        <section className="mt-10 border-t border-border pt-5">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-subtle">In this section</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {page.children.map((c) => (
              <li key={c.id}>
                <Link to={href(c.slug)} className={cn("flex items-center gap-3 border border-border px-3 py-2.5 text-sm transition-colors hover:border-accent hover:bg-hover")}>
                  <PageIcon node={c} className="size-4 shrink-0 text-subtle" />
                  <span className="min-w-0 flex-1 truncate font-medium text-text">{c.title}</span>
                  <ChevronRight className="size-3.5 shrink-0 text-subtle" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        danger
        title={`Delete "${page.title}"?`}
        description={page.children.length ? `Its ${page.children.length} sub-page${page.children.length === 1 ? "" : "s"} move up a level. The page and its history are gone for good.` : "The page and its history are gone for good."}
        confirmLabel={<><Trash /> Delete</>}
        onConfirm={() => del.mutateAsync()}
      />
    </article>
  );
}
