// The fit drawn like the in-game fitting window: the ship inside a ring of slots with fixed racks (high slots across
// the top, mid slots down the right, low slots along the bottom, rigs lower left, subsystems upper left), loaded charges
// just outside their module, turret and launcher hardpoints under the high slots, and CPU, powergrid and calibration
// gauges on the inside of the ring. Colours come from the theme tokens, so it works in every theme.
import { Card, cn, isk, Meter, num, Segmented, Table, Td, Th, THead, Tr } from "@conduit/sdk";
import { Fragment, useId, useState } from "react";

import { List, Ring } from "./icons";
import type { FitView, Slot, ViewItem } from "./types";

const SIZE = 520;
const C = SIZE / 2;
const ORBIT = 206;
const CELL = 30;
const BAND = CELL + 12;
const SHIP_R = 140;
const GAUGE_R = 170;
const CHARGE_R = ORBIT + CELL / 2 + 12;

/** Each rack's room in the ring, like the game's: 8 high, mid and low slots, 3 rigs and 4 subsystems. Racks keep their
 * place whatever the ship has, so a Strategic Cruiser's subsystems never run into its high slots. */
const RACKS: [Slot, number][] = [["hi", 8], ["med", 8], ["low", 8], ["rig", 3], ["sub", 4]];
const STEP = 9.2;
const GAP = (360 - RACKS.reduce((a, [, n]) => a + n, 0) * STEP) / RACKS.length;
/** Degrees clockwise from the top: [start, end] of each rack, the high rack centred at the top. */
const SECTORS = {} as Record<Slot, [number, number]>;
{
  let at = -(8 * STEP) / 2;
  for (const [slot, n] of RACKS) {
    SECTORS[slot] = [at, at + n * STEP];
    at += n * STEP + GAP;
  }
  SECTORS.service = SECTORS.sub; // structures have services where ships have subsystems
}
const LABEL: Record<Slot, string> = { hi: "High", med: "Mid", low: "Low", rig: "Rigs", sub: "Subsystems", service: "Services" };
const ORDER: Slot[] = ["hi", "med", "low", "rig", "sub", "service"];

function point(angle: number, r: number) {
  const a = (angle * Math.PI) / 180;
  return { x: C + r * Math.sin(a), y: C - r * Math.cos(a) };
}

/** Slot centres, in the middle of the rack; more slots than the rack has room for (big structures) are squeezed in. */
function angles(slot: Slot, n: number): number[] {
  const [a, b] = SECTORS[slot];
  const step = Math.min(STEP, (b - a) / n);
  const mid = (a + b) / 2;
  return Array.from({ length: n }, (_, i) => mid + (i - (n - 1) / 2) * step);
}

/** An arc path; drawn the other way round when ``reverse`` so text along the bottom of the ring reads upright. */
function arc(from: number, to: number, r: number, reverse = false) {
  const [s, e] = reverse ? [point(to, r), point(from, r)] : [point(from, r), point(to, r)];
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${Math.abs(to - from) > 180 ? 1 : 0} ${reverse ? 0 : 1} ${e.x} ${e.y}`;
}

function describe(item: ViewItem) {
  return `${item.type.name}${item.charge ? ` · ${item.charge.name}` : ""}${item.offline ? " (offline)" : ""}`;
}

/** Where the resource gauges sit inside the ring: CPU lower right, powergrid lower left, calibration by the rigs. */
const GAUGES: Record<string, { from: number; to: number; reverse: boolean }> = {
  cpu: { from: 104, to: 166, reverse: true },
  power: { from: 194, to: 256, reverse: true },
  calibration: { from: 266, to: 314, reverse: false },
};

function Gauge({ id, resource }: { id: string; resource: FitView["resources"][number] }) {
  const g = GAUGES[resource.key];
  if (!g || (!resource.total && !resource.used)) return null;
  const share = resource.total ? resource.used / resource.total : 1;
  const tone = share > 1 ? "stroke-danger" : share > 0.9 ? "stroke-warning" : "stroke-accent";
  const fill = g.from + (g.to - g.from) * Math.min(1, share);
  const pathId = `${id}-gauge-${resource.key}`;
  return (
    <g>
      <title>{`${resource.label}: ${num(resource.used)} / ${num(resource.total)} ${resource.unit} with fitting skills at V`}</title>
      <path d={arc(g.from, g.to, GAUGE_R)} className="fill-none stroke-border-strong" strokeWidth={5} opacity={0.45} />
      {share > 0 && <path d={arc(g.from, fill, GAUGE_R)} className={cn("fill-none", tone)} strokeWidth={5} />}
      <path id={pathId} d={arc(g.from, g.to, g.reverse ? GAUGE_R - 9 : GAUGE_R - 12, g.reverse)} fill="none" />
      <text fontSize={9.5} letterSpacing={0.6} className={share > 1 ? "fill-danger" : "fill-muted"} dominantBaseline="middle">
        <textPath href={`#${pathId}`} startOffset="50%" textAnchor="middle">
          {`${resource.label.toUpperCase()}  ${num(Math.round(resource.used * 10) / 10)} / ${num(resource.total)}`}
        </textPath>
      </text>
    </g>
  );
}

