// The fit drawn like the in-game fitting window: the ship in a circle, its slots on arcs around it (high slots
// across the top, mid slots down the right, low slots along the bottom, rigs lower left, subsystems upper left),
// hardpoints, resources, and the drone bay and cargo beside it. Colours come from the theme tokens, so it works in
// every theme.
import { Card, cn, isk, Meter, num, Segmented, Table, Td, Th, THead, Tr } from "@conduit/sdk";
import { Fragment, useId, useState } from "react";

import { List, Ring } from "./icons";
import type { FitView, Slot, ViewItem } from "./types";

const SIZE = 440;
const C = SIZE / 2;
const ORBIT = 176;
const SOCKET = 19;
const SHIP_R = 118;

/** Where each kind of slot sits, in degrees clockwise from the top. Services (structures) use the subsystem arc. */
const SECTORS: Record<Slot, [number, number]> = {
  hi: [-62, 52],
  med: [64, 150],
  low: [160, 250],
  rig: [262, 298],
  sub: [308, 344],
  service: [308, 344],
};
const LABEL: Record<Slot, string> = { hi: "High", med: "Mid", low: "Low", rig: "Rigs", sub: "Subsystems", service: "Services" };
const ORDER: Slot[] = ["hi", "med", "low", "rig", "sub", "service"];

function point(angle: number, r: number) {
  const a = (angle * Math.PI) / 180;
  return { x: C + r * Math.sin(a), y: C - r * Math.cos(a) };
}

function angles(slot: Slot, n: number): number[] {
  const [a, b] = SECTORS[slot];
  const step = n > 1 ? Math.min(16, (b - a) / (n - 1)) : 0;
  const mid = (a + b) / 2;
  return Array.from({ length: n }, (_, i) => mid + (i - (n - 1) / 2) * step);
}

