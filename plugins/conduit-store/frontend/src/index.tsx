import { api, definePlugin, Skeleton } from "@conduit/sdk";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";

import { ManagePage } from "./manage";
import { MyPointsPage } from "./mine";
import { OrdersPage } from "./orders";
import { Points } from "./shared";
import { StorePage } from "./store";
import { BASE } from "./types";

function BalanceWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ["store", "balance"],
    queryFn: () => api.get<{ balance: number; month: number }>(`${BASE}/balance`),
    refetchInterval: 300_000,
  });
  if (isLoading || !data) return <Skeleton className="h-16" />;
  return (
    <Link to="/p/store" className="block">
      <div className="text-xs text-muted">Your store points</div>
      <div className="mt-1 text-3xl font-semibold"><Points value={data.balance} /></div>
      <div className="text-xs text-subtle">+{data.month.toLocaleString("en")} in the last 30 days</div>
    </Link>
  );
}

export default definePlugin({
  routes: [
    { path: "", Component: StorePage },
    { path: "me", Component: MyPointsPage },
    { path: "orders", Component: OrdersPage },
    { path: "manage", Component: ManagePage },
  ],
  widgets: [{ id: "balance", title: "Corp Store", Component: BalanceWidget, size: "sm", order: 40 }],
});
