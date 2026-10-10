// Pieces used by the members', the managers' and the public pages.
import { api, Badge, Button, Callout, cn, isk, num, Table, Td, Textarea, Th, THead, toast, Tooltip, Tr } from "@conduit/sdk";
import { useMutation } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Link } from "react-router";

import { Check, Copy, Eye, Pin, Warning } from "./icons";
import { type Appraisal, type ContractItem, type Guard, type Line, METHOD_LABEL, type Problem, type Program, type QuoteSummary, type RuleTerms, type SystemInfo, type Terms } from "./types";

export function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <Button
      size="xs"
      variant="ghost"
      aria-label={`${label}: ${value}`}
      onClick={() => {
        navigator.clipboard.writeText(value).then(
          () => {
            setDone(true);
            setTimeout(() => setDone(false), 1500);
          },
          () => toast.error("Couldn't copy; select it and copy by hand"),
        );
      }}
    >
      {done ? <Check /> : <Copy />} {done ? "Copied" : label}
    </Button>
  );
}

export function SystemText({ system }: { system: SystemInfo | null }) {
  if (!system) return null;
  const tone = system.security >= 0.5 ? "text-success-fg" : system.security > 0 ? "text-warning-fg" : "text-danger-fg";
  return (
    <span className="text-muted">
      {system.name} <span className={cn("font-mono text-xs", tone)}>{system.security.toFixed(1)}</span>
      <span className="text-subtle"> · {system.region}</span>
    </span>
  );
}

export function ItemCell({ icon, name, sub }: { icon: string | null; name: string; sub?: ReactNode }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      {icon ? <img src={icon} alt="" className="size-8 shrink-0 border border-border bg-bg" loading="lazy" /> : <div className="size-8 shrink-0 border border-border bg-bg" />}
      <div className="min-w-0">
        <div className="truncate font-medium">{name}</div>
        {sub && <div className="truncate text-xs text-subtle">{sub}</div>}
      </div>
    </div>
  );
}

const STATUS_TONE: Record<string, "neutral" | "accent" | "success" | "warning" | "danger" | "info"> = {
  quoted: "neutral",
  outstanding: "accent",
  in_progress: "accent",
  finished: "success",
  finished_issuer: "success",
  finished_contractor: "success",
  rejected: "danger",
  deleted: "neutral",
  expired: "warning",
  failed: "danger",
  reversed: "warning",
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  return <Badge tone={STATUS_TONE[status] ?? "neutral"}>{label ?? (status === "quoted" ? "No contract yet" : status)}</Badge>;
}

export function Problems({ problems, compact }: { problems: Problem[]; compact?: boolean }) {
  if (!problems.length) return compact ? <Badge tone="success">Matches its quote</Badge> : null;
  if (compact) {
    const severe = problems.filter((p) => p.severe).length;
    return (
      <Tooltip content={problems.map((p) => p.text).join(" ")}>
        <span>
          <Badge tone={severe ? "danger" : "warning"}>
            {severe ? `${severe} problem${severe === 1 ? "" : "s"}` : `${problems.length} note${problems.length === 1 ? "" : "s"}`}
          </Badge>
        </span>
      </Tooltip>
    );
  }
  return (
    <ul className="space-y-2">
      {problems.map((p) => (
        <li key={p.code} className={cn("flex items-start gap-2.5 border px-3 py-2 text-sm", p.severe ? "border-danger/40 bg-danger-soft text-danger-fg" : "border-warning/40 bg-warning-soft text-warning-fg")}>
          <Warning className="mt-0.5 size-4 shrink-0" />
          <span>{p.text}</span>
        </li>
      ))}
    </ul>
  );
}

const pct = (n: number) => `${Number.isInteger(n) ? n : n.toFixed(2)}%`;

