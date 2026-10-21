// Countdown text and EVE-time helpers. No React here, so it can be run on its own.

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

/** "2h 30m", "45m", "3h" for a length in minutes. */
export function lengthText(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h}h${m ? ` ${m}m` : ""}` : `${m}m`;
}

/** "19:00" by EVE time. */
export function eveClock(iso: string): string {
  const d = new Date(iso);
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

/** ISO time -> the value a datetime-local input shows, by EVE time (ops are planned in EVE time). */
export function toEveInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

/** A datetime-local value read as EVE time -> ISO. */
export function fromEveInput(v: string): string | null {
  return v ? new Date(`${v}:00Z`).toISOString() : null;
}

/** "YYYY-MM-DD" of an instant by EVE time, for grouping into calendar days. */
export function eveDay(iso: string | number): string {
  const d = new Date(iso);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
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

/** The weeks (Monday first) shown for a month, as "YYYY-MM-DD" days; days outside the month are included to fill the rows. */
export function monthGrid(year: number, month: number): string[][] {
  const first = new Date(Date.UTC(year, month, 1));
  const start = new Date(first);
  start.setUTCDate(1 - ((first.getUTCDay() + 6) % 7));
  const weeks: string[][] = [];
  const d = new Date(start);
  do {
    const week: string[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(eveDay(d.getTime()));
      d.setUTCDate(d.getUTCDate() + 1);
    }
    weeks.push(week);
  } while (d.getUTCMonth() === month);
  return weeks;
}
