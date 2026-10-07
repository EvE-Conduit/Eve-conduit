import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, ChevronRight, ExternalLink, LogOut, Menu, Moon, Search, Settings2, SlidersHorizontal, Sun, UserPlus, UsersRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, Outlet, useLocation, useNavigate } from "react-router";
import { toast } from "sonner";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownContent, DropdownItem, DropdownLabel, DropdownMenu, DropdownSeparator, DropdownTrigger } from "@/components/ui/dropdown";
import { Kbd } from "@/components/ui/feedback";
import { api, MAINTENANCE_EVENT } from "@/lib/api";
import { useBootstrap, useHasPerm } from "@/lib/bootstrap";
import { applyPreferences } from "@/lib/preferences";
import { cn } from "@/lib/utils";

import { ImpersonationBanner, MaintenanceBanner, MaintenanceScreen } from "./Banners";
import { Clocks } from "./Clocks";
import { ExternalLinkGuard } from "@/lib/externalLinks";

import { CommandPalette } from "./CommandPalette";
import { buildNav, type NavSection } from "./nav";
import { NotificationBell } from "./NotificationBell";
import { readCollapsed, Sidebar, storeCollapsed } from "./Sidebar";
import { ThemeToggle, useToggleTheme } from "./ThemeToggle";
import { ThreatStrip } from "./ThreatStrip";

export function AppShell() {
  const { user, plugins, setup, site } = useBootstrap();
  const location = useLocation();
  const navigate = useNavigate();
  const canManageSite = useHasPerm("site.manage_site");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [maintenance, setMaintenance] = useState<string | null>(null);
  const sections = useMemo(() => (user ? buildNav(user, plugins) : []), [user, plugins]);
  const theme = useToggleTheme();

  useEffect(() => {
    if (user) applyPreferences(user.preferences);
  }, [user]);

  useEffect(() => {
    const onMaintenance = (e: Event) => setMaintenance((e as CustomEvent<string>).detail || "");
    window.addEventListener(MAINTENANCE_EVENT, onMaintenance);
    return () => window.removeEventListener(MAINTENANCE_EVENT, onMaintenance);
  }, []);

  // Each page starts at the top.
  useEffect(() => {
    document.getElementById("main")?.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  if (!setup.completed && (user.is_admin || !setup.admin_claimed)) return <Navigate to="/setup" replace />;
  if ((site.maintenance.enabled || maintenance !== null) && !canManageSite) return <MaintenanceScreen message={maintenance ?? undefined} />;

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      storeCollapsed(!c);
      return !c;
    });
  };

  const logout = async () => {
    let res: { impersonation_ended?: boolean } | undefined;
    try {
      res = await api.post<{ impersonation_ended?: boolean }>("/api/core/logout");
    } catch (err) {
      toast.error(`Couldn't sign out: ${err instanceof Error ? err.message : "please try again"}`);
      return;
    }
    // A full page load, not a client-side navigation: the bootstrap query would otherwise come
    // back from the data the page started with (still signed in) and bounce /login to the dashboard.
    window.location.assign(res?.impersonation_ended ? "/" : "/login?signed_out=1");
  };

  return (
    <div className="flex min-h-full flex-col">
      <a href="#main" className="sr-only z-50 rounded-md bg-accent px-3 py-2 text-accent-fg focus:not-sr-only focus:fixed focus:left-3 focus:top-3">
        Skip to content
      </a>
      <ImpersonationBanner />
      <ThreatStrip />
      {canManageSite && <MaintenanceBanner />}
      <div className="backdrop-space flex min-h-0 flex-1">
        <aside
          className={cn(
            "sticky top-0 hidden h-screen shrink-0 border-r border-border bg-bg transition-[width] duration-200 lg:block",
            collapsed ? "w-[68px]" : "w-64",
          )}
        >
          <Sidebar sections={sections} collapsed={collapsed} onToggleCollapsed={toggleCollapsed} />
        </aside>

        <DialogPrimitive.Root open={mobileNav} onOpenChange={setMobileNav}>
          <DialogPrimitive.Portal>
            <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-overlay backdrop-blur-sm data-[state=open]:animate-fade-in lg:hidden" />
            <DialogPrimitive.Content className="fixed inset-y-0 left-0 z-50 w-72 border-r border-border bg-surface shadow-e3 animate-fade-up lg:hidden">
              <DialogPrimitive.Title className="sr-only">Navigation</DialogPrimitive.Title>
              <DialogPrimitive.Description className="sr-only">Site navigation</DialogPrimitive.Description>
              <Sidebar sections={sections} onNavigate={() => setMobileNav(false)} />
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        </DialogPrimitive.Root>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border bg-bg px-3 sm:gap-3 sm:px-6">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileNav(true)} aria-label="Open navigation">
              <Menu />
            </Button>

            <Breadcrumbs sections={sections} />

            <button
              onClick={() => setPaletteOpen(true)}
              className="group ml-auto flex h-10 w-full max-w-[20rem] items-center gap-2.5 border border-border-strong bg-transparent px-3 text-sm text-muted transition-colors hover:border-accent hover:text-text md:max-w-sm"
              aria-label="Search"
            >
              <Search className="size-4 shrink-0" />
              <span className="flex-1 truncate text-left">Search pilots, corps, systems, items</span>
              <Kbd className="hidden sm:inline-flex">Ctrl K</Kbd>
            </button>

            <Clocks />

            <div className="flex items-center gap-0.5">
              <span className="hidden sm:block">
                <ThemeToggle />
              </span>
              <NotificationBell />
              <DropdownMenu>
                <DropdownTrigger className="ml-1 outline-none ring-accent/50 focus-visible:ring-2" aria-label="Account menu">
                  <Avatar src={user.main?.portrait} name={user.name} size="sm" className="transition hover:ring-accent/60" />
                </DropdownTrigger>
                <DropdownContent className="w-60">
                  <div className="flex items-center gap-3 px-2.5 py-2">
                    <Avatar src={user.main?.portrait} name={user.name} size="md" />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{user.name}</div>
                      <div className="truncate text-xs text-muted">{user.state?.name ?? "No state"}</div>
                    </div>
                  </div>
                  <DropdownSeparator />
                  <DropdownItem onSelect={() => navigate("/characters")}>
                    <UsersRound /> My characters
                  </DropdownItem>
                  <DropdownItem onSelect={() => navigate("/notifications")}>
                    <Bell /> Notifications
                  </DropdownItem>
                  <DropdownItem onSelect={() => navigate("/settings")}>
                    <SlidersHorizontal /> Settings
                  </DropdownItem>
                  <DropdownItem onSelect={theme.toggle}>
                    {theme.isDark ? <Sun /> : <Moon />} {theme.isDark ? "Light theme" : "Dark theme"}
                  </DropdownItem>
                  <DropdownItem onSelect={() => (window.location.href = "/sso/add-character?next=/characters")}>
                    <UserPlus /> Add character
                  </DropdownItem>
                  {user.is_admin && (
                    <>
                      <DropdownSeparator />
                      <DropdownLabel>Administration</DropdownLabel>
                      <DropdownItem onSelect={() => navigate("/admin/settings")}>
                        <Settings2 /> Site settings
                      </DropdownItem>
                      {site.django_admin && (
                        <DropdownItem onSelect={() => window.open("/django-admin/", "_blank")}>
                          <ExternalLink /> Back-office
                        </DropdownItem>
                      )}
                    </>
                  )}
                  <DropdownSeparator />
                  <DropdownItem danger onSelect={logout}>
                    <LogOut /> {user.impersonated_by ? "Return to my account" : "Sign out"}
                  </DropdownItem>
                </DropdownContent>
              </DropdownMenu>
            </div>
          </header>

          <main id="main" tabIndex={-1} className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 outline-none sm:px-6 sm:py-8 lg:px-10">
            <Outlet />
          </main>
        </div>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} sections={sections} />
      <ExternalLinkGuard />
    </div>
  );
}

