// Writing and editing an announcement (announcements.post_announcements).
import { api, Button, cn, Dialog, Field, Input, Segmented, SwitchRow, Textarea, toast } from "@conduit/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";

import { Eye, Pencil } from "./icons";
import { Markdown } from "./markdown";
import { type Announcement, type Audience, BASE, type Tone } from "./types";

/** ISO time -> the value a datetime-local input shows, in the browser's time zone. */
function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(v: string): string | null {
  return v ? new Date(v).toISOString() : null;
}

export function Editor({ announcement: a, onClose }: { announcement: Announcement | null; onClose: () => void }) {
  const qc = useQueryClient();
  const { data: audience } = useQuery({ queryKey: ["announcements", "audience"], queryFn: () => api.get<Audience>(`${BASE}/audience`) });
  const [form, setForm] = useState({
    title: a?.title ?? "",
    body: a?.body ?? "",
    tone: (a?.tone ?? "info") as Tone,
    pinned: a?.pinned ?? false,
    notify: a?.notify ?? true,
    states: a?.states?.map((s) => s.id) ?? [],
    groups: a?.groups?.map((g) => g.id) ?? [],
    publish_at: a && a.status === "scheduled" ? toLocalInput(a.publish_at) : "",
    expires_at: toLocalInput(a?.expires_at),
  });
  const [tab, setTab] = useState<"write" | "preview">("write");
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));
  const toggle = (key: "states" | "groups", id: number) => set({ [key]: form[key].includes(id) ? form[key].filter((x) => x !== id) : [...form[key], id] });

  const save = useMutation({
    mutationFn: () => {
      const body = {
        ...form,
        publish_at: fromLocalInput(form.publish_at),
        expires_at: fromLocalInput(form.expires_at),
      };
      return a ? api.put<Announcement>(`${BASE}/${a.id}`, body) : api.post<Announcement>(BASE, body);
    },
    onSuccess: (saved) => {
      qc.invalidateQueries({ queryKey: ["announcements"] });
      toast.success(saved.status === "scheduled" ? "Scheduled" : a ? "Announcement updated" : "Announcement posted");
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const scheduled = !!form.publish_at && new Date(form.publish_at) > new Date();
  const alreadyOut = !!a?.announced_at;
  const everyone = form.states.length === 0 && form.groups.length === 0;

  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={a ? "Edit announcement" : "New announcement"}
      size="xl"
      footer={
        <>
          <span className="mr-auto self-center text-xs text-muted">
            {everyone ? "Everyone" : "Only the chosen states and groups"} will see it{scheduled ? ` from ${new Date(form.publish_at).toLocaleString()}` : ""}.
          </span>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!form.title.trim()} loading={save.isPending} onClick={() => save.mutate()}>
            {a ? "Save" : scheduled ? "Schedule" : "Post"}
          </Button>
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="min-w-0 space-y-4">
          <Field label="Title" required>
            <Input value={form.title} maxLength={200} onChange={(e) => set({ title: e.target.value })} placeholder="Stratop Saturday 18:00 ET" autoFocus />
          </Field>
          <div>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <span className="text-[13px] font-medium">Message</span>
              <Segmented<"write" | "preview">
                value={tab}
                onChange={setTab}
                size="sm"
                options={[{ value: "write", label: "Write", icon: <Pencil /> }, { value: "preview", label: "Preview", icon: <Eye /> }]}
              />
            </div>
            {tab === "write" ? (
              <>
                <Textarea
                  rows={12}
                  value={form.body}
                  onChange={(e) => set({ body: e.target.value })}
                  placeholder={"Form up in Jita at 17:45.\n\n- Doctrine: **Ferox fleet**\n- Comms: [Mumble](https://example.com)\n\nSRP covers doctrine fits."}
                  className="font-mono text-[13px]"
                />
                <p className="mt-1.5 text-xs text-subtle">**bold**, *italic*, `code`, [link](https://…), - lists, 1. lists, # headings, &gt; quotes. A blank line starts a new paragraph.</p>
              </>
            ) : (
              <div className="min-h-[280px] border border-border bg-bg/40 p-4">
                {form.body.trim() ? <Markdown text={form.body} /> : <p className="text-sm text-subtle">Nothing to preview yet.</p>}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <div className="mb-1.5 text-[13px] font-medium">Kind</div>
            <Segmented<Tone>
              value={form.tone}
              onChange={(tone) => set({ tone })}
              size="sm"
              className="w-full"
              options={[{ value: "info", label: "News" }, { value: "important", label: "Important" }, { value: "urgent", label: "Urgent" }]}
            />
            {form.tone === "urgent" && <p className="mt-1.5 text-xs text-warning-fg">Urgent ones notify people even if they muted announcements.</p>}
          </div>

          <div>
            <div className="mb-1.5 text-[13px] font-medium">Who sees it</div>
            <p className="mb-2 text-xs text-muted">Nothing picked means everyone.</p>
            <div className="flex flex-wrap gap-1.5">
              {(audience?.states ?? []).map((s) => (
                <Chip key={`s${s.id}`} on={form.states.includes(s.id)} onClick={() => toggle("states", s.id)} color={s.color}>{s.name}</Chip>
              ))}
            </div>
            {(audience?.groups.length ?? 0) > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {audience!.groups.map((g) => (
                  <Chip key={`g${g.id}`} on={form.groups.includes(g.id)} onClick={() => toggle("groups", g.id)}>{g.name}</Chip>
                ))}
              </div>
            )}
          </div>

          <div className="divide-y divide-border border border-border px-3">
            <SwitchRow label="Pin to the top" checked={form.pinned} onCheckedChange={(pinned) => set({ pinned })} />
            <SwitchRow
              label="Notify people"
              description={alreadyOut ? "Already sent; editing doesn't send it again." : "Under the bell, and through webhooks such as Discord."}
              checked={form.notify}
              disabled={alreadyOut}
              onCheckedChange={(notify) => set({ notify })}
            />
          </div>

          <Field label="Publish at" hint={alreadyOut ? "Already published." : "Empty: straight away."}>
            <Input type="datetime-local" value={form.publish_at} disabled={alreadyOut} onChange={(e) => set({ publish_at: e.target.value })} />
          </Field>
          <Field label="Take down at" hint="Optional. It disappears for members afterwards.">
            <Input type="datetime-local" value={form.expires_at} onChange={(e) => set({ expires_at: e.target.value })} />
          </Field>
        </div>
      </div>
    </Dialog>
  );
}

function Chip({ on, onClick, color, children }: { on: boolean; onClick: () => void; color?: string; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 border px-2 py-1 text-xs transition-colors",
        on ? "border-accent/60 bg-accent-soft text-text" : "border-border text-muted hover:border-border-strong hover:text-text",
      )}
    >
      {color && <span className="size-1.5 rotate-45" style={{ background: color }} />}
      {children}
    </button>
  );
}
