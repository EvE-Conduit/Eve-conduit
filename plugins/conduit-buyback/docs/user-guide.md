# Buyback — User guide

Buyback lets you sell loot, ore and other items to your corporation or alliance. You paste your items, get an instant quote with a tracking number, and make an item exchange contract in game following the steps on the quote. Every contract is checked against its quote, and you are told when it is accepted or rejected. This guide is for sellers: members using the programs open to them, and anyone using a public program without an account.

## Where to find it

- **Buyback** in the main navigation opens "Sell your loot and ore": a card for each program you may use, with its tax, locations and how it prices.
- **My quotes** (top right) lists every quote you made and what happened to its contract.
- The dashboard **Buyback** widget shows how many of your buyback contracts are waiting and how much ISK is still to come. Press **Get a quote** on it to open Buyback.
- Public programs, if your organisation has any, are at `/public/p/buyback/` and need no account.

Which programs you see depends on your state and groups. If you see "No buyback programs for you yet", leadership has not opened one you can use.

## What a program card tells you

- **Tax**: the percentage taken off every item, shown large on the card.
- Locations where the contract must be made.
- How it prices, for example "Jita 4-4 buy price, less 10%", "Buys any item" or "Only listed items", "Ore & ice: best of raw, compressed, refined at 80%", "Hauling .../m³", "Tech I modules at ...% reprocessed", "Sleeper and Triglavian loot at NPC price", "Takes assembled items" or "Packaged items only".
- **Closed** or **Public** badges.

## Getting a quote

1. Open **Buyback** and click a program.
2. Copy your items in game and paste them under **Items to sell**. These work:
   - the inventory, in list or detail view (select the items, Ctrl+C);
   - contracts;
   - the mining ledger;
   - typed lines such as `Tritanium x 1000`, `1000 x Tritanium`, `1000 Tritanium` or `Tritanium 1000`.
3. Press **Get a quote**.

The result lists each item with:

| Column | What it shows |
| --- | --- |
| Item | Name and group. "Checked by hand before it's accepted" means a manager checks this item by hand. |
| Quantity | How many. |
| Valued as | How it was valued: Market, Raw ore, Compressed, Refined, Reprocessed, NPC buy or Fixed price, and the tax taken off. For items not bought, the reason. |
| Per unit | The price per unit. Hover it to see the market price, tax, hauling cost and the other ways it could have been valued. |
| Value | What the program pays for that line. |

Badges you may see:

- **low ISK/m³**: the item is worth little for its volume, so an extra tax applies.
- **recent average**: the market price looked propped up compared with recent trading, so the recent average was used instead.
- **unusual price**: the price looked off and the item rarely trades, so the lower price was used and a manager checks it by hand.
- **averaged**: some of the minerals the ore refines into were priced far above their average, so their average was used.

Reasons an item is not bought include "Not bought by this program", "Not on this program's list", "Assembled: repackage it first", "No market price" and "Costs more to haul than it's worth". Lines that were not recognised are listed under **Not recognised**.

If some items are not bought, leave them out of the contract. If the site uses "all or nothing" quotes, a paste with any item the program does not buy gets no quote at all; remove those items and quote again.

## Making the contract

When the quote is ready, the right side shows **You get** (the total) and five steps. Each value has a copy button.

1. **Item exchange contract, private, to**: the character or corporation to make it out to.
2. **Made at** (or **Made at one of**): the station or structure.
3. **I will receive**: the exact ISK amount.
4. **Description (exactly this, nothing else)**: the tracking number. Put only the tracking number in the contract description.
5. **Expiration**: how many days the contract should run. If shown, make the contract within the stated number of days of the quote; after that, quote again.

Then in game:

1. Create an item exchange contract, private, to the assignee shown.
2. Add exactly the items on the quote, from the location shown.
3. Set the price you receive to the amount shown. Do not ask for items in return.
4. Paste the tracking number as the description, with nothing else.
5. Set the expiration and create the contract.

Press **Follow it here** under the steps to open the quote page later.

## Following your quotes

Open **My quotes**. Each quote shows its tracking number, program, number of items, age, value and status:

| Status | Meaning |
| --- | --- |
| No contract yet | No contract with this tracking number has been seen yet. Contracts are checked every 15 minutes. |
| Waiting / In progress | The contract is there and waiting for a manager. |
| Accepted | The contract was accepted and you were paid. |
| Rejected, Deleted, Expired, Failed, Reversed | The contract did not go through. |

Next to the status, **Matches its quote** means the checks found nothing; otherwise a badge shows the number of problems or notes. Hover it to read them.

Click a quote to see the full quote and, once a contract is found, a comparison of the quoted items with what is in the contract, and any problems found.

At the top of the Buyback page you also see **Waiting to be accepted**, **Sold so far** and **Quotes**.

## What the checks look for

Managers see these on every contract, and you see them on your quote. Avoid them to get paid quickly:

- missing or short items, or extra items that were not quoted;
- asking for items in return;
- a price higher (or lower) than the quote;
- made at a location the program does not use;
- made out to the wrong character or corporation;
- extra text in the description besides the tracking number;
- the tracking number used on more than one contract;
- made too long after the quote (the program sets how long quotes are good for);
- items on the manual review list, or priced far off their recent average.

## Public programs

A public program works without an account.

1. Open `/public/p/buyback/` and pick a program, or use the direct link `/public/p/buyback/<id>` you were given.
2. Paste your items and press **Get a quote**.
3. Follow the contract steps as above.
4. Keep the quote page's address. It shows the contract's state once it is found.

Public quotes belong to nobody, even if you are signed in, so they do not show under **My quotes**. Each visitor can make up to 30 public quotes per 10 minutes, of up to 200 lines each; all visitors together share a limit as well. A public quote uses the prices the site already has: an item it has no price for yet shows **No market price** (try again a few minutes later), and an item whose price could not be checked against recent trading is marked for a manager to check by hand.

## Notifications

Signed-in sellers get a notification (category **Buyback**) when:

- their contract is accepted, with the ISK paid;
- their contract is rejected ("Ask the buyback managers why").

## FAQ and troubleshooting

**My quote disappeared.**
Quotes nobody made a contract for are removed after a while, but not while they are still good: you have the days the contract steps give you. After that, get a new quote.

**My item says "Checked by hand before it's accepted".**
A manager looks at the contract before accepting it. That happens for items on the program's review list, for blueprints (always: sell originals only, a copy is refused), and for items whose market price could not be checked against recent trading (**unchecked price**).

**"That's more than 200 lines; quote them in parts" on a public program.**
Public quotes take up to 200 lines. Split the paste, or sign in.

**"This program is closed".**
It gives no quotes at the moment.

**"This program has no owner to contract to yet".**
The program is not set up yet. Ask the buyback managers.

**"Too many quotes; wait a few minutes" on a public program.**
You hit the limit of 30 quotes per 10 minutes. "The calculator is busy" means all visitors together hit theirs; try again in a few minutes.

**My contract still shows "No contract yet".**
Contracts are read every 15 minutes. Check that the description is exactly the tracking number and the contract is made out to the right assignee.

**Someone else cannot open my quote link.**
By default only you and the program's managers can open a quote.