function arc(from: number, to: number, r: number) {
  const s = point(from, r);
  const e = point(to, r);
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${e.x} ${e.y}`;
}

function describe(item: ViewItem) {
  return `${item.type.name}${item.charge ? ` · ${item.charge.name}` : ""}${item.offline ? " (offline)" : ""}`;
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
    <div className="mx-auto w-full max-w-[460px]">
      <div className="mb-2 flex items-center justify-between gap-4 text-[11px] uppercase tracking-[0.12em] text-muted">
        <Hardpoints label="Turrets" used={view.hardpoints_used.turrets} total={view.slots.turrets} />
        <Hardpoints label="Launchers" used={view.hardpoints_used.launchers} total={view.slots.launchers} right />
      </div>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-auto w-full select-none" role="img" aria-label={`${view.ship.name} fitting`}>
        <defs>
          <clipPath id={`${id}-ship`}>
            <circle cx={C} cy={C} r={SHIP_R} />
          </clipPath>
          <clipPath id={`${id}-icon`} clipPathUnits="objectBoundingBox">
            <circle cx={0.5} cy={0.5} r={0.5} />
          </clipPath>
          <radialGradient id={`${id}-glow`}>
            <stop offset="55%" stopColor="var(--color-accent)" stopOpacity={0} />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0.18} />
          </radialGradient>
        </defs>

        {/* The ship */}
        <circle cx={C} cy={C} r={SHIP_R + 14} className="fill-none stroke-border" strokeDasharray="2 5" />
        <circle cx={C} cy={C} r={SHIP_R} className="fill-surface-2" />
        <image href={view.ship.render} x={C - SHIP_R} y={C - SHIP_R} width={SHIP_R * 2} height={SHIP_R * 2} clipPath={`url(#${id}-ship)`} preserveAspectRatio="xMidYMid slice" />
        <circle cx={C} cy={C} r={SHIP_R} fill={`url(#${id}-glow)`} className="stroke-accent/50" strokeWidth={1.5} />

        {/* Slot arcs and their labels */}
        {groups.map(({ slot, count }) => {
          const as = angles(slot, count);
          const from = as[0] - 9;
          const to = as[as.length - 1] + 9;
          const label = point(from - 4, ORBIT + 30);
          return (
            <g key={`arc-${slot}`}>
              <path d={arc(from, to, ORBIT)} className="fill-none stroke-border-strong" strokeWidth={SOCKET * 2 + 8} strokeLinecap="round" opacity={0.35} />
              <text x={label.x} y={label.y} textAnchor="middle" dominantBaseline="middle" className="fill-subtle" fontSize={9} letterSpacing={1.5}>
                {LABEL[slot].toUpperCase()}
              </text>
            </g>
          );
        })}

        {/* Sockets */}
        {groups.map(({ slot, count, items }) =>
          angles(slot, count).map((angle, pos) => {
            const item = items.find((i) => i.position === pos);
            const p = point(angle, ORBIT);
            const out = point(angle, ORBIT + SOCKET * 0.85);
            const isActive = !!item && active === item;
            return (
              <g
                key={`${slot}-${pos}`}
                transform={`translate(${p.x} ${p.y})`}
                tabIndex={item ? 0 : undefined}
                onMouseEnter={() => item && setActive(item)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => item && setActive(item)}
                onBlur={() => setActive(null)}
                className={cn(item && "cursor-default outline-none")}
              >
                {item && <title>{describe(item)}</title>}
                <circle
                  r={SOCKET}
                  className={cn(item ? "fill-surface-3" : "fill-surface", isActive ? "stroke-accent" : item ? "stroke-border-strong" : "stroke-border")}
                  strokeWidth={isActive ? 2 : 1}
                  strokeDasharray={item?.offline ? "3 3" : item ? undefined : "2 3"}
                />
                {item ? (
                  <image href={item.type.icon} x={-SOCKET + 3} y={-SOCKET + 3} width={(SOCKET - 3) * 2} height={(SOCKET - 3) * 2}
                    clipPath={`url(#${id}-icon)`} opacity={item.offline ? 0.35 : 1} />
                ) : (
                  <circle r={2.5} className="fill-border-strong" />
                )}
                {item?.charge && (
                  <g transform={`translate(${out.x - p.x} ${out.y - p.y})`}>
                    <circle r={8.5} className="fill-surface stroke-accent/70" />
                    <image href={item.charge.icon} x={-7} y={-7} width={14} height={14} clipPath={`url(#${id}-icon)`} />
                  </g>
                )}
                {item && (item.turret || item.launcher) && (
                  <rect x={-3} y={-SOCKET - 6} width={6} height={6} transform={`rotate(45 0 ${-SOCKET - 3})`}
                    className={item.turret ? "fill-accent" : "fill-info"} />
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

function Hardpoints({ label, used, total, right }: { label: string; used: number; total: number; right?: boolean }) {
  if (!total && !used) return <span />;
  return (
    <span className={cn("flex items-center gap-2", right && "flex-row-reverse")}>
      <span>{label}</span>
      <span className="flex gap-1">
        {Array.from({ length: Math.max(total, used) }, (_, i) => (
          <span key={i} className={cn("size-2 rotate-45", i < used ? (label === "Turrets" ? "bg-accent" : "bg-info") : "ring-1 ring-inset ring-border-strong",
            i >= total && "bg-danger")} />
        ))}
      </span>
    </span>
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
  return (
    <div className="space-y-3">
      {view.resources.filter((r) => r.total > 0 || r.used > 0).map((r) => {
        const share = r.total ? r.used / r.total : 1;
        return (
          <Meter
            key={r.key}
            label={r.label}
            value={Math.min(1, share)}
            tone={share > 1 ? "danger" : share > 0.9 ? "warning" : "accent"}
            valueText={`${num(Math.round(r.used * 10) / 10)} / ${num(r.total)}${r.unit ? ` ${r.unit}` : ""}`}
          />
        );
      })}
      <p className="text-xs text-subtle">Base values: fitting skills and modules that add CPU or powergrid aren't counted.</p>
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
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
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
          <p className="mb-3 text-sm text-warning-fg">This ship's slot layout isn't known yet; the static data needs updating. Modules are shown as fitted.</p>
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
