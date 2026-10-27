// Referrals: the applicant names who brought them in, and members see what their referrals came to.
import {
  api, Avatar, Card, CardHeader, cn, date, EmptyState, Input, PageHeader, Skeleton, Spinner, StatCard, Table, Td, Th, THead, Tr,
} from "@conduit/sdk";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { Award, Check, Users, X } from "./icons";
import { StatusBadge } from "./shared";
import { BASE, type ReferralStats, type Referrer } from "./types";

/** "Who referred you?": type part of a member's name and pick them from what pops up. */
export function ReferrerField({ value, onChange }: { value: Referrer | null; onChange: (r: Referrer | null) => void }) {
  const [q, setQ] = useState("");
  const [dq, setDq] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setDq(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);
  const { data, isLoading } = useQuery({
    queryKey: ["recruit", "referrers", dq],
    queryFn: () => api.get<Referrer[]>(`${BASE}/referrers?q=${encodeURIComponent(dq)}`),
    enabled: dq.length >= 3,
  });
  const hits = data ?? [];
  const pick = (r: Referrer) => {
    onChange(r);
    setQ("");
    setOpen(false);
  };

  return (
    <div className="space-y-1.5">
      <span className="block text-[13px] font-medium text-text">Who referred you?</span>
      <p className="text-xs text-muted">Optional. Type at least three letters of the name of the member who brought you here.</p>
      {value ? (
        <div className="inline-flex items-center gap-2 border border-border bg-surface-2/60 py-1 pl-1 pr-1.5 text-sm">
          <Avatar src={value.portrait} name={value.name} size="sm" />
          <span className="font-medium">{value.name}</span>
          <button type="button" onClick={() => onChange(null)} className="p-0.5 text-subtle hover:text-text" aria-label={`Remove ${value.name}`}>
            <X className="size-3.5" />
          </button>
        </div>
      ) : (
        <div className="relative max-w-sm">
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
              setActive(0);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            onKeyDown={(e) => {
              if (!hits.length) return;
              if (e.key === "ArrowDown") setActive((i) => (i + 1) % hits.length);
              else if (e.key === "ArrowUp") setActive((i) => (i - 1 + hits.length) % hits.length);
              else if (e.key === "Enter") pick(hits[Math.min(active, hits.length - 1)]!);
              else return;
              e.preventDefault();
            }}
            placeholder="Character name"
            autoComplete="off"
            role="combobox"
            aria-expanded={open && dq.length >= 3}
          />
          {open && dq.length >= 3 && (
            <div className="absolute inset-x-0 top-full z-10 mt-1 max-h-56 overflow-y-auto border border-border-strong bg-surface-raised p-1 shadow-e3" role="listbox">
              {isLoading ? (
                <Spinner className="px-2 py-1.5" />
              ) : hits.length === 0 ? (
                <div className="px-2 py-1.5 text-xs text-subtle">No member by that name.</div>
              ) : (
                hits.map((r, i) => (
                  <button
                    key={r.id}
                    type="button"
                    role="option"
                    aria-selected={i === active}
                    // mousedown, not click: the input's blur would close the list first.
                    onMouseDown={(e) => {
                      e.preventDefault();
                      pick(r);
                    }}
                    onMouseEnter={() => setActive(i)}
                    className={cn("flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm", i === active && "bg-hover")}
                  >
                    <Avatar src={r.portrait} name={r.name} size="xs" />
                    <span className="flex-1 truncate">{r.name}</span>
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

/** A member's own referrals: how many they brought in, and how each application went. */
export function ReferralsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["recruit", "referrals"], queryFn: () => api.get<ReferralStats>(`${BASE}/referrals`) });
  return (
    <>
      <PageHeader
        eyebrow="Recruitment"
        title="Your referrals"
        icon={<Award />}
        description="People who named you as their referrer when they applied."
      />
      {isLoading || !data ? (
        <Skeleton className="h-64" />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Recruited" value={data.recruited} icon={<Check />} tone="success" hint={data.recruited === 1 ? "pilot accepted" : "pilots accepted"} />
            <StatCard label="Referred" value={data.referred} icon={<Users />} hint={data.referred === 1 ? "pilot named you" : "pilots named you"} />
            <StatCard label="In progress" value={data.in_progress} hint="waiting for a decision" />
            <StatCard label="Not accepted" value={data.not_accepted} hint="rejected or withdrawn" />
          </div>
          <Card>
            <CardHeader title="Referrals" />
            {data.referrals.length === 0 ? (
              <EmptyState
                icon={<Award />}
                title="No referrals yet"
                description="When someone you bring in applies, they can name you as their referrer and they'll show up here."
              />
            ) : (
              <Table>
                <THead>
                  <tr>
                    <Th>Pilot</Th>
                    <Th>Form</Th>
                    <Th>Status</Th>
                    <Th align="right">Applied</Th>
                  </tr>
                </THead>
                <tbody>
                  {data.referrals.map((r) => (
                    <Tr key={r.id}>
                      <Td>
                        <div className="flex items-center gap-3">
                          <Avatar src={r.user.portrait} name={r.user.name} size="sm" />
                          <span className="font-medium">{r.user.name}</span>
                        </div>
                      </Td>
                      <Td className="text-muted">{r.form}</Td>
                      <Td><StatusBadge status={r.status} /></Td>
                      <Td align="right" className="text-xs text-muted">{date(r.created_at)}</Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
