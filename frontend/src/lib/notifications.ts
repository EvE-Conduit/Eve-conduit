import { isSitePath, openOutside } from "./externalLinks";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "./api";
import { BOOTSTRAP_KEY, useCurrentUser } from "./bootstrap";
import type { AppNotification, Bootstrap } from "./types";

export const NOTIFICATIONS_KEY = ["me", "notifications"] as const;

export interface NotificationPage {
  items: AppNotification[];
  count: number;
  unread: number;
}

function setUnread(qc: ReturnType<typeof useQueryClient>, unread: number) {
  const boot = qc.getQueryData<Bootstrap>(BOOTSTRAP_KEY);
  if (boot?.user && boot.user.unread_notifications !== unread) {
    qc.setQueryData<Bootstrap>(BOOTSTRAP_KEY, { ...boot, user: { ...boot.user, unread_notifications: unread } });
  }
}

/** Unread count, polled every minute and on window focus; mirrored into bootstrap. */
export function useUnreadCount() {
  const user = useCurrentUser();
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: [...NOTIFICATIONS_KEY, "unread"],
    queryFn: async () => {
      const res = await api.get<{ unread: number }>("/api/me/notifications/unread");
      setUnread(qc, res.unread);
      return res.unread;
    },
    enabled: !!user,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    staleTime: 15_000,
    initialData: user?.unread_notifications ?? 0,
    initialDataUpdatedAt: 0,
  });
  return data ?? 0;
}

export function useNotifications(params: { unread?: boolean; category?: string; limit?: number; offset?: number; enabled?: boolean } = {}) {
  const { unread = false, category = "", limit = 30, offset = 0, enabled = true } = params;
  const qc = useQueryClient();
  return useQuery({
    queryKey: [...NOTIFICATIONS_KEY, "list", { unread, category, limit, offset }],
    queryFn: async () => {
      const q = new URLSearchParams({ limit: String(limit), offset: String(offset) });
      if (unread) q.set("unread", "true");
      if (category) q.set("category", category);
      const res = await api.get<NotificationPage>(`/api/me/notifications?${q}`);
      setUnread(qc, res.unread);
      qc.setQueryData([...NOTIFICATIONS_KEY, "unread"], res.unread);
      return res;
    },
    enabled,
  });
}

/** Mark read/unread, delete, mark all read, clear read. Every call refreshes lists and the count. */
export function useNotificationActions() {
  const qc = useQueryClient();
  const done = (res: { unread: number }) => {
    setUnread(qc, res.unread);
    qc.setQueryData([...NOTIFICATIONS_KEY, "unread"], res.unread);
    qc.invalidateQueries({ queryKey: [...NOTIFICATIONS_KEY, "list"] });
  };
  const opts = { onSuccess: done };
  return {
    read: useMutation({ mutationFn: (id: number) => api.post<{ unread: number }>(`/api/me/notifications/${id}/read`), ...opts }),
    unread: useMutation({ mutationFn: (id: number) => api.post<{ unread: number }>(`/api/me/notifications/${id}/unread`), ...opts }),
    remove: useMutation({ mutationFn: (id: number) => api.delete<{ unread: number }>(`/api/me/notifications/${id}`), ...opts }),
    readAll: useMutation({ mutationFn: () => api.post<{ unread: number }>("/api/me/notifications/read-all"), ...opts }),
    clearRead: useMutation({ mutationFn: () => api.delete<{ unread: number }>("/api/me/notifications"), ...opts }),
  };
}

/** Navigate to a notification's link: in-app paths via the router, anything else in a new tab. */
export function openLink(link: string, navigate: (to: string) => void) {
  if (!link) return;
  if (!isSitePath(link)) openOutside(link); // asks before leaving the site; ignores anything but https://
  else if (link.startsWith("/sso/")) window.location.href = link;
  else navigate(link);
}
