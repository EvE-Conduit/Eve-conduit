import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// rounded-control and rounded-pill are theme radii (theme.css), so overrides like rounded-full replace them.
const twMerge = extendTailwindMerge({ extend: { theme: { radius: ["control", "pill"] } } });

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

export function timeAgo(iso: string | null | undefined) {
  if (!iso) return "never";
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  const units: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, "second"], [60, "minute"], [24, "hour"], [30, "day"], [12, "month"], [Infinity, "year"],
  ];
  let value = seconds;
  for (const [step, unit] of units) {
    if (Math.abs(value) < step) return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(-value, unit);
    value = Math.round(value / step);
  }
  return "";
}
