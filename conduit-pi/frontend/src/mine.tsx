// The member's side: every colony across their characters, what it makes, and their reminder settings.
import {
  api, Avatar, Badge, Button, Callout, Card, CardBody, CardHeader, EmptyState, Field, Input, isk, num, PageHeader, Progress, Segmented,
  Skeleton, StatCard, SwitchRow, TabPanel, Table, Tabs, Td, Th, THead, timeAgo, toast, Tooltip, Tr,
} from "@conduit/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";

import { Bell, Factory, Globe, Users } from "./icons";
import { ccLevel, Countdown, liveStatus, Tier, TypeName, useNow } from "./shared";
import { BASE, type Colony, type Flow, type Me, PREFS, type Settings } from "./types";

const KEY = ["pi", "me"];

export function MyPage() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") ?? "colonies";
  const { data, isLoading } = useQuery({ queryKey: KEY, queryFn: () => api.get<Me>(`${BASE}/me`), refetchInterval: 300_000 });
  return (
    <>
      <PageHeader
        eyebrow="Industry"
        title="Planetary Industry"
        icon={<Globe />}
        description="Every colony across your characters: extractor countdowns, factories, storage and what it all makes a day. Colonies refresh from EVE about once an hour."
        actions={data?.can_view_corp ? <Link to="/p/pi/corp"><Button variant="ghost"><Users /> Corporation PI</Button></Link> : undefined}
      />
      {isLoading || !data ? (
        <Skeleton className="h-64" />
      ) : (
        <Tabs
          value={tab}
          onValueChange={(v) => setParams(v === "colonies" ? {} : { tab: v }, { replace: true })}
          variant="pills"
          className="space-y-4"
          items={[
            { value: "colonies", label: "Colonies", count: data.totals.colonies },
            { value: "output", label: "Output" },
            { value: "reminders", label: "Reminders" },
          ]}
        >
          <TabPanel value="colonies"><ColoniesTab data={data} /></TabPanel>
          <TabPanel value="output"><OutputTab data={data} /></TabPanel>
          <TabPanel value="reminders"><RemindersTab initial={data.settings} /></TabPanel>
        </Tabs>
      )}
    </>
  );
}

function ColoniesTab({ data }: { data: Me }) {
  const now = useNow();
  const [character, setCharacter] = useState("all");
  const missing = data.characters.filter((c) => !c.has_scope);
  const shown = character === "all" ? data.colonies : data.colonies.filter((c) => String(c.character.id) === character);
  const expired = data.colonies.reduce((n, c) => n + c.extractors.filter((e) => liveStatus(e.status, e.expiry, now) === "expired" || e.status === "stopped").length, 0);
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Colonies" value={data.totals.colonies} hint={`on ${data.characters.filter((c) => c.colonies).length} characters`} />
        <StatCard label="Extractors running" value={`${data.totals.active} / ${data.totals.extractors}`} tone={expired ? "warning" : "success"}
          hint={data.totals.soon ? `${data.totals.soon} expire within ${data.settings.lead_hours}h` : "none about to expire"} />
        <StatCard label="Not running" value={expired} tone={expired ? "danger" : undefined} hint="extractors to restart" />
        <StatCard label="Output a day" value={isk(data.totals.isk_per_day)} mono hint="estimate at average prices" />
      </div>
      {missing.length > 0 && (
        <Callout tone="info" title="Some characters don't share their planets">
          {missing.map((c) => c.name).join(", ")} {missing.length === 1 ? "hasn't" : "haven't"} granted planet access. Log in with{" "}
          {missing.length === 1 ? "that character" : "them"} again from your characters page to add their colonies.
        </Callout>
      )}
      {data.colonies.length === 0 ? (
        <Card><EmptyState icon={<Globe />} title="No colonies yet" description="Colonies show here after your characters' next sync, once they have any." /></Card>
      ) : (
        <>
          {data.characters.filter((c) => c.colonies).length > 1 && (
            <Segmented
              value={character}
              onChange={setCharacter}
              options={[
                { value: "all", label: "Everyone" },
                ...data.characters.filter((c) => c.colonies).map((c) => ({ value: String(c.id), label: `${c.name} (${c.colonies})` })),
              ]}
            />
          )}
          <div className="grid gap-4 xl:grid-cols-2">
            {shown.map((c) => <ColonyCard key={c.id} c={c} now={now} />)}
          </div>
        </>
      )}
    </div>
  );
}

