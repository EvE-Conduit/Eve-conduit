import { definePlugin } from "@conduit/sdk";

import { BoardPage, StockWidget } from "./board";
import { ManagePage } from "./manage";

export default definePlugin({
  routes: [
    { path: "", Component: BoardPage },
    { path: "manage", Component: ManagePage },
  ],
  widgets: [{ id: "stock", title: "Doctrine Stock", Component: StockWidget, size: "sm", order: 49 }],
});
