// Recruitment-wide options (recruit.manage_forms).
import { Alert, api, Card, CardBody, PageHeader, Skeleton, Switch, toast } from "@conduit/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router";

import { Back, Settings } from "./icons";
import { BASE, type RecruitSettings } from "./types";

const KEY = ["recruit", "settings"];

export function SettingsPage() {
  const { data, isLoading } = useQuery({ queryKey: KEY, queryFn: () => api.get<RecruitSettings>(`${BASE}/settings`) });
  return (
    <>
      <Link to="/p/recruit" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-text"><Back /> Applications</Link>
      <PageHeader eyebrow="Recruitment" title="Settings" icon={<Settings />} description="Rules for everyone who applies, whichever form they use." />
      <div className="max-w-3xl">{isLoading || !data ? <Skeleton className="h-32" /> : <RequireDiscord settings={data} />}</div>
    </>
  );
}

function RequireDiscord({ settings }: { settings: RecruitSettings }) {
  const qc = useQueryClient();
  const save = useMutation({
    mutationFn: (require_discord: boolean) => api.put<RecruitSettings>(`${BASE}/settings`, { require_discord }),
    onSuccess: (s) => {
      qc.setQueryData(KEY, s);
      toast.success(s.require_discord ? "Applicants now need Discord" : "Discord is no longer needed to apply");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const { installed, enabled, configured } = settings.discord_plugin;
  const problem = !installed
    ? "The Discord plugin isn't installed. Install it under Administration → Plugins to use this."
    : !enabled
      ? "The Discord plugin is installed but switched off, so this isn't checked. Switch it on under Administration → Plugins."
      : !configured
        ? "The Discord plugin isn't set up yet, so this isn't checked. Finish its setup on the Discord page."
        : "";
  return (
    <Card>
      <CardBody className="space-y-3">
        <label className="flex items-start gap-3 text-sm">
          <Switch
            checked={settings.require_discord}
            disabled={save.isPending || (!installed && !settings.require_discord)}
            onCheckedChange={(on) => save.mutate(on)}
            aria-label="Require Discord"
          />
          <span>
            <span className="font-medium">Require Discord</span>
            <span className="block text-muted">
              Applicants must link their Discord account and be on your Discord server before they can send an application.
            </span>
            <span className="mt-1 block text-xs text-subtle">
              Needs the Discord plugin installed, switched on and set up. Applicants also need the "Can link a Discord
              account" permission, which every state has unless you took it away.
            </span>
          </span>
        </label>
        {problem && (
          <Alert tone="warning" title={settings.require_discord ? "Not being checked" : "Discord plugin needed"}>{problem}</Alert>
        )}
      </CardBody>
    </Card>
  );
}
