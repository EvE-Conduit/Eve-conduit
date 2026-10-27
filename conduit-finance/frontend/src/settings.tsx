// finance.manage_finance: which corporations count, who gets the monthly report, ref type categories and
// counterparty tags.
import {
  api, Badge, Button, Card, CardBody, CardHeader, ConfirmDialog, Dialog, EmptyState, Field, Input, PageHeader, SearchInput, Segmented, Select,
  Skeleton, Switch, Table, Td, Th, THead, toast, Tr,
} from "@conduit/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { Pencil, Plus, Settings, Trash, X } from "./icons";
import { BASE, type Direction, type FinanceSettings, type PartyHit, type RefTypeRow, type Rule } from "./types";

const KEY = ["finance", "settings"];
const DIRECTIONS: { value: Direction; label: string }[] = [
  { value: "out", label: "Paid to them" },
  { value: "in", label: "From them" },
  { value: "both", label: "Both ways" },
];

function useInvalidate() {
  const qc = useQueryClient();
  // Categories change every page's figures.
  return () => qc.invalidateQueries({ queryKey: ["finance"] });
}

export function SettingsPage() {
  const { data, isLoading } = useQuery({ queryKey: KEY, queryFn: () => api.get<FinanceSettings>(`${BASE}/settings`) });
  return (
    <>
      <PageHeader
        eyebrow="Corp finance"
        title="Settings"
        icon={<Settings />}
        description="Changes here apply to every corporation's figures, so they need access to all of their wallets; a tag for one corporation needs only that one."
      />
      {isLoading || !data ? (
        <Skeleton className="h-64" />
      ) : (
        <div className="space-y-6">
          <ReportSettings data={data} />
          <Rules data={data} />
          <RefTypes data={data} />
        </div>
      )}
    </>
  );
}