/** Turret hardpoints left of the top, launcher hardpoints right of it, just under the high slots like in the game. */
function HardpointPips({ used, total, side, kind }: { used: number; total: number; side: -1 | 1; kind: "turret" | "launcher" }) {
  const n = Math.max(total, used);
  if (!n) return null;
  return (
    <g>
      <title>{`${kind === "turret" ? "Turret" : "Launcher"} hardpoints: ${used} of ${total} used`}</title>
      {Array.from({ length: n }, (_, i) => {
        const p = point(side * (5 + i * 4.6), GAUGE_R);
        return (
          <rect key={i} x={p.x - 3} y={p.y - 3} width={6} height={6} transform={`rotate(45 ${p.x} ${p.y})`} strokeWidth={1}
            className={i >= total ? "fill-danger stroke-danger" : i < used ? (kind === "turret" ? "fill-accent stroke-accent" : "fill-info stroke-info") : "fill-none stroke-border-strong"} />
        );
      })}
    </g>
  );
}

export function FittingRing({ view }: { view: FitView }) {
  const id = useId().replace(/:/g, "");
  const [active, setActive] = useState<ViewItem | null>(null);
  const bySlot = new Map<Slot, ViewItem[]>();
  for (const item of view.items) {
    if (!ORDER.includes(item.slot as Slot)) continue;
    const list = bySlot.get(item.slot as Slot) ?? [];
    list.push(item);
    bySlot.set(item.slot as Slot, list);
  }
  const groups = ORDER.map((slot) => {
    const items = (bySlot.get(slot) ?? []).sort((a, b) => a.position - b.position);
    const count = Math.max(view.slots[slot] ?? 0, items.length, ...items.map((i) => i.position + 1));
    return { slot, count, items };
  }).filter((g) => g.count > 0);

  return (
    <div className="mx-auto w-full max-w-[520px]">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-auto w-full select-none" role="img" aria-label={`${view.ship.name} fitting`}>
        <defs>
          <clipPath id={`${id}-ship`}>
            <circle cx={C} cy={C} r={SHIP_R} />
          </clipPath>
          <radialGradient id={`${id}-glow`}>
            <stop offset="60%" stopColor="var(--color-accent)" stopOpacity={0} />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0.16} />
          </radialGradient>
        </defs>

        {/* The ring: one band all the way round, each rack's room a little brighter */}
        <circle cx={C} cy={C} r={ORBIT} className="fill-none stroke-surface-2" strokeWidth={BAND} />
        <circle cx={C} cy={C} r={ORBIT + BAND / 2} className="fill-none stroke-border" />
        <circle cx={C} cy={C} r={ORBIT - BAND / 2} className="fill-none stroke-border" />
        {RACKS.map(([slot]) => {
          const [a, b] = SECTORS[slot];
          return <path key={`rack-${slot}`} d={arc(a + 1, b - 1, ORBIT)} className="fill-none stroke-border-strong" strokeWidth={BAND - 6} opacity={0.22} />;
        })}

        {/* The ship */}
        <circle cx={C} cy={C} r={SHIP_R} className="fill-surface-2" />
        <image href={view.ship.render} x={C - SHIP_R} y={C - SHIP_R} width={SHIP_R * 2} height={SHIP_R * 2} clipPath={`url(#${id}-ship)`} preserveAspectRatio="xMidYMid slice" />
        <circle cx={C} cy={C} r={SHIP_R} fill={`url(#${id}-glow)`} className="stroke-border" />

        {/* Inside the ring: hardpoints and resources */}
        <HardpointPips used={view.hardpoints_used.turrets} total={view.slots.turrets} side={-1} kind="turret" />
        <HardpointPips used={view.hardpoints_used.launchers} total={view.slots.launchers} side={1} kind="launcher" />
        {view.resources.map((r) => <Gauge key={r.key} id={id} resource={r} />)}

        {/* Slots */}
        {groups.map(({ slot, count, items }) =>
          angles(slot, count).map((angle, pos) => {
            const item = items.find((i) => i.position === pos);
            const p = point(angle, ORBIT);
            const q = point(angle, CHARGE_R);
            const isActive = !!item && active === item;
            const half = CELL / 2;
            return (
              <g
                key={`${slot}-${pos}`}
                tabIndex={item ? 0 : undefined}
                onMouseEnter={() => item && setActive(item)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => item && setActive(item)}
                onBlur={() => setActive(null)}
                className={cn(item && "cursor-default outline-none")}
              >
                <title>{item ? describe(item) : `Empty ${LABEL[slot].toLowerCase()} slot`}</title>
                <rect
                  x={p.x - half} y={p.y - half} width={CELL} height={CELL} rx={3}
                  className={cn(item ? "fill-surface-3" : "fill-surface", isActive ? "stroke-accent" : item ? "stroke-border-strong" : "stroke-border")}
                  strokeWidth={isActive ? 2 : 1}
                  strokeDasharray={item?.offline ? "3 2" : item ? undefined : "2 2"}
                />
                {item ? (
                  <image href={item.type.icon} x={p.x - half + 1.5} y={p.y - half + 1.5} width={CELL - 3} height={CELL - 3} opacity={item.offline ? 0.3 : 1} />
                ) : (
                  <circle cx={p.x} cy={p.y} r={2} className="fill-border-strong" />
                )}
                {item?.charge && (
                  <g>
                    <rect x={q.x - 9} y={q.y - 9} width={18} height={18} rx={2} className="fill-surface stroke-border-strong" />
                    <image href={item.charge.icon} x={q.x - 8} y={q.y - 8} width={16} height={16} />
                  </g>
                )}
              </g>
            );
          }),
        )}
      </svg>
      <div className="mt-1 min-h-10 text-center">
        {active ? (
          <>
            <div className="text-sm font-medium">{active.type.name}</div>
            <div className="text-xs text-muted">
              {active.charge ? `Loaded: ${active.charge.name}` : active.type.group}
              {active.offline && " · offline"}
            </div>
          </>
        ) : (
          <>
            <div className="text-sm font-medium">{view.ship.name}</div>
            <div className="text-xs text-muted">{view.ship.group} · point at a module to see it</div>
          </>
        )}
      </div>
    </div>
  );
}

