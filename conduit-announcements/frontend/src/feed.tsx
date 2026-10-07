// The announcements page: pinned news first, then the newest. Writers get the editor and see scheduled and ended ones.
import {
  api, Avatar, Badge, Button, Card, cn, ConfirmDialog, dateTime, DropdownContent, DropdownItem, DropdownMenu, DropdownSeparator,
  DropdownTrigger, EmptyState, PageHeader, Segmented, Skeleton, timeAgo, toast,
} from "@conduit/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { Editor } from "./editor";
import { Clock, Dots, Megaphone, Pencil, Pin, Plus, Trash } from "./icons";
import { Markdown } from "./markdown";
import { type Announcement, BASE, type Feed, type Tone } from "./types";

export const TONE: Record<Tone, { label: string; badge: "info" | "warning" | "danger"; stripe: string }> = {
  info: { label: "News", badge: "info", stripe: "bg-accent" },
  important: { label: "Important", badge: "warning", stripe: "bg-warning" },
  urgent: { label: "Urgent", badge: "danger", stripe: "bg-danger" },
};

export function useFeed(all = false) {
  return useQuery({ queryKey: ["announcements", "feed", all], queryFn: () => api.get<Feed>(`${BASE}${all ? "?all=true" : ""}`) });
}

export function FeedPage() {
  const qc = useQueryClient();
  const [view, setView] = useState<"live" | "all">("live");
  const { data, isLoading } = useFeed(view === "all");
  const [editing, setEditing] = useState<Announcement | "new" | null>(null);
  const [deleting, setDeleting] = useState<Announcement | null>(null);
  const refresh = () => qc.invalidateQueries({ queryKey: ["announcements"] });

  // Opening the page counts as reading what's on it; the "new" marks stay until the next visit.
  const unread = data?.unread ?? 0;
  useEffect(() => {
    if (!unread) return;
    const t = setTimeout(() => {
      api.post(`${BASE}/read`, {}).then(() => qc.invalidateQueries({ queryKey: ["announcements", "widget"] }), () => undefined);
    }, 1500);
    return () => clearTimeout(t);
  }, [unread, qc]);

  // Search results link to #a<id>: scroll there once the list is in.
  useEffect(() => {
    if (data && window.location.hash.startsWith("#a")) document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ block: "center" });
  }, [data]);

  const pin = useMutation({
    mutationFn: (a: Announcement) => api.post(`${BASE}/${a.id}/pin`, { pinned: !a.pinned }),
    onSuccess: refresh,
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: (id: number) => api.delete(`${BASE}/${id}`),
    onSuccess: () => { refresh(); toast.success("Announcement deleted"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const items = data?.announcements ?? [];
  const pinned = items.filter((a) => a.pinned && a.status === "live");
  const rest = items.filter((a) => !pinned.includes(a));

  return (
    <>
      <PageHeader
        eyebrow="Corporation"
        title="Announcements"
        icon={<Megaphone />}
        description="News and orders from leadership. Pinned announcements stay on top."
        actions={
          data?.can_post ? (
            <div className="flex flex-wrap items-center gap-2">
              <Segmented<"live" | "all">
                value={view}
                onChange={setView}
                size="sm"
                options={[{ value: "live", label: "What members see" }, { value: "all", label: "Everything" }]}
              />
              <Button variant="primary" onClick={() => setEditing("new")}><Plus /> New announcement</Button>
            </div>
          ) : undefined
        }
      />

      {isLoading || !data ? (
        <div className="space-y-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-40" />)}</div>
      ) : items.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Megaphone />}
            title="No announcements yet"
            description={data.can_post ? "Post the first one: fleet schedules, rules, moon tax changes, anything members should know." : "Leadership hasn't posted anything yet. Check back later."}
            action={data.can_post ? <Button variant="primary" onClick={() => setEditing("new")}><Plus /> New announcement</Button> : undefined}
          />
        </Card>
      ) : (
        <div className="mx-auto max-w-4xl space-y-4">
          {pinned.map((a) => (
            <Post key={a.id} a={a} canPost={data.can_post} onEdit={() => setEditing(a)} onPin={() => pin.mutate(a)} onDelete={() => setDeleting(a)} />
          ))}
          {pinned.length > 0 && rest.length > 0 && <div className="h-px bg-border" aria-hidden />}
          {rest.map((a) => (
            <Post key={a.id} a={a} canPost={data.can_post} onEdit={() => setEditing(a)} onPin={() => pin.mutate(a)} onDelete={() => setDeleting(a)} />
          ))}
        </div>
      )}

      {editing && <Editor announcement={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        danger
        title={`Delete "${deleting?.title}"?`}
        description="It disappears for everyone. Notifications already sent stay in people's lists."
        confirmLabel={<><Trash /> Delete</>}
        onConfirm={() => deleting && del.mutateAsync(deleting.id)}
      />
    </>
  );
}

function Post({ a, canPost, onEdit, onPin, onDelete }: { a: Announcement; canPost: boolean; onEdit: () => void; onPin: () => void; onDelete: () => void }) {
  const tone = TONE[a.tone];
  const audience = [...(a.states ?? []).map((s) => s.name), ...(a.groups ?? []).map((g) => g.name)];
  return (
    <Card id={`a${a.id}`} className={cn("relative overflow-hidden scroll-mt-24", a.status !== "live" && "opacity-70")}>
      <span className={cn("absolute inset-y-0 left-0 w-1", tone.stripe)} aria-hidden />
      <article className="p-card pl-6 sm:p-6 sm:pl-8">
        <header className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
              {a.pinned && <Badge tone="accent"><Pin className="size-3" /> Pinned</Badge>}
              {a.tone !== "info" && <Badge tone={tone.badge}>{tone.label}</Badge>}
              {a.unread && a.status === "live" && <Badge tone="success">New</Badge>}
              {a.status === "scheduled" && <Badge tone="info"><Clock className="size-3" /> Goes out {dateTime(a.publish_at)}</Badge>}
              {a.status === "expired" && <Badge>Ended {timeAgo(a.expires_at)}</Badge>}
            </div>
            <h2 className="text-lg font-semibold leading-snug text-text sm:text-xl">{a.title}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-subtle">
              {a.author && <Avatar src={a.author.portrait ?? undefined} name={a.author.name} size="xs" />}
              <span className="text-muted">{a.author?.name ?? "Leadership"}</span>
              <span>·</span>
              <time dateTime={a.publish_at} title={dateTime(a.publish_at)}>{timeAgo(a.publish_at)}</time>
              {a.edited && <span title={`Edited ${dateTime(a.updated_at)}`}>· edited</span>}
              {canPost && <span>· {audience.length ? `for ${audience.join(", ")}` : "for everyone"}</span>}
              {canPost && a.expires_at && a.status !== "expired" && <span>· until {dateTime(a.expires_at)}</span>}
            </div>
          </div>
          {canPost && (
            <DropdownMenu>
              <DropdownTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label={`Options for ${a.title}`}><Dots /></Button>
              </DropdownTrigger>
              <DropdownContent align="end">
                <DropdownItem onSelect={onEdit}><Pencil /> Edit</DropdownItem>
                <DropdownItem onSelect={onPin}><Pin /> {a.pinned ? "Unpin" : "Pin to the top"}</DropdownItem>
                <DropdownSeparator />
                <DropdownItem danger onSelect={onDelete}><Trash /> Delete</DropdownItem>
              </DropdownContent>
            </DropdownMenu>
          )}
        </header>
        {a.body && <Markdown text={a.body} className="mt-4" />}
      </article>
    </Card>
  );
}
