// Running the program (mentors.manage_program): every mentorship, mentors' load, goals and settings.
import {
  Alert, api, Avatar, Badge, Button, Card, CardBody, CardHeader, ConfirmDialog, Dialog, EmptyState, Field, Input, PageHeader,
  RuleSetEditor, type RuleSet, Segmented, Skeleton, StatCard, Switch, Table, TabPanel, Tabs, Td, Textarea, Th, THead, toast, Tr,
} from "@conduit/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link } from "react-router";

import { MentorshipTable } from "./home";
import { Back, Down, Pencil, Plus, Settings, Trash, Up, X } from "./icons";
import { BASE, type Goal, type Program, type ProgramSettings } from "./types";

const FILTERS = [
  { value: "open", label: "Open" },
  { value: "waiting", label: "Waiting" },
  { value: "active", label: "Active" },
  { value: "graduated", label: "Graduated" },
  { value: "ended", label: "Ended" },
];

export function ProgramPage() {
  const [status, setStatus] = useState("open");
  const { data, isLoading } = useQuery({ queryKey: ["mentors", "program", status], queryFn: () => api.get<Program>(`${BASE}/program?status=${status}`) });
  return (
    <>
      <Link to="/p/mentors" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-text"><Back /> Mentoring</Link>
      <PageHeader eyebrow="Mentoring" title="Program" icon={<Settings />} description="Every mentorship, how busy the mentors are, the goals every mentee works through, and settings." />
      {isLoading || !data ? (
        <Skeleton className="h-96" />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Waiting for a mentor" value={data.stats.waiting} tone={data.stats.waiting ? "warning" : undefined} hint={data.stats.avg_days_waiting != null ? `${data.stats.avg_days_waiting} days' wait on average` : undefined} />
            <StatCard label="Being mentored" value={data.stats.active} tone="accent" />
            <StatCard label="Graduated" value={data.stats.graduated} tone="success" hint={data.stats.avg_days_to_graduate != null ? `in ${data.stats.avg_days_to_graduate} days on average` : undefined} />
            <StatCard label="Ended early" value={data.stats.ended} />
          </div>
          <Tabs
            defaultValue="mentorships"
            items={[
              { value: "mentorships", label: "Mentorships" },
              { value: "mentors", label: "Mentors", count: data.mentors.length },
              { value: "goals", label: "Goals", count: data.goals.length },
              { value: "settings", label: "Settings" },
            ]}
          >
            <TabPanel value="mentorships" className="pt-4">
              <Card>
                <div className="border-b border-border px-card py-3">
                  <Segmented value={status} onChange={setStatus} options={FILTERS} size="sm" aria-label="Status" />
                </div>
                {data.mentorships.length === 0 ? (
                  <EmptyState icon={<Settings />} title="Nothing here" />
                ) : (
                  <MentorshipTable rows={data.mentorships} showMentor />
                )}
              </Card>
            </TabPanel>
            <TabPanel value="mentors" className="pt-4"><Mentors data={data} /></TabPanel>
            <TabPanel value="goals" className="pt-4"><Goals goals={data.goals} canEditRules={data.can_edit_rules} /></TabPanel>
            <TabPanel value="settings" className="pt-4"><SettingsForm settings={data.settings} canEditRules={data.can_edit_rules} /></TabPanel>
          </Tabs>
        </div>
      )}
    </>
  );
}

