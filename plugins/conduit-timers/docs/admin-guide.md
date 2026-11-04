# Timers — Admin guide

Timers (plugin id `timers`) is a board of structure and sovereignty timers with live countdowns, "going" lists and
reminders. Officers with `timers.manage_timers` add timers by hand. The plugin also adds timers by itself from your
corporations' reinforced, anchoring and unanchoring structures, and from members' in-game notifications. This guide
covers requirements, permissions, settings, the automatic sources, webhooks and troubleshooting.

## Requirements

| Item | Requirement |
| --- | --- |
| EvE Conduit | 0.5.36 or newer (`min_conduit`). |
| Other plugins | None required. The Discord plugin, linked to your server, adds role picking for Discord pings. |
| ESI scopes | None of its own. The automatic sources use data the core already syncs: |
| — from structures | The corporation sheet's **Structures** section: `esi-corporations.read_structures.v1` from a **Station Manager** or **Director** login, synced every 30 minutes. |
| — from notifications | The character sheet's **Notifications** section: `esi-characters.read_notifications.v1` on members' characters. |

Only members can use the plugin. Guests don't get its pages, API or search results.

## Install and switch it on

1. Go to **Administration → Plugins** and open the **Browse** tab.
2. Select **Timers**.
3. Optional: leave **Switch on after installing** on, and choose **Update automatically**.
4. Press **Install 1** and confirm. The site restarts and is offline for a minute or so.
5. If it isn't on yet, open the **Installed** tab and switch on **Timers**.

When it's on, **Timers** appears in every member's sidebar and the **Timers** dashboard widget becomes available.
Switching the plugin off hides the page and stops its reminder and import jobs.

## Permissions

Grant permissions on a group (**Administration → Groups**) or a state (**Administration → States**).

| Permission | What it allows | Suggested group |
| --- | --- | --- |
| *(none)* | See the board, say they're going, get notifications. | All members |
| `timers.manage_timers` | Add, edit and remove timers, search known structures in the editor, change the settings, run **Check now**. | Directors, FCs who run the timer board |
| `corp.view_own_corporation`, `corp.view_alliance_corporations` or `corp.view_all_corporations` (core) | See timers read from that corporation's structures before an officer publishes them. | Leadership |

The permission picker lists `timers.manage_timers` under the director tier.

## Settings

On the board press **Settings** (shown only with `timers.manage_timers`). The dialog is **Timer settings**. Press
**Save** to apply.

| Setting | Default | What it does |
| --- | --- | --- |
| **Reminders** | 1 h and 15 min | Minute marks before a timer comes out when reminders go out. Pick from 1 day, 12 h, 6 h, 2 h, 1 h, 30 min, 15 min and 5 min; at most six. With none picked, no reminders are sent. |
| **From the corporation's structures** | On | Reinforced, anchoring and unanchoring structures on the corporation sheet get a timer. |
| **From in-game notifications** | On | Members' notifications about structures that lost shields or armor, sovereignty structures and customs offices become timers. |
| **Discord roles to ping** | none | Roles pre-selected for new timers with **Ping Discord** on. Each timer can change them. Only shown once the Discord plugin is linked to your server. |
| **Keep timers that came out for** | 14 days | How long timers stay on the **Came out** tab (1 to 90). |

The dialog also shows when notifications were last looked at, and a **Check now** button that runs both automatic
sources straight away and reports how many timers it added.

## Adding a timer by hand

1. Press **Add timer**.
2. **Structure** (required): type the structure's name, its system or its type. After two letters, structures the
   site knows by name are offered (from members' assets, contracts, mail and notifications, and the corporation
   sheet). Your own corporation's and alliance's come first, marked **Ours**. Picking one fills in its name, type,
   system and owner; for your own, the side too; and if the corporation sheet has it reinforced, anchoring or
   unanchoring, the kind and time as well. Change anything afterwards.
3. **Type**: pick from the list (Upwell structures, flex structures, Metenox, Orbital Skyhook, Sovereignty Hub,
   Customs Office, TCU, IHub, Control Tower) or type anything.
4. **Solar system** (required): type at least two letters and pick.
5. **Owner**: corporation or alliance name.
6. **Timer**: the kind (Armor by default). **Whose**: **Ours**, **Hostile** or **Neutral**.
7. **When it comes out** (required):
   - **Time left** — as the game shows it: `1d 4h 23m`, `4h 23m`, `45m` or `4:23`. It's counted from the moment you
     typed it.
   - **Exact time** — a date and time in your own time zone.
   The footer shows the resulting time so you can check it.
8. **Notes**: form-up, doctrine, comms, what to expect.
9. Switches:
   - **Everyone is expected** — every member is told now and reminded before it comes out, even if they muted
     timers. Turning it on for a new timer also turns on **Ping Discord**.
   - **Ping Discord** — Discord webhooks that ping mention their own setting when the timer is added, changed and at
     every reminder. With the Discord plugin linked, **Roles to ping** appears, pre-filled with the default roles.
   - **Tell members it's been added** — notifies members under the bell. Locked on when everyone is expected.
     Webhooks hear about it either way.
