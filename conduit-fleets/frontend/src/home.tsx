// Fleets overview: recent fleets, my attendance, and starting a fleet.
import {
  api, Badge, Button, Card, Dialog, EmptyState, Field, Input, PageHeader, SearchInput, Select, Skeleton, StatCard, SwitchRow, Table,
  TableToolbar, TabPanel, Tabs, Td, Textarea, Th, THead, timeAgo, toast, Tr, dateTime,
} from "@conduit/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate } from "react-router";

import { Chart, Check, Plus, Radar, Rocket } from "./icons";
import { BASE, type FcCharacter, type FleetDetail, type FleetType, type Overview } from "./types";

/** Characters that can track but haven't granted the MOTD scope. */
export function MotdScopeHint({ chars, on }: { chars: FcCharacter[]; on: boolean }) {
  const missing = chars.filter((c) => !c.can_motd);
  if (!on || !missing.length) return null;
  return (
    <p className="text-xs text-warning-fg">
      {missing.map((c) => c.name).join(", ")} can't edit the MOTD yet: log in with {missing.length === 1 ? "it" : "them"} again under Characters.
      FATs are still tracked.
    </p>
  );
}

export function TypeBadge({ type }: { type: FleetType | null }) {
  if (!type) return null;
  return (
    <Badge color={type.color} variant="dot" size="xs">
      {type.name}
    </Badge>
  );
}

export function useOverview(q = "", type = "") {
  return useQuery({
    queryKey: ["fleets", "overview", q, type],
    queryFn: () => api.get<Overview>(`${BASE}?q=${encodeURIComponent(q)}${type ? `&type=${type}` : ""}`),
    placeholderData: (prev) => prev,
  });
}