function Mentors({ data }: { data: Program }) {
  if (data.mentors.length === 0)
    return (
      <Card>
        <EmptyState icon={<Settings />} title="No mentors yet" description='Give "Can mentor new members" to a group or state under Administration → Access.' />
      </Card>
    );
  return (
    <Card>
      <Table>
        <THead>
          <tr>
            <Th>Mentor</Th>
            <Th>Focus</Th>
            <Th>Plays</Th>
            <Th align="right">Mentees</Th>
            <Th align="right">Graduated</Th>
          </tr>
        </THead>
        <tbody>
          {data.mentors.map((m) => (
            <Tr key={m.id}>
              <Td>
                <div className="flex items-center gap-3">
                  <Avatar src={m.portrait} name={m.name} size="sm" />
                  <span className="font-medium">{m.name}</span>
                  {!m.active && <Badge tone="warning">paused</Badge>}
                </div>
              </Td>
              <Td className="text-xs text-muted">{m.focus.join(", ") || "—"}</Td>
              <Td className="text-muted">{m.play_time || "—"}</Td>
              <Td align="right" className="font-mono tabular-nums">
                <span className={m.mentees >= m.capacity ? "text-warning-fg" : ""}>{m.mentees} / {m.capacity}</span>
              </Td>
              <Td align="right" className="font-mono tabular-nums">{m.graduated}</Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </Card>
  );
}

const EMPTY: Omit<Goal, "id" | "order" | "rules_text"> = { title: "", description: "", rules: {}, mentee_can_tick: false };

function Goals({ goals, canEditRules }: { goals: Goal[]; canEditRules: boolean }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Goal | "new" | null>(null);
  const [deleting, setDeleting] = useState<Goal | null>(null);
  const refresh = () => qc.invalidateQueries({ queryKey: ["mentors"] });
  const order = useMutation({ mutationFn: (ids: number[]) => api.post(`${BASE}/program/goals/order`, { ids }), onSuccess: refresh, onError: (e: Error) => toast.error(e.message) });
  const move = (i: number, by: number) => {
    const ids = goals.map((g) => g.id);
    [ids[i], ids[i + by]] = [ids[i + by], ids[i]];
    order.mutate(ids);
  };
  return (
    <Card>
      <CardHeader
        title="Goals"
        description="What every mentee works through, in this order. Goals with rules tick themselves."
        actions={<Button variant="primary" onClick={() => setEditing("new")}><Plus /> Add goal</Button>}
      />
      {goals.length === 0 ? (
        <EmptyState icon={<Settings />} title="No goals" description="Add what new members should do before they graduate." />
      ) : (
        <ol className="divide-y divide-border">
          {goals.map((g, i) => (
            <li key={g.id} className="flex items-start gap-3 px-card py-3">
              <div className="flex flex-col">
                <Button variant="ghost" size="icon-xs" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up"><Up /></Button>
                <Button variant="ghost" size="icon-xs" disabled={i === goals.length - 1} onClick={() => move(i, 1)} aria-label="Move down"><Down /></Button>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{g.title}</span>
                  {g.rules_text ? <Badge tone="info">ticks itself</Badge> : g.mentee_can_tick ? <Badge>mentee ticks</Badge> : <Badge>mentor ticks</Badge>}
                </div>
                {g.description && <p className="text-xs text-muted">{g.description}</p>}
                {g.rules_text && <p className="mt-1 text-xs text-subtle">{g.rules_text}</p>}
              </div>
              <Button variant="ghost" size="icon-sm" onClick={() => setEditing(g)} aria-label={`Edit ${g.title}`}><Pencil /></Button>
              <Button variant="ghost" size="icon-sm" onClick={() => setDeleting(g)} aria-label={`Delete ${g.title}`}><Trash /></Button>
            </li>
          ))}
        </ol>
      )}
      {editing && <GoalDialog goal={editing === "new" ? null : editing} canEditRules={canEditRules} onClose={() => setEditing(null)} />}
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete “${deleting?.title}”?`}
        description="It goes from every mentorship, with whatever was ticked."
        confirmLabel="Delete"
        danger
        onConfirm={() =>
          api.delete(`${BASE}/program/goals/${deleting!.id}`).then(refresh, (e: Error) => {
            toast.error(e.message);
            throw e;
          })
        }
      />
    </Card>
  );
}

function GoalDialog({ goal, canEditRules, onClose }: { goal: Goal | null; canEditRules: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState(goal ?? { ...EMPTY, rules_text: "" });
  const hasRules = (form.rules.rules ?? []).length > 0;
  const save = useMutation({
    mutationFn: () => {
      const body = { title: form.title, description: form.description, rules: form.rules, mentee_can_tick: form.mentee_can_tick && !hasRules };
      return goal ? api.put<Goal>(`${BASE}/program/goals/${goal.id}`, body) : api.post<Goal>(`${BASE}/program/goals`, body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mentors"] });
      toast.success("Goal saved");
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Dialog
      open
      size="lg"
      onOpenChange={(o) => !o && onClose()}
      title={goal ? "Edit goal" : "New goal"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={save.isPending} disabled={!form.title.trim()} onClick={() => save.mutate()}>Save</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Title" required>
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={150} placeholder="Fly in your first fleet" />
        </Field>
        <Field label="Description">
          <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Field>
        <Field label="Ticks itself when" hint="Any group rule: skill points, fleets flown, a skill plan done, a doctrine they can fly, Discord linked… Leave it empty to tick it by hand.">
          {canEditRules ? (
            <RuleSetEditor value={form.rules} onChange={(rules: RuleSet) => setForm({ ...form, rules })} emptyText="No rules: the mentor ticks it by hand." />
          ) : (
            <Alert tone="info">
              {goal?.rules_text || "No rules: the mentor ticks it by hand."}
              <span className="mt-1 block text-xs">Rules can be changed by people who manage access (groups and rules).</span>
            </Alert>
          )}
        </Field>
        {!hasRules && (
          <label className="flex items-center gap-3 text-sm">
            <Switch checked={form.mentee_can_tick} onCheckedChange={(mentee_can_tick) => setForm({ ...form, mentee_can_tick })} />
            The mentee may tick it themselves
          </label>
        )}
      </div>
    </Dialog>
  );
}

function SettingsForm({ settings, canEditRules }: { settings: ProgramSettings; canEditRules: boolean }) {
  const qc = useQueryClient();
  const [areas, setAreas] = useState(settings.focus_areas);
  const [area, setArea] = useState("");
  const [suggest, setSuggest] = useState<RuleSet>(settings.suggest_rules);
  useEffect(() => {
    setAreas(settings.focus_areas);
    setSuggest(settings.suggest_rules);
  }, [settings]);
  const save = useMutation({
    mutationFn: (body: Partial<ProgramSettings>) => api.put<ProgramSettings>(`${BASE}/program/settings`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mentors"] });
      toast.success("Settings saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const add = () => {
    const a = area.trim();
    if (a && !areas.some((x) => x.toLowerCase() === a.toLowerCase())) setAreas([...areas, a]);
    setArea("");
  };
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card>
        <CardHeader title="Focus areas" description="What mentors can help with and new members can ask about." />
        <CardBody className="space-y-4">
          <div className="flex flex-wrap gap-1.5">
            {areas.map((a) => (
              <span key={a} className="inline-flex items-center gap-1 border border-border px-2 py-1 text-xs">
                {a}
                <button type="button" onClick={() => setAreas(areas.filter((x) => x !== a))} aria-label={`Remove ${a}`} className="text-subtle hover:text-danger-fg"><X className="size-3" /></button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input value={area} onChange={(e) => setArea(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="Faction warfare" maxLength={40} />
            <Button onClick={add} disabled={!area.trim()}><Plus /> Add</Button>
          </div>
          <div className="flex justify-end">
            <Button variant="primary" loading={save.isPending} onClick={() => save.mutate({ focus_areas: areas })}>Save focus areas</Button>
          </div>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Character sheets" />
        <CardBody>
          <label className="flex items-start gap-3 text-sm">
            <Switch checked={settings.sheet_access} onCheckedChange={(sheet_access) => save.mutate({ sheet_access })} aria-label="Mentors may open character sheets" />
            <span>
              <span className="font-medium">Mentors may open their mentees' character sheets</span>
              <span className="block text-muted">Only while the mentorship is active, and only their own mentees. Each look is in the snooper log.</span>
            </span>
          </label>
        </CardBody>
      </Card>
      <Card className="xl:col-span-2">
        <CardHeader title="Who counts as new" description="Members who match these rules and never had a mentor are invited to ask for one, on the dashboard and here. Anyone can still ask." />
        <CardBody className="space-y-4">
          {canEditRules ? (
            <>
              <RuleSetEditor value={suggest} onChange={setSuggest} emptyText="No rules: nobody is invited." preview />
              <div className="flex justify-end">
                <Button variant="primary" loading={save.isPending} onClick={() => save.mutate({ suggest_rules: suggest })}>Save rules</Button>
              </div>
            </>
          ) : (
            <Alert tone="info">
              {settings.suggest_text || "No rules: nobody is invited."}
              <span className="mt-1 block text-xs">Rules can be changed by people who manage access (groups and rules).</span>
            </Alert>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