/** Drones, fighters and cargo, with icons and quantities. */
export function Bays({ view }: { view: FitView }) {
  const sections = [
    { key: "drone", label: "Drone bay" },
    { key: "fighter", label: "Fighter bay" },
    { key: "cargo", label: "Cargo" },
  ].map((s) => ({ ...s, items: view.items.filter((i) => i.slot === s.key) })).filter((s) => s.items.length);
  if (!sections.length) return <p className="text-sm text-subtle">No drones or cargo.</p>;
  return (
    <div className="space-y-4">
      {sections.map((s) => (
        <div key={s.key}>
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-subtle">{s.label}</div>
          <ul className="space-y-1">
            {s.items.map((i) => (
              <li key={`${i.slot}-${i.type_id}`} className="flex items-center gap-2 text-sm">
                <img src={i.type.icon} alt="" className="size-7 rounded-full bg-surface-3" loading="lazy" />
                <span className="min-w-0 flex-1 truncate">{i.type.name}</span>
                <span className="font-mono text-xs tabular-nums text-muted">×{num(i.quantity)}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function Resources({ view }: { view: FitView }) {
  const [skills, setSkills] = useState<"v" | "none">("v");
  return (
    <div className="space-y-3">
      <Segmented size="sm" value={skills} onChange={setSkills} aria-label="Fitting skills"
        options={[{ value: "v", label: "Skills at V" }, { value: "none", label: "No skills" }]} />
      {view.resources.filter((r) => r.total > 0 || r.used > 0).map((r) => {
        const [used, total] = skills === "v" ? [r.used, r.total] : [r.base_used, r.base_total];
        const share = total ? used / total : 1;
        return (
          <Meter
            key={r.key}
            label={r.label}
            value={Math.min(1, share)}
            tone={share > 1 ? "danger" : share > 0.9 ? "warning" : "accent"}
            valueText={`${num(Math.round(used * 10) / 10)} / ${num(total)}${r.unit ? ` ${r.unit}` : ""}`}
          />
        );
      })}
      <p className="text-xs text-subtle">
        {skills === "v"
          ? "CPU Management, Power Grid Management, Weapon Upgrades and Advanced Weapon Upgrades at V. Other modules' own fitting skills and modules that add CPU or powergrid aren't counted."
          : "The ship's and modules' base values, without any skills."}
      </p>
    </div>
  );
}

/** The fit as a plain list, slot by slot. */
export function FitList({ view }: { view: FitView }) {
  const rows = ORDER.flatMap((slot) => {
    const items = view.items.filter((i) => i.slot === slot).sort((a, b) => a.position - b.position);
    const empty = Math.max(0, (view.slots[slot] ?? 0) - items.length);
    if (!items.length && !empty) return [];
    return [{ slot, items, empty }];
  });
  return (
    <Table>
      <THead>
        <tr>
          <Th>Slot</Th>
          <Th>Module</Th>
          <Th>Charge</Th>
        </tr>
      </THead>
      <tbody>
        {rows.map(({ slot, items, empty }) => (
          <Fragment key={slot}>
            {items.map((i) => (
              <Tr key={`${slot}-${i.position}`}>
                <Td className="text-xs uppercase tracking-[0.1em] text-subtle">{LABEL[slot]}</Td>
                <Td>
                  <span className={cn("flex items-center gap-2", i.offline && "opacity-50")}>
                    <img src={i.type.icon} alt="" className="size-6" loading="lazy" />
                    {i.type.name}
                    {i.offline && <span className="text-xs text-warning-fg">offline</span>}
                  </span>
                </Td>
                <Td className="text-sm text-muted">{i.charge?.name ?? ""}</Td>
              </Tr>
            ))}
            {empty > 0 && (
              <Tr key={`${slot}-empty`}>
                <Td className="text-xs uppercase tracking-[0.1em] text-subtle">{LABEL[slot]}</Td>
                <Td className="text-sm text-subtle" colSpan={2}>{empty} empty</Td>
              </Tr>
            )}
          </Fragment>
        ))}
      </tbody>
    </Table>
  );
}

/** Ring or list, with resources, bays and value. */
export function FitDisplay({ view }: { view: FitView }) {
  const [mode, setMode] = useState<"ring" | "list">("ring");
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
      <Card className="p-card">
        <div className="mb-3 flex items-center justify-between gap-3">
          <Segmented
            size="sm"
            value={mode}
            onChange={setMode}
            aria-label="Show the fit as"
            options={[
              { value: "ring", label: "Fitting", icon: <Ring className="size-3.5" /> },
              { value: "list", label: "List", icon: <List className="size-3.5" /> },
            ]}
          />
          <span className="font-mono text-sm tabular-nums text-muted">{isk(view.value)}</span>
        </div>
        {!view.known && (
          <p className="mb-3 text-sm text-warning-fg">This site's EVE static data has no fitting data for this ship yet (Administration → Health → Import again). Modules are shown as saved.</p>
        )}
        {mode === "ring" ? <FittingRing view={view} /> : <FitList view={view} />}
      </Card>
      <div className="space-y-4">
        <Card className="p-card">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-subtle">Resources</div>
          <Resources view={view} />
        </Card>
        <Card className="p-card">
          <Bays view={view} />
        </Card>
      </div>
    </div>
  );
}