/** What a program pays and how, in a few words each. */
export function ProgramFacts({ program }: { program: Program }) {
  const ore = [program.use_raw && "raw", program.use_compressed && "compressed", program.use_refined && `refined at ${pct(program.refining_rate)}`].filter(Boolean);
  const facts: ReactNode[] = [
    <>{program.prices.hub} {program.price_type === "split" ? "split" : program.price_type === "sell" ? "sell" : "buy"} price, less {pct(program.tax)}</>,
    program.allow_all_items ? "Buys any item" : "Only listed items",
    ore.length ? <>Ore & ice: best of {ore.join(", ")}</> : null,
    program.hauling_fuel_cost > 0 ? <>Hauling {isk(program.hauling_fuel_cost, { full: true })}/m³{program.compressed_volume ? " (compressed volume)" : ""}</> : null,
    program.price_density_threshold > 0 ? <>+{pct(program.price_density_tax)} under {isk(program.price_density_threshold)}/m³</> : null,
    program.t1_refined ? <>Tech I modules at {pct(program.t1_refining_rate)} reprocessed</> : null,
    program.blue_loot_npc || program.red_loot_npc ? <>{[program.blue_loot_npc && "Sleeper", program.red_loot_npc && "Triglavian"].filter(Boolean).join(" and ")} loot at NPC price</> : null,
    program.allow_unpacked ? "Takes assembled items" : "Packaged items only",
  ].filter(Boolean);
  return (
    <ul className="flex flex-wrap gap-1.5">
      {facts.map((f, i) => (
        <li key={i} className="border border-border bg-surface-2 px-2 py-1 text-xs text-muted">
          {f}
        </li>
      ))}
    </ul>
  );
}

