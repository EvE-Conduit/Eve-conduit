// One tracking's report. Opening it goes in the snooper log for each of the member's characters, and the audit log.
import {
  api, Avatar, Badge, BarChart, Button, Callout, Card, CardHeader, ConfirmDialog, dateTime, EmptyState, humanize, isk, Meter, num, PageHeader,
  Skeleton, StatCard, TabPanel, Table, Tabs, Td, Th, THead, toast, Tr,
} from "@conduit/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

import { ArrowLeft, External, Radar, Square, Trash } from "./icons";
import { SessionBadge } from "./sessions";
import { BASE, hours, type ItemType, type Report, type System, type TrackedCharacter } from "./types";

export function ReportPage() {
  const { id } = useParams();
  const [tab, setTab] = useState("overview");
  const { data, isLoading, error } = useQuery({
    queryKey: ["tracking", "report", id],
    queryFn: () => api.get<Report>(`${BASE}/sessions/${id}`),
    refetchInterval: (q) => (q.state.data?.session.running ? 60_000 : false),
  });
  if (error) return <EmptyState icon={<Radar />} title="Not found" description="This tracking was deleted, or it's on a member you can't see." />;
  if (isLoading || !data) return <Skeleton className="h-96" />;
  const s = data.session;
  const t = data.totals;
  return (
    <>
      <Link to="/p/tracking" className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-text"><ArrowLeft /> Activity Tracking</Link>
      <PageHeader
        eyebrow="Activity report"
        title={s.target.name}
        icon={<Avatar src={s.target.portrait} name={s.target.name} size="md" />}
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            <SessionBadge s={s} />
            <span>{dateTime(data.period.start)} – {dateTime(data.period.end)} · started by {s.started_by ?? "someone"}{s.reason ? ` · ${s.reason}` : ""}</span>
          </span>
        }
        actions={<Actions report={data} />}
      />
      <Coverage characters={data.characters} />
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Time online" value={hours(t.online_seconds)} hint={`${hours(t.docked_seconds)} docked`} />
        <StatCard label="Systems" value={num(t.systems)} hint={`${t.regions} region${t.regions === 1 ? "" : "s"} · ${t.ships} ship type${t.ships === 1 ? "" : "s"}`} />
        <StatCard label="ISK earned" value={isk(t.earned)} hint={`${isk(t.spent)} spent`} tone="success" />
        <StatCard label="Kills / losses" value={`${t.kills} / ${t.losses}`} hint={`${isk(t.isk_destroyed)} destroyed · ${isk(t.isk_lost)} lost`} />
      </div>
      <Tabs
        value={tab}
        onValueChange={setTab}
        variant="pills"
        className="space-y-4"
        items={[
          { value: "overview", label: "Overview" },
          { value: "where", label: "Systems & ships" },
          { value: "isk", label: "ISK" },
          { value: "kills", label: "Kills & mining" },
          { value: "timeline", label: "Timeline", count: data.timeline_total },
        ]}
      >
        <TabPanel value="overview"><Overview r={data} /></TabPanel>
        <TabPanel value="where"><Where r={data} /></TabPanel>
        <TabPanel value="isk"><Isk r={data} /></TabPanel>
        <TabPanel value="kills"><Kills r={data} /></TabPanel>
        <TabPanel value="timeline"><Timeline r={data} /></TabPanel>
      </Tabs>
    </>
  );
}

