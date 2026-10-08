import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Eye, Home, LayoutGrid, Link2, PencilLine, Plus, Puzzle, RotateCcw, Sparkles, Text, Trash2 } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Alert } from "@/components/ui/feedback";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page";
import { Skeleton } from "@/components/ui/skeleton";
import { SwitchRow } from "@/components/ui/switch";
import { LandingView } from "@/features/landing/LandingView";
import { usePluginLandingSections } from "@/features/landing/PluginSections";
import { api } from "@/lib/api";
import { useBootstrap } from "@/lib/bootstrap";
import { iconFor, ICON_NAMES } from "@/lib/icons";
import { LANDING_KEY, landingQuery, PLACEHOLDERS, type LandingContent, type LandingResponse } from "@/lib/landing";
import { cn } from "@/lib/utils";

const PLACEHOLDER_HINT = `You can use ${PLACEHOLDERS.join(", ")}.`;
const LINK_HINT = "A page on this site, like /groups, or an https:// address (members are asked before they leave).";

/** Administration > Settings > Landing page: edit /home, with a live preview. */
export function LandingEditor() {
  const pluginSections = usePluginLandingSections();
  const qc = useQueryClient();
  const { site } = useBootstrap();
  const { data } = useQuery(landingQuery);
  const [draft, setDraft] = useState<LandingContent | null>(null);
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [confirmReset, setConfirmReset] = useState(false);
  useEffect(() => {
    if (data && !draft) setDraft(structuredClone(data.content));
  }, [data, draft]);

  const done = (saved: LandingResponse, msg: string) => {
    qc.setQueryData(LANDING_KEY, saved);
    setDraft(structuredClone(saved.content));
    toast.success(msg);
  };
  const save = useMutation({
    mutationFn: (c: LandingContent) => api.put<LandingResponse>("/api/admin/landing", c),
    onSuccess: (saved) => done(saved, "Landing page saved"),
    onError: (e) => toast.error(e.message),
  });
  const reset = useMutation({
    mutationFn: () => api.delete<LandingResponse>("/api/admin/landing"),
    onSuccess: (saved) => done(saved, "Landing page reset to the default"),
    onError: (e) => toast.error(e.message),
  });

  if (!data || !draft) return <Skeleton className="h-96" />;
  const dirty = JSON.stringify(draft) !== JSON.stringify(data.content);
  const set = (patch: Partial<LandingContent>) => setDraft({ ...draft, ...patch });
  const setHero = (patch: Partial<LandingContent["hero"]>) => set({ hero: { ...draft.hero, ...patch } });

  return (
    <>
      <PageHeader
        eyebrow={
          <Link to="/admin/settings" className="hover:text-text">
            Administration › Settings
          </Link>
        }
        title="Landing page"
        icon={<Home />}
        description="The first page members see after signing in. Everything on it is yours to change; the preview shows it as you would see it."
        actions={
          <>
            <Button variant="ghost" onClick={() => setConfirmReset(true)} disabled={data.is_default && !dirty}>
              <RotateCcw /> Reset to default
            </Button>
            <Button variant="ghost" disabled={!dirty} onClick={() => setDraft(structuredClone(data.content))}>
              Discard
            </Button>
            <Button variant="primary" disabled={!dirty} loading={save.isPending} onClick={() => save.mutate(draft)}>
              Save changes
            </Button>
          </>
        }
      />

      {site.start_page !== "/home" && (
        <Alert tone="info" className="mb-6" title="Members don't land here yet">
          The start page is set to something else. Choose <strong>Home (landing page)</strong> under{" "}
          <Link to="/admin/settings" className="underline underline-offset-2">
            Settings › Start page
          </Link>{" "}
          to show it after signing in. It's always reachable from Home in the menu.
        </Alert>
      )}

      <div className="mb-6 inline-flex border border-border bg-surface/70 p-1">
        {(
          [
            ["edit", "Edit", PencilLine],
            ["preview", "Preview", Eye],
          ] as const
        ).map(([v, label, Icon]) => (
          <button
            key={v}
            onClick={() => setMode(v)}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-1.5 text-sm text-muted transition-colors",
              mode === v && "bg-surface-3 text-text shadow",
            )}
          >
            <Icon className="size-4" /> {label}
          </button>
        ))}
      </div>

      {mode === "preview" ? (
        <LandingView content={draft} preview />
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader icon={<Sparkles />} title="Hero" description={`The big banner at the top. ${PLACEHOLDER_HINT}`} />
            <CardBody className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <Field label="Eyebrow" hint="The small line above the title.">
                <Input value={draft.hero.eyebrow} maxLength={80} onChange={(e) => setHero({ eyebrow: e.target.value })} />
              </Field>
              <Field label="Title">
                <Input value={draft.hero.title} maxLength={120} onChange={(e) => setHero({ title: e.target.value })} />
              </Field>
              <Field label="Text" className="md:col-span-2">
                <Textarea value={draft.hero.subtitle} maxLength={600} rows={3} onChange={(e) => setHero({ subtitle: e.target.value })} />
              </Field>
              <Field label="Background image" hint="Optional https:// image, faded in on the right. Ship renders from images.evetech.net work well.">
                <Input value={draft.hero.image_url} onChange={(e) => setHero({ image_url: e.target.value })} placeholder="https://images.evetech.net/types/…/render?size=1024" />
              </Field>
              <div className="self-end">
                <SwitchRow
                  label="Show who's signed in"
                  description="Portrait, state, corporation and alliance of the person looking."
                  checked={draft.hero.show_profile}
                  onCheckedChange={(show_profile) => setHero({ show_profile })}
                />
              </div>
            </CardBody>
          </Card>

          <ListCard
            icon={<Link2 />}
            title="Buttons"
            description="Call-to-action buttons in the hero. Up to 4."
            items={draft.buttons}
            max={4}
            onChange={(buttons) => set({ buttons })}
            blank={{ label: "New button", link: "/", style: "secondary" } as LandingContent["buttons"][number]}
            render={(b, update) => (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1.5fr_160px]">
                <Field label="Label">
                  <Input value={b.label} maxLength={40} onChange={(e) => update({ label: e.target.value })} />
                </Field>
                <Field label="Link" hint={LINK_HINT}>
                  <Input value={b.link} onChange={(e) => update({ link: e.target.value })} />
                </Field>
                <Field label="Style">
                  <Select value={b.style} onChange={(e) => update({ style: e.target.value as "primary" | "secondary" })}>
                    <option value="primary">Solid (accent)</option>
                    <option value="secondary">Outline</option>
                  </Select>
                </Field>
              </div>
            )}
          />

          <Card>
            <CardBody>
              <SwitchRow
                label="Status strip"
                description="Each member's characters, groups, unread notifications and the EVE clock, under the hero."
                checked={draft.show_status}
                onCheckedChange={(show_status) => set({ show_status })}
              />
            </CardBody>
          </Card>

          {pluginSections.length > 0 && (
            <Card>
              <CardHeader icon={<Puzzle />} title="From plugins" description="Sections your plugins add to the page. New ones show until you switch them off." />
              <CardBody className="space-y-4">
                {pluginSections.map((section) => {
                  const hidden = draft.hidden_plugin_sections ?? [];
                  return (
                    <SwitchRow
                      key={section.key}
                      label={section.title}
                      description={`${section.pluginName} · ${(section.placement ?? "top") === "top" ? "under the hero" : "at the bottom"}`}
                      checked={!hidden.includes(section.key)}
                      onCheckedChange={(on) =>
                        set({ hidden_plugin_sections: on ? hidden.filter((k) => k !== section.key) : [...hidden, section.key] })
                      }
                    />
                  );
                })}
              </CardBody>
            </Card>
          )}

          <ListCard
            icon={<LayoutGrid />}
            title="Quick links"
            description="Tiles with an icon, a title and a short text. Up to 12."
            items={draft.cards}
            max={12}
            onChange={(cards) => set({ cards })}
            blank={{ icon: "star", title: "New link", text: "", link: "" }}
            header={
              <Field label="Heading above the tiles" className="max-w-sm">
                <Input value={draft.cards_title} maxLength={60} onChange={(e) => set({ cards_title: e.target.value })} placeholder="Where to next" />
              </Field>
            }
            render={(c, update) => (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-[200px_1fr_1fr]">
                <IconPicker value={c.icon} onChange={(icon) => update({ icon })} />
                <Field label="Title">
                  <Input value={c.title} maxLength={60} onChange={(e) => update({ title: e.target.value })} />
                </Field>
                <Field label="Link" hint="Optional.">
                  <Input value={c.link} onChange={(e) => update({ link: e.target.value })} placeholder="/groups or https://…" />
                </Field>
                <Field label="Text" className="md:col-span-3">
                  <Input value={c.text} maxLength={300} onChange={(e) => update({ text: e.target.value })} />
                </Field>
              </div>
            )}
          />

          <ListCard
            icon={<Text />}
            title="Text sections"
            description={`Panels of text: rules, doctrine, who to ask. Markdown works: **bold**, lists, \`code\`, [links](https://…) and # headings. ${PLACEHOLDER_HINT}`}
            items={draft.sections}
            max={10}
            onChange={(sections) => set({ sections })}
            blank={{ title: "New section", body: "" }}
            render={(s, update) => (
              <div className="space-y-4">
                <Field label="Title" className="max-w-sm">
                  <Input value={s.title} maxLength={80} onChange={(e) => update({ title: e.target.value })} />
                </Field>
                <Field label="Text" hint={`${8000 - s.body.length} characters left.`}>
                  <Textarea value={s.body} maxLength={8000} rows={6} className="font-mono text-[13px]" onChange={(e) => update({ body: e.target.value })} />
                </Field>
              </div>
            )}
          />
        </div>
      )}

      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        danger
        title="Reset the landing page?"
        description="Your texts, buttons, links and sections are replaced by the built-in default. This can't be undone."
        confirmLabel={
          <>
            <RotateCcw /> Reset
          </>
        }
        onConfirm={() => reset.mutateAsync()}
      />
    </>
  );
}

