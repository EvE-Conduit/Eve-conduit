// One event: signing up, who you give to, your own gift, and for organisers the draw and progress.
import {
  api, Avatar, Badge, Button, Callout, Card, CardBody, CardHeader, ConfirmDialog, dateTime, DescriptionList, Field, Input, isk,
  PageHeader, Select, Skeleton, SwitchRow, Table, Td, Textarea, Th, THead, toast, Tr,
} from "@conduit/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

import { Editor } from "./editor";
import { Back, Check, Eye, Gift, Pencil, Send, Shuffle, Trash } from "./icons";
import { BASE, type EventDetail, type Organiser, type Pair, PHASE } from "./types";

type Call = { method: "post" | "put" | "delete"; path: string; body?: unknown; done?: string };

function useAct(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ method, path, body }: Call) => {
      const url = `${BASE}/events/${id}${path}`;
      return method === "delete" ? api.delete<EventDetail>(url) : api[method]<EventDetail>(url, body ?? {});
    },
    onSuccess: (d, { done }) => {
      qc.setQueryData(["secretsanta", "event", id], d);
      qc.invalidateQueries({ queryKey: ["secretsanta", "events"] });
      qc.invalidateQueries({ queryKey: ["secretsanta", "widget"] });
      if (done) toast.success(done);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function EventPage() {
  const id = Number(useParams().id);
  const [editing, setEditing] = useState(false);
  const { data: e, isLoading, error } = useQuery({
    queryKey: ["secretsanta", "event", id],
    queryFn: () => api.get<EventDetail>(`${BASE}/events/${id}`),
  });
  if (isLoading) return <Skeleton className="h-64" />;
  if (error || !e) return <Callout tone="warning">This event doesn't exist, or isn't open to you.</Callout>;
  const p = PHASE[e.phase];
  return (
    <>
      <Link to="/p/secretsanta" className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-text"><Back /> Secret Santa</Link>
      <PageHeader
        eyebrow={<Badge tone={p.tone}>{p.label}</Badge>}
        title={e.name}
        icon={<Gift />}
        description={e.description || undefined}
        actions={e.organiser && e.phase !== "ended" && <Button onClick={() => setEditing(true)}><Pencil /> Edit</Button>}
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-6">
          {e.me?.giving_to && <GivingCard e={e} />}
          {e.me && e.phase !== "signup" && e.phase !== "closed" && e.phase !== "drawn" && <MyGiftCard e={e} />}
          {(e.may_join || e.me) && <SignUpCard e={e} />}
          {!e.me && !e.may_join && !e.organiser && (
            <Callout tone="info">{e.phase === "signup" ? "This event isn't open to you." : "Sign-up has closed."}</Callout>
          )}
          {e.pairs && <PairsCard pairs={e.pairs} />}
          {e.organiser && <OrganiserPanel e={e} o={e.organiser} />}
        </div>
        <Card className="h-fit">
          <CardBody>
            <DescriptionList
              items={[
                { label: "Sign-up closes", value: dateTime(e.signup_closes_at) },
                { label: "Gift deadline", value: dateTime(e.gift_deadline) },
                { label: "Budget", value: e.budget_isk != null ? `About ${isk(e.budget_isk)}` : "Up to you" },
                { label: "Signed up", value: e.participants },
              ]}
            />
          </CardBody>
        </Card>
      </div>
      {editing && <Editor event={e} onClose={() => setEditing(false)} />}
    </>
  );
}

function SignUpCard({ e }: { e: EventDetail }) {
  const act = useAct(e.id);
  const me = e.me;
  const [character, setCharacter] = useState(String(me?.character?.id ?? e.characters[0]?.id ?? ""));
  const [wishlist, setWishlist] = useState(me?.wishlist ?? "");
  const [withdrawing, setWithdrawing] = useState(false);
  const locked = e.phase === "ended";
  return (
    <Card>
      <CardHeader
        title={me ? "Your sign-up" : "Sign up"}
        description={me ? "Your Secret Santa sees this character and wish list." : "One sign-up per person, whichever character you use. Pick the one that should get the gift."}
      />
      <CardBody className="space-y-4">
        <Field label="Send my gift to">
          <Select
            value={character}
            disabled={locked}
            onChange={(ev) => setCharacter(ev.target.value)}
            options={e.characters.map((c) => ({ value: String(c.id), label: c.name }))}
          />
        </Field>
        <Field label="Wish list or a hint" hint="Optional. Ships, skins, PLEX, or what you fly.">
          <Textarea rows={3} maxLength={2000} disabled={locked} value={wishlist} onChange={(ev) => setWishlist(ev.target.value)} />
        </Field>
        {!locked && (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="primary"
              loading={act.isPending}
              onClick={() => act.mutate({ method: "put", path: "/me", body: { character_id: Number(character) || null, wishlist }, done: me ? "Saved" : "You're in" })}
            >
              {me ? "Save" : "Join"}
            </Button>
            {me?.can_withdraw && <Button variant="ghost" onClick={() => setWithdrawing(true)}>Withdraw</Button>}
            {me && !me.can_withdraw && <span className="text-xs text-muted">The draw has been done. To leave now, ask an organiser.</span>}
          </div>
        )}
      </CardBody>
      <ConfirmDialog
        open={withdrawing}
        onOpenChange={setWithdrawing}
        title="Withdraw from this Secret Santa?"
        description="You can sign up again while sign-up is open."
        confirmLabel="Withdraw"
        onConfirm={() => act.mutateAsync({ method: "delete", path: "/me", done: "You've withdrawn" }).then(() => setWithdrawing(false))}
      />
    </Card>
  );
}

function GivingCard({ e }: { e: EventDetail }) {
  const act = useAct(e.id);
  const g = e.me!.giving_to!;
  const [note, setNote] = useState(g.sent_note);
  return (
    <Card>
      <CardHeader title="You're giving to" description={`Send it by ${dateTime(e.gift_deadline)}.`} />
      <CardBody className="space-y-4">
        <div className="flex items-center gap-3">
          <Avatar src={g.character?.portrait ?? null} name={g.character?.name ?? g.name} size="lg" />
          <div>
            <div className="text-lg font-semibold">{g.character?.name ?? g.name}</div>
            {g.character && g.character.name !== g.name && <div className="text-xs text-muted">Main: {g.name}</div>}
          </div>
        </div>
        <div>
          <div className="mb-1 text-[13px] font-medium">Their wish list</div>
          {g.wishlist ? <p className="whitespace-pre-wrap text-sm">{g.wishlist}</p> : <p className="text-sm text-subtle">Nothing written. Surprise them.</p>}
        </div>
        {g.sent_at ? (
          <div className="space-y-2">
            <Callout tone="success" title={`Sent ${dateTime(g.sent_at)}`}>{g.sent_note || "No note."}</Callout>
            {g.received_at && <Callout tone="success" title="They got it">{g.thanks ? `"${g.thanks}"` : "No thank-you note yet."}</Callout>}
            {!g.received_at && (
              <Button size="sm" variant="ghost" loading={act.isPending} onClick={() => act.mutate({ method: "delete", path: "/sent", done: "Marked not sent" })}>
                Not sent after all
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <Field label="Note for them" hint="Optional: what to look for, a contract or ISK. They don't see who you are, but a contract shows its issuer.">
              <Input maxLength={500} value={note} onChange={(ev) => setNote(ev.target.value)} placeholder="Item exchange contract in Jita" />
            </Field>
            <Button variant="primary" loading={act.isPending} onClick={() => act.mutate({ method: "post", path: "/sent", body: { note }, done: "Marked sent" })}>
              <Send /> I've sent it
            </Button>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function MyGiftCard({ e }: { e: EventDetail }) {
  const act = useAct(e.id);
  const gift = e.me!.my_gift;
  const [thanks, setThanks] = useState(gift?.thanks ?? "");
  return (
    <Card>
      <CardHeader title="Your gift" description="Your Secret Santa stays secret. A thank-you reaches them without saying who they are." />
      <CardBody className="space-y-3">
        {!gift || !gift.sent_at ? (
          <p className="text-sm text-muted">Not sent yet. You get a notification when it is.</p>
        ) : (
          <Callout tone="success" title={`On its way since ${dateTime(gift.sent_at)}`}>{gift.sent_note || "No note."}</Callout>
        )}
        {gift && (
          <>
            <Field label="Thank-you note" hint="Optional. Sent to your Secret Santa.">
              <Textarea rows={2} maxLength={1000} value={thanks} onChange={(ev) => setThanks(ev.target.value)} />
            </Field>
            <Button
              variant={gift.received_at ? "secondary" : "primary"}
              loading={act.isPending}
              disabled={!!gift.received_at && thanks.trim() === gift.thanks}
              onClick={() => act.mutate({ method: "post", path: "/received", body: { thanks }, done: gift.received_at ? "Thank-you sent" : "Marked received" })}
            >
              <Check /> {gift.received_at ? "Send thank-you" : "I got it"}
            </Button>
            {gift.received_at && <p className="text-xs text-muted">Received {dateTime(gift.received_at)}.</p>}
          </>
        )}
      </CardBody>
    </Card>
  );
}

function PairsCard({ pairs }: { pairs: Pair[] }) {
  return (
    <Card>
      <CardHeader title="Who gave to whom" />
      <PairsTable pairs={pairs} />
    </Card>
  );
}

function PairsTable({ pairs }: { pairs: Pair[] }) {
  return (
    <Table>
      <THead>
        <tr>
          <Th>From</Th>
          <Th>To</Th>
          <Th>Gift</Th>
        </tr>
      </THead>
      <tbody>
        {pairs.map((p) => (
          <Tr key={p.giver.id}>
            <Td>{p.giver.name}</Td>
            <Td>{p.giftee.character?.name ?? p.giftee.name}</Td>
            <Td>{p.received_at ? <Badge tone="success">Received</Badge> : p.sent_at ? <Badge tone="info">Sent</Badge> : <Badge tone="neutral">Not sent</Badge>}</Td>
          </Tr>
        ))}
      </tbody>
    </Table>
  );
}

type Confirm = "publish" | "end" | "delete" | { remove: number };

function OrganiserPanel({ e, o }: { e: EventDetail; o: Organiser }) {
  const act = useAct(e.id);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [pairs, setPairs] = useState<Pair[] | null>(null);
  const [revealing, setRevealing] = useState(false);
  const [first, setFirst] = useState("");
  const [second, setSecond] = useState("");
  const names = new Map(o.participants.map((p) => [p.id, p.name]));
  const reveal = useMutation({
    mutationFn: () => api.post<{ pairs: Pair[] }>(`${BASE}/events/${e.id}/reveal`, {}),
    onSuccess: (d) => { setPairs(d.pairs); setRevealing(false); },
    onError: (err: Error) => toast.error(err.message),
  });
  const del = useMutation({
    mutationFn: () => api.delete(`${BASE}/events/${e.id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["secretsanta"] }); toast.success("Event deleted"); navigate("/p/secretsanta"); },
    onError: (err: Error) => toast.error(err.message),
  });
  const removing = typeof confirm === "object" && confirm ? o.participants.find((p) => p.id === confirm.remove) : undefined;
  const canExclude = !o.published_at && !o.ended_at;
  return (
    <Card>
      <CardHeader
        title="Organising"
        description="You see who's in and how the gifts are going, not who gives to whom."
      />
      <CardBody className="space-y-5">
        {o.notes && <Callout tone="info" title="Notes">{o.notes}</Callout>}
        <div className="flex flex-wrap gap-2">
          {(e.phase === "closed" || e.phase === "drawn") && (
            <Button variant={e.phase === "closed" ? "primary" : "secondary"} loading={act.isPending}
              onClick={() => act.mutate({ method: "post", path: "/draw", done: e.phase === "drawn" ? "Drawn again" : "Drawn" })}>
              <Shuffle /> {e.phase === "drawn" ? "Draw again" : "Draw"}
            </Button>
          )}
          {e.phase === "drawn" && <Button variant="primary" onClick={() => setConfirm("publish")}><Send /> Send the results</Button>}
          {e.phase === "running" && <Button onClick={() => setConfirm("end")}>End the event</Button>}
          {o.drawn_at && !pairs && <Button variant="ghost" onClick={() => setRevealing(true)}><Eye /> Show who gives to whom</Button>}
          <Button variant="ghost" onClick={() => setConfirm("delete")}><Trash /> Delete</Button>
        </div>
        {e.phase === "signup" && <p className="text-sm text-muted">The draw can be done once sign-up closes. To close it early, edit the event and move the closing time.</p>}
        {e.phase === "drawn" && <p className="text-sm text-muted">Nobody knows the draw yet. You can draw again until you send the results.</p>}
        {o.ended_at && (
          <div className="border border-border px-3">
            <SwitchRow
              label="Show every pair to the participants"
              description="Who gave to whom, on this page, for everyone who took part."
              checked={e.reveal_all}
              onCheckedChange={(on) => act.mutate({ method: "put", path: "/reveal-all", body: { on }, done: on ? "Pairs shown" : "Pairs hidden" })}
            />
          </div>
        )}
        {pairs && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[13px] font-medium">Who gives to whom</span>
              <Button size="sm" variant="ghost" onClick={() => setPairs(null)}>Hide</Button>
            </div>
            <PairsTable pairs={pairs} />
          </div>
        )}

        <div>
          <div className="mb-2 text-[13px] font-medium">
            {o.participants.length} signed up{o.published_at ? ` · ${o.sent} sent · ${o.received} received` : ""}
          </div>
          {o.participants.length === 0 ? (
            <p className="text-sm text-subtle">Nobody yet.</p>
          ) : (
            <Table>
              <THead>
                <tr>
                  <Th>Person</Th>
                  <Th>Gets it on</Th>
                  <Th>Sent theirs</Th>
                  <Th>Got one</Th>
                  <Th />
                </tr>
              </THead>
              <tbody>
                {o.participants.map((p) => (
                  <Tr key={p.id}>
                    <Td>
                      <span className="flex items-center gap-2">
                        <Avatar src={p.portrait} name={p.name} size="sm" />
                        <span>
                          <span className="block font-medium">{p.name}</span>
                          <span className="block text-xs text-muted">{p.has_wishlist ? "Wrote a wish list" : "No wish list"}</span>
                        </span>
                      </span>
                    </Td>
                    <Td className="text-muted">{p.character?.name ?? "—"}</Td>
                    <Td>{p.sent_at ? <Badge tone="success">{dateTime(p.sent_at)}</Badge> : <span className="text-subtle">—</span>}</Td>
                    <Td>{p.received_at ? <Badge tone="success">{dateTime(p.received_at)}</Badge> : <span className="text-subtle">—</span>}</Td>
                    <Td className="text-right">
                      {!o.ended_at && <Button size="sm" variant="ghost" onClick={() => setConfirm({ remove: p.id })}>Take out</Button>}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </div>

        <div>
          <div className="mb-1 text-[13px] font-medium">Kept apart</div>
          <p className="mb-2 text-xs text-muted">Two people who must not draw each other, such as a couple. Adding one throws away a draw that hasn't been sent.</p>
          {o.exclusions.length > 0 && (
            <ul className="mb-3 divide-y divide-border border border-border">
              {o.exclusions.map((x) => (
                <li key={x.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                  <span>{names.get(x.first)} and {names.get(x.second)}</span>
                  <Button size="xs" variant="ghost" onClick={() => act.mutate({ method: "delete", path: `/exclusions/${x.id}`, done: "Exclusion removed" })}>Remove</Button>
                </li>
              ))}
            </ul>
          )}
          {canExclude && o.participants.length >= 2 && (
            <div className="flex flex-wrap items-end gap-2">
              <Select className="min-w-40" value={first} onChange={(ev) => setFirst(ev.target.value)} aria-label="First person"
                options={[{ value: "", label: "Pick someone" }, ...o.participants.map((p) => ({ value: String(p.id), label: p.name }))]} />
              <Select className="min-w-40" value={second} onChange={(ev) => setSecond(ev.target.value)} aria-label="Second person"
                options={[{ value: "", label: "and someone else" }, ...o.participants.filter((p) => String(p.id) !== first).map((p) => ({ value: String(p.id), label: p.name }))]} />
              <Button
                disabled={!first || !second || first === second}
                loading={act.isPending}
                onClick={() => act.mutate({ method: "post", path: "/exclusions", body: { first: Number(first), second: Number(second) }, done: "Kept apart" }, { onSuccess: () => { setFirst(""); setSecond(""); } })}
              >
                Keep apart
              </Button>
            </div>
          )}
        </div>
      </CardBody>

      <ConfirmDialog
        open={revealing}
        onOpenChange={setRevealing}
        title="Show who gives to whom?"
        description={`This is recorded in the audit log.${e.me ? " You'll also see who your own Secret Santa is." : ""}`}
        confirmLabel="Show"
        onConfirm={() => reveal.mutateAsync()}
      />
      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(open) => !open && setConfirm(null)}
        danger={confirm === "delete" || typeof confirm === "object"}
        title={confirm === "publish" ? "Send the results?" : confirm === "end" ? "End this event?" : confirm === "delete" ? "Delete this event?" : `Take ${removing?.name ?? "them"} out?`}
        description={
          confirm === "publish" ? "Everyone gets a notification saying who they give to. The draw can't be done again after this."
            : confirm === "end" ? "Gifts can still be marked, but no more reminders go out. You can then show every pair to the participants."
              : confirm === "delete" ? "The event, its draw and every sign-up are deleted for good."
                : o.drawn_at ? "Whoever was giving to them gets their giftee instead, and is told if the results are out." : "They're told they were taken out."
        }
        confirmLabel={confirm === "publish" ? "Send" : confirm === "end" ? "End" : confirm === "delete" ? "Delete" : "Take out"}
        onConfirm={() => {
          if (confirm === "delete") return del.mutateAsync();
          const call: Call = confirm === "publish" ? { method: "post", path: "/publish", done: "Results sent" }
            : confirm === "end" ? { method: "post", path: "/end", done: "Event ended" }
              : { method: "delete", path: `/participants/${(confirm as { remove: number }).remove}`, done: "Taken out" };
          return act.mutateAsync(call).then(() => setConfirm(null));
        }}
      />
    </Card>
  );
}
