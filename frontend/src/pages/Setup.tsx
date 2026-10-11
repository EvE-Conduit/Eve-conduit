import { useMutation } from "@tanstack/react-query";
import { Check, ClipboardCopy, ExternalLink, KeyRound, LogIn, Palette, Puzzle, Rocket, ShieldCheck } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Navigate } from "react-router";
import { toast } from "sonner";

import { BrandingForm, type BrandingValues } from "@/components/BrandingForm";
import { BrandMark } from "@/components/layout/Brand";
import { PluginList } from "@/components/PluginList";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/feedback";
import { Field, Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { applyBranding, useBootstrap, useRefreshBootstrap } from "@/lib/bootstrap";
import type { Bootstrap } from "@/lib/types";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: "sso", label: "Connect EVE SSO", icon: KeyRound },
  { id: "login", label: "Sign in", icon: LogIn },
  { id: "claim", label: "Become admin", icon: ShieldCheck },
  { id: "brand", label: "Branding", icon: Palette },
  { id: "plugins", label: "Plugins", icon: Puzzle },
] as const;

export function Setup() {
  const { setup, user, site } = useBootstrap();
  const refresh = useRefreshBootstrap();
  const [brandStep, setBrandStep] = useState<"brand" | "plugins">("brand");
  const [branding, setBranding] = useState<BrandingValues>({ name: site.name, tagline: site.tagline, accent: site.accent, logo_url: site.logo_url });

  if (setup.completed) return <Navigate to="/" replace />;
  if (user && !user.is_admin && setup.admin_claimed) return <Navigate to="/" replace />;

  const current = !setup.sso_configured ? "sso" : !user ? "login" : !user.is_admin ? "claim" : brandStep;
  const currentIndex = STEPS.findIndex((s) => s.id === current);

  return (
    <div className="backdrop-space min-h-full px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10 flex items-center gap-3 animate-fade-up">
          <BrandMark className="size-10" />
          <div>
            <div className="text-xs font-medium uppercase tracking-[0.18em] text-accent-ink">First-run setup</div>
            <h1 className="text-2xl font-semibold tracking-tight">Let's get your site ready</h1>
          </div>
        </div>

        <ol className="mb-8 grid grid-cols-5 gap-2">
          {STEPS.map((step, i) => (
            <li key={step.id} className="min-w-0">
              <div className={cn("h-1 rounded-none transition-colors", i <= currentIndex ? "bg-accent" : "bg-surface-3")} />
              <div className={cn("mt-2 flex items-center gap-1.5 text-xs", i === currentIndex ? "text-text" : i < currentIndex ? "text-muted" : "text-subtle")}>
                {i < currentIndex ? <Check className="size-3.5 text-accent-ink" /> : <step.icon className="size-3.5" />}
                <span className="hidden truncate sm:inline">{step.label}</span>
              </div>
            </li>
          ))}
        </ol>

        <div className="panel animate-fade-up rounded-2xl" key={current}>
          {current === "sso" && <SsoStep callbackUrl={setup.callback_url} source={setup.sso_source} onDone={refresh} />}
          {current === "login" && (
            <Step title="Sign in with your main character" description="This account becomes the site's first administrator.">
              <a href="/sso/login?next=/setup">
                <Button variant="primary" size="lg">
                  <LogIn /> Log in with EVE Online
                </Button>
              </a>
            </Step>
          )}
          {current === "claim" && <ClaimStep verified={setup.verified} onClaimed={refresh} />}
          {current === "brand" && (
            <BrandStep
              branding={branding}
              setBranding={setBranding}
              onSaved={(saved) => {
                applyBranding(saved);
                refresh();
                setBrandStep("plugins");
              }}
            />
          )}
          {current === "plugins" && (
            <FinishStep
              onBack={() => setBrandStep("brand")}
              onDone={async () => {
                await refresh();
                // A full load, so the plugins switched on here get their pages.
                window.location.assign("/");
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function Step({ title, description, children, footer }: { title: string; description?: ReactNode; children?: ReactNode; footer?: ReactNode }) {
  return (
    <>
      <div className="border-b border-border px-6 py-5 sm:px-8">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      <div className="px-6 py-6 sm:px-8">{children}</div>
      {footer && <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4 sm:px-8">{footer}</div>}
    </>
  );
}

function SsoStep({ callbackUrl, source, onDone }: { callbackUrl: string; source: Bootstrap["setup"]["sso_source"]; onDone: () => void }) {
  const [clientId, setClientId] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [token, setToken] = useState("");
  const copy = () => navigator.clipboard.writeText(callbackUrl).then(() => toast.success("Callback URL copied"));
  const save = useMutation({
    mutationFn: () => api.post("/api/setup/sso", { token, client_id: clientId, secret_key: secretKey }),
    onSuccess: () => {
      toast.success("EVE login connected");
      onDone();
    },
    onError: (e) => toast.error(e.message),
  });
  const ready = clientId.trim() && secretKey.trim() && token.trim();
  return (
    <Step
      title="Connect EVE Online login"
      description="EvE Conduit signs people in through EVE's official SSO. Each site registers its own application with CCP."
      footer={
        source === "env" ? (
          <Button variant="primary" onClick={onDone}>
            I've done this, check again
          </Button>
        ) : (
          <Button variant="primary" loading={save.isPending} disabled={!ready} onClick={() => save.mutate()}>
            Connect EVE login
          </Button>
        )
      }
    >
      <ol className="space-y-5 text-sm">
        <Instruction n={1}>
          Go to{" "}
          <a href="https://developers.eveonline.com/applications" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-accent-ink hover:underline">
            developers.eveonline.com <ExternalLink className="size-3" />
          </a>{" "}
          and create a new application with <b>Authentication &amp; API Access</b>.
        </Instruction>
        <Instruction n={2}>
          Set the callback URL to exactly:
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 truncate rounded-lg border border-border-strong bg-bg/60 px-3 py-2 font-mono text-xs">{callbackUrl}</code>
            <Button size="icon" onClick={copy} aria-label="Copy callback URL">
              <ClipboardCopy />
            </Button>
          </div>
        </Instruction>
        <Instruction n={3}>Select all scopes. Sign-in asks for every one, and a missing scope makes the EVE login fail.</Instruction>
        {source === "env" ? (
          <Instruction n={4}>
            Put the application's Client ID and Secret Key in the server's config file as <code className="font-mono text-xs">ESI_CLIENT_ID</code> and{" "}
            <code className="font-mono text-xs">ESI_SECRET_KEY</code>, then restart EvE Conduit.
          </Instruction>
        ) : (
          <Instruction n={4}>
            Paste the application's <b>Client ID</b> and <b>Secret Key</b> here, with the one-time <b>setup code</b> the installer printed (it is
            also in the server log). EvE Conduit checks them with EVE and keeps them, encrypted, in its database.
            <form
              className="mt-3 grid gap-3 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (ready) save.mutate();
              }}
            >
              <Field label="Client ID" required>
                <Input value={clientId} onChange={(e) => setClientId(e.target.value)} className="font-mono" autoComplete="off" spellCheck={false} />
              </Field>
              <Field label="Secret Key" required>
                <Input type="password" value={secretKey} onChange={(e) => setSecretKey(e.target.value)} className="font-mono" autoComplete="new-password" />
              </Field>
              <Field label="Setup code" required hint="Printed by the installer; or run the setup-code command from your install guide." className="sm:col-span-2">
                <Input value={token} onChange={(e) => setToken(e.target.value)} className="font-mono" autoComplete="off" spellCheck={false} />
              </Field>
            </form>
          </Instruction>
        )}
      </ol>
    </Step>
  );
}

function Instruction({ n, children }: { n: number; children: ReactNode }) {
  return (
    <li className="flex gap-4">
      <span className="grid size-6 shrink-0 place-items-center rounded-none bg-accent-soft font-mono text-xs text-accent-ink ring-1 ring-accent/25">{n}</span>
      <div className="min-w-0 flex-1 pt-0.5 text-muted [&_b]:text-text">{children}</div>
    </li>
  );
}

function ClaimStep({ verified, onClaimed }: { verified: boolean; onClaimed: () => void }) {
  const [code, setCode] = useState("");
  const [needCode, setNeedCode] = useState(!verified);
  const claim = useMutation({
    mutationFn: (token: string) => api.post("/api/setup/claim", { token }),
    onSuccess: () => {
      toast.success("You're now the administrator");
      onClaimed();
    },
    onError: (e) => {
      setNeedCode(true);
      toast.error(e.message);
    },
  });
  // The code was already entered with the EVE application, so this browser is trusted: claim straight away.
  useEffect(() => {
    if (verified) claim.mutate("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verified]);
  if (!needCode) {
    return (
      <Step title="Making you the administrator" description="You proved you run this server when you connected the EVE application.">
        <Spinner />
      </Step>
    );
  }
  return (
    <Step title="Prove you run this server" description="To stop anyone else claiming your fresh install, enter the one-time setup code the installer printed. It is also in the server log.">
      <div className="space-y-4">
        <p className="text-sm text-muted">
          Lost it? It is printed again by <code className="font-mono text-xs">conduit setup-code</code> on Linux and Windows installs, or{" "}
          <code className="font-mono text-xs">docker compose logs web | grep "setup code"</code> on Docker.
        </p>
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            claim.mutate(code);
          }}
        >
          <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Paste the setup code" className="h-11 font-mono" autoFocus />
          <Button variant="primary" size="lg" loading={claim.isPending} disabled={!code.trim()}>
            Claim admin
          </Button>
        </form>
      </div>
    </Step>
  );
}

function BrandStep({
  branding,
  setBranding,
  onSaved,
}: {
  branding: BrandingValues;
  setBranding: (v: BrandingValues) => void;
  onSaved: (site: Bootstrap["site"]) => void;
}) {
  const save = useMutation({
    mutationFn: () => api.put<Bootstrap["site"]>("/api/admin/site", branding),
    onSuccess: onSaved,
    onError: (e) => toast.error(e.message),
  });
  return (
    <Step
      title="Make it yours"
      description="Name your site and pick a colour. You can change this any time in Settings."
      footer={
        <Button variant="primary" loading={save.isPending} onClick={() => save.mutate()}>
          Save and continue
        </Button>
      }
    >
      <BrandingForm value={branding} onChange={setBranding} />
    </Step>
  );
}

function FinishStep({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
  const finish = useMutation({ mutationFn: () => api.post("/api/setup/complete"), onSuccess: onDone, onError: (e) => toast.error(e.message) });
  return (
    <Step
      title="Choose your plugins"
      description="Everything beyond sign-in and access control is a plugin. Switch on what you need now; more can be installed later."
      footer={
        <>
          <Button variant="ghost" onClick={onBack}>
            Back
          </Button>
          <Button variant="primary" loading={finish.isPending} onClick={() => finish.mutate()}>
            <Rocket /> Finish setup
          </Button>
        </>
      }
    >
      <PluginList compact reloadOnChange={false} />
    </Step>
  );
}
