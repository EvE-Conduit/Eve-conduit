# Doctrine Stock — Admin guide

Doctrine Stock lets your logistics team set how many of each ship, item or doctrine fit should be for sale at each staging location. It counts what members and corporations have up for sale, shows shortages on a board every member can see, lets members claim shortages to seed, and alerts the logistics team when something drops below its low mark. This guide covers installing, permissions, setup and day-to-day running.

## Requirements

| Requirement | Details |
| --- | --- |
| EvE Conduit | 0.5.55 or newer (`min_conduit`). |
| ESI scopes | None of its own. It reads the market orders and contracts the core already syncs. |
| Synced data | Members' market orders and contracts must be syncing. For corporation sell orders, the corporations must be syncing too. |
| Other plugins | Optional: [Doctrines](../../conduit-doctrines). With it switched on, a target can be a doctrine fit. |
| Discord pings | Optional: a Discord webhook under Administration → Integrations. With the Discord plugin linked you can also pick roles to ping. |

## Installing and switching it on

1. Go to **Administration → Plugins**.
2. Open the **Browse** tab and find **Doctrine Stock** (category Industry).
3. Install it, then enable it.
4. Give `stock.manage_stock` to your logistics team under **Administration → Groups**.

Once enabled, every member sees **Doctrine Stock** in the navigation. People with `stock.manage_stock` also see **Manage**.

## Permissions

| Permission codename | What it allows | Suggested group |
| --- | --- | --- |
| `stock.manage_stock` | Add, edit and remove staging locations and targets; set how long claims last; switch on Discord pings; receive shortage notifications. | Logistics team, directors |

The board and claiming need no permission: every member can use them. In the permission picker this permission is listed in the director tier.

## Setup

### Add a staging location

1. Open **Doctrine Stock → Manage** (or press **Manage** on the board).
2. Press **Add location**.
3. Under **Station or structure**, type at least 3 letters and pick the station or structure. Only places the site already knows are listed: someone has assets, orders or contracts there.
4. Optional: set a **Label** (for example "Main staging"). Members see the label first, then the station name.
5. Optional: set **Order**. Lower comes first.
6. Press **Save**.

A station or structure can only be added once. To change the label or order later, press the pencil icon on the location card.

### Add a target

1. On the location card, press **Target**.
2. If the Doctrines plugin is on, choose **Ship or item** or **Doctrine fit**.
3. Search and pick the ship, item or fit. A doctrine fit counts its hull, on the market or on contract (usually fitted).
4. Fill in the fields below and press **Save**.

| Field | Default | What it does |
| --- | --- | --- |
| **Should be for sale** | 10 | How many should be for sale at this location. 1 to 1,000,000. |
| **Low below** | empty | Alert when fewer than this many are for sale. Empty means the target itself. Must be between 0 and the target. |
| **Note** | empty | Optional, up to 200 characters, shown to members on the board. |

A location can only have one target per ship or item (or per fit). Press the pencil icon on a target to edit it, or the bin icon to remove it.

### Claims

The **Claims** card on the Manage page sets **Days a claim lasts**.

| Setting | Default | What it does |
| --- | --- | --- |
| **Days a claim lasts** | 7 | How long a member's "I'll seed N" claim lasts before it is dropped. 1 to 90. A claim also ends once its target is met. |

Change the number and press **Save**. New and updated claims use the new length; existing claims keep their expiry.

### Discord pings

The **Discord pings** section on the Manage page appears once a Discord webhook exists under **Administration → Integrations**. Switch on **Stock running low** to have shortage alerts ping on Discord.

- Each webhook that gets the alert mentions its own @here, @everyone or role, set under Administration → Integrations.
- With the Discord plugin linked, you can also pick roles to ping here.
- If no webhook gets the alert yet, or no one would be mentioned, the section shows a warning.

## How stock is counted

- **Sell orders**: open sell orders at the location with volume left, from members' character market orders (these include orders placed for their corporation) and the corporations' market orders. Each order counts once, for its remaining volume.
- **Item exchange contracts**: outstanding, not expired, starting at the location, availability public, corporation or alliance, from members' own contracts. Each contract counts once, for the quantity of the type it sells. Items the buyer would have to give are left out. A fitted ship counts for its hull, and its contract price is shown as the fitted price.
- Other sellers on the market are not seen.

Statuses: **Stocked** when the count reaches the target, **Low** when it is below the low mark, otherwise **Short**.

## Day-to-day operation

- Check the board or the dashboard widget for shortages.
- Adjust targets as doctrines change.
- Expired claims are removed automatically, as are claims on targets that are now fully stocked.
- Removing a location removes its targets and claims. Removing a target removes its claims.

## Alerts, notifications and webhook events

Every hour, each target that has fallen below its low mark triggers one alert. It does not alert again until the target has recovered to its low mark and then fallen below it again.

| Where | What is sent |
| --- | --- |
| In-site notification | To everyone with `stock.manage_stock`: "<item> is running low at <location>", with how many are for sale and how many are wanted. Category **Doctrine stock**. Links to the board. |
| Webhook event `stock.shortage` | "Stock running low": sent to Discord or Slack webhooks that subscribe to it under **Administration → Integrations**. Includes the location, item, how many are for sale and how many are wanted. |
| Discord ping | Only if switched on under **Discord pings** on the Manage page. |

## Background jobs

| Job | Schedule | What it does |
| --- | --- | --- |
| `conduit_stock.tasks.check_stock` | Every hour | Drops expired claims, drops claims on targets that are fully stocked, clears the alert flag on targets back at or above their low mark, and sends alerts for targets that went low. |

## Audit log

These actions are recorded in **Administration → Logs → Audit**:

| Action | When |
| --- | --- |
| `stock.place_saved` | A staging location is added or edited. |
| `stock.place_deleted` | A staging location is removed. |
| `stock.target_saved` | A target is added or edited. |
| `stock.target_deleted` | A target is removed. |
| `stock.settings_saved` | The claim length is changed. |

Member claims are not audited.

## Troubleshooting

**The station I want is not in the location search.**
Only stations and structures the site already knows by name are listed (from assets, orders, contracts or corporations). Type at least 3 letters. If it is a new structure, wait until someone's assets, orders or contracts there have synced.

**Doctrine fit is not offered when adding a target.**
The Doctrines plugin must be enabled. Saving a fit target without it fails with "Doctrine fits need the Doctrines plugin".

**The board shows fewer items than are really for sale.**
Only members' and corporations' orders and members' contracts are counted. Check that the sellers' characters and corporations are syncing, and that contracts are item exchanges open to the public, corporation or alliance, not personal.

**No alert came when something went low.**
The check runs hourly and alerts once per drop. If the target was already flagged as low, it will not alert again until it recovers. Also check the low mark: empty means the target itself.

**The Discord pings section does not show.**
Add a Discord webhook under **Administration → Integrations** first.
