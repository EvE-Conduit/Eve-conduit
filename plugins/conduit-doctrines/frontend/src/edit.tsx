// Managing doctrines (permission doctrines.manage_doctrines): the fit editor (paste from the game, or start from an
// in-game fitting), the doctrine dialog and the list of every fit.
import {
  api, Badge, Button, Callout, Card, ConfirmDialog, Dialog, EmptyState, Field, Input, PageHeader, SearchInput, Select, Skeleton,
  SwitchRow, Table, Td, Textarea, Th, THead, toast, Tr,
} from "@conduit/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";

import { useOverview } from "./home";
import { Down, Plus, Swords, Trash, Up, Upload } from "./icons";
import { FitDisplay } from "./ring";
import { RoleBadge } from "./shared";
import { BASE, type DoctrineDetail, type FitBrief, type FitDetail, type ParseResult } from "./types";

function useDebounced<T>(value: T, ms = 500): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

const PLACEHOLDER = `[Rifter, Fleet Rifter]
Gyrostabilizer II
Small Armor Repairer II

1MN Afterburner II
Warp Scrambler II

125mm Gatling AutoCannon II, Republic Fleet EMP S
...`;

export function FitEditorPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const existing = useQuery({ queryKey: ["doctrines", "fit", id], queryFn: () => api.get<FitDetail>(`${BASE}/fits/${id}`), enabled: !!id });
  if (id && !existing.data) return existing.error ? <EmptyState icon={<Swords />} title="No such fit" /> : <Skeleton className="h-96" />;
  return <FitEditor key={id ?? "new"} fit={existing.data} doctrine={params.get("doctrine")} />;
}

interface Recommended {
  skill_id: number;
  name: string;
  level: number;
}

