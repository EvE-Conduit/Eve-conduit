# Spy Check — Admin guide

Spy Check looks through every member character's synced data once a day for dealings with characters, corporations and alliances on its own watch list and, optionally, on the Blacklist plugin. It records findings that HR reviewers acknowledge or dismiss, logs every look at the evidence, and sends one notification per scan. Members never see it. This guide covers requirements, installing, permissions, settings and running it.

## Requirements

| Requirement | Details |
| --- | --- |
| EvE Conduit | 0.5.55 or newer (`min_conduit`). |
| ESI scopes | None of its own. It reads data the core already syncs: wallet journal, wallet transactions, contracts, mail, contacts and corporation history. A kind of finding only works for characters whose matching data is syncing. |
| Other plugins | Optional: [Blacklist](../../conduit-blacklist). When it is installed and on, its active entries are watched too. Spy Check works without it. |
| Discord pings | Optional: a Discord webhook under Administration → Integrations. With the Discord plugin linked you can also pick roles. |

## Installing and switching it on

1. Go to **Administration → Plugins**.
2. Open the **Browse** tab and find **Spy Check** (category HR).
3. Install it, then enable it.
4. Under **Administration → Groups**, give the permissions below to your HR or counter-intelligence group.
5. Make sure the reviewers have character sheet permissions for the members they should review.

## Permissions

| Permission codename | What it allows | Suggested group |
| --- | --- | --- |
| `spycheck.view_findings` | See Spy Check, the findings and their evidence, the members and the watch list; acknowledge or dismiss findings; get the new-findings notification. | HR / counter-intelligence reviewers |
| `spycheck.manage_spycheck` | Add and remove watch list entries, change settings, switch on Discord pings and press **Scan now**. | HR leads (together with `spycheck.view_findings`) |

Both are listed in the HR tier of the permission picker. Notes:

- Reviewers only see findings (and are told about new ones) for characters their character sheet permissions reach: all, their alliance's or their corporation's.
- Nobody sees, hears about or reviews findings on their own characters. The counts follow the same rule: the number of new findings next to each watch list entry, the number of watched entities, and "N new findings" after **Scan now** only count what that person may see. A watch list entry for one of someone's own characters is not shown to them, and they can't add or remove it; another manager has to. A member's page only opens for someone who may see at least one of that member's characters.
- The **Spy Check** menu entry, the dashboard widget and the notification all go by `spycheck.view_findings`, so give managers both permissions.

## Setup

### Build the watch list

1. Open **Spy Check** and go to the **Watch list** tab.
2. Press **Watch**.
3. Under **Who**, type at least 3 letters of a character, corporation or alliance. Names the synced data has not mentioned are found by their exact name.
4. Pick one. Entries already watched show **Already watched**.
5. Optional: fill in **Why (optional)**.
6. Press **Watch**. The next scan looks for them.

To remove an entry, press the bin icon next to it and confirm **Remove**. Its findings stay; the next scan just stops looking for it.

Blacklist entries show under **From the blacklist** and are managed in the Blacklist plugin. An entity on both lists counts as the Blacklist's.

### Settings

Open the **Settings** tab, change what you need, and press **Save settings**. The next scan uses them.

| Setting | Default | What it does |
| --- | --- | --- |
| **Group** (Who is told) | Everyone who may see Spy Check | Only members of this group who hold `spycheck.view_findings` get the new-findings notification. The card shows how many people get it, or warns when nobody does. |
| **Look for blacklisted entities** | On | Watch every active Blacklist entry, besides the watch list. Has no effect when the Blacklist plugin is not installed or on. |
| **Include "watch" entries** | On | Off: only Blacklist entries marked banned count. |
| **Wallet journal** | On | Look at wallet journal lines. |
| **Market transactions** | On | Look at market transactions. |
| **Contracts** | On | Look at contracts. |
| **Mail** | On | Look at mail. |
| **Contact with good standing** | On | Look at contacts. |
| **Corporation history** | On | Look at corporation history and current corporation and alliance. |
| **Contacts count above standing** | 0 | A contact counts only when its standing is above this. 0 means any good standing. Range -10 to 10. |

Corporation history counts stints in a watched corporation, and in corporations that are in a watched alliance today. Alliance history is not synced. A character's current corporation and alliance count even before their history has synced.

### Discord pings

The **Discord pings** section at the bottom of the Settings tab appears once a Discord webhook exists under **Administration → Integrations**. Switch on **Spy Check findings** to ping on Discord when a scan finds something new. Each webhook that gets the alert mentions its own @here, @everyone or role; with the Discord plugin linked you can also pick roles here.

## Day-to-day operation

- The daily scan runs on its own. Press **Scan now** in the page header to scan straight away, for example after adding to the watch list. It shows "N new findings" or "Scanned: nothing new".
- Only one scan runs at a time. **Scan now** while a scan is running says "A scan is already running: try again when it's done". The daily scan is skipped if **Scan now** is already running.
- Each scan updates the numbers on existing findings, adds new ones, reopens dismissed findings with newer evidence (a contract counts from when it was accepted, not only when it was issued), and marks findings it no longer finds as **No longer found**.
- Reviewers work through the **Findings** tab. See the user guide.

## Notifications and webhook events

| Where | What is sent |
| --- | --- |
| In-site notification | One per scan with new or reopened findings: "Spy Check: N new findings", naming members and who they dealt with. Each recipient only hears about characters they may see, never their own. Category **Spy Check findings**. Links to Spy Check. |
| Webhook event `spycheck.findings` | "Spy Check findings": the number of new findings and the members named. It is private: because it names members, it only goes to webhooks under **Administration → Integrations** that pick it by name. |
| Discord ping | Only if switched on under **Discord pings** in the Settings tab. |

## Privacy and audit logging

Findings list counts and dates only. The records themselves are read live when someone opens them.

| What | Snooper log | Audit log (Administration → Logs → Audit) |
| --- | --- | --- |
| Opening a finding's evidence | Yes, as opening that tab of the character sheet (wallet, contracts, mail, contacts or overview) | `spycheck.evidence_viewed` |
| Opening a member's page | Yes, as looking at their intel, for each character with findings | `spycheck.member_viewed` |
| Marking a finding | No | `spycheck.new`, `spycheck.acknowledged` or `spycheck.dismissed`, with the note |
| Adding or removing a watch list entry | No | `spycheck.watch_added`, `spycheck.watch_removed` |
| Changing settings | No | `spycheck.settings_saved` |

Mail evidence shows the sender, recipients and subject, not the text.

## Background jobs

| Job | Schedule | What it does |
| --- | --- | --- |
| `conduit_spycheck.tasks.daily` | Daily at 06:40 (server time), after the night's syncs | Scans every member character (not guests) and sends the notification and event for anything new. Skipped while the plugin is off or while **Scan now** is running. |

## Troubleshooting

**Adding to the watch list fails with "EVE doesn't know that id (or ESI couldn't be reached)".**
ESI may be down. Try again later.

**"That id is a ...: watch a character, corporation or alliance".**
Only characters, corporations and alliances can be watched.

**The Settings tab shows "Nobody gets the notification".**
Give the chosen group `spycheck.view_findings`, or pick another group.

**From the blacklist says "The Blacklist plugin isn't installed or switched on".**
Install and enable the Blacklist plugin, or rely on the watch list. If it says "Switched off in the settings", turn on **Look for blacklisted entities**.

**A reviewer sees fewer findings than expected.**
Their character sheet permissions limit what they see. Findings on their own characters are always hidden from them.

**A kind of finding never shows up.**
Check that it is switched on under **What is looked at**, and that the matching character data (for example mail or contacts) is syncing.
