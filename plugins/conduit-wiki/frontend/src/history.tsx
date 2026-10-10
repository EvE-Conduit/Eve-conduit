// A page's history: every revision, what each one changed, and putting an old one back.
import { api, Avatar, Button, Card, cn, ConfirmDialog, dateTime, EmptyState, PageHeader, Segmented, Skeleton, timeAgo, toast } from "@conduit/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

import { ArrowLeft, Clock, RotateCcw } from "./icons";
import { Markdown } from "./markdown";
import { BASE, HOME, type History, type Revision } from "./types";

type Op = { kind: "same" | "add" | "del"; text: string };

/** Line by line: what the newer text adds and removes compared with the older one (longest common subsequence). */
export function diffLines(older: string, newer: string): Op[] | null {
  const a = older.split("\n");
  const b = newer.split("\n");
  if (a.length * b.length > 4_000_000) return null; // too big to compare in the browser
  const n = a.length;
  const m = b.length;
  const table = new Uint32Array((n + 1) * (m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      table[i * (m + 1) + j] = a[i] === b[j] ? table[(i + 1) * (m + 1) + j + 1]! + 1 : Math.max(table[(i + 1) * (m + 1) + j]!, table[i * (m + 1) + j + 1]!);
    }
  }
  const out: Op[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      out.push({ kind: "same", text: a[i]! });
      i++;
      j++;
    } else if (table[(i + 1) * (m + 1) + j]! >= table[i * (m + 1) + j + 1]!) {
      out.push({ kind: "del", text: a[i++]! });
    } else {
      out.push({ kind: "add", text: b[j++]! });
    }
  }
  while (i < n) out.push({ kind: "del", text: a[i++]! });
  while (j < m) out.push({ kind: "add", text: b[j++]! });
  return out;
}

/** The diff with unchanged stretches folded down to a little context around each change. */
function Diff({ older, newer }: { older: string; newer: string }) {
  const ops = useMemo(() => diffLines(older, newer), [older, newer]);
  if (!ops) return <p className="text-sm text-subtle">These revisions are too long to compare here.</p>;
  if (ops.every((o) => o.kind === "same")) return <p className="text-sm text-subtle">The text is the same.</p>;
  const rows: (Op | { kind: "skip"; count: number })[] = [];
  const CONTEXT = 3;
  for (let k = 0; k < ops.length; k++) {
    const op = ops[k]!;
    if (op.kind !== "same") {
      rows.push(op);
      continue;
    }
    // How long is this unchanged stretch?
    let end = k;
    while (end < ops.length && ops[end]!.kind === "same") end++;
    const len = end - k;
    const atStart = k === 0;
    const atEnd = end === ops.length;
    const keepBefore = atStart ? 0 : CONTEXT;
    const keepAfter = atEnd ? 0 : CONTEXT;
    if (len <= keepBefore + keepAfter + 1) {
      for (let x = k; x < end; x++) rows.push(ops[x]!);
    } else {
      for (let x = k; x < k + keepBefore; x++) rows.push(ops[x]!);
      rows.push({ kind: "skip", count: len - keepBefore - keepAfter });
      for (let x = end - keepAfter; x < end; x++) rows.push(ops[x]!);
    }
    k = end - 1;
  }
  return (
    <pre className="overflow-x-auto border border-border font-mono text-[13px] leading-relaxed">
      {rows.map((r, i) =>
        r.kind === "skip" ? (
          <div key={i} className="bg-surface-2 px-3 py-0.5 text-subtle">··· {r.count} unchanged {r.count === 1 ? "line" : "lines"}</div>
        ) : (
          <div key={i} className={cn("px-3", r.kind === "add" && "bg-success-soft text-success-fg", r.kind === "del" && "bg-danger-soft text-danger-fg line-through decoration-danger/40")}>
            <span className="mr-2 inline-block w-3 select-none text-subtle">{r.kind === "add" ? "+" : r.kind === "del" ? "−" : " "}</span>
            {r.text || " "}
          </div>
        ),
      )}
    </pre>
  );
}

