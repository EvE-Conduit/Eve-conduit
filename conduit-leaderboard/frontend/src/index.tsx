import {
  Alert, api, Avatar, Badge, Button, Card, CardBody, CardHeader, cn, ConfirmDialog, definePlugin, Dialog, EmptyState, Field, Input,
  isk, num, PageHeader, Select, Skeleton, sp, StatCard, Switch, SwitchRow, TabPanel, Table, Tabs, Td, Th, THead, toast, Tooltip, Tr,
  useCurrentUser, useHasPerm,
} from "@conduit/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Fragment, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";

import { ArrowLeft, CategoryIcon, Chevron, Eye, EyeOff, Medal, Settings, Trophy, Users } from "./icons";
import type { Award, Board, Category, Entry, MedalCounts, Medals, MyRanks, Overview, Periods, Settings as LeaderboardSettings } from "./types";

const BASE = "/api/p/leaderboard";

// --- helpers ------------------------------------------------------------------------------------------------

/** A score in the category's unit. */
function score(value: number, unit: Category["unit"] | "", full = false) {
  if (unit === "isk") return isk(value, { full });
  if (unit === "sp") return sp(value);
  return num(value);
}

function extra(c: Category, value: number) {
  if (!c.extra_label) return "";
  return `${score(value, c.extra_unit)} ${c.extra_label}`;
}

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

/** Medal colours are what they are in every theme; the text next to them uses the theme's tokens. */
const MEDAL = { 1: "#d9a21b", 2: "#a3a9b4", 3: "#b87333" } as const;
const MEDAL_NAME = { 1: "Gold", 2: "Silver", 3: "Bronze" } as const;

function RankBadge({ rank, className }: { rank: number; className?: string }) {
  if (rank <= 3) {
    return (
      <span className={cn("inline-grid size-7 place-items-center", className)} style={{ color: MEDAL[rank as 1 | 2 | 3] }} title={`${MEDAL_NAME[rank as 1 | 2 | 3]} · ${ordinal(rank)}`}>
        <Medal className="size-5" />
      </span>
    );
  }
  return <span className={cn("inline-grid size-7 place-items-center font-mono text-sm tabular-nums text-muted", className)}>{rank}</span>;
}

function MedalRow({ counts, size = "md" }: { counts: MedalCounts; size?: "sm" | "md" }) {
  const items = [[1, counts.gold], [2, counts.silver], [3, counts.bronze]] as const;
  return (
    <span className={cn("inline-flex items-center gap-2.5 font-mono tabular-nums", size === "sm" ? "text-xs" : "text-sm")}>
      {items.map(([rank, n]) => (
        <span key={rank} className={cn("inline-flex items-center gap-1", n === 0 && "text-subtle")} title={`${n} ${MEDAL_NAME[rank].toLowerCase()}`}>
          <span style={{ color: n ? MEDAL[rank] : undefined }}><Medal className={size === "sm" ? "size-3.5" : "size-4"} /></span>
          {n}
        </span>
      ))}
    </span>
  );
}

// --- period and corporation, kept in the URL so links keep them ------------------------------------------------

function usePeriods() {
  return useQuery({ queryKey: ["leaderboard", "periods"], queryFn: () => api.get<Periods>(`${BASE}/periods`), staleTime: 60_000 });
}

function useFilters() {
  const [params, setParams] = useSearchParams();
  const { data } = usePeriods();
  const period = params.get("period") || data?.current || "";
  const corporation = params.get("corporation") || "";
  const set = (patch: { period?: string; corporation?: string }) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    setParams(next, { replace: true });
  };
  const query = `period=${encodeURIComponent(period)}${corporation ? `&corporation=${corporation}` : ""}`;
  return { period, corporation, set, query, ready: !!period };
}

function Filters() {
  const { data } = usePeriods();
  const { period, corporation, set } = useFilters();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={period}
        onChange={(e) => set({ period: e.target.value })}
        aria-label="Period"
        className="w-44"
        options={(data?.periods ?? [{ key: period, label: period }]).map((p) => ({ value: p.key, label: p.key === data?.current ? `${p.label} · so far` : p.label }))}
      />
      {(data?.corporations.length ?? 0) > 1 && (
        <Select
          value={corporation}
          onChange={(e) => set({ corporation: e.target.value })}
          aria-label="Corporation"
          className="w-52"
          options={[{ value: "", label: "Every corporation" }, ...(data?.corporations ?? []).map((c) => ({ value: String(c.id), label: `${c.name} [${c.ticker}]` }))]}
        />
      )}
    </div>
  );
}

