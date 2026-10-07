import { X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

import { useNotifications, useUnreadCount } from "@/lib/notifications";

const DISMISS_KEY = "conduit:threats-dismissed";

function readDismissed(): number[] {
  try {
    return JSON.parse(sessionStorage.getItem(DISMISS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

/**
 * The bar across the top when something urgent is waiting: unread warning and danger notifications
 * (low fuel, reinforcement timers, lost logins). Hidden when there's nothing; dismissable for the session.
 */
export function ThreatStrip() {
  const unread = useUnreadCount();
  const { data } = useNotifications({ unread: true, limit: 20, enabled: unread > 0 });
  const [dismissed, setDismissed] = useState<number[]>(readDismissed);
  const urgent = (data?.items ?? []).filter((n) => (n.level === "danger" || n.level === "warning") && !dismissed.includes(n.id));
  if (!unread || !urgent.length) return null;
  const danger = urgent.some((n) => n.level === "danger");
  const dismiss = () => {
    const ids = [...dismissed, ...urgent.map((n) => n.id)];
    setDismissed(ids);
    try {
      sessionStorage.setItem(DISMISS_KEY, JSON.stringify(ids));
    } catch {
      // storage unavailable; hidden until reload
    }
  };
  return (
    <div
      role="status"
      className={`flex flex-wrap items-center gap-x-5 gap-y-1 px-4 py-2 text-[13px] font-semibold uppercase tracking-[0.1em] sm:px-6 ${danger ? "bg-danger text-white" : "bg-warning text-[#05080c]"}`}
    >
      <span className="font-mono">▲ {urgent.length} {urgent.length === 1 ? "alert" : "alerts"}</span>
      {urgent.slice(0, 3).map((n) => (
        <span key={n.id} className="hidden truncate font-medium md:inline">
          {n.title}
        </span>
      ))}
      <span className="ml-auto flex items-center gap-2">
        <Link to="/notifications?unread=1" className="border border-current px-2.5 py-0.5 hover:bg-black/10">
          Respond
        </Link>
        <button onClick={dismiss} aria-label="Hide alerts for now" className="grid size-7 place-items-center hover:bg-black/10">
          <X className="size-4" />
        </button>
      </span>
    </div>
  );
}
