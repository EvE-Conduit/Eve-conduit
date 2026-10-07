import { ExternalLink } from "lucide-react";
import { useSyncExternalStore } from "react";

import { ConfirmDialog } from "@/components/ui/dialog";

/** A path on this site ("/groups"), not "//host" or "/\host", which browsers treat as another site. */
export function isSitePath(link: string) {
  return link.startsWith("/") && !link.startsWith("//") && !link.includes("\\");
}

let pending: URL | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/**
 * Open a link that came from someone else (a notification, possibly sent by a bot) and may lead off
 * the site. Only https:// links are followed, and only after the person confirms where it goes.
 */
export function openOutside(link: string) {
  let url: URL;
  try {
    url = new URL(link, window.location.origin);
  } catch {
    return;
  }
  if (url.protocol !== "https:") return;
  if (url.origin === window.location.origin) {
    window.location.assign(url.href);
    return;
  }
  pending = url;
  emit();
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Mounted once in the app shell: asks before leaving the site. */
export function ExternalLinkGuard() {
  const url = useSyncExternalStore(subscribe, () => pending);
  const close = () => {
    pending = null;
    emit();
  };
  return (
    <ConfirmDialog
      open={!!url}
      onOpenChange={(o) => !o && close()}
      title="Leave this site?"
      description="This link goes to another website. Only continue if you trust it, and never enter your EVE password there."
      confirmLabel={
        <>
          <ExternalLink /> Open {url?.hostname}
        </>
      }
      onConfirm={() => {
        if (url) window.open(url.href, "_blank", "noopener,noreferrer");
        close();
      }}
    >
      {url && <div className="break-all rounded-lg border border-border bg-surface-2 px-3 py-2 font-mono text-xs text-muted">{url.href}</div>}
    </ConfirmDialog>
  );
}