function FitEditor({ fit, doctrine }: { fit?: FitDetail; doctrine: string | null }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const overview = useOverview();
  const [eft, setEft] = useState(fit?.eft ?? "");
  const [name, setName] = useState(fit?.name ?? "");
  const [role, setRole] = useState(fit?.role ?? "");
  const [notes, setNotes] = useState(fit?.notes ?? "");
  const [doctrines, setDoctrines] = useState<number[]>(fit ? fit.doctrines.map((d) => d.id) : doctrine ? [Number(doctrine)] : []);
  const [recommended, setRecommended] = useState<Recommended[]>(fit?.recommended ?? []);
  const text = useDebounced(eft.trim());

  const preview = useQuery({
    queryKey: ["doctrines", "parse", text],
    queryFn: () => api.post<ParseResult>(`${BASE}/parse`, { eft: text }),
    enabled: !!text,
    retry: false,
  });
  const ingame = useQuery({ queryKey: ["doctrines", "my-fittings"], queryFn: () => api.get<{ id: string; name: string; character: string; ship: string; eft: string }[]>(`${BASE}/my-fittings`) });

  const save = useMutation({
    mutationFn: () => {
      const body = { eft, name, role, notes, doctrines, recommended: recommended.map((r) => [r.skill_id, r.level]) };
      return fit ? api.put<FitDetail>(`${BASE}/fits/${fit.id}`, body) : api.post<FitDetail>(`${BASE}/fits`, body);
    },
    onSuccess: (saved) => {
      qc.invalidateQueries({ queryKey: ["doctrines"] });
      if (saved.unknown?.length) toast.warning(`Saved without ${saved.unknown.length} line${saved.unknown.length === 1 ? "" : "s"} nobody recognised`);
      else toast.success(`${saved.name} saved`);
      navigate(`/p/doctrines/fit/${saved.id}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const parsed = preview.data;
  const blocked = !parsed || parsed.problems.length > 0;

  return (
    <>
      <PageHeader
        eyebrow={<Link to="/p/doctrines" className="hover:text-text">Doctrines</Link>}
        title={fit ? `Edit ${fit.name}` : "New fit"}
        icon={<Swords />}
        description="Paste the fit from the game (Fitting window → Copy to clipboard) or Pyfa. Modules go in the right slots whatever order they're in."
        actions={
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
            <Button variant="primary" disabled={blocked} loading={save.isPending} onClick={() => save.mutate()}>Save fit</Button>
          </div>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card className="space-y-4 p-card">
            {ingame.data && ingame.data.length > 0 && (
              <Field label="Start from one of your in-game fittings" hint="Your characters' saved fittings, as last synced.">
                <Select value="" onChange={(e) => {
                  const f = ingame.data.find((x) => x.id === e.target.value);
                  if (f) {
                    setEft(f.eft);
                    if (!name) setName(f.name);
                  }
                }}>
                  <option value="">Pick a fitting…</option>
                  {ingame.data.map((f) => <option key={f.id} value={f.id}>{f.ship}: {f.name} ({f.character})</option>)}
                </Select>
              </Field>
            )}
            <Field label="Fit" required>
              <Textarea rows={14} value={eft} onChange={(e) => setEft(e.target.value)} placeholder={PLACEHOLDER} className="font-mono text-xs" spellCheck={false} />
            </Field>
            {preview.error && <Callout tone="danger">{(preview.error as Error).message}</Callout>}
            {parsed && parsed.problems.length > 0 && (
              <Callout tone="danger" title="This fit can't be fitted">
                <ul className="list-disc pl-4">{parsed.problems.map((p) => <li key={p}>{p}</li>)}</ul>
              </Callout>
            )}
            {parsed && parsed.unknown.length > 0 && (
              <Callout tone="warning" title="Lines nobody recognised (they'll be left out)">
                <ul className="list-disc pl-4 font-mono text-xs">{parsed.unknown.map((p) => <li key={p}>{p}</li>)}</ul>
              </Callout>
            )}
          </Card>
          <Card className="space-y-4 p-card">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" hint={parsed && !name ? `From the paste: ${parsed.name}` : undefined}>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={parsed?.name ?? "Fleet Rifter"} maxLength={100} />
              </Field>
              <Field label="Role">
                <Input value={role} onChange={(e) => setRole(e.target.value)} list="doctrine-roles" placeholder="DPS, Logistics…" maxLength={40} />
                <datalist id="doctrine-roles">{overview.data?.roles.map((r) => <option key={r} value={r} />)}</datalist>
              </Field>
            </div>
            <Field label="Doctrines">
              <div className="flex flex-wrap gap-2">
                {overview.data?.doctrines.map((d) => {
                  const on = doctrines.includes(d.id);
                  return (
                    <button key={d.id} type="button" onClick={() => setDoctrines(on ? doctrines.filter((x) => x !== d.id) : [...doctrines, d.id])}
                      className={`border px-2.5 py-1 text-sm ${on ? "border-accent bg-accent-soft text-accent-ink" : "border-border text-muted hover:bg-hover"}`}>
                      {d.name}
                    </button>
                  );
                })}
                {overview.data?.doctrines.length === 0 && <span className="text-sm text-subtle">No doctrines yet; you can add the fit to one later.</span>}
              </div>
            </Field>
            <Field label="Notes" hint="Shown on the fit: how to fly it, what to bring.">
              <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </Field>
            <RecommendedEditor value={recommended} onChange={setRecommended} />
          </Card>
        </div>
        <div>
          {parsed ? (
            <FitDisplay view={parsed.view} />
          ) : (
            <Card>
              <EmptyState icon={<Upload />} title="Paste a fit to see it" description="It's shown here like the in-game fitting window as you type." />
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

function RecommendedEditor({ value, onChange }: { value: Recommended[]; onChange: (v: Recommended[]) => void }) {
  const [q, setQ] = useState("");
  const dq = useDebounced(q.trim(), 300);
  const { data: hits } = useQuery({
    queryKey: ["doctrines", "skills", dq],
    queryFn: () => api.get<{ id: number; name: string; group: string }[]>(`${BASE}/skills?q=${encodeURIComponent(dq)}`),
    enabled: dq.length >= 2,
  });
  return (
    <Field label="Recommended skills" hint="On top of what the fit needs; pilots with them too show as Ready.">
      <div className="space-y-2">
        {value.map((r) => (
          <div key={r.skill_id} className="flex items-center gap-2">
            <span className="flex-1 text-sm">{r.name}</span>
            <Select value={String(r.level)} className="w-20" aria-label={`${r.name} level`}
              onChange={(e) => onChange(value.map((x) => (x.skill_id === r.skill_id ? { ...x, level: Number(e.target.value) } : x)))}>
              {[1, 2, 3, 4, 5].map((l) => <option key={l} value={l}>{l}</option>)}
            </Select>
            <Button size="icon-sm" variant="ghost" aria-label={`Remove ${r.name}`} onClick={() => onChange(value.filter((x) => x.skill_id !== r.skill_id))}><Trash /></Button>
          </div>
        ))}
        <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Add a skill…" />
        {hits && dq.length >= 2 && (
          <ul className="max-h-48 overflow-auto border border-border">
            {hits.filter((h) => !value.some((v) => v.skill_id === h.id)).map((h) => (
              <li key={h.id}>
                <button type="button" className="flex w-full justify-between px-3 py-1.5 text-left text-sm hover:bg-hover"
                  onClick={() => { onChange([...value, { skill_id: h.id, name: h.name, level: 4 }]); setQ(""); }}>
                  {h.name} <span className="text-xs text-subtle">{h.group}</span>
                </button>
              </li>
            ))}
            {hits.length === 0 && <li className="px-3 py-1.5 text-sm text-subtle">No skill matches</li>}
          </ul>
        )}
      </div>
    </Field>
  );
}

export function DoctrineDialog({ doctrine, onClose }: { doctrine?: DoctrineDetail; onClose: () => void }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const allFits = useQuery({ queryKey: ["doctrines", "all-fits"], queryFn: () => api.get<(FitBrief & { doctrines: string[] })[]>(`${BASE}/fits`) });
  const [form, setForm] = useState({
    name: doctrine?.name ?? "",
    description: doctrine?.description ?? "",
    order: doctrine?.order ?? 0,
    active: doctrine?.active ?? true,
    icon_type_id: doctrine?.icon_type_id ?? null as number | null,
  });
  const [fits, setFits] = useState<number[]>(doctrine?.fits.map((f) => f.id) ?? []);
  const [deleting, setDeleting] = useState(false);
  const byId = new Map((allFits.data ?? []).map((f) => [f.id, f]));
  const ships = [...new Map(fits.map((id) => byId.get(id)).filter(Boolean).map((f) => [f!.ship.id, f!.ship])).values()];

  const save = useMutation({
    mutationFn: () => {
      const body = { ...form, fits };
      return doctrine ? api.put<DoctrineDetail>(`${BASE}/doctrines/${doctrine.id}`, body) : api.post<DoctrineDetail>(`${BASE}/doctrines`, body);
    },
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: ["doctrines"] });
      toast.success(`${d.name} saved`);
      onClose();
      navigate(`/p/doctrines/${d.id}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const move = (i: number, by: number) => {
    const next = [...fits];
    const [x] = next.splice(i, 1);
    next.splice(i + by, 0, x);
    setFits(next);
  };

  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={doctrine ? `Edit ${doctrine.name}` : "New doctrine"}
      size="lg"
      footer={
        <>
          {doctrine && <Button variant="danger" className="mr-auto" onClick={() => setDeleting(true)}><Trash /> Delete</Button>}
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!form.name.trim()} loading={save.isPending} onClick={() => save.mutate()}>Save</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
          <Field label="Name" required>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Rifter Gang" autoFocus maxLength={100} />
          </Field>
          <Field label="Order" hint="Lower first">
            <Input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) || 0 })} />
          </Field>
        </div>
        <Field label="Description">
          <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="When we fly it, comms, staging…" />
        </Field>
        {ships.length > 0 && (
          <Field label="Picture">
            <Select value={String(form.icon_type_id ?? "")} onChange={(e) => setForm({ ...form, icon_type_id: e.target.value ? Number(e.target.value) : null })}>
              <option value="">The first fit's ship</option>
              {ships.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </Field>
        )}
        <SwitchRow label="Active" description="Retired doctrines stay for reference, listed last." checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
        <Field label="Fits" hint="In the order they're shown. New fits are added from the fit editor too.">
          <div className="space-y-1">
            {fits.map((id, i) => {
              const f = byId.get(id);
              return (
                <div key={id} className="flex items-center gap-2 border border-border px-2 py-1.5">
                  {f && <img src={f.ship.icon} alt="" className="size-6" />}
                  <span className="min-w-0 flex-1 truncate text-sm">{f ? `${f.name} (${f.ship.name})` : `Fit ${id}`}</span>
                  {f && <RoleBadge role={f.role} />}
                  <Button size="icon-sm" variant="ghost" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up"><Up /></Button>
                  <Button size="icon-sm" variant="ghost" disabled={i === fits.length - 1} onClick={() => move(i, 1)} aria-label="Move down"><Down /></Button>
                  <Button size="icon-sm" variant="ghost" onClick={() => setFits(fits.filter((x) => x !== id))} aria-label="Remove"><Trash /></Button>
                </div>
              );
            })}
            <Select value="" onChange={(e) => e.target.value && setFits([...fits, Number(e.target.value)])}>
              <option value="">Add an existing fit…</option>
              {(allFits.data ?? []).filter((f) => !fits.includes(f.id)).map((f) => <option key={f.id} value={f.id}>{f.ship.name}: {f.name}</option>)}
            </Select>
          </div>
        </Field>
      </div>
      {doctrine && (
        <ConfirmDialog
          open={deleting}
          onOpenChange={setDeleting}
          title={`Delete ${doctrine.name}?`}
          description="Its fits stay, so you can put them in another doctrine."
          confirmLabel="Delete doctrine"
          danger
          onConfirm={async () => {
            try {
              await api.delete(`${BASE}/doctrines/${doctrine.id}`);
            } catch (e) {
              toast.error((e as Error).message);
              throw e;
            }
            qc.invalidateQueries({ queryKey: ["doctrines"] });
            onClose();
            navigate("/p/doctrines");
          }}
        />
      )}
    </Dialog>
  );
}

