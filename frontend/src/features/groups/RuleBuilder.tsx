import { useQuery } from "@tanstack/react-query";
import { Ban, Plus, Search, Sparkles, Trash2, Users, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownContent, DropdownItem, DropdownLabel, DropdownMenu, DropdownSeparator, DropdownTrigger } from "@/components/ui/dropdown";
import { Spinner } from "@/components/ui/feedback";
import { Field, Input, Select } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Segmented } from "@/components/ui/tabs";
import { Tooltip } from "@/components/ui/tooltip";
import { api } from "@/lib/api";
import type { CharacterBrief, StateBrief } from "@/lib/types";
import { cn } from "@/lib/utils";

import type { Rule, RuleParamSpec, RuleSet, RuleTypeSpec } from "./types";

export function useRuleTypes() {
  return useQuery({ queryKey: ["admin", "rule-types"], queryFn: () => api.get<RuleTypeSpec[]>("/api/admin/rules/types"), staleTime: 5 * 60_000 });
}

function useDebounced<T>(value: T, ms = 400): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function defaultParams(spec: RuleTypeSpec): Record<string, unknown> {
  return Object.fromEntries(spec.params.map((p) => [p.name, p.default ?? (p.multiple ? [] : p.type === "bool" ? false : p.type === "choice" ? p.choices[0]?.value : "")]));
}

/**
 * Edits a rule set ({match, rules}). `preview` shows, live, who would match it right now.
 */
export function RuleSetEditor({
  value,
  onChange,
  allowedStates,
  preview,
  emptyText,
}: {
  value: RuleSet;
  onChange: (v: RuleSet) => void;
  allowedStates?: number[];
  preview?: boolean;
  emptyText: string;
}) {
  const { data: types = [] } = useRuleTypes();
  const byKey = useMemo(() => Object.fromEntries(types.map((t) => [t.key, t])), [types]);
  const rules = value.rules ?? [];
  const match = value.match ?? "all";
  const set = (next: Rule[], m = match) => onChange(next.length ? { match: m, rules: next } : {});
  const categories = Object.groupBy(types, (t) => t.category);

  return (
    <div className="space-y-3">
      {rules.length > 1 && (
        <div className="flex items-center gap-2 text-sm text-muted">
          Members must match
          <Segmented
            size="sm"
            value={match}
            onChange={(m) => set(rules, m)}
            options={[
              { value: "all", label: "all rules" },
              { value: "any", label: "any rule" },
            ]}
            aria-label="How rules combine"
          />
        </div>
      )}

      {rules.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border-strong px-4 py-6 text-center text-sm text-muted">{emptyText}</div>
      ) : (
        <ol className="space-y-2">
          {rules.map((rule, i) => (
            <li key={i}>
              {i > 0 && <div className="mb-2 pl-4 text-[11px] font-semibold uppercase tracking-wide text-subtle">{match === "any" ? "or" : "and"}</div>}
              <RuleRow
                rule={rule}
                spec={byKey[rule.type]}
                onChange={(r) => set(rules.map((x, j) => (j === i ? r : x)))}
                onRemove={() => set(rules.filter((_, j) => j !== i))}
              />
            </li>
          ))}
        </ol>
      )}

      <DropdownMenu>
        <DropdownTrigger asChild>
          <Button size="sm" variant="outline">
            <Plus /> Add rule
          </Button>
        </DropdownTrigger>
        <DropdownContent align="start" className="max-h-80 w-72 overflow-y-auto">
          {Object.entries(categories).map(([cat, list], ci) => (
            <div key={cat}>
              {ci > 0 && <DropdownSeparator />}
              <DropdownLabel>{cat}</DropdownLabel>
              {list?.map((t) => (
                <DropdownItem key={t.key} onSelect={() => set([...rules, { type: t.key, params: defaultParams(t) }])}>
                  <div className="min-w-0">
                    <div>{t.label}</div>
                    {t.description && <div className="truncate text-xs text-muted">{t.description}</div>}
                  </div>
                </DropdownItem>
              ))}
            </div>
          ))}
        </DropdownContent>
      </DropdownMenu>

      {preview && <RulePreview ruleset={value} allowedStates={allowedStates} />}
    </div>
  );
}

