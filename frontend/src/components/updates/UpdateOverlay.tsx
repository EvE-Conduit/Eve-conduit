import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, CircleAlert, Loader2, Minimize2, PartyPopper, RefreshCw, WifiOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { BOOTSTRAP_KEY, fetchBootstrap, useBootstrap } from "@/lib/bootstrap";
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
}
type Phase = "waiting" | "working" | "reconnecting" | "done" | "failed";

const STEPS: { id: string; label: string; hint: string }[] = [
  { id: "waiting", label: "Waiting for the updater", hint: "It usually starts within a few seconds." },
  { id: "backup", label: "Backing up", hint: "A copy of the database and settings, in case anything goes wrong." },
  { id: "install", label: "Installing", hint: "Putting the new files in place." },
  { id: "migrate", label: "Updating the database", hint: "Bringing the database up to date for the new version." },
  { id: "restart", label: "Restarting", hint: "The site is offline for a moment and comes back by itself." },
];

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
      setRun((r) => (r && r.kind === updating.kind && r.target === updating.target ? r : { kind: updating.kind, target: updating.target, key, startedAt: Date.parse(updating.started_at) || Date.now(), waited: false }));
      setStep(updating.step);
      setPhase("working");
    } else if (pending) {
      const key = `${pending.kind}:${pending.target}:${pending.requested_at}`;
      setRun((r) => r ?? { kind: pending.kind, target: pending.target, key, startedAt: Date.parse(pending.requested_at ?? "") || Date.now(), waited: true });
      setStep("waiting");
      setPhase("waiting");
    } else if (run && phase === "waiting") {
      setRun(null); // cancelled before the updater started
    } else if (run && (phase === "working" || phase === "reconnecting")) {
      const ok = run.kind === "plugins" || !run.target || site.version === run.target;
      setPhase(ok ? "done" : "failed");
    }
  }, [updating, pending, failureCount, isFetching, run, phase, site.version]);

  // Elapsed time, and the automatic reload once a new version is running.
  useEffect(() => {
    if (!run || phase === "failed") return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [run, phase]);
  const [reloadAt, setReloadAt] = useState<number | null>(null);
  useEffect(() => {
    if (phase === "done") setReloadAt(Date.now() + 6000);
  }, [phase]);
  useEffect(() => {
    if (reloadAt && now >= reloadAt) window.location.reload();
  }, [now, reloadAt]);

  if (!run) return null;
  const open = hidden !== run.key || phase === "done" || phase === "failed";
  const close = () => {
    if (phase === "done" || phase === "failed") {
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
      ? run.kind === "plugins" ? "Plugins installed" : `EvE Conduit ${site.version} is running`
      : phase === "failed"
        ? "The update didn't finish"
        : run.kind === "plugins" ? "Installing plugins" : run.target ? `Updating to EvE Conduit ${run.target}` : "Updating EvE Conduit";
  const elapsed = Math.max(0, Math.round((now - run.startedAt) / 1000));
  const current = STEPS.findIndex((s) => s.id === step);
  const steps = run.waited ? STEPS : STEPS.slice(1);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()} title={title} description={describe(phase, run, site.version, startVersion.current)} size="md">
      {phase === "done" || phase === "failed" ? (
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <div className={cn("grid size-14 place-items-center rounded-2xl border", phase === "done" ? "border-success/35 bg-success-soft text-success-fg" : "border-warning/35 bg-warning-soft text-warning-fg")}>
            {phase === "done" ? <PartyPopper className="size-6" /> : <CircleAlert className="size-6" />}
          </div>
          {phase === "done" ? (
            <p className="text-sm text-muted">Reloading in {Math.max(0, Math.ceil(((reloadAt ?? now) - now) / 1000))} s to load {run.kind === "plugins" ? "the changes" : "the new version"}…</p>
          ) : (
            <p className="text-sm text-muted">The previous version was put back and the site is working. Administrators can see why under Administration → Updates.</p>
          )}
          <div className="flex gap-2">
            {phase === "done" && (
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
            {steps.map((s) => {
              const i = STEPS.indexOf(s);
              const state = i < current ? "done" : i === current ? "active" : "todo";
              return (
                <li key={s.id} aria-current={state === "active" ? "step" : undefined} className={cn("flex gap-3 rounded-lg px-3 py-2.5 transition-colors", state === "active" && "bg-accent-soft")}>
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
    return run.kind === "plugins" ? "The site has restarted with the changes." : startVersion !== version ? `Updated from ${startVersion}.` : "The update is installed.";
  }
  if (phase === "failed") return `EvE Conduit ${version} is still running.`;
  if (phase === "waiting") return "Starting soon. You can keep using the site until it restarts near the end.";
  if (phase === "reconnecting") return "The site is restarting with the changes. This window reconnects by itself.";
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
