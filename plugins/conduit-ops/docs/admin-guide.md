# Ops Calendar — Admin guide

The Ops Calendar (plugin id `ops`) is a shared calendar of fleet ops in EVE time. Members answer ops and get
reminders; FCs with `ops.schedule_ops` post and run their own ops; officers with `ops.manage_ops` change any op and
the plugin settings. It can post to Discord and other webhooks, and can ping Discord roles. This guide covers
installing it, permissions, settings, webhooks and troubleshooting.

## Requirements

| Item | Requirement |
| --- | --- |
| EvE Conduit | 0.5.51 or newer (`min_conduit`). |
| Other plugins | None required. |
| Optional: Doctrines plugin | When installed and switched on, FCs pick the doctrine from its active doctrines and members can open it from the op. |
| Optional: Discord plugin | When switched on and linked to your server (bot token and server set), FCs and the settings can pick Discord roles to ping. |
| ESI scopes | None. |
| In-game corporation roles | None. |

Only members can use the plugin. Guests don't get its pages, API or search results.

## Install and switch it on

1. Go to **Administration → Plugins** and open the **Browse** tab.
2. Select **Ops Calendar**.
3. Optional: leave **Switch on after installing** on, and choose **Update automatically**.
4. Press **Install 1** and confirm. The site restarts and is offline for a minute or so.
5. If it isn't on yet, open the **Installed** tab and switch on **Ops Calendar**.

When it's on, **Ops calendar** appears in every member's sidebar and the **Upcoming ops** widget becomes available on
the dashboard. Switching the plugin off hides the page and stops its API and its reminder job.

## Permissions

Grant permissions on a group (**Administration → Groups**) or a state (**Administration → States**).

| Permission | What it allows | Suggested group |
| --- | --- | --- |
| *(none)* | See the ops meant for you, answer them, get notifications. | All members |
| `ops.schedule_ops` | Schedule ops; change, cancel and delete the ops you created or are picked as FC for. | FCs |
| `ops.manage_ops` | Change, cancel and delete any op; see every op whatever its audience; change the settings. | Directors, fleet leadership |

The permission picker lists `ops.schedule_ops` under the member tier and `ops.manage_ops` under the director tier.

Visibility rules:

- An op with no states or groups picked is for every member.
- An op limited to states or groups is only seen by members in one of them, plus its creator, its FC, and anyone
  with `ops.manage_ops`.
- Everyone who sees an op sees the names of people going and maybe. Only people who may change the op see the
  characters, the notes and who can't come.

## Settings

Open the calendar and press **Settings** (shown only with `ops.manage_ops`). The dialog is **Ops calendar settings**.
Press **Save** to apply.

| Setting | Default | What it does |
| --- | --- | --- |
| **Reminders** | 1 h and 15 min | Minute marks before form-up when reminders go out. Pick from 1 day, 12 h, 6 h, 2 h, 1 h, 30 min, 15 min and 5 min; at most six. With none picked, no reminders are sent. |
| **Discord roles to ping** | none | Roles pre-selected for new ops with **Ping Discord** on. Each op can change them. Only shown once the Discord plugin is linked to your server. |
| **Keep finished ops for** | 14 days | How long finished and cancelled ops stay on the **Recent** tab (1 to 90). The **Calendar** tab still shows older ops. |

## Day-to-day operation

- FCs schedule ops with **Schedule op**. See the user guide for the full form.
- An op can be up to 120 days ahead and run 15 minutes to 24 hours. The duration list offers 30 minutes to 8 hours.
- **Edit** a moved op and everyone who answered Going or Maybe is told; reminders reset for the new time.
- **Cancel op** tells everyone who answered and keeps the op on the calendar, crossed out.
- **Delete** removes an op silently. Use it for mistakes only.
- Use **Who it's for** to keep stratops or leadership ops to the right states or groups.
- **Everyone is expected** sends the posting notification and every reminder to the whole audience, even members who
  muted the **Ops** category.

## Notifications

Notifications use the category **Ops** (`p.ops`), which members can mute.