export function HomePage() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [creating, setCreating] = useState(false);
  const { data, isLoading } = useOverview(q.trim(), type);

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Fleets"
        icon={<Rocket />}
        description="Who flew in each fleet (FATs). FCs track their in-game fleet or hand out a FAT link; attendance counts towards group rules."
        actions={
          <div className="flex flex-wrap gap-2">
            {data?.can_manage && (
              <Link to="/p/fleets/attendance">
                <Button variant="ghost"><Chart /> Attendance</Button>
              </Link>
            )}
            {data?.can_run && (
              <Button variant="primary" onClick={() => setCreating(true)}><Plus /> New fleet</Button>
            )}
          </div>
        }
      />

      {isLoading || !data ? (
        <div className="grid gap-4 sm:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-28" />)}</div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="My fleets · 30 days" value={data.me.counts.days_30} tone={data.me.counts.days_30 ? "accent" : undefined}
              hint={data.me.by_type_30.map((t) => `${t.count} ${t.type}`).join(" · ") || "none yet"} />
            <StatCard label="My fleets · 90 days" value={data.me.counts.days_90} />
            <StatCard label="My fleets · all time" value={data.me.counts.all} />
          </div>

          <Tabs
            variant="pills"
            defaultValue="fleets"
            className="space-y-4"
            items={[
              { value: "fleets", label: "Recent fleets", count: data.fleets.length },
              { value: "mine", label: "Fleets I flew in", count: data.me.fleets.length },
            ]}
          >
            <TabPanel value="fleets">
              <Card>
                <TableToolbar>
                  <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Fleet or FC" className="w-64" />
                  <Select value={type} onChange={(e) => setType(e.target.value)} className="w-44" aria-label="Fleet type">
                    <option value="">All types</option>
                    {data.types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </Select>
                </TableToolbar>
                {data.fleets.length === 0 ? (
                  <EmptyState icon={<Rocket />} title={q || type ? "No fleet matches" : "No fleets yet"}
                    description={data.can_run && !q && !type ? "Start one with New fleet." : undefined} />
                ) : (
                  <Table>
                    <THead>
                      <tr>
                        <Th>Fleet</Th>
                        <Th>FC</Th>
                        <Th>When</Th>
                        <Th align="right">Pilots</Th>
                        <Th align="right" />
                      </tr>
                    </THead>
                    <tbody>
                      {data.fleets.map((f) => (
                        <Tr key={f.id} interactive onClick={() => navigate(`/p/fleets/${f.id}`)}>
                          <Td>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium">{f.name}</span>
                              <TypeBadge type={f.type} />
                              {!f.ended_at && <Badge tone="success" size="xs">{f.tracking ? <><Radar className="size-3" /> Live</> : "Open"}</Badge>}
                            </div>
                          </Td>
                          <Td className="text-sm text-muted">{f.fc?.name ?? "—"}</Td>
                          <Td className="whitespace-nowrap text-sm text-muted" title={dateTime(f.started_at)}>{timeAgo(f.started_at)}</Td>
                          <Td numeric>{f.pilots}</Td>
                          <Td align="right">{f.attended && <Badge tone="accent" size="xs"><Check className="size-3" /> You flew</Badge>}</Td>
                        </Tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Card>
            </TabPanel>
            <TabPanel value="mine">
              <Card>
                {data.me.fleets.length === 0 ? (
                  <EmptyState icon={<Rocket />} title="No FATs yet" description="Fleets you fly in show up here once the FC tracks the fleet or you use its FAT link." />
                ) : (
                  <ul className="divide-y divide-border">
                    {data.me.fleets.map((f) => (
                      <li key={f.id}>
                        <Link to={`/p/fleets/${f.id}`} className="flex items-center gap-3 px-card py-3 hover:bg-hover">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 font-medium">{f.name} <TypeBadge type={f.type} /></div>
                            <div className="truncate text-xs text-subtle">{f.characters.join(", ")} · FC {f.fc?.name ?? "unknown"}</div>
                          </div>
                          <span className="whitespace-nowrap text-xs text-muted">{timeAgo(f.started_at)}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </TabPanel>
          </Tabs>
        </div>
      )}

      {creating && data && <NewFleetDialog types={data.types} onClose={() => setCreating(false)} />}
    </>
  );
}

const LINK_TIMES = [
  { value: "", label: "Until the fleet ends" },
  { value: "15", label: "15 minutes" },
  { value: "30", label: "30 minutes" },
  { value: "60", label: "1 hour" },
  { value: "120", label: "2 hours" },
];

function NewFleetDialog({ types, onClose }: { types: FleetType[]; onClose: () => void }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: chars } = useQuery({ queryKey: ["fleets", "fc-characters"], queryFn: () => api.get<FcCharacter[]>(`${BASE}/fc/characters`) });
  const [form, setForm] = useState({ name: "", fleet_type: "", notes: "", link_minutes: "", track_character: "", motd: true });
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));
  const create = useMutation({
    mutationFn: () =>
      api.post<FleetDetail>(BASE, {
        name: form.name,
        notes: form.notes,
        fleet_type: form.fleet_type ? Number(form.fleet_type) : null,
        link_minutes: form.link_minutes ? Number(form.link_minutes) : null,
        track_character: form.track_character ? Number(form.track_character) : null,
        motd: form.motd,
      }),
    onSuccess: (f) => {
      qc.invalidateQueries({ queryKey: ["fleets"] });
      if (f.warning) toast.warning(f.warning);
      else toast.success(f.tracking ? `Tracking ${f.name}: ${f.pilots} pilots so far` : `${f.name} started`);
      navigate(`/p/fleets/${f.id}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const trackable = (chars ?? []).filter((c) => c.can_track);
  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title="New fleet"
      description="Pilots get a FAT from your in-game fleet, the FAT link, or both."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!form.name.trim()} loading={create.isPending} onClick={() => create.mutate()}><Rocket /> Start fleet</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
          <Field label="Name" required>
            <Input value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="Sunday CTA: Keepstar defense" autoFocus />
          </Field>
          <Field label="Type">
            <Select value={form.fleet_type} onChange={(e) => set({ fleet_type: e.target.value })}>
              <option value="">None</option>
              {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </Select>
          </Field>
        </div>
        <Field label="Track the in-game fleet with" hint="That character must be fleet boss. Everyone in the fleet gets a FAT, checked every minute.">
          <Select value={form.track_character} onChange={(e) => set({ track_character: e.target.value })}>
            <option value="">Don't track; use the FAT link</option>
            {trackable.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>
        {form.track_character && (
          <>
            <SwitchRow
              label="FATs in the fleet MOTD"
              description="Who has a FAT and the FAT link, added below your own MOTD text and updated as pilots get one."
              checked={form.motd}
              onCheckedChange={(motd) => set({ motd })}
            />
            <MotdScopeHint chars={trackable.filter((c) => String(c.id) === form.track_character)} on={form.motd} />
          </>
        )}
        {chars && chars.length > trackable.length && (
          <p className="-mt-2 text-xs text-subtle">
            {chars.filter((c) => !c.can_track).map((c) => c.name).join(", ")} can't track: log in with them again to grant fleet access.
          </p>
        )}
        <Field label="FAT link stays open">
          <Select value={form.link_minutes} onChange={(e) => set({ link_minutes: e.target.value })} options={LINK_TIMES} className="max-w-xs" />
        </Field>
        <Field label="Notes" hint="Doctrine, comms, staging. Pilots see this on the FAT link page.">
          <Textarea rows={3} value={form.notes} onChange={(e) => set({ notes: e.target.value })} />
        </Field>
      </div>
    </Dialog>
  );
}
