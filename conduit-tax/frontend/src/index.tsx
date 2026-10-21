import {
  Alert, api, Avatar, Badge, BarChart, Button, Card, CardBody, CardHeader, ConfirmDialog, date, definePlugin, Dialog, EmptyState,
  Field, Input, isk, PageHeader, Select, Skeleton, StatCard, Switch, TabPanel, Table, Tabs, Td, Textarea, Th, THead, toast, Tr,
  useHasPerm,
} from "@conduit/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Fragment, useState } from "react";
import { Link } from "react-router";

import { Chevron, Coins, Download, Landmark, Lock, Refresh, Settings, Unlock, User } from "./icons";

// --- data -------------------------------------------------------------------------------------------------

interface Invoice {
  id: number;
  month: string;
  label: string;
  collected: number;
  amount: number;
  paid: boolean;
  paid_at: string | null;
  paid_from_wallet: boolean;
  reference: string;
}

interface Member {
  key: string;
  user_id: number | null;
  name: string;
  portrait: string;
  registered: boolean;
  characters: { id: number; name: string; collected: number; earned: number; kinds: Record<string, number> }[];
  collected: number;
  earned: number;
  tax: number;
  invoice: Invoice | null;
}

interface Ledger {
  month: string;
  label: string;
  closed: boolean;
  closed_at: string | null;
  can_close: boolean;
  rate: number;
  minimum: number;
  totals: { collected: number; earned: number; tax: number; paid: number; members: number; unregistered_collected: number };
  series: { date: string; value: number }[];
  members: Member[];
  kinds: { ref_type: string; label: string; collected: number }[];
}

interface Months {
  current: string;
  months: { month: string; label: string; closed: boolean }[];
}

interface Me {
  ledger: Ledger;
  invoices: Invoice[];
  outstanding: number;
  rate: number;
  payment_instructions: string;
  payment_reason: string;
}

interface TaxSettings {
  rate: number;
  minimum: number;
  corporations: number[];
  ref_types: string[];
  payment_instructions: string;
  payment_reason: string;
  reminder_days: number;
  available_corporations: { id: number; name: string; ticker: string }[];
  available_ref_types: { value: string; label: string }[];
}

const BASE = "/api/p/tax";

function useMonths() {
  return useQuery({ queryKey: ["tax", "months"], queryFn: () => api.get<Months>(`${BASE}/months`) });
}

function MonthPicker({ value, onChange }: { value: string; onChange: (m: string) => void }) {
  const { data } = useMonths();
  const options = (data?.months ?? [{ month: value, label: value, closed: false }]).map((m) => ({
    value: m.month,
    label: `${m.label}${m.closed ? " · closed" : m.month === data?.current ? " · so far" : ""}`,
  }));
  return <Select value={value} onChange={(e) => onChange(e.target.value)} options={options} aria-label="Month" className="w-56" />;
}

function useMonthState() {
  const { data } = useMonths();
  const [month, setMonth] = useState<string | null>(null);
  return [month ?? data?.current ?? "", setMonth] as const;
}

// --- full ledger (tax.view_ledger) ----------------------------------------------------------------------------

