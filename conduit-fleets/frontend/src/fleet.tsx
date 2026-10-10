// One fleet: who got a FAT, and for its FC the tracking, the FAT link and adding or removing pilots.
import {
  Alert, api, Avatar, Badge, Button, Card, CardBody, CardHeader, ConfirmDialog, dateTime, duration, EmptyState, Input, PageHeader, Select,
  Skeleton, Spinner, SwitchRow, Table, Td, Th, THead, timeAgo, toast, Tr, useHasPerm,
} from "@conduit/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

import { MotdScopeHint, TypeBadge } from "./home";
import { ArrowLeft, Copy, LinkIcon, Plus, Radar, Refresh, Rocket, Square, Trash } from "./icons";
import { BASE, type FcCharacter, type FleetDetail, VIA } from "./types";

export function FleetPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const canManage = useHasPerm("fleets.manage_fleets");
  const key = ["fleets", "fleet", id];
  // While tracking, refresh about as often as the server reads the fleet.
  const { data, isLoading, error } = useQuery({
    queryKey: key,
    queryFn: () => api.get<FleetDetail>(`${BASE}/${id}`),
    refetchInterval: (q) => (q.state.data?.tracking ? 30_000 : false),
    retry: false,
  });
  const [confirm, setConfirm] = useState<"end" | "delete" | "round" | null>(null);
  const update = (d: FleetDetail, msg?: string) => {
    qc.setQueryData(key, d);
    qc.invalidateQueries({ queryKey: ["fleets", "overview"] });
    if (msg) toast.success(msg);
  };
  const act = useMutation({
    mutationFn: ({ path, method = "post", body }: { path: string; method?: "post" | "delete"; body?: unknown; msg?: string }) =>
      method === "post" ? api.post<FleetDetail>(`${BASE}/${id}${path}`, body ?? {}) : api.delete<FleetDetail>(`${BASE}/${id}${path}`),
    onSuccess: (d, v) => update(d, v.msg ?? (d.added ? `${d.added} new pilot${d.added === 1 ? "" : "s"}` : undefined)),
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: () => api.delete(`${BASE}/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["fleets"] }); toast.success("Fleet deleted"); navigate("/p/fleets"); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (error) return <EmptyState icon={<Rocket />} title="This fleet doesn't exist" action={<Link to="/p/fleets"><Button>Back to fleets</Button></Link>} />;
  if (isLoading || !data) return <Skeleton className="h-96" />;
  const live = !data.ended_at;

  return (
    <>
      <PageHeader
        eyebrow={<Link to="/p/fleets" className="inline-flex items-center gap-1 hover:text-text"><ArrowLeft className="size-3" /> Fleets</Link>}
        title={<span className="flex flex-wrap items-center gap-3">{data.name} <TypeBadge type={data.type} />{live ? <Badge tone="success">{data.tracking ? "Live" : "Open"}</Badge> : <Badge>Ended</Badge>}</span>}
        description={
          <>
            FC {data.fc?.name ?? "unknown"} · started {dateTime(data.started_at)}
            {data.ended_at && <> · lasted {duration(data.ended_at, new Date(data.started_at).getTime())}</>}
          </>
        }
        actions={
          data.can_edit ? (
            <div className="flex flex-wrap gap-2">
              {live && <Button variant="primary" onClick={() => setConfirm("end")}><Square /> End fleet</Button>}
              {canManage && <Button variant="danger" size="icon" aria-label="Delete fleet" onClick={() => setConfirm("delete")}><Trash /></Button>}
            </div>
          ) : undefined
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-6">
          {data.attended && <Alert tone="success" title="You have a FAT for this fleet" />}
          {data.notes && (
            <Card><CardBody className="whitespace-pre-line text-sm text-muted">{data.notes}</CardBody></Card>
          )}
          <Card>
            <CardHeader title={`Pilots · ${data.pilots}`}
              description={`${data.members} member${data.members === 1 ? "" : "s"} on this site${data.round > 1 ? ` · ${data.fat_count} FATs over ${data.round} rounds` : ""}`} />
            {data.can_edit && live && <AddPilot fleetId={data.id} onAdded={(d) => update(d, "Added")} />}
            {data.fats.length === 0 ? (
              <EmptyState icon={<Rocket />} title="Nobody yet" description={data.can_edit ? "Track your in-game fleet or share the FAT link." : undefined} />
            ) : (
              <Table>
                <THead>
                  <tr>
                    <Th>Pilot</Th>
                    {data.round > 1 && <Th>Round</Th>}
                    <Th>Ship</Th>
                    <Th>System</Th>
                    <Th>How</Th>
                    {data.can_edit && <Th />}
                  </tr>
                </THead>
                <tbody>
                  {data.fats.map((f) => (
                    <Tr key={f.id}>
                      <Td>
                        <div className="flex items-center gap-2.5">
                          <Avatar src={f.character.portrait} name={f.character.name} size="xs" />
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">{f.character.name}</div>
                            <div className="truncate text-xs text-subtle">{f.member ? (f.member.name !== f.character.name ? f.member.name : "") : "not registered"}</div>
                          </div>
                        </div>
                      </Td>
                      {data.round > 1 && <Td className="font-mono text-sm tabular-nums text-muted">{f.round}</Td>}
                      <Td>{f.ship?.name ? <span className="flex items-center gap-2 text-sm"><img src={f.ship.icon} alt="" className="size-5" />{f.ship.name}</span> : <span className="text-subtle">—</span>}</Td>
                      <Td className="text-sm text-muted">{f.system ?? "—"}</Td>
                      <Td><Badge tone={VIA[f.via].tone} size="xs">{VIA[f.via].label}</Badge></Td>
                      {data.can_edit && (
                        <Td align="right">
                          <Button variant="ghost" size="icon-xs" aria-label={`Remove ${f.character.name}`}
                            onClick={() => act.mutate({ path: `/fats/${f.id}`, method: "delete", msg: `Removed ${f.character.name}` })}><Trash /></Button>
                        </Td>
                      )}
                    </Tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          {data.can_edit && <RoundsCard data={data} live={live} onNew={() => setConfirm("round")} />}
          {data.can_edit && data.tracking_info && <TrackingCard data={data} live={live} busy={act.isPending} onAct={(v) => act.mutate(v)} />}
          {data.can_edit && data.link && <LinkCard data={data} live={live} onAct={(v) => act.mutate(v)} />}
          {data.ships.length > 0 && (
            <Card>
              <CardHeader title="Ships" />
              <ul className="divide-y divide-border">
                {data.ships.map((s) => (
                  <li key={s.name} className="flex items-center justify-between px-card py-2 text-sm">
                    <span>{s.name}</span>
                    <span className="font-mono tabular-nums text-muted">{s.count}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirm === "end"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={`End ${data.name}?`}
        description="Tracking stops and the FAT link closes. You can still add or remove pilots afterwards from here."
        confirmLabel={<><Square /> End fleet</>}
        onConfirm={() => act.mutateAsync({ path: "/end", msg: "Fleet ended" })}
      />
      <ConfirmDialog
        open={confirm === "round"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={`Start FAT round ${data.round + 1}?`}
        description={data.tracking
          ? "Everyone in the in-game fleet gets another FAT now, and so does anyone who joins during this round."
          : "Pilots can get another FAT from the FAT link, or you add them."}
        confirmLabel={<><Plus /> Start round {data.round + 1}</>}
        onConfirm={() => act.mutateAsync({ path: "/rounds", msg: `FAT round ${data.round + 1} started` })}
      />
      <ConfirmDialog
        open={confirm === "delete"}
        onOpenChange={(o) => !o && setConfirm(null)}
        danger
        title={`Delete ${data.name}?`}
        description={`Its ${data.fat_count} FATs are deleted too, which lowers everyone's attendance.`}
        confirmLabel={<><Trash /> Delete</>}
        onConfirm={() => del.mutateAsync()}
      />
    </>
  );
}

type Act = { path: string; method?: "post" | "delete"; body?: unknown; msg?: string };

function TrackingCard({ data, live, busy, onAct }: { data: FleetDetail; live: boolean; busy: boolean; onAct: (v: Act) => void }) {
  const info = data.tracking_info!;
  const { data: chars } = useQuery({ queryKey: ["fleets", "fc-characters"], queryFn: () => api.get<FcCharacter[]>(`${BASE}/fc/characters`), enabled: live && !data.tracking });
  const [char, setChar] = useState("");
  const [motd, setMotd] = useState(true);
  const trackable = (chars ?? []).filter((c) => c.can_track);
  useEffect(() => {
    if (!char && trackable[0]) setChar(String(trackable[0].id));
  }, [char, trackable]);
  return (
    <Card>
      <CardHeader title="In-game fleet" icon={<Radar />} description="Everyone in it gets a FAT, checked every minute." />
      <CardBody className="space-y-3 text-sm">
        {data.tracking ? (
          <>
            <div className="flex items-center gap-2">
              <span className="size-2 animate-pulse rounded-full bg-success" />
              Tracking with <span className="font-medium">{info.character?.name}</span>
            </div>
            <div className="text-xs text-muted">Last read {timeAgo(info.last_at)}</div>
            {info.error && <p className="text-xs text-warning-fg">{info.error}</p>}
            <SwitchRow
              label="FATs in the fleet MOTD"
              description="Who has a FAT and the FAT link, added below your own MOTD text and updated as pilots get one."
              checked={info.motd}
              disabled={busy}
              onCheckedChange={(on) => onAct({ path: "/motd", body: { on }, msg: on ? "FATs added to the MOTD" : "FATs taken out of the MOTD" })}
            />
            {info.motd && info.motd_error && <p className="text-xs text-warning-fg">{info.motd_error}</p>}
            <div className="flex gap-2">
              <Button size="sm" loading={busy} onClick={() => onAct({ path: "/refresh" })}><Refresh /> Read now</Button>
              <Button size="sm" variant="ghost" onClick={() => onAct({ path: "/track", method: "delete", msg: "Tracking stopped" })}>Stop</Button>
            </div>
          </>
        ) : (
          <>
            {info.error && <Alert tone="warning" title="Tracking stopped">{info.error}</Alert>}
            {live ? (
              trackable.length ? (
                <>
                <div className="flex flex-wrap gap-2">
                  <Select value={char} onChange={(e) => setChar(e.target.value)} className="min-w-40 flex-1" aria-label="Fleet boss">
                    {trackable.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </Select>
                  <Button size="sm" variant="primary" loading={busy} disabled={!char} onClick={() => onAct({ path: "/track", body: { character: Number(char), motd }, msg: "Tracking started" })}>
                    <Radar /> Track
                  </Button>
                </div>
                <SwitchRow label="FATs in the fleet MOTD" description="Added below your own MOTD text and updated as pilots get one." checked={motd} onCheckedChange={setMotd} />
                <MotdScopeHint chars={trackable.filter((c) => String(c.id) === char)} on={motd} />
                </>
              ) : (
                <p className="text-xs text-muted">None of your characters has granted fleet access. Log in with your FC character again under Characters.</p>
              )
            ) : (
              <p className="text-xs text-muted">The fleet has ended.</p>
            )}
          </>
        )}
      </CardBody>
    </Card>
  );
}

function RoundsCard({ data, live, onNew }: { data: FleetDetail; live: boolean; onNew: () => void }) {
  return (
    <Card>
      <CardHeader title="FAT rounds" icon={<Plus />} description="Each round is one more FAT, e.g. every hour of a long op. Rounds are at least 15 minutes apart." />
      <CardBody className="space-y-3 text-sm">
        <ul className="divide-y divide-border border border-border">
          {data.rounds.map((r) => (
            <li key={r.round} className="flex items-center justify-between px-3 py-2">
              <span>
                Round {r.round}
                {r.round === data.round && live && <Badge tone="success" size="xs" className="ml-2">now</Badge>}
                {r.round === data.round && data.round_started_at && <span className="ml-2 text-xs text-subtle">since {timeAgo(data.round_started_at)}</span>}
              </span>
              <span className="font-mono tabular-nums text-muted">{r.pilots} pilot{r.pilots === 1 ? "" : "s"}</span>
            </li>
          ))}
        </ul>
        {live && <Button size="sm" onClick={onNew}><Plus /> New FAT round</Button>}
      </CardBody>
    </Card>
  );
}

function LinkCard({ data, live, onAct }: { data: FleetDetail; live: boolean; onAct: (v: Act) => void }) {
  const link = data.link!;
  const url = `${window.location.origin}/p/fleets/fat/${link.code}`;
  return (
    <Card>
      <CardHeader title="FAT link" icon={<LinkIcon />} description="Pilots open it and pick the characters they flew with." />
      <CardBody className="space-y-3 text-sm">
        {link.tracked_only && (
          <p className="text-xs text-muted">
            This fleet is tracked, so the link can't add anyone: it only takes characters seen in the in-game fleet this round, who already have their FAT.
          </p>
        )}
        <div className="flex">
          <Input readOnly value={url} onFocus={(e) => e.target.select()} className="font-mono text-xs" />
          <Button size="icon" aria-label="Copy the FAT link"
            onClick={() => navigator.clipboard.writeText(url).then(() => toast.success("Link copied; paste it in fleet chat"), () => toast.error("Couldn't copy; select the link instead"))}>
            <Copy />
          </Button>
        </div>
        {link.active ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Badge tone="success">Open{link.expires_at ? ` until ${new Date(link.expires_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}</Badge>
            <Button size="sm" variant="ghost" onClick={() => onAct({ path: "/link", body: { open: false }, msg: "Link closed" })}>Close link</Button>
          </div>
        ) : live ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Badge>Closed</Badge>
            <div className="flex gap-1">
              <Button size="sm" onClick={() => onAct({ path: "/link", body: { open: true, minutes: 30 }, msg: "Link open for 30 minutes" })}>Open 30 min</Button>
              <Button size="sm" variant="ghost" onClick={() => onAct({ path: "/link", body: { open: true }, msg: "Link open" })}>Open</Button>
            </div>
          </div>
        ) : (
          <Badge>Closed with the fleet</Badge>
        )}
      </CardBody>
    </Card>
  );
}

function AddPilot({ fleetId, onAdded }: { fleetId: number; onAdded: (d: FleetDetail) => void }) {
  const [q, setQ] = useState("");
  const [dq, setDq] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDq(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);
  const { data, isLoading } = useQuery({
    queryKey: ["fleets", "candidates", fleetId, dq],
    queryFn: () => api.get<{ id: number; name: string; portrait: string; member: string }[]>(`${BASE}/${fleetId}/candidates?q=${encodeURIComponent(dq)}`),
    enabled: dq.length >= 2,
  });
  const add = useMutation({
    mutationFn: (cid: number) => api.post<FleetDetail>(`${BASE}/${fleetId}/fats`, { characters: [cid] }),
    onSuccess: (d) => { setQ(""); onAdded(d); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div className="border-b border-border px-card py-3">
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Add a pilot by character name" aria-label="Add a pilot" className="max-w-sm" />
      {dq.length >= 2 && (
        <div className="mt-2 max-w-sm">
          {isLoading ? <Spinner className="px-2 py-1" /> : !data?.length ? (
            <p className="px-2 py-1 text-xs text-subtle">No registered character by that name who isn't in this fleet.</p>
          ) : (
            <ul className="space-y-1">
              {data.map((c) => (
                <li key={c.id} className="flex items-center gap-2.5 px-2 py-1 hover:bg-hover">
                  <Avatar src={c.portrait} name={c.name} size="xs" />
                  <span className="min-w-0 flex-1 truncate text-sm">{c.name}<span className="text-xs text-subtle"> · {c.member}</span></span>
                  <Button size="xs" variant="subtle" loading={add.isPending && add.variables === c.id} onClick={() => add.mutate(c.id)}><Plus /> Add</Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
