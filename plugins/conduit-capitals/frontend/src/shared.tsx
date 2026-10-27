// Pieces used on several pages: a character's capitals card, places, data warnings and the availability dialog.
import {
  api, Avatar, Badge, Button, Card, CardBody, Dialog, Field, Segmented, Select, Textarea, timeAgo, toast, Tooltip, duration,
} from "@conduit/sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router";

import { Alert, Back, MapPin, Pencil } from "./icons";
import {
  BASE, type Availability, type CharacterBrief, type CharacterCaps, type ClassInfo, type DataState, type Filters, type Hull,
  type Options, type Owned, type Place,
} from "./types";

export function BackLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-text">
      <Back /> {children}
    </Link>
  );
}

export function HullIcon({ hull, size = "size-6" }: { hull?: Hull; size?: string }) {
  if (!hull) return null;
  return <img src={hull.icon} alt="" title={hull.name} className={`${size} shrink-0 bg-surface-2`} loading="lazy" />;
}

function security(sec: number) {
  const tone = sec >= 0.45 ? "text-success-fg" : sec > 0 ? "text-warning-fg" : "text-danger-fg";
  return <span className={`font-mono tabular-nums ${tone}`}>{sec.toFixed(1)}</span>;
}

/** "1DQ1-A - Imperial Palace · 1DQ1-A -0.4 · Delve". */
export function PlaceText({ place, short = false }: { place: Place | null; short?: boolean }) {
  if (!place) return <span className="text-subtle">Unknown location</span>;
  const sys = place.system;
  const docked = place.kind !== "solar_system" && place.kind !== "unknown";
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-1.5">
      {docked && <span className="font-medium">{place.name}</span>}
      {docked && !short && <span className="text-xs text-subtle">{place.kind === "structure" ? "structure" : "station"}</span>}
      {sys && (
        <span className="text-muted">
          {docked && "· "}
          {sys.name} {security(sys.security)}
          {sys.region && !short ? ` · ${sys.region}` : ""}
        </span>
      )}
      {!docked && !sys && <span className="text-muted">{place.name}</span>}
    </span>
  );
}

const DATA_WORDS: Record<DataState, string> = {
  ok: "Up to date",
  stale: "Not synced for two days",
  missing_scopes: "Login doesn't allow it",
  token_invalid: "Login stopped working",
  error: "Syncing fails",
  never: "Not synced yet",
};
const SECTION_WORDS = { skills: "Skills", assets: "Assets", clones: "Clones" } as const;

/** Badges for the sections whose data is missing or old, so a pilot isn't silently counted as flying nothing. */
export function DataFlags({ c }: { c: CharacterBrief }) {
  if (!c.problem) return null;
  return (
    <span className="inline-flex flex-wrap gap-1">
      {(Object.keys(SECTION_WORDS) as (keyof typeof SECTION_WORDS)[])
        .filter((k) => c.data[k].status !== "ok")
        .map((k) => (
          <Tooltip key={k} content={`${DATA_WORDS[c.data[k].status]}${c.data[k].at ? `; last synced ${timeAgo(c.data[k].at!)}` : ""}`}>
            <span><Badge tone={c.data[k].status === "stale" ? "warning" : "danger"}><Alert className="size-3" /> {SECTION_WORDS[k]}</Badge></span>
          </Tooltip>
        ))}
    </span>
  );
}

export function AvailabilityBadge({ av }: { av: Availability | null | undefined }) {
  if (!av) return null;
  return (
    <Tooltip content={`${av.note ? `“${av.note}” · ` : ""}said ${timeAgo(av.updated_at)}`}>
      <span><Badge tone={av.available ? "success" : "neutral"}>{av.available ? "Available for ops" : "Not available"}</Badge></span>
    </Tooltip>
  );
}

export function CharacterName({ c, link = false }: { c: CharacterBrief; link?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar src={c.portrait} name={c.name} size="sm" />
      <span className="min-w-0">
        <span className="block truncate font-medium">{c.name}</span>
        <span className="block truncate text-xs text-muted">
          {c.corporation ? `[${c.corporation.ticker}] ` : ""}
          {link && c.owner ? <Link to={`/p/capitals/registry/member/${c.owner_id}`} className="hover:text-text">{c.owner}</Link> : c.corporation?.name ?? "No corporation"}
        </span>
      </span>
    </div>
  );
}

