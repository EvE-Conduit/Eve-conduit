# Timers — User guide

Timers puts structure and sovereignty timers on one board, counting down live in EVE time. You can say you're going
to a timer and get a reminder before it comes out. Timers for your own corporation's structures and from members'
in-game notifications are added by themselves; officers add the rest by hand.

## Where to find it

- Sidebar: **Timers** (the page is `/p/timers`).
- Dashboard: the **Timers** widget shows the next four timers with their countdown, and whether you're going.
- Search: press Ctrl+K and type a structure name, system or owner.

All times are EVE time (UTC). Hover a time, or open a timer, to see your local time too.

## The board

The four cards at the top show:

| Card | What it shows |
| --- | --- |
| **Next timer** | Countdown to the next timer, with the structure and system. |
| **Coming out today** | Timers coming out today, by EVE time. |
| **Upcoming** | All upcoming timers, split into ours and hostile. |
| **I'm going to** | How many timers you said you're going to. |

Two tabs:

- **Upcoming** — timers grouped by EVE day. A timer stays here for one hour after it comes out.
- **Came out** — timers that came out more than an hour ago. They drop off after a number of days your officers set
  (14 by default).

Each row shows:

- The countdown and the time in EVE time. The countdown turns amber in the last hour and red in the last 15 minutes,
  then shows **Out now** for the hour after.
- The structure: its type icon, name, type and owner. An **Everyone** badge marks timers everyone is expected at.
- The system with its security status and region.
- The timer kind: Armor, Hull, Anchoring, Unanchoring, Sovereignty, Moon extraction or Other.
- Whose it is: **Ours**, **Hostile** or **Neutral**. The coloured stripe on the left matches.
- How many people are going. Hover the number to see their names.

## Opening a timer

Click the structure name to open the details:

- **Comes out** — EVE time and your local time, with the time left.
- **Notes** — form-up, doctrine, comms or anything else the officer wrote.
- **Going** — who said they're going.
- **From** — who added it, or "the corporation's structures" or "an in-game notification" for timers added by
  themselves.
- **Exact** — the full date and time in EVE time and local time.

## Saying you're going

1. Press **Going?** on the timer's row.
2. The button turns into **Going**. Everyone can see your name in the list.

Press **Going** again to take it back. The button is gone once the timer has come out.

## Notifications you get

Timer notifications come under the bell in the **Timers** category (`p.timers`).

| When | Who is told |
| --- | --- |
| A timer is added by hand | Every member, unless the officer switched this off. |
| A timer is added by itself (from structures or notifications) | Every member who can see it. |
| A reminder mark is reached (1 hour and 15 minutes before by default) | People who said they're going. |

If a timer is marked **Everyone is expected**, every member is told when it's added and gets every reminder.

When a timer is moved to a new time, its reminders go out again. Removing a timer doesn't tell anyone.

Your corporation may also see timers and pings in Discord. Those come from webhooks your admins set up.

### Muting timer notifications

1. Click the bell, then the gear (**Notification settings**).
2. Switch off **Timers**.

You still get notifications and reminders for timers marked **Everyone is expected**.

## Timers from your own structures

When your corporation's structures are reinforced (armor or hull), anchoring or unanchoring, a timer is added for
them automatically. These come from the corporation sheet, so at first only people who may see that corporation's
**Structures** section see them and are told. They become visible to everyone once an officer edits the timer, or when
a member's in-game notification reports the same timer.

## For officers: adding timers

You need `timers.manage_timers`. With it, the board shows **Add timer** and **Settings**, and each row has a **⋯**
menu with **Edit** and **Remove**. The admin guide covers the full form.

## FAQ and troubleshooting

**A timer I know about isn't on the board.**
Officers add most enemy timers by hand. Timers from in-game notifications only appear for notification types the plugin
reads, and only after a member's character has synced its notifications.

**A colleague sees a timer I can't.**
It came from a corporation's structures and you may not see that corporation's Structures section.

**I didn't get a reminder.**
Reminders only go to people who pressed **Going?**, unless everyone is expected. Check that **Timers** isn't switched
off in your notification settings.

**The time changed.**
An officer moved it, or a newer sync from the game corrected it. Reminders are sent again for the new time.

**I don't see Add timer.**
You need `timers.manage_timers`. Ask an officer.
