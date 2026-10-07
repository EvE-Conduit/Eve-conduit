import { Construction, Loader2, RefreshCw, UserCog, Wrench } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useBootstrap } from "@/lib/bootstrap";

import { updateTitle } from "@/components/updates/UpdateSteps";

import { BrandMark } from "./Brand";

const STEP_WORDS = { backup: "backing up", install: "installing", migrate: "updating the database", restart: "restarting" } as const;
export const UPDATING_KEY = "conduit:updating";

/** Everyone sees this while the updater works: the site goes offline for a minute or two at the end. Once the
 * new version is running, offers a reload so the browser gets its front end too. */
export function UpdatingBanner() {
  const { site } = useBootstrap();
  const [loadedVersion] = useState(site.version);
  const updating = site.updating;
  useEffect(() => {
    try {
      if (updating) localStorage.setItem(UPDATING_KEY, JSON.stringify(updating));
      else localStorage.removeItem(UPDATING_KEY);
    } catch {
      // storage unavailable; the offline screen just says less
    }
  }, [updating]);

  if (updating) {
    return (
      <div role="status" className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-info/30 bg-info-soft px-4 py-2 text-sm">
        <Loader2 className="size-4 animate-spin text-info-fg" />
        <span className="font-medium text-text">{updateTitle(updating)}</span>
        <span className="text-muted">
          Now {STEP_WORDS[updating.step]}. The site is offline for a minute or two near the end, and comes back by itself.
        </span>
      </div>
    );
  }
  if (site.version !== loadedVersion) {
    return (
      <div role="status" className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-success/30 bg-success-soft px-4 py-2 text-sm">
        <span className="font-medium text-text">EvE Conduit {site.version} is running.</span>
        <span className="text-muted">Reload to get the new version of this page.</span>
        <Button size="xs" variant="secondary" onClick={() => window.location.reload()}>
          <RefreshCw /> Reload
        </Button>
      </div>
    );
  }
  return null;
}

/** Shown while an admin is signed in as someone else. */
export function ImpersonationBanner() {
  const { user } = useBootstrap();
  const [busy, setBusy] = useState(false);
  if (!user?.impersonated_by) return null;
  const stop = async () => {
    setBusy(true);
    try {
      await api.post("/api/core/impersonate/stop");
      window.location.assign("/");
    } catch (err) {
      setBusy(false);
      toast.error(err instanceof Error ? err.message : "Couldn't return to your account");
    }
  };
  return (
    <div role="status" className="sticky top-0 z-40 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-b border-warning/40 bg-[color-mix(in_oklab,var(--warning)_22%,var(--bg))] px-4 py-2 text-sm">
      <span className="flex items-center gap-2 text-text">
        <UserCog className="size-4 text-warning-fg" />
        You are signed in as <strong className="font-semibold">{user.name}</strong>
        <span className="text-muted">(by {user.impersonated_by.name})</span>
      </span>
      <Button size="xs" variant="secondary" loading={busy} onClick={stop}>
        Return to my account
      </Button>
    </div>
  );
}

/** Admins keep working during maintenance; remind them it's on. */
export function MaintenanceBanner() {
  const { site } = useBootstrap();
  if (!site.maintenance.enabled) return null;
  return (
    <div role="status" className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-warning/30 bg-warning-soft px-4 py-2 text-sm">
      <Wrench className="size-4 text-warning-fg" />
      <span className="font-medium text-text">Maintenance mode is on.</span>
      <span className="text-muted">Only administrators can use the site.</span>
      <Link to="/admin/settings" className="font-medium text-warning-fg underline underline-offset-4">
        Settings
      </Link>
    </div>
  );
}

/** What everyone else sees while the site is in maintenance. */
export function MaintenanceScreen({ message }: { message?: string }) {
  const { site } = useBootstrap();
  const logout = async () => {
    await api.post("/api/core/logout").catch(() => undefined);
    window.location.assign("/login?signed_out=1");
  };
  return (
    <div className="backdrop-space grid min-h-full place-items-center px-4 py-16 text-center">
      <div className="max-w-md animate-fade-up">
        <BrandMark className="mx-auto size-12" />
        <div className="mx-auto mt-8 grid size-14 place-items-center rounded-2xl border border-warning/30 bg-warning-soft text-warning-fg">
          <Construction className="size-6" />
        </div>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">{site.name} is down for maintenance</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">{message || site.maintenance.message || "We're making some changes and will be back shortly."}</p>
        <div className="mt-8 flex justify-center gap-2">
          <Button variant="primary" onClick={() => window.location.reload()}>
            Try again
          </Button>
          <Button variant="ghost" onClick={logout}>
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