export function HistoryPage() {
  const { slug } = useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ["wiki", "history", slug], queryFn: () => api.get<History>(`${BASE}/pages/${encodeURIComponent(slug!)}/history`), enabled: !!slug });
  const [selected, setSelected] = useState<number | null>(null);
  const [view, setView] = useState<"changes" | "text">("changes");
  const [restoring, setRestoring] = useState(false);
  useEffect(() => {
    if (data && selected === null && data.revisions[0]) setSelected(data.revisions[0].number);
  }, [data, selected]);
  const latest = data?.revisions[0]?.number ?? null;
  const current = useQuery({
    queryKey: ["wiki", "revision", slug, selected],
    queryFn: () => api.get<Revision>(`${BASE}/pages/${encodeURIComponent(slug!)}/history/${selected}`),
    enabled: !!slug && selected !== null,
  });
  const prevNumber = data && selected !== null ? data.revisions.find((r) => r.number < selected)?.number ?? null : null;
  const previous = useQuery({
    queryKey: ["wiki", "revision", slug, prevNumber],
    queryFn: () => api.get<Revision>(`${BASE}/pages/${encodeURIComponent(slug!)}/history/${prevNumber}`),
    enabled: !!slug && prevNumber !== null,
  });
  const restore = useMutation({
    mutationFn: (number: number) => api.post(`${BASE}/pages/${encodeURIComponent(slug!)}/restore/${number}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wiki"] });
      toast.success(`Revision ${selected} restored`);
      navigate(slug === "home" ? HOME : `${HOME}/${slug}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const back = slug === "home" ? HOME : `${HOME}/${slug}`;
  const sel = data?.revisions.find((r) => r.number === selected) ?? null;

  return (
    <div className="mx-auto max-w-6xl">
      <Link to={back} className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-text"><ArrowLeft /> {data?.page.title ?? "Page"}</Link>
      <PageHeader eyebrow="Wiki" title="History" icon={<Clock />} description={data ? `${data.revisions.length} ${data.revisions.length === 1 ? "revision" : "revisions"} of "${data.page.title}".` : undefined} />
      {isLoading || !data ? (
        <Skeleton className="h-64" />
      ) : data.revisions.length === 0 ? (
        <Card><EmptyState icon={<Clock />} title="No history yet" /></Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <Card className="self-start overflow-hidden">
            <ol className="divide-y divide-border">
              {data.revisions.map((r) => (
                <li key={r.number}>
                  <button
                    type="button"
                    onClick={() => setSelected(r.number)}
                    aria-current={r.number === selected ? "true" : undefined}
                    className={cn("flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-hover", r.number === selected && "bg-accent-soft")}
                  >
                    <span className="mt-0.5 w-8 shrink-0 font-mono text-xs text-subtle">r{r.number}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-text">{r.note || (r.number === 1 ? "Written" : "Edited")}</span>
                      <span className="mt-0.5 flex items-center gap-1.5 text-xs text-subtle">
                        {r.author && <Avatar src={r.author.portrait ?? undefined} name={r.author.name} size="xs" />}
                        <span className="truncate">{r.author?.name ?? "Unknown"}</span>
                        <span>·</span>
                        <time dateTime={r.created_at} title={dateTime(r.created_at)}>{timeAgo(r.created_at)}</time>
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </Card>
          <div className="min-w-0 space-y-3">
            {sel && (
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-text">Revision {sel.number}{sel.number === latest ? " (current)" : ""} · {sel.title}</div>
                  <div className="text-xs text-subtle">{dateTime(sel.created_at)}{sel.note ? ` · ${sel.note}` : ""}</div>
                </div>
                <Segmented<"changes" | "text">
                  value={view}
                  onChange={setView}
                  size="sm"
                  options={[{ value: "changes", label: prevNumber === null ? "Changes" : `Changes since r${prevNumber}` }, { value: "text", label: "As it looked" }]}
                />
                {data.can_edit && sel.number !== latest && (
                  <Button variant="secondary" size="sm" onClick={() => setRestoring(true)}><RotateCcw /> Restore</Button>
                )}
              </div>
            )}
            <Card className="p-card">
              {current.isLoading || !current.data || (prevNumber !== null && previous.isLoading) ? (
                <Skeleton className="h-48" />
              ) : view === "text" ? (
                (current.data.body ?? "").trim() ? <Markdown text={current.data.body ?? ""} linkBase={HOME} /> : <p className="text-sm text-subtle">The page was empty.</p>
              ) : (
                <Diff older={prevNumber !== null ? previous.data?.body ?? "" : ""} newer={current.data.body ?? ""} />
              )}
            </Card>
          </div>
        </div>
      )}
      <ConfirmDialog
        open={restoring}
        onOpenChange={setRestoring}
        title={`Restore revision ${selected}?`}
        description="The page's title and text go back to how they were then. Nothing is lost: this becomes a new revision."
        confirmLabel={<><RotateCcw /> Restore</>}
        onConfirm={() => selected !== null && restore.mutateAsync(selected)}
      />
    </div>
  );
}
