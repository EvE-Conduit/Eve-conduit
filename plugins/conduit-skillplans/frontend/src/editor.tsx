// Creating and editing a plan: paste from the game, add skills or everything a ship needs, reorder and remove.
import {
  Alert, api, Button, Card, CardHeader, Dialog, EmptyState, Field, Input, PageHeader, SearchInput, Segmented, Skeleton, sp, Spinner,
  SwitchRow, Textarea, toast,
} from "@conduit/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

import { Cap, Down, Paste, Plus, Ship, Up, X } from "./icons";
import { useOverview } from "./home";
import { usePlan } from "./plan";
import { BASE, type Lookup, type PlanDetail, ROMAN, type Step } from "./types";

type Pair = [number, number];

function useDebounced<T>(value: T, ms = 300): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export function EditorPage() {
  const { id } = useParams();
  const { data: plan, isLoading } = usePlan(id);
  if (id && (isLoading || !plan)) return <Skeleton className="h-96" />;
  return <Editor key={plan?.id ?? "new"} plan={plan} />;
}

function Editor({ plan }: { plan?: PlanDetail }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: overview } = useOverview();
  const [form, setForm] = useState({
    name: plan?.name ?? "", description: plan?.description ?? "", category: plan?.category ?? "", shared: plan?.shared ?? false,
  });
  const [steps, setSteps] = useState<Step[]>(plan?.steps_detail ?? []);
  const [totalSp, setTotalSp] = useState(plan?.total_sp ?? 0);
  const [pasting, setPasting] = useState(false);

  // Every change goes through the server, which puts prerequisites first and adds missing ones.
  const normalise = useMutation({
    mutationFn: (skills: Pair[]) => api.post<{ steps: Step[]; total_sp: number }>(`${BASE}/normalise`, { skills }),
    onSuccess: (r) => {
      setSteps(r.steps);
      setTotalSp(r.total_sp);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const pairs = (list = steps): Pair[] => list.map((s) => [s.skill_id, s.level]);
  const add = (more: Pair[]) => normalise.mutate([...pairs(), ...more]);
  const remove = (i: number) => {
    const { skill_id, level } = steps[i];
    // Higher levels of the same skill go too.
    normalise.mutate(pairs(steps.filter((s) => !(s.skill_id === skill_id && s.level >= level))));
  };
  const move = (i: number, by: number) => {
    const j = i + by;
    if (j < 0 || j >= steps.length) return;
    const next = [...steps];
    [next[i], next[j]] = [next[j], next[i]];
    normalise.mutate(pairs(next));
  };

  const save = useMutation({
    mutationFn: () => {
      const body = { ...form, skills: pairs() };
      return plan ? api.put<PlanDetail>(`${BASE}/plans/${plan.id}`, body) : api.post<PlanDetail>(`${BASE}/plans`, body);
    },
    onSuccess: (p) => {
      qc.invalidateQueries({ queryKey: ["skillplans"] });
      toast.success(`${p.name} saved`);
      navigate(`/p/skillplans/${p.id}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader
        eyebrow={<Link to="/p/skillplans" className="hover:text-text">Skill Plans</Link>}
        title={plan ? `Edit ${plan.name}` : "New skill plan"}
        icon={<Cap />}
        actions={
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => navigate(plan ? `/p/skillplans/${plan.id}` : "/p/skillplans")}>Cancel</Button>
            <Button variant="primary" disabled={!form.name.trim()} loading={save.isPending} onClick={() => save.mutate()}>Save plan</Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Card>
          <CardHeader
            title={`Skills · ${steps.length} levels · ${sp(totalSp)}`}
            description="Prerequisites are added and kept ahead of the skills that need them. Removing a level also removes the levels above it."
            actions={normalise.isPending && <Spinner />}
          />
          {steps.length === 0 ? (
            <EmptyState icon={<Cap />} title="No skills yet" description="Paste a list from the game, or add skills and ships on the right." />
          ) : (
            <ol className="divide-y divide-border">
              {steps.map((s, i) => (
                <li key={`${s.skill_id}-${s.level}`} className="flex items-center gap-2 px-card py-1.5">
                  <span className="w-8 font-mono text-xs text-subtle">{i + 1}</span>
                  <img src={s.icon} alt="" className="size-6" loading="lazy" />
                  <span className="min-w-0 flex-1 truncate text-sm">{s.name} {ROMAN[s.level]}</span>
                  <span className="hidden text-xs text-subtle sm:inline">{s.group}</span>
                  <Button size="icon-xs" variant="ghost" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}><Up /></Button>
                  <Button size="icon-xs" variant="ghost" aria-label="Move down" disabled={i === steps.length - 1} onClick={() => move(i, 1)}><Down /></Button>
                  <Button size="icon-xs" variant="ghost" aria-label="Remove" onClick={() => remove(i)}><X /></Button>
                </li>
              ))}
            </ol>
          )}
        </Card>

        <div className="space-y-4">
          <Card className="space-y-4 p-card">
            <Field label="Name" required>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ferox fleet ready" autoFocus={!plan} />
            </Field>
            <Field label="Category" hint="Optional, e.g. Doctrines, Industry, New players.">
              <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </Field>
            <Field label="Description">
              <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Field>
            {overview?.can_manage && (
              <SwitchRow label="Shared" description="Everyone sees shared plans, and group rules can require them."
                checked={form.shared} onCheckedChange={(v: boolean) => setForm({ ...form, shared: v })} />
            )}
          </Card>

          <Card className="space-y-3 p-card">
            <Button className="w-full" onClick={() => setPasting(true)}><Paste /> Paste from EVE</Button>
            <AddSkill onAdd={(sid, lvl) => add([[sid, lvl]])} />
            <AddItem onAdd={add} />
          </Card>
        </div>
      </div>

      {pasting && <PasteDialog onClose={() => setPasting(false)} onAdd={(more) => { add(more); setPasting(false); }} />}
    </>
  );
}

function useLookup(kind: "skills" | "types", q: string) {
  const dq = useDebounced(q.trim());
  return useQuery({
    queryKey: ["skillplans", kind, dq],
    queryFn: () => api.get<Lookup[]>(`${BASE}/${kind}?q=${encodeURIComponent(dq)}`),
    enabled: dq.length >= (kind === "types" ? 2 : 1),
  });
}

function Results({ items, onPick }: { items: Lookup[] | undefined; onPick: (l: Lookup) => void }) {
  if (!items?.length) return null;
  return (
    <ul className="max-h-60 overflow-y-auto border border-border">
      {items.map((l) => (
        <li key={l.id}>
          <button type="button" onClick={() => onPick(l)} className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm hover:bg-hover">
            <img src={l.icon} alt="" className="size-5" loading="lazy" />
            <span className="flex-1 truncate">{l.name}</span>
            <span className="text-xs text-subtle">{l.group}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function AddSkill({ onAdd }: { onAdd: (skillId: number, level: number) => void }) {
  const [q, setQ] = useState("");
  const [level, setLevel] = useState("4");
  const { data } = useLookup("skills", q);
  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-muted">Add a skill</div>
      <Segmented size="sm" value={level} onChange={setLevel} aria-label="Level"
        options={[1, 2, 3, 4, 5].map((l) => ({ value: String(l), label: ROMAN[l] }))} />
      <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Skill name" />
      <Results items={data} onPick={(l) => { onAdd(l.id, Number(level)); setQ(""); toast.success(`${l.name} ${ROMAN[Number(level)]} added`); }} />
    </div>
  );
}

function AddItem({ onAdd }: { onAdd: (pairs: Pair[]) => void }) {
  const [q, setQ] = useState("");
  const { data } = useLookup("types", q);
  const pick = async (l: Lookup) => {
    const r = await api.get<{ name: string; skills: Pair[] }>(`${BASE}/types/${l.id}/requirements`);
    onAdd(r.skills);
    setQ("");
    toast.success(`Added what ${r.name} needs`);
  };
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted"><Ship className="size-3.5" /> Add everything a ship or module needs</div>
      <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ship, module, drone..." />
      <Results items={data} onPick={pick} />
    </div>
  );
}

function PasteDialog({ onClose, onAdd }: { onClose: () => void; onAdd: (pairs: Pair[]) => void }) {
  const [text, setText] = useState("");
  const [problems, setProblems] = useState<string[]>([]);
  const parse = useMutation({
    mutationFn: () => api.post<{ skills: Pair[]; problems: string[] }>(`${BASE}/parse`, { text }),
    onSuccess: (r) => {
      if (r.problems.length) setProblems(r.problems);
      if (r.skills.length && !r.problems.length) onAdd(r.skills);
      else if (!r.skills.length) toast.error("No skills found in that text");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title="Paste from EVE"
      description="In the game, copy a skill plan or your skill queue (or any list with one skill and level per line, like “Gunnery 4” or “Gunnery IV”) and paste it here."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          {problems.length > 0 && parse.data?.skills.length ? (
            <Button variant="primary" onClick={() => onAdd(parse.data!.skills)}><Plus /> Add the {parse.data.skills.length} skills found</Button>
          ) : (
            <Button variant="primary" disabled={!text.trim()} loading={parse.isPending} onClick={() => parse.mutate()}><Plus /> Add skills</Button>
          )}
        </>
      }
    >
      <div className="space-y-3">
        <Textarea rows={12} value={text} onChange={(e) => { setText(e.target.value); setProblems([]); }} className="font-mono text-xs"
          placeholder={"Spaceship Command 3\nCaldari Cruiser 4\nMedium Hybrid Turret 4"} autoFocus />
        {problems.length > 0 && (
          <Alert tone="warning" title={`${problems.length} line${problems.length === 1 ? "" : "s"} couldn't be read`}>
            <ul className="mt-1 list-inside list-disc font-mono text-xs">{problems.map((p) => <li key={p}>{p}</li>)}</ul>
          </Alert>
        )}
      </div>
    </Dialog>
  );
}