// --- hiding yourself -------------------------------------------------------------------------------------------

function useHide() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (hidden: boolean) => api.put<{ hidden: boolean }>(`${BASE}/me/hidden`, { hidden }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["leaderboard"] });
      toast.success(r.hidden ? "You're off the boards. Only you can see your own figures now." : "You're back on the boards");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

function HiddenNotice({ hidden }: { hidden: boolean }) {
  const hide = useHide();
  if (!hidden) return null;
  return (
    <Alert tone="info" icon={<EyeOff />} title="You're hidden from the leaderboard" action={<Button size="sm" variant="ghost" loading={hide.isPending} onClick={() => hide.mutate(false)}><Eye /> Show me</Button>}>
      Other members don't see you on any board. Your own figures still show here, just for you.
    </Alert>
  );
}

// --- overview ----------------------------------------------------------------------------------------------------

function Podium({ entries, category }: { entries: Entry[]; category: Category }) {
  if (entries.length === 0) return <p className="py-6 text-center text-sm text-muted">Nobody on the board yet.</p>;
  const [first, ...rest] = entries;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 rounded-lg border border-border bg-bg/40 p-3">
        <div className="relative shrink-0">
          <Avatar src={first.portrait} name={first.name} size="lg" />
          <span className="absolute -bottom-1 -right-1 grid size-6 place-items-center rounded-full bg-surface shadow-e1" style={{ color: MEDAL[1] }}>
            <Medal className="size-4" />
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium">{first.name}</div>
          <div className="truncate text-xs text-subtle">{first.corporation ? `[${first.corporation.ticker}]` : ""} {extra(category, first.extra)}</div>
        </div>
        <div className="shrink-0 text-right font-mono text-lg font-semibold tabular-nums">{score(first.score, category.unit)}</div>
      </div>
      {rest.map((e) => (
        <div key={e.user_id} className="flex items-center gap-3 px-1">
          <RankBadge rank={e.rank} />
          <Avatar src={e.portrait} name={e.name} size="sm" />
          <div className="min-w-0 flex-1 truncate text-sm">{e.name}</div>
          <div className="shrink-0 font-mono text-sm tabular-nums text-muted">{score(e.score, category.unit)}</div>
        </div>
      ))}
    </div>
  );
}

