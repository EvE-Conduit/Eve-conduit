import {
  Alert, api, Avatar, Badge, BarChart, Button, Card, CardBody, CardHeader, ConfirmDialog, date, definePlugin, Dialog, EmptyState,
  Field, Input, isk, num, PageHeader, Select, Skeleton, StatCard, Switch, TabPanel, Table, Tabs, Td, Textarea, Th, THead, toast, Tr,
  useHasPerm,
} from "@conduit/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Fragment, useState } from "react";
import { Link } from "react-router";

import { Chevron, Coins, Download, Lock, Pickaxe, Settings, Unlock, User } from "./icons";

// --- data -------------------------------------------------------------------------------------------------

interface Invoice {
  id: number;
  month: string;
  label: string;
  value: number;
  amount: number;
  paid: boolean;
  paid_at: string | null;
}

interface Member {
  key: string;
  user_id: number | null;
  name: string;
  portrait: string;
  registered: boolean;
  characters: { id: number; name: string; value: number; quantity: number }[];
  value: number;
  quantity: number;
  tax: number;
  invoice: Invoice | null;
}

interface Ledger {
  month: string;
  label: string;
  closed: boolean;
  closed_at: string | null;
  can_close: boolean;
  tax_rate: number;
  totals: { value: number; quantity: number; tax: number; paid: number; members: number; unregistered_value: number };
  series: { date: string; value: number }[];
  members: Member[];
  moons: { observer_id: number; name: string; moon: string; value: number; quantity: number; miners: number }[];
  ores: { type_id: number; name: string; icon: string; price: number; value: number; quantity: number }[];
}

interface Months {
  current: string;
  months: { month: string; label: string; closed: boolean }[];
}

interface Me {
  ledger: Ledger;
  invoices: Invoice[];
  outstanding: number;
  tax_rate: number;
  payment_instructions: string;
}

interface MoonSettings {
  tax_rate: number;
  corporations: number[];
  payment_instructions: string;
  available_corporations: { id: number; name: string; ticker: string }[];
}

const BASE = "/api/p/moons";