export function PlacesList({ terms }: { terms: Terms }) {
  return (
    <ul className="space-y-1">
      {terms.locations.map((l) => (
        <li key={l.id} className="flex items-start gap-2 text-sm">
          <Pin className="mt-0.5 size-3.5 shrink-0 text-subtle" />
          <span>
            <span className="font-medium">{l.name}</span> <SystemText system={l.system} />
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Shown when the manipulation guard changed a line's price. */
function GuardBadge({ guard }: { guard: Guard | null }) {
  if (!guard || guard.used === "current") return null;
  if (guard.used === "materials") {
    return (
      <Tooltip content={`${guard.materials} of the minerals it refines into were priced far above their recent average, so their average was used.`}>
        <span><Badge tone="info" className="ml-1.5">averaged</Badge></span>
      </Tooltip>
    );
  }
  const off = guard.deviation != null ? `${guard.deviation > 0 ? "+" : ""}${guard.deviation}%` : "";
  const text =
    guard.used === "average"
      ? `The market says ${isk(guard.current, { full: true })}, ${off} off what it traded for lately (${isk(guard.average, { full: true })}). It trades often enough to trust that average, so it's used instead.`
      : `The market says ${isk(guard.current, { full: true })}, ${off} off what it traded for lately (${isk(guard.average, { full: true })}), and it rarely trades (${guard.days_traded} day${guard.days_traded === 1 ? "" : "s"} lately). The lower price is used and a manager checks it by hand.`;
  return (
    <Tooltip content={text}>
      <span><Badge tone={guard.used === "average" ? "info" : "warning"} className="ml-1.5">{guard.used === "average" ? "recent average" : "unusual price"}</Badge></span>
    </Tooltip>
  );
}

function UnitTip({ line }: { line: Line }) {
  const parts = [`${METHOD_LABEL[line.method ?? "market"]} ${isk(line.market_unit, { full: true })}`, `less ${pct(line.tax)}${line.density_tax ? " (incl. low value per m³)" : ""}`];
  if (line.hauling_unit > 0) parts.push(`less ${isk(line.hauling_unit, { full: true })} hauling`);
  const others = Object.entries(line.options).filter(([m]) => m !== line.method);
  if (others.length) parts.push(`(${others.map(([m, v]) => `${METHOD_LABEL[m as keyof typeof METHOD_LABEL]} ${isk(v, { full: true })}`).join(", ")})`);
  return <>{parts.join(", ")}</>;
}

export function LinesTable({ lines }: { lines: Line[] }) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <THead>
          <tr>
            <Th>Item</Th>
            <Th align="right">Quantity</Th>
            <Th>Valued as</Th>
            <Th align="right">Per unit</Th>
            <Th align="right">Value</Th>
          </tr>
        </THead>
        <tbody>
          {lines.map((l) => (
            <Tr key={l.type_id} className={cn(!l.accepted && "opacity-60")}>
              <Td>
                <ItemCell
                  icon={l.icon}
                  name={l.name}
                  sub={
                    l.watch ? (
                      <span className="inline-flex items-center gap-1 text-info-fg">
                        <Eye className="size-3" /> Checked by hand before it's accepted
                      </span>
                    ) : (
                      l.group
                    )
                  }
                />
              </Td>
              <Td numeric>{num(l.quantity)}</Td>
              <Td>
                {l.accepted ? (
                  <span className="text-sm">
                    {METHOD_LABEL[l.method ?? "market"]}
                    {l.method !== "fixed" && <span className="text-subtle"> · −{pct(l.tax)}</span>}
                    {l.density_tax && <Badge tone="warning" className="ml-1.5">low ISK/m³</Badge>}
                    <GuardBadge guard={l.guard} />
                  </span>
                ) : (
                  <Badge tone="danger">{l.reason}</Badge>
                )}
              </Td>
              <Td numeric>
                {l.accepted ? (
                  <Tooltip content={<UnitTip line={l} />}>
                    <span className="cursor-help underline decoration-dotted decoration-border-strong underline-offset-4">{isk(l.unit_price, { full: true })}</span>
                  </Tooltip>
                ) : (
                  "—"
                )}
              </Td>
              <Td numeric className="font-medium">{l.accepted ? isk(l.value, { full: true }) : "—"}</Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: ReactNode; children: ReactNode }) {
  return (
    <li className="grid grid-cols-[28px_1fr] gap-3">
      <span className="grid size-7 place-items-center border border-border-strong font-mono text-xs text-accent-ink">{n}</span>
      <div className="min-w-0">
        <div className="hud-label text-subtle">{title}</div>
        <div className="mt-1">{children}</div>
      </div>
    </li>
  );
}

/** The quote's total and, step by step, how to make the contract. */
export function ContractSteps({ quote }: { quote: QuoteSummary }) {
  const t = quote.terms;
  const price = String(Math.floor(quote.value));
  return (
    <div className="panel border-accent/40 p-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="hud-label text-subtle">You get</div>
          <div className="mt-1 font-mono text-[34px] font-semibold leading-none tabular-nums text-accent-ink">{isk(quote.value, { full: true })}</div>
          <div className="mt-1.5 text-xs text-muted">
            {quote.items} item{quote.items === 1 ? "" : "s"} · {num(quote.volume)} m³{quote.hub && <> · priced at {quote.hub}</>}
          </div>
        </div>
        {quote.flagged && (
          <Badge tone="info">
            <Eye className="size-3" /> Some items are checked by hand
          </Badge>
        )}
      </div>
      <ol className="mt-6 space-y-4">
        <Step n={1} title="Item exchange contract, private, to">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{t.assignee.name || "—"}</span>
            <span className="text-xs text-subtle">({t.assignee.kind})</span>
            {t.assignee.name && <CopyButton value={t.assignee.name} />}
          </div>
        </Step>
        <Step n={2} title={t.locations.length === 1 ? "Made at" : "Made at one of"}>
          <PlacesList terms={t} />
        </Step>
        <Step n={3} title="I will receive">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono font-medium tabular-nums">{Number(price).toLocaleString("en")} ISK</span>
            <CopyButton value={price} />
          </div>
        </Step>
        <Step n={4} title="Description (exactly this, nothing else)">
          <div className="flex flex-wrap items-center gap-2">
            <code className="border border-border bg-bg px-2 py-1 font-mono text-sm text-text">{quote.tracking_number}</code>
            <CopyButton value={quote.tracking_number} />
          </div>
        </Step>
        <Step n={5} title="Expiration">
          <span className="text-sm">{t.expiration_days} day{t.expiration_days === 1 ? "" : "s"}</span>
        </Step>
      </ol>
    </div>
  );
}

/** Paste box and result. `base` is the API the program lives under (members' or public). */
export function Calculator({ program, base, quoteLink }: { program: Program; base: string; quoteLink: (tracking: string) => string }) {
  const [text, setText] = useState("");
  const run = useMutation({
    mutationFn: () => api.post<Appraisal>(`${base}/programs/${program.id}/quote`, { text }),
    onError: (e: Error) => toast.error(e.message),
  });
  const result = run.data;
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
      <div className="space-y-4">
        <div className="panel p-4">
          <label htmlFor="bb-paste" className="hud-label text-subtle">Items to sell</label>
          <Textarea
            id="bb-paste"
            rows={result ? 5 : 12}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={"Select items in your inventory, Ctrl+C, and paste here.\nOr type them: Tritanium x 1000"}
            className="mt-2 font-mono text-xs"
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-subtle">The list view of your inventory, contracts, the mining ledger and typed lines all work.</p>
            <Button variant="primary" loading={run.isPending} disabled={!text.trim()} onClick={() => run.mutate()}>
              Get a quote
            </Button>
          </div>
        </div>
        {result && (
          <div className="panel">
            {result.unknown.length > 0 && (
              <Callout tone="warning" className="m-4" title={`Not recognised (${result.unknown.length})`}>
                {result.unknown.slice(0, 20).join(", ")}
                {result.unknown.length > 20 && "…"}
              </Callout>
            )}
            {result.lines.length > 0 ? <LinesTable lines={result.lines} /> : <p className="p-6 text-center text-sm text-muted">No items recognised.</p>}
          </div>
        )}
      </div>
      <div className="space-y-4">
        {result?.quote ? (
          <>
            <ContractSteps quote={result.quote} />
            <p className="text-xs text-subtle">
              The contract is checked against this quote when it arrives.{" "}
              <Link to={quoteLink(result.quote.tracking_number)} className="text-accent-ink hover:underline">
                Follow it here
              </Link>
              {result.rejected_count > 0 && <> · {result.rejected_count} item{result.rejected_count === 1 ? " isn't" : "s aren't"} bought; leave them out of the contract.</>}
            </p>
          </>
        ) : result ? (
          <Callout tone="danger" title="Nothing to contract">
            {result.blocked ?? "This program doesn't buy any of these items."}
          </Callout>
        ) : (
          <div className="panel space-y-4 p-5">
            <div>
              <div className="hud-label text-subtle">How it's priced</div>
              <div className="mt-2">
                <ProgramFacts program={program} />
              </div>
            </div>
            <div>
              <div className="hud-label text-subtle">Contracts go to</div>
              <div className="mt-1 text-sm font-medium">{program.terms.assignee.name || "—"}</div>
            </div>
            <div>
              <div className="hud-label text-subtle">At</div>
              <div className="mt-1">
                <PlacesList terms={program.terms} />
              </div>
            </div>
            {program.item_rules.length + program.group_rules.length > 0 && <SpecialItems program={program} />}
          </div>
        )}
      </div>
    </div>
  );
}

/** An item's or market group's terms, in a few words. */
export function TermsBadge({ terms, inherited }: { terms: RuleTerms; inherited?: boolean }) {
  const faint = inherited ? "opacity-60" : "";
  if (terms.disallowed) return <Badge tone="danger" className={faint}>not bought</Badge>;
  if (terms.static_price != null) return <span className={`font-mono text-xs ${faint}`}>{isk(terms.static_price, { full: true })}</span>;
  if (terms.tax) return <span className={`font-mono text-xs text-muted ${faint}`}>{terms.tax > 0 ? "+" : ""}{pct(terms.tax)} tax</span>;
  return <span className={`text-xs text-muted ${faint}`}>standard</span>;
}

function SpecialItems({ program }: { program: Program }) {
  const [open, setOpen] = useState(false);
  const all = [
    ...program.group_rules.map((r) => ({ key: `g${r.market_group_id}`, terms: r, cell: <ItemCell icon={null} name={r.name} sub={`Category · ${r.count} items`} /> })),
    ...program.item_rules.map((r) => ({ key: `t${r.type_id}`, terms: r, cell: <ItemCell icon={r.icon} name={r.name} /> })),
  ];
  const rules = open ? all : all.slice(0, 6);
  return (
    <div>
      <div className="hud-label text-subtle">{program.allow_all_items ? "Items with their own terms" : "Items it buys"}</div>
      <ul className="mt-2 divide-y divide-border border border-border">
        {rules.map((r) => (
          <li key={r.key} className="flex items-center justify-between gap-3 px-2.5 py-1.5 text-sm">
            {r.cell}
            <span className="shrink-0">
              <TermsBadge terms={r.terms} />
            </span>
          </li>
        ))}
      </ul>
      {all.length > 6 && (
        <button className="mt-2 text-xs text-accent-ink hover:underline" onClick={() => setOpen(!open)}>
          {open ? "Show fewer" : `Show all ${all.length}`}
        </button>
      )}
    </div>
  );
}

/** Quoted against contracted, item by item. */
export function Compare({ lines, items }: { lines: Line[]; items: ContractItem[] | null | undefined }) {
  const quoted = new Map<number, Line>();
  for (const l of lines) if (l.accepted) quoted.set(l.type_id, l);
  const given = new Map<number, { item: ContractItem; quantity: number }>();
  const asked: ContractItem[] = [];
  for (const it of items ?? []) {
    if (!it.included) asked.push(it);
    else given.set(it.type_id, { item: it, quantity: (given.get(it.type_id)?.quantity ?? 0) + it.quantity });
  }
  const ids = [...new Set([...quoted.keys(), ...given.keys()])];
  if (items == null) return <p className="p-4 text-sm text-muted">The contract's items haven't been read yet.</p>;
  return (
    <div className="overflow-x-auto">
      <Table>
        <THead>
          <tr>
            <Th>Item</Th>
            <Th align="right">Quoted</Th>
            <Th align="right">In contract</Th>
            <Th />
          </tr>
        </THead>
        <tbody>
          {ids.map((id) => {
            const q = quoted.get(id);
            const g = given.get(id);
            const want = q?.quantity ?? 0;
            const have = g?.quantity ?? 0;
            return (
              <Tr key={id}>
                <Td>
                  <ItemCell icon={q?.icon ?? g?.item.icon ?? null} name={q?.name ?? g?.item.name ?? `Type ${id}`} />
                </Td>
                <Td numeric>{want ? num(want) : "—"}</Td>
                <Td numeric>{have ? num(have) : "—"}</Td>
                <Td>
                  {have === want ? <Badge tone="success">matches</Badge> : have < want ? <Badge tone="danger">short {num(want - have)}</Badge> : <Badge tone="warning">extra {num(have - want)}</Badge>}
                </Td>
              </Tr>
            );
          })}
          {asked.map((it) => (
            <Tr key={`asked-${it.type_id}`}>
              <Td>
                <ItemCell icon={it.icon} name={it.name} sub="Asked for in return" />
              </Td>
              <Td numeric>—</Td>
              <Td numeric>{num(it.quantity)}</Td>
              <Td>
                <Badge tone="danger">asks for it</Badge>
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
