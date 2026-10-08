// The Bulletin on the landing page (/home): the latest announcements posted there, laid out like a newsletter.
import { api, Avatar, Badge, cn, dateTime, Skeleton, timeAgo } from "@conduit/sdk";
import { useQuery } from "@tanstack/react-query";
import type { CSSProperties, ReactNode } from "react";
import { Link } from "react-router";

import { TONE } from "./feed";
import { Megaphone, Pin } from "./icons";
import { Markdown } from "./markdown";
import { type Announcement, BASE, type Bulletin } from "./types";

const FEED = "/p/announcements";

/** The message as one line of plain text, for the smaller stories. */
function excerpt(body: string, length = 180) {
  const text = body
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^\s*(#{1,3}|[-*]|\d+\.|>)\s+/gm, "")
    .replace(/[*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > length ? `${text.slice(0, length).trimEnd()}…` : text;
}

function Byline({ a }: { a: Announcement }) {
  return (
    <div className="flex items-center gap-2 text-xs text-subtle">
      {a.author && <Avatar src={a.author.portrait ?? undefined} name={a.author.name} size="xs" />}
      <span>{a.author?.name ?? "Leadership"}</span>
      <span aria-hidden>·</span>
      <time dateTime={a.publish_at} title={dateTime(a.publish_at)}>{timeAgo(a.publish_at)}</time>
    </div>
  );
}

function Labels({ a }: { a: Announcement }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Badge tone={TONE[a.tone].badge}>{TONE[a.tone].label}</Badge>
      {a.pinned && (
        <Badge>
          <Pin className="size-3" /> Pinned
        </Badge>
      )}
      {a.unread && <Badge tone="success">New</Badge>}
    </div>
  );
}

/** The lead story: the whole message, faded out if it's long. */
function Lead({ a, preview }: { a: Announcement; preview: boolean }) {
  // Long messages are cut off with a fade; the full text is a click away.
  const long = a.body.length > 700 || a.body.split("\n").length > 12;
  return (
    <article className="panel relative flex flex-col overflow-hidden p-6 animate-fade-up sm:p-8">
      <span className={cn("absolute inset-y-0 left-0 w-1", TONE[a.tone].stripe)} aria-hidden />
      <Labels a={a} />
      <h3 className="mt-4 text-2xl font-semibold leading-tight text-text sm:text-[1.7rem]">{a.title}</h3>
      <div className="mt-3">
        <Byline a={a} />
      </div>
      {a.body && (
        <div className={cn("relative mt-5", long && "max-h-64 overflow-hidden")}>
          <Markdown text={a.body} className="text-[15px]" />
          {long && <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-surface to-transparent" aria-hidden />}
        </div>
      )}
      <StoryLink id={a.id} preview={preview} className="mt-5 self-start text-sm font-medium text-accent-ink hover:underline">
        Read the full announcement →
      </StoryLink>
    </article>
  );
}

/** One of the smaller stories beside the lead. */
function Story({ a, preview, index }: { a: Announcement; preview: boolean; index: number }) {
  return (
    <StoryLink
      id={a.id}
      preview={preview}
      className="group panel panel-quiet relative block overflow-hidden p-4 pl-5 transition-colors animate-fade-up hover:border-accent"
      style={{ animationDelay: `${80 + index * 60}ms` }}
    >
      <span className={cn("absolute inset-y-0 left-0 w-0.5", TONE[a.tone].stripe)} aria-hidden />
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-subtle">
        <span>{TONE[a.tone].label}</span>
        <span aria-hidden>·</span>
        <time dateTime={a.publish_at}>{timeAgo(a.publish_at)}</time>
        {a.unread && <span className="ml-auto size-1.5 rotate-45 bg-success" aria-label="New" />}
      </div>
      <div className="mt-1.5 font-medium text-text group-hover:text-accent-ink">{a.title}</div>
      {a.body && <p className="mt-1 line-clamp-2 text-sm text-muted">{excerpt(a.body)}</p>}
    </StoryLink>
  );
}

/** Links go to the announcement on its page; in the landing page editor's preview they don't navigate. */
function StoryLink({ id, preview, className, style, children }: { id: number; preview: boolean; className?: string; style?: CSSProperties; children: ReactNode }) {
  if (preview) return <div className={className} style={style}>{children}</div>;
  return (
    <Link to={`${FEED}#a${id}`} className={className} style={style}>
      {children}
    </Link>
  );
}

export function BulletinSection({ preview }: { preview: boolean }) {
  const { data, isLoading } = useQuery({
    queryKey: ["announcements", "bulletin"],
    queryFn: () => api.get<Bulletin>(`${BASE}/bulletin?limit=4`),
    refetchInterval: 300_000,
  });
  const stories = data?.announcements ?? [];
  if (isLoading) return <Skeleton className="h-64" />;
  if (!data || (stories.length === 0 && !preview)) return null;
  const [lead, ...rest] = stories;

  return (
    <section>
      <div className="mb-4 flex items-center gap-4">
        <span className="size-2 rotate-45 bg-accent" aria-hidden />
        <h2 className="hud-label text-text">Bulletin</h2>
        <span className="h-px flex-1 bg-border" aria-hidden />
        {preview ? (
          <span className="text-xs text-subtle">All announcements →</span>
        ) : (
          <Link to={FEED} className="text-xs text-subtle hover:text-accent-ink">
            {data.more > 0 ? `${data.more} more announcement${data.more === 1 ? "" : "s"} →` : "All announcements →"}
          </Link>
        )}
      </div>
      {!lead ? (
        <div className="flex items-center gap-3 border border-dashed border-border-strong p-6 text-sm text-muted">
          <Megaphone className="size-5 shrink-0 text-subtle" />
          Announcements posted to the landing page show here, the newest (or pinned) one as the lead story.
        </div>
      ) : (
        <div className={cn("grid grid-cols-1 gap-4", rest.length > 0 && "lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]")}>
          <Lead a={lead} preview={preview} />
          {rest.length > 0 && (
            <div className="flex flex-col gap-3">
              {rest.map((a, i) => (
                <Story key={a.id} a={a} preview={preview} index={i} />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