function Actions({ report }: { report: Report }) {
  const s = report.session;
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState<"stop" | "delete" | null>(null);
  const stop = useMutation({
    mutationFn: () => api.post(`${BASE}/sessions/${s.id}/stop`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tracking"] });
      toast.success("Tracking stopped; the report is kept");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: () => api.delete(`${BASE}/sessions/${s.id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tracking"] });
      toast.success("Tracking deleted");
      navigate("/p/tracking");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div className="flex gap-2">
      {s.running && <Button variant="outline" onClick={() => setConfirm("stop")}><Square /> Stop</Button>}
      <Button variant="outline" onClick={() => setConfirm("delete")}><Trash /> Delete</Button>
      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(o) => !o && setConfirm(null)}
        danger={confirm === "delete"}
        title={confirm === "stop" ? `Stop tracking ${s.target.name}?` : `Delete this report on ${s.target.name}?`}
        description={confirm === "stop"
          ? "Polling stops now. The report so far is kept."
          : "Everything this tracking recorded is deleted for good. Their wallet, mining and killmails stay on their character sheets."}
        confirmLabel={confirm === "stop" ? "Stop tracking" : "Delete"}
        onConfirm={() => (confirm === "stop" ? stop.mutateAsync() : remove.mutateAsync())}
      />
    </div>
  );
}

/** Characters we couldn't follow, so nobody reads "no time in space" as "didn't play". */
function Coverage({ characters }: { characters: TrackedCharacter[] }) {
  const bad = characters.filter((c) => c.status !== "ok" && c.status !== "pending" && c.status !== "gone");
  if (!bad.length) return null;
  return (
    <Callout tone="warning" title={`${bad.length} character${bad.length === 1 ? "" : "s"} can't be followed`} className="mb-4">
      {bad.map((c) => `${c.name}: ${c.status_label}${c.status_detail ? ` (${c.status_detail})` : ""}`).join(" · ")}.
      {" "}Their wallet, mining and kills still count once their character sheet syncs; where they are and what they fly doesn't.
    </Callout>
  );
}

function Sec({ value }: { value: number | null }) {
  if (value == null) return null;
  const tone = value >= 0.45 ? "text-success-fg" : value > 0 ? "text-warning-fg" : "text-danger-fg";
  return <span className={`font-mono text-xs tabular-nums ${tone}`}>{value.toFixed(1)}</span>;
}

function SystemName({ s }: { s: System }) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <Sec value={s.security} />
      <span>{s.name}</span>
      {s.region && <span className="text-xs text-muted">{s.region}</span>}
    </span>
  );
}

function ShipName({ t, sub }: { t: ItemType; sub?: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <img src={t.icon} alt="" className="size-6 shrink-0 rounded" />
      <span>
        <span className="block">{t.name}</span>
        {sub && <span className="block text-xs text-muted">{sub}</span>}
      </span>
    </span>
  );
}

function Overview({ r }: { r: Report }) {
  const maxHour = Math.max(1, ...r.by_hour);
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Characters" description="Every character on their account. Time is time online that we saw." />
        <Table>
          <THead>
            <tr>
              <Th>Character</Th>
              <Th>Now</Th>
              <Th className="text-right">Online</Th>
              <Th>Mostly in</Th>
              <Th>Mostly flying</Th>
              <Th className="text-right">Earned</Th>
            </tr>
          </THead>
          <tbody>
            {r.characters.map((c) => (
              <Tr key={c.id}>
                <Td>
                  <Link to={`/characters/${c.id}`} className="flex items-center gap-2 hover:text-accent-ink">
                    <Avatar src={c.portrait} name={c.name} size="sm" />
                    <span>
                      <span className="block font-medium">{c.name}</span>
                      {c.status !== "ok" && <span className="block text-xs text-muted">{c.status_label}</span>}
                    </span>
                  </Link>
                </Td>
                <Td>
                  {c.now ? (
                    <span className="text-sm">
                      <Badge tone="success">Online</Badge>{" "}
                      <SystemName s={c.now.system} />
                      {c.now.ship && <span className="text-muted"> · {c.now.ship.name}{c.now.docked ? " (docked)" : ""}</span>}
                    </span>
                  ) : c.online === false ? (
                    <span className="text-muted">Offline</span>
                  ) : (
                    <span className="text-subtle">—</span>
                  )}
                </Td>
                <Td className="text-right font-mono tabular-nums">{hours(c.seconds)}</Td>
                <Td>{c.top_system ? <SystemName s={c.top_system} /> : <span className="text-subtle">—</span>}</Td>
                <Td>{c.top_ship ? c.top_ship.name : <span className="text-subtle">—</span>}</Td>
                <Td className="text-right font-mono tabular-nums">{c.earned ? isk(c.earned) : "—"}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Time online per day" description="All their characters together, EVE time." />
          <div className="px-card pb-4">
            {r.by_day.length ? (
              <BarChart data={r.by_day.map((d) => ({ date: d.day, value: d.seconds }))} format={hours} label="Time online per day" />
            ) : (
              <p className="text-sm text-muted">Nothing seen online yet.</p>
            )}
          </div>
        </Card>
        <Card>
          <CardHeader title="When they play" description="Time online by hour of day, EVE time." />
          <div className="px-card pb-4">
            <div className="flex h-40 items-end gap-0.5" role="img" aria-label="Time online by hour of day">
              {r.by_hour.map((v, h) => (
                <div key={h} className="flex h-full flex-1 flex-col justify-end" title={`${String(h).padStart(2, "0")}:00 · ${hours(v)}`}>
                  <div className="w-full rounded-t-sm bg-accent" style={{ height: `${(v / maxHour) * 100}%`, minHeight: v ? 2 : 0 }} />
                </div>
              ))}
            </div>
            <div className="mt-1 flex justify-between font-mono text-xs text-muted">
              <span>00</span><span>06</span><span>12</span><span>18</span><span>23</span>
            </div>
          </div>
        </Card>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <TopList title="Top systems" items={r.systems.slice(0, 8)} total={r.totals.online_seconds} name={(s) => <SystemName s={s} />} />
        <TopList title="Top ships" items={r.ships.slice(0, 8)} total={r.totals.online_seconds} name={(t) => t.name} />
      </div>
    </div>
  );
}

function TopList<T extends { seconds: number }>({ title, items, total, name }: { title: string; items: T[]; total: number; name: (x: T) => ReactNode }) {
  return (
    <Card>
      <CardHeader title={title} />
      <div className="space-y-3 px-card pb-4">
        {items.length === 0 ? (
          <p className="text-sm text-muted">Nothing seen yet.</p>
        ) : (
          items.map((x, i) => (
            <Meter key={i} label={name(x)} valueText={`${hours(x.seconds)} · ${total ? Math.round((x.seconds / total) * 100) : 0}%`} value={total ? (x.seconds / total) * 100 : 0} />
          ))
        )}
      </div>
    </Card>
  );
}

function TimeTable<T extends { seconds: number; characters: string[] }>({ title, description, items, total, head, cell }: {
  title: string; description?: string; items: T[]; total: number; head: string; cell: (x: T) => ReactNode;
}) {
  return (
    <Card>
      <CardHeader title={title} description={description} />
      {items.length === 0 ? (
        <p className="px-card pb-4 text-sm text-muted">Nothing seen yet.</p>
      ) : (
        <Table>
          <THead>
            <tr><Th>{head}</Th><Th className="text-right">Time</Th><Th className="text-right">Share</Th><Th>Characters</Th></tr>
          </THead>
          <tbody>
            {items.map((x, i) => (
              <Tr key={i}>
                <Td>{cell(x)}</Td>
                <Td className="text-right font-mono tabular-nums">{hours(x.seconds)}</Td>
                <Td className="text-right font-mono tabular-nums text-muted">{total ? Math.round((x.seconds / total) * 100) : 0}%</Td>
                <Td className="text-muted">{x.characters.join(", ")}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </Card>
  );
}

function Where({ r }: { r: Report }) {
  const total = r.totals.online_seconds;
  return (
    <div className="space-y-6">
      <Callout tone="info">
        Checked once a minute while a character is online, so time per system and ship is close, but a system flown straight through or a quick ship swap can be missed.
      </Callout>
      <TimeTable title="Systems" items={r.systems} total={total} head="System" cell={(s) => <SystemName s={s} />} />
      <TimeTable title="Ships" items={r.ships} total={total} head="Ship" cell={(t) => <ShipName t={t} sub={t.group} />} />
      <div className="grid gap-6 lg:grid-cols-2">
        <TimeTable title="Regions" items={r.regions} total={total} head="Region" cell={(x) => x.name} />
        <TimeTable title="Docked at" description="Stations and structures they sat in." items={r.docked} total={total} head="Where" cell={(x) => x.name} />
      </div>
    </div>
  );
}

function Isk({ r }: { r: Report }) {
  return (
    <div className="space-y-6">
      <Callout tone="info">
        From their characters' wallet journals, which sync about once an hour. ISK moved between their own characters isn't counted.
      </Callout>
      <div className="grid gap-6 lg:grid-cols-2">
        <AmountTable title="Income" rows={r.income} total={r.totals.earned} />
        <AmountTable title="Spending" rows={r.spending} total={r.totals.spent} />
      </div>
      <Card>
        <CardHeader title="Where they made ISK" description="Bounties and other payouts that say which system they were earned in." />
        {r.isk_systems.length === 0 ? (
          <p className="px-card pb-4 text-sm text-muted">No payouts tied to a system.</p>
        ) : (
          <Table>
            <THead><tr><Th>System</Th><Th className="text-right">ISK</Th></tr></THead>
            <tbody>
              {r.isk_systems.map((s) => (
                <Tr key={s.id}><Td><SystemName s={s} /></Td><Td className="text-right font-mono tabular-nums">{isk(s.amount)}</Td></Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}

function AmountTable({ title, rows, total }: { title: string; rows: { ref_type: string; amount: number }[]; total: number }) {
  return (
    <Card>
      <CardHeader title={title} description={isk(total)} />
      {rows.length === 0 ? (
        <p className="px-card pb-4 text-sm text-muted">None.</p>
      ) : (
        <div className="space-y-3 px-card pb-4">
          {rows.map((x) => (
            <Meter key={x.ref_type} label={humanize(x.ref_type)} valueText={isk(x.amount)} value={total ? (x.amount / total) * 100 : 0} />
          ))}
        </div>
      )}
    </Card>
  );
}

function Kills({ r }: { r: Report }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Ships on killmails" description="What they flew on kills, and what they lost." />
          {r.killmail_ships.length === 0 ? (
            <p className="px-card pb-4 text-sm text-muted">No killmails in this period.</p>
          ) : (
            <Table>
              <THead><tr><Th>Ship</Th><Th className="text-right">Killmails</Th></tr></THead>
              <tbody>
                {r.killmail_ships.map((t) => (
                  <Tr key={t.id}><Td><ShipName t={t} /></Td><Td className="text-right font-mono tabular-nums">{t.count}</Td></Tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
        <Card>
          <CardHeader title="Mining" description={`About ${isk(r.totals.mined_value)} at average prices.`} />
          {r.mining.length === 0 ? (
            <p className="px-card pb-4 text-sm text-muted">No mining in this period.</p>
          ) : (
            <Table>
              <THead><tr><Th>Ore</Th><Th className="text-right">Units</Th><Th className="text-right">Value</Th></tr></THead>
              <tbody>
                {r.mining.map((m) => (
                  <Tr key={m.id}>
                    <Td><ShipName t={m} /></Td>
                    <Td className="text-right font-mono tabular-nums">{num(m.quantity)}</Td>
                    <Td className="text-right font-mono tabular-nums">{isk(m.value)}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
          {r.mining_systems.length > 0 && (
            <p className="px-card pb-4 pt-2 text-xs text-muted">Mined in {r.mining_systems.map((s) => s.name).join(", ")}.</p>
          )}
        </Card>
      </div>
      <Card>
        <CardHeader title="Killmails" description="Newest first, up to 100." />
        {r.killmails.length === 0 ? (
          <p className="px-card pb-4 text-sm text-muted">No killmails in this period.</p>
        ) : (
          <Table>
            <THead>
              <tr><Th>When</Th><Th /><Th>Character</Th><Th>Victim ship</Th><Th>System</Th><Th className="text-right">Value</Th><Th /></tr>
            </THead>
            <tbody>
              {r.killmails.map((k) => (
                <Tr key={k.id}>
                  <Td className="whitespace-nowrap text-muted">{dateTime(k.time)}</Td>
                  <Td>{k.is_loss ? <Badge tone="danger">Loss</Badge> : <Badge tone="success">Kill</Badge>}</Td>
                  <Td>{k.character}</Td>
                  <Td><ShipName t={k.victim_ship} /></Td>
                  <Td><SystemName s={k.system} /></Td>
                  <Td className="text-right font-mono tabular-nums">{isk(k.value)}</Td>
                  <Td className="text-right">
                    <a href={`https://zkillboard.com/kill/${k.id}/`} target="_blank" rel="noreferrer" className="text-muted hover:text-text" aria-label="Open on zKillboard"><External /></a>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}

function Timeline({ r }: { r: Report }) {
  if (!r.timeline.length) return <EmptyState icon={<Radar />} title="Nothing yet" description="Stints show up here once one of their characters is seen online." />;
  return (
    <Card>
      <CardHeader
        title="Timeline"
        description={r.timeline_total > r.timeline.length ? `The latest ${r.timeline.length} of ${num(r.timeline_total)} stints.` : "Every stint, newest first."}
      />
      <Table>
        <THead>
          <tr><Th>From</Th><Th>For</Th><Th>Character</Th><Th>System</Th><Th>Ship</Th><Th>Docked at</Th></tr>
        </THead>
        <tbody>
          {r.timeline.map((x, i) => (
            <Tr key={i}>
              <Td className="whitespace-nowrap text-muted" title={`until ${dateTime(x.ended_at)}`}>{dateTime(x.started_at)}</Td>
              <Td className="whitespace-nowrap font-mono tabular-nums">{hours(x.seconds)}</Td>
              <Td>{x.character}</Td>
              <Td><SystemName s={x.system} /></Td>
              <Td>{x.ship ? <ShipName t={x.ship} sub={x.ship_name || undefined} /> : <span className="text-subtle">—</span>}</Td>
              <Td className="text-muted">{x.docked ?? "In space"}</Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </Card>
  );
}