export function OwnedRow({ a, hull, editable, onEdit, children }: { a: Owned; hull?: Hull; editable?: boolean; onEdit?: () => void; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3 py-2">
      <HullIcon hull={hull} size="size-8" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{hull?.name ?? `Type ${a.type_id}`}</span>
          {a.name && <span className="text-sm text-muted">“{a.name}”</span>}
          {a.packaged && <Badge tone="neutral">Packaged{a.quantity > 1 ? ` × ${a.quantity}` : ""}</Badge>}
          <AvailabilityBadge av={a.availability} />
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm">
          <MapPin className="size-3.5 text-subtle" />
          <PlaceText place={a.place} />
          <span className={`text-xs ${a.where === "asset_safety" || a.where === "deliveries" ? "text-warning-fg" : "text-subtle"}`}>{a.where_label}</span>
        </div>
        {children}
      </div>
      {editable && <Button size="sm" variant="ghost" onClick={onEdit}><Pencil /> Availability</Button>}
    </div>
  );
}

interface Editing {
  character: CharacterCaps;
  hull: Hull;
  current: Availability | null;
}

/** Every capital a character can fly and owns, with jump skills and clones. ``editable`` for their own characters. */
export function CharacterCard({ c, hulls, classes, editable = false }: { c: CharacterCaps; hulls: Record<string, Hull>; classes: ClassInfo[]; editable?: boolean }) {
  const [editing, setEditing] = useState<Editing | null>(null);
  const flies = classes.filter((k) => c.fly[k.key].length > 0);
  const ownedTypes = new Set(c.owned.map((a) => a.type_id));
  const j = c.jump;
  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-card py-3">
        <CharacterName c={c} />
        <DataFlags c={c} />
      </div>
      <CardBody className="space-y-5">
        <section>
          <div className="mb-1 text-xs font-medium uppercase tracking-wide text-subtle">Owned capitals</div>
          {c.owned.length === 0 ? (
            <p className="text-sm text-muted">{c.data.assets.status === "ok" ? "None in the synced assets." : "Assets not synced, so we can't tell."}</p>
          ) : (
            <div className="divide-y divide-border">
              {c.owned.map((a) => (
                <OwnedRow key={a.item_id} a={a} hull={hulls[a.type_id]} editable={editable}
                  onEdit={() => setEditing({ character: c, hull: hulls[a.type_id], current: a.availability })}>
                  {!c.fly[a.class].includes(a.type_id) && c.data.skills.status === "ok" && <span className="text-xs text-warning-fg">Can't fly it yet</span>}
                </OwnedRow>
              ))}
            </div>
          )}
        </section>
        <section>
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-subtle">Can fly</div>
          {flies.length === 0 ? (
            <p className="text-sm text-muted">{c.data.skills.status === "ok" ? "No capital hull yet." : "Skills not synced, so we can't tell."}</p>
          ) : (
            <div className="space-y-2">
              {flies.map((k) => (
                <div key={k.key} className="flex flex-wrap items-center gap-2">
                  <span className="w-36 shrink-0 text-sm text-muted">{k.label}</span>
                  {c.fly[k.key].map((tid) => {
                    const av = c.availability[String(tid)];
                    const chip = (
                      <span className={`inline-flex items-center gap-1.5 border px-1.5 py-0.5 text-sm ${av?.available ? "border-success" : "border-border"}`}>
                        <HullIcon hull={hulls[tid]} size="size-5" /> {hulls[tid]?.name}
                      </span>
                    );
                    return editable && !ownedTypes.has(tid) ? (
                      <button key={tid} type="button" title="Say whether you'd fly one for ops" className="hover:opacity-80"
                        onClick={() => setEditing({ character: c, hull: hulls[tid], current: av ?? null })}>{chip}</button>
                    ) : <span key={tid}>{chip}</span>;
                  })}
                </div>
              ))}
            </div>
          )}
        </section>
        <section className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-subtle">Jump skills</div>
            {j.skills ? (
              <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-sm">
                <dt className="text-muted">Jump Drive Operation</dt><dd className="font-mono tabular-nums">{j.skills.jdo}</dd>
                <dt className="text-muted">Jump Drive Calibration</dt><dd className="font-mono tabular-nums">{j.skills.jdc}</dd>
                <dt className="text-muted">Jump Fuel Conservation</dt><dd className="font-mono tabular-nums">{j.skills.jfc}</dd>
                <dt className="text-muted">Infomorph Synchronizing</dt><dd className="font-mono tabular-nums">{j.skills.infomorph}</dd>
              </dl>
            ) : <p className="text-sm text-muted">Skills not synced.</p>}
            <div className="mt-2 space-y-1 text-sm">
              {j.location && <div><span className="text-muted">Now: </span><PlaceText place={j.location} short />{j.flying && <span className="text-muted"> in a {hulls[j.flying]?.name}</span>}</div>}
              {j.fatigue_until && <div className="text-warning-fg">Jump fatigue for {duration(j.fatigue_until)}</div>}
              {j.clone_jump_ready_at ? <div className="text-muted">Next clone jump in {duration(j.clone_jump_ready_at)}</div> : c.data.clones.status === "ok" && <div className="text-muted">Clone jump ready</div>}
            </div>
          </div>
          <div>
            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-subtle">Clones</div>
            {c.data.clones.status !== "ok" && !j.home && j.clones.length === 0 ? (
              <p className="text-sm text-muted">Clones not synced.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {j.home && <li><span className="text-muted">Home: </span><PlaceText place={j.home} short /></li>}
                {j.clones.map((cl) => (
                  <li key={cl.id}>
                    <PlaceText place={cl.place} short />
                    <span className="text-xs text-subtle"> {cl.name ? `“${cl.name}” · ` : ""}{cl.implants} implant{cl.implants === 1 ? "" : "s"}</span>
                  </li>
                ))}
                {j.clones.length === 0 && <li className="text-muted">No jump clones.</li>}
              </ul>
            )}
          </div>
        </section>
      </CardBody>
      {editable && <AvailabilityDialog editing={editing} onClose={() => setEditing(null)} />}
    </Card>
  );
}

