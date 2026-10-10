// The frame every wiki page sits in: the page tree on the left, the content on the right, and the "On this page"
// list of headings next to long pages.
import { api, buttonVariants, cn, SearchInput, Skeleton } from "@conduit/sdk";
import { useQuery } from "@tanstack/react-query";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router";

import { Book, ChevronDown, ChevronRight, FileText, Globe, List, Lock, Plus } from "./icons";
import { type Heading, headings } from "./markdown";
import { BASE, HOME, type Node, type Overview } from "./types";

export function useOverview() {
  return useQuery({ queryKey: ["wiki", "overview"], queryFn: () => api.get<Overview>(BASE), staleTime: 30_000 });
}

/** Every page in the tree, depth first, with its depth. */
export function flatten(nodes: Node[], depth = 0, out: { node: Node; depth: number }[] = []): { node: Node; depth: number }[] {
  for (const n of nodes) {
    out.push({ node: n, depth });
    if (n.children?.length) flatten(n.children, depth + 1, out);
  }
  return out;
}

/** The ids of the page and every ancestor, so the tree opens to where the reader is. */
function pathTo(nodes: Node[], slug: string, trail: number[] = []): number[] | null {
  for (const n of nodes) {
    const here = [...trail, n.id];
    if (n.slug === slug) return here;
    const deeper = n.children?.length ? pathTo(n.children, slug, here) : null;
    if (deeper) return deeper;
  }
  return null;
}

function matches(n: Node, q: string): boolean {
  return n.title.toLowerCase().includes(q) || (n.children ?? []).some((c) => matches(c, q));
}

function TreeNode({ node, depth, current, open, toggle, filter, linkBase }: {
  node: Node; depth: number; current: string | null; open: Set<number>; toggle: (id: number) => void; filter: string; linkBase: string;
}) {
  const kids = (node.children ?? []).filter((c) => !filter || matches(c, filter));
  const isOpen = !!filter || open.has(node.id);
  const active = node.slug === current;
  return (
    <li>
      <div className={cn("group flex items-center gap-1", active && "bg-accent-soft")} style={{ paddingLeft: depth * 12 }}>
        {kids.length > 0 ? (
          <button type="button" onClick={() => toggle(node.id)} className="flex size-6 shrink-0 items-center justify-center text-subtle hover:text-text" aria-label={isOpen ? "Collapse" : "Expand"} aria-expanded={isOpen}>
            {isOpen ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
          </button>
        ) : (
          <span className="size-6 shrink-0" aria-hidden />
        )}
        <Link
          to={node.slug === "home" ? linkBase : `${linkBase}/${node.slug}`}
          className={cn("flex min-w-0 flex-1 items-center gap-1.5 py-1 pr-2 text-sm", active ? "font-medium text-text" : "text-muted hover:text-text")}
          aria-current={active ? "page" : undefined}
        >
          <span className="truncate">{node.title}</span>
          {node.locked && <Lock className="size-3 shrink-0 text-subtle" />}
          {node.public && <Globe className="size-3 shrink-0 text-subtle" />}
        </Link>
      </div>
      {kids.length > 0 && isOpen && (
        <ul>
          {kids.map((c) => <TreeNode key={c.id} node={c} depth={depth + 1} current={current} open={open} toggle={toggle} filter={filter} linkBase={linkBase} />)}
        </ul>
      )}
    </li>
  );
}

export function Tree({ nodes, current, linkBase, canEdit }: { nodes: Node[]; current: string | null; linkBase: string; canEdit?: boolean }) {
  const [filter, setFilter] = useState("");
  const [open, setOpen] = useState<Set<number>>(() => new Set());
  useEffect(() => {
    if (!current) return;
    const path = pathTo(nodes, current);
    if (path) setOpen((o) => new Set([...o, ...path]));
  }, [nodes, current]);
  const toggle = (id: number) => setOpen((o) => {
    const next = new Set(o);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
  const q = filter.trim().toLowerCase();
  const shown = q ? nodes.filter((n) => matches(n, q)) : nodes;
  return (
    <nav aria-label="Wiki pages" className="space-y-2">
      {nodes.length > 6 && <SearchInput value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Find a page" aria-label="Find a page" />}
      {shown.length === 0 ? (
        <p className="px-2 py-1 text-xs text-subtle">{q ? "No page with that name." : "No pages yet."}</p>
      ) : (
        <ul>{shown.map((n) => <TreeNode key={n.id} node={n} depth={0} current={current} open={open} toggle={toggle} filter={q} linkBase={linkBase} />)}</ul>
      )}
      {canEdit && (
        <Link to={`${HOME}/new`} className={cn(buttonVariants({ variant: "ghost", size: "xs" }), "w-full justify-start")}>
          <Plus /> New page
        </Link>
      )}
    </nav>
  );
}

/** The wiki frame. ``current`` is the open page's slug (or "home"). */
export function WikiShell({ current, tree, loading, canEdit, linkBase = HOME, aside, children }: {
  current: string | null; tree: Node[] | undefined; loading?: boolean; canEdit?: boolean; linkBase?: string; aside?: ReactNode; children: ReactNode;
}) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => setMobileOpen(false), [location.pathname]);
  return (
    <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)_200px]">
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <button type="button" onClick={() => setMobileOpen((o) => !o)} className="flex w-full items-center gap-2 border border-border px-3 py-2 text-sm text-muted lg:hidden" aria-expanded={mobileOpen}>
          <List /> Pages {mobileOpen ? <ChevronDown className="ml-auto" /> : <ChevronRight className="ml-auto" />}
        </button>
        <div className={cn("mt-2 lg:mt-0", mobileOpen ? "block" : "hidden lg:block")}>
          <div className="mb-2 hidden items-center gap-2 px-2 text-xs font-semibold uppercase tracking-[0.12em] text-subtle lg:flex"><Book className="size-3.5" /> Pages</div>
          {loading || !tree ? <div className="space-y-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-6" />)}</div> : <Tree nodes={tree} current={current} linkBase={linkBase} canEdit={canEdit} />}
        </div>
      </aside>
      <div className="min-w-0">{children}</div>
      <div className="hidden xl:block">{aside}</div>
    </div>
  );
}

/** "On this page": the headings of the body, highlighting the one in view. */
export function Toc({ body }: { body: string }) {
  const items = useMemo(() => headings(body).filter((h) => h.level <= 3), [body]);
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    if (items.length === 0) return;
    const els = items.map((h) => document.getElementById(h.id)).filter((e): e is HTMLElement => !!e);
    const io = new IntersectionObserver((entries) => {
      const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible[0]) setActive(visible[0].target.id);
    }, { rootMargin: "-80px 0px -70% 0px" });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [items]);
  if (items.length < 2) return null;
  return <TocList items={items} active={active} />;
}

function TocList({ items, active }: { items: Heading[]; active: string | null }) {
  const min = Math.min(...items.map((h) => h.level));
  return (
    <nav aria-label="On this page" className="sticky top-20 text-sm">
      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-subtle">On this page</div>
      <ul className="space-y-1 border-l border-border">
        {items.map((h) => (
          <li key={h.id} style={{ paddingLeft: 12 + (h.level - min) * 12 }}>
            <a href={`#${h.id}`} className={cn("-ml-px block truncate border-l py-0.5 pl-2", active === h.id ? "border-accent text-text" : "border-transparent text-muted hover:text-text")}>
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function PageIcon({ node, className }: { node: Node; className?: string }) {
  return node.children?.length ? <Book className={className} /> : <FileText className={className} />;
}