| Trigger | Recipients | Respects mute |
| --- | --- | --- |
| Op posted (when **Tell members it's scheduled** is on, or always for Everyone is expected) | The op's audience | Yes, except Everyone is expected |
| Reminder mark reached | Going and Maybe answers; the whole audience for Everyone is expected | Yes, except Everyone is expected |
| Op moved | Going and Maybe answers | No |
| Op cancelled | Going and Maybe answers | No |

CTAs show as danger, stratops and home defense as warning, other kinds as info. Everyone is expected ops are always
danger.

## Webhook events

Set up webhooks under **Administration → Integrations**.

| Event | When |
| --- | --- |
| `ops.created` | An op is scheduled (always, even with member notifications off). |
| `ops.updated` | An op is moved or its details change. |
| `ops.cancelled` | An op is cancelled. |
| `ops.reminder` | A reminder mark is reached. |

Deleting an op sends no event.

Each event carries `op_id`, `title`, `kind`, `starts_at`, `duration_minutes`, `fc`, `formup`, `comms`, `doctrine`,
`important`, `audience`, `summary`, `level` and `link`.

### Restricted ops

Ops limited to some states or groups don't use the events above. They go out as `ops.created_restricted`,
`ops.updated_restricted`, `ops.cancelled_restricted` and `ops.reminder_restricted`, with `audience` listing the
states and groups. These are private events: a webhook set to **Every event** does not get them. Pick them by name on a
webhook that posts to a channel only the right people can read, or don't send them anywhere.

### Discord pings

An event pings only when the op has **Ping Discord** on. To make it work:

1. Under **Administration → Integrations**, create or edit a Discord webhook that gets the ops events.
2. Set **Ping** to @here, @everyone or a role, and **When** to **When the event asks**.
3. Optional: link the Discord plugin to your server so FCs can also pick roles per op, and set default roles in the
   ops settings.

A pinging op pings on every event: posted, changed, reminded and cancelled.

## Audit log

These actions are recorded under **Administration → Logs → Audit**:

| Action | Recorded as |
| --- | --- |
| Scheduling an op | `ops.create` |
| Changing an op | `ops.update` |
| Cancelling an op | `ops.cancel` |
| Deleting an op | `ops.delete` |
| Changing the settings | `ops.settings` |

Answers (Going, Maybe, Can't) are not audited. The FC picker only searches main character names, so it doesn't reveal
who owns which alt.

## Background jobs

| Job | Schedule | What it does |
| --- | --- | --- |
| `conduit_ops.tasks.remind_due` | Every 60 seconds | Sends reminders whose minute mark has passed. Each mark is sent once per op. If several marks are due at once (for example after the scheduler was down), one reminder goes out for the nearest mark. Does nothing while the plugin is off. |

The plugin adds no group rules.

## Troubleshooting

**No reminders go out.**
Check that at least one mark is picked under **Reminders**, that the Celery worker and beat scheduler are running, and
that the plugin is switched on. Reminders only go to Going and Maybe answers unless the op is Everyone is expected.

**Discord posts but doesn't ping.**
The op needs **Ping Discord** on, and the webhook needs a **Ping** target and **When the event asks** (or
**Every message**).

**Restricted ops never reach Discord.**
They use the `*_restricted` events, which **Every event** leaves out. Pick them by name on a suitable webhook.

**"Discord couldn't be reached; the roles aren't available right now."**
The Discord API didn't answer. Role lists are cached for 10 minutes; try again later. Pings with already-chosen roles
still work.

**No role picker appears.**
The Discord plugin isn't switched on or isn't linked to a server (bot token and server).

**The doctrine is plain text, not a list.**
The Doctrines plugin isn't installed or is switched off. Ops keep the doctrine's name if the plugin is later removed.

**An FC can't edit their op.**
They need `ops.schedule_ops` and must be the op's creator or its FC picked as a member. A typed FC name gives no
rights.

**An officer can't see an op.**
Without `ops.manage_ops`, officers only see ops for their own states and groups.
