import { Puzzle, Terminal } from "lucide-react";

import { PluginList } from "@/components/PluginList";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page";

export function AdminPlugins() {
  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Plugins"
        icon={<Puzzle />}
        description="Switch installed plugins on and off. Disabled plugins disappear from the menu and their API stops responding."
      />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_340px]">
        <PluginList />
        <Card className="h-fit">
          <CardHeader title="Installing a plugin" icon={<Terminal />} />
          <CardBody className="space-y-3 text-sm text-muted">
            <p>Plugins are Python packages. Add them to your server image, then restart:</p>
            <pre className="overflow-x-auto rounded-lg border border-border bg-bg/70 p-3 font-mono text-xs text-text">
              {"# requirements-plugins.txt\nconduit-skills==1.2.0\n\ndocker compose up -d --build"}
            </pre>
            <p>After restarting, the plugin appears in this list, switched off. Plugins that need new ESI scopes ask members to re-authorise their characters.</p>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
