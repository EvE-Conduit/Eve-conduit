// One fit: the fitting ring, copying it into the game or saving it to a character's fittings, and the skills each of
// my characters still needs.
import {
  api, Avatar, Badge, Button, Callout, Card, CardHeader, ConfirmDialog, Dialog, EmptyState, Field, PageHeader, Select, Skeleton, Table, Td,
  Textarea, Th, THead, toast, Tr,
} from "@conduit/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

import { BookPlus, Copy, Download, Pencil, Swords, Trash } from "./icons";
import { FitDisplay } from "./ring";
import { copyText, RoleBadge, StatusBadge, trainTime, useSkillPlans } from "./shared";
import { BASE, type FitDetail, type MyCharacterStatus } from "./types";

export function FitPage() {
  const { id } = useParams();
  const { data, isLoading, error } = useQuery({ queryKey: ["doctrines", "fit", id], queryFn: () => api.get<FitDetail>(`${BASE}/fits/${id}`) });
  const [showEft, setShowEft] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();
  const qc = useQueryClient();

  if (error) return <EmptyState icon={<Swords />} title="No such fit" action={<Link to="/p/doctrines"><Button variant="secondary">All doctrines</Button></Link>} />;
  if (isLoading || !data) return <Skeleton className="h-96" />;

  const doctrine = data.doctrines[0];
  return (
    <>
      <PageHeader
        eyebrow={
          <span className="flex flex-wrap gap-1">
            <Link to="/p/doctrines" className="hover:text-text">Doctrines</Link>
            {doctrine && <>/ <Link to={`/p/doctrines/${doctrine.id}`} className="hover:text-text">{doctrine.name}</Link></>}
          </span>
        }
        title={<span className="flex flex-wrap items-center gap-3">{data.name} <RoleBadge role={data.role} /></span>}
        icon={<img src={data.ship.icon} alt="" className="size-8" />}
        description={`${data.ship.name} · ${data.ship.group}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={() => copyText(data.eft, "Copied. In the game: Fitting window → Import from clipboard")}>
              <Copy /> Copy to paste in game
            </Button>
            <Button variant="secondary" onClick={() => setSaving(true)}><Download /> Save to my fittings in EVE</Button>
            <Button variant="ghost" onClick={() => setShowEft(true)}>Show as text</Button>
            {data.can_manage && (
              <>
                <Link to={`/p/doctrines/fit/${data.id}/edit`}><Button variant="ghost"><Pencil /> Edit</Button></Link>
                <Button variant="ghost" onClick={() => setDeleting(true)} aria-label="Delete fit"><Trash /></Button>
              </>
            )}
          </div>
        }
      />

      <div className="space-y-6">
        {data.notes && <Callout tone="info" title="Notes from the FCs"><p className="whitespace-pre-wrap">{data.notes}</p></Callout>}
        <FitDisplay view={data.view} />
        <SkillsCard fit={data} />
      </div>

      {showEft && (
        <Dialog open onOpenChange={(o) => !o && setShowEft(false)} title="The fit as text" size="lg"
          description="The same text the game copies. In the game, open the Fitting window and press Import from clipboard."
          footer={<Button variant="primary" onClick={() => copyText(data.eft, "Copied")}><Copy /> Copy</Button>}>
          <Textarea readOnly rows={18} value={data.eft} className="font-mono text-xs" onFocus={(e) => e.currentTarget.select()} />
        </Dialog>
      )}
      {saving && <SaveToEveDialog fit={data} onClose={() => setSaving(false)} />}
      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title={`Delete ${data.name}?`}
        description="It's removed from every doctrine it's in. Group rules that use it stop matching anyone."
        confirmLabel="Delete fit"
        danger
        onConfirm={async () => {
          try {
            await api.delete(`${BASE}/fits/${data.id}`);
          } catch (e) {
            toast.error((e as Error).message);
            throw e;
          }
          qc.invalidateQueries({ queryKey: ["doctrines"] });
          toast.success(`${data.name} deleted`);
          navigate(doctrine ? `/p/doctrines/${doctrine.id}` : "/p/doctrines");
        }}
      />
    </>
  );
}

function SaveToEveDialog({ fit, onClose }: { fit: FitDetail; onClose: () => void }) {
  const able = fit.characters.filter((c) => c.can_save);
  const [character, setCharacter] = useState(String(able[0]?.id ?? ""));
  const save = useMutation({
    mutationFn: () => api.post<{ fitting_id: number }>(`${BASE}/fits/${fit.id}/save-to-eve`, { character: Number(character) }),
    onSuccess: () => {
      toast.success(`Saved to ${able.find((c) => String(c.id) === character)?.name}'s fittings in the game`);
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()} title="Save to my fittings in EVE" size="md"
      description="Adds the fit to a character's saved fittings in the game, ready to fit from the Fitting window. Loaded ammunition goes in the cargo."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!character} loading={save.isPending} onClick={() => save.mutate()}><Download /> Save</Button>
        </>
      }>
      {able.length ? (
        <Field label="Character">
          <Select value={character} onChange={(e) => setCharacter(e.target.value)}>
            {able.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>
      ) : (
        <p className="text-sm text-muted">None of your characters allow saving fittings. Log in with them again under Characters → Add character.</p>
      )}
      {able.length > 0 && able.length < fit.characters.length && (
        <p className="mt-2 text-xs text-subtle">
          {fit.characters.filter((c) => !c.can_save).map((c) => c.name).join(", ")} can't: log in with them again to allow saving fittings.
        </p>
      )}
    </Dialog>
  );
}

