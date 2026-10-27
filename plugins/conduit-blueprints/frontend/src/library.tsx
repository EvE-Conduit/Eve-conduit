// The library: every blueprint the member may see, grouped by type, with filters. Opening one shows each copy and
// original and where it is, and asks for copies or a loan.
import {
  api, Badge, Button, Card, Dialog, EmptyState, Field, Input, num, PageHeader, SearchInput, Segmented, Select, Skeleton, Table,
  TableToolbar, Td, Textarea, Th, THead, timeAgo, toast, Tr,
} from "@conduit/sdk";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link } from "react-router";

import { Copy, Handshake, Refresh, Scroll } from "./icons";
import { BlueprintIcon, errorToast, Research, useInvalidate } from "./shared";
import { BASE, type Group, type Library, type RequestKind, type TypeDetail } from "./types";

type Kind = "" | "original" | "copy";

export function LibraryPage() {
  const [q, setQ] = useState("");
  const [dq, setDq] = useState("");
  const [kind, setKind] = useState<Kind>("");
  const [category, setCategory] = useState("");
  const [source, setSource] = useState("");
  const [meMin, setMeMin] = useState("");
  const [corporation, setCorporation] = useState("");
  const [open, setOpen] = useState<Group | null>(null);
  useEffect(() => {
    const t = setTimeout(() => setDq(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);
  const params = new URLSearchParams();
  if (dq) params.set("q", dq);
  if (kind) params.set("kind", kind);
  if (category) params.set("category", category);
  if (source) params.set("source", source);
  if (meMin !== "") params.set("me_min", meMin);
  if (corporation) params.set("corporation", corporation);
  const { data, isLoading } = useQuery({
    queryKey: ["blueprints", "library", params.toString()],
    queryFn: () => api.get<Library>(`${BASE}/library?${params}`),
    placeholderData: (prev) => prev,
  });
  const sync = useMutation({
    mutationFn: () => api.post<{ queued: number }>(`${BASE}/sync`),
    onSuccess: (r) => toast.success(`Reading ${r.queued} corporation${r.queued === 1 ? "" : "s"} again; refresh in a minute.`),
    onError: errorToast,
  });
  return (
    <>
      <PageHeader
        eyebrow="Industry"
        title="Blueprint Library"
        icon={<Scroll />}
        description="Every blueprint the corporations own, and originals members share. Open one to ask for copies or to borrow it."
        actions={
          <div className="flex gap-2">
            <Link to="/p/blueprints/requests"><Button variant="ghost">My requests</Button></Link>
            {data?.can_manage && <Button variant="ghost" loading={sync.isPending} onClick={() => sync.mutate()}><Refresh /> Read again</Button>}
          </div>
        }
      />
      <Card>
        <TableToolbar>
          <SearchInput className="w-full sm:w-64" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Blueprint or what it makes" aria-label="Search" />
          <Segmented<Kind>
            size="sm"
            value={kind}
            onChange={setKind}
            aria-label="Originals or copies"
            options={[{ value: "", label: "All" }, { value: "original", label: "BPO" }, { value: "copy", label: "BPC" }]}
          />
          <Select className="h-9 w-auto" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category"
            options={[{ value: "", label: "Every category" }, ...(data?.categories ?? []).map((c) => ({ value: c.name, label: `${c.name} (${c.count})` }))]} />
          <Select className="h-9 w-auto" value={source} onChange={(e) => setSource(e.target.value)} aria-label="Whose"
            options={[{ value: "", label: "Corporations and members" }, { value: "corporation", label: "Corporations" }, { value: "personal", label: "Members' shared" }]} />
          {(data?.corporations.length ?? 0) > 1 && (
            <Select className="h-9 w-auto" value={corporation} onChange={(e) => setCorporation(e.target.value)} aria-label="Corporation"
              options={[{ value: "", label: "Every corporation" }, ...data!.corporations.map((c) => ({ value: String(c.id), label: c.ticker || c.name }))]} />
          )}
          <Input className="w-24" type="number" min={0} max={10} value={meMin} onChange={(e) => setMeMin(e.target.value)} placeholder="ME ≥" aria-label="Lowest ME" />
        </TableToolbar>
        {isLoading || !data ? (
          <div className="p-card"><Skeleton className="h-64" /></div>
        ) : data.groups.length === 0 ? (
          <EmptyState
            icon={<Scroll />}
            title="No blueprints here"
            description={data.corporations.length === 0
              ? "The library fills once a Director's login can read the corporation's blueprints."
              : "Nothing matches these filters."}
          />
        ) : (
          <>
            <Table>
              <THead>
                <tr>
                  <Th>Blueprint</Th>
                  <Th>Makes</Th>
                  <Th align="right">BPO</Th>
                  <Th align="right">BPC</Th>
                  <Th>Best original</Th>
                  <Th>Owner</Th>
                </tr>
              </THead>
              <tbody>
                {data.groups.map((g) => (
                  <Tr key={g.type_id} interactive onClick={() => setOpen(g)}>
                    <Td>
                      <div className="flex items-center gap-2">
                        <BlueprintIcon src={g.icon} name={g.name} />
                        <span className="font-medium">{g.name}</span>
                      </div>
                    </Td>
                    <Td>
                      {g.product ? (
                        <div className="text-sm">{g.product.name}<div className="text-xs text-muted">{g.product.group}</div></div>
                      ) : <span className="text-subtle">—</span>}
                    </Td>
                    <Td numeric>{g.originals ? num(g.originals) : "—"}</Td>
                    <Td numeric>
                      {g.copies ? <span title={`${num(g.copy_runs)} runs in all`}>{num(g.copies)}</span> : "—"}
                    </Td>
                    <Td><Research me={g.best_me} te={g.best_te} /></Td>
                    <Td>
                      <div className="flex flex-wrap gap-1">
                        {g.owners.map((o) => <Badge key={o} tone="neutral">{o}</Badge>)}
                        {g.personal > 0 && <Badge tone="info">{g.personal} personal</Badge>}
                      </div>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
            <div className="flex flex-wrap justify-between gap-2 px-card py-3 text-xs text-muted">
              <span>{data.truncated ? `First ${num(data.groups.length)} of ${num(data.total)}; narrow the search to see the rest.` : `${num(data.total)} blueprint${data.total === 1 ? "" : "s"}`}</span>
              <span>
                {data.corporations.map((c) => `${c.ticker || c.name} read ${c.synced_at ? timeAgo(c.synced_at) : "never"}`).join(" · ")}
              </span>
            </div>
          </>
        )}
      </Card>
      {open && <TypeDialog group={open} onClose={() => setOpen(null)} />}
    </>
  );
}

function TypeDialog({ group, onClose }: { group: Group; onClose: () => void }) {
  const [asking, setAsking] = useState<RequestKind | null>(null);
  const { data } = useQuery({ queryKey: ["blueprints", "type", group.type_id], queryFn: () => api.get<TypeDetail>(`${BASE}/library/${group.type_id}`) });
  if (asking && data) return <RequestDialog detail={data} kind={asking} onClose={onClose} />;
  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={group.name}
      description={group.product ? `Makes ${group.product.name} (${group.product.group})` : undefined}
      size="xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Close</Button>
          <Button variant="secondary" disabled={!data?.has_original} onClick={() => setAsking("loan")}><Handshake /> Borrow the original</Button>
          <Button variant="primary" disabled={!data} onClick={() => setAsking("copy")}><Copy /> Ask for copies</Button>
        </>
      }
    >
      {!data ? (
        <Skeleton className="h-40" />
      ) : (
        <div className="space-y-3">
          {data.open_requests > 0 && <p className="text-xs text-muted">{data.open_requests} request{data.open_requests === 1 ? "" : "s"} for this blueprint waiting already.</p>}
          <Table>
            <THead>
              <tr>
                <Th>Kind</Th>
                <Th>Research</Th>
                <Th align="right">Runs</Th>
                <Th>Owner</Th>
                <Th>Where</Th>
              </tr>
            </THead>
            <tbody>
              {data.entries.map((e) => (
                <Tr key={e.id}>
                  <Td>
                    <div className="flex items-center gap-1.5">
                      <Badge tone={e.copy ? "neutral" : "accent"}>{e.copy ? "Copy" : "Original"}</Badge>
                      {e.quantity > 1 && <span className="font-mono text-xs">× {num(e.quantity)}</span>}
                    </div>
                  </Td>
                  <Td><Research me={e.me} te={e.te} /></Td>
                  <Td numeric>{e.runs < 0 ? "∞" : num(e.runs)}</Td>
                  <Td>
                    {e.source === "personal" ? (
                      <div className="flex items-center gap-1.5"><Badge tone="info">Personal</Badge><span>{e.owner.name}</span></div>
                    ) : (
                      <span>{e.owner.ticker ? `[${e.owner.ticker}] ` : ""}{e.owner.name}</span>
                    )}
                  </Td>
                  <Td>
                    <div className="text-sm">{e.location?.name ?? "Unknown location"}</div>
                    {(e.location?.system || e.division) && (
                      <div className="text-xs text-muted">{[e.location?.system, e.division].filter(Boolean).join(" · ")}</div>
                    )}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
    </Dialog>
  );
}

function RequestDialog({ detail, kind, onClose }: { detail: TypeDetail; kind: RequestKind; onClose: () => void }) {
  const invalidate = useInvalidate();
  const { data: options } = useQuery({
    queryKey: ["blueprints", "options"],
    queryFn: () => api.get<{ projects: { id: number; name: string }[] }>(`${BASE}/options`),
    staleTime: 300_000,
  });
  const [form, setForm] = useState({ runs: "1", copies: "1", min_me: "", min_te: "", loan_days: "7", note: "", project_id: "" });
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));
  const send = useMutation({
    mutationFn: () => {
      const optional = (v: string) => (v === "" ? null : Number(v));
      return api.post(`${BASE}/requests`, {
        kind,
        type_id: detail.type_id,
        runs: Number(form.runs) || 1,
        copies: Number(form.copies) || 1,
        min_me: optional(form.min_me),
        min_te: optional(form.min_te),
        loan_days: kind === "loan" ? Number(form.loan_days) || 7 : null,
        note: form.note,
        project_id: optional(form.project_id),
      });
    },
    onSuccess: () => {
      toast.success("Asked. The library managers are told, and you hear back here and under the bell.");
      invalidate();
      onClose();
    },
    onError: errorToast,
  });
  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={kind === "copy" ? `Copies of ${detail.name}` : `Borrow ${detail.name}`}
      description={kind === "copy"
        ? `Best original: ME ${detail.best_me ?? "—"} / TE ${detail.best_te ?? "—"}.`
        : "You get the original for the days you ask; the due date is set when it's handed over."}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={send.isPending} onClick={() => send.mutate()}>Send request</Button>
        </>
      }
    >
      <div className="space-y-4">
        {kind === "copy" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Runs per copy"><Input type="number" min={1} max={5000} value={form.runs} onChange={(e) => set({ runs: e.target.value })} /></Field>
            <Field label="Copies"><Input type="number" min={1} max={100} value={form.copies} onChange={(e) => set({ copies: e.target.value })} /></Field>
            <Field label="ME at least" hint="Empty: whatever the library has."><Input type="number" min={0} max={10} value={form.min_me} onChange={(e) => set({ min_me: e.target.value })} /></Field>
            <Field label="TE at least"><Input type="number" min={0} max={20} step={2} value={form.min_te} onChange={(e) => set({ min_te: e.target.value })} /></Field>
          </div>
        ) : (
          <Field label="For how many days"><Input type="number" min={1} max={90} value={form.loan_days} onChange={(e) => set({ loan_days: e.target.value })} /></Field>
        )}
        {options && options.projects.length > 0 && (
          <Field label="For an industry project" hint="Optional.">
            <Select value={form.project_id} onChange={(e) => set({ project_id: e.target.value })}
              options={[{ value: "", label: "None" }, ...options.projects.map((p) => ({ value: String(p.id), label: p.name }))]} />
          </Field>
        )}
        <Field label="Note">
          <Textarea rows={2} maxLength={500} value={form.note} onChange={(e) => set({ note: e.target.value })} placeholder="Where to drop them, when you need them…" />
        </Field>
      </div>
    </Dialog>
  );
}
