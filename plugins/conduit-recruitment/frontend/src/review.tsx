// The recruiters' side: the queue and one application with the applicant's characters.
import {
  api, Avatar, Badge, Button, Card, CardBody, CardHeader, date, Dialog, EmptyState, Field, isk, num, PageHeader, SearchInput,
  Skeleton, Table, Td, Textarea, Th, THead, timeAgo, toast, Tr, useCurrentUser, useHasPerm,
} from "@conduit/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

import { Back, Check, External, Form as FormIcon, Hand, Users, X } from "./icons";
import { Answer, Conversation, Progress, StatusBadge } from "./shared";
import { type ApplicationInfo, BASE, type CharacterSummary, type Status } from "./types";

interface Queue {
  items: ApplicationInfo[];
  counts: { open: number; new: number; mine: number; accepted: number; rejected: number; withdrawn: number };
}

const FILTERS: { value: string; label: string; count: keyof Queue["counts"] }[] = [
  { value: "open", label: "Open", count: "open" },
  { value: "mine", label: "Mine", count: "mine" },
  { value: "accepted", label: "Accepted", count: "accepted" },
  { value: "rejected", label: "Rejected", count: "rejected" },
  { value: "withdrawn", label: "Withdrawn", count: "withdrawn" },
];

export function QueuePage() {
  const navigate = useNavigate();
  const canManage = useHasPerm("recruit.manage_forms");
  const [status, setStatus] = useState("open");
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setSearch(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);
  const { data, isLoading } = useQuery({
    queryKey: ["recruit", "queue", status, search],
    queryFn: () => api.get<Queue>(`${BASE}/applications?status=${status}&q=${encodeURIComponent(search)}`),
    refetchInterval: 60_000,
  });

  return (
    <>
      <PageHeader
        eyebrow="Recruitment"
        title="Applications"
        icon={<Users />}
        description="People who want to join. Open one to see their answers and characters, talk to them, and accept or reject."
        actions={canManage ? <Link to="/p/recruit/forms"><Button><FormIcon /> Forms</Button></Link> : undefined}
      />
      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-border px-card py-3">
          <div className="flex flex-wrap gap-1">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setStatus(f.value)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm transition-colors ${status === f.value ? "bg-accent-soft text-text" : "text-muted hover:bg-hover hover:text-text"}`}
              >
                {f.label}
                {data && <span className="font-mono text-[11px] text-subtle">{data.counts[f.count]}</span>}
              </button>
            ))}
          </div>
          <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a pilot or form" className="ml-auto w-64" aria-label="Search applications" />
        </div>
        {isLoading || !data ? (
          <div className="p-card"><Skeleton className="h-40" /></div>
        ) : data.items.length === 0 ? (
          <EmptyState icon={<Users />} title={status === "open" ? "No open applications" : "Nothing here"} description={status === "open" ? "New applications show up here, and recruiters get a notification." : undefined} />
        ) : (
          <Table>
            <THead>
              <tr>
                <Th>Applicant</Th>
                <Th>Form</Th>
                <Th>Status</Th>
                <Th>Recruiter</Th>
                <Th align="right">Applied</Th>
              </tr>
            </THead>
            <tbody>
              {data.items.map((a) => (
                <Tr key={a.id} interactive onClick={() => navigate(`/p/recruit/applications/${a.id}`)}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <Avatar src={a.user.portrait} name={a.user.name} size="sm" />
                      <span className="font-medium">{a.user.name}</span>
                    </div>
                  </Td>
                  <Td className="text-muted">{a.form.name}</Td>
                  <Td><StatusBadge status={a.status} /></Td>
                  <Td className="text-muted">{a.reviewer ?? "—"}</Td>
                  <Td align="right" className="text-xs text-muted">{timeAgo(a.created_at)}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}

function age(birthday: string | null) {
  if (!birthday) return "—";
  const years = (Date.now() - Date.parse(birthday)) / (365.25 * 86400_000);
  return years >= 1 ? `${years.toFixed(1)} years` : `${Math.round(years * 12)} months`;
}

function CharacterRow({ c }: { c: CharacterSummary }) {
  return (
    <li className="space-y-2 px-card py-3">
      <div className="flex items-center gap-3">
        <Avatar src={c.portrait} name={c.name} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{c.name}</span>
            {c.main && <Badge tone="accent">main</Badge>}
            {!c.login_ok && <Badge tone="warning">login expired</Badge>}
          </div>
          <div className="truncate text-xs text-muted">{[c.corporation, c.alliance].filter(Boolean).join(" · ") || "No corporation"}</div>
        </div>
        <Link to={`/characters/${c.id}`} target="_blank" className="text-subtle hover:text-text" aria-label={`Open ${c.name}'s character sheet`}>
          <External />
        </Link>
      </div>
      <dl className="grid grid-cols-3 gap-x-3 gap-y-1 text-xs">
        <div><dt className="text-subtle">Skill points</dt><dd className="font-mono">{c.total_sp != null ? `${(c.total_sp / 1e6).toFixed(1)}M` : "—"}</dd></div>
        <div><dt className="text-subtle">Wallet</dt><dd className="font-mono">{c.wallet != null ? isk(c.wallet) : "—"}</dd></div>
        <div><dt className="text-subtle">Age</dt><dd className="font-mono">{age(c.birthday)}</dd></div>
        <div><dt className="text-subtle">Security</dt><dd className="font-mono">{c.security_status != null ? c.security_status.toFixed(1) : "—"}</dd></div>
        <div><dt className="text-subtle">Kills / losses</dt><dd className="font-mono">{num(c.kills)} / {num(c.losses)}</dd></div>
      </dl>
    </li>
  );
}

