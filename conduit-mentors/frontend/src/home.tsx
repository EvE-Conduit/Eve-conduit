// The plugin's home: asking for a mentor (or following your mentorship), and for mentors their profile, mentees
// and the waiting list.
import {
  Alert, api, Avatar, Badge, Button, Card, CardBody, CardHeader, EmptyState, Field, Input, PageHeader, Skeleton, Switch, Table, Td,
  Textarea, Th, THead, timeAgo, toast, Tr,
} from "@conduit/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";

import { Cap, Hand, Settings, Sparkles, Users } from "./icons";
import { FocusChips, GoalProgress, StatusBadge } from "./shared";
import { BASE, type Brief, type Detail, type MentorCard, type Overview, type Profile } from "./types";

export const OVERVIEW = ["mentors", "overview"];

export function HomePage() {
  const { data, isLoading } = useQuery({ queryKey: OVERVIEW, queryFn: () => api.get<Overview>(BASE) });
  if (isLoading || !data) return <Skeleton className="h-96" />;
  return (
    <>
      <PageHeader
        eyebrow="Community"
        title="Mentoring"
        icon={<Cap />}
        description="New members get a mentor to show them the ropes, with goals to work through together."
        actions={data.can_manage ? <Link to="/p/mentors/program"><Button><Settings /> Program</Button></Link> : undefined}
      />
      <div className="space-y-6">
        {data.mine ? <MyMentorship m={data.mine} /> : <AskForMentor data={data} />}
        {data.is_mentor && data.profile && <MentorSide data={data} profile={data.profile} />}
        {!data.is_mentor && data.can_manage && data.waiting && data.waiting.length > 0 && <Waiting rows={data.waiting} focus={[]} />}
        {data.past.length > 0 && <Past rows={data.past} />}
      </div>
    </>
  );
}

function MyMentorship({ m }: { m: Detail }) {
  return (
    <Card>
      <CardHeader title="Your mentorship" actions={<StatusBadge status={m.status} />} />
      <CardBody className="flex flex-wrap items-center gap-6">
        {m.mentor ? (
          <div className="flex items-center gap-3">
            <Avatar src={m.mentor.portrait} name={m.mentor.name} size="lg" />
            <div>
              <div className="text-xs text-muted">Your mentor</div>
              <div className="font-medium">{m.mentor.name}</div>
              {m.mentor_profile?.play_time && <div className="text-xs text-subtle">Plays {m.mentor_profile.play_time}</div>}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted">
            {m.requested_mentor ? `You asked for ${m.requested_mentor.name}.` : "You asked for any mentor."} Mentors have been told; you'll get a notification when
            one takes you on. You asked {timeAgo(m.created_at)}.
          </p>
        )}
        {m.status === "active" && <div className="min-w-48 flex-1"><GoalProgress {...m.progress} /></div>}
        <Link to={`/p/mentors/m/${m.id}`} className="ml-auto"><Button variant="primary">Open</Button></Link>
      </CardBody>
    </Card>
  );
}

