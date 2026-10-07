// Pieces used by both the applicant's and the recruiters' pages.
import { Avatar, Badge, Button, cn, Input, Segmented, Select, Switch, Textarea, timeAgo, toast } from "@conduit/sdk";
import { useState } from "react";

import { Lock, Send } from "./icons";
import { type ApplicationInfo, type Comment, type Question, STATUS, type Status } from "./types";

export function StatusBadge({ status }: { status: Status }) {
  return <Badge tone={STATUS[status].tone}>{STATUS[status].label}</Badge>;
}

/** Submitted -> In review -> Decision, as a row of steps. */
export function Progress({ app }: { app: ApplicationInfo }) {
  const decided = app.status === "accepted" || app.status === "rejected" || app.status === "withdrawn";
  const steps = [
    { label: "Submitted", detail: timeAgo(app.created_at), done: true },
    { label: "In review", detail: app.reviewer ? `with ${app.reviewer}` : "waiting for a recruiter", done: app.status !== "new" },
    { label: decided ? STATUS[app.status].label : "Decision", detail: app.decided_at ? timeAgo(app.decided_at) : "", done: decided },
  ];
  return (
    <ol className="grid grid-cols-3 gap-2">
      {steps.map((s, i) => (
        <li
          key={i}
          className={cn(
            "border px-3 py-2.5",
            s.done ? (i === 2 && app.status === "rejected" ? "border-danger/35 bg-danger-soft" : "border-success/35 bg-success-soft") : "border-border",
          )}
        >
          <div className={cn("text-sm font-medium", !s.done && "text-subtle")}>{s.label}</div>
          <div className="truncate text-xs text-muted">{s.detail}</div>
        </li>
      ))}
    </ol>
  );
}

/** One answer field per question. */
export function QuestionField({ q, value, onChange }: { q: Question; value: string | boolean | null | undefined; onChange: (v: string | boolean | null) => void }) {
  const label = (
    <span className="block text-[13px] font-medium text-text">
      {q.label}
      {q.required && <span className="ml-0.5 text-danger-fg">*</span>}
    </span>
  );
  let control;
  if (q.kind === "long") control = <Textarea rows={4} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} />;
  else if (q.kind === "yesno")
    control = (
      <Segmented<"yes" | "no" | "">
        value={value === true ? "yes" : value === false ? "no" : ""}
        onChange={(v) => onChange(v === "yes" ? true : v === "no" ? false : null)}
        options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]}
        aria-label={q.label}
      />
    );
  else if (q.kind === "choice")
    control = (
      <Select value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} className="max-w-xs">
        <option value="">Choose…</option>
        {q.choices.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </Select>
    );
  else control = <Input value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} />;
  return (
    <div className="space-y-1.5">
      {label}
      {q.help && <p className="text-xs text-muted">{q.help}</p>}
      <div>{control}</div>
    </div>
  );
}

export function Answer({ value }: { value: string | boolean | null | undefined }) {
  if (value === true) return <span>Yes</span>;
  if (value === false) return <span>No</span>;
  if (value === null || value === undefined || value === "") return <span className="text-subtle">No answer</span>;
  return <span className="whitespace-pre-line">{value}</span>;
}

const EVENTS: Record<string, string> = { claimed: "took this application", accepted: "accepted the application", rejected: "rejected the application", withdrawn: "withdrew the application" };

/** The conversation on an application. Recruiters can also write internal notes the applicant never sees. */
export function Conversation({ comments, recruiter, onSend, disabled }: { comments: Comment[]; recruiter: boolean; onSend: (text: string, internal: boolean) => Promise<unknown>; disabled?: boolean }) {
  const [text, setText] = useState("");
  const [internal, setInternal] = useState(recruiter);
  const [busy, setBusy] = useState(false);
  const send = async () => {
    if (!text.trim()) return;
    setBusy(true);
    try {
      await onSend(text, internal);
      setText("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't send");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-4">
      {comments.length === 0 ? (
        <p className="text-sm text-muted">{recruiter ? "No notes or messages yet." : "No messages yet. Recruiters may write to you here."}</p>
      ) : (
        <ol className="space-y-3">
          {comments.map((c) =>
            c.event && EVENTS[c.event] ? (
              <li key={c.id} className="flex items-center gap-2 text-xs text-muted">
                <span className="h-px flex-1 bg-border" />
                <span>
                  <span className="font-medium text-text">{c.author}</span> {EVENTS[c.event]} · {timeAgo(c.created_at)}
                  {c.text && !["Took this application", "Withdrew the application", "Accepted", "Rejected"].includes(c.text) && <span className="block text-center italic">“{c.text}”</span>}
                </span>
                <span className="h-px flex-1 bg-border" />
              </li>
            ) : (
              <li key={c.id} className={cn("flex gap-3 border p-3", c.internal ? "border-warning/30 bg-warning-soft/60" : "border-border bg-surface-2/60")}>
                <Avatar src={c.portrait} name={c.author} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-medium text-text">{c.author}</span>
                    <span className="text-subtle">{timeAgo(c.created_at)}</span>
                    {c.internal && (
                      <Badge tone="warning">
                        <Lock className="size-3" /> internal note
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 whitespace-pre-line text-sm">{c.text}</p>
                </div>
              </li>
            ),
          )}
        </ol>
      )}
      {!disabled && (
        <div className="space-y-2">
          <Textarea
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={recruiter ? (internal ? "A note for the other recruiters…" : "A message to the applicant…") : "Write to the recruiters…"}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) send();
            }}
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            {recruiter ? (
              <label className="inline-flex items-center gap-2 text-sm text-muted">
                <Switch checked={internal} onCheckedChange={setInternal} />
                {internal ? "Internal note: only recruiters see it" : "Message: the applicant sees it"}
              </label>
            ) : (
              <span className="text-xs text-subtle">Ctrl+Enter sends</span>
            )}
            <Button variant={internal ? "secondary" : "primary"} loading={busy} disabled={!text.trim()} onClick={send}>
              {!busy && (internal ? <Lock /> : <Send />)} {internal ? "Add note" : "Send"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
