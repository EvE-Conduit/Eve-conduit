# Fleets & FATs — Admin guide

Fleets & FATs records fleet attendance (FATs, also called PAPs). FCs start a fleet and either track their in-game
fleet through ESI, hand out a FAT link, or both. Managers see attendance per member, manage fleet types, and can
switch on a Discord form-up ping. A group rule turns attendance into group requirements and smart groups.

## Requirements

| Item | Value |
|---|---|
| EvE Conduit version | 0.5.55 or newer |
| Other plugins | None. With the Discord plugin linked, you can pick Discord roles to ping. |
| ESI scopes it adds | `esi-fleets.read_fleet.v1` (tracking), `esi-fleets.write_fleet.v1` (FAT lines in the fleet MOTD) |
| Corporation roles | None. The FC's character must be fleet boss in game to track. |

Enabling the plugin adds both scopes to the scopes the site asks for. FCs must log in with their FC characters again
before they can track. Tracking always uses one of the FC's own characters, managers included.

## Install and switch it on

1. Go to Administration → Plugins → Browse.
2. Find **Fleets & FATs** (category Military) and install it.
3. Enable the plugin.
4. Give `fleets.run_fleets` to your FCs and `fleets.manage_fleets` to fleet managers.
5. Optional: check the fleet types and the Discord ping on the **Attendance** page.

## Permissions

| Permission codename | What it allows | Suggested group |
|---|---|---|
| (none) | See fleets and their pilots, own attendance, register through a FAT link. | Everyone |
| `fleets.run_fleets` | Start fleets, track them, hand out FAT links, start FAT rounds, add or remove pilots and end the fleet, for fleets they started or are FC of. | FCs |
| `fleets.manage_fleets` | Everything above for any fleet; delete fleets; the **Attendance** page and CSV; manage fleet types; the Discord ping setting. | Fleet managers, directors |

Assign permissions under Administration → Groups.

## Fleet types

The first time the plugin is used it creates CTA, Stratop, Roam, Home defense and Mining. To change them:

1. On **Fleets**, press **Attendance**.
2. In **Fleet types**, pick a colour, type a name (for example "Capital op") and press the plus button.
3. Press the bin icon next to a type to remove it. Its fleets keep their FATs, without a type.

The group rule matches fleet types by name. Removing a type leaves its fleets without a type, so a rule that counts only
that type stops counting them.

## Attendance

Open **Fleets** → **Attendance**. It lists FATs per member with any of their characters: one per fleet, or per FAT
round. Pick **30 days**, **90 days** or **1 year**, and **All types** or one type. Characters that are not registered
on the site are listed separately and marked **not registered**. Press **CSV** to download it. The CSV has the
columns Member, Registered, FATs, Fleets, Characters and Last fleet.

To delete a fleet, open it and press the bin icon next to **End fleet**. Its FATs are deleted too, which lowers
everyone's attendance.

## Group rules

**Fleet attendance (FATs)** (`fleets_attended`), category **Fleets**.

| Parameter | Default | What it does |
|---|---|---|
| At least (FATs) | 1 | Minimum number of FATs. |
| In the last (days) | 30 | Period, 1 to 3650 days, counted by the fleet's start time. |
| Only these fleet types | empty | Comma separated names, for example `CTA, Stratop`. Empty counts every fleet. |
| Only fleets with at least (pilots) | 1 | Smaller fleets don't count, so nobody can pass with small fleets they ran for themselves. |

How it counts:

- one FAT per fleet, or per FAT round when the FC started more than one;
- two characters of one member in the same round count once;
- FATs someone added by hand for their own characters don't count;
- FATs belong to whoever owns the character now.

## Webhook events and Discord pings

| Event | When | Alert |
|---|---|---|
| `fleets.created` | An FC started a fleet. The message names the FC and type and links to the fleet. | Yes |
| `fleets.ended` | A fleet ended, with how many pilots got a FAT. | No |

Send them to a URL or Discord under Administration → Integrations.

To ping Discord when a fleet starts (a form-up call):

1. Add a Discord webhook under Administration → Integrations and pick the **Fleet created** event for it.
2. On **Fleets** → **Attendance**, find **Discord pings** and switch on **Fleet created**.
3. Give the webhook a mention (`@here`, `@everyone` or a role) under Administration → Integrations. With the Discord
   plugin linked, you can also pick roles in **Discord pings**.

The **Discord pings** box only appears once a webhook is set up. Until a webhook gets the event and has someone to
mention, it shows a warning and nobody is pinged.

## Privacy and audit logging

- The MOTD lines show counts only, never who has a FAT.
- These actions go in the audit log: `fleets.create`, `fleets.new_round`, `fleets.end`, `fleets.fat_added` (with the
  character names), `fleets.fat_removed`, `fleets.delete`.

## Background jobs

| Job | Schedule | What it does |
|---|---|---|
| `conduit_fleets.tasks.track_fleets` | Every 60 seconds | Reads the members of every tracked fleet from ESI, records FATs and updates the MOTD lines. It does nothing while the plugin is disabled. |

Tracking stops by itself when the in-game fleet ends or changes boss, when the character's login stops working, or 12
hours after the fleet started. If ESI asks the site to back off, it tries again the next minute.

## Troubleshooting

**FCs can't pick a character to track.**
Their characters lack `esi-fleets.read_fleet.v1`. They log in again under Characters → Add character.

**No FATs are recorded while tracking.**
Check that Celery beat and workers are running; the tracking job runs every minute. The fleet page shows the last
read time and any error.

**The MOTD lines are missing.**
The FC character lacks `esi-fleets.write_fleet.v1`, or ESI refused the MOTD. The error shows on the fleet page.
FATs are still tracked.
