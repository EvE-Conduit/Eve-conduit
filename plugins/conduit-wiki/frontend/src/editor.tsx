// Writing a page: title, text with a preview, where it sits in the tree, and (for managers) who sees it.
import { api, Button, cn, Field, Input, PageHeader, Segmented, Select, Skeleton, SwitchRow, Textarea, toast } from "@conduit/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";

import { ArrowLeft, Eye, Pencil } from "./icons";
import { Markdown, slugify } from "./markdown";
import { usePage } from "./pages";
import { flatten, useOverview } from "./shell";
import { type Audience, BASE, HOME, type Page } from "./types";

const HELP = "**bold**, *italic*, `code`, [link](https://…), [[Page Title]] links to another page, # headings, - lists (indent to nest), 1. lists, - [ ] tasks, > quotes, | tables |, ``` code blocks, ![image](https://…).";

export function EditorPage() {
  const { slug } = useParams();
  const [params] = useSearchParams();
  const overview = useOverview();
  const { data: page, isLoading } = usePage(slug);
  if (slug && (isLoading || !page)) return <Skeleton className="h-96" />;
  if (overview.isLoading || !overview.data) return <Skeleton className="h-96" />;
  if (!overview.data.can_edit || (page && !page.can_edit)) {
    return (
      <div className="mx-auto max-w-xl py-12 text-center">
        <p className="text-sm text-muted">{page?.locked ? "This page is locked; only people who manage the wiki can edit it." : "You can't edit wiki pages."}</p>
        <Link to={page ? `${HOME}/${page.slug}` : HOME} className="mt-3 inline-block text-sm text-accent-ink underline underline-offset-4">Back</Link>
      </div>
    );
  }
  return (
    <Editor
      key={page?.id ?? "new"}
      page={page ?? null}
      canManage={overview.data.can_manage}
      initial={{ title: params.get("title") ?? "", slug: params.get("slug") ?? "", parent: params.get("parent") }}
    />
  );
}

