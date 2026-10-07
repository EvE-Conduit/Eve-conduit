// SRP settings and payout rules (srp.manage_srp).
import {
  api, Badge, Button, Dialog, EmptyState, Field, Input, isk, SearchInput, Segmented, Skeleton, Switch, SwitchRow, TabPanel, Tabs, Textarea, toast,
} from "@conduit/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { LifeBuoy, Plus, Trash } from "./icons";
import { BASE, type FullSettings, type Rule } from "./types";

const KEY = ["srp", "settings"];

export function SettingsDialog({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: KEY, queryFn: () => api.get<FullSettings>(`${BASE}/settings`) });
  const [form, setForm] = useState<FullSettings | null>(null);
  const value = form ?? data ?? null;
  const save = useMutation({
    mutationFn: (s: FullSettings) => api.put<FullSettings>(`${BASE}/settings`, s),
    onSuccess: (s) => {
      qc.setQueryData(KEY, s);
      qc.invalidateQueries({ queryKey: ["srp"] });
      toast.success("Saved");
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const set = (patch: Partial<FullSettings>) => value && setForm({ ...value, ...patch });

  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title="SRP rules"
      description="What each ship pays out, and who can claim what. Changes apply to new requests."
      size="xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Close</Button>
          <Button variant="primary" disabled={!form} loading={save.isPending} onClick={() => form && save.mutate(form)}>Save settings</Button>
        </>
      }
    >
      {!value ? (
        <Skeleton className="h-64" />
      ) : (
        <Tabs
          className="space-y-4"
          items={[
            { value: "ships", label: "Ships", count: value.rules.length },
            { value: "general", label: "General" },
            { value: "corps", label: "Corporations" },
          ]}
          defaultValue="ships"
        >
          <TabPanel value="ships">
            <Rules rules={data?.rules ?? []} defaultPercent={value.default_percent} coveredOnly={value.covered_only} />
          </TabPanel>
          <TabPanel value="general">
            <div className="space-y-5">
              <Field label="Default payout (% of the loss's value)" hint="For ships without a rule of their own or for their group.">
                <div>
                  <Input type="number" min={0} max={1000} step={5} value={value.default_percent} onChange={(e) => set({ default_percent: Number(e.target.value) })} className="w-32 font-mono" />
                </div>
              </Field>
              <Field label="Claims allowed for (days)">
                <div>
                  <Input type="number" min={1} max={365} value={value.max_age_days} onChange={(e) => set({ max_age_days: Number(e.target.value) })} className="w-32 font-mono" />
                </div>
              </Field>
              <div className="divide-y divide-border border border-border px-3">
                <SwitchRow
                  label="Only ships with a rule"
                  description="Ships without a rule (for themselves or their group) can't be claimed."
                  checked={value.covered_only}
                  onCheckedChange={(v) => set({ covered_only: v })}
                />
                <SwitchRow
                  label="Ask for the fleet"
                  description="Members must name the fleet or op they lost the ship on."
                  checked={value.require_fleet}
                  onCheckedChange={(v) => set({ require_fleet: v })}
                />
              </div>
              <Field label="Rules shown to members" hint="Which fleets count, doctrine fits, when payouts go out…">
                <Textarea rows={4} value={value.rules_text} onChange={(e) => set({ rules_text: e.target.value })} placeholder="Strategic and CTA fleets only. Doctrine fits get the full payout. Payouts go out every Sunday." />
              </Field>
            </div>
          </TabPanel>
          <TabPanel value="corps">
            <p className="mb-3 text-xs text-muted">Whose losses can be claimed. None ticked means every corporation.</p>
            {value.available_corporations.length === 0 ? (
              <p className="text-sm text-subtle">No members yet.</p>
            ) : (
              <div className="divide-y divide-border border border-border">
                {value.available_corporations.map((c) => (
                  <label key={c.id} className="flex cursor-pointer items-center justify-between gap-3 px-3 py-2.5 text-sm">
                    <span>
                      {c.name} <span className="text-subtle">[{c.ticker}]</span>
                    </span>
                    <Switch
                      checked={value.corporations.includes(c.id)}
                      onCheckedChange={(on) => set({ corporations: on ? [...value.corporations, c.id] : value.corporations.filter((x) => x !== c.id) })}
                    />
                  </label>
                ))}
              </div>
            )}
          </TabPanel>
        </Tabs>
      )}
    </Dialog>
  );
}

type Mode = "fixed" | "percent" | "none";

