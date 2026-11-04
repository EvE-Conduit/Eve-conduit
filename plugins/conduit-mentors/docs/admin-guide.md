# Mentoring — Admin guide

The Mentoring plugin (package `conduit-mentors`) runs a mentoring program: new members ask for a mentor, mentors
take them on, and goals track progress. Goals can tick themselves through group rules. Program managers see every
mentorship, assign and reassign mentors, manage goals and focus areas, and choose who counts as new. This guide covers
requirements, permissions, settings, group rules and events.

## Requirements

| Requirement | Details |
| --- | --- |
| EvE Conduit | 0.5.55 or newer |
| Other plugins | None needed. Optional: [Fleets & FATs](../../conduit-fleets) for the "Fly in your first fleet" default goal and fleet rules; other plugins (Skill Plans, Doctrines, Discord) add group rules goals can use. The Discord plugin also lets you pick roles for Discord pings. |
| ESI scopes | None of its own. Goals with rules use whatever data those rules read. |
| Corporation roles | None |

## Install and switch on

1. Go to **Administration** → **Plugins** and open the **Browse** tab.
2. Pick **Mentoring** (category HR) and click **Install**. Leave **Switch on after installing** on, or switch it on
   later on the **Installed** tab. The site restarts for a minute or so.
3. Give the permissions below.
4. Open **Mentoring** → **Settings** (the **Program** page) and review the goals, focus areas and settings.

Every member sees **Mentoring** in the sidebar.

## Permissions

Give them under **Administration** → **Groups**. They are listed with the **HR staff** permissions.

| Permission | What it allows | Suggested group |
| --- | --- | --- |
| `mentors.mentor` | Keep a mentor profile, see the waiting list, take on mentees, tick goals, write private notes, graduate and end their own mentorships, open active mentees' character sheets (if allowed) | Mentors |
| `mentors.manage_program` | Open the Program page; see and act on every mentorship; assign or hand mentees to any mentor (also over their limit); reopen mentorships; manage goals, focus areas and settings; set Discord pings | Mentoring lead, HR |
| `site.manage_access` (core) | Needed in addition to change a goal's rules or **Who counts as new**, because these use the group rule editor | Administrators |

Program managers who also want to take mentees themselves need `mentors.mentor` too. Removing `mentors.mentor` from
someone ends their character sheet access at once, even before their mentees are reassigned.

## The Program page

Open it from the sidebar (**Mentoring** → **Settings**) or the **Program** button on the Mentoring page. The top shows
**Waiting for a mentor** (with average wait), **Being mentored**, **Graduated** (with average days to graduate) and
**Ended early**. The tabs are:

- **Mentorships**: every mentorship, filtered by **Open**, **Waiting**, **Active**, **Graduated** or **Ended**.
  Click one to open it.
- **Graduates**: who graduated, with whom, when and after how long, with a **Reopen** button.
- **Mentors**: everyone with `mentors.mentor`, their focus, play time, mentees against their limit, and how many
  they graduated. Paused mentors are marked **paused**.
- **Goals**: the goal list (see below).
- **Settings**: focus areas, character sheets, who counts as new, and Discord pings.

## Settings

All on the **Settings** tab of the Program page. Each section saves on its own and is audited.

| Setting | Default | What it does |
| --- | --- | --- |
| **Focus areas** | PvP, PvE, Industry, Mining, Exploration, Wormholes, Logistics, Fleet doctrine, Trading | What mentors can help with and new members can ask about. Up to 30 areas, 40 characters each. Click **Save focus areas**. |
| **Mentors may open their mentees' character sheets** | On | Mentors can open the full character sheets of their own active mentees. Saves as soon as you switch it. |
| **Who counts as new** | No rules (nobody is invited) | Members who match these rules and never had a mentorship are invited on the dashboard and the Mentoring page. Anyone can still ask. Needs `site.manage_access` to change. Click **Save rules**. |

Mentor profiles (per mentor, on the Mentoring page) default to **Taking new mentees** and **Mentees at most** 3.

## Goals

The first time anyone opens the plugin, it creates these goals once (deleting them later sticks):