function LedgerPage() {
  const qc = useQueryClient();
  const canManage = useHasPerm("tax.manage_ledger");
  const [month, setMonth] = useMonthState();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirm, setConfirm] = useState<"close" | "reopen" | null>(null);
  const key = ["tax", "ledger", month];
  const { data, isLoading } = useQuery({ queryKey: key, queryFn: () => api.get<Ledger>(`${BASE}/ledger?month=${month}`), enabled: !!month });

  const refresh = (d: Ledger) => {
    qc.setQueryData(key, d);
    qc.invalidateQueries({ queryKey: ["tax", "months"] });
  };
  const close = useMutation({ mutationFn: () => api.post<Ledger>(`${BASE}/months/${month}/close`), onSuccess: (d) => { refresh(d); toast.success(`${d.label} closed; members have been told what they owe`); }, onError: (e: Error) => toast.error(e.message) });
  const reopen = useMutation({ mutationFn: () => api.post<Ledger>(`${BASE}/months/${month}/reopen`), onSuccess: (d) => { refresh(d); toast.success(`${d.label} reopened`); }, onError: (e: Error) => toast.error(e.message) });
  const paid = useMutation({
    mutationFn: ({ id, paid }: { id: number; paid: boolean }) => api.post<Invoice>(`${BASE}/invoices/${id}`, { paid }),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    onError: (e: Error) => toast.error(e.message),
  });
  const match = useMutation({
    mutationFn: () => api.post<{ found: number }>(`${BASE}/payments/match`),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["tax"] });
      toast.success(r.found ? `Found payments from ${r.found} member${r.found === 1 ? "" : "s"}` : "No new payments");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader
        eyebrow="Corp tax"
        title="Ledger"
        icon={<Landmark />}
        description="The tax your corporations took from each member's bounties, ESS payouts and missions, and what they owe on top."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <MonthPicker value={month} onChange={setMonth} />
            <Link to="/p/tax/me">
              <Button variant="ghost">
                <User /> Mine
              </Button>
            </Link>
            <a href={`${BASE}/ledger.csv?month=${month}`} download>
              <Button variant="ghost">
                <Download /> CSV
              </Button>
            </a>
            {canManage && (
              <Button variant="ghost" loading={match.isPending} onClick={() => match.mutate()}>
                <Refresh /> Check payments
              </Button>
            )}
            {canManage && (
              <Button onClick={() => setSettingsOpen(true)}>
                <Settings /> Settings
              </Button>
            )}
          </div>
        }
      />

      {isLoading || !data ? (
        <div className="grid gap-4 sm:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}</div>
      ) : (
        <div className="space-y-6">
          <MonthStatus data={data} canManage={canManage} onClose={() => setConfirm("close")} onReopen={() => setConfirm("reopen")} />

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Corporation took"
              value={isk(data.totals.collected)}
              mono
              hint={data.totals.earned > 0 ? `of ≈ ${isk(data.totals.earned)} earned` : "in-game tax"}
            />
            <StatCard label={`Owed · ${data.rate}%`} value={isk(data.totals.tax)} mono hint={`${data.totals.members} member${data.totals.members === 1 ? "" : "s"}`} />
            <StatCard
              label="Paid"
              value={data.closed ? isk(data.totals.paid) : "—"}
              mono
              tone={data.closed && data.totals.paid >= data.totals.tax ? "success" : undefined}
              hint={data.closed ? `${Math.round((data.totals.paid / Math.max(data.totals.tax, 1)) * 100)}% of what's owed` : "once the month is closed"}
            />
            <StatCard
              label="Unregistered characters"
              value={isk(data.totals.unregistered_collected)}
              mono
              tone={data.totals.unregistered_collected > 0 ? "warning" : undefined}
              hint="taxed from characters nobody registered"
            />
          </div>

          <Card>
            <CardHeader title="Tax per day" description={`What the corporations took each day in ${data.label}`} />
            <CardBody>
              {data.series.some((p) => p.value > 0) ? <BarChart data={data.series} format={(n) => isk(n)} label="Tax" /> : <p className="text-sm text-muted">No tax yet this month.</p>}
            </CardBody>
          </Card>

          <Tabs
            variant="pills"
            className="space-y-4"
            items={[
              { value: "members", label: "Members", count: data.members.length },
              { value: "kinds", label: "By kind", count: data.kinds.length },
            ]}
          >
            <TabPanel value="members">
              <MembersTable data={data} canManage={canManage} onPaid={(id, p) => paid.mutate({ id, paid: p })} />
            </TabPanel>
            <TabPanel value="kinds">
              <Card>
                {data.kinds.length === 0 ? (
                  <EmptyState icon={<Landmark />} title="No tax this month" />
                ) : (
                  <Table>
                    <THead>
                      <tr>
                        <Th>Kind</Th>
                        <Th align="right">Corporation took</Th>
                      </tr>
                    </THead>
                    <tbody>
                      {data.kinds.map((k) => (
                        <Tr key={k.ref_type}>
                          <Td>{k.label}</Td>
                          <Td numeric>{isk(k.collected)}</Td>
                        </Tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Card>
            </TabPanel>
          </Tabs>
        </div>
      )}

      {settingsOpen && <SettingsDialog onClose={() => setSettingsOpen(false)} />}
      <ConfirmDialog
        open={confirm === "close"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={`Close ${data?.label ?? "this month"}?`}
        description={`The ${data?.rate ?? ""}% rate is fixed as it is now, and each member is told what they owe. You can reopen it while nobody has paid.`}
        confirmLabel={<><Lock /> Close month</>}
        onConfirm={() => close.mutateAsync()}
      />
      <ConfirmDialog
        open={confirm === "reopen"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={`Reopen ${data?.label ?? "this month"}?`}
        description="What members owe for the month is deleted until you close it again."
        danger
        confirmLabel={<><Unlock /> Reopen</>}
        onConfirm={() => reopen.mutateAsync()}
      />
    </>
  );
}

function MonthStatus({ data, canManage, onClose, onReopen }: { data: Ledger; canManage: boolean; onClose: () => void; onReopen: () => void }) {
  if (data.closed) {
    return (
      <Alert
        tone="success"
        title={`${data.label} is closed`}
        action={canManage ? <Button size="sm" variant="ghost" onClick={onReopen}><Unlock /> Reopen</Button> : undefined}
      >
        Closed {data.closed_at ? date(data.closed_at) : ""} at {data.rate}%.
      </Alert>
    );
  }
  if (data.can_close) {
    return (
      <Alert tone="warning" title={`${data.label} is over and still open`} action={canManage ? <Button size="sm" variant="primary" onClick={onClose}><Lock /> Close month</Button> : undefined}>
        Closing it fixes the rate and tells members what they owe.
      </Alert>
    );
  }
  return (
    <Alert tone="info" title={`${data.label} so far`}>
      Once the month is over it can be closed and members are told what they owe.
    </Alert>
  );
}

function MembersTable({ data, canManage, onPaid }: { data: Ledger; canManage: boolean; onPaid: (id: number, paid: boolean) => void }) {
  const [open, setOpen] = useState<Set<string>>(new Set());
  const toggle = (k: string) => setOpen((s) => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); return n; });
  if (data.members.length === 0) {
    return (
      <Card>
        <EmptyState icon={<Landmark />} title={`No tax in ${data.label}`} description="Tax shows up once a director or accountant's login has synced the corporation's wallets." />
      </Card>
    );
  }
  return (
    <Card>
      <Table>
        <THead>
          <tr>
            <Th>Member</Th>
            <Th align="right">Earned (est.)</Th>
            <Th align="right">Corporation took</Th>
            <Th align="right">Owed</Th>
            <Th align="right">{data.closed ? "Paid" : ""}</Th>
          </tr>
        </THead>
        <tbody>
          {data.members.map((m) => (
            <Fragment key={m.key}>
              <Tr interactive onClick={() => toggle(m.key)}>
                <Td>
                  <div className="flex items-center gap-3">
                    <Chevron open={open.has(m.key)} className="size-4 text-subtle" />
                    <Avatar src={m.portrait} name={m.name} size="sm" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium">{m.name}</span>
                        {!m.registered && <Badge tone="warning">not registered</Badge>}
                      </div>
                      <div className="text-xs text-subtle">{m.characters.length} character{m.characters.length === 1 ? "" : "s"}</div>
                    </div>
                  </div>
                </Td>
                <Td numeric className="text-muted">{m.earned > 0 ? isk(m.earned) : "—"}</Td>
                <Td numeric>{isk(m.collected)}</Td>
                <Td numeric className={m.registered ? "" : "text-subtle"}>{m.registered ? isk(m.tax) : "—"}</Td>
                <Td align="right" onClick={(e) => e.stopPropagation()}>
                  {m.invoice ? (
                    canManage ? (
                      <label className="inline-flex items-center gap-2 text-xs text-muted">
                        {m.invoice.paid ? (m.invoice.paid_from_wallet ? "Paid (wallet)" : "Paid") : "Unpaid"}
                        <Switch checked={m.invoice.paid} onCheckedChange={(p) => onPaid(m.invoice!.id, p)} aria-label={`${m.name} has paid`} />
                      </label>
                    ) : (
                      <Badge tone={m.invoice.paid ? "success" : "warning"}>{m.invoice.paid ? "Paid" : "Unpaid"}</Badge>
                    )
                  ) : null}
                </Td>
              </Tr>
              {open.has(m.key) &&
                m.characters.map((c) => (
                  <Tr key={`${m.key}-${c.id}`} className="bg-bg/40">
                    <Td className="pl-16 text-muted">{c.name}</Td>
                    <Td numeric className="text-muted">{c.earned > 0 ? isk(c.earned) : "—"}</Td>
                    <Td numeric className="text-muted">{isk(c.collected)}</Td>
                    <Td />
                    <Td />
                  </Tr>
                ))}
            </Fragment>
          ))}
        </tbody>
      </Table>
    </Card>
  );
}

function SettingsDialog({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["tax", "settings"], queryFn: () => api.get<TaxSettings>(`${BASE}/settings`) });
  const [form, setForm] = useState<TaxSettings | null>(null);
  const value = form ?? data ?? null;
  const save = useMutation({
    mutationFn: (s: TaxSettings) => api.put<TaxSettings>(`${BASE}/settings`, s),
    onSuccess: (s) => {
      qc.setQueryData(["tax", "settings"], s);
      qc.invalidateQueries({ queryKey: ["tax"] });
      toast.success("Saved");
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const set = (patch: Partial<TaxSettings>) => value && setForm({ ...value, ...patch });
  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title="Corp tax settings"
      description="Apply to open months. Closed months keep the rate they were closed with."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!value} loading={save.isPending} onClick={() => value && save.mutate(value)}>Save</Button>
        </>
      }
    >
      {!value ? (
        <Skeleton className="h-40" />
      ) : (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Extra tax (% of what the corporation took)" hint="100 means members pay the same again. 0 keeps the ledger without billing.">
              <div>
                <Input type="number" min={0} max={1000} step={5} value={value.rate} onChange={(e) => set({ rate: Number(e.target.value) })} className="w-32 font-mono" />
              </div>
            </Field>
            <Field label="Smallest bill (ISK)" hint="Smaller amounts aren't billed.">
              <div>
                <Input type="number" min={0} step={1000000} value={value.minimum} onChange={(e) => set({ minimum: Number(e.target.value) })} className="w-44 font-mono" />
              </div>
            </Field>
          </div>
          <Field label="How to pay" hint="Shown to members with what they owe, and sent with the monthly notification.">
            <Textarea rows={3} value={value.payment_instructions} placeholder="Give the ISK to Holding Corp with the reason on your bill." onChange={(e) => set({ payment_instructions: e.target.value })} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Payment word" hint="Donations to a tax corporation whose reason contains this settle bills by themselves. Empty switches it off.">
              <div>
                <Input value={value.payment_reason} maxLength={40} onChange={(e) => set({ payment_reason: e.target.value })} className="w-40 font-mono" />
              </div>
            </Field>
            <Field label="Remind every (days)" hint="Members with unpaid bills are reminded this often. 0 never.">
              <div>
                <Input type="number" min={0} max={365} value={value.reminder_days} onChange={(e) => set({ reminder_days: Number(e.target.value) })} className="w-32 font-mono" />
              </div>
            </Field>
          </div>
          <div>
            <div className="mb-1 text-[13px] font-medium">What counts</div>
            <div className="divide-y divide-border rounded-lg border border-border">
              {value.available_ref_types.map((k) => (
                <label key={k.value} className="flex cursor-pointer items-center justify-between gap-3 px-3 py-2.5 text-sm">
                  <span>{k.label}</span>
                  <Switch
                    checked={value.ref_types.includes(k.value)}
                    onCheckedChange={(on) => set({ ref_types: on ? [...value.ref_types, k.value] : value.ref_types.filter((x) => x !== k.value) })}
                  />
                </label>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-1 text-[13px] font-medium">Corporations</div>
            <p className="mb-3 text-xs text-muted">Whose wallets count. None ticked means all of them.</p>
            {value.available_corporations.length === 0 ? (
              <p className="text-sm text-subtle">No corporation has synced its wallets yet.</p>
            ) : (
              <div className="divide-y divide-border rounded-lg border border-border">
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
          </div>
        </div>
      )}
    </Dialog>
  );
}

// --- a member's own tax -----------------------------------------------------------------------------------------

function useMe(month: string) {
  return useQuery({ queryKey: ["tax", "me", month], queryFn: () => api.get<Me>(`${BASE}/me?month=${month}`), enabled: month !== undefined });
}

function MyTaxPage() {
  const canView = useHasPerm("tax.view_ledger");
  const [month, setMonth] = useMonthState();
  const { data, isLoading } = useMe(month);
  const me = data?.ledger.members[0];
  const unpaid = data?.invoices.filter((i) => !i.paid) ?? [];
  return (
    <>
      <PageHeader
        eyebrow="Corp tax"
        title="My tax"
        icon={<Landmark />}
        description="The tax your corporation took from your characters' bounties, ESS payouts and missions, and what you owe on top."
        actions={
          <div className="flex items-center gap-2">
            <MonthPicker value={month} onChange={setMonth} />
            {canView && (
              <Link to="/p/tax">
                <Button variant="ghost">Full ledger</Button>
              </Link>
            )}
          </div>
        }
      />
      {isLoading || !data ? (
        <Skeleton className="h-48" />
      ) : (
        <div className="space-y-6">
          {data.outstanding > 0 && (
            <Alert tone="warning" icon={<Coins />} title={`You owe ${isk(data.outstanding, { full: true })} in corp tax`}>
              {data.payment_instructions || "Ask your corporation's leadership how to pay."}
              {data.payment_reason && unpaid.length > 0 && (
                <> Put <span className="font-mono">{unpaid.map((i) => i.reference).join(", ")}</span> in the reason and it's marked paid by itself within a day.</>
              )}
            </Alert>
          )}
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label={`Corporation took in ${data.ledger.label}`} value={isk(me?.collected ?? 0)} mono hint={me && me.earned > 0 ? `of ≈ ${isk(me.earned)} earned` : "in-game tax"} />
            <StatCard
              label={`Owed · ${data.ledger.rate}%`}
              value={isk(me?.tax ?? 0)}
              mono
              hint={data.ledger.closed ? (me?.invoice?.paid ? "paid" : me?.invoice ? "not paid yet" : "nothing owed") : "estimate until the month is closed"}
              tone={me?.invoice && !me.invoice.paid ? "warning" : undefined}
            />
            <StatCard label="Characters" value={me?.characters.length ?? 0} hint="taxed this month" />
          </div>
          <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
            <Card>
              <CardHeader title="By character" />
              {!me ? (
                <EmptyState icon={<Landmark />} title={`No tax in ${data.ledger.label}`} />
              ) : (
                <Table>
                  <THead>
                    <tr>
                      <Th>Character</Th>
                      <Th align="right">Earned (est.)</Th>
                      <Th align="right">Corporation took</Th>
                    </tr>
                  </THead>
                  <tbody>
                    {me.characters.map((c) => (
                      <Tr key={c.id}>
                        <Td>{c.name}</Td>
                        <Td numeric className="text-muted">{c.earned > 0 ? isk(c.earned) : "—"}</Td>
                        <Td numeric>{isk(c.collected)}</Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card>
            <Card className="h-fit">
              <CardHeader title="Bills" />
              {data.invoices.length === 0 ? (
                <CardBody className="text-sm text-muted">Nothing billed yet.</CardBody>
              ) : (
                <ul className="divide-y divide-border">
                  {data.invoices.map((i) => (
                    <li key={i.id} className="flex items-center justify-between gap-3 px-card py-3 text-sm">
                      <span>{i.label}</span>
                      <span className="flex items-center gap-3">
                        <span className="font-mono tabular-nums">{isk(i.amount)}</span>
                        <Badge tone={i.paid ? "success" : "warning"}>{i.paid ? "Paid" : "Unpaid"}</Badge>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      )}
    </>
  );
}

function HomePage() {
  return useHasPerm("tax.view_ledger") ? <LedgerPage /> : <MyTaxPage />;
}

// --- dashboard widget ------------------------------------------------------------------------------------------

function TaxWidget() {
  const { data, isLoading } = useMe("");
  if (isLoading) return <Skeleton className="h-16" />;
  if (!data) return null;
  const me = data.ledger.members[0];
  return (
    <Link to="/p/tax/me" className="block">
      <div className="flex items-end justify-between gap-6">
        <div>
          <div className="text-xs text-muted">Corp tax in {data.ledger.label}</div>
          <div className="mt-1 font-mono text-2xl font-semibold tabular-nums">{isk(me?.collected ?? 0)}</div>
          <div className="text-xs text-subtle">≈ {isk(me?.tax ?? 0)} owed at {data.ledger.rate}%</div>
        </div>
        {data.outstanding > 0 ? <Badge tone="warning">{isk(data.outstanding)} owed</Badge> : <Badge tone="success">All paid</Badge>}
      </div>
    </Link>
  );
}

export default definePlugin({
  routes: [
    { path: "", Component: HomePage },
    { path: "me", Component: MyTaxPage },
  ],
  widgets: [{ id: "my-tax", title: "Corp tax", Component: TaxWidget, size: "sm", order: 45 }],
});
