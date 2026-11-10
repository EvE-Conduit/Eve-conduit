# Inactivity — Admin guide

The Inactivity plugin works out once a day who has gone quiet, from site sign-ins, EVE logins and fleets, and tells
HR. Members post a leave of absence so they aren't flagged while away; leave can need approval. It adds two group
rules, two webhook events and a dashboard widget. This guide covers requirements, permissions, every setting and how
the daily check works.

## Requirements

| Requirement | Details |
| --- | --- |
| EvE Conduit | 0.5.55 or newer |
| Other plugins | Optional: [Fleets & FATs](../../conduit-fleets), installed and switched on, for the **Flew in a fleet** signal. Optional: the Discord plugin, to pick roles for Discord pings. |
| ESI scopes (characters) | `esi-location.read_online.v1` for the **Played EVE** signal (last login and logout from the character sheet). |
| ESI scopes (corporation) | Optional: corporation member tracking (`esi-corporations.read_corporation_membership.v1`, `esi-corporations.track_members.v1`) also feeds **Played EVE**, for corporations a Director has added. |
| Corporation roles | Director, only for corporation member tracking. |

## Install and switch on

1. Go to **Administration** → **Plugins** and open the **Browse** tab.
2. Pick **Inactivity** (category HR) and click **Install**. Leave **Switch on after installing** on, or switch it on
   later on the **Installed** tab. The site restarts for a minute or so.
3. Give the permissions below to your HR group.
4. Open **Inactive members** → **Settings**, check the settings and click **Save settings**. Saving also works
   everyone out straight away, so the list isn't empty until the first daily check.

## Permissions

Give them under **Administration** → **Groups**. They are listed with the **HR staff** permissions. Every member can
post and cancel their own leave without any permission.

