import { definePlugin } from "@conduit/sdk";

import { BalancesPage } from "./balances";
import { JournalPage } from "./journal";
import { FinanceWidget, OverviewPage } from "./overview";
import { ReportPage } from "./report";
import { SettingsPage } from "./settings";

export default definePlugin({
  routes: [
    { path: "", Component: OverviewPage },
    { path: "report", Component: ReportPage },
    { path: "balances", Component: BalancesPage },
    { path: "journal", Component: JournalPage },
    { path: "settings", Component: SettingsPage },
  ],
  widgets: [{ id: "net", title: "Corp finance", Component: FinanceWidget, size: "sm", order: 46, permission: "finance.view_finance" }],
});
