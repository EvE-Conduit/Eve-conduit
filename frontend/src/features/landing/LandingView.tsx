import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ArrowUpRight, Bell, Clock, Users, UsersRound } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router";

import { tokenProblem } from "@/components/CharacterCard";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/page";
import { api } from "@/lib/api";
import { useBootstrap } from "@/lib/bootstrap";
import { isSitePath, openOutside } from "@/lib/externalLinks";
import { clock } from "@/lib/format";
import { iconFor } from "@/lib/icons";
import { fill, type LandingContent } from "@/lib/landing";
import { Markdown } from "@/lib/markdown";
import { useUnreadCount } from "@/lib/notifications";
import type { MyGroup } from "@/lib/types";
import { cn } from "@/lib/utils";
import { myCharactersQuery } from "@/pages/Characters";

/** The landing page. Also used, with `preview`, by the editor (links don't navigate there). */
export function LandingView({ content, preview = false }: { content: LandingContent; preview?: boolean }) {
  const { user, site } = useBootstrap();
  const t = (s: string) => fill(s, user, site.name);
  const { hero } = content;

  return (
    <div className="space-y-10">
      <section className="panel relative isolate overflow-hidden border-border-strong animate-fade-up">
        {/* Accent glow and a faint grid, under a ship render fading in from the right. */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse 70% 90% at 0% 0%, color-mix(in oklab, var(--site-accent) 16%, transparent), transparent 70%)," +
              "radial-gradient(ellipse 60% 70% at 100% 100%, color-mix(in oklab, var(--site-accent) 10%, transparent), transparent 70%)",
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-[0.35] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]"
          style={{
            backgroundImage: "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        {hero.image_url && (
          <img
            src={hero.image_url}
            alt=""
            aria-hidden
            className="pointer-events-none absolute right-[-6%] top-1/2 -z-10 hidden w-[58%] max-w-[760px] -translate-y-1/2 opacity-60 [mask-image:linear-gradient(to_left,black_40%,transparent)] md:block"
          />
        )}

        <div className="relative px-6 py-10 sm:px-10 sm:py-14 lg:py-20">
          {hero.eyebrow && <div className="eyebrow text-accent-ink">{t(hero.eyebrow)}</div>}
          {hero.title && <h1 className="hud-title mt-4 max-w-3xl text-4xl leading-[1.02] tracking-[0.03em] sm:text-5xl lg:text-[64px]">{t(hero.title)}</h1>}
          {hero.subtitle && <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-muted">{t(hero.subtitle)}</p>}

          {content.buttons.length > 0 && (
            <div className="mt-9 flex flex-wrap gap-3">
              {content.buttons.map((b, i) => (
                <LandingLink
                  key={i}
                  link={b.link}
                  preview={preview}
                  className={cn(
                    "group inline-flex h-12 items-center gap-3 px-6 text-[14px] font-bold uppercase tracking-[0.14em] transition",
                    b.style === "primary"
                      ? "border border-accent bg-accent text-accent-fg hover:brightness-110"
                      : "border border-border-strong bg-surface/60 text-text backdrop-blur hover:border-accent hover:bg-hover",
                  )}
                >
                  {b.label}
                  {isSitePath(b.link) ? (
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  ) : (
                    <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  )}
                </LandingLink>
              ))}
            </div>
          )}

          {hero.show_profile && user && (
            <div className="mt-12 inline-flex max-w-full items-center gap-4 border border-border bg-surface/70 py-3 pl-3 pr-5 backdrop-blur">
              <Avatar src={user.main?.portrait} name={user.name} size="lg" />
              <div className="min-w-0">
                <div className="truncate text-[15px] font-semibold">{user.main?.name ?? user.name}</div>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  {user.state && (
                    <Badge color={user.state.color} variant="dot">
                      {user.state.name}
                    </Badge>
                  )}
                  {user.main?.corporation && (
                    <Badge>
                      <img src={user.main.corporation.logo} alt="" className="size-3.5" />
                      {user.main.corporation.ticker ? `[${user.main.corporation.ticker}]` : user.main.corporation.name}
                    </Badge>
                  )}
                  {user.main?.alliance && (
                    <Badge>
                      <img src={user.main.alliance.logo} alt="" className="size-3.5" />
                      {user.main.alliance.name}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {content.show_status && <StatusStrip preview={preview} />}

      {content.cards.length > 0 && (
        <section>
          {content.cards_title && <SectionHeading>{t(content.cards_title)}</SectionHeading>}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {content.cards.map((c, i) => {
              const Icon = iconFor(c.icon);
              return (
                <LandingLink
                  key={i}
                  link={c.link}
                  preview={preview}
                  className="group panel panel-quiet flex flex-col p-5 transition-colors animate-fade-up hover:border-accent"
                  style={{ animationDelay: `${80 + i * 60}ms` }}
                >
                  <div className="flex items-start justify-between">
                    <div className="grid size-11 place-items-center border border-border-strong text-accent-ink transition-colors group-hover:border-accent group-hover:bg-accent-soft">
                      <Icon className="size-5" />
                    </div>
                    {c.link && <ArrowUpRight className="size-4 text-subtle transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent-ink" />}
                  </div>
                  <div className="hud-label mt-5 text-text">{t(c.title)}</div>
                  {c.text && <p className="mt-2 text-sm leading-relaxed text-muted">{t(c.text)}</p>}
                </LandingLink>
              );
            })}
          </div>
        </section>
      )}

      {content.sections.length > 0 && (
        <div className={cn("grid grid-cols-1 gap-6", content.sections.length > 1 && "lg:grid-cols-2")}>
          {content.sections.map((s, i) => (
            <section key={i} className="panel p-6 animate-fade-up sm:p-8" style={{ animationDelay: `${160 + i * 60}ms` }}>
              {s.title && (
                <div className="mb-5 flex items-center gap-3">
                  <span className="size-2 rotate-45 bg-accent" />
                  <h2 className="hud-label text-text">{t(s.title)}</h2>
                </div>
              )}
              <Markdown source={t(s.body)} className="space-y-3 text-[15px] leading-relaxed text-muted [&_li]:mt-1.5" />
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-4">
      <h2 className="hud-label shrink-0 text-subtle">{children}</h2>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

/** Characters, groups, notifications and EVE time for the person looking. */
function StatusStrip({ preview }: { preview: boolean }) {
  const unread = useUnreadCount();
  const { data: characters = [] } = useQuery(myCharactersQuery);
  const { data: groups = [] } = useQuery({ queryKey: ["me", "groups"], queryFn: () => api.get<MyGroup[]>("/api/me/groups") });
  const attention = characters.filter(tokenProblem).length;
  const memberOf = groups.filter((g) => g.member).length;
  const open = groups.filter((g) => g.joinable && !g.member).length;
  const now = useNow();

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <LandingLink link="/characters" preview={preview} className="block hover:[&>div]:border-border-strong">
        <StatCard
          label="Characters"
          value={characters.length}
          icon={<UsersRound />}
          tone={attention ? "warning" : "accent"}
          hint={attention ? `${attention} need${attention === 1 ? "s" : ""} a new login` : "linked and syncing"}
        />
      </LandingLink>
      <LandingLink link="/groups" preview={preview} className="block hover:[&>div]:border-border-strong">
        <StatCard label="Groups" value={memberOf} icon={<Users />} tone="info" hint={open ? `${open} open to join` : "member of"} />
      </LandingLink>
      <LandingLink link="/notifications" preview={preview} className="block hover:[&>div]:border-border-strong">
        <StatCard label="Notifications" value={unread} icon={<Bell />} tone={unread ? "warning" : "success"} hint={unread ? "unread" : "all caught up"} />
      </LandingLink>
      <StatCard label="EVE time" value={clock(now, { timeZone: "UTC" })} mono icon={<Clock />} hint="UTC, Tranquility time" />
    </div>
  );
}

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

/** A page on this site, an https:// address (asked about before leaving), or nothing. */
function LandingLink({
  link,
  preview,
  className,
  style,
  children,
}: {
  link: string;
  preview: boolean;
  className?: string;
  style?: React.CSSProperties;
  children: ReactNode;
}) {
  if (!link || preview) return <div className={cn(className, link && "cursor-pointer")} style={style}>{children}</div>;
  if (isSitePath(link))
    return (
      <Link to={link} className={className} style={style}>
        {children}
      </Link>
    );
  return (
    <a
      href={link}
      className={className}
      style={style}
      onClick={(e) => {
        e.preventDefault();
        openOutside(link);
      }}
    >
      {children}
    </a>
  );
}