function ReportSettings({ data }: { data: FinanceSettings }) {
  const qc = useQueryClient();
  const invalidate = useInvalidate();
  const [corps, setCorps] = useState(data.corporations);
  const [group, setGroup] = useState(data.report_group ? String(data.report_group) : "");
  const save = useMutation({
    mutationFn: () => api.put<FinanceSettings>(`${BASE}/settings`, { corporations: corps, report_group: group ? Number(group) : null }),
    onSuccess: (d) => {
      qc.setQueryData(KEY, d);
      invalidate();
      toast.success("Saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Card>
      <CardHeader title="Corporations and the monthly report" />
      <CardBody className="grid gap-6 lg:grid-cols-2">
        <Field label="Corporations that count" hint="None picked means every corporation with synced wallets. Their transfers with each other are internal.">
          {data.available_corporations.length === 0 ? (
            <p className="text-sm text-subtle">No corporation has synced its wallets yet.</p>
          ) : (
            <div className="divide-y divide-border rounded-lg border border-border">
              {data.available_corporations.map((c) => (
                <label key={c.id} className="flex cursor-pointer items-center justify-between gap-3 px-3 py-2.5 text-sm">
                  <span>{c.name} <span className="text-subtle">[{c.ticker}]</span></span>
                  <Switch checked={corps.includes(c.id)} onCheckedChange={(on) => setCorps(on ? [...corps, c.id] : corps.filter((x) => x !== c.id))} />
                </label>
              ))}
            </div>
          )}
        </Field>
        <div className="space-y-4">
          <Field
            label="Tell this group when a month's report is ready"
            hint="Once a month ends and the wallets have synced past it. Only members with finance.view_finance are told, about the corporations they may see. The finance.month_closed webhook event goes out either way."
          >
            <Select
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              options={[{ value: "", label: "Nobody" }, ...data.group_options.map((g) => ({ value: String(g.id), label: g.name }))]}
            />
          </Field>
          <Button variant="primary" loading={save.isPending} onClick={() => save.mutate()}>Save</Button>
        </div>
      </CardBody>
    </Card>
  );
}

function Rules({ data }: { data: FinanceSettings }) {
  const invalidate = useInvalidate();
  const [editing, setEditing] = useState<Rule | "new" | null>(null);
  const [deleting, setDeleting] = useState<Rule | null>(null);
  const corpName = (id: number | null) => (id ? (data.available_corporations.find((c) => c.id === id)?.name ?? `#${id}`) : "Every corporation");
  return (
    <Card>
      <CardHeader
        title="Counterparty tags"
        description='Money to or from someone goes in a category, whatever its ref type: "paid to SRP Holder = SRP payouts", "from Buyback Corp = Buyback".'
        actions={<Button size="sm" onClick={() => setEditing("new")}><Plus /> Add tag</Button>}
      />
      {data.rules.length === 0 ? (
        <EmptyState icon={<Settings />} title="No tags yet" />
      ) : (
        <Table>
          <THead>
            <tr>
              <Th>Who</Th>
              <Th>Money</Th>
              <Th>Category</Th>
              <Th>In</Th>
              <Th />
            </tr>
          </THead>
          <tbody>
            {data.rules.map((r) => (
              <Tr key={r.id}>
                <Td>
                  <div className="font-medium">{r.party_name}</div>
                  {r.note && <div className="text-xs text-subtle">{r.note}</div>}
                </Td>
                <Td>{DIRECTIONS.find((d) => d.value === r.direction)?.label}</Td>
                <Td><Badge tone="accent">{r.category}</Badge></Td>
                <Td className="text-muted">{corpName(r.corporation_id)}</Td>
                <Td align="right">
                  <div className="flex justify-end gap-1">
                    <Button size="icon-sm" variant="ghost" onClick={() => setEditing(r)} aria-label="Edit"><Pencil /></Button>
                    <Button size="icon-sm" variant="ghost" onClick={() => setDeleting(r)} aria-label="Remove"><Trash /></Button>
                  </div>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
      {editing && <RuleDialog rule={editing === "new" ? null : editing} data={data} onClose={() => setEditing(null)} />}
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Remove the tag for ${deleting?.party_name ?? ""}?`}
        description="Their entries go back to the category of their ref type."
        danger
        confirmLabel="Remove"
        onConfirm={async () => {
          try {
            await api.delete(`${BASE}/rules/${deleting!.id}`);
            invalidate();
          } catch (e) {
            toast.error((e as Error).message);
          }
        }}
      />
    </Card>
  );
}

function RuleDialog({ rule, data, onClose }: { rule: Rule | null; data: FinanceSettings; onClose: () => void }) {
  const invalidate = useInvalidate();
  const [party, setParty] = useState<{ id: number; name: string } | null>(rule ? { id: rule.party_id, name: rule.party_name } : null);
  const [q, setQ] = useState("");
  const [direction, setDirection] = useState<Direction>(rule?.direction ?? "out");
  const [category, setCategory] = useState(rule?.category ?? "");
  const [corp, setCorp] = useState(rule?.corporation_id ? String(rule.corporation_id) : "");
  const [note, setNote] = useState(rule?.note ?? "");
  const search = q.trim();
  const { data: hits } = useQuery({
    queryKey: ["finance", "parties", search],
    queryFn: () => api.get<PartyHit[]>(`${BASE}/parties?q=${encodeURIComponent(search)}`),
    enabled: search.length >= 3 || /^\d+$/.test(search),
  });
  const save = useMutation({
    mutationFn: () => {
      const body = { party_id: party?.id, party_name: party?.name, direction, category, corporation_id: corp ? Number(corp) : null, note };
      return rule ? api.put(`${BASE}/rules/${rule.id}`, body) : api.post(`${BASE}/rules`, body);
    },
    onSuccess: () => {
      invalidate();
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={rule ? "Edit tag" : "Tag a counterparty"}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={save.isPending} disabled={!party || !category.trim()} onClick={() => save.mutate()}>Save</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Who" hint="A character, corporation or alliance from the wallet journals, by name or id.">
          {party ? (
            <div className="flex items-center justify-between rounded-control border border-border px-3 py-2 text-sm">
              <span className="font-medium">{party.name}</span>
              <Button size="icon-sm" variant="ghost" onClick={() => setParty(null)} aria-label="Pick someone else"><X /></Button>
            </div>
          ) : (
            <div className="relative">
              <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name or id" autoFocus />
              {hits && search && (
                <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto border border-border-strong bg-surface-raised shadow-e3">
                  {hits.length === 0 && <li className="px-3 py-2 text-sm text-subtle">Nobody found</li>}
                  {hits.map((h) => (
                    <li key={h.id}>
                      <button type="button" className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-hover" onClick={() => { setParty(h); setQ(""); }}>
                        <span className="truncate font-medium">{h.name}</span>
                        <span className="text-xs text-subtle">{h.category}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </Field>
        <Field label="Money">
          <Segmented value={direction} onChange={setDirection} options={DIRECTIONS} aria-label="Direction" size="sm" />
        </Field>
        <Field label="Category" hint="Pick one or type a new one, like SRP payouts.">
          <Input value={category} onChange={(e) => setCategory(e.target.value)} list="finance-categories" maxLength={60} />
          <datalist id="finance-categories">{data.categories.map((c) => <option key={c} value={c} />)}</datalist>
        </Field>
        <Field label="In the wallets of">
          <Select
            value={corp}
            onChange={(e) => setCorp(e.target.value)}
            options={[{ value: "", label: "Every corporation" }, ...data.available_corporations.map((c) => ({ value: String(c.id), label: c.name }))]}
          />
        </Field>
        <Field label="Note">
          <Input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} />
        </Field>
      </div>
    </Dialog>
  );
}

function RefTypes({ data }: { data: FinanceSettings }) {
  const [all, setAll] = useState(false);
  const [q, setQ] = useState("");
  const rows = data.ref_types.filter((r) => (all || r.seen || r.override) && (!q || r.ref_type.includes(q.toLowerCase().replace(/ /g, "_"))));
  return (
    <Card>
      <CardHeader
        title="Ref type categories"
        description={`Which category each kind of journal entry counts under. ${data.internal_label} are found by themselves: moves between a corporation's divisions, and donations and withdrawals between your corporations.`}
        actions={
          <label className="flex items-center gap-2 text-sm text-muted">
            <Switch checked={all} onCheckedChange={setAll} /> Show ones not in your journals
          </label>
        }
      />
      <div className="px-card pb-3">
        <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a ref type" className="max-w-xs" />
      </div>
      <Table>
        <THead>
          <tr>
            <Th>Ref type</Th>
            <Th>Built in</Th>
            <Th>Counts as</Th>
          </tr>
        </THead>
        <tbody>
          {rows.map((r) => <RefTypeItem key={r.ref_type} row={r} />)}
        </tbody>
      </Table>
      <datalist id="finance-categories-all">{data.categories.map((c) => <option key={c} value={c} />)}</datalist>
    </Card>
  );
}

function RefTypeItem({ row }: { row: RefTypeRow }) {
  const invalidate = useInvalidate();
  const current = row.override ?? row.default;
  const [value, setValue] = useState(current);
  const save = useMutation({
    mutationFn: (category: string) => api.put(`${BASE}/categories/${encodeURIComponent(row.ref_type)}`, { category }),
    onSuccess: () => invalidate(),
    onError: (e: Error) => {
      toast.error(e.message);
      setValue(current);
    },
  });
  const dirty = value.trim() !== current;
  return (
    <Tr>
      <Td>
        <div className="font-medium">{row.label}</div>
        <div className="font-mono text-xs text-subtle">{row.ref_type}</div>
      </Td>
      <Td className="text-muted">{row.default}</Td>
      <Td>
        <div className="flex items-center gap-2">
          <Input value={value} onChange={(e) => setValue(e.target.value)} list="finance-categories-all" className="w-56" maxLength={60}
                 onKeyDown={(e) => e.key === "Enter" && dirty && save.mutate(value.trim())} />
          {dirty && <Button size="sm" loading={save.isPending} onClick={() => save.mutate(value.trim())}>Save</Button>}
          {row.override && !dirty && (
            <Button size="sm" variant="ghost" loading={save.isPending} onClick={() => { setValue(row.default); save.mutate(""); }}>Reset</Button>
          )}
        </div>
      </Td>
    </Tr>
  );
}
