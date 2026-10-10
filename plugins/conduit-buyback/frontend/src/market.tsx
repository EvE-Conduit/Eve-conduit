// A program's items, laid out like the in-game market: browse or search the market tree, click an item and pick
// whether its terms are for just that item or its whole category.
import {
  api, Badge, Button, buttonVariants, Card, cn, ConfirmDialog, Dialog, EmptyState, Field, Input, isk, PageHeader, SearchInput, Segmented,
  Skeleton, Spinner, SwitchRow, toast,
} from "@conduit/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Link, useParams } from "react-router";

import { Chevron, Eye, Folder, FolderOpen, Package, Pencil, Tag, Trash } from "./icons";
import { BackLink, HOME } from "./member";
import { TermsBadge } from "./shared";
import {
  BASE, type Crumb, type Effective, type GroupNode, type ManagedDetail, type MarketHits, type MarketLevel, type RuleSet, type RuleTerms,
  type TypeNode,
} from "./types";

const MANAGE = `${HOME}/manage`;

/** What the rule dialog is opened on: an item (with the groups above it) or a market group (the last crumb). */
type Subject = { kind: "type"; id: number; name: string; icon: string; path: Crumb[] } | { kind: "group"; path: Crumb[] };

function useProgram(id: string | undefined) {
  return useQuery({ queryKey: ["buyback", "managed", id], queryFn: () => api.get<ManagedDetail>(`${BASE}/manage/programs/${id}`) });
}

/** Rule changes: the program's rule lists come back; the market tree is read again for its badges. */
function useRuleSaved(id: string | undefined) {
  const qc = useQueryClient();
  return (r: RuleSet) => {
    qc.setQueryData<ManagedDetail>(["buyback", "managed", id], (d) => (d ? { ...d, ...r } : d));
    qc.invalidateQueries({ queryKey: ["buyback", "market", id] });
  };
}

export function ItemsPage() {
  const { id } = useParams();
  const { data } = useProgram(id);
  const [subject, setSubject] = useState<Subject | null>(null);
  if (!data) return <Skeleton className="h-96" />;
  return (
    <div>
      <BackLink to={`${MANAGE}/${id}`}>{data.name}</BackLink>
      <PageHeader
        icon={<Tag />}
        title="Items"
        description={
          data.allow_all_items
            ? `Everything is bought at the program's terms (${data.tax}% tax). Click an item or a category to give it its own: extra tax (or less), a fixed price, or not bought.`
            : "Only the items and categories you add here are bought. Click one to add it."
        }
        actions={
          <Link to={`${MANAGE}/${id}/edit`} className={buttonVariants({ variant: "secondary" })}>
            <Pencil /> Program terms
          </Link>
        }
      />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <MarketWindow programId={id!} onOpen={setSubject} />
        <RulesPanel program={data} onOpen={setSubject} />
      </div>
      {subject && <RuleDialog key={subjectKey(subject)} program={data} subject={subject} onClose={() => setSubject(null)} />}
    </div>
  );
}

const subjectKey = (s: Subject) => (s.kind === "type" ? `t${s.id}` : `g${s.path.at(-1)?.id}`);

// --- the market window ------------------------------------------------------------------------------------------

