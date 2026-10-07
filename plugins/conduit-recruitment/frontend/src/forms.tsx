// Setting up what applicants fill in (recruit.manage_forms).
import {
  api, Badge, Button, Card, CardBody, ConfirmDialog, Dialog, EmptyState, Field, Input, PageHeader, Select, Skeleton, Switch, Textarea, toast,
} from "@conduit/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router";

import { Back, Down, Form as FormIcon, Plus, Trash, Up } from "./icons";
import { BASE, type FormInfo, type Kind, type Question } from "./types";

interface FormsData {
  forms: FormInfo[];
  groups: { id: number; name: string }[];
}

interface Draft {
  id?: number;
  name: string;
  description: string;
  open: boolean;
  require_discord: boolean;
  order: number;
  accept_groups: number[];
  questions: (Question & { choicesText?: string })[];
}

const KINDS: { value: Kind; label: string }[] = [
  { value: "text", label: "Short answer" },
  { value: "long", label: "Long answer" },
  { value: "yesno", label: "Yes / no" },
  { value: "choice", label: "Pick one" },
];

const EXAMPLE: Draft = {
  name: "",
  description: "",
  open: true,
  require_discord: true,
  order: 0,
  accept_groups: [],
  questions: [
    { id: "", label: "How did you hear about us?", help: "", kind: "text", choices: [], required: false },
    { id: "", label: "What do you enjoy doing in EVE?", help: "PvP, industry, exploration, wormholes…", kind: "long", choices: [], required: true },
    { id: "", label: "Which time zone do you mostly play in?", help: "", kind: "choice", choices: ["EU", "US", "AU / Asia"], required: true },
    { id: "", label: "Can you use voice comms?", help: "", kind: "yesno", choices: [], required: false },
  ],
};

