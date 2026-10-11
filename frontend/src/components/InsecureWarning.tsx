import { Alert } from "@/components/ui/feedback";
import { useBootstrap } from "@/lib/bootstrap";

/** Shown when the site is configured for https:// but was opened over plain http://: the Secure session cookie
 * would be dropped by the browser, so signing in would seem to do nothing. Usually the certificate failed. */
export function InsecureWarning({ className }: { className?: string }) {
  const { site } = useBootstrap();
  if (typeof window === "undefined" || window.location.protocol !== "http:" || !site.url.startsWith("https://")) return null;
  const secure = site.url + window.location.pathname + window.location.search;
  return (
    <Alert tone="danger" title="Open this site over HTTPS" className={className}>
      It is set up for <code className="font-mono text-xs">{site.url}</code> but you opened it over plain HTTP, so signing in can't be kept.{" "}
      <a href={secure} className="font-medium text-text underline underline-offset-4">
        Open the https:// address
      </a>
      . If the browser refuses it, the HTTPS certificate hasn't been issued yet; your install guide's troubleshooting section says how to retry it.
    </Alert>
  );
}
