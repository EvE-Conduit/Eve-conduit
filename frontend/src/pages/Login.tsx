import { ArrowRight, Boxes, Lock, Radar, ShieldCheck } from "lucide-react";
import { Navigate, useSearchParams } from "react-router";

import { BrandMark } from "@/components/layout/Brand";
import { Alert } from "@/components/ui/feedback";
import { useBootstrap } from "@/lib/bootstrap";
import { SSO_ERRORS } from "@/lib/messages";

const FEATURES = [
  { icon: ShieldCheck, title: "One login for everything", text: "Sign in with EVE Online. Your groups, services and tools follow you." },
  { icon: Radar, title: "All your characters together", text: "Link alts once and see skills, wallets and assets side by side." },
  { icon: Boxes, title: "Built to grow", text: "New tools arrive as modules your leadership can switch on." },
];

export function Login() {
  const { user, site, setup } = useBootstrap();
  const [params] = useSearchParams();
  const next = params.get("next") || "/";
  const error = params.get("error");
  const signedOut = params.has("signed_out");

  if (user) return <Navigate to={next} replace />;

  return (
    <div className="relative flex min-h-full flex-col overflow-hidden bg-bg">
      {/* A capital ship from CCP's image server, faded into the ground on the right. */}
      <img
        src="https://images.evetech.net/types/23913/render?size=1024"
        alt=""
        aria-hidden
        className="pointer-events-none absolute right-[-8%] top-1/2 hidden w-[62vw] max-w-[1000px] -translate-y-1/2 opacity-40 [mask-image:linear-gradient(to_left,black_45%,transparent)] lg:block"
      />

      <header className="relative z-10 flex items-center justify-between border-b border-border px-6 py-4 sm:px-10">
        <div className="flex items-center gap-3">
          <BrandMark className="size-9" />
          <span className="text-[16px] font-bold uppercase tracking-[0.16em]">{site.name}</span>
        </div>
        <span className="hidden items-center gap-2 font-mono text-[12px] uppercase tracking-[0.14em] text-muted sm:inline-flex">
          <span className="size-2 rotate-45 bg-success" />
          Systems online
        </span>
      </header>

      <main className="relative z-10 flex flex-1 items-center px-4 py-12 sm:px-10">
        <div className="grid w-full max-w-6xl grid-cols-1 items-center gap-14 lg:grid-cols-[1fr_440px]">
          <div className="hidden animate-fade-up lg:block">
            <div className="eyebrow text-accent-ink">Alliance &amp; corporation services</div>
            <h1 className="hud-title mt-4 text-[64px] leading-[0.95] tracking-[0.03em]">{site.name}</h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted">{site.tagline || "Your alliance, in one place. Sign in once and everything else follows."}</p>
            <ul className="mt-12 grid max-w-lg gap-6">
              {FEATURES.map((f, i) => (
                <li key={f.title} className="flex gap-4 animate-fade-up" style={{ animationDelay: `${120 + i * 80}ms` }}>
                  <div className="grid size-11 shrink-0 place-items-center border border-border-strong text-accent-ink">
                    <f.icon className="size-5" />
                  </div>
                  <div>
                    <div className="hud-label text-text">{f.title}</div>
                    <div className="mt-1 text-sm leading-relaxed text-muted">{f.text}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="panel mx-auto w-full max-w-md border-border-strong bg-surface p-8 animate-fade-up [animation-delay:80ms] sm:p-10 lg:mx-0">
            <div className="eyebrow">Authentication</div>
            <h2 className="hud-title mt-3 text-[28px]">Welcome, capsuleer</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">Sign in with your EVE Online account to continue.</p>

            {signedOut && !error && (
              <Alert tone="accent" className="mt-6 py-3">
                You're signed out. Fly safe o7
              </Alert>
            )}
            {error && (
              <Alert tone="danger" className="mt-6 py-3">
                {SSO_ERRORS[error] ?? "Something went wrong signing in."}
              </Alert>
            )}

            {setup.sso_configured ? (
              <a
                href={`/sso/login?next=${encodeURIComponent(next)}`}
                className="group mt-8 flex h-13 items-center justify-center gap-3 border border-accent bg-accent px-5 text-[15px] font-bold uppercase tracking-[0.14em] text-accent-fg transition hover:brightness-110 focus-visible:outline-offset-4"
              >
                <SsoGlyph />
                Log in with EVE Online
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </a>
            ) : (
              <Alert tone="warning" className="mt-8" title="EVE login isn't configured yet">
                <a href="/setup" className="font-medium text-text underline underline-offset-4">
                  Open the setup guide
                </a>{" "}
                to connect your EVE application.
              </Alert>
            )}

            <div className="mt-8 flex items-start gap-2.5 border-t border-border pt-6 text-[13px] leading-relaxed text-muted">
              <Lock className="mt-0.5 size-3.5 shrink-0 text-subtle" />
              You'll be sent to login.eveonline.com. We never see your password; you approve exactly what's shared on EVE's own page.
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 border-t border-border px-6 py-4 text-center font-mono text-[11px] uppercase tracking-[0.12em] text-subtle sm:px-10">
        EVE Online and all related marks are property of CCP hf. · EvE Conduit v{site.version}
      </footer>
    </div>
  );
}

function SsoGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M7 12h10M12 7v10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity=".55" />
      <circle cx="12" cy="12" r="3" fill="currentColor" />
    </svg>
  );
}
