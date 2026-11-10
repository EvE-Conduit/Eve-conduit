import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, CircleAlert, Loader2, Minimize2, PartyPopper, RefreshCw, WifiOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { BOOTSTRAP_KEY, fetchBootstrap, useBootstrap, useHasPerm } from "@/lib/bootstrap";
import type { UpdateProgress } from "@/lib/types";
import { cn } from "@/lib/utils";

type Kind = UpdateProgress["kind"];
interface Run {
  kind: Kind;
  target: string;
  /** Identifies this update, so "Hide" only hides this one. */
  key: string;
  startedAt: number;
  /** Seen while still waiting for the updater (admins), so that step is listed too. */
  waited: boolean;
  /** The steps the updater goes through for this kind of run, as the server lists them. */
  steps: string[];
}
/** "finished": the updater is done and the site is back, but whether it worked isn't known here (see `outcome`). */
type Phase = "waiting" | "working" | "reconnecting" | "done" | "failed" | "finished";

const STEP_TEXT: Record<string, { label: string; hint: string }> = {
  waiting: { label: "Waiting for the updater", hint: "It usually starts within a few seconds." },
  backup: { label: "Backing up", hint: "A copy of the database and settings, in case anything goes wrong." },
  install: { label: "Installing", hint: "Putting the new files in place." },
  restore: { label: "Restoring the backup", hint: "Putting the database back to how it was." },
  migrate: { label: "Updating the database", hint: "Bringing the database up to date for this version." },
  restart: { label: "Restarting", hint: "The site is offline for a moment and comes back by itself." },
};
const DEFAULT_STEPS = ["backup", "install", "migrate", "restart"];

/** What happened, in words, per kind of run. */
const WORDS: Record<Kind, { working: string; finished: string; failed: string; undone: string; page: string }> = {
  release: { working: "Updating EvE Conduit", finished: "The update has finished", failed: "The update didn't finish", undone: "The previous version was put back", page: "Updates" },
  plugins: { working: "Installing plugins", finished: "The plugin install has finished", failed: "The plugin install didn't finish", undone: "The previous plugins were put back", page: "Plugins" },
  restore: { working: "Restoring a backup", finished: "The restore has finished", failed: "The restore didn't finish", undone: "The database from before the restore was put back", page: "Backups" },
};

/**
 * Whether the last run of this kind worked, from the page that manages it. Only people who may open that page
 * can ask; null when it can't be told.
 */
async function outcome(kind: Kind): Promise<boolean | null> {
  let state: string | undefined;
  if (kind === "plugins") state = (await api.get<{ job: { state: string } }>("/api/admin/plugin-installs")).job.state;
  else if (kind === "restore") {
    const { job } = await api.get<{ job: { action: string; status: string } | null }>("/api/admin/backups");
    state = job?.action === "restore" ? job.status : undefined;
  } else state = (await api.get<{ install: { state: string } }>("/api/admin/updates")).install.state;
  return state === "succeeded" ? true : state === "failed" ? false : null;
}

/**
 * A pop-up in the middle of the screen while an update or plugin install runs: each step as it happens, then
 * whether it worked. Everyone sees it; "Hide" leaves the banner at the top instead.
 */