| Goal | How it ticks |
| --- | --- |
| Meet your mentor on comms | The mentor |
| Set your home station and medical clone | The mentee may tick it |
| Fly in your first fleet | Itself (one FAT in 30 days), when Fleets & FATs is installed. Without it, the goal is "Join a fleet" and the mentee may tick it. |
| Reach 5 million skill points | Itself (main character's skill points) |

To add or change a goal:

1. On the **Goals** tab, click **Add goal**, or the pencil next to a goal.
2. Fill in **Title** (required) and **Description**.
3. Under **For mentees focusing on**, pick none for a goal every mentee gets, or the focus areas it's for. A mentee
   gets it if they asked for help with any of them.
4. Under **Ticks itself when**, add group rules (skill points, fleets flown, a skill plan done, a doctrine they can
   fly, Discord linked, or any other rule). Leave empty to tick it by hand. Changing rules needs
   `site.manage_access`; without it you see the current rules as text.
5. For a goal without rules, optionally switch on **The mentee may tick it themselves**.
6. Click **Save**.

Use the arrows to reorder goals. Deleting a goal removes it from every mentorship, with whatever was ticked.

## Day-to-day operation

As a program manager, on any mentorship page you can:

- **Assign a mentor** (waiting) or **Hand to another mentor** (active): pick from **Choose…** and click **Assign**.
  This ignores the mentor's limit and pause. The mentee, the new mentor and the previous mentor are told.
- **Take them on**, if you also have `mentors.mentor`.
- Write messages and private notes, and tick goals.
- **Graduate** or **End** (with a reason).
- **Reopen** a graduated or ended mentorship. It goes back to its mentor if they still mentor, otherwise back on the
  waiting list, with its goals and thread. Not possible while the mentee has another mentorship open.

When a waiting mentee writes in their thread, every program manager is notified.

## Group rules

In the Mentoring category of the group rule editor, for smart groups and Discord roles.

| Rule | Parameter | Passes when |
| --- | --- | --- |
| **Mentoring status** | **Is**: being mentored (default), waiting for a mentor, or graduated | The member has a mentorship with that status. For example, a "New bro" role while being mentored. |
| **Is an active mentor** | none | The member has `mentors.mentor` and their profile isn't paused. Mentors who never saved a profile count as active. |

## Webhook events and Discord pings

| Event | Label | Private | Can ping Discord |
| --- | --- | --- | --- |
| `mentors.requested` | Mentor requested | No | Yes |
| `mentors.assigned` | Mentor assigned | No | No |
| `mentors.graduated` | Mentee graduated | No | No |

Payloads name the mentee (`user`, `user_id`), the mentorship id and a link. `mentors.requested` also has the focus
areas and the requested mentor; the other two name the mentor. Send them under **Administration** → **Integrations**.

To make a mentor request ping on Discord:

1. Under **Administration** → **Integrations**, add a Discord webhook that gets `mentors.requested`.
2. On the Program page, open **Settings**. The **Discord pings** section is at the bottom. It only appears once an
   enabled Discord webhook exists, and needs `mentors.manage_program` or `site.manage_api`.
3. Switch on **Mentor requested**.
4. With the Discord plugin linked, pick roles to ping. Otherwise give the webhook a mention under **Administration**
   → **Integrations**.

## Notifications

Category: **Mentoring**. Graduation messages are delivered even if the mentee muted the category. See the
[user guide](user-guide.md) for the full list.

## Privacy and audit logging

- Mentees see their own thread without private notes. Private notes are for mentors and program managers only.
- Mentors looking at a waiting request see the main character only, and no thread. Mentors of a finished mentorship
  also see the main character only.
- Character sheet access is only for the mentor of an active mentorship, only while the setting is on and they hold
  `mentors.mentor`. Program managers need the core sheet permissions to open sheets. Each sheet view by someone else
  is recorded in **Administration** → **Logs** → **Snooper**.
- Ctrl+K: program managers find any mentee by any character name. Mentors find their active mentees by any
  character, and other mentees only by main character, so searches don't reveal who owns an alt.

Recorded in the audit log (**Administration** → **Logs** → **Audit**):

| Action | Audit entry |
| --- | --- |
| A mentor is assigned or takes someone on | `mentors.assigned` |
| Graduated | `mentors.graduated` |
| Ended (with reason) | `mentors.ended` |
| Reopened | `mentors.reopened` |
| Goal saved | `mentors.goal_saved` |
| Program settings saved | `mentors.settings_saved` |

Deleting and reordering goals, mentor profile changes and withdrawals are not audited.

## Background jobs

None. Goals with rules are checked when a mentorship is viewed.

## Troubleshooting

**The Mentors tab says "No mentors yet".**
Nobody has `mentors.mentor`. Give it to a group under **Administration** → **Groups**.

**New members aren't invited on the dashboard.**
**Who counts as new** is empty by default. Set rules there (needs `site.manage_access`). Members who already had a
mentorship are never invited.

**"Only people who manage access (groups and rules) can change rules".**
Changing a goal's rules or **Who counts as new** needs `site.manage_access`.

**"Fly in your first fleet" never ticks.**
It needs Fleets & FATs installed and on when the goals were first created. If it was installed later, edit the goal
and add a fleets rule.

**A mentor can't open a mentee's character sheet.**
Check **Mentors may open their mentees' character sheets**, that the mentorship is active, and that the mentor still
has `mentors.mentor`.

**"<name> already has another mentorship open" when reopening.**
Close or withdraw the other one first.

**There's no Discord pings section.**
Add an enabled Discord webhook under **Administration** → **Integrations**.
