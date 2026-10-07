import { Brain, Building2, Cake, ChevronDown, Clock, Crown, Dna, MapPin, Rocket, ShieldAlert, Sparkles, Zap } from "lucide-react";
import { type ReactNode, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { StatCard } from "@/components/ui/page";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip } from "@/components/ui/tooltip";
import { date, duration, humanize, isk, sp } from "@/lib/format";
import { timeAgo } from "@/lib/utils";

import { useSection } from "../sheet/hooks";
import { PlaceLabel, secColor, TypeIcon } from "../sheet/components";
import type { CharacterHeader, EveType, Place } from "../sheet/types";

interface Overview {
  synced: boolean;
  corporation_history: { corporation: { id: number; name: string; logo: string }; start_date: string; is_deleted: boolean }[];
  birthday?: string;
  gender?: string;
  race?: string | null;
  bloodline?: string | null;
  security_status?: number | null;
  description?: string;
  title?: string;
  location?: { system: Place["system"]; docked_at: Place | null } | null;
  ship?: { type: EveType; name: string; render: string } | null;
  online?: { online: boolean; last_login: string | null; last_logout: string | null; logins: number | null } | null;
  home?: Place | null;
  implants?: EveType[];
  jump_clones?: { id: number; name: string; location: Place | null; implants: EveType[] }[];
  last_clone_jump?: string | null;
  jump_fatigue_expires?: string | null;
  titles?: string[];
  roles?: string[];
}

function has(header: CharacterHeader, key: string) {
  return header.sections.find((s) => s.key === key)?.available ?? false;
}

