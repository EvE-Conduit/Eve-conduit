import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import type { Point } from "./AreaChart";

function niceMax(max: number) {
  if (max <= 0) return 1;
  const mag = 10 ** Math.floor(Math.log10(max));
  return ([1, 2, 2.5, 5, 10].map((m) => m * mag).find((v) => v >= max) ?? max);
}

/**
 * Columns for per-day amounts (e.g. ISK mined per day). Bars grow from a zero
 * baseline, are capped at 24px wide and show a tooltip on hover.
 */
export function BarChart({
  data,
  height = 200,
  format,
  label,
  className,
  unit = "day",
}: {
  data: Point[];
  height?: number;
  format: (n: number) => string;
  label: string;
  className?: string;
  /** What one bar stands for; hourly bars label the axis with times. */
  unit?: "day" | "hour";
}) {
  const axisLabel = (iso: string) =>
    unit === "hour"
      ? new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
      : new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const tipLabel = (iso: string) =>
    unit === "hour"
      ? new Date(iso).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
      : new Date(iso).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(120, Math.round(entry!.contentRect.width))));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const pad = { t: 12, r: 8, b: 26, l: 56 };
  const max = niceMax(Math.max(...data.map((d) => d.value), 0));
  const ticks = [0, max / 2, max];
  const plotW = width - pad.l - pad.r;
  const slot = plotW / Math.max(1, data.length);
  const barW = Math.min(24, Math.max(2, slot - 2));
  const y = (v: number) => pad.t + (1 - v / max) * (height - pad.t - pad.b);
  const base = y(0);

  return (
    <div ref={box} className={cn("relative", className)}>
      <svg width={width} height={height} className="block select-none" role="img" aria-label={label} onPointerLeave={() => setHover(null)}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={width - pad.r} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeWidth="1" />
            <text x={pad.l - 10} y={y(t)} dy="0.32em" textAnchor="end" className="fill-muted font-mono text-[11px] tabular-nums">
              {format(t).replace(" ISK", "")}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const x = pad.l + i * slot + (slot - barW) / 2;
          const h = Math.max(0, base - y(d.value));
          const r = Math.min(4, h, barW / 2);
          return (
            <g key={d.date} onPointerEnter={() => setHover(i)}>
              {/* Hit target: the whole column slot, taller than the bar. */}
              <rect x={pad.l + i * slot} y={pad.t} width={slot} height={base - pad.t} fill="transparent" />
              {h > 0 && (
                <path
                  d={`M${x},${base}V${base - h + r}Q${x},${base - h} ${x + r},${base - h}H${x + barW - r}Q${x + barW},${base - h} ${x + barW},${base - h + r}V${base}Z`}
                  fill="var(--site-accent)"
                  opacity={hover === null || hover === i ? 0.9 : 0.45}
                />
              )}
            </g>
          );
        })}
        {[0, Math.floor((data.length - 1) / 2), data.length - 1].map((i) =>
          data[i] ? (
            <text key={i} x={pad.l + i * slot + slot / 2} y={height - 6} textAnchor={i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"} className="fill-muted text-[11px]">
              {axisLabel(data[i]!.date)}
            </text>
          ) : null,
        )}
      </svg>
      {hover !== null && data[hover] && (
        <div
          className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-lg border border-border-strong bg-surface-raised px-2.5 py-1.5 text-xs shadow-e3"
          style={{ left: `clamp(60px, ${((pad.l + hover * slot + slot / 2) / width) * 100}%, calc(100% - 60px))` }}
        >
          <div className="text-muted">{tipLabel(data[hover]!.date)}</div>
          <div className="font-mono font-semibold tabular-nums text-text">{format(data[hover]!.value)}</div>
        </div>
      )}
    </div>
  );
}
