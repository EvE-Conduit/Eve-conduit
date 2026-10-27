// The registry (capitals.view_registry): by class, by location and by member, over the characters the viewer may read.
import {
  api, Avatar, Badge, Callout, Card, CardBody, CardHeader, EmptyState, num, PageHeader, Select, Skeleton, TabPanel, Table, Tabs, Td,
  Th, THead, Tr,
} from "@conduit/sdk";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams, useSearchParams } from "react-router";

import { Anchor, MapPin, Radar, Users } from "./icons";
import { AvailabilityBadge, BackLink, CharacterName, DataFlags, FilterBar, filterQuery, HullIcon, OwnedRow, PlaceText } from "./shared";
import { BASE, type ClassPilots, type Filters, type Locations, type MemberRow, type Options, type Summary } from "./types";

/** Filters live in the address, so a link to a class or a member keeps them. */
function useFilters(): [Filters, (f: Filters) => void, URLSearchParams, (p: URLSearchParams) => void] {
  const [params, setParams] = useSearchParams();
  const f: Filters = { corporation: params.get("corporation") ?? "", state: params.get("state") ?? "", group: params.get("group") ?? "" };
  const set = (next: Filters) => {
    const p = new URLSearchParams(params);
    for (const [k, v] of Object.entries(next)) (v ? p.set(k, v) : p.delete(k));
    setParams(p, { replace: true });
  };
  return [f, set, params, (p) => setParams(p, { replace: true })];
}

function useOptions() {
  return useQuery({ queryKey: ["capitals", "options"], queryFn: () => api.get<Options>(`${BASE}/registry/options`) });
}

export function RegistryPage() {
  const [filters, setFilters, params, setParams] = useFilters();
  const tab = params.get("tab") ?? "classes";
  const { data: options } = useOptions();
  return (
    <>
      <PageHeader
        eyebrow="Capital Registry"
        title="Registry"
        icon={<Radar />}
        description={`Who can fly and who owns each capital class, from synced skills and assets${options ? `, over the ${num(options.characters)} characters you may view` : ""}. Seeing where someone's hulls are goes in the snooper log.`}
      />
      <div className="mb-4">
        <FilterBar options={options} value={filters} onChange={setFilters} />
      </div>
      <Tabs
        value={tab}
        onValueChange={(v) => {
          const p = new URLSearchParams(params);
          if (v === "classes") p.delete("tab");
          else p.set("tab", v);
          setParams(p);
        }}
        variant="pills"
        className="space-y-4"
        items={[
          { value: "classes", label: "By class" },
          { value: "locations", label: "By location" },
          { value: "members", label: "By member" },
        ]}
      >
        <TabPanel value="classes"><ClassesTab filters={filters} /></TabPanel>
        <TabPanel value="locations"><LocationsTab filters={filters} options={options} /></TabPanel>
        <TabPanel value="members"><MembersTab filters={filters} options={options} /></TabPanel>
      </Tabs>
    </>
  );
}

