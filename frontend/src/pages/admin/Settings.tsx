import { useMutation } from "@tanstack/react-query";
import { Construction, Palette, Settings2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { BrandingForm, type BrandingValues } from "@/components/BrandingForm";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Alert } from "@/components/ui/feedback";
import { Field, Textarea } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/api";
import { applyBranding, useBootstrap, useRefreshBootstrap } from "@/lib/bootstrap";
import type { Bootstrap } from "@/lib/types";

interface Values extends BrandingValues {
  maintenance_mode: boolean;
  maintenance_message: string;
}

export function AdminSettings() {
  const { site } = useBootstrap();
  const refresh = useRefreshBootstrap();
  const initial: Values = {
    name: site.name,
    tagline: site.tagline,
    accent: site.accent,
    logo_url: site.logo_url,
    maintenance_mode: site.maintenance.enabled,
    maintenance_message: site.maintenance.message,
  };
  const [values, setValues] = useState<Values>(initial);
  const [confirmMaintenance, setConfirmMaintenance] = useState(false);
  const dirty = JSON.stringify(values) !== JSON.stringify(initial);

  const save = useMutation({
    mutationFn: (v: Values) => api.put<Bootstrap["site"]>("/api/admin/site", v),
    onSuccess: (saved) => {
      applyBranding(saved);
      refresh();
      toast.success("Settings saved");
    },
    onError: (e) => toast.error(e.message),
  });

  const discard = () => {
    setValues(initial);
    applyBranding(site);
  };

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Settings"
        icon={<Settings2 />}
        description="How your site looks to members, and maintenance mode."
        actions={
          <>
            <Button variant="ghost" disabled={!dirty} onClick={discard}>
              Discard
            </Button>
            <Button
              variant="primary"
              disabled={!dirty}
              loading={save.isPending}
              onClick={() => (values.maintenance_mode && !initial.maintenance_mode ? setConfirmMaintenance(true) : save.mutate(values))}
            >
              Save changes
            </Button>
          </>
        }
      />
      <div className="space-y-6">
        <Card>
          <CardHeader icon={<Palette />} title="Branding" description="Name, tagline, logo and accent colour. The accent previews live across the site." />
          <CardBody className="p-6 sm:p-8">
            <BrandingForm value={values} onChange={(b) => setValues({ ...values, ...b })} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            icon={<Construction />}
            title="Maintenance mode"
            description="While it's on, only people who can manage the site get in. Everyone else sees your message."
            actions={
              <Switch
                aria-label="Maintenance mode"
                checked={values.maintenance_mode}
                onCheckedChange={(maintenance_mode) => setValues({ ...values, maintenance_mode })}
              />
            }
          />
          <CardBody className="space-y-4">
            {initial.maintenance_mode && (
              <Alert tone="warning" title="Maintenance mode is on">
                Members can't use the site until you switch it off.
              </Alert>
            )}
            <Field label="Message" hint={`Shown on the maintenance screen. ${300 - values.maintenance_message.length} characters left.`}>
              <Textarea
                value={values.maintenance_message}
                maxLength={300}
                onChange={(e) => setValues({ ...values, maintenance_message: e.target.value })}
                placeholder="We're upgrading the server. Back within the hour, o7"
              />
            </Field>
          </CardBody>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmMaintenance}
        onOpenChange={setConfirmMaintenance}
        danger
        title="Turn on maintenance mode?"
        description="Everyone without site-management permission is locked out until you switch it off again."
        confirmLabel="Turn on and save"
        onConfirm={() => save.mutateAsync(values)}
      />
    </>
  );
}
