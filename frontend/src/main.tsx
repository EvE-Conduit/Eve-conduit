import "./index.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider, type RouteObject } from "react-router";
import { Toaster } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import { PublicShell } from "@/components/layout/PublicShell";
import { UPDATING_KEY } from "@/components/layout/Banners";
import { updateTitle } from "@/components/updates/UpdateSteps";
import { PluginBoundary } from "@/components/PluginBoundary";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ApiError } from "@/lib/api";
import { applyBranding, BOOTSTRAP_KEY, BootstrapProvider, fetchBootstrap } from "@/lib/bootstrap";
import { PluginsProvider } from "@/lib/pluginContext";
import { loadPlugins, type LoadedPlugin } from "@/lib/plugins";
import { applyPluginStyles } from "@/lib/pluginStyles";
import { applyPreferences, applyStoredTheme } from "@/lib/preferences";
import type { UpdateProgress } from "@/lib/types";
import { AdminAccess } from "@/pages/admin/Access";
import { AdminGroups } from "@/pages/admin/Groups";
import { AdminCompliance } from "@/pages/admin/Compliance";
import { AdminApi } from "@/pages/admin/Api";
import { AdminHealth } from "@/pages/admin/Health";
import { LandingEditor } from "@/pages/admin/LandingEditor";
import { AdminIntegrations } from "@/pages/admin/Integrations";
import { AdminLogs } from "@/pages/admin/Logs";
import { AdminMemberAudit } from "@/pages/admin/MemberAudit";
import { AdminMembers } from "@/pages/admin/Members";
import { AdminPlugins } from "@/pages/admin/Plugins";
import { AdminSettings } from "@/pages/admin/Settings";
import { AdminUpdates } from "@/pages/admin/Updates";
import { AssetsPage } from "@/pages/AssetsPage";
import { WalletPage } from "@/pages/WalletPage";
import { Characters } from "@/pages/Characters";
import { CharacterSheet } from "@/pages/CharacterSheet";
import { CorporationSheet } from "@/pages/CorporationSheet";
import { Corporations } from "@/pages/Corporations";
import { Dashboard } from "@/pages/Dashboard";
import { GroupManage } from "@/pages/GroupManage";
import { Groups } from "@/pages/Groups";
import { Home } from "@/pages/Home";
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

function pluginRoutes(plugins: LoadedPlugin[], key: "routes" | "publicRoutes" = "routes"): RouteObject[] {
  return plugins.flatMap(({ info, frontend }) =>
    (frontend[key] ?? []).map((r) => ({
      path: `p/${info.id}${r.path ? `/${r.path.replace(/^\//, "")}` : ""}`,
      element: (
        <PluginBoundary name={info.name}>
          <r.Component />
        </PluginBoundary>
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
  const plugins = await loadPlugins(bootstrap.plugins);
  await applyPluginStyles(plugins).catch((err) => console.error("Could not build plugin styles", err));

  const router = createBrowserRouter([
    { path: "/login", element: <Login /> },
    { path: "/setup", element: <Setup /> },
    { path: "/public", element: <PublicShell />, children: [...pluginRoutes(plugins, "publicRoutes"), { path: "*", element: <NotFound /> }] },
    {
      path: "/",
      element: <AppShell />,
      children: [
        { index: true, element: <Dashboard /> },
        { path: "home", element: <Home /> },
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
        { path: "admin/member-audit", element: <AdminMemberAudit /> },
        { path: "admin/access", element: <AdminAccess /> },
        { path: "admin/groups", element: <AdminGroups /> },
        { path: "admin/compliance", element: <AdminCompliance /> },
        { path: "admin/plugins", element: <AdminPlugins /> },
        { path: "admin/api", element: <AdminApi /> },
        { path: "admin/logs", element: <AdminLogs /> },
        { path: "admin/health", element: <AdminHealth /> },
        { path: "admin/integrations", element: <AdminIntegrations /> },
        { path: "admin/settings", element: <AdminSettings /> },
        { path: "admin/settings/landing", element: <LandingEditor /> },
        { path: "admin/updates", element: <AdminUpdates /> },
        ...pluginRoutes(plugins),
        { path: "*", element: <NotFound /> },
      ],
    },
  ]);

  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <BootstrapProvider initial={bootstrap}>
          <PluginsProvider plugins={plugins}>
            <TooltipProvider delayDuration={200}>
              <RouterProvider router={router} />
              <Toaster
                theme="system"
                position="bottom-right"
                closeButton
                toastOptions={{ className: "!bg-surface-raised !border-border-strong !text-text !rounded-control !shadow-e3 !font-sans [&_[data-description]]:!text-muted" }}
              />
            </TooltipProvider>
          </PluginsProvider>
        </BootstrapProvider>
      </QueryClientProvider>
    </StrictMode>,
  );
}

/** The API didn't answer. Usually the site is restarting (often for an update): keep trying and come back by itself. */
function Offline() {
  const [updating] = useState<UpdateProgress | null>(() => {
    try {
      return JSON.parse(localStorage.getItem(UPDATING_KEY) ?? "null");
    } catch {
      return null;
    }
  });
  useEffect(() => {
    const timer = setInterval(() => {
      fetchBootstrap().then(() => location.reload(), () => undefined);
    }, 5000);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="backdrop-space grid min-h-full place-items-center px-4 text-center">
      <div className="max-w-md">
        <div className="mx-auto mb-5 size-3 animate-ping rounded-none bg-warning" />
        <h1 className="text-xl font-semibold">{updating ? `${updateTitle(updating)}` : "Can't reach the server"}</h1>
        <p className="mt-2 text-sm text-muted">
          {updating
            ? "The site is restarting with the new version. This page reloads by itself when it's back, usually within a minute or two."
            : "The site is starting up or offline. This page reloads by itself as soon as it answers again."}
        </p>
        <button onClick={() => location.reload()} className="mt-6 rounded-lg border border-border-strong px-4 py-2 text-sm hover:bg-hover-strong">
          Try now
        </button>
      </div>
    </div>
  );
}

start();
