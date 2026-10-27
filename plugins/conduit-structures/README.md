# Structures & Fuel

Every Upwell structure your corporations own on one board, the fuel blocks each one burns and needs, warnings at the
thresholds you choose, and members saying "I'm refuelling this".

- **The board** (anyone who may see a corporation's structures): every structure across the corporations you may view,
  with its type, corporation, system and region, fuel left as a live countdown, warning level, what it burns an hour,
  its services online and offline, its state (and a running timer) and reinforce hour. Filter by low or out of fuel,
  by corporation and by text; sort by fuel left (the default), burn, system or name.
- **Fuel plan:** blocks to top every structure up to N days (30 by default; change it on the page or in Settings), as a
  shopping list per staging, or per solar system for structures without one: blocks, m³ (5 m³ a block), blocks a day,
  and a cost at the cheapest average price of the four races' fuel blocks.
- **Warnings:** at 7, 3 and 1 days of fuel left by default (Settings), each threshold once, and again only after the
  structure was refuelled above it. A structure first seen already low warns once, at the lowest threshold it's under.
  Each structure can have its own thresholds or none (the pencil on the board, `structures.manage_structures`).
  Warnings notify the chosen groups (or, with none chosen, everyone who may see the corporation) and emit
  `structures.fuel_low` for Discord, Slack or JSON webhooks (Administration → Integrations), with the threshold, hours
  left, burn and who's refuelling it. Below 24 hours they're `danger`, otherwise `warning`.
  Fuel warnings can ping on Discord: switch it on under Discord pings in Settings. It needs a Discord webhook under
  Administration → Integrations; with the Discord plugin linked you also pick roles.
- **Refuel claims:** a member presses **I'm on it** (with an optional note) so nobody else hauls the same blocks. The
  claim ends by itself once the structure's fuel goes up, or after 48 hours (Settings). The board, the plan and the
  warning say who's on it. Claims emit `structures.refuel_claimed`; refuels emit `structures.refuelled`, with who had
  claimed it.
- **Dashboard widget:** structures below a threshold or out of fuel, worst first.

## Who sees what

Structures follow the corporation sheet: you see a corporation's structures when you may open its Structures section
(`corp.view_own_corporation`, `corp.view_alliance_corporations` or `corp.view_all_corporations`). Claims, the plan and
the widget only ever cover those. Warnings go only to people who may see that corporation, so give the group you pick
(a "Fuel team") a corporation permission too. `structures.manage_structures` (Directors) changes the settings and
per-structure thresholds and staging labels, for structures they can see.

## Living with the core's 72 hour warning

EvE Conduit itself notifies everyone who may see a corporation once when one of its structures drops under 72 hours
(`corp.structure_fuel_low`, notification category "Corporation structures"). This plugin doesn't change that. To keep
people from being told twice:

- At a threshold of exactly the core's 72 hours, this plugin sends **no notification** (everyone it would tell is a
  viewer of that corporation and was just told by the core), but still emits `structures.fuel_low`.
- Other thresholds notify under "Structure fuel warnings" (`p.structures`), which members can mute separately.
- For webhooks, pick `corp.structure_fuel_low` **or** `structures.fuel_low`, not both, or the 72 hour mark posts twice.
  `structures.fuel_low` covers every threshold, so it's usually the one to keep.

## Fuel burn

Burn rates are in [`conduit_structures/burn.py`](conduit_structures/burn.py) with their source; check them against the
game if something looks off. In short: a structure burns only for its online service modules; each module is counted
once even when ESI lists it as several services (a Research Lab is copying, ME and TE research); citadels burn 25 %
less for clone bays and market hubs, engineering complexes 25 % less for industry modules, the Tatara 25 % and the
Athanor 20 % less for reprocessing, reactions and moon drilling. Ansiblex, Pharolux, Tenebrex and Metenox burn a fixed
rate while fuelled.

Things kept simple, so treat the numbers as a good estimate rather than exact:

- Bonused rates like 7.5 blocks an hour are kept as fractions; totals are rounded up. The game bills whole blocks.
- Services the table doesn't know show with a "(?)" on the board and aren't counted.
- The Metenox's magmatic gas isn't planned, only its fuel blocks.
- A structure out of fuel is planned at what all its fitted services would burn (what it needs to come back up).
- A refuel is the fuel expiry moving at least 6 hours later without the burn falling. Taking a service offline makes
  fuel last longer but isn't a refuel; topping up while also taking a service offline isn't noticed (the claim then
  runs out by itself).

## What it reads

Only what EvE Conduit already syncs: the corporations' Structures section (`esi-corporations.read_structures.v1`, a
Station Manager's or Director's login, every 30 minutes). Fuel left is worked out from the stored expiry, so the check
every 15 minutes needn't wait for the next sync. **POS starbases aren't covered:** the core syncs them without their
fuel.

Needs EvE Conduit 0.5.55 or newer.
