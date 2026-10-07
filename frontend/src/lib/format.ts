import { currentPreferences } from "./preferences";

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 2 });
const whole = new Intl.NumberFormat("en", { maximumFractionDigits: 0 });
const precise = new Intl.NumberFormat("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** 1234567.89 -> "1.23M ISK" */
export function isk(value: number | null | undefined, opts: { full?: boolean; sign?: boolean } = {}) {
  if (value == null) return "—";
  const sign = opts.sign && value > 0 ? "+" : "";
  return `${sign}${opts.full ? precise.format(value) : compact.format(value)} ISK`;
}

export function num(value: number | null | undefined) {
  return value == null ? "—" : whole.format(value);
}

export function sp(value: number | null | undefined) {
  return value == null ? "—" : `${compact.format(value)} SP`;
}

export function dateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC" }) + " ET";
}

export function date(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

/** "2d 4h", "35m" */
export function duration(toIso: string | null | undefined, from = Date.now()) {
  if (!toIso) return "—";
  let s = Math.max(0, Math.round((new Date(toIso).getTime() - from) / 1000));
  const d = Math.floor(s / 86400);
  s -= d * 86400;
  const h = Math.floor(s / 3600);
  s -= h * 3600;
  const m = Math.floor(s / 60);
  if (d) return `${d}d ${h}h`;
  if (h) return `${h}h ${m}m`;
  return `${m}m`;
}

/** "bounty_prizes" -> "Bounty prizes" */
export function humanize(key: string) {
  const s = key.replace(/_/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export const ROMAN = ["0", "I", "II", "III", "IV", "V"];

// --- Time in the user's own zone (preferences.timezone / clock_24h) --------------------------


function zoneOpts(): { timeZone: string; hour12: boolean } {
  const p = currentPreferences();
  let timeZone = p.timezone || "UTC";
  try {
    new Intl.DateTimeFormat("en", { timeZone });
  } catch {
    timeZone = "UTC";
  }
  return { timeZone, hour12: !p.clock_24h };
}

/** "6 Oct 2026, 19:00" in the user's time zone (falls back to EVE time). */
export function localDateTime(iso: string | Date | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", ...zoneOpts() });
}

/** "19:00" (or "7:00 pm") in the user's zone; pass timeZone "UTC" for EVE time. */
export function clock(d: Date = new Date(), opts: { timeZone?: string; seconds?: boolean } = {}) {
  const z = zoneOpts();
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: opts.seconds ? "2-digit" : undefined,
    hour12: z.hour12,
    timeZone: opts.timeZone ?? z.timeZone,
  });
}

/** Both: "19:00 ET · 21:00 local", for event times people plan around. */
export function eveAndLocal(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  return zoneOpts().timeZone === "UTC" ? dateTime(iso) : `${dateTime(iso)} · ${clock(d)} local`;
}
