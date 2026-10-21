// The haulers' page: every courier contract to the services, with what's wrong with each.
import { api, Card, DataTable, isk, num, PageHeader, Segmented, Select, StatCard } from "@conduit/sdk";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { Truck } from "./icons";
import { contractColumns } from "./member";
import { BackLink } from "./shared";
import { BASE, type Contract } from "./types";

type Show = "waiting" | "in_transit" | "problems" | "done";

interface QueueOut {
  contracts: Contract[];
  counts: Record<Show, number>;
  totals: { open_reward: number; open_collateral: number; open_volume: number };
  services: { id: number; name: string }[];
}

export function QueuePage() {
  const [show, setShow] = useState<Show>("waiting");
  const [service, setService] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["freight", "queue", show, service],
    queryFn: () => api.get<QueueOut>(`${BASE}/queue?show=${show}${service ? `&service=${service}` : ""}`),
    refetchInterval: 60_000,
  });
  const counts = data?.counts;
  return (
    <div>
      <BackLink to="/p/freight">Freight</BackLink>
      <PageHeader icon={<Truck />} eyebrow="Freight" title="Hauling queue" description="Courier contracts to the freight services, checked against their routes every 15 minutes." />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Open rewards" value={isk(data?.totals.open_reward ?? 0)} />
        <StatCard label="Open collateral" value={isk(data?.totals.open_collateral ?? 0)} />
        <StatCard label="Open volume" value={`${num(data?.totals.open_volume ?? 0)} m³`} />
      </div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Segmented<Show>
          value={show}
          onChange={setShow}
          aria-label="Which contracts"
          options={[
            { value: "waiting", label: `Waiting${counts ? ` (${counts.waiting})` : ""}` },
            { value: "in_transit", label: `In transit${counts ? ` (${counts.in_transit})` : ""}` },
            { value: "problems", label: `Problems${counts ? ` (${counts.problems})` : ""}` },
            { value: "done", label: "Finished" },
          ]}
        />
        {(data?.services.length ?? 0) > 1 && (
          <Select
            className="w-56"
            value={service}
            onChange={(e) => setService(e.target.value)}
            aria-label="Service"
            options={[{ value: "", label: "Every service" }, ...(data?.services ?? []).map((s) => ({ value: String(s.id), label: s.name }))]}
          />
        )}
      </div>
      <Card>
        <DataTable
          rows={data?.contracts ?? []}
          loading={isLoading}
          rowKey={(c) => c.contract_id}
          columns={contractColumns(true)}
          empty={{ icon: <Truck />, title: "Nothing here", description: show === "problems" ? "Every open contract matches its route." : undefined }}
        />
      </Card>
    </div>
  );
}
