# Leaderboard — Admin guide

The Leaderboard ranks members by what their characters did, using data the core already syncs for the character
sheet, and FATs from the Fleets plugin when it is on. It hands out monthly medals to the top three of each board. This
guide covers requirements, permissions, settings, medals and troubleshooting.

## Requirements

| Item | Details |
| --- | --- |
| EvE Conduit version | 0.5.19 or later (`min_conduit`) |
| Other plugins | None required. The **Fleets** board needs the Fleets plugin installed and switched on. |
| ESI scopes | None of its own. Boards use the character sheet data, so members' logins need the matching scopes (see below). |
| EVE corporation roles | None |
| Access | Members only. |

Data each board uses, and the ESI scope the character sheet needs for it:

| Board | Data | ESI scope |
| --- | --- | --- |
| **Kills**, **ISK destroyed**, **Losses** | Killmails | `esi-killmails.read_killmails.v1` |
| **Mining** | Mining ledger | `esi-industry.read_character_mining.v1` |
| **Bounties** | Wallet journal (bounty and ESS payouts) | `esi-wallet.read_character_wallet.v1` |
| **Industry** | Industry jobs | `esi-industry.read_character_jobs.v1` |
| **Skillpoints** | Skills | `esi-skills.read_skills.v1` |
| **Fleets** | FATs from the Fleets plugin | None |

Characters without a working login for a scope do not count on that board. The boards follow the character sheet's
sync schedule.

## Install and switch on

1. Go to **Administration → Plugins → Browse**.
2. Find **Leaderboard** (category Community) and install it.
3. Switch it on, either with **Switch on after installing** or under the **Installed** tab.

**Leaderboard** then shows in the menu for all members.

## Permissions

| Permission codename | What it allows | Suggested group |
| --- | --- | --- |
| `leaderboard.manage_leaderboard` | Open **Settings** on the leaderboard, and award last month's medals early on the **Medals** page. | Directors |

All members can see the boards, the medals and the hall of fame, and hide themselves. No permission is needed for
that.

## Settings

1. Open **Leaderboard**.
2. Press **Settings**. The **Leaderboard settings** dialog has three tabs.
3. Make your changes and press **Save**.

Saving clears the cached boards, so changes show at once.

### Boards

Switch each board on or off. Untick everything to show them all. **Fleets** is greyed out with "Needs the Fleets
plugin switched on." while the Fleets plugin is off.

| Setting | Default | What it does |
| --- | --- | --- |
| Board switches | none ticked (all boards shown) | Which boards members see, and which get medals. |

### Who competes

| Setting | Default | What it does |
| --- | --- | --- |
| Corporation switches | none ticked (every member) | Only members whose main character is in a ticked corporation compete. The list shows every corporation a member's main is in. |

When competitors are in more than one corporation, members also get a corporation picker on the boards.

### Display

| Setting | Default | What it does |
| --- | --- | --- |
| **Places on a board** | `25` | How many places a full board shows (3 to 200). Members further down still see their own place. |
| **Show characters** | on | Members can open a row to see which of someone's characters earned the score. Off shows only totals. Members always see their own breakdown. |
| **Monthly medals** | on | The daily job hands out medals the day after a month ends. Off stops the automatic medals. |

## How scoring works

- Only members (people in a members' state) with a main character compete.
- All of a member's characters count for that member.
- Members who hid themselves are left out.
- Members with a score of zero or less are not shown.
- Ties share a rank (1, 2, 2, 4).
- **Skillpoints** is always all time. The other boards follow the chosen month or all time.
- The period list offers this month, the 12 months before it, and **All time**.
- Boards are cached for five minutes. Saving settings, a member hiding, and medals being awarded clear the cache.

## Medals

The top three of each shown monthly board get a medal for the month. Ties share the place, so a tie for first is two
golds. **Skillpoints** gets no medals. Each winner gets a notification.

### Automatic medals

A daily job runs at 06:20 (server time). Once last month has been over for a full day, it awards last month's medals,
unless that month already has medals or **Monthly medals** is off. It only looks at the month just ended.

### Awarding early

1. Open **Leaderboard → Medals**.
2. Press **Award <month> now**. The button shows while last month has no medals yet.
3. Confirm in **Award the medals for <month>?**.

This cannot be undone. A month can only be awarded once it is over, and only once. This button works even if
**Monthly medals** is off.

## Notifications, webhooks and Discord

- Notification category: **Leaderboard medals**. Winners get "You finished 1st in <board> for <month>" (or 2nd, 3rd).
- The plugin sends no webhook events and has no Discord pings.

## Group rules

The plugin adds no group rules.

## Privacy and audit log

The boards show members' names, main character portraits and corporations to all members. With **Show
characters** on, members can also see which characters earned a score, which can reveal alts. Turn it off if alts
should stay private.

Members can hide themselves. This is stored in their own preferences.

Audit log entries (**Administration → Logs → Audit**):

| Action | Logged when |
| --- | --- |
| `leaderboard.settings` | The settings were saved. |
| `leaderboard.award` | An admin awarded a month's medals early. |

## Background jobs

| Job | Schedule | What it does |
| --- | --- | --- |
| `conduit_leaderboard.tasks.award_finished_months` | Daily at 06:20 | Awards last month's medals once the month has been over for a day. Does nothing if **Monthly medals** is off or the plugin is switched off. |

## Troubleshooting

| Message or symptom | What to do |
| --- | --- |
| "No boards are switched on" | Open **Settings → Boards** and switch some on, or untick all to show every board. |
| **Fleets** board missing | Switch on the Fleets plugin. |
| A member is missing | Check they have a main character, are in a members' state, are not hidden, and their main's corporation is ticked under **Who competes** (if any are). |
| Figures look low | Check that members' logins have the scopes listed above. Data follows the character sheet's syncs; allow about an hour. |
| "Show between 3 and 200 places" | Set **Places on a board** between 3 and 200. |
| "A month can be awarded once it's over" | Wait until the month has ended. |
| "<month> already has its medals" | That month was already awarded. |
| No medals for last month | Check that **Monthly medals** is on and the plugin is switched on, or press **Award <month> now** on **Medals**. Only last month can be awarded; older months cannot be awarded from the page. |
