# Structures & Fuel — Admin guide

Structures & Fuel (plugin id `structures`) puts every Upwell structure your corporations own on one board, works out
the fuel blocks each one burns and needs, sends fuel warnings at thresholds you choose, and lets members claim
refuels. It reads only data EvE Conduit already syncs for the corporation sheet. This guide covers requirements,
permissions, settings, warnings, webhooks and troubleshooting.

## Requirements

| Item | Requirement |
| --- | --- |
| EvE Conduit | 0.5.55 or newer (`min_conduit`). |
| Other plugins | None required. The Discord plugin, linked to your server, adds role picking for Discord pings. |
| ESI scope | `esi-corporations.read_structures.v1`, through the core corporation sheet's **Structures** section. The plugin asks for no scopes of its own. |
| In-game corporation role | A character with **Station Manager** or **Director** must have logged in with that scope. The core syncs the Structures section every 30 minutes. |

Not covered: POS starbases (the core syncs them without fuel).

## Install and switch it on

1. Go to **Administration → Plugins** and open the **Browse** tab.
2. Select **Structures & Fuel**.
3. Optional: leave **Switch on after installing** on, and choose **Update automatically**.
4. Press **Install 1** and confirm. The site restarts and is offline for a minute or so.
5. If it isn't on yet, open the **Installed** tab and switch on **Structures & Fuel**.
6. Make sure the corporation sheet's **Structures** section is syncing for each corporation (a Station Manager's or
   Director's login with `esi-corporations.read_structures.v1`).

When it's on, the sidebar shows **Structures** with **Fuel plan** and (for managers) **Settings** under it, and the
**Structures running low** dashboard widget becomes available.

## Permissions

Grant permissions on a group (**Administration → Groups**) or a state (**Administration → States**).

Who sees which structures follows the corporation sheet. A user sees a corporation's structures, claims and plan
when they may open its **Structures** section.

| Permission | What it allows | Suggested group |
| --- | --- | --- |
| `corp.view_own_corporation` (core) | See your own corporation's structures, claim refuels, see the plan and get warnings. | Fuel team, logistics |
| `corp.view_alliance_corporations` (core) | The same for every corporation in your alliance. | Alliance logistics |
| `corp.view_all_corporations` (core) | The same for every corporation. | Leadership |
| `structures.manage_structures` | Change the settings, per-structure thresholds and staging labels (for structures they can see), and the Discord pings for fuel warnings. | Directors |

The permission picker lists `structures.manage_structures` under the director tier.

If you pick groups to warn, give those groups a corporation permission too. Warnings only go to people who may see
the corporation.

## Settings

Open **Structures → Settings** (or **Settings** on the board). Press **Save settings** to apply the first three cards.

### Warnings

| Setting | Default | What it does |
| --- | --- | --- |
| **Warn below** | `7d, 3d, 1d` | Fuel thresholds, in days (`7d`) or hours (`12h`), separated by commas. Up to six, each from 1 hour to 90 days. Empty: no warnings. |
| **Send notifications** | On | Off: no notifications under the bell; only the `structures.fuel_low` event goes out for webhooks. |

### Fuel plan and claims

| Setting | Default | What it does |
| --- | --- | --- |
| **Top up to (days)** | 30 | What the fuel plan and each structure's "needs" count towards (1 to 365). Members can change it on the plan page for themselves. |
| **A refuel claim lasts (hours)** | 48 | How long an "I'm on it" claim lasts if the fuel never goes up (1 to 336). |

### Who is warned

Tick groups to limit warnings to their members. Members are still only told about corporations whose structures
they may see. With nothing ticked, everyone who may see the corporation is told.

### Discord pings

This section appears once a Discord webhook exists under **Administration → Integrations**. It lists the alert
**Structure fuel below a threshold**. Each change here saves straight away.

1. Switch the alert on.
2. If the Discord plugin is linked to your server, pick roles to ping.
3. Make sure a Discord webhook gets `structures.fuel_low` and has someone to mention. The section warns you if not.

## Per-structure settings

On the board, press the pencil next to a structure's name. The dialog has:

- **Default** — use the site's thresholds.
- **Its own** — **Warn below** with this structure's own thresholds.
- **Never warn** — no warnings for this structure.
- **Staging (optional)** — a label such as "Home staging". Structures with the same label are grouped together on
  the fuel plan; others are grouped by system.

