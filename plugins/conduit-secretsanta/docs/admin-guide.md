# Secret Santa — Admin guide

Secret Santa runs gift exchanges. Organisers create an event, members sign up, the organiser draws once sign-up
closes and sends the results, and everyone sends a gift to the person they drew. The draw is stored; each member only
sees who they give to, and organisers see progress without the pairs. This guide covers installing, permissions and
running an event.

## Requirements

| Item | Requirement |
|---|---|
| EvE Conduit | 0.5.55 or newer |
| Other plugins | None |
| ESI scopes | None |
| In-game corp roles | None |

## Installing and switching it on

1. Go to **Administration → Plugins → Browse**.
2. Select **Secret Santa** and install it. Leave **Switch on after installing** on, or switch it on later.
3. On the **Installed** tab, make sure the switch for Secret Santa is on.

It is off by default on a fresh install. It is a members-only plugin: guests (the public state) don't get the page,
the widget or the API.

## Permissions

Taking part needs no permission; every member sees the events open to them.

| Permission codename | What it allows | Suggested group |
|---|---|---|
| `secretsanta.organise_events` | Create, edit and delete events; see every event, its notes and progress; keep people apart; draw and send the results; look at the pairs (audited); take people out; end an event and show every pair | Directors, or whoever runs community events |

The permission is listed under the director tier in the permission picker. Give it to a group under
**Administration → Groups**, in the group's **Permissions**.

Organisers can take part in their own events. They then see their own giftee like everyone else, and only see the
other pairs (including who their own Secret Santa is) if they click **Show who gives to whom**.

## Creating an event

1. Open **Secret Santa** and click **New event**.
2. Fill in:

| Field | Notes |
|---|---|
| **Name** | Required, up to 100 characters. |
| **Description** | Shown to everyone who can see the event. |
| **Sign-up closes** | Required. Members can join until then; the draw can be done after it. |
| **Gift deadline** | Required, after sign-up closes. A reminder goes out two days before. |
| **Suggested budget (million ISK)** | Optional. Shown as a hint, never enforced. |
| **Who may join** | Any mix of states and groups. Nothing picked means every member. A member may join if they are in any one of them. |
| **Notes for organisers** | Optional. Only people with the permission see them. |
| **Tell people** | On a new event only. Sends a notification to everyone who may join. |

3. Click **Create**.

Times are entered in your browser's time zone and shown in EVE time (ET).

## Running an event

### Sign-up

Members join with the character that should get the gift and an optional wish list. One sign-up per account, so alts
of one person are one participant. They can withdraw until the draw.

To close sign-up early, edit the event and set **Sign-up closes** to now.

### Keeping people apart

Under **Kept apart**, pick two participants and click **Keep apart**. They won't draw each other, either way round.
Use it for couples, or alts on different accounts of the same person.

- Adding one throws away a draw that hasn't been sent; draw again afterwards.
- Exclusions can't be added once the results are sent. They can still be removed.

### The draw

Once sign-up has closed, click **Draw**. The draw is one random chain through everyone: A gives to B, B to C, and so
on back to A. Nobody gets themselves, and taking one person out later never leaves anyone giving to themselves.

A draw needs at least 3 people. If the exclusions make it impossible, nothing is stored and the message says why:

- "… can only be paired with …" or "… is kept apart from everyone": in a chain everyone needs two people they may be
  paired with (one to give to, one to get from). Remove some of that person's exclusions.
- "There's no way to draw with these exclusions": no single chain through everyone fits, even though nobody is
  stuck on their own. Remove some exclusions.

The draw is stored. Nobody is told yet: you can click **Draw again** as often as you like. Each draw is in the audit
log, without the pairs.

### Sending the results

Click **Send the results**. Everyone gets a notification saying who they give to, and the event page shows it. From
now on the draw is fixed: it can't be done again and exclusions can't be added.

### Progress

The participant table shows, for each person, the character their gift goes to, whether they wrote a wish list,
when they marked their own gift sent (**Sent theirs**), and when the gift meant for them arrived (**Got one**). It
doesn't show who gives to whom, and gift notes are left out because they could name the recipient.

