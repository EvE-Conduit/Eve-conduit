# Blacklist — Admin guide

The Blacklist plugin keeps a list of characters, corporations and alliances you don't want, each with a reason, a
severity, an optional expiry and a notes thread. It checks members' and applicants' characters against the list and
warns the people who can see it. Members never see the plugin. This guide covers installing it, permissions, the
checks it runs and its webhook event.

## Requirements

| Requirement | Details |
| --- | --- |
| EvE Conduit | 0.5.55 or newer |
| Other plugins | None needed. With [Recruitment](../../conduit-recruitment) installed, applications are checked too. With the Discord plugin linked, you can pick Discord roles to ping. |
| ESI scopes | None of its own. Name lookups use EVE's public API. |
| Corporation roles | None |

## Install and switch on

1. Go to **Administration** → **Plugins** and open the **Browse** tab.
2. Pick **Blacklist** (category HR) and click **Install**. Leave **Switch on after installing** on, or switch it on
   later on the **Installed** tab. The site restarts for a minute or so.
3. Give the permissions below to your HR group.

While the plugin is switched off, its menu entry disappears, its API stops responding and the hourly check does
nothing.

## Permissions

Give them under **Administration** → **Groups**. They are listed with the **HR staff** permissions.

| Permission | What it allows | Suggested group |
| --- | --- | --- |
| `blacklist.view_blacklist` | See the blacklist, its notes and warnings; add notes; check a name; mark warnings as dealt with or reopen them; get warning notifications; see the dashboard widget and search results | Recruiters, HR, leadership |
| `blacklist.manage_blacklist` | Add, change and remove entries; set Discord pings for `blacklist.match` | HR leads, leadership |

`blacklist.manage_blacklist` does not include viewing. Give both to the people who maintain the list.

Give recruiters `blacklist.view_blacklist`. When someone applies, their open warnings are sent out again, and only
people with the view permission receive them.

## Setup

There are no settings to configure. To start:

1. Open **Blacklist** and click **Add**.
2. Find each character, corporation or alliance by exact name, choose **Banned** or **Watch**, give a reason and,
   if needed, an expiry date.
3. Each new entry checks every registered character straight away. Matches appear on the **Warnings** tab.

See the [user guide](user-guide.md) for the day-to-day steps.

## Entry fields

| Field | Default | What it does |
| --- | --- | --- |
| **Who** | — | The character, corporation or alliance, found by exact name in EVE. Can't be changed later. |
| **Severity** | Banned | **Banned**: they must not join. **Watch**: keep an eye on them. Banned warnings get through even when the notification category is muted. |
| **Reason** | empty | Free text, seen only by people with the view permission. |
| **Expires (optional)** | never | After this date the entry stops matching but stays listed under **Expired**. Must be in the future when saved. |

## How checks run

A character matches an active entry for itself, its corporation or its alliance. Checks run:

| When | Found as |
| --- | --- |
| A character is linked to an account, and again 5 minutes later | Linked |
| A character moves to another account, or a user's state changes | Linked |
| Someone submits an application in the Recruitment plugin | Applied |
| A new entry is added (all registered characters it covers) | Regular check |
| Every hour (all registered characters against all active entries) | Regular check |

Each character–entry match is stored once and reported once. It is reported again only when the character moves to
a different account (the old "dealt with" mark is cleared). On an application, the applicant's open warnings are
reported again.

## Notifications

- Category: **Blacklist warnings**.
- Sent to everyone with `blacklist.view_blacklist` for each new match, with level "danger" and a link to the entry.
- Warnings for **Banned** entries are delivered even to people who turned the category off.
- Nothing is ever sent to the person who matched.

## Webhook event and Discord pings

| Event | Label | Private | Can ping Discord |
| --- | --- | --- | --- |
| `blacklist.match` | Blacklisted character found | Yes | Yes |

The payload names the account (`user`, `user_id`), the character (`character`, `character_id`), the entry
(`entry`, `entry_id`, `kind`, `severity`), the `source` (`linked`, `applied` or `check`), a title, summary and link.

Because it names who was flagged, the event is private: it goes only to webhooks that pick `blacklist.match` by name
under **Administration** → **Integrations**, never to webhooks set to receive every event.

To make it ping on Discord:

1. Under **Administration** → **Integrations**, add a Discord webhook and pick `blacklist.match` for it.
2. Open **Blacklist** → **Warnings**. People with `blacklist.manage_blacklist` (or `site.manage_api`) see a
   **Discord pings** section there. It only appears once an enabled Discord webhook exists.
3. Switch on **Blacklisted character found**.
4. With the Discord plugin linked, pick the roles to ping. Otherwise, give the webhook a mention (@here, @everyone or
   a role) under **Administration** → **Integrations**. Without either, nobody is pinged.

## Privacy and audit logging

Recorded in the audit log (**Administration** → **Logs** → **Audit**):

| Action | Audit entry |
| --- | --- |
| Entry added | `blacklist.added` |
| Entry changed | `blacklist.changed` |
| Entry removed (with its kind and reason) | `blacklist.removed` |
| Note added to an entry | `blacklist.note_added` |
| Warning marked as dealt with | `blacklist.match_resolved` |
| Warning reopened | `blacklist.match_reopened` |

Removing an entry deletes its notes and warnings.

Nobody handles a warning about themselves. Someone with `blacklist.view_blacklist` whose own account or character
matched an entry is not sent that warning, does not see it in **Warnings**, the counts, the entry's page or the
dashboard widget, and cannot mark it as dealt with or reopen it. Everyone else with the permission still does.

Every API route needs `blacklist.view_blacklist` (adding, changing, removing and the name lookup need
`blacklist.manage_blacklist`). Search returns nothing to people without the view permission.

## Background jobs

| Job | Schedule | What it does |
| --- | --- | --- |
| `conduit_blacklist.tasks.scan_all` | Every hour | Checks all registered characters against all active entries. Skipped while the plugin is off. |
| `conduit_blacklist.tasks.check_entry` | When an entry is added | Checks all registered characters the new entry covers. |
| `conduit_blacklist.tasks.check_user` | 5 minutes after a character is linked or moved | Checks the account again once the character's corporation and alliance are known. |

## Troubleshooting

**A member in a blacklisted corporation wasn't flagged.**
Their character's corporation may not have been updated yet. The hourly check catches it once it is. Also check
that the entry hasn't expired.

**"ESI lookup failed" or "EVE doesn't know that id (or ESI couldn't be reached)" when adding.**
EVE's API couldn't be reached. Try again later.

**"They're already on the blacklist."**
An entry for that character, corporation or alliance exists. Open it and change it instead.

**There is no Discord pings section on the Warnings tab.**
You need `blacklist.manage_blacklist` or `site.manage_api`, and at least one enabled Discord webhook under
**Administration** → **Integrations**.

**A Discord webhook set to "every event" doesn't get `blacklist.match`.**
That is by design. Pick the event by name for that webhook.

**Recruiters don't see warnings when someone applies.**
Give them `blacklist.view_blacklist`, and check that the Recruitment plugin is installed and switched on.
