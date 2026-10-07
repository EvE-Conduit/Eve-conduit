import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ExternalLink, KeyRound, Link2, Puzzle } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/page";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tooltip } from "@/components/ui/tooltip";
import { api } from "@/lib/api";
import { BOOTSTRAP_KEY } from "@/lib/bootstrap";
import { iconFor } from "@/lib/icons";
import { cn } from "@/lib/utils";

export interface AdminModule {
  id: string;
  source: string;
  enabled: boolean;
  problems: string[];
  manifest: {
    name: string;
    version: string;
    description: string;
    author: string;
    url: string;
    requires: string[];
    esi_scopes: string[];
    nav: { icon: string }[];
  } | null;
}

export function PluginList({ compact = false }: { compact?: boolean }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin", "plugins"], queryFn: () => api.get<AdminModule[]>("/api/admin/plugins") });
  const toggle = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => api.post(`/api/admin/plugins/${id}`, { enabled }),
    onSuccess: (_, { id, enabled }) => {
      toast.success(`${data?.find((m) => m.id === id)?.manifest?.name ?? id} ${enabled ? "enabled" : "disabled"}`);
      qc.invalidateQueries({ queryKey: ["admin", "plugins"] });
      qc.invalidateQueries({ queryKey: BOOTSTRAP_KEY });
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[0, 1].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }
  if (!data?.length) {
    return (
      <EmptyState
        icon={<Puzzle />}
        title="No plugins installed yet"
        description="Plugins are Python packages. Install one into the server image (pip install conduit-…), restart, and it shows up here."
        className={compact ? "py-8" : undefined}
      />
    );
  }

  return (
    <ul className="space-y-3">
      {data.map((m) => {
        const Icon = iconFor(m.manifest?.nav[0]?.icon);
        const broken = m.problems.length > 0;
        return (
          <li key={m.id} className={cn("flex gap-4 rounded-xl border border-border bg-surface-2/60 p-4 transition-colors", m.enabled && "border-accent/25 bg-accent-soft/40")}>
            <div className={cn("grid size-10 shrink-0 place-items-center rounded-xl ring-1", m.enabled ? "bg-accent-soft text-accent-ink ring-accent/25" : "bg-surface-3 text-subtle ring-border-strong")}>
              {broken ? <AlertTriangle className="size-4.5 text-warning" /> : <Icon className="size-4.5" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{m.manifest?.name ?? m.source}</span>
                {m.manifest && <span className="font-mono text-[11px] text-subtle">v{m.manifest.version}</span>}
                {m.manifest?.url && (
                  <a href={m.manifest.url} target="_blank" rel="noreferrer" className="text-subtle hover:text-text" aria-label="Plugin homepage">
                    <ExternalLink className="size-3.5" />
                  </a>
                )}
              </div>
              {m.manifest?.description && <p className="mt-0.5 text-sm text-muted">{m.manifest.description}</p>}
              {broken && <p className="mt-1 text-sm text-warning-fg">{m.problems.join("; ")}</p>}
              {!compact && m.manifest && (m.manifest.requires.length > 0 || m.manifest.esi_scopes.length > 0) && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {m.manifest.requires.map((r) => (
                    <Badge key={r}>
                      <Link2 className="size-3" /> needs {r}
                    </Badge>
                  ))}
                  {m.manifest.esi_scopes.length > 0 && (
                    <Tooltip content={<div className="max-w-xs space-y-0.5 font-mono text-[11px]">{m.manifest.esi_scopes.map((s) => <div key={s}>{s}</div>)}</div>}>
                      <span>
                        <Badge>
                          <KeyRound className="size-3" /> {m.manifest.esi_scopes.length} ESI scope{m.manifest.esi_scopes.length === 1 ? "" : "s"}
                        </Badge>
                      </span>
                    </Tooltip>
                  )}
                </div>
              )}
            </div>
            <Switch
              checked={m.enabled}
              disabled={broken || toggle.isPending}
              onCheckedChange={(enabled) => toggle.mutate({ id: m.id, enabled })}
              aria-label={`Enable ${m.manifest?.name ?? m.id}`}
              className="mt-1"
            />
          </li>
        );
      })}
    </ul>
  );
}
