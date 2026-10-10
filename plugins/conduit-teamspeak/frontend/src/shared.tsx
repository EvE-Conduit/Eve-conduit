// Bits shared by the member and admin pages.
import { Badge, Button, cn, Input, toast } from "@conduit/sdk";

import { Copy, ExternalLink } from "./icons";
import type { Server } from "./types";

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

/** The things to type into the TeamSpeak client, plus a ts3server:// link that fills them in. */
export function ConnectDetails({ server, nickname, url, label = "Open in TeamSpeak" }: { server: Server; nickname?: string | null; url?: string | null; label?: string }) {
  return (
    <div className="space-y-3">
      <dl className="grid gap-3 sm:grid-cols-[auto_1fr] sm:items-center">
        <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Server</dt>
        <dd><CopyField value={server.port === 9987 ? server.host : `${server.host}:${server.port}`} label="server address" /></dd>
        {nickname && (
          <>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Nickname</dt>
            <dd><CopyField value={nickname} label="nickname" mono={false} /></dd>
          </>
        )}
      </dl>
      {url && (
        <a href={url}>
          <Button variant="primary"><ExternalLink /> {label}</Button>
        </a>
      )}
    </div>
  );
}