export function OverviewTab({ header }: { header: CharacterHeader }) {
  const { data, isLoading } = useSection<Overview>(header.id, "overview");
  const skills = useSection<{ total_sp: number; synced: boolean }>(header.id, "skills", has(header, "skills"));
  const wallet = useSection<{ balance: number; synced: boolean }>(header.id, "wallet", has(header, "wallet"));

  if (isLoading || !data) return <Skeleton className="h-96 rounded-xl" />;

  const fatigued = data.jump_fatigue_expires && new Date(data.jump_fatigue_expires) > new Date();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Skill points" value={skills.data?.synced ? sp(skills.data.total_sp).replace(" SP", "") : "—"} mono hint="total trained" icon={<Brain />} />
        <StatCard label="Wallet" value={wallet.data?.synced ? isk(wallet.data.balance).replace(" ISK", "") : "—"} mono hint="ISK" icon={<Sparkles />} />
        <StatCard
          label="Security status"
          value={data.security_status != null ? <span style={{ color: secColor(data.security_status / 10) }}>{data.security_status.toFixed(2)}</span> : "—"}
          mono
          icon={<ShieldAlert />}
        />
        <StatCard label="Age" value={data.birthday ? timeAgo(data.birthday).replace(" ago", "") : "—"} hint={data.birthday ? `born ${date(data.birthday)}` : undefined} icon={<Cake />} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {(data.location || data.ship) && (
            <Card className="overflow-hidden">
              <div className="relative grid grid-cols-1 gap-6 p-6 sm:grid-cols-[1fr_200px]">
                {data.ship && (
                  <img src={data.ship.render} alt="" className="pointer-events-none absolute -right-10 top-1/2 hidden size-72 -translate-y-1/2 opacity-90 [mask-image:linear-gradient(to_left,black_40%,transparent)] sm:block" />
                )}
                <div className="relative space-y-5">
                  <Fact icon={<MapPin />} label="Location">
                    {data.location?.system ? (
                      <div>
                        <PlaceLabel place={{ id: data.location.system.id, name: data.location.system.name, kind: "solar_system", system: data.location.system }} className="text-base font-medium" />
                        <div className="mt-0.5 text-sm text-muted">{data.location.docked_at ? `Docked in ${data.location.docked_at.name}` : `In space · ${data.location.system.region}`}</div>
                      </div>
                    ) : (
                      <span className="text-subtle">Not shared</span>
                    )}
                  </Fact>
                  <Fact icon={<Rocket />} label="Ship">
                    {data.ship ? (
                      <div>
                        <div className="text-base font-medium">{data.ship.name}</div>
                        <div className="text-sm text-muted">
                          {data.ship.type.name} · {data.ship.type.group}
                        </div>
                      </div>
                    ) : (
                      <span className="text-subtle">Not shared</span>
                    )}
                  </Fact>
                  {data.online && (
                    <Fact icon={<Zap />} label="Status">
                      {data.online.online ? (
                        <Badge color="var(--success)" variant="dot">
                          Online now
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted">Last online {timeAgo(data.online.last_logout ?? data.online.last_login)}</span>
                      )}
                    </Fact>
                  )}
                </div>
              </div>
            </Card>
          )}

          <Card>
            <CardHeader title="Clones & implants" icon={<Dna />} description={data.home ? <>Home: {data.home.name}</> : undefined} />
            <CardBody className="space-y-5">
              <div>
                <div className="mb-2 text-xs font-medium text-muted">Active implants</div>
                <ImplantList implants={data.implants ?? []} />
              </div>
              {(data.jump_clones?.length ?? 0) > 0 && (
                <div>
                  <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted">
                    <span>Jump clones ({data.jump_clones!.length})</span>
                    {data.last_clone_jump && <span className="font-normal text-subtle">Last jump {timeAgo(data.last_clone_jump)}</span>}
                  </div>
                  <ul className="divide-y divide-border rounded-lg border border-border">
                    {data.jump_clones!.map((c) => (
                      <li key={c.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
                        <div className="min-w-0 flex-1 text-sm">
                          {c.name && <div className="font-medium">{c.name}</div>}
                          <PlaceLabel place={c.location} />
                        </div>
                        <ImplantList implants={c.implants} small />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardBody>
          </Card>

          {data.description && (
            <Card>
              <CardHeader title="Biography" />
              <CardBody className="whitespace-pre-line text-sm leading-relaxed text-muted">{data.description}</CardBody>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Character" icon={<Crown />} />
            <CardBody className="space-y-3 text-sm">
              <Row label="Race">{[data.race, data.bloodline].filter(Boolean).join(" · ") || "—"}</Row>
              <Row label="Gender">{data.gender ? humanize(data.gender) : "—"}</Row>
              <Row label="Born">{date(data.birthday)}</Row>
              {data.title && <Row label="Title">{data.title}</Row>}
              {fatigued && (
                <Row label="Jump fatigue">
                  <span className="text-warning-fg">{duration(data.jump_fatigue_expires)} left</span>
                </Row>
              )}
              {(data.titles?.length ?? 0) > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {data.titles!.map((t) => (
                    <Badge key={t}>{t}</Badge>
                  ))}
                </div>
              )}
              {(data.roles?.length ?? 0) > 0 && (
                <div>
                  <div className="mb-1.5 pt-2 text-xs text-muted">Corporation roles</div>
                  <ShowMore items={data.roles!} noun="role">
                    {(roles) => (
                      <div className="flex flex-wrap gap-1.5">
                        {roles.map((r) => (
                          <Badge key={r} color="#818cf8" variant="outline">
                            {humanize(r)}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </ShowMore>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Employment history" icon={<Building2 />} />
            <CardBody>
              <ShowMore items={data.corporation_history} noun="corporation">
                {(history) => (
                  <ol className="relative space-y-4 border-l border-border pl-5">
                    {history.map((h, i) => (
                      <li key={i} className="relative">
                        <span className={`absolute -left-[25px] top-2 size-2.5 rounded-none ring-4 ring-surface ${i === 0 ? "bg-accent" : "bg-surface-3"}`} />
                        <div className="flex items-center gap-2.5">
                          <img src={h.corporation.logo} alt="" className="size-7 rounded" />
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">{h.corporation.name}</div>
                            <div className="flex items-center gap-1 text-xs text-subtle">
                              <Clock className="size-3" /> {date(h.start_date)}
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                    {data.corporation_history.length === 0 && <li className="text-sm text-subtle">Not loaded yet.</li>}
                  </ol>
                )}
              </ShowMore>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Fact({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent-ink [&_svg]:size-4">{icon}</div>
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wider text-subtle">{label}</div>
        <div className="mt-0.5">{children}</div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted">{label}</span>
      <span className="text-right">{children}</span>
    </div>
  );
}

function ImplantList({ implants, small }: { implants: EveType[]; small?: boolean }) {
  if (!implants.length) return <span className="text-sm text-subtle">None</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {implants.map((imp) => (
        <Tooltip key={imp.id} content={imp.name}>
          <span>
            <TypeIcon type={imp} size={small ? 28 : 36} />
          </span>
        </Tooltip>
      ))}
    </div>
  );
}

/** The first few of a list, with a button that shows the rest. */
function ShowMore<T>({ items, limit = 4, noun, children }: { items: T[]; limit?: number; noun: string; children: (visible: T[]) => ReactNode }) {
  const [open, setOpen] = useState(false);
  const hidden = items.length - limit;
  return (
    <>
      {children(open || hidden <= 0 ? items : items.slice(0, limit))}
      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-accent-ink transition-colors hover:text-text"
        >
          <ChevronDown className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
          {open ? "Show less" : `Show ${hidden} more ${noun}${hidden === 1 ? "" : "s"}`}
        </button>
      )}
    </>
  );
}