function SkillsCard({ fit }: { fit: FitDetail }) {
  const [selected, setSelected] = useState<number | null>(null);
  const skillPlans = useSkillPlans();
  const navigate = useNavigate();
  const chars = fit.characters;
  const current: MyCharacterStatus | undefined = chars.find((c) => c.id === selected) ?? chars[0];
  const savePlan = useMutation({
    mutationFn: (skills: [number, number][]) =>
      api.post<{ id: number }>("/api/p/skillplans/plans", {
        name: `${fit.name} (${fit.ship.name})`,
        description: `Skills for the doctrine fit ${fit.name}${current ? `, missing on ${current.name}` : ""}.`,
        skills,
      }),
    onSuccess: (plan) => navigate(`/p/skillplans/${plan.id}`),
    onError: (e: Error) => toast.error(e.message),
  });

  const missing = current?.missing_steps ?? [];
  const planText = (steps: { name: string; level: number }[]) => steps.map((s) => `${s.name} ${s.level}`).join("\n");

  return (
    <Card>
      <CardHeader
        title="Skills"
        description="What the ship, modules, ammunition and drones need, with prerequisites, plus what the FCs recommend."
      />
      <div className="grid gap-0 border-t border-border lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="border-border p-card lg:border-r">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-subtle">Your characters</div>
          {chars.length === 0 ? (
            <p className="text-sm text-muted">You have no characters.</p>
          ) : (
            <ul className="space-y-1">
              {chars.map((c) => (
                <li key={c.id}>
                  <button type="button" onClick={() => setSelected(c.id)}
                    className={`flex w-full items-center gap-3 px-2 py-2 text-left hover:bg-hover ${current?.id === c.id ? "bg-hover-strong" : ""}`}>
                    <Avatar src={c.portrait} name={c.name} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{c.name}</span>
                      <StatusBadge status={c} />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-5 space-y-2">
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-subtle">Required</div>
            <div className="flex flex-wrap gap-1">
              {fit.required.map((s) => <Badge key={s.skill_id} size="xs">{s.name} {s.level}</Badge>)}
            </div>
            {fit.recommended.length > 0 && (
              <>
                <div className="pt-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-subtle">Recommended</div>
                <div className="flex flex-wrap gap-1">
                  {fit.recommended.map((s) => <Badge key={s.skill_id} tone="accent" size="xs">{s.name} {s.level}</Badge>)}
                </div>
              </>
            )}
          </div>
        </div>
        <div className="min-w-0">
          {!current ? null : missing.length === 0 ? (
            <EmptyState icon={<Swords />} title={current.status === "unknown" ? "Skills not synced yet" : `${current.name} has every skill`}
              description={current.status === "unknown" ? "Once the character sheet syncs this character's skills, this shows what's missing." : "Required and recommended."} />
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 p-card">
                <div className="text-sm text-muted">
                  {current.name} needs <span className="text-text">{missing.length}</span> more skill level{missing.length === 1 ? "" : "s"}:{" "}
                  <span className="font-mono text-text">{trainTime(missing.reduce((a, s) => a + s.seconds, 0))}</span> with their attributes.
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary"
                    onClick={() => copyText(planText(missing), "Copied. In the game: Skills → Skill plans → Import from clipboard, or paste into the skill queue")}>
                    <Copy /> Copy skill plan for EVE
                  </Button>
                  {skillPlans && (
                    <Button size="sm" variant="ghost" loading={savePlan.isPending}
                      onClick={() => savePlan.mutate(missing.map((s) => [s.skill_id, s.level] as [number, number]))}>
                      <BookPlus /> Save as skill plan
                    </Button>
                  )}
                </div>
              </div>
              <Table>
                <THead>
                  <tr>
                    <Th>Skill</Th>
                    <Th align="right">Time</Th>
                    <Th align="right" />
                  </tr>
                </THead>
                <tbody>
                  {missing.map((s) => (
                    <Tr key={`${s.skill_id}-${s.level}`}>
                      <Td>{s.name} <span className="font-mono text-muted">{s.level}</span></Td>
                      <Td numeric>{trainTime(s.seconds)}</Td>
                      <Td align="right">
                        <span className="flex justify-end gap-1">
                          {s.status === "queued" && <Badge tone="info" size="xs">In queue</Badge>}
                          {s.required ? <Badge tone="warning" size="xs">Required</Badge> : <Badge size="xs">Recommended</Badge>}
                        </span>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
