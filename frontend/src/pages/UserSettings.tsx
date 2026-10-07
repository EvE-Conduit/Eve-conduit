import { useQuery } from "@tanstack/react-query";
import { Bell, Check, Clock, Monitor, Moon, Palette, SlidersHorizontal, Sun } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation } from "react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Select } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch, SwitchRow } from "@/components/ui/switch";
import { Segmented } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { useCurrentUser } from "@/lib/bootstrap";
import { clock, localDateTime } from "@/lib/format";
import { DEFAULT_PREFERENCES, useSavePreferences } from "@/lib/preferences";
import type { Preferences } from "@/lib/types";
import { cn } from "@/lib/utils";

function zones(): string[] {
  try {
    const list = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf?.("timeZone") ?? [];
    return list.includes("UTC") ? list : ["UTC", ...list];
  } catch {
    return ["UTC"];
  }
}

export function UserSettings() {
  const user = useCurrentUser();
  const save = useSavePreferences();
  const prefs: Preferences = { ...DEFAULT_PREFERENCES, ...(user?.preferences ?? {}) };
  const { hash } = useLocation();
  const [now, setNow] = useState(() => new Date());
  const allZones = useMemo(zones, []);
  const browserZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const { data: categories, isLoading: loadingCategories } = useQuery({
    queryKey: ["me", "preferences", "categories"],
    queryFn: () => api.get<{ key: string; label: string }[]>("/api/me/preferences/categories"),
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [hash]);

  const set = (patch: Partial<Preferences>) =>
    save.mutate({ ...prefs, ...patch }, { onError: (e) => toast.error(`Couldn't save: ${e.message}`) });

  return (
    <>
      <PageHeader
        eyebrow="Account"
        title="Settings"
        icon={<SlidersHorizontal />}
        description="How the site looks and behaves for you. Changes apply straight away and follow you to every device."
        actions={save.isPending ? <span className="text-xs text-muted">Saving…</span> : save.isSuccess ? <span className="flex items-center gap-1 text-xs text-success-fg"><Check className="size-3.5" /> Saved</span> : null}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <Card id="appearance" className="scroll-mt-24">
            <CardHeader icon={<Palette />} title="Appearance" description="Theme, density and readability." />
            <CardBody className="space-y-7">
              <Row label="Theme" description="System follows your device's light or dark setting.">
                <div className="grid grid-cols-3 gap-3">
                  <ThemeCard value="dark" current={prefs.theme} onPick={(theme) => set({ theme })} icon={<Moon />} label="Dark" />
                  <ThemeCard value="light" current={prefs.theme} onPick={(theme) => set({ theme })} icon={<Sun />} label="Light" />
                  <ThemeCard value="system" current={prefs.theme} onPick={(theme) => set({ theme })} icon={<Monitor />} label="System" />
                </div>
              </Row>
              <Row label="Density" description="Compact fits more rows in tables and cards.">
                <Segmented
                  aria-label="Density"
                  value={prefs.density}
                  onChange={(density) => set({ density })}
                  options={[
                    { value: "comfortable", label: "Comfortable" },
                    { value: "compact", label: "Compact" },
                  ]}
                />
              </Row>
              <Row label="Text size" description="Scales text and spacing across the site.">
                <Segmented
                  aria-label="Text size"
                  value={String(prefs.text_scale) as "0" | "1" | "2"}
                  onChange={(v) => set({ text_scale: Number(v) })}
                  options={[
                    { value: "0", label: <span className="text-xs">Aa</span> },
                    { value: "1", label: <span className="text-sm">Aa</span> },
                    { value: "2", label: <span className="text-base">Aa</span> },
                  ]}
                />
              </Row>
              <div className="divide-y divide-border border-t border-border">
                <SwitchRow
                  label="High contrast"
                  description="Brighter text and stronger borders and focus outlines."
                  checked={prefs.high_contrast}
                  onCheckedChange={(high_contrast) => set({ high_contrast })}
                />
                <SwitchRow
                  label="Reduce motion"
                  description="Turn off animations and transitions."
                  checked={prefs.reduce_motion}
                  onCheckedChange={(reduce_motion) => set({ reduce_motion })}
                />
              </div>
            </CardBody>
          </Card>

          <Card id="time" className="scroll-mt-24">
            <CardHeader icon={<Clock />} title="Time" description="EVE runs on UTC (EVE time). Choose how times are shown to you." />
            <CardBody className="space-y-7">
              <Row label="Your time zone" description="Shown next to EVE time in the top bar and on event times.">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Select
                    aria-label="Time zone"
                    className="w-full sm:w-72"
                    value={allZones.includes(prefs.timezone) ? prefs.timezone : "UTC"}
                    onChange={(e) => set({ timezone: e.target.value })}
                    options={allZones.map((z) => ({ value: z, label: z === "UTC" ? "UTC (EVE time)" : z.replace(/_/g, " ") }))}
                  />
                  {browserZone && browserZone !== prefs.timezone && allZones.includes(browserZone) && (
                    <Button size="sm" variant="ghost" onClick={() => set({ timezone: browserZone })}>
                      Use {browserZone.replace(/_/g, " ")}
                    </Button>
                  )}
                </div>
              </Row>
              <div className="border-t border-border">
                <SwitchRow label="24-hour clock" description="19:00 instead of 7:00 pm." checked={prefs.clock_24h} onCheckedChange={(clock_24h) => set({ clock_24h })} />
              </div>
              <div className="grid grid-cols-1 gap-3 rounded-xl border border-border bg-surface-2 p-4 sm:grid-cols-2">
                <div>
                  <div className="eyebrow">EVE time</div>
                  <div className="mt-1 font-mono text-xl font-semibold tabular-nums">{clock(now, { timeZone: "UTC" })}</div>
                </div>
                <div>
                  <div className="eyebrow">Your time</div>
                  <div className="mt-1 font-mono text-xl font-semibold tabular-nums">{clock(now)}</div>
                  <div className="text-xs text-muted">{localDateTime(now)}</div>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card id="notifications" className="scroll-mt-24">
            <CardHeader icon={<Bell />} title="Notifications" description="Turn off the kinds of notification you don't want. Important security messages always arrive." />
            <CardBody className="py-2">
              {loadingCategories ? (
                <div className="space-y-2 py-3">
                  {[0, 1, 2].map((i) => (
                    <Skeleton key={i} className="h-10" />
                  ))}
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {(categories ?? []).map((c) => {
                    const on = !prefs.muted_categories.includes(c.key);
                    return (
                      <li key={c.key} className="flex items-center justify-between gap-6 py-3">
                        <div>
                          <div className="text-sm font-medium">{c.label}</div>
                          <div className="font-mono text-[11px] text-subtle">{c.key}</div>
                        </div>
                        <Switch
                          aria-label={c.label}
                          checked={on}
                          onCheckedChange={(v) =>
                            set({ muted_categories: v ? prefs.muted_categories.filter((k) => k !== c.key) : [...prefs.muted_categories, c.key] })
                          }
                        />
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>

        <aside className="hidden xl:block">
          <div className="sticky top-24 space-y-3">
            <div className="eyebrow px-1">Preview</div>
            <Preview />
          </div>
        </aside>
      </div>
    </>
  );
}

function Row({ label, description, children }: { label: ReactNode; description?: ReactNode; children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-[220px_minmax(0,1fr)] md:gap-8">
      <div>
        <div className="text-sm font-medium text-text">{label}</div>
        {description && <div className="mt-0.5 text-xs leading-relaxed text-muted">{description}</div>}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

const SWATCH = {
  dark: { bg: "#070a10", panel: "#111824", line: "#2a3342", text: "#edf1f7" },
  light: { bg: "#f3f5f9", panel: "#ffffff", line: "#dde3ec", text: "#0b1220" },
};

function ThemeCard({
  value,
  current,
  onPick,
  icon,
  label,
}: {
  value: Preferences["theme"];
  current: Preferences["theme"];
  onPick: (v: Preferences["theme"]) => void;
  icon: ReactNode;
  label: string;
}) {
  const active = value === current;
  const Mini = ({ s, className }: { s: (typeof SWATCH)["dark"]; className?: string }) => (
    <div className={cn("flex h-full gap-1.5 p-2", className)} style={{ background: s.bg }}>
      <div className="w-1/4 rounded-sm" style={{ background: s.panel, boxShadow: `inset 0 0 0 1px ${s.line}` }} />
      <div className="flex flex-1 flex-col gap-1.5">
        <div className="h-2 w-2/3 rounded-none" style={{ background: s.text, opacity: 0.8 }} />
        <div className="flex-1 rounded-sm" style={{ background: s.panel, boxShadow: `inset 0 0 0 1px ${s.line}` }}>
          <div className="m-1.5 h-1.5 w-1/3 rounded-none bg-accent" />
        </div>
      </div>
    </div>
  );
  return (
    <button
      type="button"
      onClick={() => onPick(value)}
      aria-pressed={active}
      className={cn(
        "group overflow-hidden rounded-xl border text-left transition-all",
        active ? "border-accent ring-2 ring-accent/30" : "border-border-strong hover:border-[color-mix(in_oklab,var(--border-strong)_60%,var(--text)_20%)]",
      )}
    >
      <div className="relative h-20 overflow-hidden">
        {value === "system" ? (
          <div className="flex h-full">
            <Mini s={SWATCH.dark} className="w-1/2" />
            <Mini s={SWATCH.light} className="w-1/2" />
          </div>
        ) : (
          <Mini s={SWATCH[value]} />
        )}
      </div>
      <div className="flex items-center gap-2 border-t border-border bg-surface px-3 py-2 text-sm font-medium [&_svg]:size-4 [&_svg]:text-muted">
        {icon}
        {label}
        {active && <Check className="ml-auto !text-accent-ink" />}
      </div>
    </button>
  );
}

/** A small sample of real components, so changes can be judged at a glance. */
function Preview() {
  return (
    <div className="panel space-y-4 rounded-xl p-card">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">Wallet</span>
        <span className="rounded-md bg-success-soft px-1.5 py-0.5 font-mono text-[11px] font-medium text-success-fg">+4.2%</span>
      </div>
      <div className="font-mono text-2xl font-semibold tabular-nums">12.48B ISK</div>
      <p className="text-sm text-muted">Secondary text should be easy to read without straining.</p>
      <p className="text-xs text-subtle">Hints and timestamps · 3 minutes ago</p>
      <div className="h-2 overflow-hidden rounded-none bg-hover-strong">
        <div className="h-full w-2/3 rounded-none bg-accent" />
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="primary">
          Primary
        </Button>
        <Button size="sm">Secondary</Button>
      </div>
    </div>
  );
}