export function FormsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["recruit", "forms"], queryFn: () => api.get<FormsData>(`${BASE}/forms`) });
  const [draft, setDraft] = useState<Draft | null>(null);
  const [deleting, setDeleting] = useState<FormInfo | null>(null);
  const refresh = () => qc.invalidateQueries({ queryKey: ["recruit"] });

  const save = useMutation({
    mutationFn: (d: Draft) => {
      const body = { ...d, questions: d.questions.map(({ choicesText, ...q }) => ({ ...q, choices: q.kind === "choice" ? (choicesText ?? q.choices.join("\n")).split("\n") : [] })) };
      return d.id ? api.put(`${BASE}/forms/${d.id}`, body) : api.post(`${BASE}/forms`, body);
    },
    onSuccess: () => {
      toast.success("Form saved");
      setDraft(null);
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const toggle = useMutation({
    mutationFn: (f: FormInfo) => api.put(`${BASE}/forms/${f.id}`, { ...f, open: !f.open, accept_groups: (f.accept_groups ?? []).map((g) => g.id) }),
    onSuccess: refresh,
    onError: (e: Error) => toast.error(e.message),
  });

  const edit = (f: FormInfo) =>
    setDraft({ id: f.id, name: f.name, description: f.description, open: f.open, require_discord: f.require_discord, order: f.order ?? 0, accept_groups: (f.accept_groups ?? []).map((g) => g.id), questions: f.questions.map((q) => ({ ...q })) });

  return (
    <>
      <Link to="/p/recruit" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-text"><Back /> Applications</Link>
      <PageHeader
        eyebrow="Recruitment"
        title="Forms"
        icon={<FormIcon />}
        description="What applicants fill in. Each form can add accepted applicants to groups, e.g. one form per corporation."
        actions={<Button variant="primary" onClick={() => setDraft({ ...EXAMPLE, questions: EXAMPLE.questions.map((q) => ({ ...q })) })}><Plus /> New form</Button>}
      />
      {isLoading || !data ? (
        <Skeleton className="h-40" />
      ) : data.forms.length === 0 ? (
        <Card><EmptyState icon={<FormIcon />} title="No forms yet" description="Make one so people can apply. It starts with a few example questions you can change." /></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.forms.map((f) => (
            <Card key={f.id}>
              <CardBody className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium">{f.name}</div>
                    {f.description && <p className="mt-1 line-clamp-2 text-sm text-muted">{f.description}</p>}
                  </div>
                  <label className="inline-flex shrink-0 items-center gap-2 text-xs text-muted">
                    {f.open ? "Open" : "Closed"}
                    <Switch checked={f.open} onCheckedChange={() => toggle.mutate(f)} aria-label={`${f.name} is open`} />
                  </label>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge>{f.questions.length} question{f.questions.length === 1 ? "" : "s"}</Badge>
                  <Badge>{f.applications ?? 0} application{f.applications === 1 ? "" : "s"}</Badge>
                  {(f.accept_groups ?? []).map((g) => <Badge key={g.id} tone="accent">+ {g.name}</Badge>)}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => edit(f)}>Edit</Button>
                  {!f.applications && <Button size="sm" variant="ghost" className="text-danger-fg" onClick={() => setDeleting(f)}><Trash /> Delete</Button>}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
      {draft && data && <FormEditor draft={draft} setDraft={setDraft} groups={data.groups} saving={save.isPending} onSave={() => save.mutate(draft)} />}
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete ${deleting?.name}?`}
        danger
        confirmLabel="Delete"
        onConfirm={() => api.delete(`${BASE}/forms/${deleting!.id}`).then(refresh)}
      />
    </>
  );
}

function FormEditor({ draft, setDraft, groups, saving, onSave }: { draft: Draft; setDraft: (d: Draft | null) => void; groups: FormsData["groups"]; saving: boolean; onSave: () => void }) {
  const set = (patch: Partial<Draft>) => setDraft({ ...draft, ...patch });
  const setQ = (i: number, patch: Partial<Draft["questions"][number]>) => set({ questions: draft.questions.map((q, n) => (n === i ? { ...q, ...patch } : q)) });
  const move = (i: number, by: number) => {
    const qs = [...draft.questions];
    const [q] = qs.splice(i, 1);
    qs.splice(i + by, 0, q!);
    set({ questions: qs });
  };
  return (
    <Dialog
      open
      onOpenChange={(o) => !o && setDraft(null)}
      size="xl"
      title={draft.id ? `Edit ${draft.name}` : "New form"}
      footer={
        <>
          <Button variant="ghost" onClick={() => setDraft(null)}>Cancel</Button>
          <Button variant="primary" loading={saving} onClick={onSave}>Save form</Button>
        </>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-[1fr_auto]">
          <Field label="Name" required>
            <Input value={draft.name} onChange={(e) => set({ name: e.target.value })} placeholder="Join Conduit Industries" />
          </Field>
          <label className="inline-flex items-center gap-2 self-end pb-2 text-sm">
            <Switch checked={draft.open} onCheckedChange={(open) => set({ open })} /> Taking applications
          </label>
        </div>
        <label className="flex items-start gap-3 text-sm">
          <Switch checked={draft.require_discord} onCheckedChange={(require_discord) => set({ require_discord })} />
          <span>
            Require Discord
            <span className="block text-xs text-muted">
              Applicants must link their Discord account and be on the server before they can apply. Only checked while the
              Discord plugin is on; give your Guest state the "Can link a Discord account" permission so they can link.
            </span>
          </span>
        </label>
        <Field label="Introduction" hint="Shown above the questions: who you are, what you expect, what happens next.">
          <Textarea rows={3} value={draft.description} onChange={(e) => set({ description: e.target.value })} />
        </Field>
        <div>
          <div className="mb-1 text-[13px] font-medium">When accepted, add them to</div>
          <div className="flex flex-wrap gap-2">
            {groups.length === 0 && <span className="text-sm text-subtle">No groups yet. Make them under Administration → Access.</span>}
            {groups.map((g) => {
              const on = draft.accept_groups.includes(g.id);
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => set({ accept_groups: on ? draft.accept_groups.filter((x) => x !== g.id) : [...draft.accept_groups, g.id] })}
                  className={`border px-3 py-1.5 text-sm transition-colors ${on ? "border-accent bg-accent-soft text-text" : "border-border text-muted hover:border-accent/60"}`}
                  aria-pressed={on}
                >
                  {g.name}
                </button>
              );
            })}
          </div>
        </div>
        <div className="space-y-3">
          <div className="text-[13px] font-medium">Questions</div>
          {draft.questions.map((q, i) => (
            <div key={i} className="space-y-3 border border-border bg-surface-2/40 p-3">
              <div className="flex gap-2">
                <Input value={q.label} onChange={(e) => setQ(i, { label: e.target.value })} placeholder="Question" className="flex-1" aria-label={`Question ${i + 1}`} />
                <Select value={q.kind} onChange={(e) => setQ(i, { kind: e.target.value as Kind })} options={KINDS} className="w-40" aria-label="Answer type" />
                <Button size="icon-sm" variant="ghost" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up"><Up /></Button>
                <Button size="icon-sm" variant="ghost" disabled={i === draft.questions.length - 1} onClick={() => move(i, 1)} aria-label="Move down"><Down /></Button>
                <Button size="icon-sm" variant="ghost" className="text-danger-fg" onClick={() => set({ questions: draft.questions.filter((_, n) => n !== i) })} aria-label="Remove question"><Trash /></Button>
              </div>
              <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                <Input value={q.help} onChange={(e) => setQ(i, { help: e.target.value })} placeholder="Hint (optional)" className="text-xs" />
                <label className="inline-flex items-center gap-2 text-xs text-muted">
                  <Switch checked={q.required} onCheckedChange={(required) => setQ(i, { required })} /> Required
                </label>
              </div>
              {q.kind === "choice" && (
                <Textarea rows={3} value={q.choicesText ?? q.choices.join("\n")} onChange={(e) => setQ(i, { choicesText: e.target.value })} placeholder={"One choice per line"} className="font-mono text-xs" />
              )}
            </div>
          ))}
          <Button onClick={() => set({ questions: [...draft.questions, { id: "", label: "", help: "", kind: "text", choices: [], required: false }] })}>
            <Plus /> Add question
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
