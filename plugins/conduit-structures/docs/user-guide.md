# Structures & Fuel — User guide

Structures & Fuel shows every Upwell structure your corporations own that you're allowed to see, with how long its
fuel lasts, how many fuel blocks it burns and how many it needs. It warns before fuel runs out, and lets you tell
others "I'm refuelling this" so two people don't haul the same blocks.

## Who can use it

You see a corporation's structures if you may open that corporation's **Structures** section on the corporation
sheet. That depends on your corporation permissions (your own corporation, your alliance's corporations, or all
corporations). If you have none, the page says **No corporations to show**.

## Where to find it

- Sidebar: **Structures**, with **Fuel plan** under it (the pages are `/p/structures` and `/p/structures/plan`).
- Dashboard: the **Structures running low** widget shows how many structures are low, the worst six, and whether
  someone is refuelling them.

## The board

The four cards at the top show:

| Card | What it shows |
| --- | --- |
| **Structures** | How many structures you can see, across how many corporations. |
| **Below a threshold** | Structures under a warning threshold, and the thresholds in use. |
| **Out of fuel** | Structures with no fuel left. |
| **Burning** | Fuel blocks a day for all of them together. |

The table has one row per structure:

- **Structure** — name, type, corporation ticker, and its staging label if it has one. If a structure has its own
  warning thresholds, they're listed here.
- **Location** — system, security status and region.
- **Fuel left** — a live countdown and a fuel bar. Hover it for the exact time it runs out and roughly how many blocks
  are in the fuel bay. The badge shows the level: **Fuelled**, **Low**, **Critical**, **Out of fuel** or
  **No fuel use**.
- **Burn** — fuel blocks an hour for its online services. Hover for the burn with every service online and how many
  blocks top it up.
- **Services** — green for online, grey for offline. A "(?)" means the plugin doesn't know that service, so it isn't
  counted in the burn.
- **State** — the structure's state, a running timer if it has one, its reinforce hour (`RF 18:00 ET`), and
  "unanchoring" if it's being unanchored.
- **Refuel** — who is refuelling it and the **I'm on it** button.

**Low** means fuel is under one of the warning thresholds. **Critical** means it's under the lowest one.

### Filtering and sorting

- **All**, **Low** or **Out of fuel** — which structures to show.
- **Every corporation** — pick one corporation (shown when you can see more than one).
- Sort by **Least fuel first** (the default), **Highest burn**, **System** or **Name**.
- The search box matches name, type, system, region and corporation ticker.

## Claiming a refuel

1. Find the structure on the board and press **I'm on it**. The button shows for structures that are low, out of
   fuel, or need blocks to reach the plan's target.
2. The dialog shows about how many blocks (and m³) top it up.
3. Optional: add a **Note** such as which blocks you're bringing or when you'll be there (up to 200 characters).
4. Press **I'm refuelling it**.

Your portrait now shows on the row, the fuel plan and the dashboard widget. Fuel warnings mention you too.

Your claim ends by itself when the structure's fuel goes up, or after a set time (48 hours by default). To drop it
earlier, press the **×** next to your portrait on the board.

## The fuel plan

Open **Fuel plan** from the sidebar or the button on the board. It's a shopping list of fuel blocks to top every
structure up to a number of days.

1. Set **Top up to (days)** at the top (1 to 365). It starts at the site's default (30 days unless changed).
2. Read the totals: **Blocks to buy**, **Volume** (5 m³ a block), **Burn** (blocks a day) and **Cost**. The cost uses
   the cheapest average price of the four races' fuel blocks; any race's blocks work in any Upwell structure.
3. Below, structures are grouped by staging label, or by solar system when they have none. Each group shows its
   blocks, volume and blocks a day, with a table of **Structure**, **Fuel left**, **Burn** and **Needs**.

A group already topped up shows **Topped up**. A hand icon marks structures someone is refuelling. Structures out of
fuel are planned at what all their fitted services would burn, which is what they need to come back online.

## Notifications you get

Fuel warnings come under the bell in the category **Structure fuel warnings** (`p.structures`).

- You're warned when a structure's fuel drops under a threshold (7, 3 and 1 days by default). Each threshold warns
  once, and again only after the structure was refuelled above it.
- Warnings at a threshold of one day or less are shown as danger; others as warning.
- You only get warnings for corporations whose structures you may see. Your officers may limit warnings to chosen
  groups, such as a fuel team.

EvE Conduit itself also tells everyone who may see a corporation when one of its structures drops under 72 hours.
That notification is in the separate category **Corporation structures (fuel, reinforcement)**. This plugin doesn't
send its own notification at exactly 72 hours, so you aren't told twice.

To mute either one, click the bell, then the gear (**Notification settings**), and switch the category off.

## FAQ and troubleshooting

**The board is empty.**
Either you have no corporation permissions (**No corporations to show**), or no Station Manager's or Director's login
has synced the corporation's structures yet (**No structures yet**).

**The fuel time seems out of date.**
Structures are synced from ESI every 30 minutes. Between syncs the countdown is worked out from the last known fuel
expiry.

**My claim disappeared.**
Either the structure's fuel went up (the claim did its job) or the claim timed out.

**I refuelled, but my claim is still there.**
A refuel is only noticed when the fuel expiry moves at least 6 hours later. If a service went offline at the same
time, it may not be noticed; the claim then runs out by itself, or you can remove it with **×**.

**The burn looks wrong.**
Burn rates are estimates from the online service modules and structure bonuses. Totals are rounded up. Unknown
services marked "(?)" aren't counted. Tell an officer if a number is clearly off.

**My POS isn't listed.**
Starbases (POS) aren't covered.

**I don't see the pencil or Settings.**
Those need `structures.manage_structures`.