function ClassesTab({ filters }: { filters: Filters }) {
  const q = filterQuery(filters);
  const { data, isLoading } = useQuery({ queryKey: ["capitals", "summary", q], queryFn: () => api.get<Summary>(`${BASE}/registry/summary${q}`) });
  if (isLoading || !data) return <Skeleton className="h-64" />;
  const stale = Math.max(data.problems.skills, data.problems.assets);
  return (
    <div className="space-y-4">
      {data.hulls_known === 0 && (
        <Callout tone="warning" title="No capital hulls in the static data">The static data (SDE) hasn't been imported yet, so there's nothing to compare skills and assets against.</Callout>
      )}
      {stale > 0 && (
        <Callout tone="warning" title="Some characters can't be judged">
          {data.problems.skills} of {data.characters} characters have skills and {data.problems.assets} have assets that are missing or older than two days
          (no login, scope missing or sync failing). They're flagged in the lists and may fly or own more than shown.
        </Callout>
      )}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.classes.map((k) => (
          <Card key={k.key}>
            <CardHeader
              title={<Link to={`/p/capitals/registry/class/${k.key}${q}`} className="hover:underline">{k.label}</Link>}
              description={`${k.hulls.length} hull${k.hulls.length === 1 ? "" : "s"}`}
            />
            <CardBody className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <Stat label="Pilots" value={k.pilots} hint={`${k.members} member${k.members === 1 ? "" : "s"}`} />
                <Stat label="Owned" value={k.owned} hint={`${k.owner_members} member${k.owner_members === 1 ? "" : "s"}`} />
                <Stat label="Available" value={k.available} hint={k.unavailable ? `${k.unavailable} not` : "for ops"} />
              </div>
              {k.hulls.length > 0 && (
                <ul className="divide-y divide-border text-sm">
                  {k.hulls.map((h) => (
                    <li key={h.id} className="flex items-center gap-2 py-1.5">
                      <img src={h.icon} alt="" className="size-5 bg-surface-2" loading="lazy" />
                      <span className="flex-1 truncate">{h.name}</span>
                      <span className="font-mono text-xs tabular-nums text-muted" title="Can fly · owned">{h.pilots} · {h.owned}</span>
                    </li>
                  ))}
                </ul>
              )}
              <Link to={`/p/capitals/registry/class/${k.key}${q}`} className="block text-sm text-accent-ink hover:underline">Pilots →</Link>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <div>
      <div className="text-xs text-muted">{label}</div>
      <div className="font-mono text-2xl font-semibold tabular-nums">{num(value)}</div>
      <div className="text-xs text-subtle">{hint}</div>
    </div>
  );
}

function ClassSelect({ options, value, onChange }: { options?: Options; value: string; onChange: (v: string) => void }) {
  return (
    <Select aria-label="Class" className="w-52" value={value} onChange={(e) => onChange(e.target.value)}
      options={[{ value: "", label: "Every class" }, ...(options?.classes ?? []).map((c) => ({ value: c.key, label: c.label }))]} />
  );
}

function LocationsTab({ filters, options }: { filters: Filters; options?: Options }) {
  const [params, setParams] = useSearchParams();
  const cls = params.get("cls") ?? "";
  const q = filterQuery(filters, { cls });
  const { data, isLoading } = useQuery({ queryKey: ["capitals", "locations", q], queryFn: () => api.get<Locations>(`${BASE}/registry/locations${q}`) });
  const setCls = (v: string) => {
    const p = new URLSearchParams(params);
    if (v) p.set("cls", v);
    else p.delete("cls");
    setParams(p, { replace: true });
  };
  return (
    <div className="space-y-4">
      <ClassSelect options={options} value={cls} onChange={setCls} />
      {isLoading || !data ? (
        <Skeleton className="h-64" />
      ) : data.locations.length === 0 ? (
        <Card><EmptyState icon={<MapPin />} title="No capitals found" description="None in the synced assets of the characters you may view." /></Card>
      ) : (
        data.locations.map((g) => (
          <Card key={g.place?.id ?? 0}>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-card py-3">
              <span className="flex items-center gap-2"><MapPin className="size-4 text-subtle" /> <PlaceText place={g.place} /></span>
              <Badge tone="accent">{g.count} hull{g.count === 1 ? "" : "s"}</Badge>
            </div>
            <Table>
              <THead>
                <tr>
                  <Th>Hull</Th>
                  <Th>Pilot</Th>
                  <Th>Where</Th>
                  <Th>For ops</Th>
                </tr>
              </THead>
              <tbody>
                {g.ships.map((s) => (
                  <Tr key={s.item_id}>
                    <Td>
                      <div className="flex items-center gap-2">
                        <HullIcon hull={data.hulls[s.type_id]} />
                        <span>
                          <span className="block font-medium">{data.hulls[s.type_id]?.name}</span>
                          {(s.name || s.packaged) && <span className="block text-xs text-muted">{s.packaged ? `Packaged${s.quantity > 1 ? ` × ${s.quantity}` : ""}` : `“${s.name}”`}</span>}
                        </span>
                      </div>
                    </Td>
                    <Td><div className="flex flex-wrap items-center gap-2"><CharacterName c={s.character} link /><DataFlags c={s.character} /></div></Td>
                    <Td className="text-sm text-muted">{s.where_label}</Td>
                    <Td><AvailabilityBadge av={s.availability} /></Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </Card>
        ))
      )}
    </div>
  );
}

function MembersTab({ filters, options }: { filters: Filters; options?: Options }) {
  const q = filterQuery(filters);
  const { data, isLoading } = useQuery({ queryKey: ["capitals", "members", q], queryFn: () => api.get<{ members: MemberRow[] }>(`${BASE}/registry/members${q}`) });
  const classes = options?.classes ?? [];
  if (isLoading || !data) return <Skeleton className="h-64" />;
  if (data.members.length === 0) return <Card><EmptyState icon={<Users />} title="Nobody here" /></Card>;
  return (
    <Card>
      <Table>
        <THead>
          <tr>
            <Th>Member</Th>
            {classes.map((k) => <Th key={k.key} className="text-center" title="Characters who can fly it · hulls owned">{k.label}</Th>)}
            <Th>Data</Th>
          </tr>
        </THead>
        <tbody>
          {data.members.map((m) => (
            <Tr key={m.id}>
              <Td>
                <Link to={`/p/capitals/registry/member/${m.id}`} className="flex items-center gap-3 hover:underline">
                  <Avatar src={m.portrait} name={m.name} size="sm" />
                  <span>
                    <span className="block font-medium">{m.name}</span>
                    <span className="block text-xs text-muted">{m.characters} character{m.characters === 1 ? "" : "s"}</span>
                  </span>
                </Link>
              </Td>
              {classes.map((k) => {
                const v = m.classes[k.key];
                return (
                  <Td key={k.key} className="text-center font-mono text-sm tabular-nums">
                    {v.fly || v.own ? <span><span className={v.fly ? "" : "text-subtle"}>{v.fly}</span><span className="text-subtle"> · </span><span className={v.own ? "text-accent-ink" : "text-subtle"}>{v.own}</span></span> : <span className="text-subtle">—</span>}
                  </Td>
                );
              })}
              <Td>{m.problems > 0 ? <Badge tone="warning">{m.problems} not synced</Badge> : <Badge tone="success">OK</Badge>}</Td>
            </Tr>
          ))}
        </tbody>
      </Table>
      <div className="border-t border-border px-card py-2 text-xs text-subtle">Each class: characters who can fly it · hulls owned.</div>
    </Card>
  );
}

export function ClassPage() {
  const { key } = useParams();
  const [filters] = useFilters();
  const q = filterQuery(filters);
  const { data, isLoading, error } = useQuery({
    queryKey: ["capitals", "class", key, q],
    queryFn: () => api.get<ClassPilots>(`${BASE}/registry/classes/${key}${q}`),
  });
  return (
    <>
      <BackLink to={`/p/capitals/registry${q}`}>Registry</BackLink>
      {error ? (
        <p className="text-sm text-muted">{(error as Error).message}</p>
      ) : isLoading || !data ? (
        <Skeleton className="h-64" />
      ) : (
        <>
          <PageHeader eyebrow="Capital Registry" title={data.class.label} icon={<Anchor />}
            description={`${data.pilots.length} character${data.pilots.length === 1 ? "" : "s"} who can fly or own one, owners first.`} />
          {data.unknown_count > 0 && (
            <Callout tone="warning" title={`${data.unknown_count} character${data.unknown_count === 1 ? "" : "s"} without synced skills`} className="mb-4">
              {data.unknown.slice(0, 30).map((c) => c.name).join(", ")}{data.unknown_count > 30 ? " and more" : ""}. They may fly it too.
            </Callout>
          )}
          {data.pilots.length === 0 ? (
            <Card><EmptyState icon={<Anchor />} title="Nobody yet" /></Card>
          ) : (
            <Card>
              <Table>
                <THead>
                  <tr>
                    <Th>Pilot</Th>
                    <Th>Can fly</Th>
                    <Th>Owns</Th>
                  </tr>
                </THead>
                <tbody>
                  {data.pilots.map((p) => (
                    <Tr key={p.id}>
                      <Td className="align-top"><div className="space-y-1"><CharacterName c={p} link /><DataFlags c={p} /></div></Td>
                      <Td className="align-top">
                        <div className="flex flex-wrap gap-1">
                          {p.fly.map((tid) => <HullIcon key={tid} hull={data.hulls[tid]} size="size-7" />)}
                          {p.fly.length === 0 && <span className="text-sm text-subtle">—</span>}
                        </div>
                      </Td>
                      <Td className="align-top">
                        {p.owned.length === 0 ? <span className="text-sm text-subtle">—</span> : (
                          <div className="divide-y divide-border">
                            {p.owned.map((a) => <OwnedRow key={a.item_id} a={a} hull={data.hulls[a.type_id]} />)}
                          </div>
                        )}
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </Card>
          )}
        </>
      )}
    </>
  );
}