function OverviewPage() {
  const canManage = useHasPerm("leaderboard.manage_leaderboard");
  const { query, ready } = useFilters();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const hide = useHide();
  const { data, isLoading } = useQuery({ queryKey: ["leaderboard", "overview", query], queryFn: () => api.get<Overview>(`${BASE}/overview?${query}`), enabled: ready });
  const { data: medals } = useQuery({ queryKey: ["leaderboard", "me"], queryFn: () => api.get<MyRanks>(`${BASE}/me`) });

  return (
    <>
      <PageHeader
        eyebrow="Leaderboard"
        title="Who's on top"
        icon={<Trophy />}
        description="Members ranked by what their characters did. Alts count for their main."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Filters />
            <Link to="/p/leaderboard/medals">
              <Button variant="ghost"><Medal /> Medals</Button>
            </Link>
            {data && !data.hidden && (
              <Tooltip content="Take yourself off every board. You can come back any time.">
                <Button variant="ghost" loading={hide.isPending} onClick={() => hide.mutate(true)} aria-label="Hide me from the leaderboard"><EyeOff /></Button>
              </Tooltip>
            )}
            {canManage && (
              <Button onClick={() => setSettingsOpen(true)}><Settings /> Settings</Button>
            )}
          </div>
        }
      />

      {isLoading || !data ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-64" />)}</div>
      ) : (
        <div className="space-y-6">
          <HiddenNotice hidden={data.hidden} />
          {medals && (medals.medals.gold + medals.medals.silver + medals.medals.bronze > 0) && (
            <div className="flex items-center gap-3 text-sm text-muted">
              <span>Your medals</span>
              <MedalRow counts={medals.medals} />
            </div>
          )}
          {data.boards.length === 0 ? (
            <Card><EmptyState icon={<Trophy />} title="No boards are switched on" description={canManage ? "Pick some categories in the settings." : "Ask an administrator to pick some categories."} /></Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {data.boards.map((b) => (
                <Card key={b.category.key} className="flex flex-col">
                  <CardHeader
                    title={<span className="inline-flex items-center gap-2"><CategoryIcon category={b.category.key} className="size-4 text-accent-ink" />{b.category.label}</span>}
                    description={b.category.all_time ? `${b.category.description} Always all time.` : b.category.description}
                  />
                  <CardBody className="flex-1">
                    <Podium entries={b.podium} category={b.category} />
                  </CardBody>
                  <Link
                    to={`/p/leaderboard/${b.category.key}?${query}`}
                    className="flex items-center justify-between gap-3 border-t border-border px-card py-3 text-sm transition-colors hover:bg-hover"
                  >
                    <span className={b.me ? "text-text" : "text-muted"}>
                      {b.me ? (
                        <>You're <span className="font-semibold">{ordinal(b.me.rank)}</span> of {b.participants} · <span className="font-mono tabular-nums">{score(b.me.score, b.category.unit)}</span></>
                      ) : (
                        `${b.participants} member${b.participants === 1 ? "" : "s"} on the board`
                      )}
                    </span>
                    <span className="inline-flex items-center gap-1 text-accent-ink">Full board <Chevron open={false} className="size-3.5" /></span>
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
      {settingsOpen && <SettingsDialog onClose={() => setSettingsOpen(false)} />}
    </>
  );
}

// --- one board ----------------------------------------------------------------------------------------------------

function BoardPage() {
  const { category = "" } = useParams();
  const user = useCurrentUser();
  const { query, ready } = useFilters();
  const [open, setOpen] = useState<Set<number>>(new Set());
  const toggle = (id: number) => setOpen((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const { data, isLoading, error } = useQuery({
    queryKey: ["leaderboard", "board", category, query],
    queryFn: () => api.get<Board>(`${BASE}/board/${category}?${query}`),
    enabled: ready && !!category,
  });

  if (error) {
    return (
      <>
        <PageHeader eyebrow="Leaderboard" title="Board" icon={<Trophy />} actions={<Link to="/p/leaderboard"><Button variant="ghost"><ArrowLeft /> Leaderboard</Button></Link>} />
        <Card><EmptyState icon={<Trophy />} title="No such board" description="It may have been switched off." /></Card>
      </>
    );
  }

  const c = data?.category;
  const beyond = data && data.me && data.me.rank > data.entries.length ? data.me : null;
  const row = (e: Entry, mine: boolean) => (
    <Fragment key={e.user_id}>
      <Tr interactive={e.characters.length > 0} onClick={e.characters.length > 0 ? () => toggle(e.user_id) : undefined} className={mine ? "bg-accent-soft/40" : undefined}>
        <Td><RankBadge rank={e.rank} /></Td>
        <Td>
          <div className="flex items-center gap-3">
            {e.characters.length > 0 ? <Chevron open={open.has(e.user_id)} className="size-4 text-subtle" /> : <span className="size-4" />}
            <Avatar src={e.portrait} name={e.name} size="sm" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate font-medium">{e.name}</span>
                {mine && <Badge tone="accent">You</Badge>}
              </div>
              {e.corporation && <div className="text-xs text-subtle">{e.corporation.name} [{e.corporation.ticker}]</div>}
            </div>
          </div>
        </Td>
        <Td numeric className="font-semibold">{score(e.score, c!.unit, true)}</Td>
        <Td numeric className="text-muted">{c!.extra_label ? score(e.extra, c!.extra_unit, true) : ""}</Td>
      </Tr>
      {open.has(e.user_id) &&
        e.characters.map((ch) => (
          <Tr key={`${e.user_id}-${ch.id}`} className="bg-bg/40">
            <Td />
            <Td className="pl-16 text-muted">{ch.name}</Td>
            <Td numeric className="text-muted">{score(ch.score, c!.unit, true)}</Td>
            <Td />
          </Tr>
        ))}
    </Fragment>
  );

  return (
    <>
      <PageHeader
        eyebrow="Leaderboard"
        title={c ? c.label : "Board"}
        icon={c ? <CategoryIcon category={c.key} /> : <Trophy />}
        description={c ? (c.all_time ? `${c.description} This board is always all time.` : c.description) : undefined}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Filters />
            <Link to={`/p/leaderboard?${query}`}>
              <Button variant="ghost"><ArrowLeft /> All boards</Button>
            </Link>
          </div>
        }
      />
      {isLoading || !data || !c ? (
        <Skeleton className="h-96" />
      ) : (
        <div className="space-y-6">
          <HiddenNotice hidden={data.hidden} />
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="On the board" value={data.participants} icon={<Users />} hint={data.period.label} />
            <StatCard label={`Total ${c.label.toLowerCase()}`} value={score(data.total, c.unit)} mono icon={<CategoryIcon category={c.key} />} hint="everyone together" />
            <StatCard
              label="Your place"
              value={data.me ? ordinal(data.me.rank) : "—"}
              mono
              icon={<Trophy />}
              tone={data.me && data.me.rank <= 3 ? "success" : undefined}
              hint={data.me ? score(data.me.score, c.unit, true) : data.hidden ? "you're hidden" : "nothing counted yet"}
            />
          </div>
          <Card>
            {data.entries.length === 0 ? (
              <EmptyState icon={<CategoryIcon category={c.key} />} title={`Nobody has ${c.label.toLowerCase()} for ${data.period.label} yet`} description="Figures come from the character sheet's syncs; give it an hour after new activity." />
            ) : (
              <Table>
                <THead>
                  <tr>
                    <Th className="w-12">#</Th>
                    <Th>Member</Th>
                    <Th align="right">{c.label}</Th>
                    <Th align="right">{c.extra_label}</Th>
                  </tr>
                </THead>
                <tbody>
                  {data.entries.map((e) => row(e, e.user_id === user?.id))}
                  {beyond && (
                    <>
                      <tr><td colSpan={4} className="py-1 text-center text-xs text-subtle">· · ·</td></tr>
                      {row(beyond, true)}
                    </>
                  )}
                </tbody>
              </Table>
            )}
          </Card>
          {data.participants > data.entries.length && (
            <p className="text-xs text-subtle">Showing the top {data.entries.length} of {data.participants}.</p>
          )}
        </div>
      )}
    </>
  );
}

// --- medals ---------------------------------------------------------------------------------------------------------

function MedalsPage() {
  const qc = useQueryClient();
  const canManage = useHasPerm("leaderboard.manage_leaderboard");
  const user = useCurrentUser();
  const { data: periods } = usePeriods();
  const [confirm, setConfirm] = useState(false);
  const { data, isLoading } = useQuery({ queryKey: ["leaderboard", "medals"], queryFn: () => api.get<Medals>(`${BASE}/medals`) });
  const lastMonth = periods?.periods[1];
  const lastMonthDone = !!data && !!lastMonth && data.awards.some((a) => a.month === lastMonth.key);
  const award = useMutation({
    mutationFn: () => api.post<{ awarded: number }>(`${BASE}/medals/${lastMonth!.key}/award`),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["leaderboard"] });
      toast.success(r.awarded ? `${r.awarded} medal${r.awarded === 1 ? "" : "s"} handed out for ${lastMonth!.label}` : `Nobody scored in ${lastMonth!.label}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const byMonth = new Map<string, Award[]>();
  for (const a of data?.awards ?? []) byMonth.set(a.month, [...(byMonth.get(a.month) ?? []), a]);

  return (
    <>
      <PageHeader
        eyebrow="Leaderboard"
        title="Medals"
        icon={<Medal />}
        description="The top three of every board get a medal when the month ends."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/p/leaderboard"><Button variant="ghost"><ArrowLeft /> Leaderboard</Button></Link>
            {canManage && lastMonth && !lastMonthDone && (
              <Button onClick={() => setConfirm(true)}><Medal /> Award {lastMonth.label} now</Button>
            )}
          </div>
        }
      />
      {isLoading || !data ? (
        <Skeleton className="h-80" />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
          <Card className="h-fit">
            <CardHeader title="Hall of fame" description="Most medals, gold first." />
            {data.hall_of_fame.length === 0 ? (
              <CardBody className="text-sm text-muted">No medals yet. They're handed out the day after a month ends.</CardBody>
            ) : (
              <ul className="divide-y divide-border">
                {data.hall_of_fame.map((h, i) => (
                  <li key={h.user_id} className={cn("flex items-center gap-3 px-card py-2.5 text-sm", h.user_id === user?.id && "bg-accent-soft/40")}>
                    <span className="w-5 font-mono text-xs tabular-nums text-subtle">{i + 1}</span>
                    <Avatar src={h.portrait} name={h.name} size="sm" />
                    <span className="min-w-0 flex-1 truncate font-medium">{h.name}</span>
                    <MedalRow counts={h} size="sm" />
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <div className="space-y-4">
            {byMonth.size === 0 ? (
              <Card><EmptyState icon={<Medal />} title="Nothing awarded yet" description={canManage && lastMonth ? `You can hand out ${lastMonth.label}'s medals now, or wait for the daily job.` : undefined} /></Card>
            ) : (
              [...byMonth.entries()].map(([month, awards]) => (
                <Card key={month}>
                  <CardHeader title={awards[0].label} />
                  <Table>
                    <THead>
                      <tr>
                        <Th>Board</Th>
                        <Th className="w-12" />
                        <Th>Member</Th>
                        <Th align="right">Score</Th>
                      </tr>
                    </THead>
                    <tbody>
                      {awards.map((a) => (
                        <Tr key={a.id} className={a.user_id === user?.id ? "bg-accent-soft/40" : undefined}>
                          <Td>
                            <span className="inline-flex items-center gap-2"><CategoryIcon category={a.category.key} className="size-4 text-subtle" />{a.category.label}</span>
                          </Td>
                          <Td><RankBadge rank={a.rank} /></Td>
                          <Td>
                            <span className="inline-flex items-center gap-2">
                              <Avatar src={a.portrait} name={a.name} size="sm" />
                              <span className="font-medium">{a.name}</span>
                            </span>
                          </Td>
                          <Td numeric>{score(a.score, a.category.unit, true)}</Td>
                        </Tr>
                      ))}
                    </tbody>
                  </Table>
                </Card>
              ))
            )}
          </div>
        </div>
      )}
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={`Award the medals for ${lastMonth?.label ?? "last month"}?`}
        description="The top three of every board get their medal and a notification. This can't be undone, and the daily job would do the same tomorrow morning."
        confirmLabel={<><Medal /> Award</>}
        onConfirm={() => award.mutateAsync()}
      />
    </>
  );
}

// --- settings (leaderboard.manage_leaderboard) -------------------------------------------------------------------------

function SettingsDialog({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["leaderboard", "settings"], queryFn: () => api.get<LeaderboardSettings>(`${BASE}/settings`) });
  const [form, setForm] = useState<LeaderboardSettings | null>(null);
  const value = form ?? data ?? null;
  const save = useMutation({
    mutationFn: (s: LeaderboardSettings) => api.put<LeaderboardSettings>(`${BASE}/settings`, s),
    onSuccess: (s) => {
      qc.setQueryData(["leaderboard", "settings"], s);
      qc.invalidateQueries({ queryKey: ["leaderboard"] });
      toast.success("Saved");
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const set = (patch: Partial<LeaderboardSettings>) => value && setForm({ ...value, ...patch });
  const allOn = !!value && value.categories.length === 0;
  const isOn = (key: string) => !!value && (allOn || value.categories.includes(key));
  const toggleCategory = (key: string, on: boolean) => {
    if (!value) return;
    const current = allOn ? value.available_categories.map((c) => c.key) : value.categories;
    set({ categories: on ? [...current, key] : current.filter((k) => k !== key) });
  };

  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title="Leaderboard settings"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!value} loading={save.isPending} onClick={() => value && save.mutate(value)}>Save</Button>
        </>
      }
    >
      {!value ? (
        <Skeleton className="h-64" />
      ) : (
        <Tabs variant="pills" className="space-y-4" items={[{ value: "boards", label: "Boards" }, { value: "who", label: "Who competes" }, { value: "display", label: "Display" }]}>
          <TabPanel value="boards">
            <p className="mb-3 text-xs text-muted">Which boards members see. Untick everything to show them all.</p>
            <div className="divide-y divide-border rounded-lg border border-border">
              {value.available_categories.map((c) => (
                <label key={c.key} className={cn("flex items-center justify-between gap-3 px-3 py-2.5 text-sm", c.available ? "cursor-pointer" : "opacity-60")}>
                  <span className="flex min-w-0 items-center gap-3">
                    <CategoryIcon category={c.key} className="size-4 shrink-0 text-subtle" />
                    <span className="min-w-0">
                      <span className="font-medium">{c.label}</span>
                      <span className="block truncate text-xs text-muted">{c.available ? c.description : "Needs the Fleets plugin switched on."}</span>
                    </span>
                  </span>
                  <Switch checked={isOn(c.key) && c.available} disabled={!c.available} onCheckedChange={(on) => toggleCategory(c.key, on)} />
                </label>
              ))}
            </div>
          </TabPanel>
          <TabPanel value="who">
            <p className="mb-3 text-xs text-muted">Members whose main character is in these corporations compete. None ticked means every member.</p>
            {value.available_corporations.length === 0 ? (
              <p className="text-sm text-subtle">No member has a main character in a corporation yet.</p>
            ) : (
              <div className="divide-y divide-border rounded-lg border border-border">
                {value.available_corporations.map((c) => (
                  <label key={c.id} className="flex cursor-pointer items-center justify-between gap-3 px-3 py-2.5 text-sm">
                    <span>{c.name} <span className="text-subtle">[{c.ticker}]</span></span>
                    <Switch checked={value.corporations.includes(c.id)} onCheckedChange={(on) => set({ corporations: on ? [...value.corporations, c.id] : value.corporations.filter((x) => x !== c.id) })} />
                  </label>
                ))}
              </div>
            )}
          </TabPanel>
          <TabPanel value="display">
            <div className="space-y-5">
              <Field label="Places on a board" hint="Members further down still see their own place.">
                <div>
                  <Input type="number" min={3} max={200} value={value.places} onChange={(e) => set({ places: Number(e.target.value) })} className="w-28 font-mono" />
                </div>
              </Field>
              <SwitchRow label="Show characters" description="Members can open a row to see which of someone's characters earned the score. Off shows only totals." checked={value.show_characters} onCheckedChange={(v) => set({ show_characters: v })} />
              <SwitchRow label="Monthly medals" description="The top three of every board get a medal and a notification the day after the month ends." checked={value.medals} onCheckedChange={(v) => set({ medals: v })} />
            </div>
          </TabPanel>
        </Tabs>
      )}
    </Dialog>
  );
}

// --- dashboard widget ------------------------------------------------------------------------------------------------

function RanksWidget() {
  const { data, isLoading } = useQuery({ queryKey: ["leaderboard", "me"], queryFn: () => api.get<MyRanks>(`${BASE}/me`) });
  if (isLoading) return <Skeleton className="h-24" />;
  if (!data) return null;
  const placed = data.ranks.filter((r) => r.rank !== null);
  return (
    <Link to="/p/leaderboard" className="block">
      <div className="flex items-start justify-between gap-4">
        <div className="text-xs text-muted">{data.period.label}</div>
        <MedalRow counts={data.medals} size="sm" />
      </div>
      {data.hidden ? (
        <p className="mt-2 text-sm text-muted">You're hidden from the boards.</p>
      ) : placed.length === 0 ? (
        <p className="mt-2 text-sm text-muted">Nothing counted for you yet this month.</p>
      ) : (
        <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
          {placed.slice(0, 6).map((r) => (
            <li key={r.category.key} className="flex items-center justify-between gap-2">
              <span className="inline-flex min-w-0 items-center gap-1.5 text-muted"><CategoryIcon category={r.category.key} className="size-3.5 shrink-0" /><span className="truncate">{r.category.label}</span></span>
              <span className={cn("font-mono tabular-nums", r.rank! <= 3 ? "font-semibold text-success-fg" : "")}>{ordinal(r.rank!)}</span>
            </li>
          ))}
        </ul>
      )}
    </Link>
  );
}

export default definePlugin({
  routes: [
    { path: "", Component: OverviewPage },
    { path: "medals", Component: MedalsPage },
    { path: ":category", Component: BoardPage },
  ],
  widgets: [{ id: "my-ranks", title: "Leaderboard", Component: RanksWidget, size: "sm", order: 45 }],
});
