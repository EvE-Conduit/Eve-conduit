// Pieces used on several pages: status, focus chips, the goals checklist and the mentoring thread.
import { Avatar, Badge, Button, cn, Progress, Switch, Textarea, timeAgo, toast } from "@conduit/sdk";
import { useState } from "react";

import { Check, Lock, Send } from "./icons";
import { type GoalState, type Message, STATUS, type Status } from "./types";

export function StatusBadge({ status }: { status: Status }) {
  return <Badge tone={STATUS[status].tone}>{STATUS[status].label}</Badge>;
}

/** Focus areas as toggle chips (or plain badges when read-only). */
export function FocusChips({ areas, value, onChange }: { areas: string[]; value: string[]; onChange?: (v: string[]) => void }) {
  if (!onChange) {
    if (value.length === 0) return <span className="text-xs text-subtle">No focus given</span>;
    return (
      <div className="flex flex-wrap gap-1.5">
        {value.map((a) => <Badge key={a}>{a}</Badge>)}
      </div>
    );
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {areas.map((a) => {
        const on = value.includes(a);
        return (
          <button
            key={a}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? value.filter((x) => x !== a) : [...value, a])}
            className={cn("border px-2.5 py-1 text-xs transition-colors", on ? "border-accent bg-accent-soft text-text" : "border-border text-muted hover:bg-hover hover:text-text")}
          >
            {a}
          </button>
        );
      })}
    </div>
  );
}

export function GoalProgress({ done, total }: { done: number; total: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted">
        <span>Goals</span>
        <span className="font-mono tabular-nums">{done} / {total}</span>
      </div>
      <Progress value={total ? done / total : 0} tone={done === total && total > 0 ? "success" : "accent"} size="sm" />
    </div>
  );
}

/** The goals checklist. Auto goals show their rules and whether each passes right now. */
export function Goals({ goals, canTick, onTick }: { goals: GoalState[]; canTick: (g: GoalState) => boolean; onTick: (g: GoalState, done: boolean) => void }) {
  if (goals.length === 0) return <p className="text-sm text-muted">The program has no goals yet.</p>;
  return (
    <ol className="divide-y divide-border">
      {goals.map((g) => {
        const tickable = canTick(g) && !g.by_rules;
        return (
          <li key={g.id} className="flex gap-3 py-3">
            <button
              type="button"
              disabled={!tickable}
              onClick={() => onTick(g, !g.done)}
              aria-label={g.done ? `Untick ${g.title}` : `Tick ${g.title}`}
              className={cn(
                "mt-0.5 flex size-5 shrink-0 items-center justify-center border transition-colors",
                g.done ? "border-success bg-success text-white" : "border-border-strong",
                tickable ? "cursor-pointer hover:border-accent" : "cursor-default",
              )}
            >
              {g.done && <Check className="size-3.5" />}
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn("text-sm font-medium", g.done && "text-muted")}>{g.title}</span>
                {g.auto && <Badge tone="info">ticks itself</Badge>}
                {!g.auto && g.mentee_can_tick && <Badge>you can tick it</Badge>}
              </div>
              {g.description && <p className="mt-0.5 text-xs text-muted">{g.description}</p>}
              {g.auto && (
                <ul className="mt-1.5 space-y-0.5">
                  {g.checks.map((c, i) => (
                    <li key={i} className={cn("flex items-center gap-1.5 text-xs", c.ok ? "text-success-fg" : "text-subtle")}>
                      <span className={cn("size-1.5 shrink-0", c.ok ? "bg-success" : "bg-border-strong")} />
                      {c.text}
                    </li>
                  ))}
                </ul>
              )}
              {g.done && g.done_by && !g.by_rules && (
                <div className="mt-1 text-[11px] text-subtle">Ticked by {g.done_by}{g.done_at && `, ${timeAgo(g.done_at)}`}</div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

const EVENTS: Record<string, string> = {
  requested: "asked for a mentor",
  assigned: "",
  withdrawn: "withdrew the request",
  graduated: "graduated them",
  ended: "ended the mentorship",
};

/** The thread between mentor and mentee. Mentors and managers can also write private notes. */
export function Thread({ messages, staff, onSend, disabled }: { messages: Message[]; staff: boolean; onSend: (text: string, priv: boolean) => Promise<unknown>; disabled?: boolean }) {
  const [text, setText] = useState("");
  const [priv, setPriv] = useState(false);
  const [busy, setBusy] = useState(false);
  const send = async () => {
    if (!text.trim()) return;
    setBusy(true);
    try {
      await onSend(text, priv);
      setText("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't send");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-4">
      {messages.length === 0 ? (
        <p className="text-sm text-muted">No messages yet.</p>
      ) : (
        <ol className="space-y-3">
          {messages.map((m) =>
            m.event && m.event in EVENTS ? (
              <li key={m.id} className="flex items-center gap-2 text-xs text-muted">
                <span className="h-px flex-1 bg-border" />
                <span className="text-center">
                  {EVENTS[m.event] ? (
                    <>
                      <span className="font-medium text-text">{m.author}</span> {EVENTS[m.event]}
                    </>
                  ) : (
                    <span className="font-medium text-text">{m.text}</span>
                  )}{" "}
                  · {timeAgo(m.created_at)}
                  {(m.event === "graduated" || m.event === "ended") && m.text && m.text !== "Graduated" && <span className="block italic">“{m.text}”</span>}
                </span>
                <span className="h-px flex-1 bg-border" />
              </li>
            ) : (
              <li key={m.id} className={cn("flex gap-3 border p-3", m.private ? "border-warning/30 bg-warning-soft/60" : "border-border bg-surface-2/60")}>
                <Avatar src={m.portrait} name={m.author} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-medium text-text">{m.author}</span>
                    <span className="text-subtle">{timeAgo(m.created_at)}</span>
                    {m.private && (
                      <Badge tone="warning">
                        <Lock className="size-3" /> private note
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 whitespace-pre-line text-sm">{m.text}</p>
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
            placeholder={priv ? "A note for mentors and program managers…" : "Write a message…"}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) send();
            }}
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            {staff ? (
              <label className="inline-flex items-center gap-2 text-sm text-muted">
                <Switch checked={priv} onCheckedChange={setPriv} />
                {priv ? "Private note: the mentee doesn't see it" : "Message: everyone in the mentorship sees it"}
              </label>
            ) : (
              <span className="text-xs text-subtle">Ctrl+Enter sends</span>
            )}
            <Button variant={priv ? "secondary" : "primary"} loading={busy} disabled={!text.trim()} onClick={send}>
              {!busy && (priv ? <Lock /> : <Send />)} {priv ? "Add note" : "Send"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
