# Planetary Industry — Admin guide

Planetary Industry gives every member a view of all their colonies, with extractor countdowns, estimated output and
its value, and reminders before extractors run out. Officers get **Corporation PI**: totals by product, who makes
what, each member's colonies and idle colonies, for running a PI program. The plugin makes no ESI calls of its own:
it reads the colonies the character sheet's planet section already keeps.

## Requirements

| Requirement | Details |
| --- | --- |
| EvE Conduit | 0.5.52 or newer (`min_conduit = "0.5.52"`). |
| Other plugins | None. |
| ESI scopes | `esi-planets.manage_planets.v1`, already asked for by the character sheet. Characters without it are named on the member's page. |
| Corporation roles | None. |
| Character sheet access | Officers using **Corporation PI** also need `sheet.view_corporation_characters`, `sheet.view_alliance_characters` or `sheet.view_all_characters`. |

## Install and switch on

1. Go to **Administration → Plugins** and open the **Browse** tab.
2. Tick **Planetary Industry**. Leave **Switch on after installing** on.
3. Click **Install 1** and confirm. If the site can't install plugins itself, click **How to install** and follow
   the server instructions instead.
4. If the plugin is installed but off, switch it on in the **Installed** tab.

**Planetary Industry** then appears in the sidebar for every member. People with `pi.view_corp_pi` also get
**Corporation PI** under it.

## Permissions

Give the permission to a state (**Administration → States**) or a group (**Administration → Groups**).

| Permission | What it allows | Suggested for |
| --- | --- | --- |
| `pi.view_corp_pi` | Open **Corporation PI**: the PI of every character their character sheet access covers. | Directors / PI program officers |

Every member sees their own colonies without any permission.

**Corporation PI** covers exactly the characters the officer may see on the character sheet:

| Character sheet permission | Characters covered |
| --- | --- |
| `sheet.view_corporation_characters` | Characters in the officer's main character's corporation. |
| `sheet.view_alliance_characters` | Characters in the officer's main character's alliance. |
| `sheet.view_all_characters` | Every character. |

Without one of these, an officer only sees their own characters. The page then says "No colonies to show".

## Settings

The plugin has no site-wide settings. Each member sets their own reminders on the **Reminders** tab. They are kept
with the core per-user plugin settings (`/api/me/preferences/plugins/pi`).

| Member setting | Default | What it does |
| --- | --- | --- |
| Before an extractor expires | on | Reminder before a program ends. Not for programs set shorter than the lead time. |
| When an extractor has expired | on | Reminder when it has ended, only within 12 hours of the end. |
| Daily digest | off | One notification a day at 11:30 EVE time. |
| Remind me this many hours before | 2 | 1 to 72. |

## Using Corporation PI

1. Open **Planetary Industry** → **Corporation PI** (or the **Corporation PI** button on the member page).
2. With characters in more than one corporation, pick one in the corporation picker, or **Every corporation**.
3. Read the cards: **Members**, **Extractors running** (and how many are not running), **Idle colonies**, **Output a
   day**.
4. Use the tabs:
   - **Products**: each product with tier, units **A day**, **ISK a day** and **Made by**. Filter by **Every tier**
     or `P0` to `P4`.
   - **Members**: each member with corporation, number of characters, **Colonies** (with "N idle"), **Extractors**
     (with "+N stopped"), **Makes** and **ISK a day**. Search with **Find a member or product**.
   - **Idle colonies**: colonies whose extractors have all been stopped for longer than **Idle for over N days**
     (default 3, 0 to 365). Shows planet, member, character, what it extracted and how many days idle (red from 14
     days).

Output figures are estimates: running extractors at their average rate, factories with a route into them running
every cycle at the standard rate. Values use CCP's average prices.

## Webhook events and Discord

| Event | When | Payload |
| --- | --- | --- |
| `pi.extractors_expiring` | A member's extractor programs end within their reminder time. | `user_id`, `user`, `count`, `extractors` (character, planet, product, expiry; up to 50), `title`, `summary`, `link`, `level` |
| `pi.extractors_expired` | A member's extractor programs ended. | Same as above. |

Both events are private: they name the member and their planets, so they only go to webhooks that pick them by name.
Set this up under **Administration → Integrations**. They follow each member's reminder settings: a member who
switched a reminder off produces no event for it.

There are no Discord ping settings for this plugin.

## Notifications

Reminders and digests go to the member only, in the category **Planetary Industry reminders**. Members can mute the
category under **Settings → Notifications**.

## Privacy and audit log

Opening **Corporation PI** is written to the **snooper log** (**Administration → Logs → Snooper**) for every other
member's character it shows, like opening the Planets tab of their character sheet. The officer's own characters
are not logged.

## Background jobs

| Job | Schedule | What it does |
| --- | --- | --- |
| `conduit_pi.tasks.reminders` | Every 10 minutes | Sends "about to expire" and "expired" reminders, once per extractor program. Deletes reminder records older than 30 days. |
| `conduit_pi.tasks.digest` | Daily at 11:30 (EVE time) | Sends the daily digest to members who switched it on, at most once a day. |

Both only run while the plugin is switched on, and only for active users who may use the plugin. Colony data itself
is refreshed by the core character sheet about once an hour.

## Group rules

The plugin adds no group rules.

## Troubleshooting

**A member has no colonies.** Their characters must have granted `esi-planets.manage_planets.v1`. The member page
names characters that haven't. They log in again with that character to fix it.

**Corporation PI shows "Not for you".** The user needs `pi.view_corp_pi`.

**Corporation PI shows "No colonies to show".** Nobody the officer can see runs PI, or the officer has no
character sheet access (`sheet.view_*`) reaching other members. Give it under **Administration → Groups**.

**Reminders arrive after an extractor was restarted.** Colonies sync about once an hour, so a restart in game can be
reminded of until the next sync.

**No reminders at all.** Check that the background workers and scheduler are running, that the member hasn't
switched the reminders off or muted **Planetary Industry reminders**, and that the extractor ended less than 12 hours
ago (for expired reminders).

**Webhook gets no PI events.** The events are private. Pick `pi.extractors_expiring` and `pi.extractors_expired` by
name on the webhook under **Administration → Integrations**.