type Choice = "available" | "unavailable" | "none";

function AvailabilityDialog({ editing, onClose }: { editing: Editing | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [choice, setChoice] = useState<Choice>("none");
  const [note, setNote] = useState("");
  useEffect(() => {
    if (!editing) return;
    setChoice(editing.current ? (editing.current.available ? "available" : "unavailable") : "none");
    setNote(editing.current?.note ?? "");
  }, [editing]);
  const save = useMutation({
    mutationFn: () => api.put(`${BASE}/availability`, {
      character_id: editing!.character.id, type_id: editing!.hull.id, available: choice === "none" ? null : choice === "available", note,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["capitals"] });
      toast.success("Saved");
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Dialog
      open={!!editing}
      onOpenChange={(o) => !o && onClose()}
      title={editing ? `${editing.hull.name} on ${editing.character.name}` : ""}
      description="Fleet commanders looking at the registry see this, with your note."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Back</Button>
          <Button variant="primary" loading={save.isPending} onClick={() => save.mutate()}>Save</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Segmented<Choice>
          value={choice}
          onChange={setChoice}
          options={[
            { value: "available", label: "Available for ops" },
            { value: "unavailable", label: "Not available" },
            { value: "none", label: "Not said" },
          ]}
        />
        {choice !== "none" && (
          <Field label="Note (optional)">
            <Textarea rows={3} maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. weekends only, needs a refit, on loan" />
          </Field>
        )}
      </div>
    </Dialog>
  );
}

export const NO_FILTERS: Filters = { corporation: "", state: "", group: "" };

export function filterQuery(f: Filters, extra: Record<string, string> = {}) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...f, ...extra })) if (v) p.set(k, v);
  const s = p.toString();
  return s ? `?${s}` : "";
}

export function FilterBar({ options, value, onChange, children }: { options?: Options; value: Filters; onChange: (f: Filters) => void; children?: ReactNode }) {
  const set = (patch: Partial<Filters>) => onChange({ ...value, ...patch });
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select aria-label="Corporation" className="w-56" value={value.corporation} onChange={(e) => set({ corporation: e.target.value })}
        options={[{ value: "", label: "Every corporation" }, ...(options?.corporations ?? []).map((c) => ({ value: String(c.id), label: `[${c.ticker}] ${c.name}` }))]} />
      <Select aria-label="State" className="w-44" value={value.state} onChange={(e) => set({ state: e.target.value })}
        options={[{ value: "", label: "Every state" }, ...(options?.states ?? []).map((s) => ({ value: String(s.id), label: s.name }))]} />
      <Select aria-label="Group" className="w-48" value={value.group} onChange={(e) => set({ group: e.target.value })}
        options={[{ value: "", label: "Every group" }, ...(options?.groups ?? []).map((g) => ({ value: String(g.id), label: g.name }))]} />
      {children}
    </div>
  );
}