function Editor({ page, canManage, initial }: { page: Page | null; canManage: boolean; initial: { title: string; slug: string; parent: string | null } }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const overview = useOverview();
  const { data: audience } = useQuery({ queryKey: ["wiki", "audience"], queryFn: () => api.get<Audience>(`${BASE}/audience`), enabled: canManage });
  const [form, setForm] = useState({
    title: page?.title ?? initial.title,
    slug: page?.slug ?? initial.slug,
    body: page?.body ?? "",
    parent: page ? page.parent : initial.parent ? Number(initial.parent) : null,
    note: "",
    states: page?.states?.map((s) => s.id) ?? [],
    groups: page?.groups?.map((g) => g.id) ?? [],
    public: page?.public ?? false,
    locked: page?.locked ?? false,
  });
  const [slugTouched, setSlugTouched] = useState(!!page || !!initial.slug);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));
  const toggle = (key: "states" | "groups", id: number) => set({ [key]: form[key].includes(id) ? form[key].filter((x) => x !== id) : [...form[key], id] });
  const dirty = useRef(false);
  useEffect(() => {
    dirty.current = page ? form.title !== page.title || form.body !== page.body : !!(form.title || form.body);
  }, [form, page]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  // Pages that can be the parent: everything but this page and its own descendants.
  const parents = useMemo(() => {
    const rows = flatten(overview.data?.tree ?? []);
    if (!page) return rows;
    const banned = new Set<number>();
    const mark = (id: number) => {
      banned.add(id);
      rows.filter((r) => r.node.parent === id).forEach((r) => mark(r.node.id));
    };
    mark(page.id);
    return rows.filter((r) => !banned.has(r.node.id));
  }, [overview.data, page]);

  const save = useMutation({
    mutationFn: () => {
      const body = {
        title: form.title,
        body: form.body,
        slug: form.slug.trim() || null,
        parent: form.parent,
        note: form.note,
        ...(canManage ? { states: form.states, groups: form.groups, public: form.public, locked: form.locked } : {}),
      };
      return page ? api.put<Page>(`${BASE}/pages/${encodeURIComponent(page.slug)}`, body) : api.post<Page>(`${BASE}/pages`, body);
    },
    onSuccess: (saved) => {
      dirty.current = false;
      qc.invalidateQueries({ queryKey: ["wiki"] });
      toast.success(page ? "Page saved" : "Page created");
      navigate(saved.slug === "home" ? HOME : `${HOME}/${saved.slug}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const back = page ? (page.slug === "home" ? HOME : `${HOME}/${page.slug}`) : HOME;
  const everyone = form.states.length === 0 && form.groups.length === 0;

  return (
    <div className="mx-auto max-w-6xl">
      <Link to={back} className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-text"><ArrowLeft /> {page ? page.title : "Wiki"}</Link>
      <PageHeader
        eyebrow="Wiki"
        title={page ? "Edit page" : "New page"}
        actions={
          <div className="flex items-center gap-2">
            <Link to={back} className="text-sm text-muted hover:text-text">Cancel</Link>
            <Button variant="primary" disabled={!form.title.trim()} loading={save.isPending} onClick={() => save.mutate()}>{page ? "Save" : "Create"}</Button>
          </div>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-4">
          <Field label="Title" required>
            <Input
              value={form.title}
              maxLength={200}
              onChange={(e) => set({ title: e.target.value, ...(slugTouched ? {} : { slug: slugify(e.target.value) }) })}
              placeholder="Fleet rules"
              autoFocus={!page}
              className="text-lg font-medium"
            />
          </Field>
          <div>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <span className="text-[13px] font-medium">Text</span>
              <Segmented<"write" | "preview">
                value={tab}
                onChange={setTab}
                size="sm"
                options={[{ value: "write", label: "Write", icon: <Pencil /> }, { value: "preview", label: "Preview", icon: <Eye /> }]}
              />
            </div>
            {tab === "write" ? (
              <>
                <Textarea
                  rows={24}
                  value={form.body}
                  onChange={(e) => set({ body: e.target.value })}
                  onKeyDown={(e) => {
                    // Tab indents (nested lists) instead of leaving the box.
                    if (e.key === "Tab") {
                      e.preventDefault();
                      const el = e.currentTarget;
                      const { selectionStart: s, selectionEnd: en, value } = el;
                      const next = `${value.slice(0, s)}  ${value.slice(en)}`;
                      set({ body: next });
                      requestAnimationFrame(() => el.setSelectionRange(s + 2, s + 2));
                    }
                  }}
                  placeholder={"## Comms\n\nBe on Mumble before the fleet forms.\n\n- Doctrine: [[Ferox fleet]]\n- Broadcast for reps **early**\n\n| Role | Ship |\n|---|---|\n| Logi | Osprey |"}
                  className="min-h-[480px] font-mono text-[13px]"
                />
                <p className="mt-1.5 text-xs text-subtle">{HELP}</p>
              </>
            ) : (
              <div className="min-h-[480px] border border-border bg-bg/40 p-5">
                {form.body.trim() ? <Markdown text={form.body} linkBase={HOME} /> : <p className="text-sm text-subtle">Nothing to preview yet.</p>}
              </div>
            )}
          </div>
          <Field label="What changed" hint="A few words for the page's history. Optional.">
            <Input value={form.note} maxLength={200} onChange={(e) => set({ note: e.target.value })} placeholder={page ? "Updated the doctrine list" : ""} />
          </Field>
        </div>

        <div className="space-y-5">
          <Field label="Address" hint={<>Shown as /p/wiki/<b>{form.slug || slugify(form.title) || "…"}</b>. {page && form.slug !== page.slug ? "Changing it breaks links to the old address." : "Letters, numbers and dashes."}</>}>
            <Input value={form.slug} maxLength={120} onChange={(e) => { setSlugTouched(true); set({ slug: e.target.value }); }} placeholder={slugify(form.title) || "fleet-rules"} className="font-mono text-[13px]" />
          </Field>
          <Field label="Under" hint="The page this one is nested in.">
            <Select value={form.parent ?? ""} onChange={(e) => set({ parent: e.target.value ? Number(e.target.value) : null })}>
              <option value="">Top level</option>
              {parents.map(({ node, depth }) => (
                <option key={node.id} value={node.id}>{`${"   ".repeat(depth)}${node.title}`}</option>
              ))}
            </Select>
          </Field>

          {canManage && (
            <>
              <div>
                <div className="mb-1.5 text-[13px] font-medium">Who sees it</div>
                <p className="mb-2 text-xs text-muted">Nothing picked means every member.</p>
                <div className="flex flex-wrap gap-1.5">
                  {(audience?.states ?? []).map((s) => (
                    <Chip key={`s${s.id}`} on={form.states.includes(s.id)} onClick={() => toggle("states", s.id)} color={s.color}>{s.name}</Chip>
                  ))}
                </div>
                {(audience?.groups.length ?? 0) > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {audience!.groups.map((g) => (
                      <Chip key={`g${g.id}`} on={form.groups.includes(g.id)} onClick={() => toggle("groups", g.id)}>{g.name}</Chip>
                    ))}
                  </div>
                )}
              </div>
              <div className="divide-y divide-border border border-border px-3">
                <SwitchRow
                  label="Public"
                  description={`Anyone can read it, signed in or not, at /public/p/wiki/${form.slug || slugify(form.title) || "…"}.`}
                  checked={form.public}
                  onCheckedChange={(v) => set({ public: v })}
                />
                <SwitchRow label="Locked" description="Only people who manage the wiki can edit it." checked={form.locked} onCheckedChange={(v) => set({ locked: v })} />
              </div>
              <p className="text-xs text-subtle">{everyone ? "Every member" : "Only the chosen states and groups"}{form.public ? " and anyone with the public link" : ""} will see it.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Chip({ on, onClick, color, children }: { on: boolean; onClick: () => void; color?: string; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 border px-2 py-1 text-xs transition-colors",
        on ? "border-accent/60 bg-accent-soft text-text" : "border-border text-muted hover:border-border-strong hover:text-text",
      )}
    >
      {color && <span className="size-1.5 rotate-45" style={{ background: color }} />}
      {children}
    </button>
  );
}