/** Every fit, in a doctrine or not. */
export function AllFitsPage() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const { data, isLoading } = useQuery({ queryKey: ["doctrines", "all-fits"], queryFn: () => api.get<(FitBrief & { doctrines: string[] })[]>(`${BASE}/fits`) });
  const rows = (data ?? []).filter((f) => `${f.name} ${f.ship.name} ${f.role}`.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <>
      <PageHeader
        eyebrow={<Link to="/p/doctrines" className="hover:text-text">Doctrines</Link>}
        title="All fits"
        icon={<Swords />}
        actions={<Link to="/p/doctrines/fit/new"><Button variant="primary"><Plus /> New fit</Button></Link>}
      />
      <Card>
        <div className="p-card pb-0"><SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Fit, ship or role" className="w-64" /></div>
        {isLoading ? <Skeleton className="m-card h-40" /> : rows.length === 0 ? (
          <EmptyState icon={<Swords />} title={q ? "No fit matches" : "No fits yet"} />
        ) : (
          <Table>
            <THead>
              <tr>
                <Th>Fit</Th>
                <Th>Ship</Th>
                <Th>Doctrines</Th>
              </tr>
            </THead>
            <tbody>
              {rows.map((f) => (
                <Tr key={f.id} interactive onClick={() => navigate(`/p/doctrines/fit/${f.id}`)}>
                  <Td><span className="flex items-center gap-2 font-medium">{f.name} <RoleBadge role={f.role} /></span></Td>
                  <Td><span className="flex items-center gap-2 text-sm"><img src={f.ship.icon} alt="" className="size-6" />{f.ship.name}</span></Td>
                  <Td>{f.doctrines.length ? <span className="flex flex-wrap gap-1">{f.doctrines.map((d) => <Badge key={d} size="xs">{d}</Badge>)}</span> : <span className="text-sm text-subtle">None</span>}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
