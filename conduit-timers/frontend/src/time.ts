// Countdown text, reading "1d 4h 23m" the way it's written on the in-game timer, and day labels. No React here, so it can be run on its own.

const pad = (n: number) => String(n).padStart(2, "0");

/** "2d 05h 12m" more than a day away, else "05:12:30"; "" once it's passed. */
export function countdown(iso: string, now: number): string {
  let s = Math.round((new Date(iso).getTime() - now) / 1000);
  if (s <= 0) return "";
  const d = Math.floor(s / 86400);
  s -= d * 86400;
  const h = Math.floor(s / 3600);
  s -= h * 3600;
  const m = Math.floor(s / 60);
  s -= m * 60;
  return d ? `${d}d ${pad(h)}h ${pad(m)}m` : `${pad(h)}:${pad(m)}:${pad(s)}`;
}

/** "4h 23m" / "2d 5h" / "35m", for sentences. */
export function timeLeftText(iso: string, now: number): string {
  let s = Math.max(0, Math.round((new Date(iso).getTime() - now) / 1000));
  const d = Math.floor(s / 86400);
  s -= d * 86400;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s - h * 3600) / 60);
  if (d) return `${d}d ${h}h`;
  if (h) return `${h}h ${m}m`;
  return `${m}m`;
}

/**
 * Reads the time left as the game shows it, or as people type it: "1d 4h 23m", "4h23m", "1d 4h", "90m", "4:23"
 * (hours:minutes), "1d 4:23". Returns seconds, or null when it can't be read.
 */
export function parseTimeLeft(text: string): number | null {
  const t = text.trim().toLowerCase().replace(/\s+/g, " ");
  if (!t) return null;
  let total = 0;
  let rest = t;
  const days = /^(\d+)\s*d(?:ays?)?\b\s*/.exec(rest);
  if (days) {
    total += Number(days[1]) * 86400;
    rest = rest.slice(days[0].length);
  }
  const clock = /^(\d{1,3}):(\d{2})(?::(\d{2}))?$/.exec(rest);
  if (clock) return total + Number(clock[1]) * 3600 + Number(clock[2]) * 60 + Number(clock[3] ?? 0);
  if (!rest) return total || null;
  let matched = false;
  const unit = /(\d+(?:\.\d+)?)\s*(h(?:ours?|rs?)?|m(?:in(?:ute)?s?)?|s(?:ec(?:ond)?s?)?)(?![a-z])\s*/gy;
  let m: RegExpExecArray | null;
  let pos = 0;
  unit.lastIndex = 0;
  while ((m = unit.exec(rest)) !== null) {
    matched = true;
    const n = Number(m[1]);
    const u = m[2]![0];
    total += u === "h" ? n * 3600 : u === "m" ? n * 60 : n;
    pos = unit.lastIndex;
  }
  if (!matched || pos !== rest.length) return null;
  return total;
}

/** ISO time -> the value a datetime-local input shows, in the browser's time zone. */
export function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromLocalInput(v: string): string | null {
  return v ? new Date(v).toISOString() : null;
}

/** "Today", "Tomorrow" or "Mon 12 Oct", by EVE time. */
export function dayLabel(iso: string, now: number): string {
  const day = (ms: number) => Math.floor(ms / 86400000);
  const diff = day(new Date(iso).getTime()) - day(now);
  const name = new Date(iso).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
  if (diff === 0) return `Today · ${name}`;
  if (diff === 1) return `Tomorrow · ${name}`;
  if (diff === -1) return `Yesterday · ${name}`;
  return name;
}
