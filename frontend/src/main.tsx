import "./index.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider, type RouteObject } from "react-router";
import { Toaster } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import { ModuleBoundary } from "@/components/ModuleBoundary";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ApiError } from "@/lib/api";
import { applyBranding, BOOTSTRAP_KEY, BootstrapProvider, fetchBootstrap } from "@/lib/bootstrap";
import { ModulesProvider } from "@/lib/moduleContext";
import { loadModules, type LoadedModule } from "@/lib/modules";
import { applyModuleStyles } from "@/lib/moduleStyles";
import { applyPreferences, applyStoredTheme } from "@/lib/preferences";
import { AdminAccess } from "@/pages/admin/Access";
import { AdminCompliance } from "@/pages/admin/Compliance";
import { AdminApi } from "@/pages/admin/Api";
import { AdminHealth } from "@/pages/admin/Health";
import { AdminIntegrations } from "@/pages/admin/Integrations";
import { AdminLogs } from "@/pages/admin/Logs";
import { AdminMembers } from "@/pages/admin/Members";
import { AdminModules } from "@/pages/admin/Modules";
import { AdminSettings } from "@/pages/admin/Settings";
import { AssetsPage } from "@/pages/AssetsPage";
import { WalletPage } from "@/pages/WalletPage";
import { Characters } from "@/pages/Characters";
import { CharacterSheet } from "@/pages/CharacterSheet";
import { CorporationSheet } from "@/pages/CorporationSheet";
import { Corporations } from "@/pages/Corporations";
import { Dashboard } from "@/pages/Dashboard";
import { GroupManage } from "@/pages/GroupManage";
import { Groups } from "@/pages/Groups";
import { Login } from "@/pages/Login";
import { NotFound } from "@/pages/NotFound";
import { Notifications } from "@/pages/Notifications";
import { UserSettings } from "@/pages/UserSettings";
import { Setup } from "@/pages/Setup";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (count, err) => !(err instanceof ApiError && err.status < 500) && count < 2,
    },
  },
});

function moduleRoutes(modules: LoadedModule[]): RouteObject[] {
  return modules.flatMap(({ info, frontend }) =>
    (frontend.routes ?? []).map((r) => ({
      path: `m/${info.id}${r.path ? `/${r.path.replace(/^\//, "")}` : ""}`,
      element: (
        <ModuleBoundary name={info.name}>
          <r.Component />
        </ModuleBoundary>
      ),
    })),
  );
}

async function start() {
  applyStoredTheme();
  const root = createRoot(document.getElementById("root")!);
  let bootstrap;
  try {
    bootstrap = await fetchBootstrap();
  } catch {
    root.render(<Offline />);
    return;
  }
  applyBranding(bootstrap.site);
  if (bootstrap.user) applyPreferences(bootstrap.user.preferences);
  queryClient.setQueryData(BOOTSTRAP_KEY, bootstrap);
  const modules = await loadModules(bootstrap.modules);
  await applyModuleStyles(modules).catch((err) => console.error("Could not build module styles", err));

  const router = createBrowserRouter([
    { path: "/login", element: <Login /> },
    { path: "/setup", element: <Setup /> },
    {
      path: "/",
      element: <AppShell />,
      children: [
        { index: true, element: <Dashboard /> },
        { path: "characters", element: <Characters /> },
        { path: "characters/:id", element: <CharacterSheet /> },
        { path: "corporations", element: <Corporations /> },
        { path: "corporations/:id", element: <CorporationSheet /> },
        { path: "wallet", element: <WalletPage /> },
        { path: "assets", element: <AssetsPage /> },
        { path: "groups", element: <Groups /> },
        { path: "groups/manage", element: <GroupManage /> },
        { path: "notifications", element: <Notifications /> },
        { path: "settings", element: <UserSettings /> },
        { path: "admin/members", element: <AdminMembers /> },
        { path: "admin/access", element: <AdminAccess /> },
        { path: "admin/compliance", element: <AdminCompliance /> },
        { path: "admin/modules", element: <AdminModules /> },
        { path: "admin/api", element: <AdminApi /> },
        { path: "admin/logs", element: <AdminLogs /> },
        { path: "admin/health", element: <AdminHealth /> },
        { path: "admin/integrations", element: <AdminIntegrations /> },
        { path: "admin/settings", element: <AdminSettings /> },
        ...moduleRoutes(modules),
        { path: "*", element: <NotFound /> },
      ],
    },
  ]);

  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <BootstrapProvider initial={bootstrap}>
          <ModulesProvider modules={modules}>
            <TooltipProvider delayDuration={200}>
              <RouterProvider router={router} />
              <Toaster
                theme="system"
                position="bottom-right"
                closeButton
                toastOptions={{ className: "!bg-surface-raised !border-border-strong !text-text !rounded-none !shadow-e3 !font-sans [&_[data-description]]:!text-muted" }}
              />
            </TooltipProvider>
          </ModulesProvider>
        </BootstrapProvider>
      </QueryClientProvider>
    </StrictMode>,
  );
}

function Offline() {
  return (
    <div className="backdrop-space grid min-h-full place-items-center px-4 text-center">
      <div>
        <div className="mx-auto mb-5 size-3 animate-ping rounded-none bg-warning" />
        <h1 className="text-xl font-semibold">Can't reach the server</h1>
        <p className="mt-2 text-sm text-muted">The site is starting up or offline. This page will work again once it's back.</p>
        <button onClick={() => location.reload()} className="mt-6 rounded-lg border border-border-strong px-4 py-2 text-sm hover:bg-hover-strong">
          Try again
        </button>
      </div>
    </div>
  );
}

start();
