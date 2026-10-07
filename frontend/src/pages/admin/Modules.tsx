import { Puzzle, Terminal } from "lucide-react";

import { ModuleList } from "@/components/ModuleList";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page";

export function AdminModules() {
  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Modules"
        icon={<Puzzle />}
        description="Switch installed modules on and off. Disabled modules disappear from the menu and their API stops responding."
      />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_340px]">
        <ModuleList />
        <Card className="h-fit">
          <CardHeader title="Installing a module" icon={<Terminal />} />
          <CardBody className="space-y-3 text-sm text-muted">
            <p>Modules are Python packages. Add them to your server image, then restart:</p>
            <pre className="overflow-x-auto rounded-lg border border-border bg-bg/70 p-3 font-mono text-xs text-text">
              {"# requirements-modules.txt\nevecsm-skills==1.2.0\n\ndocker compose up -d --build"}
            </pre>
            <p>After restarting, the module appears in this list, switched off. Modules that need new ESI scopes ask members to re-authorise their characters.</p>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