### Looking at the pairs

**Show who gives to whom** asks for confirmation, then lists every pair. Each time is recorded in the audit log as
`secretsanta.reveal`. Use it to sort out a problem, such as a gift that never arrived.

### Taking someone out

Click **Take out** next to a person and confirm. They get a notification.

- Before the draw, they are simply removed.
- After the draw, whoever was giving to them gets their giftee instead. If the results are out, that person is told
  "you're now giving to …" (even if they muted Secret Santa). Anything they had marked for the person who left is
  cleared, since it was meant for someone else.
- If the person who left had already sent their gift, their giftee keeps it and also gets one from the new giver.
- If the new pairing would put two people together who are kept apart, it is refused. Remove that exclusion first.
- With only two people left it is refused too; end the event instead.

New people can't join after the draw.

### Ending the event

Once the results are out, click **End the event**. Gifts can still be marked, but no more reminders go out and the
event can't be edited. After the end, **Show every pair to the participants** makes **Who gave to whom** appear on
the event page for everyone who took part, and for organisers. It can be switched off again.

### Deleting

**Delete** removes the event, its draw and every sign-up for good.

## Notifications

All of them are in the **Secret Santa** category, which members can mute in their settings.

| Notification | Who gets it |
|---|---|
| Secret Santa: *event name* | Everyone who may join, if **Tell people** was on |
| Secret Santa: you're giving to … | Every participant, when the results are sent |
| Secret Santa: your gift is on its way | The giftee, when their gift is marked sent |
| Secret Santa: your giftee got your gift | The giver, when it's marked received, with the thank-you |
| Secret Santa: a thank-you from your giftee | The giver, for a thank-you written later |
| Secret Santa: gift due … | Participants who haven't marked their gift sent, two days before the deadline |
| Secret Santa: you're now giving to … | The giver whose giftee changed after someone was taken out (sent even if muted) |
| Secret Santa: you were taken out of … | The person taken out |

The plugin fires no webhook events of its own. Each notification still fires the core `notification.created` event.

## Privacy and audit logging

These actions are recorded in the audit log (**Administration → Logs → Audit**), with who did it:

| Action | Recorded as |
|---|---|
| Creating an event | `secretsanta.create` |
| Editing an event | `secretsanta.update` |
| Deleting an event | `secretsanta.delete` |
| Keeping two people apart | `secretsanta.exclusion` |
| Removing an exclusion | `secretsanta.exclusion_removed` |
| Drawing or drawing again | `secretsanta.draw` |
| Sending the results | `secretsanta.publish` |
| Looking at the pairs | `secretsanta.reveal` |
| Taking someone out | `secretsanta.remove` |
| Ending the event | `secretsanta.end` |
| Showing or hiding every pair | `secretsanta.reveal_all` |

The plugin stores each participant's chosen character, wish list, who they give to, and their gift's sent and
received times, note and thank-you. Signing up, withdrawing and marking gifts are not in the audit log. It collects
nothing from ESI.

## Background jobs

| Job | Schedule | What it does |
|---|---|---|
| `remind-due` | Every hour | Two days before an event's gift deadline, reminds everyone who hasn't marked their gift sent. Once per event. |

Moving the gift deadline later sends the reminder again for the new deadline. It only runs while the plugin is
enabled.

## Group rules

Secret Santa adds no group rules.

## Troubleshooting

**"Sign-up is still open".**
The draw can only be done after **Sign-up closes**. Edit the event and move it to now to close it early.

**"A draw needs at least 3 people".**
Fewer than three signed up. With two, both would know who their Secret Santa is.

**The draw says someone is kept apart from too many people.**
Every participant needs at least two others they may be paired with. Remove some of their exclusions.

**"The results have been sent; the draw can't be done again".**
That's by design: people already know who they give to. Use **Take out** to deal with someone leaving.

**"Taking … out would make … give to …, but they are kept apart".**
Remove that exclusion, then take the person out.

**Reminders didn't go out.**
Check that the Celery beat and worker are running; the `remind-due` job sends them. Only participants who haven't
marked their gift sent get one, and only after the results were sent.