export function UpdateOverlay() {
  const { site } = useBootstrap();
  const qc = useQueryClient();
  // Subscribe to the bootstrap query's state too: failures mean the site is restarting.
  const { failureCount, isFetching } = useQuery({ queryKey: BOOTSTRAP_KEY, queryFn: fetchBootstrap, enabled: false });
  const [run, setRun] = useState<Run | null>(null);
  const [phase, setPhase] = useState<Phase>("working");
  const [step, setStep] = useState<string>("waiting");
  const [hidden, setHidden] = useState<string | null>(() => sessionStorageGet("conduit:update-hidden"));
  const [now, setNow] = useState(Date.now());
  const startVersion = useRef(site.version);
  const canManageSite = useHasPerm("site.manage_site");
  const canManagePlugins = useHasPerm("site.manage_plugins");

  const updating = site.updating;
  const pending = site.update_pending;

  // Follow the updater: waiting -> steps -> site down while it restarts -> back again.
  useEffect(() => {
    if (failureCount > 0) {
      // The site doesn't answer: it's restarting (the data we have is from before).
      if (run && (phase === "working" || phase === "waiting")) {
        setStep("restart");
        setPhase("reconnecting");
      }
      return;
    }
    if (isFetching) return;
    if (updating) {
      const key = `${updating.kind}:${updating.target}:${updating.started_at}`;
      const steps = updating.steps?.length ? updating.steps : DEFAULT_STEPS;
      setRun((r) => (r && r.kind === updating.kind && r.target === updating.target ? r : { kind: updating.kind, target: updating.target, key, startedAt: Date.parse(updating.started_at) || Date.now(), waited: false, steps }));
      setStep(updating.step);
      setPhase("working");
    } else if (pending) {
      const key = `${pending.kind}:${pending.target}:${pending.requested_at}`;
      setRun((r) => r ?? { kind: pending.kind, target: pending.target, key, startedAt: Date.parse(pending.requested_at ?? "") || Date.now(), waited: true, steps: DEFAULT_STEPS });
      setStep("waiting");
      setPhase("waiting");
    } else if (run && phase === "waiting") {
      setRun(null); // cancelled before the updater started
    } else if (run && (phase === "working" || phase === "reconnecting")) {
      // Only a release to a known version shows in what everyone is sent (the version now running). For plugin
      // installs and restores the result is asked for below, from those who may see it.
      if (run.kind === "release" && run.target) setPhase(site.version === run.target ? "done" : "failed");
      else if (run.kind === "release" && site.version !== startVersion.current) setPhase("done");
      else setPhase("finished");
    }
  }, [updating, pending, failureCount, isFetching, run, phase, site.version]);

  const kind = run?.kind;
  const canAsk = kind === "plugins" ? canManagePlugins : canManageSite;
  useEffect(() => {
    if (phase !== "finished" || !kind || !canAsk) return;
    let stale = false;
    outcome(kind).then(
      (ok) => {
        if (!stale && ok !== null) setPhase((p) => (p === "finished" ? (ok ? "done" : "failed") : p));
      },
      () => undefined,
    );
    return () => {
      stale = true;
    };
  }, [phase, kind, canAsk]);

  // Elapsed time, and the automatic reload once a new version is running.
  useEffect(() => {
    if (!run || phase === "failed") return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [run, phase]);
  const [reloadAt, setReloadAt] = useState<number | null>(null);
  useEffect(() => {
    // Either way the site restarted, so the page is loaded again; not when it's known to have failed.
    if (phase === "done" || phase === "finished") setReloadAt((at) => at ?? Date.now() + 6000);
    else if (phase === "failed") setReloadAt(null);
  }, [phase]);
  useEffect(() => {
    if (reloadAt && now >= reloadAt) window.location.reload();
  }, [now, reloadAt]);

  if (!run) return null;
  const over = phase === "done" || phase === "failed" || phase === "finished";
  const open = hidden !== run.key || over;
  const words = WORDS[run.kind];
  const close = () => {
    if (over) {
      setRun(null);
      setReloadAt(null);
      startVersion.current = site.version;
      qc.invalidateQueries({ queryKey: BOOTSTRAP_KEY });
      return;
    }
    setHidden(run.key);
    sessionStorageSet("conduit:update-hidden", run.key);
  };

  const title =
    phase === "done"
      ? run.kind === "plugins" ? "Plugins installed" : run.kind === "restore" ? "Backup restored" : `EvE Conduit ${site.version} is running`
      : phase === "failed"
        ? words.failed
        : phase === "finished"
          ? words.finished
          : run.kind === "release" && run.target ? `Updating to EvE Conduit ${run.target}` : words.working;
  const elapsed = Math.max(0, Math.round((now - run.startedAt) / 1000));
  const steps = run.waited ? ["waiting", ...run.steps] : run.steps;
  const current = steps.indexOf(step);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()} title={title} description={describe(phase, run, site.version, startVersion.current)} size="md">
      {over ? (
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <div
            className={cn(
              "grid size-14 place-items-center rounded-2xl border",
              phase === "done" ? "border-success/35 bg-success-soft text-success-fg" : phase === "failed" ? "border-warning/35 bg-warning-soft text-warning-fg" : "border-info/35 bg-info-soft text-info-fg",
            )}
          >
            {phase === "done" ? <PartyPopper className="size-6" /> : phase === "failed" ? <CircleAlert className="size-6" /> : <Check className="size-6" />}
          </div>
          {phase === "failed" ? (
            <p className="text-sm text-muted">{words.undone} and the site is working. Administrators can see why under Administration → {words.page}.</p>
          ) : (
            <p className="text-sm text-muted">
              Reloading in {Math.max(0, Math.ceil(((reloadAt ?? now) - now) / 1000))} s{phase === "done" ? ` to load ${run.kind === "release" ? "the new version" : "the changes"}` : ""}…
            </p>
          )}
          <div className="flex gap-2">
            {phase !== "failed" && (
              <Button variant="primary" onClick={() => window.location.reload()}>
                <RefreshCw /> Reload now
              </Button>
            )}
            <Button variant="ghost" onClick={close}>
              Close
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <ol className="space-y-1" aria-label="Update progress">
            {steps.map((id, i) => {
              const s = STEP_TEXT[id] ?? { label: id, hint: "" };
              const state = i < current ? "done" : i === current ? "active" : "todo";
              return (
                <li key={id} aria-current={state === "active" ? "step" : undefined} className={cn("flex gap-3 rounded-lg px-3 py-2.5 transition-colors", state === "active" && "bg-accent-soft")}>
                  <span
                    className={cn(
                      "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border text-[11px]",
                      state === "done" && "border-success/40 bg-success-soft text-success-fg",
                      state === "active" && "border-accent text-accent-ink",
                      state === "todo" && "border-border-strong text-subtle",
                    )}
                  >
                    {state === "done" ? <Check className="size-3.5" /> : state === "active" ? <Loader2 className="size-3.5 animate-spin" /> : null}
                  </span>
                  <span className="min-w-0">
                    <span className={cn("block text-sm", state === "todo" ? "text-subtle" : "font-medium text-text")}>{s.label}</span>
                    {state === "active" && (
                      <span className="mt-0.5 block text-xs text-muted">
                        {phase === "reconnecting" ? (
                          <span className="inline-flex items-center gap-1.5">
                            <WifiOff className="size-3.5" /> The site is restarting. Reconnecting…
                          </span>
                        ) : (
                          s.hint
                        )}
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ol>
          <div className="flex items-center justify-between gap-3 border-t border-border pt-4 text-xs text-muted">
            <span className="font-mono tabular-nums">
              {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")} elapsed
            </span>
            <Button size="sm" variant="ghost" onClick={close}>
              <Minimize2 /> Hide
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}

function describe(phase: Phase, run: Run, version: string, startVersion: string) {
  if (phase === "done") {
    if (run.kind === "plugins") return "The site has restarted with the changes.";
    if (run.kind === "restore") return "The site is running on the restored database. You may have to sign in again.";
    return startVersion !== version ? `Updated from ${startVersion}.` : "The update is installed.";
  }
  if (phase === "failed") return run.kind === "release" ? `EvE Conduit ${version} is still running.` : "Nothing was changed.";
  if (phase === "finished") return `The site is back. Whether it worked is shown under Administration → ${WORDS[run.kind].page}.`;
  if (phase === "waiting") return "Starting soon. You can keep using the site until it restarts near the end.";
  if (phase === "reconnecting") return "The site is restarting with the changes. This window reconnects by itself.";
  if (run.kind === "restore") return "The site is offline while the backup is put back, and returns by itself. This window follows along.";
  return "The site keeps working until it restarts near the end, which takes a minute or two. This window follows along.";
}

function sessionStorageGet(key: string) {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function sessionStorageSet(key: string, value: string) {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // only means "Hide" isn't remembered across reloads
  }
}
