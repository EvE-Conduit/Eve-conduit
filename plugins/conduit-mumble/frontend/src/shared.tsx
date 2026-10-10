// Bits shared by the member, temporary-access, public and admin pages.
import { Badge, Button, cn, Input, toast } from "@conduit/sdk";
import type { ReactNode } from "react";

import { Copy, ExternalLink } from "./icons";
import type { LinkStatus, Server } from "./types";

export function copy(value: string, what = "Copied") {
  navigator.clipboard.writeText(value).then(() => toast.success(what), () => toast.error("Couldn't copy; select the text instead"));
}

export function CopyField({ value, label, mono = true }: { value: string; label?: string; mono?: boolean }) {
  return (
    <div className="flex items-stretch">
      <Input readOnly value={value} aria-label={label} className={cn("text-xs", mono && "font-mono")} onFocus={(e) => e.target.select()} />
      <Button variant="secondary" size="icon" aria-label={`Copy ${label ?? ""}`.trim()} onClick={() => copy(value)}>
        <Copy />
      </Button>
    </div>
  );
}

export function GroupList({ groups, empty }: { groups: string[]; empty: string }) {
  if (groups.length === 0) return <p className="text-sm text-subtle">{empty}</p>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {groups.map((g) => (
        <Badge key={g} tone="accent">{g}</Badge>
      ))}
    </div>
  );
}

/** The things to type into the Mumble client, plus a mumble:// link that fills them in. */
export function ConnectDetails({ server, username, password, url, children }: { server: Server; username: string; password?: string; url?: string | null; children?: ReactNode }) {
  return (
    <div className="space-y-3">
      <dl className="grid gap-3 sm:grid-cols-[auto_1fr] sm:items-center">
        <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Server</dt>
        <dd><CopyField value={server.host} label="server address" /></dd>
        <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Port</dt>
        <dd><CopyField value={String(server.port)} label="port" /></dd>
        <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Username</dt>
        <dd><CopyField value={username} label="username" /></dd>
        {password !== undefined && (
          <>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Password</dt>
            <dd><CopyField value={password} label="password" /></dd>
          </>
        )}
      </dl>
      <div className="flex flex-wrap items-center gap-2">
        {url && (
          <a href={url}>
            <Button variant="primary"><ExternalLink /> Open in Mumble</Button>
          </a>
        )}
        {children}
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: LinkStatus }) {
  const map: Record<LinkStatus, { tone: "success" | "neutral" | "warning" | "danger"; label: string }> = {
    active: { tone: "success", label: "Active" },
    expired: { tone: "neutral", label: "Expired" },
    used_up: { tone: "warning", label: "Used up" },
    revoked: { tone: "danger", label: "Withdrawn" },
  };
  const { tone, label } = map[status];
  return <Badge tone={tone}>{label}</Badge>;
}

/** "in 3 h 20 min" / "ended". */
export function untilText(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "ended";
  const min = Math.round(ms / 60_000);
  if (min < 60) return `${min} min left`;
  const h = Math.floor(min / 60);
  if (h < 48) return `${h} h ${min % 60 ? `${min % 60} min ` : ""}left`;
  return `${Math.round(h / 24)} days left`;
}
