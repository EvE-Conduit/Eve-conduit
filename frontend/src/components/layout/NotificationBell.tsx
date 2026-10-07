import { Bell, CheckCheck, Settings2 } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router";

import { Button } from "@/components/ui/button";
import { Popover } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip } from "@/components/ui/tooltip";
import { NotificationItem } from "@/features/notifications/NotificationItem";
import { openLink, useNotificationActions, useNotifications, useUnreadCount } from "@/lib/notifications";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const unread = useUnreadCount();
  const navigate = useNavigate();
  const { data, isLoading } = useNotifications({ limit: 10, enabled: open });
  const actions = useNotificationActions();

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      align="end"
      className="w-[min(400px,calc(100vw-16px))] p-0"
      trigger={
        <button
          className="relative grid size-9 place-items-center rounded-lg text-muted transition-colors hover:bg-hover-strong hover:text-text"
          aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        >
          <Bell className="size-[18px]" />
          {unread > 0 && (
            <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-none bg-accent px-1 text-[10px] font-bold leading-none text-accent-fg ring-2 ring-bg tabular-nums">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      }
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <div className="text-sm font-semibold">Notifications</div>
          <div className="text-xs text-muted">{unread ? `${unread} unread` : "You're all caught up"}</div>
        </div>
        <div className="flex items-center gap-1">
          <Tooltip content="Mark all as read">
            <Button size="icon-sm" variant="ghost" disabled={!unread} loading={actions.readAll.isPending} onClick={() => actions.readAll.mutate()} aria-label="Mark all as read">
              {!actions.readAll.isPending && <CheckCheck />}
            </Button>
          </Tooltip>
          <Tooltip content="Notification settings">
            <Link to="/settings#notifications" onClick={() => setOpen(false)} className="grid size-8 place-items-center rounded-md text-muted hover:bg-hover-strong hover:text-text" aria-label="Notification settings">
              <Settings2 className="size-4" />
            </Link>
          </Tooltip>
        </div>
      </div>
      <div className="max-h-[60vh] overflow-y-auto p-1.5">
        {isLoading ? (
          <div className="space-y-2 p-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-14" />
            ))}
          </div>
        ) : !data?.items.length ? (
          <div className="px-6 py-10 text-center">
            <div className="mx-auto mb-3 grid size-10 place-items-center rounded-xl bg-hover-strong text-muted">
              <Bell className="size-4" />
            </div>
            <div className="text-sm font-medium">Nothing here yet</div>
            <div className="mt-1 text-xs text-muted">Group decisions, expired logins and plugin alerts show up here.</div>
          </div>
        ) : (
          data.items.map((n) => (
            <NotificationItem
              key={n.id}
              n={n}
              compact
              onOpen={() => {
                if (!n.read) actions.read.mutate(n.id);
                if (n.link) {
                  setOpen(false);
                  openLink(n.link, navigate);
                }
              }}
            />
          ))
        )}
      </div>
      <Link to="/notifications" onClick={() => setOpen(false)} className="block border-t border-border px-4 py-2.5 text-center text-sm font-medium text-accent-ink hover:bg-hover">
        View all notifications
      </Link>
    </Popover>
  );
}
