// Pieces used on several pages: the month and corporation pickers (kept in the address, so pages can be linked to),
// and the income-against-spending chart.
import { api, cn, isk, Select } from "@conduit/sdk";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";

import { BASE, type Corp, type MonthRow, type Months } from "./types";

export function useMonths() {
  return useQuery({ queryKey: ["finance", "months"], queryFn: () => api.get<Months>(`${BASE}/months`) });
}

/** A value kept in the page's address (?month=2026-09), so the notification and the print view can link to it. */
export function useParam(name: string): [string, (v: string) => void] {
  const [params, setParams] = useSearchParams();
  const set = (v: string) =>
    setParams(
      (p) => {
        const next = new URLSearchParams(p);
        if (v) next.set(name, v);
        else next.delete(name);
        return next;
      },
      { replace: true },
    );
  return [params.get(name) ?? "", set];
}

export function MonthPicker({ value, onChange, closedOnly = false }: { value: string; onChange: (m: string) => void; closedOnly?: boolean }) {
  const { data } = useMonths();
  const months = (data?.months ?? []).filter((m) => !closedOnly || !m.current || m.month === value);
  const options = (months.length ? months : [{ month: value, label: value, current: false, reported: false }]).map((m) => ({
    value: m.month,
    label: `${m.label}${m.current ? " · so far" : ""}`,
  }));
  return <Select value={value} onChange={(e) => onChange(e.target.value)} options={options} aria-label="Month" className="w-52" />;
}

export function CorpPicker({ corps, value, onChange, allowAll = true }: { corps: Corp[]; value: string; onChange: (v: string) => void; allowAll?: boolean }) {
  const options = [
    ...(allowAll ? [{ value: "", label: corps.length > 1 ? `All ${corps.length} corporations` : "All corporations" }] : []),
    ...corps.map((c) => ({ value: String(c.id), label: `${c.name} [${c.ticker}]` })),
  ];
  return <Select value={value} onChange={(e) => onChange(e.target.value)} options={options} aria-label="Corporation" className="w-64" />;
}

export function query(params: Record<string, string | number | null | undefined>) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== "" && v != null) q.set(k, String(v));
  const s = q.toString();
  return s ? `?${s}` : "";
}

/** "+12.5 %" against last month, coloured by whether it's good (more spending is bad). */
export function Delta({ amount, percent, invert = false, className }: { amount: number; percent: number | null; invert?: boolean; className?: string }) {
  if (!amount) return <span className={cn("text-muted", className)}>no change</span>;
  const good = amount > 0 !== invert;
  return (
    <span className={cn("font-mono tabular-nums", good ? "text-success-fg" : "text-danger-fg", className)}>
      {isk(amount, { sign: true })}
      {percent != null && ` (${percent > 0 ? "+" : ""}${percent.toLocaleString("en", { maximumFractionDigits: 1 })} %)`}
    </span>
  );
}

function niceMax(max: number) {
  if (max <= 0) return 1;
  const mag = 10 ** Math.floor(Math.log10(max));
  return [1, 2, 2.5, 5, 10].map((m) => m * mag).find((v) => v >= max) ?? max;
}

const monthLabel = (m: string, long = false) =>
  new Date(`${m}-01T00:00:00Z`).toLocaleDateString("en-GB", { month: long ? "long" : "short", year: long ? "numeric" : "2-digit", timeZone: "UTC" });

export function Legend() {
  return (
    <div className="flex items-center gap-4 text-xs text-muted">
      <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: "var(--success)" }} /> Income</span>
      <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: "var(--danger)" }} /> Spending</span>
      <span className="inline-flex items-center gap-1.5"><span className="size-2 rotate-45 bg-text" /> Net</span>
    </div>
  );
}

/**
 * Income above the line and spending below it, one column per month, with the month's net as a marker. Drawn like
 * the site's BarChart (same axis, grid and tooltip), which only does one series of positive values.
 */
