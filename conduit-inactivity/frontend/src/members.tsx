// HR's side: who has gone quiet, everyone's leave of absence, and the settings.
import {
  api, Avatar, Badge, Button, Card, CardBody, CardHeader, Dialog, DiscordPings, EmptyState, Field, Input, PageHeader, SearchInput, Segmented,
  Skeleton, SwitchRow, TabPanel, Table, Tabs, Td, Textarea, Th, THead, timeAgo, toast, Tr,
} from "@conduit/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";

import { Calendar, Check, Download, Moon, Refresh, X } from "./icons";
import { LeaveBadge, span } from "./leave";
import { BASE, type Leave, type Members, type Settings, type Summary } from "./types";

type Filter = "inactive" | "leave" | "all";
type LeaveTab = "pending" | "current" | "upcoming" | "past";

export function MembersPage() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") ?? "members";
  const { data: summary } = useQuery({ queryKey: ["inactivity", "summary"], queryFn: () => api.get<Summary>(`${BASE}/summary`) });
  const { data: members } = useQuery({ queryKey: ["inactivity", "members", "inactive", ""], queryFn: () => api.get<Members>(`${BASE}/members?filter=inactive`) });
  const canManage = members?.can_manage ?? false;
  return (
    <>
      <PageHeader
        eyebrow="Inactivity"
        title="Inactive members"
        icon={<Moon />}
        description={`Members with no activity for ${summary?.days ?? 30} days, unless they're on leave. Checked once a day; HR is told who went quiet.`}
      />
      <Tabs
        value={tab}
        onValueChange={(v) => setParams(v === "members" ? {} : { tab: v }, { replace: true })}
        variant="pills"
        className="space-y-4"
        items={[
          { value: "members", label: "Members", count: summary?.inactive },
          { value: "leave", label: "Leave of absence", count: summary?.pending },
          ...(canManage ? [{ value: "settings", label: "Settings" }] : []),
        ]}
      >
        <TabPanel value="members"><MembersTab /></TabPanel>
        <TabPanel value="leave"><LeaveTab canManage={canManage} /></TabPanel>
        {canManage && <TabPanel value="settings"><SettingsTab /></TabPanel>}
      </Tabs>
    </>
  );
}

function Seen({ at }: { at: string | null }) {
  return at ? <span title={new Date(at).toLocaleString()}>{timeAgo(at)}</span> : <span className="text-subtle">—</span>;
}

