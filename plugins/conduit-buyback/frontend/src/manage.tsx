// Running programs: overview, statistics and contracts, the program form, item rules, locations and settings.
import {
  api, Badge, BarChart, Button, buttonVariants, Card, CardBody, CardHeader, ConfirmDialog, DataTable, Dialog, EmptyState, Field, Input,
  isk, num, PageHeader, SearchInput, SectionTitle, Segmented, Select, Skeleton, StatCard, Switch, SwitchRow, TabPanel, Tabs, Textarea, timeAgo, toast,
  useHasPerm,
} from "@conduit/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router";

import { Cart, Coins, Eye, Pencil, Pin, Plus, Refresh, Settings as SettingsIcon, Tag, Trash, Warning } from "./icons";
import { BackLink, HOME } from "./member";
import { ItemCell, Problems, StatusBadge, SystemText } from "./shared";
import {
  BASE, type ContractRow, type Hit, type ItemRule, type ManagedDetail, type ManagedProgram, type Options, type Place, type ProgramForm,
  type Settings, type Stats, type TradeHub, type WatchRule,
} from "./types";

const MANAGE = `${HOME}/manage`;

function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["buyback"] });
}

// --- overview ---------------------------------------------------------------------------------------------------------

export function ManagePage() {
  const { data, isLoading, error } = useQuery({ queryKey: ["buyback", "manage"], queryFn: () => api.get<{ programs: ManagedProgram[]; can_create: boolean; manages_all: boolean }>(`${BASE}/manage`) });
  const settings = useHasPerm("buyback.manage_all_programs");
  return (
    <div>
      <BackLink to={HOME}>Buyback</BackLink>
      <PageHeader
        icon={<SettingsIcon />}
        eyebrow="Buyback"
        title="Run programs"
        description="Contracts are read from each owner's login every 15 minutes and checked against their quotes."
        actions={
          <>
            {data?.can_create && (
              <Link to={`${MANAGE}/locations`} className={buttonVariants({ variant: "secondary" })}>
                <Pin /> Locations
              </Link>
            )}
            {settings && (
              <Link to={`${HOME}/settings`} className={buttonVariants({ variant: "secondary" })}>
                <SettingsIcon /> Prices
              </Link>
            )}
            {data?.can_create && (
              <Link to={`${MANAGE}/new`} className={buttonVariants({ variant: "primary" })}>
                <Plus /> New program
              </Link>
            )}
          </>
        }
      />
      {isLoading ? (
        <Skeleton className="h-48" />
      ) : !data ? (
        <EmptyState icon={<Cart />} title="Not for you" description={(error as Error | null)?.message} />
      ) : data.programs.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Cart />}
            title="No programs yet"
            description="Add the location contracts are made at, then create a program."
            action={data.can_create && <Link to={`${MANAGE}/new`} className={buttonVariants({ variant: "primary" })}>New program</Link>}
          />
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {data.programs.map((p) => (
            <Link key={p.id} to={`${MANAGE}/${p.id}`} className="block">
              <Card interactive className="h-full">
                <CardBody className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="hud-label truncate text-[15px] text-text">{p.name}</h2>
                      <div className="mt-1 text-xs text-subtle">
                        {p.owner ? <>Contracts to {p.owner.name}{p.owner.corporation ? ` / ${p.owner.corporation}` : ""}</> : "No owner"}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      {!p.active && <Badge tone="warning">Closed</Badge>}
                      {p.public && <Badge tone="info">Public</Badge>}
                      {p.owner && !p.owner.login_ok && <Badge tone="danger">Owner login</Badge>}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <Mini label="Open" value={num(p.open)} hint={isk(p.open_value)} />
                    <Mini label="Problems" value={num(p.problems)} tone={p.problems ? "danger" : undefined} />
                    <Mini label="30 days" value={isk(p.month_value)} hint={`${p.month_count} accepted`} />
                  </div>
                  {p.wallet && (
                    <div className="text-xs text-muted">
                      Wallet division {p.wallet.division}: <span className="font-mono">{isk(p.wallet.balance)}</span>
                    </div>
                  )}
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Mini({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: ReactNode; tone?: "danger" }) {
  return (
    <div className="border border-border bg-surface-2 px-3 py-2">
      <div className="text-[11px] uppercase tracking-wider text-subtle">{label}</div>
      <div className={`mt-0.5 truncate font-mono text-lg tabular-nums ${tone === "danger" ? "text-danger-fg" : ""}`}>{value}</div>
      {hint && <div className="truncate text-xs text-subtle">{hint}</div>}
    </div>
  );
}

// --- one program: statistics and contracts --------------------------------------------------------------------

type Filter = "open" | "problems" | "finished" | "closed" | "all";

export function StatsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const invalidate = useInvalidate();
  const [filter, setFilter] = useState<Filter>("open");
  const [q, setQ] = useState("");
  const stats = useQuery({ queryKey: ["buyback", "stats", id], queryFn: () => api.get<Stats>(`${BASE}/manage/programs/${id}/stats`) });
  const rows = useQuery({
    queryKey: ["buyback", "contracts", id, filter, q],
    queryFn: () => api.get<ContractRow[]>(`${BASE}/manage/programs/${id}/contracts?status=${filter}&q=${encodeURIComponent(q)}`),
  });
  const sync = useMutation({
    mutationFn: () => api.post(`${BASE}/manage/programs/${id}/sync`),
    onSuccess: () => {
      toast.success("Checking contracts now; refresh in a minute");
      setTimeout(invalidate, 15_000);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const s = stats.data;
  if (stats.isLoading) return <Skeleton className="h-96" />;
  if (!s) return <EmptyState icon={<Cart />} title="No such program" />;
  return (
    <div>
      <BackLink to={MANAGE}>Programs</BackLink>
      <PageHeader
        icon={<Cart />}
        eyebrow="Buyback program"
        title={s.program.name}
        description={s.owner ? `Contracts to ${s.owner.name}${s.owner.corporation ? ` / ${s.owner.corporation}` : ""}.` : "This program has no owner, so no contracts are read."}
        actions={
          <>
            <Link to={`${HOME}/programs/${s.program.id}`} className={buttonVariants({ variant: "secondary" })}>
              <Cart /> Calculator
            </Link>
            {s.program.can_manage && (
              <>
                <Button onClick={() => sync.mutate()} loading={sync.isPending}>
                  <Refresh /> Check now
                </Button>
                <Link to={`${MANAGE}/${s.program.id}/items`} className={buttonVariants({ variant: "secondary" })}>
                  <Tag /> Items
                </Link>
                <Link to={`${MANAGE}/${s.program.id}/edit`} className={buttonVariants({ variant: "primary" })}>
                  <Pencil /> Edit
                </Link>
              </>
            )}
          </>
        }
      />
      {s.owner && !s.owner.login_ok && (
        <p className="mb-4 border border-danger/40 bg-danger-soft px-3 py-2 text-sm text-danger-fg">
          {s.owner.name}'s login can't read contracts. They need to log in again (Characters → re-add), or pick another owner.
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Open contracts" value={s.open} hint={isk(s.open_value)} icon={<Cart />} />
        <StatCard label="Need a look" value={s.problems} tone={s.problems ? "danger" : "success"} hint={s.problems ? "open contracts with problems" : "all match their quotes"} icon={<Warning />} />
        <StatCard label="Bought, 30 days" value={isk(s.month_value)} mono hint={`${s.month_count} contracts`} icon={<Coins />} />
        <StatCard
          label={s.wallet ? `Wallet division ${s.wallet.division}` : "Bought, all time"}
          value={s.wallet ? isk(s.wallet.balance) : isk(s.total_value)}
          mono
          hint={s.wallet ? (s.wallet.updated_at ? `updated ${timeAgo(s.wallet.updated_at)}` : "not synced yet") : `${s.total_count} contracts`}
        />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader title="Contracts" />
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
            <Segmented
              size="sm"
              value={filter}
              onChange={setFilter}
              options={[
                { value: "open", label: "Open" },
                { value: "problems", label: "Problems" },
                { value: "finished", label: "Accepted" },
                { value: "closed", label: "Other" },
                { value: "all", label: "All" },
              ]}
            />
            <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Seller or title" className="w-56" />
          </div>
          <DataTable
            rows={rows.data ?? []}
            loading={rows.isLoading}
            rowKey={(r) => r.contract_id}
            onRowClick={(r) => navigate(`${HOME}/contracts/${r.contract_id}`)}
            empty={{ icon: <Cart />, title: filter === "problems" ? "Nothing needs a look" : "No contracts here" }}
            columns={[
              { header: "Seller", cell: (r) => <div><div className="font-medium">{r.issuer.name}</div><div className="font-mono text-xs text-subtle">{r.tracking_number ?? r.title}</div></div> },
              { header: "Made", cell: (r) => <span className="text-sm text-muted">{timeAgo(r.date_issued)}</span>, sortValue: (r) => r.date_issued },
              { header: "Price", align: "right", cell: (r) => <span className="font-mono tabular-nums">{isk(r.price, { full: true })}</span>, sortValue: (r) => r.price },
              { header: "Checks", cell: (r) => <Problems problems={r.problems} compact /> },
              { header: "State", cell: (r) => <StatusBadge status={r.status} label={r.status_label} /> },
            ]}
          />
        </Card>
        <div className="space-y-4">
          <Card>
            <CardHeader title="Bought per month" />
            <CardBody>
              {s.months.length ? (
                <BarChart data={s.months.map((m) => ({ date: `${m.month}-01`, value: m.value }))} format={(n) => isk(n)} label="Bought" height={160} />
              ) : (
                <p className="text-sm text-muted">Nothing accepted yet.</p>
              )}
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Top sellers, 90 days" />
            {s.leaderboard.length ? (
              <ol className="divide-y divide-border">
                {s.leaderboard.slice(0, 10).map((r, i) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-2 text-sm">
                    <span className="truncate">
                      <span className="mr-2 font-mono text-xs text-subtle">{i + 1}</span>
                      {r.name}
                    </span>
                    <span className="font-mono tabular-nums">{isk(r.value)}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <CardBody><p className="text-sm text-muted">No sales yet.</p></CardBody>
            )}
          </Card>
          <Card>
            <CardHeader title="Most bought, 90 days" />
            {s.top_items.length ? (
              <ul className="divide-y divide-border">
                {s.top_items.map((it) => (
                  <li key={it.type_id} className="flex items-center justify-between gap-3 px-4 py-2 text-sm">
                    <ItemCell icon={it.icon} name={it.name} sub={`${num(it.quantity)} units`} />
                    <span className="shrink-0 font-mono tabular-nums">{isk(it.value)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <CardBody><p className="text-sm text-muted">Nothing yet.</p></CardBody>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

// --- program form -------------------------------------------------------------------------------------------------

const BLANK: ProgramForm = {
  name: "", description: "", owner_id: null, is_corporation: true, location_ids: [], manager_ids: [], expiration_days: 14, price_type: "buy",
  tax: 10, hauling_fuel_cost: 0, price_density_threshold: 0, price_density_tax: 0, compressed_volume: false, allow_all_items: true,
  use_raw: true, use_compressed: true, use_refined: true, refining_rate: 80, allow_unpacked: false, blue_loot_npc: false, red_loot_npc: false,
  t1_refined: false, t1_refining_rate: 55, state_ids: [], group_ids: [], public: false, notify_managers: true, wallet_division: null,
  tracking_prefix: "", active: true, hub_id: null, hub_name: "",
};

function NumberField({ label, hint, value, onChange, step = 1, suffix }: { label: string; hint?: ReactNode; value: number; onChange: (n: number) => void; step?: number; suffix?: string }) {
  return (
    <Field label={label} hint={hint}>
      <div className="flex items-center gap-2">
        <Input type="number" step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-36 font-mono" />
        {suffix && <span className="text-sm text-subtle">{suffix}</span>}
      </div>
    </Field>
  );
}

function Toggles<T extends { id: number; name: string }>({ items, selected, onChange, empty }: { items: T[]; selected: number[]; onChange: (ids: number[]) => void; empty: string }) {
  if (!items.length) return <p className="text-sm text-subtle">{empty}</p>;
  return (
    <div className="divide-y divide-border border border-border">
      {items.map((it) => (
        <label key={it.id} className="flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-sm">
          <span>{it.name}</span>
          <Switch checked={selected.includes(it.id)} onCheckedChange={(on) => onChange(on ? [...selected, it.id] : selected.filter((x) => x !== it.id))} />
        </label>
      ))}
    </div>
  );
}

export function EditPage() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const invalidate = useInvalidate();
  const options = useQuery({ queryKey: ["buyback", "options"], queryFn: () => api.get<Options>(`${BASE}/manage/options`) });
  const existing = useQuery({ queryKey: ["buyback", "managed", id], queryFn: () => api.get<ManagedDetail>(`${BASE}/manage/programs/${id}`), enabled: !isNew });
  const [form, setForm] = useState<ProgramForm | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [addingLocation, setAddingLocation] = useState(false);
  const base: ProgramForm | null = isNew ? BLANK : existing.data ? { ...BLANK, ...pick(existing.data) } : null;
  const value = form ?? base;
  const set = (patch: Partial<ProgramForm>) => value && setForm({ ...value, ...patch });
  const save = useMutation({
    mutationFn: (f: ProgramForm) => (isNew ? api.post<ManagedDetail>(`${BASE}/manage/programs`, f) : api.put<ManagedDetail>(`${BASE}/manage/programs/${id}`, f)),
    onSuccess: (p) => {
      invalidate();
      toast.success(isNew ? "Program created" : "Saved");
      navigate(`${MANAGE}/${p.id}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: () => api.delete(`${BASE}/manage/programs/${id}`),
    onSuccess: () => {
      invalidate();
      navigate(MANAGE);
    },
  });
  if (!value || !options.data) return <Skeleton className="h-96" />;
  const o = options.data;
  const ownerChoices = [...o.characters];
  if (existing.data?.owner && !ownerChoices.some((c) => c.id === existing.data!.owner!.id)) {
    ownerChoices.unshift({ id: existing.data.owner.id, name: existing.data.owner.name, corporation: existing.data.owner.corporation, login_ok: existing.data.owner.login_ok });
  }
  const managerChoices = [...o.managers, ...(existing.data?.managers ?? []).filter((m) => !o.managers.some((x) => x.id === m.id))];

  return (
    <div>
      <BackLink to={isNew ? MANAGE : `${MANAGE}/${id}`}>{isNew ? "Programs" : value.name}</BackLink>
      <PageHeader
        icon={<Pencil />}
        title={isNew ? "New buyback program" : `Edit ${existing.data?.name}`}
        actions={
          <>
            {!isNew && (
              <Button variant="ghost" onClick={() => setConfirmDelete(true)}>
                <Trash /> Delete
              </Button>
            )}
            <Button variant="primary" loading={save.isPending} onClick={() => save.mutate(value)}>
              {isNew ? "Create program" : "Save"}
            </Button>
          </>
        }
      />
      <Tabs
        className="space-y-6"
        items={[
          { value: "basics", label: "Basics" },
          { value: "pricing", label: "Pricing" },
          { value: "ore", label: "Ore & special items" },
          { value: "access", label: "Who can use it" },
        ]}
      >
        <TabPanel value="basics">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardBody className="space-y-5">
                <Field label="Name" required>
                  <Input value={value.name} onChange={(e) => set({ name: e.target.value })} placeholder="Jita ore buyback" />
                </Field>
                <Field label="Description" hint="Shown to sellers: what you buy, how fast you accept, who to ask.">
                  <Textarea rows={3} value={value.description} onChange={(e) => set({ description: e.target.value })} />
                </Field>
                <Field label="Contracts go to" required hint="One of your characters. Its login reads the contracts, so it must stay logged in here.">
                  <Select value={value.owner_id ?? ""} onChange={(e) => set({ owner_id: Number(e.target.value) || null })}>
                    <option value="">Pick a character…</option>
                    {ownerChoices.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}{c.corporation ? ` (${c.corporation})` : ""}{c.login_ok ? "" : " - login needed"}
                      </option>
                    ))}
                  </Select>
                </Field>
                <div className="divide-y divide-border border border-border px-3">
                  <SwitchRow label="To the character's corporation" description="Sellers make contracts out to the corporation rather than the character." checked={value.is_corporation} onCheckedChange={(v) => set({ is_corporation: v })} />
                  <SwitchRow label="Open" description="Closed programs give no quotes; only managers see them." checked={value.active} onCheckedChange={(v) => set({ active: v })} />
                  <SwitchRow label="Tell managers about new contracts" checked={value.notify_managers} onCheckedChange={(v) => set({ notify_managers: v })} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <NumberField label="Contracts expire after" value={value.expiration_days} onChange={(n) => set({ expiration_days: n })} suffix="days" />
                  <Field label="Wallet division" hint="Its balance shows on the program's page.">
                    <Select value={value.wallet_division ?? ""} onChange={(e) => set({ wallet_division: Number(e.target.value) || null })}>
                      <option value="">None</option>
                      {[1, 2, 3, 4, 5, 6, 7].map((d) => <option key={d} value={d}>Division {d}</option>)}
                    </Select>
                  </Field>
                </div>
                <Field label="Tracking prefix" hint={`Starts this program's tracking numbers. Empty: the site's (${o.default_prefix}).`}>
                  <Input value={value.tracking_prefix} onChange={(e) => set({ tracking_prefix: e.target.value })} placeholder={o.default_prefix} className="w-40 font-mono" />
                </Field>
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="Locations" description="Where sellers make contracts. With a structure id, contracts made anywhere else are flagged." />
              <CardBody className="space-y-3">
                <Toggles items={o.locations} selected={value.location_ids} onChange={(ids) => set({ location_ids: ids })} empty="No locations yet." />
                <button type="button" onClick={() => setAddingLocation(true)} className="inline-flex items-center gap-1.5 text-sm text-accent-ink hover:underline">
                  <Plus /> Add a location
                </button>
              </CardBody>
            </Card>
          </div>
        </TabPanel>

        <TabPanel value="pricing">
          <Card>
            <CardBody className="grid gap-6 lg:grid-cols-2">
              <div className="lg:col-span-2">
                <ProgramMarket value={value} market={o.market} onChange={(hub_id, hub_name) => set({ hub_id, hub_name })} />
              </div>
              <div className="space-y-5">
                <Field label="Price" hint="Which hub price items are valued at, before tax.">
                  <Segmented value={value.price_type} onChange={(v) => set({ price_type: v })} options={[{ value: "buy", label: "Buy" }, { value: "split", label: "Split" }, { value: "sell", label: "Sell" }]} />
                </Field>
                <NumberField label="Tax" hint="Taken off every item. Items can add to it (or take away) in the item rules." value={value.tax} onChange={(n) => set({ tax: n })} step={0.5} suffix="%" />
                <NumberField label="Hauling cost" hint="Taken off per m³; for programs that haul to market. Use it or price density, not both." value={value.hauling_fuel_cost} onChange={(n) => set({ hauling_fuel_cost: n })} step={50} suffix="ISK / m³" />
              </div>
              <div className="space-y-5">
                <NumberField label="Price density threshold" hint="Items worth less than this per m³ (T1 ships, bulky junk) pay the extra tax. 0: off." value={value.price_density_threshold} onChange={(n) => set({ price_density_threshold: n })} step={100} suffix="ISK / m³" />
                <NumberField label="Price density tax" value={value.price_density_tax} onChange={(n) => set({ price_density_tax: n })} step={0.5} suffix="%" />
                <div className="divide-y divide-border border border-border px-3">
                  <SwitchRow label="Use compressed volume" description="Ore and ice count with their compressed volume for hauling and price density." checked={value.compressed_volume} onCheckedChange={(v) => set({ compressed_volume: v })} />
                  <SwitchRow label="Buy every item" description="Off: only items you add in the item rules are bought." checked={value.allow_all_items} onCheckedChange={(v) => set({ allow_all_items: v })} />
                  <SwitchRow label="Take assembled items" description="Off: ships and modules must be repackaged (so broken crystals and the like aren't sold to you)." checked={value.allow_unpacked} onCheckedChange={(v) => set({ allow_unpacked: v })} />
                </div>
              </div>
            </CardBody>
          </Card>
        </TabPanel>

        <TabPanel value="ore">
          <Card>
            <CardBody className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                <SectionTitle>Ore, moon ore and ice</SectionTitle>
                <p className="text-sm text-muted">Valued the best of the ways ticked here.</p>
                <div className="divide-y divide-border border border-border px-3">
                  <SwitchRow label="Raw price" description="Some ores (Kernite, moon ores) sell for less than their minerals." checked={value.use_raw} onCheckedChange={(v) => set({ use_raw: v })} />
                  <SwitchRow label="Compressed price" description="One unit of ore compresses into one unit of compressed ore." checked={value.use_compressed} onCheckedChange={(v) => set({ use_compressed: v })} />
                  <SwitchRow label="Refined value" description="What reprocessing gives, at the refining rate below." checked={value.use_refined} onCheckedChange={(v) => set({ use_refined: v })} />
                </div>
                <NumberField label="Refining rate" value={value.refining_rate} onChange={(n) => set({ refining_rate: n })} step={0.1} suffix="%" />
              </div>
              <div className="space-y-4">
                <SectionTitle>Special items</SectionTitle>
                <div className="divide-y divide-border border border-border px-3">
                  <SwitchRow label="Tech I modules at reprocessed value" description="Named and Tech I modules are worth what they reprocess into." checked={value.t1_refined} onCheckedChange={(v) => set({ t1_refined: v })} />
                  <SwitchRow label="Sleeper loot at NPC price" description="Blue loot at the NPC buy order price, even if the market pays more." checked={value.blue_loot_npc} onCheckedChange={(v) => set({ blue_loot_npc: v })} />
                  <SwitchRow label="Triglavian loot at NPC price" description="Red loot at the NPC buy order price." checked={value.red_loot_npc} onCheckedChange={(v) => set({ red_loot_npc: v })} />
                </div>
                <NumberField label="Tech I reprocessing rate" value={value.t1_refining_rate} onChange={(n) => set({ t1_refining_rate: n })} step={0.1} suffix="%" />
              </div>
            </CardBody>
          </Card>
        </TabPanel>

        <TabPanel value="access">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader title="States" description="None ticked here or under groups: every member." />
              <CardBody>
                <Toggles items={o.states} selected={value.state_ids} onChange={(ids) => set({ state_ids: ids })} empty="No states." />
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="Groups" />
              <CardBody>
                <Toggles items={o.groups} selected={value.group_ids} onChange={(ids) => set({ group_ids: ids })} empty="No groups." />
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="Managers" description="Run this program, see its contracts and get told about new ones. You're always one." />
              <CardBody className="space-y-4">
                <Toggles items={managerChoices} selected={value.manager_ids} onChange={(ids) => set({ manager_ids: ids })} empty="Nobody else may run programs." />
                <div className="border border-border px-3">
                  <SwitchRow label="Public" description="Anyone with the link can get a quote, without an account. States and groups don't apply to it." checked={value.public} onCheckedChange={(v) => set({ public: v })} />
                </div>
                {value.public && !isNew && (
                  <p className="text-xs text-muted">
                    Public link: <span className="font-mono">{`${location.origin}/public/p/buyback/${id}`}</span>
                  </p>
                )}
              </CardBody>
            </Card>
          </div>
        </TabPanel>
      </Tabs>
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete ${existing.data?.name}?`}
        description="Its quotes, item rules and contract history go with it. Contracts in the game aren't touched."
        confirmLabel="Delete"
        danger
        onConfirm={() => remove.mutateAsync()}
      />
      {addingLocation && (
        <LocationDialog
          location={null}
          onClose={() => setAddingLocation(false)}
          onSaved={(place) => set({ location_ids: [...value.location_ids, place.id] })}
        />
      )}
    </div>
  );
}

function pick(p: ManagedDetail): ProgramForm {
  const out = {} as Record<string, unknown>;
  for (const k of Object.keys(BLANK)) out[k] = (p as unknown as Record<string, unknown>)[k];
  return out as unknown as ProgramForm;
}

// --- item rules and watchlist -------------------------------------------------------------------------------------

function Search({ kind, placeholder, onPick }: { kind: string; placeholder: string; onPick: (hit: Hit) => void }) {
  const [q, setQ] = useState("");
  const { data } = useQuery({
    queryKey: ["buyback", "search", kind, q],
    queryFn: () => api.get<Hit[]>(`${BASE}/manage/search/${kind}?q=${encodeURIComponent(q)}`),
    enabled: q.trim().length >= 2,
  });
  return (
    <div className="relative">
      <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} />
      {q.trim().length >= 2 && data && (
        <ul className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto border border-border-strong bg-surface-raised shadow-e3">
          {data.length === 0 && <li className="px-3 py-2 text-sm text-subtle">Nothing found</li>}
          {data.map((h) => (
            <li key={h.id}>
              <button
                className="w-full px-3 py-2 text-left hover:bg-hover"
                onClick={() => {
                  onPick(h);
                  setQ("");
                }}
              >
                {h.icon ? <ItemCell icon={h.icon} name={h.name} sub={h.subtitle} /> : <div><div className="text-sm font-medium">{h.name}</div><div className="text-xs text-subtle">{h.subtitle}</div></div>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

type RuleMode = "tax" | "fixed" | "banned";

export function ItemsPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const key = ["buyback", "managed", id];
  const { data } = useQuery({ queryKey: key, queryFn: () => api.get<ManagedDetail>(`${BASE}/manage/programs/${id}`) });
  const [target, setTarget] = useState<{ kind: "type" | "market"; hit: Hit } | null>(null);
  const [mode, setMode] = useState<RuleMode>("tax");
  const [amount, setAmount] = useState("0");
  const [filter, setFilter] = useState("");
  const [clearAll, setClearAll] = useState(false);
  const setRules = (item_rules: ItemRule[]) => qc.setQueryData<ManagedDetail>(key, (d) => (d ? { ...d, item_rules } : d));
  const setWatch = (watch_rules: WatchRule[]) => qc.setQueryData<ManagedDetail>(key, (d) => (d ? { ...d, watch_rules } : d));
  const add = useMutation({
    mutationFn: () =>
      api.post<{ added: number; item_rules: ItemRule[] }>(`${BASE}/manage/programs/${id}/items`, {
        type_ids: target?.kind === "type" ? [target.hit.id] : [],
        market_group_id: target?.kind === "market" ? target.hit.id : null,
        tax: mode === "tax" ? Number(amount) : 0,
        disallowed: mode === "banned",
        static_price: mode === "fixed" ? Number(amount) : null,
      }),
    onSuccess: (r) => {
      setRules(r.item_rules);
      toast.success(`${r.added} item${r.added === 1 ? "" : "s"} set`);
      setTarget(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: (typeId: number) => api.delete<{ item_rules: ItemRule[] }>(`${BASE}/manage/programs/${id}/items/${typeId}`),
    onSuccess: (r) => setRules(r.item_rules),
  });
  const removeAll = useMutation({
    mutationFn: () => api.delete<{ item_rules: ItemRule[] }>(`${BASE}/manage/programs/${id}/items`),
    onSuccess: (r) => setRules(r.item_rules),
  });
  const watch = useMutation({
    mutationFn: (body: { type_id?: number; group_id?: number }) => api.post<WatchRule[]>(`${BASE}/manage/programs/${id}/watchlist`, body),
    onSuccess: setWatch,
    onError: (e: Error) => toast.error(e.message),
  });
  const unwatch = useMutation({
    mutationFn: (ruleId: number) => api.delete<WatchRule[]>(`${BASE}/manage/programs/${id}/watchlist/${ruleId}`),
    onSuccess: setWatch,
  });
  if (!data) return <Skeleton className="h-96" />;
  const rules = data.item_rules.filter((r) => r.name.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div>
      <BackLink to={`${MANAGE}/${id}`}>{data.name}</BackLink>
      <PageHeader
        icon={<Tag />}
        title="Item rules"
        description={
          data.allow_all_items
            ? "Everything is bought at the program's terms; these items have their own: extra tax (or less), a fixed price, or not bought."
            : "Only these items are bought."
        }
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          <Card>
            <CardHeader title="Add items" description="One item, or every item in a market group and the groups under it (Minerals, Standard Ores, Salvaged Materials…)." />
            <CardBody className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Search kind="types" placeholder="Find an item…" onPick={(hit) => setTarget({ kind: "type", hit })} />
                <Search kind="market-groups" placeholder="Find a market group…" onPick={(hit) => setTarget({ kind: "market", hit })} />
              </div>
              {target && (
                <div className="space-y-4 border border-border bg-surface-2 p-4">
                  <div className="text-sm">
                    {target.kind === "market" ? "Every item in " : ""}
                    <span className="font-medium">{target.hit.name}</span>
                    <span className="text-subtle"> · {target.hit.subtitle}</span>
                  </div>
                  <div className="flex flex-wrap items-end gap-3">
                    <Segmented value={mode} onChange={setMode} options={[{ value: "tax", label: "Tax" }, { value: "fixed", label: "Fixed price" }, { value: "banned", label: "Not bought" }]} />
                    {mode !== "banned" && (
                      <div className="flex items-center gap-2">
                        <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-36 font-mono" />
                        <span className="text-sm text-subtle">{mode === "tax" ? "% on top of the program's (negative for less)" : "ISK per unit, no tax"}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="primary" loading={add.isPending} onClick={() => add.mutate()}>Set</Button>
                    <Button variant="ghost" onClick={() => setTarget(null)}>Cancel</Button>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
              <div className="hud-label text-subtle">{data.item_rules.length} item{data.item_rules.length === 1 ? "" : "s"}</div>
              <div className="flex items-center gap-2">
                <SearchInput value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter" className="w-48" />
                {data.item_rules.length > 0 && (
                  <Button size="sm" variant="ghost" onClick={() => setClearAll(true)}>
                    <Trash /> Remove all
                  </Button>
                )}
              </div>
            </div>
            {rules.length === 0 ? (
              <EmptyState icon={<Tag />} title={data.item_rules.length ? "No match" : "No item rules"} />
            ) : (
              <ul className="max-h-[600px] divide-y divide-border overflow-y-auto">
                {rules.map((r) => (
                  <li key={r.type_id} className="flex items-center justify-between gap-3 px-4 py-2">
                    <ItemCell icon={r.icon} name={r.name} />
                    <div className="flex shrink-0 items-center gap-3">
                      {r.disallowed ? (
                        <Badge tone="danger">not bought</Badge>
                      ) : r.static_price != null ? (
                        <span className="font-mono text-sm">{isk(r.static_price, { full: true })}</span>
                      ) : (
                        <span className="font-mono text-sm text-muted">{r.tax > 0 ? "+" : ""}{r.tax}% tax</span>
                      )}
                      <Button size="icon-xs" variant="ghost" aria-label={`Remove ${r.name}`} onClick={() => remove.mutate(r.type_id)}>
                        <Trash />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
        <Card className="h-fit">
          <CardHeader title="Manual review" description="Quotes with these items are flagged, and so are their contracts: officer modules, rare loot, anything easy to manipulate." />
          <CardBody className="space-y-3">
            <Search kind="types" placeholder="Add an item…" onPick={(h) => watch.mutate({ type_id: h.id })} />
            <Search kind="groups" placeholder="Add an item group…" onPick={(h) => watch.mutate({ group_id: h.id })} />
            {data.watch_rules.length === 0 ? (
              <p className="text-sm text-subtle">Nothing on the list.</p>
            ) : (
              <ul className="divide-y divide-border border border-border">
                {data.watch_rules.map((w) => (
                  <li key={w.id} className="flex items-center justify-between gap-3 px-3 py-2">
                    <ItemCell icon={w.icon} name={w.name} sub={w.kind === "group" ? "Item group" : undefined} />
                    <Button size="icon-xs" variant="ghost" aria-label={`Remove ${w.name}`} onClick={() => unwatch.mutate(w.id)}>
                      <Trash />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <p className="flex items-center gap-1.5 text-xs text-subtle">
              <Eye className="size-3.5" /> Sellers see which of their items will be checked.
            </p>
          </CardBody>
        </Card>
      </div>
      <ConfirmDialog
        open={clearAll}
        onOpenChange={setClearAll}
        title="Remove every item rule?"
        description={data.allow_all_items ? "All items go back to the program's terms." : "The program won't buy anything until you add items again."}
        confirmLabel="Remove all"
        danger
        onConfirm={() => removeAll.mutateAsync()}
      />
    </div>
  );
}

// --- locations ----------------------------------------------------------------------------------------------------

export function LocationsPage() {
  const invalidate = useInvalidate();
  const options = useQuery({ queryKey: ["buyback", "options"], queryFn: () => api.get<Options>(`${BASE}/manage/options`) });
  const [editing, setEditing] = useState<Place | "new" | null>(null);
  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`${BASE}/manage/locations/${id}`),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div>
      <BackLink to={MANAGE}>Programs</BackLink>
      <PageHeader
        icon={<Pin />}
        title="Locations"
        description="Where sellers make their contracts. Programs pick one or more."
        actions={<Button variant="primary" onClick={() => setEditing("new")}><Plus /> Add location</Button>}
      />
      <Card>
        {!options.data ? (
          <Skeleton className="h-32" />
        ) : options.data.locations.length === 0 ? (
          <EmptyState icon={<Pin />} title="No locations yet" action={<Button variant="primary" onClick={() => setEditing("new")}>Add location</Button>} />
        ) : (
          <ul className="divide-y divide-border">
            {options.data.locations.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div>
                  <div className="font-medium">{l.name}</div>
                  <div className="text-sm">
                    <SystemText system={l.system} />
                    {l.structure_id ? <span className="ml-2 font-mono text-xs text-subtle">#{l.structure_id}</span> : <Badge tone="neutral" className="ml-2">location not checked</Badge>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => setEditing(l)}><Pencil /> Edit</Button>
                  <Button size="sm" variant="ghost" onClick={() => remove.mutate(l.id)}><Trash /> Remove</Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
      {editing && <LocationDialog location={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function LocationDialog({ location, onClose, onSaved }: { location: Place | null; onClose: () => void; onSaved?: (place: Place) => void }) {
  const invalidate = useInvalidate();
  const [name, setName] = useState(location?.name ?? "");
  const [system, setSystem] = useState<{ id: number; name: string } | null>(location?.system ? { id: location.system.id, name: location.system.name } : null);
  const [structureId, setStructureId] = useState(location?.structure_id ? String(location.structure_id) : "");
  const save = useMutation({
    mutationFn: () => {
      const body = { name, solar_system_id: system?.id, structure_id: structureId ? Number(structureId) : null };
      return location ? api.put<Place>(`${BASE}/manage/locations/${location.id}`, body) : api.post<Place>(`${BASE}/manage/locations`, body);
    },
    onSuccess: (place) => {
      invalidate();
      onSaved?.(place);
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={location ? `Edit ${location.name}` : "Add a location"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={save.isPending} disabled={!name.trim() || !system} onClick={() => save.mutate()}>Save</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Find a known station or structure" hint="Fills in everything below. Only places the site has seen (in assets, contracts or corporations) are found.">
          <Search
            kind="places"
            placeholder="Station or structure name…"
            onPick={(h) => {
              setName(h.name);
              setStructureId(String(h.id));
              if (h.solar_system_id) setSystem({ id: h.solar_system_id, name: h.solar_system_name ?? `System ${h.solar_system_id}` });
            }}
          />
        </Field>
        <Field label="Name" required hint="Ideally the in-game name, so sellers find it.">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Solar system" required>
          {system ? (
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">{system.name}</span>
              <Button size="xs" variant="ghost" onClick={() => setSystem(null)}>Change</Button>
            </div>
          ) : (
            <Search kind="systems" placeholder="System…" onPick={(h) => setSystem({ id: h.id, name: h.name })} />
          )}
        </Field>
        <Field
          label="Station or structure id"
          hint="Contracts made elsewhere are flagged. In game, link the structure in chat, right-click the link and copy it: the number after the slash, e.g. showinfo:35826//1037962518481."
        >
          <Input value={structureId} onChange={(e) => setStructureId(e.target.value.replace(/\D/g, ""))} className="font-mono" placeholder="1037962518481" />
        </Field>
      </div>
    </Dialog>
  );
}

// --- site settings ------------------------------------------------------------------------------------------------

type SettingsForm = Settings & { janice_api_key: string };

const KIND_LABEL = { region: "a whole region", system: "a solar system", station: "a station", structure: "a player structure" } as const;

function hubKind(id: number): Settings["hub_kind"] {
  if (id >= 10_000_000 && id < 20_000_000) return "region";
  if (id >= 30_000_000 && id < 40_000_000) return "system";
  if (id >= 60_000_000 && id < 70_000_000) return "station";
  return "structure";
}

/** The trade hub prices come from: one of the main hubs, or any region, system, station or (ESI) structure. */
function HubPicker({ hubs, hubId, hubName, esi, onChange, note, label = "Trade hub" }: {
  hubs: TradeHub[]; hubId: number; hubName: string; esi: boolean; onChange: (id: number, name: string) => void; note: ReactNode; label?: string;
}) {
  const preset = hubs.find((h) => h.id === hubId);
  const [other, setOther] = useState(!preset);
  const kind = hubKind(hubId);
  return (
    <div className="space-y-3">
      <div className="text-[13px] font-medium text-text">{label}</div>
      <div className="grid gap-2 sm:grid-cols-3">
        {hubs.map((h) => {
          const on = h.id === hubId && !other;
          return (
            <button
              key={h.id}
              type="button"
              onClick={() => {
                setOther(false);
                onChange(h.id, h.name);
              }}
              className={`border px-3 py-2 text-left transition ${on ? "border-accent bg-accent-soft" : "border-border hover:bg-hover"}`}
              aria-pressed={on}
            >
              <div className={`text-sm font-medium ${on ? "text-accent-ink" : ""}`}>{h.name}</div>
              <div className="truncate text-xs text-subtle">{h.region}</div>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setOther(true)}
          className={`border px-3 py-2 text-left transition ${other ? "border-accent bg-accent-soft" : "border-border hover:bg-hover"}`}
          aria-pressed={other}
        >
          <div className={`text-sm font-medium ${other ? "text-accent-ink" : ""}`}>Other…</div>
          <div className="text-xs text-subtle">Region, system, station{esi ? ", structure" : ""}</div>
        </button>
      </div>
      {other && (
        <div className="space-y-3 border border-border bg-surface-2 p-3">
          <Search kind="hubs" placeholder="Find a region, system, station or structure…" onPick={(h) => onChange(h.id, h.name)} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Market id" hint={`Now ${KIND_LABEL[kind]}. Or paste an id: a structure's is in its chat link (showinfo:35826//1037962518481).`}>
              <Input type="number" value={hubId} onChange={(e) => onChange(Number(e.target.value), hubName)} className="font-mono" />
            </Field>
            <Field label="Shown as">
              <Input value={hubName} onChange={(e) => onChange(hubId, e.target.value)} />
            </Field>
          </div>
          {!esi && <p className="text-xs text-subtle">Fuzzwork covers the main hubs and regions; smaller stations may have no prices there. ESI reads any market.</p>}
        </div>
      )}
      <p className="text-xs text-subtle">{note}</p>
    </div>
  );
}

/** A program's market: the site's, or its own. */
function ProgramMarket({ value, market, onChange }: { value: ProgramForm; market: Options["market"]; onChange: (id: number | null, name: string) => void }) {
  if (market.source === "janice") {
    return (
      <Field label="Market">
        <p className="text-sm text-muted">Jita 4-4: the Janice price source prices nowhere else. Switch the source in the buyback settings to pick another market.</p>
      </Field>
    );
  }
  const own = value.hub_id != null;
  return (
    <div className="space-y-3">
      <div className="border border-border px-3">
        <SwitchRow
          label={`Price at the site's market (${market.hub_name})`}
          description="Off: pick a market for this program. Sellers see which one on the program and on every quote."
          checked={!own}
          onCheckedChange={(v) => (v ? onChange(null, "") : onChange(market.hub_id, market.hub_name))}
        />
      </div>
      {own && (
        <HubPicker
          label="This program's market"
          hubs={market.hubs}
          hubId={value.hub_id!}
          hubName={value.hub_name}
          esi={market.source === "esi"}
          onChange={onChange}
          note={hubKind(value.hub_id!) === "structure"
            ? "A player structure's market is read with the login of the character contracts go to, so it must be able to dock there and use the market."
            : `Prices come from ${market.source_name}, like the site's.`}
        />
      )}
    </div>
  );
}

export function SettingsPage() {
  const qc = useQueryClient();
  const key = ["buyback", "settings"];
  const { data } = useQuery({ queryKey: key, queryFn: () => api.get<Settings>(`${BASE}/settings`) });
  const [form, setForm] = useState<SettingsForm | null>(null);
  const value: SettingsForm | null = form ?? (data ? { ...data, janice_api_key: "", esi_character_id: data.esi_character?.id ?? null } : null);
  const set = (patch: Partial<SettingsForm>) => value && setForm({ ...value, ...patch });
  const save = useMutation({
    mutationFn: (s: SettingsForm) => api.put<Settings>(`${BASE}/settings`, s),
    onSuccess: (s) => {
      qc.setQueryData(key, s);
      setForm(null);
      qc.invalidateQueries({ queryKey: ["buyback"] });
      toast.success("Saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const refresh = useMutation({
    mutationFn: () => api.post<{ refreshed: number | null; queued?: boolean }>(`${BASE}/settings/refresh-prices`),
    onSuccess: (r) => toast.success(r.queued ? "Reading the market now; it takes a minute or two" : `${r.refreshed} prices refreshed`),
    onError: (e: Error) => toast.error(e.message),
  });
  if (!value) return <Skeleton className="h-96" />;
  const kind = hubKind(value.hub_id);
  const esi = value.price_source === "esi";
  return (
    <div>
      <BackLink to={MANAGE}>Programs</BackLink>
      <PageHeader
        icon={<SettingsIcon />}
        title="Buyback settings"
        description="Prices and tracking for every program."
        actions={
          <>
            <Button onClick={() => refresh.mutate()} loading={refresh.isPending} disabled={!!form}>
              <Refresh /> {esi ? "Read the market now" : `Refresh ${num(value.prices_stored)} prices`}
            </Button>
            <Button variant="primary" disabled={!form} loading={save.isPending} onClick={() => form && save.mutate(form)}>Save</Button>
          </>
        }
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Prices" description="Where items are priced before each program's tax." />
          <CardBody className="space-y-5">
            <Field label="Source">
              <Segmented
                value={value.price_source}
                onChange={(v) => set({ price_source: v })}
                options={[{ value: "esi", label: "ESI" }, { value: "fuzzwork", label: "Fuzzwork" }, { value: "janice", label: "Janice" }]}
              />
            </Field>
            <p className="text-xs text-muted">
              {esi && "Straight from CCP (recommended): the whole market is read every 30 minutes (a few hundred pages for Jita) and quotes use what was read. Also reads player structure markets."}
              {value.price_source === "fuzzwork" && "A free third-party site that reads EVE's markets. Prices are fetched when a quote needs them, up to 200 items a request."}
              {value.price_source === "janice" && "Janice prices Jita 4-4 and needs an API key (ask its author)."}
            </p>
            {value.price_source !== "janice" ? (
              <HubPicker
                hubs={value.hubs}
                hubId={value.hub_id}
                hubName={value.hub_name}
                esi={esi}
                onChange={(hub_id, hub_name) => set({ hub_id, hub_name })}
                note="Programs use it unless they pick their own market. Changing it drops its stored prices; they're read again from the new hub."
              />
            ) : (
              <Field label="Janice API key" hint={value.janice_key_set ? "A key is stored. Type a new one to replace it, or - to remove it." : undefined}>
                <Input type="password" value={value.janice_api_key} onChange={(e) => set({ janice_api_key: e.target.value })} placeholder={value.janice_key_set ? "••••••••" : ""} autoComplete="off" />
              </Field>
            )}
            {value.price_source === "fuzzwork" && kind === "structure" && <p className="text-sm text-danger-fg">Only ESI can read player structures.</p>}
            {esi && kind === "structure" && (
              <Field label="Read with" hint="One of your characters that can dock there and use its market. It must stay logged in here.">
                <Select value={value.esi_character_id ?? ""} onChange={(e) => set({ esi_character_id: Number(e.target.value) || null })}>
                  <option value="">Pick a character…</option>
                  {value.esi_character && !value.characters.some((c) => c.id === value.esi_character!.id) && (
                    <option value={value.esi_character.id}>{value.esi_character.name}</option>
                  )}
                  {value.characters.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}{c.can_read ? "" : " - login needed"}</option>
                  ))}
                </Select>
              </Field>
            )}
            {esi && data?.price_source === "esi" && (
              <p className="text-xs text-muted">
                {data.market_pulled_at ? <>Last read {timeAgo(data.market_pulled_at)}: {data.market_note}</> : data.market_note || "Not read yet; the first read starts within a minute."}
              </p>
            )}
            {data && data.markets.length > 1 && (
              <div className="space-y-1.5">
                <div className="text-[13px] font-medium text-text">Programs' own markets</div>
                <ul className="divide-y divide-border border border-border text-sm">
                  {data.markets.slice(1).map((m) => (
                    <li key={m.id} className="px-3 py-2">
                      <div className="flex flex-wrap justify-between gap-2">
                        <span className="font-medium">{m.name}</span>
                        <span className="text-xs text-subtle">{m.programs.join(", ")}</span>
                      </div>
                      <div className="text-xs text-muted">
                        {num(m.prices)} prices
                        {data.price_source === "esi" && <> · {m.pulled_at ? <>read {timeAgo(m.pulled_at)}{m.note && `: ${m.note}`}</> : m.note || "not read yet"}</>}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="border border-border px-3">
              <SwitchRow label="Best order instead of the top 5% average" description="Instant prices move faster and are easier to manipulate." checked={value.instant_prices} onCheckedChange={(v) => set({ instant_prices: v })} />
            </div>
            {!esi && (
              <Field label="Maximum price age">
                <div className="flex items-center gap-2">
                  <Input type="number" value={value.price_max_age_hours} onChange={(e) => set({ price_max_age_hours: Number(e.target.value) })} className="w-28 font-mono" />
                  <span className="text-sm text-subtle">hours</span>
                </div>
              </Field>
            )}
            <p className="text-xs text-subtle">Changing the source, market or price kind clears the stored prices; they're read again as needed.</p>
          </CardBody>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Manipulation guard"
              description={`Every market price is checked against what the item actually traded for lately${data?.history_region ? ` in ${data.history_region}` : ""}, so a propped-up order can't make you overpay.`}
            />
            <CardBody className="space-y-5">
              <div className="border border-border px-3">
                <SwitchRow label="Check prices against recent trading" checked={value.guard_enabled} onCheckedChange={(v) => set({ guard_enabled: v })} />
              </div>
              {value.guard_enabled && (
                <>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <NumberField label="Suspect above" value={value.guard_threshold} onChange={(n) => set({ guard_threshold: n })} step={5} suffix="% off" />
                    <NumberField label="Average over" value={value.guard_days} onChange={(n) => set({ guard_days: n })} suffix="days" />
                    <NumberField label="Trusted if it traded on" value={value.guard_min_days} onChange={(n) => set({ guard_min_days: n })} suffix="days" />
                  </div>
                  <ul className="space-y-1.5 text-sm text-muted">
                    <li>
                      A price more than <span className="font-mono text-text">{value.guard_threshold}%</span> above the {value.guard_days}-day average is suspect.
                    </li>
                    <li>If the item traded on {value.guard_min_days} or more of those days, the average is used instead.</li>
                    <li>If it rarely trades, the lower of the two is used and the item is checked by hand, like the manual review list.</li>
                  </ul>
                  <div className="border border-border px-3">
                    <SwitchRow
                      label="Also prices far below the average"
                      description="Off by default: buy prices normally sit below the average, and a low price only costs the seller. On, sellers get the average when the market dips."
                      checked={value.guard_both_ways}
                      onCheckedChange={(v) => set({ guard_both_ways: v })}
                    />
                  </div>
                  {data && !data.history_region && <p className="text-sm text-warning-fg">The market's region isn't known yet, so prices aren't checked.</p>}
                </>
              )}
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Quotes and tracking" />
            <CardBody className="space-y-5">
              <Field label="Tracking prefix" hint="Starts every tracking number (programs can have their own).">
                <Input value={value.tracking_prefix} onChange={(e) => set({ tracking_prefix: e.target.value })} className="w-40 font-mono" />
              </Field>
              <Field label="Remove quotes nobody contracted after" hint="0 keeps them.">
                <div className="flex items-center gap-2">
                  <Input type="number" value={value.unlinked_purge_hours} onChange={(e) => set({ unlinked_purge_hours: Number(e.target.value) })} className="w-28 font-mono" />
                  <span className="text-sm text-subtle">hours</span>
                </div>
              </Field>
              <div className="divide-y divide-border border border-border px-3">
                <SwitchRow label="All or nothing" description="A paste with any item a program doesn't buy gets no quote at all." checked={value.reject_disallowed} onCheckedChange={(v) => set({ reject_disallowed: v })} />
                <SwitchRow label="Private quotes" description="Only the seller and the program's managers can open a quote. Off: any member with the tracking number." checked={value.restrict_quotes} onCheckedChange={(v) => set({ restrict_quotes: v })} />
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

// --- dashboard ------------------------------------------------------------------------------------------------------

export function ManagerWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ["buyback", "manage"],
    queryFn: () => api.get<{ programs: ManagedProgram[] }>(`${BASE}/manage`),
    refetchInterval: 300_000,
  });
  if (isLoading || !data) return <Skeleton className="h-16" />;
  const open = data.programs.reduce((n, p) => n + p.open, 0);
  const problems = data.programs.reduce((n, p) => n + p.problems, 0);
  const value = data.programs.reduce((n, p) => n + p.open_value, 0);
  return (
    <Link to={MANAGE} className="block">
      <div className="flex items-end justify-between gap-6">
        <div>
          <div className="text-xs text-muted">Buyback contracts to accept</div>
          <div className="mt-1 font-mono text-3xl font-semibold tabular-nums">{open}</div>
          <div className="text-xs text-subtle">{isk(value)}</div>
        </div>
        {problems > 0 ? <Badge tone="danger">{problems} need a look</Badge> : <Badge tone="success">All match</Badge>}
      </div>
    </Link>
  );
}

