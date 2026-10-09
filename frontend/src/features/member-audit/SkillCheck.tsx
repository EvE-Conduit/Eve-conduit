import { useMutation, useQuery } from "@tanstack/react-query";
import { CircleCheck, CircleDashed, CircleX, Clock, GraduationCap, X } from "lucide-react";
import { useDeferredValue, useState } from "react";

import { DataTable, type Column } from "@/components/DataTable";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Alert } from "@/components/ui/feedback";
import { Field, SearchInput, Textarea } from "@/components/ui/input";
import { StatCard } from "@/components/ui/page";
import { Segmented } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { ROMAN, duration } from "@/lib/format";

import { BASE, CorporationFilter, MemberCell, type Corporation, type Member } from "./shared";

interface ItemType {
  id: number;
  name: string;
  group: string;
  icon: string;
}

type Status = "ready" | "queued" | "missing" | "unsynced";

interface Row {
  character: Member;
  status: Status;
  percent: number;
  seconds_left: number;
  seconds_missing: number;
  missing: { id: number; name: string; have: number; need: number }[];
}

interface Result {
  skills: { id: number; name: string; level: number }[];
  problems: string[];
  counts: Record<Status, number>;
  characters: Row[];
}

const STATUS: Record<Status, { label: string; tone: BadgeTone }> = {
  ready: { label: "Ready", tone: "success" },
  queued: { label: "In queue", tone: "info" },
  missing: { label: "Missing skills", tone: "warning" },
  unsynced: { label: "Not synced", tone: "neutral" },
};

const inSeconds = (s: number) => duration(new Date(Date.now() + s * 1000).toISOString());

export function SkillCheck({ corporations }: { corporations: Corporation[] }) {
  const [q, setQ] = useState("");
  const query = useDeferredValue(q.trim());
  const [items, setItems] = useState<ItemType[]>([]);
  const [text, setText] = useState("");
  const [corporation, setCorporation] = useState("");
  const [show, setShow] = useState<"all" | Status>("all");

  const hits = useQuery({
    queryKey: ["member-audit", "types", query],
    queryFn: () => api.get<ItemType[]>(`${BASE}/types?q=${encodeURIComponent(query)}`),
    enabled: query.length >= 2,
  });
  const check = useMutation({
    mutationFn: () => api.post<Result>(`${BASE}/skills/check`, { types: items.map((i) => i.id), text, corporation: corporation ? Number(corporation) : null }),
  });
  const result = check.data;
  const rows = result?.characters.filter((r) => show === "all" || r.status === show) ?? [];

  const columns: Column<Row>[] = [
    { header: "Character", cell: (r) => <MemberCell member={r.character} />, className: "max-w-[240px]", sortValue: (r) => r.character.name },
    {
      header: "Status",
      cell: (r) => (
        <Badge size="xs" tone={STATUS[r.status].tone}>
          {STATUS[r.status].label}
        </Badge>
      ),
    },
    { header: "Progress", cell: (r) => (r.status === "unsynced" ? "—" : `${r.percent}%`), align: "right", sortValue: (r) => r.percent },
    { header: "Time to train", cell: (r) => (r.status === "unsynced" || r.status === "ready" ? "—" : inSeconds(r.seconds_left)), align: "right", sortValue: (r) => (r.status === "unsynced" ? null : r.seconds_left) },
    {
      header: "Missing",
      cell: (r) =>
        r.status === "unsynced" || !r.missing.length ? (
          <span className="text-subtle">—</span>
        ) : (
          <span className="text-xs text-muted">{r.missing.map((m) => `${m.name} ${ROMAN[m.have]} → ${ROMAN[m.need]}`).join(", ")}</span>
        ),
      className: "max-w-md",
    },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardBody className="grid gap-4 lg:grid-cols-2">
          <Field label="Ships or items" hint="Members need every skill these items require.">
            <div className="space-y-2">
              <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. Thrasher, Heavy Assault Missile Launcher II" aria-label="Find an item" />
              {query.length >= 2 && hits.data && (
                <ul className="max-h-48 overflow-y-auto rounded-lg border border-border">
                  {hits.data.length === 0 && <li className="px-3 py-2 text-xs text-subtle">No item that needs skills matches.</li>}
                  {hits.data.map((t) => (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setItems((cur) => (cur.some((i) => i.id === t.id) ? cur : [...cur, t]));
                          setQ("");
                        }}
                        className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-sm hover:bg-hover"
                      >
                        <img src={t.icon} alt="" className="size-6 rounded" />
                        <span className="flex-1 truncate text-text">{t.name}</span>
                        <span className="text-xs text-subtle">{t.group}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {items.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {items.map((i) => (
                    <span key={i.id} className="inline-flex items-center gap-1.5 rounded-md bg-hover py-0.5 pl-1 pr-0.5 text-[13px]">
                      <img src={i.icon} alt="" className="size-5 rounded" />
                      {i.name}
                      <Button size="icon-xs" variant="ghost" onClick={() => setItems((cur) => cur.filter((x) => x.id !== i.id))} aria-label={`Remove ${i.name}`}>
                        <X />
                      </Button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Field>
          <Field label="Skill list" hint="Paste from the game or a skill plan, one per line: “Gunnery IV” or “Gunnery 4”.">
            <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} maxLength={20000} placeholder={"Spaceship Command V\nGunnery 4"} className="font-mono text-xs" />
          </Field>
        </CardBody>
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border px-card py-3">
          <CorporationFilter corporations={corporations} value={corporation} onChange={setCorporation} />
          <Button variant="primary" onClick={() => check.mutate()} loading={check.isPending} disabled={!items.length && !text.trim()}>
            <GraduationCap /> Check members
          </Button>
        </div>
      </Card>

      {check.error && <Alert tone="danger">{check.error.message}</Alert>}
      {result && result.problems.length > 0 && (
        <Alert tone="warning" title="Some lines weren't skills and were left out">
          {result.problems.join(" · ")}
        </Alert>
      )}
      {result && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Ready" value={result.counts.ready} icon={<CircleCheck />} tone="success" />
            <StatCard label="In queue" value={result.counts.queued} icon={<Clock />} tone="info" hint="the rest is in their skill queue" />
            <StatCard label="Missing skills" value={result.counts.missing} icon={<CircleX />} tone="warning" />
            <StatCard label="Not synced" value={result.counts.unsynced} icon={<CircleDashed />} hint="no skills synced yet" />
          </div>
          <Card>
            <div className="flex flex-wrap items-center gap-3 border-b border-border px-card py-3">
              <Segmented
                value={show}
                onChange={setShow}
                size="sm"
                aria-label="Show"
                options={[{ value: "all" as const, label: "Everyone" }, ...(Object.keys(STATUS) as Status[]).map((s) => ({ value: s, label: STATUS[s].label }))]}
              />
              <div className="flex min-w-0 flex-1 flex-wrap justify-end gap-1">
                {result.skills.map((s) => (
                  <Badge key={s.id} size="xs">
                    {s.name} {ROMAN[s.level]}
                  </Badge>
                ))}
              </div>
            </div>
            <DataTable<Row> rows={rows} columns={columns} rowKey={(r) => r.character.id} empty={{ icon: <GraduationCap />, title: "Nobody here", description: "No character in reach is in this group." }} />
          </Card>
        </>
      )}
    </div>
  );
}