function RuleRow({ rule, spec, onChange, onRemove }: { rule: Rule; spec?: RuleTypeSpec; onChange: (r: Rule) => void; onRemove: () => void }) {
  if (!spec) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-warning/35 bg-warning-soft px-4 py-3 text-sm">
        <span className="flex-1">Unknown rule “{rule.type}” (was its plugin removed?). It never matches.</span>
        <Button size="icon-sm" variant="ghost" onClick={onRemove} aria-label="Remove rule">
          <Trash2 />
        </Button>
      </div>
    );
  }
  return (
    <div className={cn("rounded-xl border bg-surface-2 p-3.5", rule.negate ? "border-danger/35" : "border-border")}>
      <div className="flex items-center gap-2">
        <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent-ink [&_svg]:size-3.5">
          <Sparkles />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium">
            {rule.negate && <span className="mr-1 text-danger-fg">Not</span>}
            {spec.label}
          </div>
          {spec.description && <div className="truncate text-xs text-muted">{spec.description}</div>}
        </div>
        <Tooltip content="Invert: match people who don't meet this rule">
          <label className="flex items-center gap-1.5 text-xs text-muted">
            <Ban className="size-3.5" />
            <Switch checked={!!rule.negate} onCheckedChange={(v) => onChange({ ...rule, negate: v })} aria-label="Invert rule" />
          </label>
        </Tooltip>
        <Button size="icon-sm" variant="ghost" onClick={onRemove} aria-label={`Remove ${spec.label}`}>
          <Trash2 />
        </Button>
      </div>
      {spec.params.length > 0 && (
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {spec.params.map((p) => (
            <ParamInput
              key={p.name}
              spec={p}
              value={rule.params[p.name]}
              onChange={(v) => onChange({ ...rule, params: { ...rule.params, [p.name]: v } })}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ParamInput({ spec, value, onChange }: { spec: RuleParamSpec; value: unknown; onChange: (v: unknown) => void }) {
  const wide = spec.multiple || ["skill", "corporation", "alliance", "ship", "ship_group", "item"].includes(spec.type);
  const field = (child: React.ReactNode) => (
    <Field label={spec.label} hint={spec.help || undefined} className={wide ? "sm:col-span-2" : undefined}>
      {child}
    </Field>
  );
  switch (spec.type) {
    case "int":
      return field(
        <Input
          type="number"
          min={spec.min ?? undefined}
          max={spec.max ?? undefined}
          value={value === "" || value == null ? "" : String(value)}
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
        />,
      );
    case "str":
      return field(<Input value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />);
    case "bool":
      return field(<Switch checked={!!value} onCheckedChange={onChange} />);
    case "choice":
      return field(<Select value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} options={spec.choices} />);
    case "state":
    case "group":
      return field(<ChipChooser kind={spec.type} multiple={spec.multiple} value={value} onChange={onChange} />);
    default:
      return field(<OptionPicker kind={spec.type} multiple={spec.multiple} value={value} onChange={onChange} />);
  }
}

function asIds(value: unknown): number[] {
  if (Array.isArray(value)) return value.map(Number).filter(Boolean);
  return value ? [Number(value)] : [];
}

/** Toggle chips for states or groups (small, known lists). */
function ChipChooser({ kind, multiple, value, onChange }: { kind: "state" | "group"; multiple: boolean; value: unknown; onChange: (v: unknown) => void }) {
  const { data = [] } = useQuery({
    queryKey: ["admin", kind === "state" ? "states" : "groups"],
    queryFn: () => api.get<(StateBrief & { color: string })[]>(kind === "state" ? "/api/admin/states" : "/api/admin/groups"),
  });
  const ids = asIds(value);
  const toggle = (id: number) => {
    if (!multiple) return onChange(id);
    onChange(ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);
  };
  if (!data.length) return <p className="text-xs text-subtle">No {kind}s yet.</p>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {data.map((s) => {
        const on = ids.includes(s.id);
        return (
          <button
            key={s.id}
            type="button"
            aria-pressed={on}
            onClick={() => toggle(s.id)}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors",
              on ? "border-accent/45 bg-accent-soft text-text" : "border-border text-muted hover:bg-hover hover:text-text",
            )}
          >
            <span className="size-1.5 rounded-none" style={{ background: s.color }} />
            {s.name}
          </button>
        );
      })}
    </div>
  );
}

interface Option {
  id: number;
  name: string;
  hint: string;
}

const PLACEHOLDERS: Record<string, string> = {
  skill: "Search skills, e.g. Gunnery",
  ship: "Search ships, e.g. Revelation",
  ship_group: "Search ship classes, e.g. Dreadnought",
  item: "Search items, e.g. PLEX",
};
/** Kinds from the static data: every item exists, so "nothing found" just means a typo. */
const SDE_KINDS = new Set(["skill", "ship", "ship_group", "item"]);

/** Search-and-pick for skills, ships, ship classes, items, corporations and alliances. */
function OptionPicker({ kind, multiple, value, onChange }: { kind: string; multiple: boolean; value: unknown; onChange: (v: unknown) => void }) {
  const ids = asIds(value);
  const [q, setQ] = useState("");
  const dq = useDebounced(q.trim(), 250);
  const known = useQuery({
    queryKey: ["admin", "rule-options", kind, "ids", ids.join(",")],
    queryFn: () => api.get<Option[]>(`/api/admin/rules/options?type=${kind}&ids=${ids.join(",")}`),
    enabled: ids.length > 0,
  });
  const results = useQuery({
    queryKey: ["admin", "rule-options", kind, dq],
    queryFn: () => api.get<Option[]>(`/api/admin/rules/options?type=${kind}&q=${encodeURIComponent(dq)}`),
    enabled: dq.length >= 2,
  });
  const names = Object.fromEntries((known.data ?? []).map((o) => [o.id, o]));
  const pick = (o: Option) => {
    onChange(multiple ? (ids.includes(o.id) ? ids : [...ids, o.id]) : o.id);
    setQ("");
  };
  const placeholder = PLACEHOLDERS[kind] ?? `Search ${kind}s by name or ticker`;
  return (
    <div className="space-y-2">
      {ids.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {ids.map((id) => (
            <span key={id} className="inline-flex items-center gap-1.5 rounded-md bg-surface-3 py-1 pl-2 pr-1 text-xs ring-1 ring-border">
              {names[id]?.name ?? `#${id}`}
              {names[id]?.hint && !SDE_KINDS.has(kind) && <span className="font-mono text-subtle">[{names[id]?.hint}]</span>}
              <button
                type="button"
                onClick={() => onChange(multiple ? ids.filter((x) => x !== id) : "")}
                className="rounded p-0.5 text-subtle hover:bg-hover-strong hover:text-text"
                aria-label={`Remove ${names[id]?.name ?? id}`}
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      {(multiple || ids.length === 0) && (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} className="pl-9" />
          {dq.length >= 2 && (
            <div className="absolute inset-x-0 top-full z-10 mt-1 max-h-56 overflow-y-auto rounded-xl border border-border-strong bg-surface-raised p-1 shadow-e3">
              {results.isLoading ? (
                <Spinner className="px-2 py-1.5" />
              ) : !results.data?.length ? (
                <div className="px-2 py-1.5 text-xs text-subtle">
                  Nothing found.{!SDE_KINDS.has(kind) && " Only corporations and alliances already known to this site are listed."}
                </div>
              ) : (
                results.data.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => pick(o)}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-hover"
                  >
                    <span className="flex-1 truncate">{o.name}</span>
                    {o.hint && <span className="text-xs text-subtle">{o.hint}</span>}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface PreviewOut {
  count: number;
  text: string;
  users: { id: number; name: string; main: CharacterBrief | null }[];
}

function RulePreview({ ruleset, allowedStates }: { ruleset: RuleSet; allowedStates?: number[] }) {
  const body = useDebounced(JSON.stringify({ rules: ruleset, allowed_states: allowedStates ?? [] }), 500);
  const hasRules = (ruleset.rules?.length ?? 0) > 0;
  const { data, isFetching, error } = useQuery({
    queryKey: ["admin", "rule-preview", body],
    queryFn: () => api.post<PreviewOut>("/api/admin/rules/preview", JSON.parse(body)),
    enabled: hasRules,
    retry: false,
  });
  if (!hasRules) return null;
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center gap-2 text-sm">
        <Users className="size-4 text-accent-ink" />
        <span className="font-medium">Matches right now</span>
        {isFetching && <Spinner />}
        {data && !isFetching && <Badge tone="accent">{data.count} user{data.count === 1 ? "" : "s"}</Badge>}
      </div>
      {error ? (
        <p className="mt-2 text-xs text-danger-fg">{(error as Error).message}</p>
      ) : (
        data && (
          <>
            <p className="mt-1 text-xs text-muted">{data.text}</p>
            {data.users.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {data.users.map((u) => (
                  <span key={u.id} className="inline-flex items-center gap-1.5 rounded-none bg-hover py-0.5 pl-0.5 pr-2.5 text-xs">
                    <Avatar src={u.main?.portrait} name={u.name} size="xs" rounded="full" />
                    {u.name}
                  </span>
                ))}
                {data.count > data.users.length && <span className="self-center text-xs text-subtle">and {data.count - data.users.length} more</span>}
              </div>
            )}
          </>
        )
      )}
    </div>
  );
}