function MarketWindow({ programId, onOpen }: { programId: string; onOpen: (s: Subject) => void }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Set<number>>(new Set());
  const searching = q.trim().length >= 2;
  const toggle = (g: number) => setOpen((s) => {
    const n = new Set(s);
    if (n.has(g)) n.delete(g);
    else n.add(g);
    return n;
  });
  return (
    <Card className="flex h-[calc(100vh-14rem)] min-h-[480px] flex-col overflow-hidden">
      <div className="flex items-center gap-3 border-b border-border bg-surface-2 px-3 py-2">
        <span className="hud-label shrink-0 text-subtle">Market</span>
        <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the market…" className="w-full" />
        {!searching && open.size > 0 && (
          <Button size="xs" variant="ghost" onClick={() => setOpen(new Set())}>Collapse</Button>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto py-1 text-[13px]" role="tree">
        {searching ? (
          <SearchResults programId={programId} q={q.trim()} onOpen={onOpen} />
        ) : (
          <Level programId={programId} group={null} path={[]} depth={0} open={open} toggle={toggle} onOpen={onOpen} />
        )}
      </div>
      <Legend />
    </Card>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border bg-surface-2 px-3 py-1.5 text-[11px] text-subtle">
      <span className="flex items-center gap-1.5"><Badge tone="accent">own</Badge> its own terms</span>
      <span className="flex items-center gap-1.5"><span className="opacity-60">+5% tax</span> from a category above</span>
      <span className="flex items-center gap-1.5"><Eye className="size-3.5 text-warning-fg" /> checked by hand</span>
    </div>
  );
}

/** One level of the tree, read when its group is opened. */
function Level({ programId, group, path, depth, open, toggle, onOpen }: {
  programId: string; group: number | null; path: Crumb[]; depth: number; open: Set<number>; toggle: (g: number) => void; onOpen: (s: Subject) => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["buyback", "market", programId, group ?? "top"],
    queryFn: () => api.get<MarketLevel>(`${BASE}/manage/programs/${programId}/market${group != null ? `?group=${group}` : ""}`),
    staleTime: 60_000,
  });
  if (isLoading || !data) {
    return (
      <div className="flex items-center gap-2 py-1 text-subtle" style={{ paddingLeft: indent(depth) }}>
        <Spinner className="size-3.5" /> Loading…
      </div>
    );
  }
  return (
    <>
      {data.groups.map((g) => {
        const here = [...path, { id: g.id, name: g.name, count: g.count }];
        const expanded = open.has(g.id);
        return (
          <div key={g.id} role="treeitem" aria-expanded={expanded}>
            <GroupRow node={g} depth={depth} expanded={expanded} onToggle={() => toggle(g.id)} onOpen={() => onOpen({ kind: "group", path: here })} />
            {expanded && <Level programId={programId} group={g.id} path={here} depth={depth + 1} open={open} toggle={toggle} onOpen={onOpen} />}
          </div>
        );
      })}
      {data.types.map((t) => (
        <TypeRow key={t.id} node={t} depth={depth} onOpen={() => onOpen({ kind: "type", id: t.id, name: t.name, icon: t.icon, path })} />
      ))}
    </>
  );
}

const indent = (depth: number) => 8 + depth * 16;

/** A rule set on the row itself, or (faded) the one it gets from a category above. */
function RowTerms({ node }: { node: GroupNode | TypeNode }) {
  return (
    <span className="flex shrink-0 items-center gap-1.5">
      {(node.watch || node.watched) && <Eye className={cn("size-3.5 text-warning-fg", !node.watch && "opacity-50")} />}
      {node.rule ? (
        <>
          <Badge tone="accent" size="sm">own</Badge>
          <TermsBadge terms={node.rule} />
        </>
      ) : (
        node.effective && <TermsBadge terms={node.effective} inherited />
      )}
    </span>
  );
}

function GroupRow({ node, depth, expanded, onToggle, onOpen }: { node: GroupNode; depth: number; expanded: boolean; onToggle: () => void; onOpen: () => void }) {
  return (
    <div className="group/row flex h-7 items-center gap-1 pr-2 hover:bg-hover" style={{ paddingLeft: indent(depth) }}>
      <button type="button" onClick={onToggle} className="flex min-w-0 flex-1 items-center gap-1.5 text-left" aria-label={`${expanded ? "Close" : "Open"} ${node.name}`}>
        <Chevron className={cn("size-3.5 shrink-0 text-subtle transition-transform", expanded && "rotate-90")} />
        {expanded ? <FolderOpen className="size-4 shrink-0 text-accent-ink" /> : <Folder className="size-4 shrink-0 text-muted" />}
        <span className="truncate">{node.name}</span>
        <span className="shrink-0 text-[11px] text-subtle">{node.count}</span>
      </button>
      <RowTerms node={node} />
      <button
        type="button"
        onClick={onOpen}
        className="ml-1 shrink-0 px-1.5 py-0.5 text-[11px] text-accent-ink opacity-0 hover:underline focus:opacity-100 group-hover/row:opacity-100"
      >
        Set terms
      </button>
    </div>
  );
}

function TypeRow({ node, depth, sub, onOpen }: { node: TypeNode; depth: number; sub?: ReactNode; onOpen: () => void }) {
  return (
    <button
      type="button"
      role="treeitem"
      onClick={onOpen}
      className="flex min-h-7 w-full items-center gap-2 py-0.5 pr-2 text-left hover:bg-hover"
      style={{ paddingLeft: indent(depth) + 18 }}
    >
      <img src={node.icon} alt="" loading="lazy" className="size-6 shrink-0 border border-border bg-bg" />
      <span className="min-w-0 flex-1">
        <span className="block truncate">{node.name}</span>
        {sub && <span className="block truncate text-[11px] text-subtle">{sub}</span>}
      </span>
      <RowTerms node={node} />
    </button>
  );
}

function SearchResults({ programId, q, onOpen }: { programId: string; q: string; onOpen: (s: Subject) => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ["buyback", "market", programId, "search", q],
    queryFn: () => api.get<MarketHits>(`${BASE}/manage/programs/${programId}/market/search?q=${encodeURIComponent(q)}`),
    placeholderData: (prev) => prev,
  });
  if (isLoading || !data) return <div className="flex items-center gap-2 px-3 py-2 text-subtle"><Spinner className="size-3.5" /> Searching…</div>;
  if (!data.groups.length && !data.types.length) return <EmptyState icon={<Package />} title="Nothing found" description="Only items sold on the market are listed." />;
  const where = (path: Crumb[] | undefined) => (path ?? []).map((c) => c.name).join(" › ");
  return (
    <>
      {data.groups.length > 0 && (
        <>
          <div className="hud-label px-3 pb-1 pt-2 text-[11px] text-subtle">Categories</div>
          {data.groups.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => onOpen({ kind: "group", path: [...(g.path ?? []), { id: g.id, name: g.name, count: g.count }] })}
              className="flex min-h-7 w-full items-center gap-2 py-0.5 pl-2 pr-2 text-left hover:bg-hover"
            >
              <Folder className="size-4 shrink-0 text-muted" />
              <span className="min-w-0 flex-1">
                <span className="block truncate">{g.name} <span className="text-[11px] text-subtle">{g.count}</span></span>
                {g.path?.length ? <span className="block truncate text-[11px] text-subtle">{where(g.path)}</span> : null}
              </span>
              <RowTerms node={g} />
            </button>
          ))}
        </>
      )}
      {data.types.length > 0 && (
        <>
          <div className="hud-label px-3 pb-1 pt-2 text-[11px] text-subtle">Items</div>
          {data.types.map((t) => (
            <TypeRow
              key={t.id}
              node={t}
              depth={-1}
              sub={where(t.path)}
              onOpen={() => onOpen({ kind: "type", id: t.id, name: t.name, icon: t.icon, path: t.path ?? [] })}
            />
          ))}
        </>
      )}
    </>
  );
}