function ColonyCard({ c, now }: { c: Colony; now: number }) {
  const anyExpired = c.extractors.some((e) => liveStatus(e.status, e.expiry, now) === "expired" || e.status === "stopped");
  return (
    <Card className={anyExpired ? "ring-1 ring-danger/50" : undefined}>
      <div className="flex items-start gap-3 border-b border-border px-card py-3">
        <img src={c.image} alt="" className="size-12 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{c.name}</span>
            <Badge>{c.type}</Badge>
            <Badge tone="info">{ccLevel(c.upgrade_level)}</Badge>
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted">
            <span>{c.system.name} ({c.system.security.toFixed(1)})</span>
            <span>·</span>
            <span className="inline-flex items-center gap-1"><Avatar src={c.character.portrait} name={c.character.name} size="xs" rounded="full" /> {c.character.name}</span>
            <span>·</span>
            <span>Changed in game {timeAgo(c.last_update)}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-sm tabular-nums">{isk(c.isk_per_day)}</div>
          <div className="text-xs text-subtle">a day</div>
        </div>
      </div>
      <CardBody className="space-y-4">
        {c.extractors.length > 0 && (
          <div>
            <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-subtle">Extractors</div>
            <ul className="space-y-1.5">
              {c.extractors.map((e) => {
                const s = liveStatus(e.status, e.expiry, now);
                return (
                  <li key={e.pin_id} className={`flex items-center gap-3 rounded-control px-2 py-1 ${s === "expired" || s === "stopped" ? "bg-danger-soft" : ""}`}>
                    <div className="min-w-0 flex-1 text-sm"><TypeName type={e.product} /></div>
                    <Tooltip content={`${num(e.qty_per_cycle)} every ${Math.round(e.cycle_time / 60)} minutes, ${e.heads} heads`}>
                      <span className="font-mono text-xs tabular-nums text-muted">{e.per_day ? `${num(e.per_day)}/day` : "—"}</span>
                    </Tooltip>
                    <Countdown expiry={e.expiry} status={e.status} now={now} />
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        {c.factories.length > 0 && (
          <div>
            <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-subtle">Factories</div>
            <div className="flex flex-wrap gap-1.5">
              {c.factories.map((f) => (
                <Tooltip key={f.schematic} content={f.running < f.count ? `${f.count - f.running} with nothing routed in` : "All fed by a route"}>
                  <span className="inline-flex items-center gap-1.5 rounded-control border border-border px-2 py-1 text-sm">
                    {f.product && <img src={f.product.icon} alt="" className="size-5" />}
                    {f.count}× {f.schematic}
                    <Tier tier={f.tier} />
                    {f.running < f.count && <span className="text-xs text-warning-fg">{f.count - f.running} idle</span>}
                  </span>
                </Tooltip>
              ))}
            </div>
          </div>
        )}
        {c.storage.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {c.storage.map((s, i) => (
              <Tooltip key={i} content={s.contents.length ? s.contents.map((x) => `${num(x.amount)} ${x.type.name}`).join(", ") : "Empty"}>
                <div>
                  <div className="mb-1 flex items-baseline justify-between text-xs">
                    <span className="text-muted">{s.name}</span>
                    <span className="font-mono tabular-nums">{num(s.used)} / {num(s.capacity)} m³</span>
                  </div>
                  <Progress value={s.pct} tone={s.pct >= 90 ? "danger" : s.pct >= 70 ? "warning" : "accent"} size="sm" />
                </div>
              </Tooltip>
            ))}
          </div>
        )}
        <FlowList output={c.output} inputs={c.inputs} />
      </CardBody>
    </Card>
  );
}

function FlowList({ output, inputs }: { output: Flow[]; inputs: Flow[] }) {
  if (!output.length && !inputs.length) return <p className="text-sm text-muted">Nothing being made right now.</p>;
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
      {output.map((o) => (
        <span key={o.type.id} className="inline-flex items-center gap-1.5">
          <Tier tier={o.type.tier} /> <TypeName type={o.type} size="size-5" />
          <span className="font-mono text-xs tabular-nums text-muted">{num(o.per_day)}/day</span>
        </span>
      ))}
      {inputs.map((o) => (
        <Tooltip key={`in-${o.type.id}`} content="Used here but not made here: haul it in">
          <span className="inline-flex items-center gap-1.5 text-muted">
            <span className="text-xs">needs</span> <TypeName type={o.type} size="size-5" />
            <span className="font-mono text-xs tabular-nums">{num(o.per_day)}/day</span>
          </span>
        </Tooltip>
      ))}
    </div>
  );
}

function OutputTab({ data }: { data: Me }) {
  const total = data.totals.isk_per_day;
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <Card>
        <CardHeader title="What your colonies make" description="Made minus what your factories use, over all your colonies, valued at CCP's average price." actions={<span className="font-mono text-sm">{isk(total)} a day</span>} />
        {data.totals.output.length === 0 ? (
          <EmptyState icon={<Factory />} title="Nothing being made" />
        ) : (
          <Table>
            <THead>
              <tr>
                <Th>Product</Th>
                <Th>Tier</Th>
                <Th align="right">A day</Th>
                <Th align="right">ISK a day</Th>
                <Th align="right">A week</Th>
              </tr>
            </THead>
            <tbody>
              {data.totals.output.map((o) => (
                <Tr key={o.type.id}>
                  <Td><TypeName type={o.type} /></Td>
                  <Td><Tier tier={o.type.tier} /></Td>
                  <Td align="right" className="font-mono">{num(o.per_day)}</Td>
                  <Td align="right" className="font-mono">{isk(o.isk_per_day)}</Td>
                  <Td align="right" className="font-mono text-muted">{isk((o.isk_per_day ?? 0) * 7)}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
      <Card>
        <CardHeader title="To haul in" description="What your factories use that your colonies don't make." />
        {data.totals.inputs.length === 0 ? (
          <CardBody><p className="text-sm text-muted">Nothing: your colonies feed themselves.</p></CardBody>
        ) : (
          <ul className="divide-y divide-border">
            {data.totals.inputs.map((o) => (
              <li key={o.type.id} className="flex items-center justify-between gap-3 px-card py-2 text-sm">
                <TypeName type={o.type} />
                <span className="font-mono text-xs tabular-nums text-muted">{num(o.per_day)}/day</span>
              </li>
            ))}
          </ul>
        )}
        <CardBody className="border-t border-border text-xs text-subtle">
          Estimates: extractors at their average rate until they expire, factories with a route into them running every cycle.
        </CardBody>
      </Card>
    </div>
  );
}

function RemindersTab({ initial }: { initial: Settings }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<Settings>(initial);
  useEffect(() => setForm(initial), [initial]);
  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(initial), [form, initial]);
  const save = useMutation({
    // Kept with your other per-user settings; the reminder check reads them from there.
    mutationFn: (s: Settings) => api.put(PREFS, { value: s }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pi"] });
      toast.success("Reminders saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const set = (patch: Partial<Settings>) => setForm({ ...form, ...patch });
  return (
    <Card className="max-w-2xl">
      <CardHeader title="Reminders" icon={<Bell />} description="Notifications under the bell, once per extractor program. Mute “Planetary Industry reminders” in your settings to stop them all." />
      <CardBody className="space-y-3">
        <div className="divide-y divide-border">
          <SwitchRow label="Before an extractor expires" description="Not for programs you set shorter than the lead time." checked={form.soon} onCheckedChange={(v) => set({ soon: v })} />
          <SwitchRow label="When an extractor has expired" checked={form.expired} onCheckedChange={(v) => set({ expired: v })} />
          <SwitchRow label="Daily digest" description="One notification a day after downtime: what isn't running, what expires in the next 24 hours, and your ISK a day." checked={form.digest} onCheckedChange={(v) => set({ digest: v })} />
        </div>
        <Field label="Remind me this many hours before" hint="1 to 72 hours">
          <Input type="number" min={1} max={72} value={form.lead_hours} disabled={!form.soon} onChange={(e) => set({ lead_hours: Number(e.target.value) })} className="w-32" />
        </Field>
        <Button variant="primary" disabled={!dirty} loading={save.isPending} onClick={() => save.mutate({ ...form, lead_hours: Math.min(72, Math.max(1, Math.round(form.lead_hours) || 2)) })}>
          Save reminders
        </Button>
      </CardBody>
    </Card>
  );
}
