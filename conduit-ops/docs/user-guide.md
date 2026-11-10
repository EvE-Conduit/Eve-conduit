# Ops Calendar — User guide

The Ops Calendar puts CTAs, stratops, roams, mining ops and other fleet events on one calendar in EVE time. Each op
counts down live to form-up. You can say whether you're coming and which character you'll bring, and you get a
reminder before form-up. FCs use the same page to schedule ops, change them and call them off.

## Where to find it

- Sidebar: **Ops calendar** (the page is `/p/ops`).
- Dashboard: the **Upcoming ops** widget shows the next four ops with their countdown and your answer.
- Search: press Ctrl+K and type an op's title, form-up location, FC or doctrine.
- Notifications about an op link straight to it on the calendar.

All times are EVE time (UTC). Where an op shows a full date, your own time zone is shown next to it.

## The calendar page

At the top are four cards:

| Card | What it shows |
| --- | --- |
| **Next op** | Countdown to the next form-up, with its title and EVE time. |
| **Next 7 days** | How many ops start in the next week, or how many are running now. |
| **I'm going to** | How many upcoming ops you answered *Going* to. |
| **Not answered** | Upcoming ops you haven't answered yet. |

Below are three tabs:

- **Upcoming** — ops grouped by EVE day ("Today", "Tomorrow", then the date). Each row shows the countdown, the
  form-up time, how long it runs, the title, the FC, the doctrine, the kind, the form-up location and comms, and how
  many are going (plus maybes). An **Everyone** badge marks ops where the whole audience is expected.
- **Calendar** — a month at a time, by EVE day. Use the arrows to change month. Click an op to open its details.
  A tick marks ops you're going to. Cancelled ops are crossed out.
- **Recent** — finished and cancelled ops. They stay for a number of days your admins set (14 by default).

The countdown turns amber in the last hour and red in the last 15 minutes. It shows **Live** while the op runs and
**Cancelled** for an op that was called off.

Op kinds: CTA, Stratop, Roam, Home defense, Mining, Training, Social, Other.

## Opening an op

Click the op's title to open its details:

- **Forms up** — EVE time and your local time, the countdown and roughly how long it runs.
- **FC**, **Form-up**, **Comms**, **Doctrine** and **Details**, when the FC filled them in. If the Doctrines plugin
  is on, the doctrine is a link to its fits.
- **For** — the states or groups the op is limited to, if any.
- **Going**, **Maybe** and (for the FC only) **Can't** — who answered.
- **Posted by** — who scheduled it and when it was last updated.

## Answering an op

1. Open the op, or press **Going?** on its row.
2. Pick **Going**, **Maybe** or **Can't**.
3. If you have more than one character, pick the one you'll bring. Your main is used unless you pick another.
4. Optional: type a short **Note for the FC** (up to 120 characters), such as "logi if needed" or "late by 20 min".
   It saves when you leave the field or press Enter.

To take your answer back, press the highlighted answer again. You can't answer an op that is over or cancelled.

Who sees what:

- Everyone who can see the op sees the names of people going and maybe.
- The FC, whoever scheduled the op, and officers who manage ops also see the characters, the notes and who can't come.
- You always see your own character and note.

## Notifications you get

Op notifications come under the bell in the **Ops** category (`p.ops`).

| When | Who is told |
| --- | --- |
| An op is posted | Everyone the op is for, unless the FC switched this off. |
| A reminder mark is reached (1 hour and 15 minutes before by default) | People who answered Going or Maybe. |
| The op is moved to another time | People who answered Going or Maybe. Reminders are sent again for the new time. |
| The op is cancelled | People who answered Going or Maybe. |

If the op is marked **Everyone is expected**, the whole audience is told when it's posted and gets every reminder.

Reminders and "moved" or "cancelled" notices only go to people who may still see the op: someone who answered and
then left the alliance, or the op's audience, isn't told any more.

Your guild may also see op posts and pings in Discord. Those come from webhooks your admins set up, not from your
answer.

### Muting op notifications

1. Click the bell, then the gear (**Notification settings**). This opens your settings at the **Notifications** card.
2. Switch off **Ops**.

Muting stops "op posted" and reminder notifications for normal ops. You still get them for ops marked
**Everyone is expected**, and you're still told when an op you answered is moved or cancelled.

## For FCs: scheduling ops

You need the `ops.schedule_ops` permission. With it, the page shows a **Schedule op** button.

### Schedule an op

1. Press **Schedule op**.
2. Fill in the form:
   - **Title** (required).
   - **Kind** — Roam by default.
   - **Form-up (EVE time)** (required) — defaults to the next whole hour. EVE time is UTC.
   - **Runs for** — 30 minutes to 8 hours; 2 hours by default.
   - **FC** — you by default. Type at least two letters to pick a member by main character name, or just type a
     name for someone who isn't on the site. A member picked as FC can change the op too.
   - **Doctrine** — picked from a list if the Doctrines plugin is on, otherwise typed as a name.
   - **Form-up location**, **Comms** and **Details** (what to bring, what to expect).
   - **Who it's for** — pick states or groups to limit the op. With nothing picked, every member sees it. Only the
     picked audience sees the op and is told about it.
3. Set the switches:
   - **Everyone is expected** — the whole audience is told now and reminded before form-up, even if they muted ops.
     Turning it on for a new op also turns on **Ping Discord**.
   - **Ping Discord** — Discord webhooks that ping mention their own setting when the op is posted, changed,
     reminded and cancelled. If the Discord plugin is linked to your server, **Roles to ping** lets you pick roles;
     the defaults from the settings are pre-selected.
   - **Tell members it's scheduled** — notifies the audience under the bell. It's locked on when everyone is
     expected. Webhooks hear about the op either way.
4. Press **Schedule**. The footer shows the form-up time in your own time zone so you can check it.

Limits: an op can be up to 120 days ahead and run from 15 minutes to 24 hours. A new op can't start more than an hour
in the past.

### Change, cancel or delete an op

Use the **⋯** menu on the op's row (or **Edit** in the details dialog on the Calendar tab).

- **Edit** — change anything. Moving the form-up time tells everyone who said Going or Maybe, and the reminders go
  out again. Other changes don't notify members, but webhooks hear about them.
- **Cancel op** — tells everyone who said Going or Maybe and webhooks. The op stays on the calendar, crossed out.
  A cancelled op can't be edited or answered.
- **Delete** — removes the op for everyone without telling anyone. Use it for mistakes; cancel real ops instead.

You can change the ops you created or lead. Officers with `ops.manage_ops` can change any op.

## FAQ and troubleshooting

**I can't see an op my friend can see.**
The op is limited to some states or groups and you're not in any of them.

**I didn't get a reminder.**
Reminders only go to people who answered Going or Maybe, unless the op is marked Everyone is expected. Check that
**Ops** isn't switched off under your notification settings.

**The time looks wrong.**
Form-up times are entered and listed in EVE time (UTC). Hover the time on a row, or open the op, to see your local
time as well.

**The character list doesn't show my alt.**
The list shows the characters on your account. Add the character to your account first. The list only appears once
you've answered Going or Maybe and have more than one character.

**I can't answer the op.**
It's over or cancelled.

**I don't see Schedule op.**
You need `ops.schedule_ops`. Ask an officer.

**I can't edit an op I'm flying in.**
Only the op's creator, its FC (when picked as a member, not typed as a name) and officers with `ops.manage_ops` can
change it.