Press **Save**. Overrides are kept by structure id, so they survive a structure briefly missing from a sync.

## How warnings work

- Each threshold warns once when fuel drops under it, and again only after the structure was refuelled above it.
- A structure first seen already under several thresholds warns once, at the lowest one.
- Thresholds of 24 hours or less are sent at `danger` level; higher ones at `warning`.
- Warnings mention who has claimed the refuel.
- Out-of-fuel structures send no new warnings.

### The core's 72 hour warning

EvE Conduit itself notifies everyone who may see a corporation once when one of its structures drops under 72 hours
(event `corp.structure_fuel_low`, category **Corporation structures (fuel, reinforcement)**). This plugin doesn't change
that. To avoid double messages:

- At a threshold of exactly 72 hours, this plugin sends no notification, but still emits `structures.fuel_low`.
- Other thresholds notify under **Structure fuel warnings** (`p.structures`), which members can mute separately.
- For webhooks, pick `corp.structure_fuel_low` or `structures.fuel_low`, not both. `structures.fuel_low` covers every
  threshold, so it's usually the one to keep.

## Webhook events

Set up webhooks under **Administration → Integrations**.

| Event | When | Main fields |
| --- | --- | --- |
| `structures.fuel_low` | Fuel falls under a threshold. Marked as an alert. | `corporation`, `structure`, `system_id`, `threshold_hours`, `hours_left`, `fuel_expires`, `burn`, `claimed_by` |
| `structures.refuelled` | A structure's fuel went up. | `corporation`, `structure`, `fuel_expires`, `hours_left`, `claimed_by` |
| `structures.refuel_claimed` | A member pressed **I'm on it** (a new claim, not an updated one). | `corporation`, `structure`, `user` |

All events also carry `corporation_id`, `structure_id`, `title`, `summary`, `level` and `link`.

A refuel is the fuel expiry moving at least 6 hours later without the burn falling. Taking a service offline makes
fuel last longer but isn't counted as a refuel.

## Audit log

These are recorded under **Administration → Logs → Audit**:

| Action | Recorded as |
| --- | --- |
| Saving the settings | `structures.settings_saved` (with thresholds, groups and the notify switch) |
| Saving a structure's thresholds or staging | `structures.structure_saved` |

Refuel claims are not audited, but new claims emit `structures.refuel_claimed`.

## Background jobs

| Job | Schedule | What it does |
| --- | --- | --- |
| `conduit_structures.tasks.check_fuel` | Every 15 minutes | Sends fuel warnings, notices refuels, ends claims whose structure was refuelled, and drops claims that ran out or whose structure is gone. |

Fuel left is worked out from the stored fuel expiry, so the check doesn't wait for the next 30-minute sync.

The plugin adds no group rules.

## Fuel burn estimates

Burn is worked out from the online service modules, with structure bonuses applied. Each module counts once even when
ESI lists it as several services. Ansiblex, Pharolux, Tenebrex and Metenox burn a fixed rate while fuelled. Totals are
rounded up. Unknown services show "(?)" and aren't counted. The Metenox's magmatic gas isn't planned. The rates are in
`conduit_structures/burn.py`; check them against the game if a number looks off.

## Troubleshooting

**The board says "No structures yet".**
No Station Manager's or Director's login has synced the corporation's Structures section. Check the corporation sheet.

**A member sees "No corporations to show".**
They have none of the `corp.view_*` permissions.

**A fuel team member gets no warnings.**
They must be in a ticked group and have a corporation permission covering that corporation. Also check
**Send notifications** and that they haven't muted **Structure fuel warnings**.

**Nobody was notified at 72 hours.**
Expected: the core's own warning covers that mark. The `structures.fuel_low` event still goes out.

**Webhooks post the 72 hour warning twice.**
The webhook gets both `corp.structure_fuel_low` and `structures.fuel_low`. Keep one.

**The Discord pings section is missing.**
No Discord webhook exists yet under **Administration → Integrations**.

**A claim never clears after a refuel.**
The refuel happened together with a service going offline, so it wasn't detected. The claim ends after
**A refuel claim lasts (hours)**.
