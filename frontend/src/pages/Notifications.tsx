import { useQuery } from "@tanstack/react-query";
import { Bell, CheckCheck, Eye, EyeOff, Settings2, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/input";
import { EmptyState, PageHeader } from "@/components/ui/page";
import { SkeletonRows } from "@/components/ui/skeleton";
import { Segmented } from "@/components/ui/tabs";
import { Tooltip } from "@/components/ui/tooltip";
import { NotificationItem } from "@/features/notifications/NotificationItem";
import { api } from "@/lib/api";
import { num } from "@/lib/format";
import { openLink, useNotificationActions, useNotifications, useUnreadCount } from "@/lib/notifications";

const PAGE = 30;

export function Notifications() {
  const [filter, setFilter] = useState<"all" | "unread">(() => (new URLSearchParams(window.location.search).get("unread") ? "unread" : "all"));
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(0);
  const [confirmClear, setConfirmClear] = useState(false);
  const unread = useUnreadCount();
  const navigate = useNavigate();
  const { data, isLoading } = useNotifications({ unread: filter === "unread", category, limit: PAGE, offset: page * PAGE });
  const { data: categories = [] } = useQuery({
    queryKey: ["me", "preferences", "categories"],
    queryFn: () => api.get<{ key: string; label: string }[]>("/api/me/preferences/categories"),
    staleTime: 5 * 60_000,
  });
  const actions = useNotificationActions();
  const count = data?.count ?? 0;
  const pages = Math.max(1, Math.ceil(count / PAGE));

  return (
    <>
      <PageHeader
        eyebrow="Account"
        title="Notifications"
        icon={<Bell />}
        description="Messages from the site and its modules: group decisions, characters that need a new login, alerts and more."
        actions={
          <>
            <Link to="/settings#notifications">
              <Button variant="ghost">
                <Settings2 /> Settings
              </Button>
            </Link>
            <Button variant="ghost" onClick={() => setConfirmClear(true)}>
              <Trash2 /> Delete read
            </Button>
            <Button variant="primary" disabled={!unread} loading={actions.readAll.isPending} onClick={() => actions.readAll.mutate()}>
              <CheckCheck /> Mark all read
            </Button>
          </>
        }
      />

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-border px-card py-3">
          <Segmented
            aria-label="Show"
            value={filter}
            onChange={(v) => {
              setFilter(v);
              setPage(0);
            }}
            options={[
              { value: "all", label: "All" },
              { value: "unread", label: unread ? `Unread (${unread})` : "Unread" },
            ]}
          />
          <Select
            aria-label="Category"
            className="w-56"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(0);
            }}
            options={[{ value: "", label: "All categories" }, ...categories.map((c) => ({ value: c.key, label: c.label }))]}
          />
          <span className="ml-auto text-xs tabular-nums text-muted">{num(count)} total</span>
        </div>

        {isLoading ? (
          <SkeletonRows rows={6} />
        ) : !data?.items.length ? (
          <EmptyState
            icon={<Bell />}
            title={filter === "unread" ? "No unread notifications" : "No notifications"}
            description={filter === "unread" ? "You're all caught up." : "When something needs your attention, it shows up here."}
          />
        ) : (
          <div className="divide-y divide-border p-1.5">
            {data.items.map((n) => (
              <NotificationItem
                key={n.id}
                n={n}
                onOpen={() => {
                  if (!n.read) actions.read.mutate(n.id);
                  if (n.link) openLink(n.link, navigate);
                }}
                actions={
                  <>
                    <Tooltip content={n.read ? "Mark unread" : "Mark read"}>
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        aria-label={n.read ? "Mark unread" : "Mark read"}
                        onClick={() => (n.read ? actions.unread.mutate(n.id) : actions.read.mutate(n.id))}
                      >
                        {n.read ? <EyeOff /> : <Eye />}
                      </Button>
                    </Tooltip>
                    <Tooltip content="Delete">
                      <Button size="icon-xs" variant="ghost" aria-label="Delete" onClick={() => actions.remove.mutate(n.id)}>
                        <Trash2 />
                      </Button>
                    </Tooltip>
                  </>
                }
              />
            ))}
          </div>
        )}

        {count > PAGE && (
          <div className="flex items-center justify-between border-t border-border px-card py-2.5 text-xs text-muted">
            <span className="tabular-nums">
              Page {page + 1} of {pages}
            </span>
            <div className="flex gap-2">
              <Button size="xs" variant="ghost" disabled={page === 0} onClick={() => setPage(page - 1)}>
                Newer
              </Button>
              <Button size="xs" variant="ghost" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}>
                Older
              </Button>
            </div>
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={confirmClear}
        onOpenChange={setConfirmClear}
        danger
        title="Delete read notifications?"
        description="Every notification you've already read is removed. Unread ones stay."
        confirmLabel="Delete read"
        onConfirm={() => actions.clearRead.mutateAsync()}
      />
    </>
  );
}