function useMonths() {
  return useQuery({ queryKey: ["moons", "months"], queryFn: () => api.get<Months>(`${BASE}/months`) });
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

// --- full ledger (moons.view_ledger) --------------------------------------------------------------------------

function LedgerPage() {
  const qc = useQueryClient();
  const canManage = useHasPerm("moons.manage_ledger");
  const [month, setMonth] = useMonthState();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirm, setConfirm] = useState<"close" | "reopen" | null>(null);
  const key = ["moons", "ledger", month];
  const { data, isLoading } = useQuery({ queryKey: key, queryFn: () => api.get<Ledger>(`${BASE}/ledger?month=${month}`), enabled: !!month });

  const refresh = (d: Ledger) => {
    qc.setQueryData(key, d);
    qc.invalidateQueries({ queryKey: ["moons", "months"] });
  };
  const close = useMutation({ mutationFn: () => api.post<Ledger>(`${BASE}/months/${month}/close`), onSuccess: (d) => { refresh(d); toast.success(`${d.label} closed; members have been told what they owe`); }, onError: (e: Error) => toast.error(e.message) });
  const reopen = useMutation({ mutationFn: () => api.post<Ledger>(`${BASE}/months/${month}/reopen`), onSuccess: (d) => { refresh(d); toast.success(`${d.label} reopened`); }, onError: (e: Error) => toast.error(e.message) });
  const paid = useMutation({
    mutationFn: ({ id, paid }: { id: number; paid: boolean }) => api.post<Invoice>(`${BASE}/invoices/${id}`, { paid }),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader
        eyebrow="Moon mining"
        title="Ledger"
        icon={<Pickaxe />}
        description="Who mined what from your moons, what it's worth and the moon tax each member owes."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <MonthPicker value={month} onChange={setMonth} />
            <Link to="/p/moons/me">
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
            <StatCard label="Mined" value={isk(data.totals.value)} mono hint={`${num(data.totals.quantity)} units of ore`} />
            <StatCard label={`Moon tax · ${data.tax_rate}%`} value={isk(data.totals.tax)} mono hint={`${data.totals.members} member${data.totals.members === 1 ? "" : "s"}`} />
            <StatCard
              label="Paid"
              value={data.closed ? isk(data.totals.paid) : "—"}
              mono
              tone={data.closed && data.totals.paid >= data.totals.tax ? "success" : undefined}
              hint={data.closed ? `${Math.round((data.totals.paid / Math.max(data.totals.tax, 1)) * 100)}% of the tax` : "once the month is closed"}
            />
            <StatCard
              label="Unregistered miners"
              value={isk(data.totals.unregistered_value)}
              mono
              tone={data.totals.unregistered_value > 0 ? "warning" : undefined}
              hint="by characters nobody registered"
            />
          </div>

          <Card>
            <CardHeader title="Mined per day" description={`Value of the ore mined each day in ${data.label}`} />
            <CardBody>
              {data.series.some((p) => p.value > 0) ? <BarChart data={data.series} format={(n) => isk(n)} label="Mined" /> : <p className="text-sm text-muted">Nothing mined yet this month.</p>}
            </CardBody>
          </Card>

          <Tabs
            variant="pills"
            className="space-y-4"
            items={[
              { value: "members", label: "Members", count: data.members.length },
              { value: "moons", label: "Moons", count: data.moons.length },
              { value: "ores", label: "Ores", count: data.ores.length },
            ]}
          >
            <TabPanel value="members">
              <MembersTable data={data} canManage={canManage} onPaid={(id, p) => paid.mutate({ id, paid: p })} />
            </TabPanel>
            <TabPanel value="moons">
              <Card>
                {data.moons.length === 0 ? (
                  <EmptyState icon={<Pickaxe />} title="No moon drills mined this month" />
                ) : (
                  <Table>
                    <THead>
                      <tr>
                        <Th>Refinery</Th>
                        <Th>Moon</Th>
                        <Th align="right">Miners</Th>
                        <Th align="right">Units</Th>
                        <Th align="right">Value</Th>
                      </tr>
                    </THead>
                    <tbody>
                      {data.moons.map((m) => (
                        <Tr key={m.observer_id}>
                          <Td>{m.name}</Td>
                          <Td className="text-muted">{m.moon || "—"}</Td>
                          <Td numeric>{m.miners}</Td>
                          <Td numeric>{num(m.quantity)}</Td>
                          <Td numeric>{isk(m.value)}</Td>
                        </Tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Card>
            </TabPanel>
            <TabPanel value="ores">
              <OresTable ores={data.ores} closed={data.closed} />
            </TabPanel>
          </Tabs>
        </div>
      )}

      {settingsOpen && <SettingsDialog onClose={() => setSettingsOpen(false)} />}
      <ConfirmDialog
        open={confirm === "close"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={`Close ${data?.label ?? "this month"}?`}
        description={`Ore prices and the ${data?.tax_rate ?? ""}% tax rate are fixed as they are now, and each member is told what they owe. You can reopen it while nobody has paid.`}
        confirmLabel={<><Lock /> Close month</>}
        onConfirm={() => close.mutateAsync()}
      />
      <ConfirmDialog
        open={confirm === "reopen"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={`Reopen ${data?.label ?? "this month"}?`}
        description="What members owe for the month is deleted, and values go back to today's prices until you close it again."
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
        Closed {data.closed_at ? date(data.closed_at) : ""}. Values use the ore prices of that day and won't change.
      </Alert>
    );
  }
  if (data.can_close) {
    return (
      <Alert tone="warning" title={`${data.label} is over and still open`} action={canManage ? <Button size="sm" variant="primary" onClick={onClose}><Lock /> Close month</Button> : undefined}>
        Values use today's ore prices until the month is closed. Closing fixes them and tells members what they owe.
      </Alert>
    );
  }
  return (
    <Alert tone="info" title={`${data.label} so far`}>
      Values use today's ore prices. Once the month is over it can be closed and members are told what they owe.
    </Alert>
  );
}

function MembersTable({ data, canManage, onPaid }: { data: Ledger; canManage: boolean; onPaid: (id: number, paid: boolean) => void }) {
  const [open, setOpen] = useState<Set<string>>(new Set());
  const toggle = (k: string) => setOpen((s) => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); return n; });
  if (data.members.length === 0) {
    return (
      <Card>
        <EmptyState icon={<Pickaxe />} title={`Nobody mined from your moons in ${data.label}`} description="Mining shows up once a director or accountant's login has synced the corporation's moon drills." />
      </Card>
    );
  }
  return (
    <Card>
      <Table>
        <THead>
          <tr>
            <Th>Member</Th>
            <Th align="right">Units</Th>
            <Th align="right">Value</Th>
            <Th align="right">Tax</Th>
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
                <Td numeric>{num(m.quantity)}</Td>
                <Td numeric>{isk(m.value)}</Td>
                <Td numeric className={m.registered ? "" : "text-subtle"}>{m.registered ? isk(m.tax) : "—"}</Td>
                <Td align="right" onClick={(e) => e.stopPropagation()}>
                  {m.invoice ? (
                    canManage ? (
                      <label className="inline-flex items-center gap-2 text-xs text-muted">
                        {m.invoice.paid ? "Paid" : "Unpaid"}
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
                    <Td numeric className="text-muted">{num(c.quantity)}</Td>
                    <Td numeric className="text-muted">{isk(c.value)}</Td>
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

function OresTable({ ores, closed }: { ores: Ledger["ores"]; closed: boolean }) {
  if (ores.length === 0) return <Card><EmptyState icon={<Pickaxe />} title="No ore mined this month" /></Card>;
  return (
    <Card>
      <Table>
        <THead>
          <tr>
            <Th>Ore</Th>
            <Th align="right">{closed ? "Price at closing" : "Price now"}</Th>
            <Th align="right">Units</Th>
            <Th align="right">Value</Th>
          </tr>
        </THead>
        <tbody>
          {ores.map((o) => (
            <Tr key={o.type_id}>
              <Td>
                <div className="flex items-center gap-2.5">
                  <img src={o.icon} alt="" className="size-6 rounded" loading="lazy" />
                  {o.name}
                </div>
              </Td>
              <Td numeric className="text-muted">{isk(o.price, { full: true })}</Td>
              <Td numeric>{num(o.quantity)}</Td>
              <Td numeric>{isk(o.value)}</Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </Card>
  );
}

function SettingsDialog({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["moons", "settings"], queryFn: () => api.get<MoonSettings>(`${BASE}/settings`) });
  const [form, setForm] = useState<MoonSettings | null>(null);
  const value = form ?? data ?? null;
  const save = useMutation({
    mutationFn: (s: MoonSettings) => api.put<MoonSettings>(`${BASE}/settings`, s),
    onSuccess: (s) => {
      qc.setQueryData(["moons", "settings"], s);
      qc.invalidateQueries({ queryKey: ["moons"] });
      toast.success("Saved");
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const set = (patch: Partial<MoonSettings>) => value && setForm({ ...value, ...patch });
  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title="Moon tax settings"
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
          <Field label="Moon tax (% of the ore's value)" hint="0 keeps the ledger without charging anything.">
            <div>
              <Input type="number" min={0} max={100} step={0.5} value={value.tax_rate} onChange={(e) => set({ tax_rate: Number(e.target.value) })} className="w-32 font-mono" />
            </div>
          </Field>
          <Field label="How to pay" hint="Shown to members with what they owe, and sent with the monthly notification.">
            <Textarea rows={3} value={value.payment_instructions} placeholder="Give the ISK to Moon Holdings Corp with the reason MOON." onChange={(e) => set({ payment_instructions: e.target.value })} />
          </Field>
          <div>
            <div className="mb-1 text-[13px] font-medium">Corporations</div>
            <p className="mb-3 text-xs text-muted">Whose moon drills count. None ticked means all of them.</p>
            {value.available_corporations.length === 0 ? (
              <p className="text-sm text-subtle">No corporation has synced moon mining yet.</p>
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

// --- a member's own mining --------------------------------------------------------------------------------------

function useMe(month: string) {
  return useQuery({ queryKey: ["moons", "me", month], queryFn: () => api.get<Me>(`${BASE}/me?month=${month}`), enabled: month !== undefined });
}

function MyMiningPage() {
  const canView = useHasPerm("moons.view_ledger");
  const [month, setMonth] = useMonthState();
  const { data, isLoading } = useMe(month);
  const me = data?.ledger.members[0];
  return (
    <>
      <PageHeader
        eyebrow="Moon mining"
        title="My moon mining"
        icon={<Pickaxe />}
        description="What your characters mined from the corporation's moons, and the moon tax for it."
        actions={
          <div className="flex items-center gap-2">
            <MonthPicker value={month} onChange={setMonth} />
            {canView && (
              <Link to="/p/moons">
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
            <Alert tone="warning" icon={<Coins />} title={`You owe ${isk(data.outstanding, { full: true })} in moon tax`}>
              {data.payment_instructions || "Ask your corporation's leadership how to pay."}
            </Alert>
          )}
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label={`Mined in ${data.ledger.label}`} value={isk(me?.value ?? 0)} mono hint={`${num(me?.quantity ?? 0)} units of ore`} />
            <StatCard
              label={`Moon tax · ${data.ledger.tax_rate}%`}
              value={isk(me?.tax ?? 0)}
              mono
              hint={data.ledger.closed ? (me?.invoice?.paid ? "paid" : me?.invoice ? "not paid yet" : "nothing owed") : "estimate until the month is closed"}
              tone={me?.invoice && !me.invoice.paid ? "warning" : undefined}
            />
            <StatCard label="Characters" value={me?.characters.length ?? 0} hint="that mined this month" />
          </div>
          <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
            <Card>
              <CardHeader title="By character" />
              {!me ? (
                <EmptyState icon={<Pickaxe />} title={`You didn't mine from the moons in ${data.ledger.label}`} />
              ) : (
                <Table>
                  <THead>
                    <tr>
                      <Th>Character</Th>
                      <Th align="right">Units</Th>
                      <Th align="right">Value</Th>
                    </tr>
                  </THead>
                  <tbody>
                    {me.characters.map((c) => (
                      <Tr key={c.id}>
                        <Td>{c.name}</Td>
                        <Td numeric>{num(c.quantity)}</Td>
                        <Td numeric>{isk(c.value)}</Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card>
            <Card className="h-fit">
              <CardHeader title="Moon tax history" />
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
  return useHasPerm("moons.view_ledger") ? <LedgerPage /> : <MyMiningPage />;
}

// --- dashboard widget ------------------------------------------------------------------------------------------

function MoonWidget() {
  const { data, isLoading } = useMe("");
  if (isLoading) return <Skeleton className="h-16" />;
  if (!data) return null;
  const me = data.ledger.members[0];
  return (
    <Link to="/p/moons/me" className="block">
      <div className="flex items-end justify-between gap-6">
        <div>
          <div className="text-xs text-muted">Mined in {data.ledger.label}</div>
          <div className="mt-1 font-mono text-2xl font-semibold tabular-nums">{isk(me?.value ?? 0)}</div>
          <div className="text-xs text-subtle">≈ {isk(me?.tax ?? 0)} moon tax at {data.ledger.tax_rate}%</div>
        </div>
        {data.outstanding > 0 ? <Badge tone="warning">{isk(data.outstanding)} owed</Badge> : <Badge tone="success">All paid</Badge>}
      </div>
    </Link>
  );
}

export default definePlugin({
  routes: [
    { path: "", Component: HomePage },
    { path: "me", Component: MyMiningPage },
  ],
  widgets: [{ id: "my-mining", title: "Moon mining", Component: MoonWidget, size: "sm", order: 40 }],
});
