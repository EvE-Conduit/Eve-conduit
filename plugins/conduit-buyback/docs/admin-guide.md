# Buyback — Admin guide

Buyback runs buyback programs: members (and, for public programs, anyone) paste items for an instant quote, contract them to the program's owner with the tracking number as the description, and every contract is read from ESI and checked against its quote before a manager accepts it in game. This guide covers requirements, permissions, setting up prices, locations and programs, item terms, day-to-day contract checking, events and background jobs.

## Requirements

| Requirement | Details |
| --- | --- |
| EvE Conduit | 0.5.55 or newer (`min_conduit`). |
| ESI scopes | `esi-contracts.read_character_contracts.v1` and `esi-contracts.read_corporation_contracts.v1`, on the program owner's login. The plugin asks for them. |
| Structure markets (optional) | `esi-markets.structure_markets.v1` on a character that can dock at the structure and use its market. |
| Corp roles | For corporation programs, the owner character must be able to read the corporation's contracts through ESI. To see the wallet division balance, a viewer needs access to the corporation's wallets on the corporation sheet. |
| Price source | ESI (default, no key), Fuzzwork (no key) or Janice (needs an API key). |
| Discord pings (optional) | A Discord webhook under Administration → Integrations. With the Discord plugin linked you can also pick roles. |

## Installing and switching it on

1. Go to **Administration → Plugins**.
2. Open the **Browse** tab and find **Buyback** (category Industry).
3. Install it, then enable it.
4. Give the permissions below to a state (**Administration → States**) or a group (**Administration → Groups**).
5. Have each future program owner log in with the contract scopes.

## Permissions

