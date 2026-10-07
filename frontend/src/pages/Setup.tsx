import { useMutation } from "@tanstack/react-query";
import { Check, ClipboardCopy, ExternalLink, KeyRound, LogIn, Palette, Puzzle, Rocket, ShieldCheck } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Navigate, useNavigate } from "react-router";
import { toast } from "sonner";

import { BrandingForm, type BrandingValues } from "@/components/BrandingForm";
import { BrandMark } from "@/components/layout/Brand";
import { PluginList } from "@/components/PluginList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const navigate = useNavigate();
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
          {current === "sso" && <SsoStep callbackUrl={setup.callback_url} onRecheck={refresh} />}
          {current === "login" && (
            <Step title="Sign in with your main character" description="This account becomes the site's first administrator.">
              <a href="/sso/login?next=/setup">
                <Button variant="primary" size="lg">
                  <LogIn /> Log in with EVE Online
                </Button>
              </a>
            </Step>
          )}
          {current === "claim" && <ClaimStep onClaimed={refresh} />}
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
                toast.success("You're all set. Welcome aboard!");
                navigate("/");
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

function SsoStep({ callbackUrl, onRecheck }: { callbackUrl: string; onRecheck: () => void }) {
  const copy = () => navigator.clipboard.writeText(callbackUrl).then(() => toast.success("Callback URL copied"));
  return (
    <Step
      title="Connect EVE Online login"
      description="EvE Conduit signs people in through EVE's official SSO. Each site registers its own application with CCP."
      footer={<Button variant="primary" onClick={onRecheck}>I've done this, check again</Button>}
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
        <Instruction n={4}>
          Put the Client ID and Secret Key in your <code className="font-mono text-xs text-accent-ink">.env</code> file as{" "}
          <code className="font-mono text-xs">ESI_CLIENT_ID</code> and <code className="font-mono text-xs">ESI_SECRET_KEY</code>, then restart:{" "}
          <code className="font-mono text-xs">docker compose up -d</code>
        </Instruction>
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

function ClaimStep({ onClaimed }: { onClaimed: () => void }) {
  const [code, setCode] = useState("");
  const claim = useMutation({
    mutationFn: () => api.post("/api/setup/claim", { token: code }),
    onSuccess: () => {
      toast.success("You're now the administrator");
      onClaimed();
    },
    onError: (e) => toast.error(e.message),
  });
  return (
    <Step title="Prove you run this server" description="To stop anyone else claiming your fresh install, enter the one-time setup code from the server logs.">
      <div className="space-y-4">
        <pre className="overflow-x-auto rounded-lg border border-border bg-bg/70 px-4 py-3 font-mono text-xs text-muted">
          docker compose logs web | grep "setup code"
        </pre>
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            claim.mutate();
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
      <PluginList compact />
    </Step>
  );
}