/** A card holding an editable, reorderable list. */
function ListCard<T>({
  icon,
  title,
  description,
  items,
  max,
  blank,
  header,
  onChange,
  render,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  items: T[];
  max: number;
  blank: T;
  header?: ReactNode;
  onChange: (items: T[]) => void;
  render: (item: T, update: (patch: Partial<T>) => void) => ReactNode;
}) {
  const move = (i: number, d: -1 | 1) => {
    const next = [...items];
    [next[i], next[i + d]] = [next[i + d]!, next[i]!];
    onChange(next);
  };
  return (
    <Card>
      <CardHeader
        icon={icon}
        title={title}
        description={description}
        actions={
          <Button size="sm" variant="subtle" disabled={items.length >= max} onClick={() => onChange([...items, structuredClone(blank)])}>
            <Plus /> Add
          </Button>
        }
      />
      <CardBody className="space-y-4">
        {header}
        {!items.length && <p className="text-sm text-subtle">None yet. This part of the page is hidden until you add one.</p>}
        {items.map((item, i) => (
          <div key={i} className="flex gap-3 border border-border p-4">
            <div className="min-w-0 flex-1">{render(item, (patch) => onChange(items.map((it, j) => (j === i ? { ...it, ...patch } : it))))}</div>
            <div className="flex shrink-0 flex-col gap-1">
              <Button size="icon-xs" variant="ghost" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
                <ArrowUp />
              </Button>
              <Button size="icon-xs" variant="ghost" aria-label="Move down" disabled={i === items.length - 1} onClick={() => move(i, 1)}>
                <ArrowDown />
              </Button>
              <Button size="icon-xs" variant="ghost" aria-label="Remove" className="hover:text-danger-fg" onClick={() => onChange(items.filter((_, j) => j !== i))}>
                <Trash2 />
              </Button>
            </div>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}

export function IconPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const Icon = iconFor(value);
  return (
    <Field label="Icon">
      <div className="flex items-center gap-2">
        <span className="grid size-9 shrink-0 place-items-center border border-border-strong text-accent-ink">
          <Icon className="size-4" />
        </span>
        <Select value={value} onChange={(e) => onChange(e.target.value)} className="flex-1">
          {ICON_NAMES.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </Select>
      </div>
    </Field>
  );
}