10. Press **Add timer**.

Limits: a timer can be up to 60 days ahead, and no older than the **Keep timers that came out for** setting.

### Edit and remove

Use the **⋯** menu on a row:

- **Edit** — opens the same form with **Exact time** selected. Changing the time resets the reminders.
- **Remove** — takes the timer off the board for everyone. Nobody is told under the bell; webhooks get
  `timers.deleted`, which never pings.

## The automatic sources

Both run every five minutes while switched on in the settings.

**From the corporation's structures.** Structures in armor or hull reinforcement, anchoring or unanchoring get a
timer named and typed from the structure and owned by its corporation. If a later sync moves the time, the timer
follows. These timers are the corporation sheet's data, so only people who may see that corporation's **Structures**
section see them, are told about them and get their reminders. Webhooks don't hear about them. A timer becomes public
(shown to every member, announced, and sent to webhooks) when:

- an officer edits and saves it, or
- a member's in-game notification reports the same timer.

**From in-game notifications.** These notification types become timers:

| Notification | Timer kind |
| --- | --- |
| Structure lost shields | Armor |
| Structure lost armor | Hull |
| Skyhook lost shields | Armor |
| Structure anchoring | Anchoring |
| Structure unanchoring | Unanchoring |
| Sovereignty structure reinforced (TCU, IHub) | Sovereignty |
| Customs office reinforced | Other |

Notifications older than 7 days are ignored. The same notification seen by several members makes one timer. A timer
read from elsewhere is treated as the same timer when it ends within 10 minutes of one already on the board for that
structure (or that system, without a structure id). Late-syncing characters are still picked up. Timers you added by
hand are never moved by the automatic sources.

New automatic timers are announced like hand-added ones, with member notifications on.

## Notifications

The category is **Timers** (`p.timers`), which members can mute.

| Trigger | Recipients | Respects mute |
| --- | --- | --- |
| Timer added (by hand with **Tell members it's been added** on, or automatically) | Every member who can see it | Yes, except Everyone is expected |
| Reminder mark reached | People going; every member who can see it for Everyone is expected | Yes, except Everyone is expected |

The level follows the side: **Ours** is danger, **Hostile** warning, **Neutral** info.

## Webhook events

Set up webhooks under **Administration → Integrations**.

| Event | When |
| --- | --- |
| `timers.created` | A timer is added, or a structure-only timer is made public. |
| `timers.updated` | A timer's time or details change. |
| `timers.deleted` | A timer is removed. Never pings. |
| `timers.reminder` | A reminder mark is reached. |

Each event carries `timer_id`, `structure`, `structure_type`, `system`, `kind`, `side`, `owner`, `ends_at`,
`important`, `title`, `summary`, `level` and `link`. Timers only visible from a corporation's structures send no
events.

### Discord pings

An event pings only when the timer has **Ping Discord** on. To make it work:

1. Under **Administration → Integrations**, create or edit a Discord webhook that gets the timer events.
2. Set **Ping** to @here, @everyone or a role, and **When** to **When the event asks**.
3. Optional: link the Discord plugin to your server so officers can pick roles per timer (for example capital pilots
   for a hull timer), and set default roles in the timer settings.

## Audit log

These are recorded under **Administration → Logs → Audit**:

| Action | Recorded as |
| --- | --- |
| Adding a timer | `timers.create` |
| Editing a timer | `timers.update` |
| Removing a timer | `timers.delete` |
| Changing the settings | `timers.settings` |

"Going" answers, **Check now** and automatic timers are not audited.

## Background jobs

| Job | Schedule | What it does |
| --- | --- | --- |
| `conduit_timers.tasks.remind_due` | Every 60 seconds | Sends reminders whose minute mark has passed. Each mark is sent once per timer; if several are due at once, one reminder goes out for the nearest mark. |
| `conduit_timers.tasks.import_timers` | Every 5 minutes | Reads the corporation structures and in-game notifications, as switched on in the settings. |

Both do nothing while the plugin is switched off. The plugin adds no group rules.

## Troubleshooting

**No timers arrive from our structures.**
Check **From the corporation's structures** is on, and that the corporation sheet's Structures section syncs (a Station
Manager's or Director's login with `esi-corporations.read_structures.v1`). Then press **Check now**.

**Members can't see a timer that's on my board.**
It came from a corporation's structures and is only shown to that corporation's structure viewers. Edit and save it to
publish it to everyone.

**No timers arrive from notifications.**
Check **From in-game notifications** is on and that members' characters have `esi-characters.read_notifications.v1`.
Only the notification types listed above are read, and only from the last 7 days.

**A timer appears twice.**
The two sources disagreed by more than 10 minutes, or one has no structure id. Remove the duplicate.

**Discord posts but doesn't ping.**
The timer needs **Ping Discord** on, and the webhook needs a **Ping** target and **When the event asks** (or
**Every message**).

**No role picker appears.**
The Discord plugin isn't switched on or isn't linked to a server (bot token and server).

**"A timer can't be more than 60 days away" or "That time is too long ago".**
The time is outside the allowed range. Check **Time left** versus **Exact time**, and the time zone.