// --- the program's rules -----------------------------------------------------------------------------------------

type Tab = "groups" | "items" | "watch";

function RulesPanel({ program, onOpen }: { program: ManagedDetail; onOpen: (s: Subject) => void }) {
  const id = String(program.id);
  const saved = useRuleSaved(id);
  const [tab, setTab] = useState<Tab>(program.group_rules.length || !program.item_rules.length ? "groups" : "items");
  const [filter, setFilter] = useState("");
  const [clearAll, setClearAll] = useState(false);
  const clear = useMutation({
    mutationFn: (body: { type_id?: number; market_group_id?: number }) => api.post<RuleSet>(`${BASE}/manage/programs/${id}/rules`, { ...body, rule: null }),
    onSuccess: saved,
    onError: (e: Error) => toast.error(e.message),
  });
  const unwatch = useMutation({
    mutationFn: (ruleId: number) => api.delete<RuleSet["watch_rules"]>(`${BASE}/manage/programs/${id}/watchlist/${ruleId}`),
    onSuccess: (watch_rules) => saved({ item_rules: program.item_rules, group_rules: program.group_rules, watch_rules }),
  });
  const removeAll = useMutation({
    mutationFn: () => api.delete<RuleSet>(`${BASE}/manage/programs/${id}/items`),
    onSuccess: saved,
  });
  const f = filter.toLowerCase();
  const match = (name: string) => name.toLowerCase().includes(f);
  const where = (path: Crumb[]) => path.map((c) => c.name).join(" › ") || "Market";
  const groups = program.group_rules.filter((r) => match(r.name));
  const items = program.item_rules.filter((r) => match(r.name));
  const watch = program.watch_rules.filter((r) => match(r.name));
  const count = program.group_rules.length + program.item_rules.length;

  return (
    <Card className="flex h-[calc(100vh-14rem)] min-h-[480px] flex-col overflow-hidden">
      <div className="space-y-2 border-b border-border px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="hud-label text-subtle">This program</div>
          {count > 0 && (
            <Button size="xs" variant="ghost" onClick={() => setClearAll(true)}>
              <Trash /> Remove all terms
            </Button>
          )}
        </div>
        <p className="text-xs text-muted">
          {program.allow_all_items
            ? <>Anything not listed here is bought at <span className="font-mono text-text">{program.tax}%</span> tax.</>
            : <>Nothing else is bought: <span className="text-text">Buy every item</span> is off in the program's pricing.</>}
        </p>
        <p className="text-xs text-muted">
          The closest terms win: an item's own terms beat its category's, and a category's terms beat those of any category
          above it. So a category at +0% isn't neutral: its items stay at the program's tax even if a category above adds more.
        </p>
        <Segmented
          size="sm"
          value={tab}
          onChange={setTab}
          options={[
            { value: "groups", label: `Categories ${program.group_rules.length}` },
            { value: "items", label: `Items ${program.item_rules.length}` },
            { value: "watch", label: `Manual review ${program.watch_rules.length}` },
          ]}
        />
        <SearchInput value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter" />
      </div>
      <ul className="min-h-0 flex-1 divide-y divide-border overflow-y-auto">
        {tab === "groups" && (groups.length === 0 ? (
          <Empty text={program.group_rules.length ? "No match" : "No categories yet. In the market, hover a category and Set terms, or click an item and pick its category."} />
        ) : groups.map((r) => (
          <RuleRow
            key={r.market_group_id}
            icon={<Folder className="size-4 text-muted" />}
            name={<>{r.name} <span className="text-[11px] text-subtle">{r.count} items</span></>}
            sub={withOverride(where(r.path), program, r.path)}
            terms={<TermsBadge terms={r} />}
            onEdit={() => onOpen({ kind: "group", path: [...r.path, { id: r.market_group_id, name: r.name, count: r.count }] })}
            onRemove={() => clear.mutate({ market_group_id: r.market_group_id })}
          />
        )))}
        {tab === "items" && (items.length === 0 ? (
          <Empty text={program.item_rules.length ? "No match" : "No items with their own terms. Click an item in the market."} />
        ) : items.map((r) => (
          <RuleRow
            key={r.type_id}
            icon={<img src={r.icon} alt="" className="size-6 border border-border bg-bg" loading="lazy" />}
            name={r.name}
            sub={withOverride(where(r.path), program, r.path)}
            terms={<TermsBadge terms={r} />}
            onEdit={() => onOpen({ kind: "type", id: r.type_id, name: r.name, icon: r.icon, path: r.path })}
            onRemove={() => clear.mutate({ type_id: r.type_id })}
          />
        )))}
        {tab === "watch" && (watch.length === 0 ? (
          <Empty text={program.watch_rules.length ? "No match" : "Nothing is checked by hand. Officer modules, rare loot, anything easy to manipulate: tick Check by hand when setting its terms."} />
        ) : watch.map((w) => (
          <RuleRow
            key={w.id}
            icon={w.icon ? <img src={w.icon} alt="" className="size-6 border border-border bg-bg" loading="lazy" /> : <Folder className="size-4 text-muted" />}
            name={<>{w.name} {w.kind === "market" && <span className="text-[11px] text-subtle">{w.count} items</span>}</>}
            sub={w.kind === "group" ? "Item group" : where(w.path)}
            terms={<Eye className="size-3.5 text-warning-fg" />}
            onEdit={w.kind === "group" ? undefined : () => onOpen(
              w.kind === "type"
                ? { kind: "type", id: w.target_id, name: w.name, icon: w.icon ?? "", path: w.path }
                : { kind: "group", path: [...w.path, { id: w.target_id, name: w.name, count: w.count ?? 0 }] },
            )}
            onRemove={() => unwatch.mutate(w.id)}
          />
        )))}
      </ul>
      <p className="flex items-center gap-1.5 border-t border-border bg-surface-2 px-4 py-2 text-[11px] text-subtle">
        <Eye className="size-3.5" /> Sellers see which of their items will be checked by hand.
      </p>
      <ConfirmDialog
        open={clearAll}
        onOpenChange={setClearAll}
        title="Remove every item and category's terms?"
        description={program.allow_all_items ? "Everything goes back to the program's terms. The manual review list stays." : "The program won't buy anything until you add items again."}
        confirmLabel="Remove all"
        danger
        onConfirm={() => removeAll.mutateAsync()}
      />
    </Card>
  );
}

function Empty({ text }: { text: string }) {
  return <li className="px-4 py-6 text-center text-sm text-subtle">{text}</li>;
}

function RuleRow({ icon, name, sub, terms, onEdit, onRemove }: {
  icon: ReactNode; name: ReactNode; sub: string; terms: ReactNode; onEdit?: () => void; onRemove: () => void;
}) {
  return (
    <li className="flex items-center gap-2.5 px-4 py-2">
      <span className="flex size-6 shrink-0 items-center justify-center">{icon}</span>
      <button type="button" className="min-w-0 flex-1 text-left disabled:cursor-default" onClick={onEdit} disabled={!onEdit}>
        <span className="block truncate text-sm">{name}</span>
        <span className="block truncate text-[11px] text-subtle">{sub}</span>
      </button>
      <span className="shrink-0">{terms}</span>
      <Button size="icon-xs" variant="ghost" aria-label="Remove" onClick={onRemove}>
        <Trash />
      </Button>
    </li>
  );
}

// --- setting terms --------------------------------------------------------------------------------------------------

type Mode = "buy" | "fixed" | "none";

/** Where the terms go: the item itself, or one of the categories above it (closest first). */
type Target = { kind: "type"; id: number; name: string; icon: string } | { kind: "group"; id: number; name: string; count: number; above: Crumb[] };

function targetsOf(subject: Subject): Target[] {
  const groups = subject.path.map((c, i) => ({ kind: "group" as const, id: c.id, name: c.name, count: c.count, above: subject.path.slice(0, i) })).reverse();
  return subject.kind === "type" ? [{ kind: "type", id: subject.id, name: subject.name, icon: subject.icon }, ...groups] : groups;
}

function RuleDialog({ program, subject, onClose }: { program: ManagedDetail; subject: Subject; onClose: () => void }) {
  const id = String(program.id);
  const saved = useRuleSaved(id);
  const targets = targetsOf(subject);
  const [index, setIndex] = useState(0);
  const target = targets[index];
  const own = ownTerms(program, target);
  const watched = program.watch_rules.some((w) => (target.kind === "type" ? w.kind === "type" : w.kind === "market") && w.target_id === target.id);
  const [form, setForm] = useState(() => formFor(own, watched));
  const pickTarget = (i: number) => {
    setIndex(i);
    const t = targets[i];
    setForm(formFor(ownTerms(program, t), program.watch_rules.some((w) => (t.kind === "type" ? w.kind === "type" : w.kind === "market") && w.target_id === t.id)));
  };
  const above = inheritedTerms(program, targets.slice(index + 1));
  const inside = target.kind === "group" ? rulesInside(program, target.id) : [];
  const key = target.kind === "type" ? { type_id: target.id } : { market_group_id: target.id };
  const save = useMutation({
    mutationFn: (rule: RuleTerms | null) => api.post<RuleSet>(`${BASE}/manage/programs/${id}/rules`, { ...key, rule, watch: form.watch }),
    onSuccess: (r, rule) => {
      saved(r);
      toast.success(rule ? `${target.name}: ${describe(rule)}${target.kind === "group" ? `, ${target.count} items` : ""}` : `${target.name}: back to ${above ? above.label : "the program's terms"}`);
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const rule: RuleTerms = {
    tax: form.mode === "buy" ? Number(form.tax) || 0 : 0,
    disallowed: form.mode === "none",
    static_price: form.mode === "fixed" ? Number(form.price) || 0 : null,
  };
  const head = targets[0];

  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      size="lg"
      title={
        <span className="flex items-center gap-3">
          {head.kind === "type" ? <img src={head.icon} alt="" className="size-10 border border-border bg-bg" /> : <span className="flex size-10 items-center justify-center border border-border bg-surface-2"><Folder className="size-5 text-muted" /></span>}
          <span className="min-w-0">
            <span className="block truncate">{head.name}</span>
            <span className="block truncate text-xs font-normal text-subtle">{subject.path.map((c) => c.name).join(" › ") || "Market"}</span>
          </span>
        </span>
      }
      footer={
        <>
          {own && (
            <Button variant="ghost" className="mr-auto" loading={save.isPending && save.variables === null} onClick={() => save.mutate(null)}>
              <Trash /> Remove its terms
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={save.isPending && save.variables !== null} onClick={() => save.mutate(rule)}>
            {own ? "Save" : head.kind === "type" && index === 0 ? "Add item" : "Add category"}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {targets.length > 1 && (
          <Field label={head.kind === "type" ? "Add just this item, or its entire category?" : "This category, or a wider one?"}>
            <div className="space-y-1.5" role="radiogroup">
              {targets.map((t, i) => {
                const on = i === index;
                const terms = ownTerms(program, t);
                return (
                  <button
                    key={`${t.kind}${t.id}`}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => pickTarget(i)}
                    className={cn("flex w-full items-center gap-3 border px-3 py-2 text-left transition", on ? "border-accent bg-accent-soft" : "border-border hover:bg-hover")}
                  >
                    <span className={cn("flex size-4 shrink-0 items-center justify-center rounded-full border", on ? "border-accent" : "border-border-strong")}>
                      {on && <span className="size-2 rounded-full bg-accent" />}
                    </span>
                    {t.kind === "type" ? <img src={t.icon} alt="" className="size-6 border border-border bg-bg" /> : <Folder className="size-5 shrink-0 text-muted" />}
                    <span className="min-w-0 flex-1">
                      <span className={cn("block truncate text-sm font-medium", on && "text-accent-ink")}>
                        {t.kind === "type" ? `Just ${t.name}` : `Entire ${t.name} category`}
                      </span>
                      <span className="block truncate text-xs text-subtle">
                        {t.kind === "type" ? "This item only" : `${t.count} item${t.count === 1 ? "" : "s"}${t.above.length ? ` · in ${t.above.map((c) => c.name).join(" › ")}` : ""}`}
                      </span>
                    </span>
                    {terms && <TermsBadge terms={terms} />}
                  </button>
                );
              })}
            </div>
          </Field>
        )}

        <div className="border border-border bg-surface-2 px-3 py-2 text-xs text-muted">
          {own ? (
            <>
              Now: <span className="text-text">{describe(own)}</span>, its own terms.
              {above && <> They override {above.label} (<span className="text-text">{describe(above.terms)}</span>).</>}
            </>
          ) : above ? (
            <>Now: <span className="text-text">{describe(above.terms)}</span>, from {above.label}.</>
          ) : (
            <>Now: {program.allow_all_items ? <>the program's terms (<span className="font-mono">{program.tax}%</span> tax)</> : <span className="text-text">not bought</span>}.</>
          )}
          {inside.length > 0 && (
            <div className="mt-1.5 text-warning-fg">
              {inside.length === 1 ? "This has" : `These ${inside.length} have`} terms of {inside.length === 1 ? "its" : "their"} own and won't follow this category's:{" "}
              {inside.slice(0, 8).map((r) => `${r.name} (${describe(r.terms)})`).join(", ")}
              {inside.length > 8 && ", …"}. Remove {inside.length === 1 ? "its terms" : "theirs"} in the rules list if they should.
            </div>
          )}
        </div>

        <Field label="Terms">
          <Segmented
            value={form.mode}
            onChange={(mode) => setForm({ ...form, mode })}
            options={[
              { value: "buy", label: "Buy" },
              ...(target.kind === "type" ? [{ value: "fixed" as const, label: "Fixed price" }] : []),
              { value: "none", label: "Don't buy" },
            ]}
          />
        </Field>
        {form.mode === "buy" && (
          <Field label="Extra tax" hint={`On top of the program's ${program.tax}%. Negative for less; 0 is the program's tax alone${above ? `, ignoring ${above.label}` : ""}${program.allow_all_items ? "" : " (and adds it to the list)"}.`}>
            <div className="flex items-center gap-2">
              <Input type="number" step={0.5} value={form.tax} onChange={(e) => setForm({ ...form, tax: e.target.value })} className="w-32 font-mono" autoFocus />
              <span className="text-sm text-subtle">% → {Math.min(100, Math.max(-100, program.tax + (Number(form.tax) || 0)))}% in all</span>
            </div>
          </Field>
        )}
        {form.mode === "fixed" && (
          <Field label="Price" hint="ISK per unit, with no tax or hauling taken off.">
            <div className="flex items-center gap-2">
              <Input type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-44 font-mono" autoFocus />
              <span className="text-sm text-subtle">ISK each{Number(form.price) > 0 && <> · {isk(Number(form.price), { full: true })}</>}</span>
            </div>
          </Field>
        )}
        {form.mode === "none" && <p className="text-sm text-muted">Sellers see it as not bought on their quote.</p>}

        <div className="border border-border px-3">
          <SwitchRow
            label="Check by hand"
            description="Quotes and contracts with it are flagged for manual review (officer modules, rare loot, anything easy to manipulate)."
            checked={form.watch}
            onCheckedChange={(watch) => setForm({ ...form, watch })}
          />
        </div>
      </div>
    </Dialog>
  );
}

function ownTerms(program: ManagedDetail, t: Target): RuleTerms | null {
  return t.kind === "type"
    ? program.item_rules.find((r) => r.type_id === t.id) ?? null
    : program.group_rules.find((r) => r.market_group_id === t.id) ?? null;
}

/** The closest category above the target that has terms. */
/** The rule list's location line, plus the category whose terms the rule overrides (the closest one above it). */
function withOverride(where: string, program: ManagedDetail, path: Crumb[]): string {
  const over = inheritedTerms(program, [...path].reverse().map((c) => ({ kind: "group" as const, ...c, above: [] })));
  return over ? `${where} · overrides ${over.label} (${describe(over.terms)})` : where;
}

/** Item and category rules inside a category: they keep their own terms whatever the category's are. */
function rulesInside(program: ManagedDetail, groupId: number): { key: string; name: string; terms: RuleTerms }[] {
  return [
    ...program.group_rules.filter((r) => r.path.some((c) => c.id === groupId)).map((r) => ({ key: `g${r.market_group_id}`, name: r.name, terms: r })),
    ...program.item_rules.filter((r) => r.path.some((c) => c.id === groupId)).map((r) => ({ key: `t${r.type_id}`, name: r.name, terms: r })),
  ];
}

function inheritedTerms(program: ManagedDetail, above: Target[]): { terms: RuleTerms; label: string } | null {
  for (const g of above) {
    const terms = ownTerms(program, g);
    if (terms) return { terms, label: `the ${g.name} category` };
  }
  return null;
}

function formFor(terms: RuleTerms | null, watch: boolean) {
  return {
    mode: (terms?.disallowed ? "none" : terms?.static_price != null ? "fixed" : "buy") as Mode,
    tax: String(terms && !terms.disallowed ? terms.tax : 0),
    price: terms?.static_price != null ? String(terms.static_price) : "",
    watch,
  };
}

function describe(t: RuleTerms | Effective): string {
  if (t.disallowed) return "not bought";
  if (t.static_price != null) return `${isk(t.static_price, { full: true })} each`;
  if (t.tax) return `${t.tax > 0 ? "+" : ""}${t.tax}% tax`;
  return "bought at the program's terms";
}
