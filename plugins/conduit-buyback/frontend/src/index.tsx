import { definePlugin } from "@conduit/sdk";

import { EditPage, LocationsPage, ManagePage, ManagerWidget, SettingsPage, StatsPage } from "./manage";
import { ItemsPage } from "./market";
import { ContractPage, HomePage, MyPage, ProgramPage, QuotePage, SellerWidget } from "./member";
import { PublicList, PublicProgram, PublicQuote } from "./public";

export default definePlugin({
  routes: [
    { path: "", Component: HomePage },
    { path: "programs/:id", Component: ProgramPage },
    { path: "me", Component: MyPage },
    { path: "quotes/:tracking", Component: QuotePage },
    { path: "contracts/:id", Component: ContractPage },
    { path: "manage", Component: ManagePage },
    { path: "manage/new", Component: EditPage },
    { path: "manage/locations", Component: LocationsPage },
    { path: "manage/:id", Component: StatsPage },
    { path: "manage/:id/edit", Component: EditPage },
    { path: "manage/:id/items", Component: ItemsPage },
    { path: "settings", Component: SettingsPage },
  ],
  publicRoutes: [
    { path: "", Component: PublicList },
    { path: ":id", Component: PublicProgram },
    { path: "quotes/:tracking", Component: PublicQuote },
  ],
  widgets: [
    { id: "seller", title: "Buyback", Component: SellerWidget, size: "sm", order: 47 },
    { id: "manager", title: "Buyback desk", Component: ManagerWidget, size: "sm", order: 48, permission: "buyback.manage_programs" },
  ],
});