function AskForMentor({ data }: { data: Overview }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [focus, setFocus] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [playTime, setPlayTime] = useState("");
  const [mentor, setMentor] = useState<number | null>(null);
  const ask = useMutation({
    mutationFn: () => api.post<Detail>(`${BASE}/request`, { focus, note, play_time: playTime, mentor_id: mentor }),
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: ["mentors"] });
      toast.success("Mentors have been told");
      navigate(`/p/mentors/m/${d.id}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Card>
      <CardHeader
        title="Get a mentor"
        icon={data.suggested ? <Sparkles /> : undefined}
        description="A mentor is an experienced member who helps you find your feet: fitting ships, fleets, making ISK and who's who."
      />
      <CardBody className="space-y-5">
        {data.suggested && <Alert tone="accent" title="You're new here">We'd like to pair you with a mentor. Tell us a little about what you want to do.</Alert>}
        <Field label="What would you like help with?">
          <FocusChips areas={data.focus_areas} value={focus} onChange={setFocus} />
        </Field>
        <Field label="When do you usually play?" hint="Your time zone or hours, e.g. EU evenings.">
          <Input value={playTime} onChange={(e) => setPlayTime(e.target.value)} maxLength={100} className="max-w-sm" />
        </Field>
        <Field label="Anything else? (optional)">
          <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="I've played for a month, mostly missions. I'd like to try small-gang PvP." />
        </Field>
        <Field label="Mentor" hint={data.mentors.length ? "Pick someone, or leave it to whoever is free." : "Nobody has free places right now; ask anyway and a mentor will pick you up."}>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            <MentorOption selected={mentor === null} onSelect={() => setMentor(null)} title="Anyone" subtitle="The first mentor free takes you on" />
            {data.mentors.map((m) => (
              <MentorOption key={m.id} selected={mentor === m.id} onSelect={() => setMentor(m.id)} mentor={m} />
            ))}
          </div>
        </Field>
        <div className="flex justify-end">
          <Button variant="primary" loading={ask.isPending} onClick={() => ask.mutate()}>{!ask.isPending && <Hand />} Ask for a mentor</Button>
        </div>
      </CardBody>
    </Card>
  );
}

function MentorOption({ selected, onSelect, mentor, title, subtitle }: { selected: boolean; onSelect: () => void; mentor?: MentorCard; title?: string; subtitle?: string }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`flex gap-3 border p-3 text-left transition-colors ${selected ? "border-accent bg-accent-soft" : "border-border hover:bg-hover"}`}
    >
      {mentor ? <Avatar src={mentor.portrait} name={mentor.name} size="md" /> : <span className="flex size-10 items-center justify-center bg-surface-3 text-muted"><Users /></span>}
      <span className="min-w-0 flex-1 space-y-1">
        <span className="block font-medium">{mentor?.name ?? title}</span>
        {mentor ? (
          <>
            {mentor.play_time && <span className="block text-xs text-muted">Plays {mentor.play_time}</span>}
            {mentor.bio && <span className="line-clamp-2 block text-xs text-subtle">{mentor.bio}</span>}
            <FocusChips areas={[]} value={mentor.focus} />
          </>
        ) : (
          <span className="block text-xs text-muted">{subtitle}</span>
        )}
      </span>
    </button>
  );
}

function MentorSide({ data, profile }: { data: Overview; profile: Profile }) {
  return (
    <>
      <ProfileCard areas={data.focus_areas} profile={profile} />
      <Card>
        <CardHeader title={`Your mentees · ${data.mentees?.length ?? 0} of ${profile.capacity}`} />
        {(data.mentees ?? []).length === 0 ? (
          <EmptyState icon={<Cap />} title="No mentees yet" description="Claim someone from the waiting list below." />
        ) : (
          <MentorshipTable rows={data.mentees ?? []} />
        )}
      </Card>
      <Waiting rows={data.waiting ?? []} focus={profile.focus} />
    </>
  );
}

function ProfileCard({ areas, profile }: { areas: string[]; profile: Profile }) {
  const qc = useQueryClient();
  const [form, setForm] = useState(profile);
  useEffect(() => setForm(profile), [profile]);
  const save = useMutation({
    mutationFn: (p: Profile) => api.put<Profile>(`${BASE}/profile`, p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mentors"] });
      toast.success("Profile saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const set = (patch: Partial<Profile>) => setForm((f) => ({ ...f, ...patch }));
  return (
    <Card>
      <CardHeader
        title="Your mentor profile"
        description="New members see this when they pick a mentor."
        actions={
          <label className="inline-flex items-center gap-2 text-sm text-muted">
            <Switch checked={form.active} onCheckedChange={(active) => save.mutate({ ...form, active })} aria-label="Taking new mentees" />
            {form.active ? "Taking new mentees" : "Paused"}
          </label>
        }
      />
      <CardBody className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-4">
          <Field label="About you" hint="What you fly and what you can teach.">
            <Textarea rows={4} value={form.bio} onChange={(e) => set({ bio: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="When you play">
              <Input value={form.play_time} onChange={(e) => set({ play_time: e.target.value })} placeholder="EU evenings" maxLength={100} />
            </Field>
            <Field label="Mentees at most">
              <Input type="number" min={1} max={50} value={form.capacity} onChange={(e) => set({ capacity: Number(e.target.value) })} />
            </Field>
          </div>
        </div>
        <div className="space-y-4">
          <Field label="You can help with">
            <FocusChips areas={areas} value={form.focus} onChange={(focus) => set({ focus })} />
          </Field>
          <div className="flex justify-end">
            <Button variant="primary" loading={save.isPending} onClick={() => save.mutate(form)}>Save profile</Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function Waiting({ rows, focus }: { rows: (Brief & { for_me: boolean; matches: number })[]; focus: string[] }) {
  const navigate = useNavigate();
  const [matching, setMatching] = useState(false);
  const shown = matching ? rows.filter((r) => r.for_me || r.matches > 0) : rows;
  return (
    <Card>
      <CardHeader
        title={`Waiting for a mentor · ${rows.length}`}
        description="Open one to read what they asked for and take them on."
        actions={
          focus.length > 0 ? (
            <label className="inline-flex items-center gap-2 text-sm text-muted">
              <Switch checked={matching} onCheckedChange={setMatching} /> Matching my focus
            </label>
          ) : undefined
        }
      />
      {shown.length === 0 ? (
        <EmptyState icon={<Users />} title="Nobody is waiting" description="Mentors get a notification when someone asks." />
      ) : (
        <Table>
          <THead>
            <tr>
              <Th>New member</Th>
              <Th>Wants help with</Th>
              <Th>Plays</Th>
              <Th align="right">Asked</Th>
            </tr>
          </THead>
          <tbody>
            {shown.map((r) => (
              <Tr key={r.id} interactive onClick={() => navigate(`/p/mentors/m/${r.id}`)}>
                <Td>
                  <div className="flex items-center gap-3">
                    <Avatar src={r.mentee.portrait} name={r.mentee.name} size="sm" />
                    <span className="font-medium">{r.mentee.name}</span>
                    {r.for_me && <Badge tone="accent">asked for you</Badge>}
                    {!r.for_me && r.requested_mentor && <Badge>asked for {r.requested_mentor.name}</Badge>}
                  </div>
                </Td>
                <Td><FocusChips areas={[]} value={r.focus} /></Td>
                <Td className="text-muted">{r.play_time || "—"}</Td>
                <Td align="right" className="text-xs text-muted">{timeAgo(r.created_at)}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </Card>
  );
}

export function MentorshipTable({ rows, showMentor }: { rows: Brief[]; showMentor?: boolean }) {
  const navigate = useNavigate();
  return (
    <Table>
      <THead>
        <tr>
          <Th>Mentee</Th>
          {showMentor && <Th>Mentor</Th>}
          <Th>Status</Th>
          <Th>Goals</Th>
          <Th align="right">Since</Th>
        </tr>
      </THead>
      <tbody>
        {rows.map((r) => (
          <Tr key={r.id} interactive onClick={() => navigate(`/p/mentors/m/${r.id}`)}>
            <Td>
              <div className="flex items-center gap-3">
                <Avatar src={r.mentee.portrait} name={r.mentee.name} size="sm" />
                <span className="font-medium">{r.mentee.name}</span>
              </div>
            </Td>
            {showMentor && <Td className="text-muted">{r.mentor?.name ?? (r.requested_mentor ? `asked for ${r.requested_mentor.name}` : "—")}</Td>}
            <Td><StatusBadge status={r.status} /></Td>
            <Td className="w-48">{r.progress ? <GoalProgress {...r.progress} /> : <span className="text-subtle">—</span>}</Td>
            <Td align="right" className="text-xs text-muted">{timeAgo(r.ended_at ?? r.assigned_at ?? r.created_at)}</Td>
          </Tr>
        ))}
      </tbody>
    </Table>
  );
}

function Past({ rows }: { rows: Brief[] }) {
  return (
    <Card>
      <CardHeader title="Your earlier mentorships" />
      <ul className="divide-y divide-border">
        {rows.map((r) => (
          <li key={r.id}>
            <Link to={`/p/mentors/m/${r.id}`} className="flex items-center justify-between gap-3 px-card py-3 text-sm hover:bg-hover">
              <span>{r.mentor ? `With ${r.mentor.name}` : "No mentor"}</span>
              <span className="flex items-center gap-3 text-xs text-muted">{r.ended_at && timeAgo(r.ended_at)} <StatusBadge status={r.status} /></span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
