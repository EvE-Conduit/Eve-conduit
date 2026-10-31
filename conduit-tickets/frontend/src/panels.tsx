// Panels: messages the bot posts in a channel, whose buttons let people open a ticket themselves.
import {
  api, Button, Callout, Card, CardBody, ConfirmDialog, Dialog, EmptyState, Field, Input, PageHeader, RoleChips, Select, Skeleton, Textarea, toast,
} from "@conduit/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { Plus, TicketIcon } from "./icons";
import { BASE, type Panel, type PanelButton, type Panels } from "./types";

const MAX_BUTTONS = 5;

export function PanelsPage() {
  const [editing, setEditing] = useState<Panel | "new" | null>(null);
  const [deleting, setDeleting] = useState<Panel | null>(null);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["tickets", "panels"], queryFn: () => api.get<Panels>(`${BASE}/panels`) });
  const remove = useMutation({
    mutationFn: (p: Panel) => api.delete(`${BASE}/panels/${p.id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tickets", "panels"] });
      toast.success("Panel deleted");
      setDeleting(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const channelName = (id: string) => data?.channels.find((c) => c.id === id)?.name ?? id;
  const add = <Button variant="primary" onClick={() => setEditing("new")}><Plus /> New panel</Button>;
  return (
    <>
      <PageHeader eyebrow="Discord" title="Ticket panels" icon={<TicketIcon />} description="Post a message with buttons in a Discord channel. Anyone who can see the channel and has linked Discord can open a ticket with them." actions={add} />
      {!data ? (
        <Skeleton className="h-48" />
      ) : (
        <div className="space-y-4">
          {data.problems.length > 0 && (
            <Callout tone="warning">
              <ul className="list-disc space-y-1 pl-4">{data.problems.map((p) => <li key={p}>{p}</li>)}</ul>
            </Callout>
          )}
          <Card>
            <CardBody className="space-y-2">
              <p className="text-sm text-muted">On the <strong>General Information</strong> page of your Discord application, set <strong>Interactions Endpoint URL</strong> to this address, so clicks reach the site:</p>
              <code className="block break-all text-sm">{data.endpoint_url}</code>
            </CardBody>
          </Card>
          {data.panels.length === 0 ? (
            <EmptyState icon={<TicketIcon />} title="No panels" description="Each button has its own Discord roles and category." action={add} />
          ) : data.panels.map((p) => (
            <Card key={p.id}>
              <CardBody className="flex flex-wrap items-center justify-between gap-3">
                <span className="min-w-0">
                  <span className="block font-medium">{p.title}</span>
                  <span className="block text-sm text-muted">#{channelName(p.channel_id)} · {p.buttons.map((b) => b.label).join(", ")}</span>
                </span>
                <span className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditing(p)}>Edit</Button>
                  <Button size="sm" variant="ghost" onClick={() => setDeleting(p)}>Delete</Button>
                </span>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
      {editing && data && <PanelDialog key={editing === "new" ? "new" : editing.id} panel={editing === "new" ? null : editing} choices={data} onClose={() => setEditing(null)} />}
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete ${deleting?.title}?`}
        description="Its message goes from Discord. Tickets already opened from it stay open."
        confirmLabel="Delete panel"
        onConfirm={() => (deleting ? remove.mutateAsync(deleting) : undefined)}
      />
    </>
  );
}

function PanelDialog({ panel, choices, onClose }: { panel: Panel | null; choices: Panels; onClose: () => void }) {
  const qc = useQueryClient();
  const [channel, setChannel] = useState(panel?.channel_id ?? "");
  const [title, setTitle] = useState(panel?.title ?? "");
  const [text, setText] = useState(panel?.text ?? "");
  const [buttons, setButtons] = useState<PanelButton[]>(panel?.buttons ?? [{ label: "", role_ids: [], category_id: "" }]);
  const change = (i: number, part: Partial<PanelButton>) => setButtons(buttons.map((b, n) => (n === i ? { ...b, ...part } : b)));
  const valid = channel && title.trim() && buttons.every((b) => b.label.trim() && b.role_ids.length > 0);
  const save = useMutation({
    mutationFn: () => {
      const body = { channel_id: channel, title, text, buttons };
      return panel ? api.put(`${BASE}/panels/${panel.id}`, body) : api.post(`${BASE}/panels`, body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tickets", "panels"] });
      toast.success(panel ? "Panel updated on Discord" : "Panel posted on Discord");
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Dialog
      open
      size="lg"
      onOpenChange={(o) => !o && onClose()}
      title={panel ? "Edit panel" : "New panel"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!valid} loading={save.isPending} onClick={() => save.mutate()}>{panel ? "Save" : "Post panel"}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Channel" hint="Where the panel is posted. Who can see this channel on Discord decides who can use it.">
          <Select value={channel} onChange={(e) => setChannel(e.target.value)}>
            <option value="">Pick a channel</option>
            {choices.channels.map((c) => <option key={c.id} value={c.id}>#{c.name}</option>)}
          </Select>
        </Field>
        <Field label="Title">
          <Input maxLength={100} value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="Text" hint="Optional.">
          <Textarea rows={3} maxLength={2000} value={text} onChange={(e) => setText(e.target.value)} />
        </Field>
        {buttons.map((b, i) => (
          <div key={b.id ?? `new-${i}`} className="space-y-3 border border-border p-3">
            <Field label={`Button ${i + 1}`}>
              <Input maxLength={80} value={b.label} placeholder="Recruitment" onChange={(e) => change(i, { label: e.target.value })} />
            </Field>
            <Field label="Discord roles that see its tickets" hint="They're pinged when a ticket opens. A role must allow mentions, or the bot need Mention Everyone, for the ping to notify anyone.">
              <RoleChips roles={choices.roles} value={b.role_ids} onChange={(role_ids) => change(i, { role_ids })} />
            </Field>
            <Field label="Category" hint="Where its ticket channels go.">
              <Select value={b.category_id} onChange={(e) => change(i, { category_id: e.target.value })}>
                <option value="">The one from Settings</option>
                {choices.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
            {buttons.length > 1 && <Button size="sm" variant="ghost" onClick={() => setButtons(buttons.filter((_, n) => n !== i))}>Remove button</Button>}
          </div>
        ))}
        {buttons.length < MAX_BUTTONS && <Button size="sm" variant="outline" onClick={() => setButtons([...buttons, { label: "", role_ids: [], category_id: "" }])}><Plus /> Add button</Button>}
      </div>
    </Dialog>
  );
}
