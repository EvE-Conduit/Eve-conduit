// The applicant's side: pick a form, answer it, follow the application and talk to the recruiters.
import {
  Alert, api, Button, Card, CardBody, CardHeader, ConfirmDialog, date, EmptyState, PageHeader, Skeleton, toast, useCurrentUser,
} from "@conduit/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router";

import { Back, External, Form as FormIcon, Send, Users, X } from "./icons";
import { Answer, Conversation, Progress, QuestionField, StatusBadge } from "./shared";
import { type ApplicationInfo, BASE, type DiscordStatus, type FormInfo } from "./types";

interface Me {
  forms: FormInfo[];
  discord: DiscordStatus | null;
  current: ApplicationInfo | null;
  past: ApplicationInfo[];
  is_recruiter: boolean;
}

const KEY = ["recruit", "me"];

export function ApplyPage() {
  const qc = useQueryClient();
  const user = useCurrentUser();
  const { data, isLoading, isFetching, refetch } = useQuery({ queryKey: KEY, queryFn: () => api.get<Me>(`${BASE}/me`) });
  const [form, setForm] = useState<FormInfo | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | boolean | null>>({});
  const [withdrawing, setWithdrawing] = useState(false);
  const refresh = () => qc.invalidateQueries({ queryKey: KEY });

  const submit = useMutation({
    mutationFn: () => api.post<ApplicationInfo>(`${BASE}/applications`, { form_id: form!.id, answers }),
    onSuccess: () => {
      toast.success("Application sent. The recruiters have been told.");
      setForm(null);
      setAnswers({});
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading || !data) return <Skeleton className="h-64" />;
  const current = data.current;
  const discordBlocked = !!form && !!data.discord && !data.discord.ok;

  return (
    <>
      <PageHeader
        eyebrow="Recruitment"
        title={current ? "Your application" : form ? form.name : "Join us"}
        icon={<Users />}
        description={
          current
            ? "Follow your application here. Recruiters can see your characters while it's open, and may write to you."
            : form
              ? form.description || "Answer the questions below. Recruiters will see your characters once you apply."
              : `Welcome${user?.main ? `, ${user.main.name}` : ""}. Pick what you'd like to apply for.`
        }
        actions={data.is_recruiter ? <Link to="/p/recruit"><Button variant="ghost"><Users /> Applications</Button></Link> : undefined}
      />

      {!current && !form && <Decision app={data.past[0]} />}

      {current ? (
        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <Card>
              <CardHeader title={current.form.name} description={`Sent ${date(current.created_at)}`} actions={<StatusBadge status={current.status} />} />
              <CardBody>
                <Progress app={current} />
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="Messages" description="Between you and the recruiters." />
              <CardBody>
                <Conversation
                  comments={current.comments ?? []}
                  recruiter={false}
                  onSend={(text) => api.post(`${BASE}/applications/${current.id}/comments`, { text }).then(refresh)}
                />
              </CardBody>
            </Card>
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader title="Your answers" />
              <CardBody className="space-y-4 text-sm">
                {(current.questions ?? []).map((q) => (
                  <div key={q.id}>
                    <div className="text-xs text-muted">{q.label}</div>
                    <Answer value={q.answer} />
                  </div>
                ))}
              </CardBody>
            </Card>
            <Button variant="ghost" className="w-full text-danger-fg" onClick={() => setWithdrawing(true)}>
              <X /> Withdraw application
            </Button>
          </div>
          <ConfirmDialog
            open={withdrawing}
            onOpenChange={setWithdrawing}
            title="Withdraw your application?"
            description="The recruiters are told and it's closed. You can apply again later."
            danger
            confirmLabel="Withdraw"
            onConfirm={() => api.post(`${BASE}/applications/${current.id}/withdraw`).then(refresh)}
          />
        </div>
      ) : form ? (
        <Card className="max-w-3xl">
          <CardBody className="space-y-6">
            {discordBlocked && <DiscordNeeded status={data.discord!} checking={isFetching} onCheck={() => refetch()} />}
            {form.questions.length === 0 && <p className="text-sm text-muted">No questions: just send it.</p>}
            {form.questions.map((q) => (
              <QuestionField key={q.id} q={q} value={answers[q.id]} onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))} />
            ))}
            <div className="flex items-center justify-between gap-3 border-t border-border pt-5">
              <Button variant="ghost" onClick={() => setForm(null)}>
                <Back /> Back
              </Button>
              <Button variant="primary" loading={submit.isPending} disabled={discordBlocked} onClick={() => submit.mutate()}>
                {!submit.isPending && <Send />} Send application
              </Button>
            </div>
          </CardBody>
        </Card>
      ) : data.forms.length === 0 ? (
        <Card>
          <EmptyState icon={<Users />} title="Not recruiting right now" description="Check back later, or ask someone in the corporation." />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.forms.map((f) => (
            <Card key={f.id} interactive>
              <button type="button" className="block w-full p-card text-left" onClick={() => { setForm(f); setAnswers({}); }}>
                <div className="flex items-start gap-3">
                  <div className="grid size-10 shrink-0 place-items-center border border-border-strong text-accent-ink">
                    <FormIcon className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium">{f.name}</div>
                    {f.description && <p className="mt-1 line-clamp-3 text-sm text-muted">{f.description}</p>}
                    <div className="mt-2 text-xs text-subtle">
                      {f.questions.length} question{f.questions.length === 1 ? "" : "s"}
                      {data.discord && " · needs Discord"}
                    </div>
                  </div>
                </div>
              </button>
            </Card>
          ))}
        </div>
      )}

      {data.past.length > 0 && (
        <Card className="mt-6">
          <CardHeader title="Earlier applications" />
          <ul className="divide-y divide-border">
            {data.past.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 px-card py-3 text-sm">
                <span>{a.form.name}</span>
                <span className="flex items-center gap-3 text-xs text-muted">
                  {date(a.created_at)} <StatusBadge status={a.status} />
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}

/** What's missing before a form that requires Discord can be sent. */
function DiscordNeeded({ status, checking, onCheck }: { status: DiscordStatus; checking: boolean; onCheck: () => void }) {
  const title = status.error
    ? "We couldn't check your Discord"
    : !status.linked
      ? "Link your Discord account first"
      : "Join our Discord server first";
  const text = status.error
    ? status.error
    : !status.linked
      ? "This application needs your Discord account linked and you on our server. Link it on the Discord page, then come back."
      : `Your Discord account ${status.username ?? ""} is linked but isn't on our server. Join it from the Discord page, then come back.`;
  return (
    <Alert tone="warning" title={title}>
      <p>{text}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link to="/p/discord"><Button size="sm" variant="outline"><External /> Go to Discord</Button></Link>
        <Button size="sm" variant="ghost" loading={checking} onClick={onCheck}>Check again</Button>
      </div>
    </Alert>
  );
}

/** The latest decision, for a few weeks after it was made. */
function Decision({ app }: { app: ApplicationInfo | undefined }) {
  if (!app?.decided_at || Date.now() - Date.parse(app.decided_at) > 30 * 86400_000) return null;
  if (app.status === "accepted") {
    return (
      <Alert tone="success" className="mb-6" title={`Welcome aboard! Your application to ${app.form.name} was accepted`}>
        <span className="whitespace-pre-line">{app.decision_message || `Accepted ${date(app.decided_at)}.`}</span>
      </Alert>
    );
  }
  if (app.status === "rejected") {
    return (
      <Alert tone="info" className="mb-6" title={`Your application to ${app.form.name} wasn't accepted this time`}>
        <span className="whitespace-pre-line">{app.decision_message || "You're welcome to apply again later."}</span>
      </Alert>
    );
  }
  return null;
}