function MembersTab() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Filter>("inactive");
  const [q, setQ] = useState("");
  const [dq, setDq] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDq(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);
  const { data, isLoading } = useQuery({
    queryKey: ["inactivity", "members", filter, dq],
    queryFn: () => api.get<Members>(`${BASE}/members?filter=${filter}&q=${encodeURIComponent(dq)}`),
  });
  const scan = useMutation({
    mutationFn: () => api.post(`${BASE}/scan`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inactivity"] });
      toast.success("Everyone checked again");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Card>
      <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
        <Segmented<Filter>
          value={filter}
          onChange={setFilter}
          options={[
            { value: "inactive", label: `Inactive${data ? ` (${data.counts.inactive})` : ""}` },
            { value: "leave", label: `On leave${data ? ` (${data.counts.leave})` : ""}` },
            { value: "all", label: `Everyone${data ? ` (${data.counts.all})` : ""}` },
          ]}
        />
        <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a character" className="w-56" aria-label="Search members" />
        <div className="ml-auto flex items-center gap-2">
          {data?.checked_at && <span className="text-xs text-subtle">Checked {timeAgo(data.checked_at)}</span>}
          {data?.can_manage && <Button size="sm" variant="ghost" loading={scan.isPending} onClick={() => scan.mutate()}>{!scan.isPending && <Refresh />} Check now</Button>}
          <a href={`${BASE}/members.csv?filter=${filter}&q=${encodeURIComponent(dq)}`} download>
            <Button size="sm" variant="outline"><Download /> CSV</Button>
          </a>
        </div>
      </div>
      {isLoading || !data ? (
        <CardBody><Skeleton className="h-40" /></CardBody>
      ) : data.items.length === 0 ? (
        <EmptyState
          icon={filter === "inactive" ? <Check /> : <Moon />}
          title={dq ? "Nobody matches" : filter === "inactive" ? "Nobody has gone quiet" : filter === "leave" ? "Nobody is on leave" : "Nobody checked yet"}
          description={!data.checked_at ? "The first check runs tonight, or press Check now." : undefined}
        />
      ) : (
        <Table>
          <THead>
            <tr>
              <Th>Member</Th>
              <Th>Status</Th>
              <Th>Last active</Th>
              <Th>Signed in to the site</Th>
              <Th>Played</Th>
              <Th>Last fleet</Th>
            </tr>
          </THead>
          <tbody>
            {data.items.map((m) => (
              <Tr key={m.id}>
                <Td>
                  <div className="flex items-center gap-3">
                    <Avatar src={m.portrait} name={m.name} size="sm" />
                    <span>
                      <span className="block font-medium">{m.name}</span>
                      <span className="block text-xs text-muted">{m.corporation ?? "No corporation"}</span>
                    </span>
                  </div>
                </Td>
                <Td>
                  {m.on_leave_until ? (
                    <Badge tone="info">On leave until {new Date(m.on_leave_until + "T00:00").toLocaleDateString()}</Badge>
                  ) : m.inactive ? (
                    <Badge tone="warning">Inactive{m.days_inactive != null ? ` ${m.days_inactive} days` : ""}</Badge>
                  ) : (
                    <Badge tone="success">Active</Badge>
                  )}
                </Td>
                <Td className="text-muted"><Seen at={m.last_active} /></Td>
                <Td className="text-muted"><Seen at={m.last_site} /></Td>
                <Td className="text-muted"><Seen at={m.last_game} /></Td>
                <Td className="text-muted"><Seen at={m.last_fleet} /></Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </Card>
  );
}

function LeaveTab({ canManage }: { canManage: boolean }) {
  const qc = useQueryClient();
  const [status, setStatus] = useState<LeaveTab>("pending");
  const [deciding, setDeciding] = useState<{ leave: Leave; approve: boolean } | null>(null);
  const [note, setNote] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["inactivity", "leaves", status],
    queryFn: () => api.get<{ items: Leave[] }>(`${BASE}/leaves?status=${status}`),
  });
  const decide = useMutation({
    mutationFn: () => api.post<Leave>(`${BASE}/leaves/${deciding!.leave.id}/decide`, { approve: deciding!.approve, note }),
    onSuccess: (lv) => {
      toast.success(lv.status === "approved" ? "Approved" : "Not approved");
      setDeciding(null);
      setNote("");
      qc.invalidateQueries({ queryKey: ["inactivity"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Card>
      <div className="border-b border-border p-3">
        <Segmented<LeaveTab>
          value={status}
          onChange={setStatus}
          options={[
            { value: "pending", label: "Waiting" },
            { value: "current", label: "Away now" },
            { value: "upcoming", label: "Coming up" },
            { value: "past", label: "Past" },
          ]}
        />
      </div>
      {isLoading || !data ? (
        <CardBody><Skeleton className="h-32" /></CardBody>
      ) : data.items.length === 0 ? (
        <EmptyState icon={<Calendar />} title={status === "pending" ? "Nothing waiting" : "Nothing here"} />
      ) : (
        <ul className="divide-y divide-border">
          {data.items.map((lv) => (
            <li key={lv.id} className="flex flex-wrap items-start gap-3 px-card py-3">
              <Avatar src={lv.user!.portrait} name={lv.user!.name} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{lv.user!.name}</span>
                  <span className="text-sm text-muted">{span(lv)}</span>
                  <LeaveBadge lv={lv} />
                </div>
                {lv.reason && <p className="mt-1 whitespace-pre-line text-sm text-muted">{lv.reason}</p>}
                {lv.note && <p className="mt-1 text-sm italic text-muted">“{lv.note}”{lv.decided_by ? ` — ${lv.decided_by}` : ""}</p>}
                <div className="mt-1 text-xs text-subtle">Posted {timeAgo(lv.created_at)}</div>
              </div>
              {canManage && lv.status === "pending" && (
                <div className="flex gap-2">
                  <Button size="sm" variant="primary" onClick={() => setDeciding({ leave: lv, approve: true })}><Check /> Approve</Button>
                  <Button size="sm" variant="ghost" onClick={() => setDeciding({ leave: lv, approve: false })}><X /> Reject</Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      <Dialog
        open={!!deciding}
        onOpenChange={(o) => !o && setDeciding(null)}
        title={deciding?.approve ? "Approve this leave?" : "Reject this leave?"}
        description={deciding ? `${deciding.leave.user!.name}, ${span(deciding.leave)}` : undefined}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeciding(null)}>Back</Button>
            <Button variant={deciding?.approve ? "primary" : "danger"} loading={decide.isPending} onClick={() => decide.mutate()}>
              {deciding?.approve ? "Approve" : "Reject"}
            </Button>
          </>
        }
      >
        <Field label="Note for them (optional)">
          <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
      </Dialog>
    </Card>
  );
}

function SettingsTab() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["inactivity", "settings"], queryFn: () => api.get<Settings>(`${BASE}/settings`) });
  const [form, setForm] = useState<Settings | null>(null);
  useEffect(() => {
    if (data) setForm(data);
  }, [data]);
  const save = useMutation({
    mutationFn: (s: Settings) => api.put<Settings>(`${BASE}/settings`, s),
    onSuccess: (s) => {
      qc.setQueryData(["inactivity", "settings"], s);
      qc.invalidateQueries({ queryKey: ["inactivity"] });
      toast.success("Saved, and everyone checked again");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  if (isLoading || !form) return <Skeleton className="h-64" />;
  const set = (patch: Partial<Settings>) => setForm({ ...form, ...patch });
  const toggle = (key: "states" | "groups", id: number) =>
    set({ [key]: form[key].includes(id) ? form[key].filter((x) => x !== id) : [...form[key], id] } as Partial<Settings>);
  return (
    <div className="grid max-w-5xl gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader title="What counts as active" description="A member is active when any switched-on kind of activity is recent enough." />
        <CardBody className="space-y-2">
          <Field label="Inactive after (days)">
            <Input type="number" min={1} max={3650} value={form.days} onChange={(e) => set({ days: Number(e.target.value) })} className="w-32" />
          </Field>
          <div className="divide-y divide-border">
            <SwitchRow label="Signed in to the site" description="When they last signed in to EvE Conduit." checked={form.use_site} onCheckedChange={(v) => set({ use_site: v })} />
            <SwitchRow label="Played EVE" description="Their characters' last login or logout, from character sheets and corporation member tracking." checked={form.use_game} onCheckedChange={(v) => set({ use_game: v })} />
            <SwitchRow
              label="Flew in a fleet"
              description={form.fleets_available ? "Their last FAT from Fleets & FATs." : "Needs the Fleets & FATs plugin installed and switched on."}
              checked={form.use_fleets}
              onCheckedChange={(v) => set({ use_fleets: v })}
            />
          </div>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Leave of absence" />
        <CardBody className="space-y-2">
          <div className="divide-y divide-border">
            <SwitchRow label="Leave needs approval" description="Off: leave counts as soon as a member posts it." checked={form.leave_needs_approval} onCheckedChange={(v) => set({ leave_needs_approval: v })} />
            <SwitchRow label="Tell members when they're flagged" description="A “we haven't seen you” notification pointing to this page." checked={form.notify_member} onCheckedChange={(v) => set({ notify_member: v })} />
          </div>
          <Field label="Longest leave (days)">
            <Input type="number" min={1} max={3650} value={form.max_leave_days} onChange={(e) => set({ max_leave_days: Number(e.target.value) })} className="w-32" />
          </Field>
        </CardBody>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader title="Who is checked" description="Members in any ticked state and any ticked group. Nothing ticked means everyone. Guests are never checked." />
        <CardBody className="grid gap-6 sm:grid-cols-2">
          <Picks label="States" options={form.state_options} chosen={form.states} onToggle={(id) => toggle("states", id)} />
          <Picks label="Groups" options={form.group_options} chosen={form.groups} onToggle={(id) => toggle("groups", id)} />
        </CardBody>
      </Card>
      <div className="lg:col-span-2">
        <Button variant="primary" loading={save.isPending} onClick={() => save.mutate(form)}>Save settings</Button>
      </div>
      <DiscordPings plugin="inactivity" className="lg:col-span-2" />
    </div>
  );
}

function Picks({ label, options, chosen, onToggle }: { label: string; options: { id: number; name: string }[]; chosen: number[]; onToggle: (id: number) => void }) {
  return (
    <div>
      <div className="mb-2 text-[13px] font-medium">{label}</div>
      {options.length === 0 ? (
        <p className="text-sm text-muted">None yet.</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {options.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => onToggle(o.id)}
              className={`border px-2 py-1 text-sm ${chosen.includes(o.id) ? "border-accent bg-accent-soft text-accent-ink" : "border-border text-muted hover:text-text"}`}
              aria-pressed={chosen.includes(o.id)}
            >
              {o.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