| Permission codename | What it allows | Suggested group |
| --- | --- | --- |
| `buyback.manage_programs` | Create programs, add locations, and run the programs they are a manager of: edit them, set item terms, see contracts and statistics, press **Check now**, get new-contract notifications. Shows the **Buyback desk** dashboard widget. | Buyback team |
| `buyback.manage_all_programs` | Run every program, change the buyback settings (**Prices**), and switch on Discord pings. | Directors |
| `buyback.view_all_statistics` | See every program's contracts and statistics without running them. | Directors, auditors |
| `buyback.view_leaderboard` | See the top sellers of the programs the member can use (through the API; the web pages show top sellers on the program's statistics page only). | Members, optional |

The permission picker lists `view_leaderboard` in the member tier and the others in the director tier. Using a program needs no permission: it depends on the program's states and groups.

## Setup

Do these in order. All pages are under **Buyback → Run programs**.

### 1. Prices (buyback settings)

Press **Prices** (needs `buyback.manage_all_programs`). The page is titled "Buyback settings". Change values, then press **Save**. **Discord pings** on this page save on their own.

**Prices card**

| Setting | Default | What it does |
| --- | --- | --- |
| **Source** | ESI | **ESI**: straight from CCP. The whole order book of every market in use is read every 30 minutes and quotes use what was read. Can read player structure markets. **Fuzzwork**: free third-party site; prices are fetched when a quote needs them. **Janice**: Jita 4-4 only; needs an API key. |
| **Trade hub** | Jita 4-4 | The site's market. One click for Jita 4-4, Amarr VIII, Dodixie IX-20, Rens VI-8 or Hek VIII-12, or **Other…** for any region, system, station or (ESI only) player structure, by search or **Market id**, with a **Shown as** name. Programs use it unless they pick their own. |
| **Janice API key** | empty | Janice only. Type a new key to replace it, or `-` to remove it. |
| **Read with** | none | ESI with a player structure: one of your characters that can dock there and use its market, with `esi-markets.structure_markets.v1`. |
| **Best order instead of the top 5% average** | Off | Instant prices move faster and are easier to manipulate. |
| **Maximum price age** | 24 hours | Fuzzwork and Janice: older prices are fetched again before a quote uses them, and by the hourly refresh. 1 hour to 14 days. |

Changing the source or the price kind clears all stored prices; changing the hub drops that hub's prices. They are read again as needed. The page shows when each market was last read, and lists **Programs' own markets**.

**Read the market now** (ESI) or **Refresh N prices** (other sources) refreshes prices straight away.

PLEX trades on CCP's global PLEX market, which ESI's regional orders do not include.

**Manipulation guard card**

Every market price, including the minerals refined values use, is compared with what the item traded for lately in the hub's region (ESI market history).

| Setting | Default | What it does |
| --- | --- | --- |
| **Check prices against recent trading** | On | Switches the guard on. |
| **Suspect above** | 20 % | A price this far above the average is suspect. 1 to 1000. |
| **Average over** | 7 days | Days of history the average covers. 2 to 30. |
| **Trusted if it traded on** | 5 days | If the item traded on at least this many of those days, the average is used. If it rarely trades, the lower of the two is used and the item goes to manual review. |
| **Also prices far below the average** | Off | Also treat prices far below the average as suspect. Off by default: buy prices normally sit below the average, and a low price only costs the seller. |

If the market's region is not known, the page says prices are not checked.

What the guard cannot vouch for goes to manual review (the quote is flagged and its contract says **Has items to check by hand**):

- an item that did not trade at all in those days, or whose history is not loaded yet (a quote fetches up to 60 histories while it waits, the rest in the background). Its price stands, with an **unchecked price** badge;
- **blueprints**, always: an original and a copy share one name and one market price, so a paste cannot tell them apart. A contract that holds a blueprint copy gets the severe problem **blueprint copy**.

Two more things keep one order from setting a price. The top-5 % average never rests on a single order: as much volume again is taken from the orders behind it. And a **Split** price with nobody buying is half the sell price, not the sell price itself.

**Quotes and tracking card**

| Setting | Default | What it does |
| --- | --- | --- |
| **Tracking prefix** | `bb-` | Starts every tracking number. Letters, digits, `-`, `_` or `.`. Programs can have their own. |
| **Remove quotes nobody contracted after** | 48 hours | Quotes with no contract are deleted after this long, but never while a contract for them may still arrive: a program's quotes are kept at least for the days they are good for (90 when the program sets no limit) plus the days its contracts stay up. 0 keeps them. Up to 90 days. |
| **All or nothing** | Off | A paste with any item a program does not buy gets no quote at all. |
| **Private quotes** | On | Only the seller and the program's managers (and holders of `buyback.view_all_statistics`) can open a quote. Off: any member who may use the program and has the tracking number. |

### 2. Locations

Press **Locations**, then **Add location**.

1. Optional: **Find a known station or structure**. It fills in everything below. Only places the site has seen (in assets, contracts or corporations) are found.
2. **Name**: ideally the in-game name, so sellers find it.
3. **Solar system**: required.
4. **Station or structure id**: optional. With it, contracts made anywhere else are flagged. In game, link the structure in chat, right-click the link and copy it: the number after the slash, for example `showinfo:35826//1037962518481`.
5. Press **Save**.

A location used by a program cannot be deleted. A manager who does not run every program cannot edit a location that programs they do not run use.

### 3. Create a program

Press **New program**. The form has four tabs. Press **Create program** (or **Save** when editing).

**Basics**

| Setting | Default | What it does |
| --- | --- | --- |
| **Name** | | Required. |
| **Description** | empty | Shown to sellers: what you buy, how fast you accept, who to ask. |
| **Contracts go to** | | One of your own characters. Its login reads the contracts, so it must stay logged in. |
| **To the character's corporation** | On | Sellers make contracts out to the corporation rather than the character. |
| **Open** | On | Closed programs give no quotes; only managers see them. |
| **Tell managers about new contracts** | On | Managers get a notification for each new contract. |
| **Contracts expire after** | 14 days | Shown to sellers in the contract steps. 1 to 90. |
| **Quotes are good for** | 7 days | Contracts made later than this after the quote are flagged. 0: no limit. Up to 90. |
| **Wallet division** | None | Corporation wallet division (1 to 7) whose balance shows on the program's page, for viewers who may see the corporation's wallets. |
| **Tracking prefix** | empty (site's) | Starts this program's tracking numbers. |
| **Locations** | | At least one. **Add a location** opens the location form. |

**Pricing**

| Setting | Default | What it does |
| --- | --- | --- |
| **Price at the site's market** | On | Off: pick **This program's market** (same choices as the trade hub). A structure market is read with the login of the character contracts go to. Not available with Janice. |
| **Price** | Buy | Buy, Split or Sell price at the market, before tax. |
| **Tax** | 10 % | Taken off every item. Item terms can add to it or take away. |
| **Hauling cost** | 0 ISK/m³ | Taken off per m³. Use it or price density, not both. |
| **Price density threshold** | 0 (off) | Items worth less than this per m³ (T1 ships, bulky junk) pay the extra tax. |
| **Price density tax** | 0 % | The extra tax for those items. |
| **Use compressed volume** | Off | Ore and ice count with their compressed volume for hauling and price density. |
| **Buy every item** | On | Off: only items you add on the Items page are bought. |
| **Take assembled items** | Off | Off: ships and modules must be repackaged. |

**Ore & special items**

| Setting | Default | What it does |
| --- | --- | --- |
| **Raw price** | On | Value ore, moon ore and ice at the raw price. |
| **Compressed price** | On | Value at the compressed price. |
| **Refined value** | On | Value at what reprocessing gives, at the refining rate. |
| **Refining rate** | 80 % | Used for refined value. |
| **Tech I modules at reprocessed value** | Off | Named and Tech I modules are worth what they reprocess into. |
| **Tech I reprocessing rate** | 55 % | Used for that. |
| **Sleeper loot at NPC price** | Off | Blue loot at the NPC buy order price. |
| **Triglavian loot at NPC price** | Off | Red loot at the NPC buy order price. |

Ore is valued at the best of the ticked ways.

**Who can use it**

| Setting | Default | What it does |
| --- | --- | --- |
| **States** | none | Members in these states may use it. |
| **Groups** | none | Members in these groups may use it. None ticked in states or groups: every member. |
| **Managers** | you | People with `buyback.manage_programs` who run it. Whoever saves the program is always added. |
| **Public** | Off | Anyone with the link can get a quote without an account; states and groups do not apply. The public link is shown once the program is saved: `/public/p/buyback/<id>`. Public visitors are limited to 30 quotes per 10 minutes. |

**Delete** (when editing) removes the program with its quotes, item terms and contract history. Contracts in the game are not touched.

### 4. Item terms and manual review

Open the program and press **Items**. The left side is the market laid out as in game, to browse or search. The right side lists this program's **Categories**, **Items** and **Manual review** entries.

1. Click an item, or a category's **Set terms**.
2. For an item, choose **Just <item>** or **Entire <category> category**, at any level.
3. Pick **Terms**: **Buy** with an **Extra tax** (negative for less), **Fixed price** (items only; ISK per unit, no tax or hauling taken off) or **Don't buy**.
4. Optional: **Check by hand** puts it on the manual review list. Quotes and contracts with it are flagged.
5. Press **Add item**, **Add category** or **Save**. **Remove its terms** goes back to the wider terms.

The closest terms win: an item's own terms beat its category's, and a category's beat any category above it. A category at +0% keeps its items at the program's tax even if a wider category adds more. A category's terms cover items added to the game later. **Remove all terms** clears every item and category term; the manual review list stays.

## Day-to-day operation

- **Run programs** lists each program with **Open**, **Problems** and **30 days** figures, and badges for **Closed**, **Public** and **Owner login** (the owner's login cannot read contracts).
- Open a program for **Open contracts**, **Need a look**, **Bought, 30 days**, the wallet division balance (or **Bought, all time**), the contract list (**Open**, **Problems**, **Accepted**, **Other**, **All**), **Bought per month**, **Top sellers, 90 days** and **Most bought, 90 days**.
- Click a contract to see its problems and a comparison of quoted items with the contract's items. Then accept or reject it in game. A blueprint copy in the contract is marked **blueprint copy** (contracts read before version 1.2.5 do not have that information); assembled items a program does not buy are pointed out too.
- **Check now** reads the owner's contracts straight away (at most once a minute).
- **Calculator** opens the seller view.

Contract checks, worst first: no quote behind the tracking number (possible imitation), tracking number used twice, made out to the wrong character or corporation, asks more ISK than the quote, asks for items in return, quoted items missing or short, made at a location the program does not use, made after the quote expired, items to check by hand; and as notes: asks less ISK, extra items, extra text in the title. Contracts are matched when they are item exchanges to the owner (or its corporation) and carry a tracking number or the program's prefix. Saving a program checks its open contracts again.

## Notifications, webhook events and Discord pings

| Event | Webhook event | In-site notification |
| --- | --- | --- |
| A new contract arrives | `buyback.contract_created` ("Buyback contract made"), with a warning level when a severe problem was found | The program's managers, if **Tell managers about new contracts** is on (category **Buyback**) |
| A contract is accepted, rejected, deleted, expired, failed or reversed | `buyback.contract_finished` ("Buyback contract settled") | The seller, when accepted or rejected |

Send events to Discord or Slack under **Administration → Integrations**. To ping on Discord for new contracts, switch on **Buyback contract made** under **Discord pings** on the Prices page.

## Audit log

Recorded in **Administration → Logs → Audit**: `buyback.program` (program created, changed or deleted), `buyback.items` (item and category terms set or cleared) and `buyback.settings` (settings changed). Locations and manual review entries are not audited separately.

## Background jobs

| Job | Schedule | What it does |
| --- | --- | --- |
| `conduit_buyback.tasks.sync_all_contracts` | Every 15 minutes | Reads the contracts of every active program's owner whose login works, and checks them. |
| `conduit_buyback.tasks.pull_market` | Every 30 minutes | ESI source: reads the whole order book of every market in use. |
| `conduit_buyback.tasks.update_prices` | Hourly | Refreshes stored prices older than the maximum price age. |
| `conduit_buyback.tasks.refresh_history` | Hourly | Refreshes market history for the manipulation guard (skipped when the guard is off). |
| `conduit_buyback.tasks.cleanup` | Every 6 hours | Removes quotes nobody contracted after the set time, and prices of markets nothing uses. |

## Troubleshooting

**A program shows "Owner login", or "<name>'s login can't read contracts".**
The owner must log in again with the contract scopes, or pick another owner.

**"Pick one of your own characters" when saving a program.**
Only the person who owns a character can make it the owner.

**"Only ESI can read a player structure's market" / "Reading a structure's market needs a character that can dock there".**
Switch the source to ESI and pick a **Read with** character.

**"Janice needs an API key".**
Enter the key, or pick another source.

**"Contracts were checked less than a minute ago".**
Wait a minute before pressing **Check now** again.

**A contract shows "No quote has this tracking number".**
It carries the program's prefix but no matching quote. It may imitate a buyback contract: compare the items by hand or reject it.

**"Programs still use this location".**
Remove the location from every program first.
