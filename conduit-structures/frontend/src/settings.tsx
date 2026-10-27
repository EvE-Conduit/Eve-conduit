// Fuel warnings: the thresholds, who is told, the plan's days and how long claims last (structures.manage_structures).
import { api, Button, Callout, Card, CardBody, CardHeader, Field, Input, PageHeader, Skeleton, SwitchRow, toast } from "@conduit/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link } from "react-router";

import { Back, Settings as SettingsIcon } from "./icons";
import { BASE, hoursLabel, parseThresholds, type Settings } from "./types";

export function SettingsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["structures", "settings"], queryFn: () => api.get<Settings>(`${BASE}/settings`) });
  const [form, setForm] = useState<Settings | null>(null);
  const [text, setText] = useState("");
  useEffect(() => {
    if (data) {
      setForm(data);
      setText(data.thresholds.map(hoursLabel).join(", "));
    }
  }, [data]);
  const parsed = parseThresholds(text);
  const save = useMutation({
    mutationFn: (s: Settings) => api.put<Settings>(`${BASE}/settings`, { ...s, thresholds: parsed ?? [] }),
    onSuccess: (s) => {
      qc.setQueryData(["structures", "settings"], s);
      qc.invalidateQueries({ queryKey: ["structures"] });
      toast.success("Saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  if (isLoading || !form) return <Skeleton className="h-64" />;
  const set = (patch: Partial<Settings>) => setForm({ ...form, ...patch });
  const toggle = (id: number) => set({ groups: form.groups.includes(id) ? form.groups.filter((x) => x !== id) : [...form.groups, id] });
  const core = hoursLabel(form.core_warning_hours);
  return (
    <>
      <Link to="/p/structures" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-text"><Back /> Structures & Fuel</Link>
      <PageHeader eyebrow="Structures & Fuel" title="Settings" icon={<SettingsIcon />} description="When fuel warnings go out and to whom. Each structure can have its own thresholds from its pencil on the board." />
      <div className="grid max-w-5xl gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Warnings" description="Each threshold warns once when a structure's fuel falls below it, and again only after it was refuelled above it." />
          <CardBody className="space-y-4">
            <Field label="Warn below" hint="Days or hours, e.g. 7d, 3d, 1d or 12h. Empty: no warnings." error={parsed ? undefined : "Use days (7d) or hours (12h)"}>
              <Input value={text} onChange={(e) => setText(e.target.value)} className="font-mono" />
            </Field>
            <Callout tone="info">
              EvE Conduit itself tells everyone who can see a corporation when one of its structures drops under {core}. At exactly {core} this
              plugin sends no notification of its own (they were just told), but its event still goes out.
            </Callout>
            <div className="divide-y divide-border">
              <SwitchRow
                label="Send notifications"
                description="Off: only the structures.fuel_low event goes out, for webhooks (Administration → Integrations)."
                checked={form.notify}
                onCheckedChange={(v) => set({ notify: v })}
              />
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Fuel plan and claims" />
          <CardBody className="space-y-4">
            <Field label="Top up to (days)" hint="What the plan and each structure's “needs” count towards.">
              <Input type="number" min={1} max={365} value={form.plan_days} onChange={(e) => set({ plan_days: Number(e.target.value) })} className="w-32 font-mono" />
            </Field>
            <Field label="A refuel claim lasts (hours)" hint="It also ends by itself once the structure's fuel goes up.">
              <Input type="number" min={1} max={336} value={form.claim_hours} onChange={(e) => set({ claim_hours: Number(e.target.value) })} className="w-32 font-mono" />
            </Field>
          </CardBody>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader
            title="Who is warned"
            description="Members of any ticked group, but only about corporations whose structures they may see on the corporation sheet. Nothing ticked: everyone who may see them."
          />
          <CardBody>
            {form.group_options.length === 0 ? (
              <p className="text-sm text-muted">No groups yet.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {form.group_options.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => toggle(o.id)}
                    className={`border px-2 py-1 text-sm ${form.groups.includes(o.id) ? "border-accent bg-accent-soft text-accent-ink" : "border-border text-muted hover:text-text"}`}
                    aria-pressed={form.groups.includes(o.id)}
                  >
                    {o.name}
                  </button>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
        <div className="lg:col-span-2">
          <Button variant="primary" loading={save.isPending} disabled={!parsed} onClick={() => save.mutate(form)}>Save settings</Button>
        </div>
      </div>
    </>
  );
}