export function FlowChart({ data, height = 240, onPick }: { data: MonthRow[]; height?: number; onPick?: (month: string) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const [hover, setHover] = useState<number | null>(null);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(160, Math.round(entry!.contentRect.width))));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const pad = { t: 12, r: 8, b: 26, l: 64 };
  const top = niceMax(Math.max(...data.map((d) => d.income), 0));
  const bottom = niceMax(Math.max(...data.map((d) => d.spending), 0));
  const span = top + bottom;
  const plotH = height - pad.t - pad.b;
  const y = (v: number) => pad.t + ((top - v) / span) * plotH;
  const base = y(0);
  const plotW = width - pad.l - pad.r;
  const slot = plotW / Math.max(1, data.length);
  const barW = Math.min(28, Math.max(3, slot - 6));
  const ticks = [top, 0, -bottom];
  const bar = (x: number, from: number, to: number) => {
    const h = Math.abs(to - from);
    if (h < 0.5) return "";
    const r = Math.min(4, h, barW / 2);
    // Rounded at the end away from the baseline.
    return to < from
      ? `M${x},${from}V${to + r}Q${x},${to} ${x + r},${to}H${x + barW - r}Q${x + barW},${to} ${x + barW},${to + r}V${from}Z`
      : `M${x},${from}V${to - r}Q${x},${to} ${x + r},${to}H${x + barW - r}Q${x + barW},${to} ${x + barW},${to - r}V${from}Z`;
  };
  const h = hover !== null ? data[hover] : undefined;

  return (
    <div ref={box} className="relative">
      <svg width={width} height={height} className="block select-none" role="img" aria-label="Income and spending per month" onPointerLeave={() => setHover(null)}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={width - pad.r} y1={y(t)} y2={y(t)} stroke={t === 0 ? "var(--border-strong)" : "var(--border)"} strokeWidth="1" />
            <text x={pad.l - 10} y={y(t)} dy="0.32em" textAnchor="end" className="fill-muted font-mono text-[11px] tabular-nums">
              {isk(t).replace(" ISK", "")}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const x = pad.l + i * slot + (slot - barW) / 2;
          const dim = hover !== null && hover !== i ? 0.4 : 0.9;
          return (
            <g key={d.month} onPointerEnter={() => setHover(i)} onClick={() => onPick?.(d.month)} className={onPick ? "cursor-pointer" : undefined}>
              <rect x={pad.l + i * slot} y={pad.t} width={slot} height={plotH} fill="transparent" />
              <path d={bar(x, base - 1, y(d.income))} fill="var(--success)" opacity={dim} />
              <path d={bar(x, base + 1, y(-d.spending))} fill="var(--danger)" opacity={dim} />
              {(d.income || d.spending) > 0 && (
                <rect x={x + barW / 2 - 4} y={y(d.net) - 4} width={8} height={8} transform={`rotate(45 ${x + barW / 2} ${y(d.net)})`} fill="var(--text)" stroke="var(--surface)" strokeWidth="2" />
              )}
            </g>
          );
        })}
        {[0, Math.floor((data.length - 1) / 2), data.length - 1].filter((v, i, a) => a.indexOf(v) === i).map((i) =>
          data[i] ? (
            <text key={i} x={pad.l + i * slot + slot / 2} y={height - 6} textAnchor={data.length === 1 ? "middle" : i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"} className="fill-muted text-[11px]">
              {monthLabel(data[i]!.month)}
            </text>
          ) : null,
        )}
      </svg>
      {h && hover !== null && (
        <div
          className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-lg border border-border-strong bg-surface-raised px-2.5 py-1.5 text-xs shadow-e3"
          style={{ left: `clamp(80px, ${((pad.l + hover * slot + slot / 2) / width) * 100}%, calc(100% - 80px))` }}
        >
          <div className="mb-1 text-muted">{monthLabel(h.month, true)}</div>
          <div className="grid grid-cols-[auto_auto] gap-x-4 gap-y-0.5 font-mono tabular-nums text-text">
            <span className="font-sans text-muted">Income</span><span className="text-right">{isk(h.income)}</span>
            <span className="font-sans text-muted">Spending</span><span className="text-right">{isk(h.spending)}</span>
            <span className="font-sans text-muted">Net</span><span className="text-right font-semibold">{isk(h.net, { sign: true })}</span>
            {(h.internal_in > 0 || h.internal_out > 0) && (
              <><span className="font-sans text-subtle">Internal</span><span className="text-right text-subtle">{isk(h.internal_in)} in · {isk(h.internal_out)} out</span></>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