function describe(r: Rule, defaultPercent: number) {
  if (!r.covered) return <Badge tone="danger">not covered</Badge>;
  if (r.payout != null) return <span className="font-mono tabular-nums">{isk(r.payout, { full: true })}</span>;
  return <span className="font-mono tabular-nums">{r.percent ?? defaultPercent}% of the loss</span>;
}

function Rules({ rules, defaultPercent, coveredOnly }: { rules: Rule[]; defaultPercent: number; coveredOnly: boolean }) {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState<{ kind: "ship" | "group"; id: number; name: string } | null>(null);
  const [mode, setMode] = useState<Mode>("fixed");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const { data: hits } = useQuery({
    queryKey: ["srp", "ships", q],
    queryFn: () => api.get<{ kind: "ship" | "group"; id: number; name: string; subtitle: string; icon: string | null }[]>(`${BASE}/ships?q=${encodeURIComponent(q)}`),
    enabled: q.trim().length >= 2 && !adding,
  });
  const refresh = () => qc.invalidateQueries({ queryKey: KEY });
  const add = useMutation({
    mutationFn: () =>
      api.post<Rule>(`${BASE}/rules`, {
        type_id: adding?.kind === "ship" ? adding.id : null,
        group_id: adding?.kind === "group" ? adding.id : null,
        covered: mode !== "none",
        payout: mode === "fixed" ? Number(amount) : null,
        percent: mode === "percent" ? Number(amount) : null,
        note,
      }),
    onSuccess: (r) => {
      toast.success(`Rule added for ${r.name}`);
      setAdding(null); setQ(""); setAmount(""); setNote("");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({ mutationFn: (id: number) => api.delete(`${BASE}/rules/${id}`), onSuccess: refresh, onError: (e: Error) => toast.error(e.message) });

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted">
        A ship's own rule wins over its group's. Anything else {coveredOnly ? "can't be claimed" : `pays ${defaultPercent}% of the loss`}.
      </p>

      <div className="border border-border p-3">
        {!adding ? (
          <div className="relative">
            <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Add a rule: search a ship or ship group (Scythe, Logistics…)" />
            {hits && hits.length > 0 && (
              <ul className="absolute inset-x-0 top-full z-10 mt-1 max-h-72 overflow-auto border border-border bg-surface shadow-e2">
                {hits.map((h) => (
                  <li key={`${h.kind}-${h.id}`}>
                    <button type="button" className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-hover" onClick={() => setAdding(h)}>
                      {h.icon ? <img src={h.icon} alt="" className="size-6" /> : <span className="grid size-6 place-items-center bg-accent-soft text-accent-ink"><LifeBuoy className="size-3.5" /></span>}
                      <span className="flex-1">{h.name}</span>
                      <span className="text-xs text-subtle">{h.subtitle}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-medium">
                {adding.name} <span className="text-subtle">{adding.kind === "group" ? "(every ship in the group)" : ""}</span>
              </div>
              <Button variant="ghost" size="xs" onClick={() => setAdding(null)}>Change</Button>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <Segmented<Mode>
                value={mode}
                onChange={setMode}
                options={[{ value: "fixed", label: "Fixed ISK" }, { value: "percent", label: "% of loss" }, { value: "none", label: "Not covered" }]}
                size="sm"
              />
              {mode !== "none" && (
                <Input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={mode === "fixed" ? "60000000" : "100"} className="w-40 font-mono" />
              )}
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional), e.g. doctrine fit only" className="min-w-48 flex-1" />
              <Button variant="primary" size="sm" disabled={mode !== "none" && !(Number(amount) >= 0 && amount !== "")} loading={add.isPending} onClick={() => add.mutate()}>
                <Plus /> Add
              </Button>
            </div>
          </div>
        )}
      </div>

      {rules.length === 0 ? (
        <EmptyState icon={<LifeBuoy />} title="No rules yet" description="Every ship pays the default rate until you add some." />
      ) : (
        <ul className="divide-y divide-border border border-border">
          {rules.map((r) => (
            <li key={r.id} className="flex items-center gap-3 px-3 py-2.5 text-sm">
              {r.icon ? <img src={r.icon} alt="" className="size-7" /> : <span className="grid size-7 place-items-center bg-accent-soft text-accent-ink"><LifeBuoy className="size-4" /></span>}
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{r.name}{r.kind === "group" && <span className="ml-2 text-xs font-normal text-subtle">group</span>}</div>
                {r.note && <div className="truncate text-xs text-subtle">{r.note}</div>}
              </div>
              <div className="text-right">{describe(r, defaultPercent)}</div>
              <Button variant="ghost" size="icon-xs" aria-label={`Remove the rule for ${r.name}`} onClick={() => remove.mutate(r.id)}><Trash /></Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