export function ApplicationPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const me = useCurrentUser();
  const key = ["recruit", "application", id];
  const { data, isLoading, error } = useQuery({ queryKey: key, queryFn: () => api.get<ApplicationInfo>(`${BASE}/applications/${id}`) });
  const [deciding, setDeciding] = useState<"accept" | "reject" | null>(null);
  const [message, setMessage] = useState("");
  const set = (d: ApplicationInfo) => {
    qc.setQueryData(key, d);
    qc.invalidateQueries({ queryKey: ["recruit", "queue"] });
  };
  const claim = useMutation({ mutationFn: () => api.post<ApplicationInfo>(`${BASE}/applications/${id}/claim`), onSuccess: set, onError: (e: Error) => toast.error(e.message) });
  const decide = useMutation({
    mutationFn: (accept: boolean) => api.post<ApplicationInfo>(`${BASE}/applications/${id}/decide`, { accept, message }),
    onSuccess: (d) => {
      set(d);
      setDeciding(null);
      setMessage("");
      toast.success(d.status === "accepted" ? `${d.user.name} accepted` : `${d.user.name} rejected`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (error) return <EmptyState icon={<Users />} title="Application not found" action={<Link to="/p/recruit"><Button>Back to applications</Button></Link>} />;
  if (isLoading || !data) return <Skeleton className="h-96" />;
  const open = data.status === "new" || data.status === "review";

  return (
    <>
      <Link to="/p/recruit" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-text">
        <Back /> Applications
      </Link>
      <PageHeader
        eyebrow={data.form.name}
        title={data.user.name}
        description={`Applied ${date(data.created_at)}${data.reviewer ? ` · recruiter: ${data.reviewer}` : ""}`}
        icon={data.user.portrait ? <img src={data.user.portrait} alt="" className="size-full object-cover" /> : <Users />}
        actions={
          open ? (
            <div className="flex flex-wrap gap-2">
              {data.reviewer_id !== me?.id && (
                <Button onClick={() => claim.mutate()} loading={claim.isPending}>
                  {!claim.isPending && <Hand />} {data.reviewer ? "Take over" : "Take it"}
                </Button>
              )}
              <Button variant="danger" onClick={() => setDeciding("reject")}><X /> Reject</Button>
              <Button variant="primary" onClick={() => setDeciding("accept")}><Check /> Accept</Button>
            </div>
          ) : (
            <StatusBadge status={data.status as Status} />
          )
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="space-y-6">
          <Card>
            <CardBody><Progress app={data} /></CardBody>
          </Card>
          <Card>
            <CardHeader title="Answers" />
            <CardBody className="space-y-5 text-sm">
              {(data.questions ?? []).length === 0 && <p className="text-muted">This form has no questions.</p>}
              {(data.questions ?? []).map((q) => (
                <div key={q.id}>
                  <div className="text-xs font-medium uppercase tracking-wider text-subtle">{q.label}</div>
                  <div className="mt-1"><Answer value={q.answer} /></div>
                </div>
              ))}
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Notes and messages" description="Internal notes are only for recruiters; messages go to the applicant." />
            <CardBody>
              <Conversation
                comments={data.comments ?? []}
                recruiter
                onSend={(text, internal) => api.post<ApplicationInfo>(`${BASE}/applications/${id}/comments`, { text, internal }).then(set)}
              />
            </CardBody>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader
              title={`Characters · ${data.characters?.length ?? 0}`}
              description={open ? "Their full character sheets are open to recruiters while the application is open." : "Character sheets closed with the application."}
            />
            <ul className="divide-y divide-border">
              {(data.characters ?? []).map((c) => <CharacterRow key={c.id} c={c} />)}
            </ul>
          </Card>
          {(data.accept_groups ?? []).length > 0 && (
            <Card>
              <CardHeader title="Accepting adds them to" />
              <CardBody className="flex flex-wrap gap-1.5">
                {data.accept_groups!.map((g) => <Badge key={g}>{g}</Badge>)}
              </CardBody>
            </Card>
          )}
          {(data.history ?? []).length > 0 && (
            <Card>
              <CardHeader title="Earlier applications" />
              <ul className="divide-y divide-border">
                {data.history!.map((h) => (
                  <li key={h.id}>
                    <Link to={`/p/recruit/applications/${h.id}`} className="flex items-center justify-between gap-3 px-card py-3 text-sm hover:bg-hover">
                      <span>{h.form}</span>
                      <span className="flex items-center gap-3 text-xs text-muted">{date(h.created_at)} <StatusBadge status={h.status} /></span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>

      <Dialog
        open={deciding !== null}
        onOpenChange={(o) => !o && setDeciding(null)}
        title={deciding === "accept" ? `Accept ${data.user.name}?` : `Reject ${data.user.name}?`}
        description={
          deciding === "accept"
            ? (data.accept_groups ?? []).length > 0 ? `They're added to ${data.accept_groups!.join(", ")} and told straight away.` : "They're told straight away. This form adds them to no groups."
            : "They're told straight away. They can apply again later."
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeciding(null)}>Cancel</Button>
            <Button variant={deciding === "accept" ? "primary" : "solidDanger"} loading={decide.isPending} onClick={() => decide.mutate(deciding === "accept")}>
              {deciding === "accept" ? <><Check /> Accept</> : <><X /> Reject</>}
            </Button>
          </>
        }
      >
        <Field label="Message to them (optional)" hint="Sent with the notification and shown on their application.">
          <Textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} placeholder={deciding === "accept" ? "Welcome! Join the Discord and say hi in #new-members." : "Thanks for applying. We're looking for more experienced pilots right now."} />
        </Field>
      </Dialog>
    </>
  );
}
