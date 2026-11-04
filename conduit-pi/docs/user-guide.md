# Planetary Industry — User guide

Planetary Industry shows every colony across all your characters in one place: extractor countdowns, factories,
storage, and what your colonies make a day and what it is worth. It can remind you before an extractor runs out and
when it has stopped, and send you a daily digest.

## Where to find it

- **Planetary Industry** in the sidebar. The page has three tabs: **Colonies**, **Output** and **Reminders**.
- The **Extractors expiring next** widget on the dashboard: how many extractors are running, **All running** or
  "N not running", and the next extractors to run out with a countdown.

## Before you start

Colonies come from your character sheet's planet data. Each character must have granted planet access
(`esi-planets.manage_planets.v1`). If one hasn't, the **Colonies** tab shows "Some characters don't share their
planets" with their names.

To fix it, log in with that character again from your characters page and grant the access.

Colonies refresh from EVE about once an hour. Changes you make in game show up after the next refresh.

## Colonies tab

The top of the tab shows:

| Card | What it shows |
| --- | --- |
| Colonies | How many colonies, on how many characters. |
| Extractors running | Running out of total, and how many expire within your reminder lead time. |
| Not running | Extractors to restart. |
| Output a day | Estimated ISK a day, at average prices. |

With colonies on more than one character, use the buttons above the cards (**Everyone** or a character) to filter.

Each colony card shows:

- The planet, its type, the command centre level, the system and its security, the character, and when it was
  last changed in game. The ISK a day is at the top right. A red outline means an extractor isn't running.
- **Extractors**: product, units a day (hover for the amount per cycle, cycle length and heads), and a countdown.
  Stopped or expired extractors are red ("Expired ... ago").
- **Factories**: grouped by schematic, with tier. "N idle" means N factories have nothing routed into them.
- **Storage**: fill of the command centre, storage facilities and launchpads in m³. Hover to see the contents. The
  bar turns yellow at 70% and red at 90%.
- What the colony makes a day, and "needs ..." for inputs used there but not made there (haul them in).

## Output tab

- **What your colonies make**: each product with its tier, units **A day**, **ISK a day** and **A week**, netted over
  all your colonies. For example, Water made on one planet and turned into Coolant on another counts once.
- **To haul in**: what your factories use that your colonies don't make, per day.

### How output is estimated

- A running extractor gives its average amount every cycle until it expires.
- A factory with a route into it is taken to run every cycle at the standard rate (P1: 20 per 30 minutes; P2: 5,
  P3: 3 and P4: 1 an hour), using the standard inputs (3000 P0 per P1 run, 40 P1 per P2, 10 P2 per P3, 6 P3 or 40 P1
  per P4).
- Output is what is made minus what is used, valued at CCP's average price.

These are estimates. Real numbers can differ, for example early in a long extractor program.

## Reminders tab

1. Open **Planetary Industry** → **Reminders**.
2. Set the switches:

| Setting | Default | What it does |
| --- | --- | --- |
| Before an extractor expires | on | A reminder before the program ends. Not for programs you set shorter than the lead time. |
| When an extractor has expired | on | A reminder when it has ended. Only sent within 12 hours of it ending. |
| Daily digest | off | One notification a day after downtime (11:30 EVE time): what isn't running, what expires in the next 24 hours, and your ISK a day. |
| Remind me this many hours before | 2 | 1 to 72 hours. Only used when **Before an extractor expires** is on. |

3. Click **Save reminders**.

Each extractor program gets each reminder once. When you restart it in game (a new expiry), you are reminded again.
Several extractors due at the same time come in one notification.

## Notifications

All reminders arrive under the bell, in the category **Planetary Industry reminders**. To stop them all, turn the
category off under **Settings → Notifications**.

| When | Example title |
| --- | --- |
| Extractor about to expire | "Extractor on <planet> expires in 1h 45m", or "3 extractors expire within 2 hours" |
| Extractor expired | "Extractor on <planet> expired", or "3 extractors expired" |
| Daily digest | "PI: 2 extractors not running, 1 expires in the next 24 hours" or "PI: all 12 extractors running" |

## FAQ and troubleshooting

**I see "No colonies yet".**
Your characters have no colonies, or they haven't synced yet. Colonies show after your characters' next sync.

**A colony is missing.**
Check the "Some characters don't share their planets" box. That character needs to log in again and grant planet
access.

**I restarted an extractor but still got a reminder.**
Colonies sync about once an hour. Until the next sync the site still sees the old program.

**I didn't get a reminder for an extractor that stopped days ago.**
Expired reminders are only sent within 12 hours of the extractor ending.

**I didn't get a reminder before a short program ended.**
Programs set shorter than your lead time get no "before" reminder. Lower **Remind me this many hours before**.

**The ISK a day looks wrong.**
It is an estimate at standard rates and CCP's average prices. Factories with nothing routed into them are counted as
idle.
