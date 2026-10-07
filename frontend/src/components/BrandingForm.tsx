import { Check } from "lucide-react";
import { useState } from "react";

import { BrandMark } from "@/components/layout/Brand";
import { Field, Input } from "@/components/ui/input";
import { applyAccent } from "@/lib/bootstrap";
import { cn } from "@/lib/utils";

export interface BrandingValues {
  name: string;
  tagline: string;
  accent: string;
  logo_url: string;
}

const PRESETS = ["#22d3ee", "var(--info)", "#818cf8", "#a78bfa", "#f472b6", "var(--danger)", "#fb923c", "var(--warning)", "#a3e635", "var(--success)"];

/** Name, tagline, accent and logo, with a live preview that recolours the whole site. */
export function BrandingForm({ value, onChange }: { value: BrandingValues; onChange: (v: BrandingValues) => void }) {
  const [custom, setCustom] = useState(!PRESETS.includes(value.accent));
  const set = (patch: Partial<BrandingValues>) => {
    const next = { ...value, ...patch };
    if (patch.accent) applyAccent(patch.accent);
    onChange(next);
  };

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_260px]">
      <div className="space-y-5">
        <Field label="Site name">
          <Input value={value.name} maxLength={60} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Brave Collective Auth" />
        </Field>
        <Field label="Tagline" hint="Shown under the name on the login page.">
          <Input value={value.tagline} maxLength={120} onChange={(e) => set({ tagline: e.target.value })} placeholder="Fly safe, have fun" />
        </Field>
        <Field label="Logo URL" hint="Optional. A square image over https://, e.g. your alliance logo from images.evetech.net.">
          <Input value={value.logo_url} onChange={(e) => set({ logo_url: e.target.value })} placeholder="https://images.evetech.net/alliances/…/logo?size=128" />
        </Field>
        <div className="space-y-2">
          <span className="text-[13px] font-medium text-text">Accent colour</span>
          <div className="flex flex-wrap items-center gap-2">
            {PRESETS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setCustom(false);
                  set({ accent: c });
                }}
                className={cn("grid size-8 place-items-center rounded-lg ring-1 ring-border-strong transition hover:scale-110", value.accent === c && "ring-2 ring-text ring-offset-2 ring-offset-surface")}
                style={{ background: c }}
                aria-label={`Accent ${c}`}
              >
                {value.accent === c && <Check className="size-4 text-black/70" />}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCustom(true)}
              className={cn("h-8 rounded-lg border border-dashed border-border-strong px-3 text-xs text-muted hover:text-text", custom && "border-accent text-text")}
            >
              Custom
            </button>
          </div>
          {custom && (
            <div className="flex items-center gap-2 pt-1">
              <input type="color" value={value.accent} onChange={(e) => set({ accent: e.target.value })} className="h-9 w-12 cursor-pointer rounded-md border border-border-strong bg-transparent" />
              <Input value={value.accent} onChange={(e) => set({ accent: e.target.value })} className="w-32 font-mono" maxLength={7} />
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="mb-2 text-[13px] font-medium text-text">Preview</div>
        <div className="panel overflow-hidden rounded-xl">
          <div className="backdrop-space p-5">
            <div className="flex items-center gap-3">
              {value.logo_url ? <img src={value.logo_url} alt="" className="size-8 rounded-lg object-cover" /> : <BrandMark />}
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{value.name || "Your site"}</div>
                <div className="truncate text-[11px] text-subtle">{value.tagline || "Tagline"}</div>
              </div>
            </div>
            <div className="mt-5 space-y-1">
              <div className="flex items-center gap-2 rounded-md bg-accent-soft px-2.5 py-1.5 text-xs">
                <span className="size-1.5 rounded-none bg-accent" /> Dashboard
              </div>
              <div className="px-2.5 py-1.5 text-xs text-muted">Characters</div>
            </div>
            <div className="mt-5 h-8 rounded-lg bg-accent text-center text-xs font-semibold leading-8 text-accent-fg">Log in</div>
          </div>
        </div>
      </div>
    </div>
  );
}
