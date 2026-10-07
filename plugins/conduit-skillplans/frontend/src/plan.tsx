// One skill plan: its skills, each of my characters' progress, and copying it into the game.
import {
  Alert, api, Avatar, Badge, Button, Card, CardHeader, ConfirmDialog, EmptyState, PageHeader, Progress, Skeleton, sp, StatCard, Table,
  Td, Th, THead, toast, Tr,
} from "@conduit/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

import { Cap, Check, Clock, CopyIcon, Pencil, Trash, Users } from "./icons";
import { BASE, type CharacterProgress, copyText, type PlanDetail, ROMAN, type StepStatus, trainTime } from "./types";

export function usePlan(id: string | undefined) {
  return useQuery({ queryKey: ["skillplans", "plan", id], queryFn: () => api.get<PlanDetail>(`${BASE}/plans/${id}`), enabled: !!id });
}

const STATUS: Record<StepStatus, { label: string; tone: "success" | "info" | "neutral" }> = {
  done: { label: "Trained", tone: "success" },
  queued: { label: "In queue", tone: "info" },
  missing: { label: "To train", tone: "neutral" },
};

export function PlanPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: plan, isLoading, error } = usePlan(id);
  const [picked, setPicked] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const copy = useMutation({
    mutationFn: () => api.post<PlanDetail>(`${BASE}/plans/${id}/copy`),
    onSuccess: (p) => {
      qc.invalidateQueries({ queryKey: ["skillplans"] });
      toast.success("Copied to My plans");
      navigate(`/p/skillplans/${p.id}/edit`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (error) return <EmptyState icon={<Cap />} title="No such skill plan" description="It was deleted, or it's someone else's personal plan." />;
  if (isLoading || !plan) return <Skeleton className="h-96" />;

  const char = plan.characters.find((c) => c.id === picked) ?? plan.characters[0];
  const copyForEve = async (text: string, what: string) => {
    if (!text) return toast.info("Nothing left to train");
    if (await copyText(text)) toast.success(`${what} copied. In EVE, open Skill Plans (or the skill queue) and import from the clipboard.`);
    else toast.error("Your browser didn't allow copying");
  };

  return (
    <>
      <PageHeader
        eyebrow={<Link to="/p/skillplans" className="hover:text-text">Skill Plans</Link>}
        title={plan.name}
        icon={<Cap />}
        description={plan.description || undefined}
        actions={
          <div className="flex flex-wrap gap-2">
            {plan.can_view_progress && (
              <Link to={`/p/skillplans/${plan.id}/members`}><Button variant="ghost"><Users /> Members</Button></Link>
            )}
            <Button variant="ghost" loading={copy.isPending} onClick={() => copy.mutate()}><CopyIcon /> Copy to my plans</Button>
            {plan.can_edit && (
              <>
                <Button variant="ghost" onClick={() => setDeleting(true)}><Trash /> Delete</Button>
                <Link to={`/p/skillplans/${plan.id}/edit`}><Button><Pencil /> Edit</Button></Link>
              </>
            )}
            <Button variant="primary" onClick={() => copyForEve(plan.text, "The whole plan")}><CopyIcon /> Copy for EVE</Button>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-muted">
        <Badge tone={plan.shared ? "accent" : "neutral"} size="xs">{plan.shared ? "Shared plan" : "My plan"}</Badge>
        {plan.category && <Badge size="xs">{plan.category}</Badge>}
        <span>{plan.skills} skills · {plan.steps} levels · {sp(plan.total_sp)}</span>
        {plan.created_by && <span>· by {plan.created_by}</span>}
      </div>

      {plan.characters.length === 0 ? (
        <Alert tone="info" className="mb-4">Add a character to see your progress on this plan.</Alert>
      ) : (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {plan.characters.map((c) => (
            <CharacterCard key={c.id} c={c} active={c.id === char?.id} onClick={() => setPicked(c.id)} />
          ))}
        </div>
      )}

      {char && (
        <div className="mb-4 grid gap-4 sm:grid-cols-3">
          <StatCard label={`${char.name} · done`} value={`${char.percent}%`} tone={char.complete ? "success" : "accent"}
            hint={`${char.done} of ${char.total} levels`} />
          <StatCard label="Time left" value={char.complete ? "—" : trainTime(char.seconds_left)} icon={<Clock />}
            hint={char.seconds_left > char.seconds_missing ? `${trainTime(char.seconds_left - char.seconds_missing)} of it already queued` : "with current attributes and implants"} />
          <StatCard label="Skill points left" value={sp(char.sp_left)} />
        </div>
      )}

      <Card>
        <CardHeader
          title="Skills"
          description="In training order: prerequisites come first. Copying pastes into EVE's Skill Plans window (Import from clipboard) or the skill queue."
          actions={char && !char.complete && (
            <Button size="sm" onClick={() => copyForEve(char.missing_text, `What ${char.name} still needs`)}>
              <CopyIcon /> Copy what {char.name} needs
            </Button>
          )}
        />
        <Table>
          <THead>
            <tr>
              <Th className="w-10">#</Th>
              <Th>Skill</Th>
              <Th align="right">SP</Th>
              {char && <Th>{char.name}</Th>}
              {char && <Th align="right">Time</Th>}
            </tr>
          </THead>
          <tbody>
            {plan.steps_detail.map((s, i) => {
              const st = char?.steps[i];
              return (
                <Tr key={`${s.skill_id}-${s.level}`}>
                  <Td className="font-mono text-xs text-subtle">{i + 1}</Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <img src={s.icon} alt="" className="size-6" loading="lazy" />
                      <span className={st?.status === "done" ? "text-muted" : "font-medium"}>{s.name} {ROMAN[s.level]}</span>
                      <span className="hidden text-xs text-subtle sm:inline">{s.group} · rank {s.rank}</span>
                    </div>
                  </Td>
                  <Td numeric className="text-xs text-muted">{sp(s.sp)}</Td>
                  {st && <Td><Badge tone={STATUS[st.status].tone} size="xs">{st.status === "done" && <Check className="size-3" />}{STATUS[st.status].label}</Badge></Td>}
                  {st && <Td numeric className="whitespace-nowrap text-xs">{st.status === "done" ? "" : trainTime(st.seconds)}</Td>}
                </Tr>
              );
            })}
          </tbody>
        </Table>
      </Card>

      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title={`Delete ${plan.name}?`}
        description={plan.shared ? "Everyone loses this shared plan, and group rules that use it stop passing." : "This can't be undone."}
        confirmLabel="Delete"
        danger
        onConfirm={async () => {
          await api.delete(`${BASE}/plans/${plan.id}`);
          qc.invalidateQueries({ queryKey: ["skillplans"] });
          navigate("/p/skillplans");
        }}
      />
    </>
  );
}

function CharacterCard({ c, active, onClick }: { c: CharacterProgress; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="text-left">
      <Card interactive className={active ? "border-accent" : undefined}>
        <div className="flex items-center gap-3 p-3">
          <Avatar src={c.portrait} name={c.name} size="sm" />
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="truncate font-medium">{c.name}</span>
              {c.complete
                ? <Badge tone="success" size="xs"><Check className="size-3" /> Done</Badge>
                : <span className="font-mono text-xs tabular-nums">{c.percent}%</span>}
            </div>
            <Progress value={c.percent} size="xs" tone={c.complete ? "success" : "accent"} />
            <div className="text-xs text-subtle">
              {!c.synced ? "Skills not synced yet" : c.complete ? "Every skill trained" : `${trainTime(c.seconds_left)} to go`}
            </div>
          </div>
        </div>
      </Card>
    </button>
  );
}
