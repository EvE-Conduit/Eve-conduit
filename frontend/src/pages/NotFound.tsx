import { ArrowLeft, Compass } from "lucide-react";
import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router";

import { Button } from "@/components/ui/button";
import { useBootstrap } from "@/lib/bootstrap";
import { useLoadedPlugins } from "@/lib/pluginContext";

const RELOADED_KEY = "conduit:plugin-reload";

/** A page of a plugin that was switched on after this tab loaded the site: its pages need a fresh load. */
function useLoadMissingPlugin() {
  const { pathname } = useLocation();
  const { plugins } = useBootstrap();
  const loaded = useLoadedPlugins();
  const id = /^\/(?:public\/)?p\/([a-z][a-z0-9_]*)/.exec(pathname)?.[1];
  const missing = !!id && plugins.some((p) => p.id === id && p.entry) && !loaded.some((p) => p.info.id === id);
  useEffect(() => {
    if (!missing) return;
    try {
      // Once a minute at most, so a plugin whose bundle won't load can't keep reloading the page.
      const last = Number(sessionStorage.getItem(RELOADED_KEY) ?? 0);
      if (Date.now() - last < 60_000) return;
      sessionStorage.setItem(RELOADED_KEY, String(Date.now()));
    } catch {
      return;
    }
    window.location.reload();
  }, [missing]);
  return missing;
}

export function NotFound() {
  const navigate = useNavigate();
  const missing = useLoadMissingPlugin();
  return (
    <div className="flex flex-col items-center px-6 py-20 text-center animate-fade-up">
      <div className="hex grid size-16 place-items-center bg-accent-soft text-accent-ink">
        <Compass className="size-7" />
      </div>
      <div className="mt-8 font-mono text-sm font-semibold tracking-widest text-subtle">404</div>
      <h1 className="hud-title mt-2 text-3xl">Lost in space</h1>
      <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted">
        {missing
          ? "This plugin was switched on after the site loaded in this tab. Reload to open it."
          : "There's nothing at these coordinates. The page may have moved, or its plugin is switched off."}
      </p>
      <div className="mt-8 flex gap-2">
        {missing && (
          <Button variant="primary" onClick={() => window.location.reload()}>
            Reload
          </Button>
        )}
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft /> Go back
        </Button>
        <Link to="/">
          <Button variant="primary">Warp to dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
