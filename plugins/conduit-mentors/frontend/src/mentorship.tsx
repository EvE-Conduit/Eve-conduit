// One mentorship: goals, the thread, the mentor and the mentee's characters, and claiming, assigning, graduating.
import {
  Alert, api, Avatar, Badge, Button, Card, CardBody, CardHeader, date, Dialog, EmptyState, Field, PageHeader, Select, Skeleton,
  Textarea, toast,
} from "@conduit/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useParams } from "react-router";

import { Back, Cap, Check, External, Hand, Reopen, X } from "./icons";
import { FocusChips, GoalProgress, Goals, ReopenDialog, StatusBadge, Thread } from "./shared";
import { BASE, type Detail, type GoalState, type Program } from "./types";

export function MentorshipPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const key = ["mentors", "mentorship", id];
  const { data, isLoading, error } = useQuery({ queryKey: key, queryFn: () => api.get<Detail>(`${BASE}/m/${id}`) });
  const [closing, setClosing] = useState<"graduate" | "end" | null>(null);
  const [reopening, setReopening] = useState(false);
  const [text, setText] = useState("");
  const set = (d: Detail) => {
    qc.setQueryData(key, d);
    qc.invalidateQueries({ queryKey: ["mentors", "overview"] });
    qc.invalidateQueries({ queryKey: ["mentors", "program"] });
    qc.invalidateQueries({ queryKey: ["mentors", "widget"] });
  };
  const onError = (e: Error) => toast.error(e.message);
  const claim = useMutation({ mutationFn: () => api.post<Detail>(`${BASE}/m/${id}/claim`), onSuccess: (d) => { set(d); toast.success(`You're now mentoring ${d.mentee.name}`); }, onError });
  const withdraw = useMutation({ mutationFn: () => api.post<Detail>(`${BASE}/m/${id}/withdraw`), onSuccess: set, onError });
  const tick = useMutation({ mutationFn: ({ g, done }: { g: GoalState; done: boolean }) => api.post<Detail>(`${BASE}/m/${id}/goals/${g.id}`, { done }), onSuccess: set, onError });
  const close = useMutation({
    mutationFn: () => api.post<Detail>(`${BASE}/m/${id}/${closing}`, { text }),
    onSuccess: (d) => {
      set(d);
      setClosing(null);
      setText("");
      toast.success(d.status === "graduated" ? `${d.mentee.name} graduated` : "Mentorship ended");
    },
    onError,
  });

  if (error) return <EmptyState icon={<Cap />} title="Mentorship not found" action={<Link to="/p/mentors"><Button>Back to mentoring</Button></Link>} />;
  if (isLoading || !data) return <Skeleton className="h-96" />;
  const staff = data.role === "mentor" || data.role === "manager";
  const allDone = data.goals.length > 0 && data.goals.every((g) => g.done);
  const subtitle = [
    `Asked ${date(data.created_at)}`,
    data.assigned_at && `mentored since ${date(data.assigned_at)}`,
    data.ended_at && `${data.status === "graduated" ? "graduated" : "ended"} ${date(data.ended_at)}`,
  ].filter(Boolean).join(" · ");

  return (
    <>
      <Link to="/p/mentors" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-text"><Back /> Mentoring</Link>
      <PageHeader
        eyebrow="Mentorship"
        title={data.role === "mentee" ? "Your mentorship" : data.mentee.name}
        description={subtitle}
        icon={data.mentee.portrait ? <img src={data.mentee.portrait} alt="" className="size-full object-cover" /> : <Cap />}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={data.status} />
            {data.can.withdraw && <Button variant="ghost" loading={withdraw.isPending} onClick={() => withdraw.mutate()}><X /> Withdraw</Button>}
            {data.can.claim && <Button variant="primary" loading={claim.isPending} onClick={() => claim.mutate()}>{!claim.isPending && <Hand />} Take them on</Button>}
            {data.can.end && <Button variant="danger" onClick={() => setClosing("end")}><X /> End</Button>}
            {data.can.graduate && <Button variant="primary" onClick={() => setClosing("graduate")}><Cap /> Graduate</Button>}
            {data.can.reopen && <Button onClick={() => setReopening(true)}><Reopen /> Reopen</Button>}
          </div>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          {data.can.graduate && allDone && (
            <Alert tone="success" title="Every goal is done" action={<Button variant="success" onClick={() => setClosing("graduate")}><Cap /> Graduate</Button>}>
              {data.mentee.name} has done everything the program asks. Time to graduate them?
            </Alert>
          )}
          {data.status !== "waiting" && (
            <Card>
              <CardHeader title="Goals" description={data.role === "mentee" ? "Goals that tick themselves update as you go; your mentor ticks the rest." : "Goals with rules tick themselves; tick the others when they're done."} />
              <CardBody className="space-y-3">
                <GoalProgress {...data.progress} />
                <Goals
                  goals={data.goals}
                  canTick={(g) => data.status === "active" && (data.can.tick || (data.role === "mentee" && g.mentee_can_tick && !g.auto))}
                  onTick={(g, done) => tick.mutate({ g, done })}
                />
              </CardBody>
            </Card>
          )}
          {data.role !== "candidate" && (
            <Card>
              <CardHeader title={staff ? "Messages and notes" : "Messages"} description={staff ? "Private notes are only for mentors and program managers." : undefined} />
              <CardBody>
                <Thread
                  messages={data.messages}
                  staff={data.can.private_notes}
                  disabled={!data.can.message}
                  onSend={(t, priv) => api.post<Detail>(`${BASE}/m/${id}/messages`, { text: t, private: priv }).then(set)}
                />
              </CardBody>
            </Card>
          )}
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader title="Mentor" />
            <CardBody>
              {data.mentor ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar src={data.mentor.portrait} name={data.mentor.name} size="md" />
                    <div>
                      <div className="font-medium">{data.mentor.name}</div>
                      {data.mentor_profile?.play_time && <div className="text-xs text-muted">Plays {data.mentor_profile.play_time}</div>}
                    </div>
                  </div>
                  {data.mentor_profile?.bio && <p className="whitespace-pre-line text-sm text-muted">{data.mentor_profile.bio}</p>}
                  {data.mentor_profile && data.mentor_profile.focus.length > 0 && <FocusChips areas={[]} value={data.mentor_profile.focus} />}
                </div>
              ) : (
                <p className="text-sm text-muted">{data.requested_mentor ? `Asked for ${data.requested_mentor.name}.` : "Waiting for any mentor."}</p>
              )}
              {data.can.assign && <AssignMentor id={data.id} current={data.mentor?.id ?? null} onDone={set} />}
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="What they asked for" />
            <CardBody className="space-y-3 text-sm">
              <FocusChips areas={[]} value={data.focus} />
              {data.play_time && <div><span className="text-subtle">Plays:</span> {data.play_time}</div>}
              {data.note ? <p className="whitespace-pre-line">{data.note}</p> : <p className="text-subtle">No note.</p>}
              {data.end_reason && data.status === "ended" && <Alert tone="info" title="Ended">{data.end_reason}</Alert>}
            </CardBody>
          </Card>
          {data.characters && (
            <Card>
              <CardHeader
                title={`Characters · ${data.characters.length}`}
                description={data.sheet_access ? "As their mentor you can open their character sheets while the mentorship is active." : undefined}
              />
              <ul className="divide-y divide-border">
                {data.characters.map((c) => (
                  <li key={c.id} className="flex items-center gap-3 px-card py-3">
                    <Avatar src={c.portrait} name={c.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium">{c.name}</span>
                        {c.main && <Badge tone="accent">main</Badge>}
                      </div>
                      <div className="truncate text-xs text-muted">
                        {[c.corporation, c.total_sp != null ? `${(c.total_sp / 1e6).toFixed(1)}M SP` : null].filter(Boolean).join(" · ") || "—"}
                      </div>
                    </div>
                    {data.sheet_access && (
                      <Link to={`/characters/${c.id}`} target="_blank" className="text-subtle hover:text-text" aria-label={`Open ${c.name}'s character sheet`}>
                        <External />
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>

      <Dialog
        open={closing !== null}
        onOpenChange={(o) => !o && setClosing(null)}
        title={closing === "graduate" ? `Graduate ${data.mentee.name}?` : "End this mentorship?"}
        description={closing === "graduate" ? "They're congratulated straight away. The thread stays for reference." : "They're told straight away. They can ask for a mentor again later."}
        footer={
          <>
            <Button variant="ghost" onClick={() => setClosing(null)}>Cancel</Button>
            <Button
              variant={closing === "graduate" ? "primary" : "solidDanger"}
              loading={close.isPending}
              disabled={closing === "end" && !text.trim()}
              onClick={() => close.mutate()}
            >
              {closing === "graduate" ? <><Check /> Graduate</> : <><X /> End</>}
            </Button>
          </>
        }
      >
        <Field label={closing === "graduate" ? "A message to them (optional)" : "Why does it end?"}>
          <Textarea
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={closing === "graduate" ? "Well done! You're ready for the big fleets now." : "They left the corporation."}
          />
        </Field>
      </Dialog>
      <ReopenDialog mentorship={reopening ? data : null} onClose={() => setReopening(false)} onDone={set} />
    </>
  );
}

/** Managers hand a mentorship to any mentor (also over their limit). */
function AssignMentor({ id, current, onDone }: { id: number; current: number | null; onDone: (d: Detail) => void }) {
  const { data } = useQuery({ queryKey: ["mentors", "program", "open"], queryFn: () => api.get<Program>(`${BASE}/program?status=open`) });
  const [mentor, setMentor] = useState("");
  const assign = useMutation({
    mutationFn: () => api.post<Detail>(`${BASE}/m/${id}/assign`, { mentor_id: Number(mentor) }),
    onSuccess: (d) => {
      onDone(d);
      setMentor("");
      toast.success(`${d.mentor?.name} is the mentor now`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const options = (data?.mentors ?? []).filter((m) => m.id !== current);
  return (
    <div className="mt-4 flex items-end gap-2 border-t border-border pt-4">
      <Field label={current ? "Hand to another mentor" : "Assign a mentor"} className="flex-1">
        <Select value={mentor} onChange={(e) => setMentor(e.target.value)}>
          <option value="">Choose…</option>
          {options.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} ({m.mentees}/{m.capacity}{m.active ? "" : ", paused"})
            </option>
          ))}
        </Select>
      </Field>
      <Button disabled={!mentor} loading={assign.isPending} onClick={() => assign.mutate()}>Assign</Button>
    </div>
  );
}
