// The reviewers' queue (srp.review_requests) and payers' list (srp.pay_requests).
import {
  api, Avatar, Button, Card, ConfirmDialog, EmptyState, isk, PageHeader, SearchInput, Skeleton, StatCard, Table, TableToolbar, Tabs, Td,
  Th, THead, timeAgo, toast, Tr, useHasPerm,
} from "@conduit/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate } from "react-router";

import { Coins, Download, LifeBuoy, Settings, User } from "./icons";
import { SettingsDialog } from "./settings";
import { ShipCell, StatusBadge, SystemText } from "./shared";
import { BASE, type Queue, type Status } from "./types";

type Tab = Status | "all";

export function QueuePage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const canPay = useHasPerm("srp.pay_requests");
  const canManage = useHasPerm("srp.manage_srp");
  const canReview = useHasPerm("srp.review_requests");
  const [tab, setTab] = useState<Tab>(canReview ? "pending" : "approved");
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirmPay, setConfirmPay] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["srp", "queue", tab, q],
    queryFn: () => api.get<Queue>(`${BASE}/queue?status=${tab}&q=${encodeURIComponent(q)}`),
    placeholderData: (prev) => prev,
  });
  const pay = useMutation({
    mutationFn: (ids: number[]) => api.post<{ paid: number }>(`${BASE}/paid`, { ids }),
    onSuccess: (r) => {
      setPicked(new Set());
      qc.invalidateQueries({ queryKey: ["srp"] });
      toast.success(`${r.paid} request${r.paid === 1 ? "" : "s"} marked paid`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const payable = (data?.requests ?? []).filter((r) => r.status === "approved");
  const selectable = canPay && payable.length > 0;
  const pickedTotal = payable.filter((r) => picked.has(r.id)).reduce((s, r) => s + (r.payout ?? 0), 0);
  const toggle = (id: number) => setPicked((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const allPicked = payable.length > 0 && payable.every((r) => picked.has(r.id));

  return (
    <>
      <PageHeader
        eyebrow="Ship replacement"
        title="SRP queue"
        icon={<LifeBuoy />}
        description="Check each loss, approve a payout or say why not, then mark it paid once the ISK is sent."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/p/srp/me">
              <Button variant="ghost"><User /> Mine</Button>
            </Link>
            {canPay && (
              <a href={`${BASE}/queue.csv`} download>
                <Button variant="ghost"><Download /> Payouts CSV</Button>
              </a>
            )}
            {canManage && (
              <Button onClick={() => setSettingsOpen(true)}><Settings /> Rules</Button>
            )}
          </div>
        }
      />

      {!data && isLoading ? (
        <div className="grid gap-4 sm:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-28" />)}</div>
      ) : data ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Waiting for review" value={data.counts.pending} hint={`${isk(data.totals.pending)} suggested`} tone={data.counts.pending ? "info" : undefined} />
            <StatCard label="Approved, to pay" value={isk(data.totals.approved)} mono hint={`${data.counts.approved} request${data.counts.approved === 1 ? "" : "s"}`} tone={data.counts.approved ? "accent" : undefined} />
            <StatCard label="Paid in the last 30 days" value={isk(data.totals.paid_30d)} mono tone="success" />
          </div>

          <Tabs
            variant="pills"
            value={tab}
            onValueChange={(v) => { setTab(v as Tab); setPicked(new Set()); }}
            items={[
              { value: "pending", label: "Pending", count: data.counts.pending },
              { value: "approved", label: "Approved", count: data.counts.approved },
              { value: "rejected", label: "Rejected", count: data.counts.rejected },
              { value: "paid", label: "Paid", count: data.counts.paid },
              { value: "all", label: "All" },
            ]}
          />

          <Card>
            <TableToolbar>
              <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Pilot, ship, fleet or FC" className="w-72" />
              {selectable && picked.size > 0 && (
                <Button variant="primary" size="sm" onClick={() => setConfirmPay(true)}>
                  <Coins /> Mark {picked.size} paid · {isk(pickedTotal)}
                </Button>
              )}
            </TableToolbar>
            {data.requests.length === 0 ? (
              <EmptyState icon={<LifeBuoy />} title={tab === "pending" ? "Nothing waiting for review" : "No requests here"} description={q ? "Nothing matches the search." : undefined} />
            ) : (
              <Table>
                <THead>
                  <tr>
                    {selectable && (
                      <Th className="w-10">
                        <input
                          type="checkbox"
                          className="size-4 accent-accent"
                          checked={allPicked}
                          onChange={() => setPicked(allPicked ? new Set() : new Set(payable.map((r) => r.id)))}
                          aria-label="Pick every approved request"
                        />
                      </Th>
                    )}
                    <Th>Pilot</Th>
                    <Th>Ship</Th>
                    <Th>Where</Th>
                    <Th>Fleet</Th>
                    <Th align="right">Loss</Th>
                    <Th align="right">Payout</Th>
                    <Th align="right">Status</Th>
                  </tr>
                </THead>
                <tbody>
                  {data.requests.map((r) => (
                    <Tr key={r.id} interactive onClick={() => navigate(`/p/srp/requests/${r.id}`)}>
                      {selectable && (
                        <Td onClick={(e) => e.stopPropagation()}>
                          {r.status === "approved" && (
                            <input type="checkbox" className="size-4 accent-accent" checked={picked.has(r.id)} onChange={() => toggle(r.id)} aria-label={`Pick request ${r.id}`} />
                          )}
                        </Td>
                      )}
                      <Td>
                        <div className="flex items-center gap-3">
                          <Avatar src={r.user.portrait} name={r.user.name} size="sm" />
                          <div className="min-w-0">
                            <div className="truncate font-medium">{r.user.name}</div>
                            <div className="truncate text-xs text-subtle">{r.character.name !== r.user.name ? `on ${r.character.name} · ` : ""}{timeAgo(r.created_at)}</div>
                          </div>
                        </div>
                      </Td>
                      <Td><ShipCell ship={r.ship} /></Td>
                      <Td className="text-sm"><SystemText system={r.system} /></Td>
                      <Td className="max-w-48 truncate text-sm text-muted">{r.fleet || "—"}{r.fc ? <span className="text-subtle"> · {r.fc}</span> : null}</Td>
                      <Td numeric className="text-muted">{isk(r.value)}</Td>
                      <Td numeric>{isk(r.payout ?? r.suggested)}</Td>
                      <Td align="right"><StatusBadge status={r.status} /></Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
        </div>
      ) : null}

      {settingsOpen && <SettingsDialog onClose={() => setSettingsOpen(false)} />}
      <ConfirmDialog
        open={confirmPay}
        onOpenChange={setConfirmPay}
        title={`Mark ${picked.size} request${picked.size === 1 ? "" : "s"} paid?`}
        description={`${isk(pickedTotal, { full: true })} in total. Each pilot is told their SRP has been paid, so send the ISK first.`}
        confirmLabel={<><Coins /> Mark paid</>}
        onConfirm={() => pay.mutateAsync([...picked])}
      />
    </>
  );
}
