// Settings: where ticket channels go, which Discord roles are ticked by default, and anything stopping the bot.
import { api, Button, Callout, Card, CardBody, Field, Input, PageHeader, RoleChips, Skeleton, toast } from "@conduit/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { TicketIcon } from "./icons";
import { BASE, type Settings } from "./types";

export function SettingsPage() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["tickets", "settings"], queryFn: () => api.get<Settings>(`${BASE}/settings`) });
  const [category, setCategory] = useState("");
  const [roles, setRoles] = useState<string[]>([]);
  useEffect(() => {
    if (data) {
      setCategory(data.category_id);
      setRoles(data.default_role_ids);
    }
  }, [data]);
  const save = useMutation({
    mutationFn: () => api.put<Settings>(`${BASE}/settings`, { category_id: category, default_role_ids: roles }),
    onSuccess: (s) => {
      qc.setQueryData(["tickets", "settings"], s);
      toast.success("Saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <>
      <PageHeader eyebrow="Discord" title="Ticket settings" icon={<TicketIcon />} description="Tickets use the bot and server set up on the Discord plugin." />
      {!data ? (
        <Skeleton className="h-48" />
      ) : (
        <div className="space-y-4">
          {data.problems.length > 0 && (
            <Callout tone="warning">
              <ul className="list-disc space-y-1 pl-4">{data.problems.map((p) => <li key={p}>{p}</li>)}</ul>
            </Callout>
          )}
          <Card>
            <CardBody className="space-y-4">
              <Field label="Category id" hint="Optional. With Developer Mode on, right-click a Discord category and Copy Channel ID. Empty puts channels at the top of the server.">
                <Input value={category} onChange={(e) => setCategory(e.target.value)} />
              </Field>
              <Field label="Default Discord roles" hint="Optional. Ticked when someone opens a ticket; they can change it for that ticket.">
                <RoleChips roles={data.roles} value={roles} onChange={setRoles} />
              </Field>
              <Button variant="primary" loading={save.isPending} onClick={() => save.mutate()}>Save</Button>
            </CardBody>
          </Card>
          {data.invite_url && (
            <Card>
              <CardBody className="space-y-2">
                <p className="text-sm text-muted">The bot needs more permissions for tickets than for syncing roles. Invite it again to add them; nothing else about it changes.</p>
                <a href={data.invite_url} target="_blank" rel="noreferrer" className="text-sm font-medium text-accent-ink hover:underline">Invite the bot with ticket permissions</a>
              </CardBody>
            </Card>
          )}
        </div>
      )}
    </>
  );
}
