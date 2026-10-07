import { useEffect, useId, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export interface Point {
  date: string;
  value: number;
}

function niceTicks(min: number, max: number, count = 4) {
  if (min === max) return [min];
  const span = max - min;
  const step0 = span / count;
  const mag = 10 ** Math.floor(Math.log10(step0));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => span / s <= count) ?? step0;
  const ticks = [];
  for (let v = Math.ceil(min / step) * step; v <= max + 1e-9; v += step) ticks.push(v);
  return ticks;
}

/**
 * A single-series area chart (e.g. wallet balance over time). One series, so no
 * legend: the card title names it. Hover anywhere for a crosshair and value.
 */
export function AreaChart({
  data,
  height = 220,
  format,
  label = "Value",
  compact = false,
  className,
}: {
  data: Point[];
  height?: number;
  format: (n: number) => string;
  label?: string;
  compact?: boolean;
  className?: string;
}) {
  const gradientId = useId();
  const ref = useRef<SVGSVGElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [width, setWidth] = useState(640);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(120, Math.round(entry!.contentRect.width))));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const pad = compact ? { t: 4, r: 2, b: 4, l: 2 } : { t: 12, r: 12, b: 26, l: 64 };

  const geo = useMemo(() => {
    const values = data.map((d) => d.value);
    // A balance line reads best scaled to its own range (zero baselines are for bars).
    let min = Math.min(...values);
    let max = Math.max(...values);
    const padding = (max - min) * 0.12 || Math.abs(max) * 0.05 || 1;
    min -= padding;
    max += padding;
    const ticks = niceTicks(min, max).filter((t) => t >= min && t <= max);
    const x = (i: number) => pad.l + (i / Math.max(1, data.length - 1)) * (width - pad.l - pad.r);
    const y = (v: number) => pad.t + (1 - (v - min) / (max - min)) * (height - pad.t - pad.b);
    const line = data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join("");
    const area = `${line}L${x(data.length - 1).toFixed(1)},${y(min)}L${x(0).toFixed(1)},${y(min)}Z`;
    return { x, y, line, area, ticks, min };
  }, [data, height, width, pad.l, pad.r, pad.t, pad.b]);

  if (data.length < 2) return <div ref={box} className="grid place-items-center text-sm text-muted" style={{ height }}>Not enough history yet</div>;

  const onMove = (e: React.PointerEvent) => {
    const rect = ref.current!.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * width;
    const i = Math.round(((px - pad.l) / (width - pad.l - pad.r)) * (data.length - 1));
    setHover(Math.max(0, Math.min(data.length - 1, i)));
  };

  const last = data.length - 1;
  const h = hover ?? null;
  const tooltipLeft = h !== null ? (geo.x(h) / width) * 100 : 0;

  return (
    <div ref={box} className={cn("relative", className)}>
      <svg
        ref={ref}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="block touch-none select-none overflow-visible"
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
        role="img"
        aria-label={`${label}: ${format(data[0]!.value)} to ${format(data[last]!.value)}`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--site-accent)" stopOpacity="0.22" />
            <stop offset="1" stopColor="var(--site-accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {!compact &&
          geo.ticks.map((t) => (
            <g key={t}>
              <line x1={pad.l} x2={width - pad.r} y1={geo.y(t)} y2={geo.y(t)} stroke="var(--border)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
              <text x={pad.l - 10} y={geo.y(t)} dy="0.32em" textAnchor="end" className="fill-muted font-mono text-[11px] tabular-nums">
                {format(t).replace(" ISK", "")}
              </text>
            </g>
          ))}
        {!compact &&
          [0, Math.floor(last / 2), last].map((i) => (
            <text key={i} x={geo.x(i)} y={height - 6} textAnchor={i === 0 ? "start" : i === last ? "end" : "middle"} className="fill-muted text-[11px]">
              {new Date(data[i]!.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
            </text>
          ))}
        <path d={geo.area} fill={`url(#${gradientId})`} />
        <path d={geo.line} fill="none" stroke="var(--site-accent)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        {h !== null && (
          <>
            <line x1={geo.x(h)} x2={geo.x(h)} y1={pad.t} y2={height - pad.b} stroke="var(--border-strong)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            <circle cx={geo.x(h)} cy={geo.y(data[h]!.value)} r="4.5" fill="var(--site-accent)" stroke="var(--surface)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          </>
        )}
        {h === null && !compact && (
          <circle cx={geo.x(last)} cy={geo.y(data[last]!.value)} r="4" fill="var(--site-accent)" stroke="var(--surface)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        )}
      </svg>
      {h !== null && (
        <div
          className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-lg border border-border-strong bg-surface-raised px-2.5 py-1.5 text-xs shadow-e3"
          style={{ left: `clamp(60px, ${tooltipLeft}%, calc(100% - 60px))` }}
        >
          <div className="text-muted">{new Date(data[h]!.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}</div>
          <div className="font-mono font-semibold tabular-nums text-text">{format(data[h]!.value)}</div>
        </div>
      )}
    </div>
  );
}
