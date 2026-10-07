// Pieces used by both the members' and the reviewers' pages.
import { api, Badge, Button, Dialog, Field, Input, isk, Textarea, toast } from "@conduit/sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router";

import { BASE, type Loss, type RequestDetail, type Ship, STATUS, type Status, type SystemInfo } from "./types";

export function StatusBadge({ status }: { status: Status }) {
  return <Badge tone={STATUS[status].tone}>{STATUS[status].label}</Badge>;
}

export function ShipCell({ ship, sub }: { ship: Ship; sub?: React.ReactNode }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <img src={ship.icon} alt="" className="size-9 shrink-0 border border-border bg-bg" loading="lazy" />
      <div className="min-w-0">
        <div className="truncate font-medium">{ship.name}</div>
        <div className="truncate text-xs text-subtle">{sub ?? ship.group}</div>
      </div>
    </div>
  );
}

export function SystemText({ system }: { system: SystemInfo | null }) {
  if (!system) return <span className="text-subtle">Unknown system</span>;
  const tone = system.security >= 0.5 ? "text-success-fg" : system.security > 0 ? "text-warning-fg" : "text-danger-fg";
  return (
    <span>
      {system.name} <span className={`font-mono text-xs ${tone}`}>{system.security.toFixed(1)}</span>
      <span className="text-subtle"> · {system.region}</span>
    </span>
  );
}

/** Claim a loss: either one picked from the list (``loss``) or one pasted as an ESI kill link. */
export function ClaimDialog({ loss, requireFleet, onClose }: { loss: Loss | null; requireFleet: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [link, setLink] = useState("");
  const [fleet, setFleet] = useState("");
  const [fc, setFc] = useState("");
  const [notes, setNotes] = useState("");
  const submit = useMutation({
    mutationFn: () => api.post<RequestDetail>(`${BASE}/requests`, { killmail_id: loss?.killmail_id ?? null, link: loss ? "" : link, fleet, fc, notes }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["srp"] });
      toast.success("Request sent; you'll be told when it's decided");
      onClose();
      navigate(`/p/srp/requests/${r.id}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const ready = (loss || link.trim()) && (!requireFleet || fleet.trim());
  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={loss ? `Claim ${loss.character.name}'s ${loss.ship.name}` : "Claim a loss from a link"}
      description={loss ? `Rules suggest ${isk(loss.suggested, { full: true })} for this loss.` : "For losses that haven't shown up on their own."}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!ready} loading={submit.isPending} onClick={() => submit.mutate()}>Send request</Button>
        </>
      }
    >
      <div className="space-y-4">
        {loss ? (
          <div className="border border-border bg-bg/40 p-3">
            <ShipCell ship={loss.ship} sub={<SystemText system={loss.system} />} />
          </div>
        ) : (
          <Field label="Kill link" hint={'A zKillboard link, or in game: open the killmail, right-click → "Copy external kill link".'} required>
            <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://zkillboard.com/kill/123456789/" className="font-mono text-xs" autoFocus />
          </Field>
        )}
        <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
          <Field label="Fleet" required={requireFleet} hint="Op name or the fleet ping.">
            <Input value={fleet} onChange={(e) => setFleet(e.target.value)} placeholder="Sunday CTA, Stratop…" autoFocus={!!loss} />
          </Field>
          <Field label="FC">
            <Input value={fc} onChange={(e) => setFc(e.target.value)} />
          </Field>
        </div>
        <Field label="Anything the reviewers should know">
          <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ordered to hold the gate, logi went down first…" />
        </Field>
      </div>
    </Dialog>
  );
}