| Permission | What it allows | Suggested group |
| --- | --- | --- |
| `inactivity.view_inactivity` | See **Inactive members** (the member list and everyone's leave), download CSV, see the dashboard widget, get the daily "went inactive" notification | HR, leadership |
| `inactivity.manage_leave` | Approve and reject leave, get "asked for leave" notifications, change the settings, use **Check now**, set Discord pings | HR leads |

The sidebar entry **Inactive members** and the widget need `inactivity.view_inactivity`. Give both permissions to
people who manage leave.

## Settings

Open **Inactive members** and the **Settings** tab (needs `inactivity.manage_leave`). Click **Save settings** to
apply. Saving works everyone out again without sending notifications, and is recorded in the audit log.

### What counts as active

| Setting | Default | What it does |
| --- | --- | --- |
| **Inactive after (days)** | 30 | Members with no activity for this many days are inactive. 1 to 3650. |
| **Signed in to the site** | On | Counts the member's last sign-in to EvE Conduit. Sign-ins last a long time, so keep another signal on. |
| **Played EVE** | On | Counts their characters' last EVE login or logout, from character sheets and corporation member tracking. A character online now counts as now, as long as its character sheet overview synced in the last 3 hours and its login still works; otherwise its last login and logout count. |
| **Flew in a fleet** | On | Counts their last FAT from Fleets & FATs. FATs a member added by hand for their own characters don't count. Has no effect unless Fleets & FATs is installed and on. |

At least one signal must be on. A member is active while the latest switched-on signal is within the limit. Activity
is never counted from before they joined the site.

### Leave of absence

| Setting | Default | What it does |
| --- | --- | --- |
| **Leave needs approval** | On | Leave waits for someone with `inactivity.manage_leave`. Off: leave counts as soon as a member posts it. |
| **Tell members when they're flagged** | Off | Sends newly flagged members a "We haven't seen you in a while" notification pointing to the Leave of absence page. |
| **Longest leave (days)** | 90 | The longest single leave a member can post. 1 to 3650. |

Members can also post leave only up to a year ahead, not for dates already over, and not overlapping another leave of
theirs that is waiting or approved.

### Who is checked

| Setting | Default | What it does |
| --- | --- | --- |
| **States** | none ticked | Only check members in any ticked state. Nothing ticked means every member state. |
| **Groups** | none ticked | Only check members in any ticked group. Nothing ticked means no group limit. |

Guests (public states) are never checked. Members outside the chosen states and groups are dropped from the list.

## Day-to-day operation

- **Members** tab: filter **Inactive**, **On leave** or **Everyone**, search with **Find a character**, download
  **CSV**, and use **Check now** to work everyone out again (no notifications).
- **Leave of absence** tab: **Waiting**, **Away now**, **Coming up** and **Past**. **Approve** or **Reject** waiting
  leave with an optional note. Nobody can decide their own leave.
- Dashboard widget **Inactivity**: inactive count, how many are on leave, and how much leave is waiting.

The CSV has the columns Member, Corporation, Last active, Days inactive, Inactive, On leave until, Signed in to the
site, Played and Last fleet. Text that a spreadsheet would run as a formula (a corporation name starting with `=`,
`+`, `-` or `@`) is written with a leading apostrophe.

## The daily check

At 07:20 (server time, UTC) the plugin:

1. Works out every checked member's last activity per signal.
2. Marks members inactive when they have no activity within the limit and no approved leave running today.
3. Sends one notification, "N members went inactive", to everyone with `inactivity.view_inactivity`, naming members
   flagged for the first time since they were last active (up to 20 names, then "and N more").
4. Fires the `inactivity.flagged` event.
5. If **Tell members when they're flagged** is on, notifies each newly flagged member.

A member is named once. They are named again only after they've been active in between. **Check now** and saving the
settings do the same work without notifying anyone; whoever they flag is still named by the next daily check (and
gets their own notice then, if that is on). Posting, cancelling or deciding a leave updates that member
straight away.

## Group rules

Both are in the HR category of the group rule editor, for smart groups (**Administration** → **Groups**).

| Rule | Parameter | Passes when |
| --- | --- | --- |
| **Active recently** | **Active in the last (days)**, default 30, 1 to 3650 | The member was active in the last N days by the switched-on signals, or is on an approved leave. |
| **On leave of absence** | none | The member has an approved leave running today. |

**Active recently** reads the activity stored by the daily check, so it can be up to a day behind. For a member the
check hasn't covered yet, it works their activity out on the spot.

## Webhook events and Discord pings

| Event | Label | Private | Can ping Discord |
| --- | --- | --- | --- |
| `inactivity.flagged` | Members went inactive | Yes | Yes |
| `inactivity.leave_posted` | Leave of absence posted | Yes | Yes |

`inactivity.flagged` carries the count, names, user ids (up to 100), the day limit and a link.
`inactivity.leave_posted` carries the member, start and end dates and the leave's status (`pending` or `approved`);
it fires for every leave posted, whether or not it needs approval.

Both name members, so they are private: they go only to webhooks that pick them by name under **Administration** →
**Integrations**, never to webhooks set to receive every event.

To make them ping on Discord:

1. Under **Administration** → **Integrations**, add a Discord webhook and pick the events for it.
2. Open **Inactive members** → **Settings**. The **Discord pings** section is at the bottom. It only appears once an
   enabled Discord webhook exists.
3. Switch on the events that should ping.
4. With the Discord plugin linked, pick roles to ping. Otherwise give the webhook a mention under **Administration**
   → **Integrations**. Without either, nobody is pinged.

## Notifications

Category: **Inactivity and leave of absence**.

| Notification | Sent to |
| --- | --- |
| "N members went inactive" | Everyone with `inactivity.view_inactivity`, after the daily check |
| "<name> asked for leave" | Everyone with `inactivity.manage_leave` (except the member), when a leave needs approval |
| "Your leave ... was approved" / "wasn't approved" | The member. Delivered even if they muted the category. |
| "We haven't seen you in a while" | Newly flagged members, if **Tell members when they're flagged** is on |

## Privacy and audit logging

The member list, everyone's leave and their reasons are only shown to people with `inactivity.view_inactivity` or
`inactivity.manage_leave`. Members see only their own leave.

Recorded in the audit log (**Administration** → **Logs** → **Audit**):

| Action | Audit entry |
| --- | --- |
| A member posts a leave | `inactivity.leave_posted` |
| Leave approved | `inactivity.leave_approved` |
| Leave rejected | `inactivity.leave_rejected` |
| Settings saved (with the day limit and signals) | `inactivity.settings_saved` |

Cancelling a leave is not audited.

## Background jobs

| Job | Schedule | What it does |
| --- | --- | --- |
| `conduit_inactivity.tasks.daily` | Every day at 07:20 | The daily check described above. Skipped while the plugin is off. |

## Troubleshooting

**The Members tab says "Nobody checked yet".**
The first check runs at 07:20. Click **Check now**, or save the settings.

**Everyone shows as inactive, or the Played column is empty.**
Characters need `esi-location.read_online.v1` for login data. Add corporation member tracking with a Director for
more coverage, or keep **Signed in to the site** on.

**Last fleet is always empty.**
Fleets & FATs isn't installed or isn't switched on. The **Flew in a fleet** switch says so.

**"Switch on at least one kind of activity".**
At least one of the three signals must be on.

**A member on leave was still named in the daily notification.**
Only approved leave running that day stops flagging. Leave waiting for approval doesn't count.

**There's no Settings tab.**
It needs `inactivity.manage_leave`.

**There is no Discord pings section.**
You need `inactivity.manage_leave` or `site.manage_api`, and an enabled Discord webhook under **Administration** →
**Integrations**.