const EXTRA_TITLES: Record<string, string> = { "/notifications": "Notifications", "/settings": "Settings" };

/** "Section › Page › Detail", derived from the nav and the URL. */
function Breadcrumbs({ sections }: { sections: NavSection[] }) {
  const { pathname } = useLocation();
  const qc = useQueryClient();
  let best: { section: string; label: string; to: string } | null = null;
  for (const s of sections) {
    for (const item of s.items) {
      const match = item.to === "/" ? pathname === "/" : pathname === item.to || pathname.startsWith(item.to + "/");
      if (match && (!best || item.to.length > best.to.length)) best = { section: s.title, label: item.label, to: item.to };
    }
  }
  if (!best && EXTRA_TITLES[pathname]) best = { section: "Account", label: EXTRA_TITLES[pathname]!, to: pathname };
  if (!best) return <div className="hidden min-w-0 flex-1 md:block" />;

  const rest = pathname.slice(best.to.length).split("/").filter(Boolean);
  let detail: string | null = null;
  let slug = false;
  if (rest.length) {
    const id = Number(rest[0]);
    const cached = Number.isFinite(id) ? qc.getQueryData<{ name?: string }>(["character", id]) : undefined;
    slug = !Number.isFinite(id);
    detail = cached?.name ?? (slug ? rest[0]!.replace(/[-_]/g, " ") : null);
  }

  return (
    <nav aria-label="Breadcrumb" className="hidden min-w-0 flex-1 items-center gap-1.5 text-sm md:flex">
      <span className="shrink-0 text-subtle">{best.section}</span>
      <ChevronRight className="size-3.5 shrink-0 text-subtle" />
      {rest.length ? (
        <>
          <Link to={best.to} className="shrink-0 text-muted hover:text-text">
            {best.label}
          </Link>
          {detail && (
            <>
              <ChevronRight className="size-3.5 shrink-0 text-subtle" />
              <span className={cn("truncate font-medium text-text", slug && "capitalize")}>{detail}</span>
            </>
          )}
        </>
      ) : (
        <span className="truncate font-medium text-text">{best.label}</span>
      )}
    </nav>
  );
}
