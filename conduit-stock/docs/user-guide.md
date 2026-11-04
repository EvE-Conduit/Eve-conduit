# Doctrine Stock — User guide

Doctrine Stock shows how many of each ship and item should be for sale at each staging location, how many actually are, and what is short. If you plan to put something up for sale, you can claim it on the board so other members do not seed the same thing. Every member can see the board.

## Where to find it

- Open **Doctrine Stock** in the main navigation. The page lists each staging location as a card.
- The dashboard can also show a **Doctrine Stock** widget with how many targets are short and the worst few. Click the widget to open the board.

## Reading the board

Each staging location card shows its name (the label your logistics team gave it, then the station name and solar system) and a badge:

- **All stocked**: every target at this location is met.
- **N short**: N targets are below what should be for sale.

Each row on the card is one target, a ship, an item or a doctrine fit:

| Part of the row | What it means |
| --- | --- |
| Name | The ship or item. For a doctrine fit, the fit name, with a link to the fit under it. |
| Status badge | **Stocked** (target met), **Short** (below target but above the low mark) or **Low** (below the low mark). |
| `have / want` | How many are for sale against how many should be. Hover it to see how many are on the market, how many on contract, and the low mark. |
| Meter | The same figure as a bar: green when stocked, amber when short, red when low. |
| `short N, M claimed` | How many are missing, and how many other members have already said they will seed. Shows **stocked** when the target is met. |
| Prices | The cheapest price seen: `market from ...` for sell orders, `contract from ...` for contracts (`fitted from ...` for a doctrine fit). **none for sale** if there is nothing. |
| Note | Any note the logistics team added. |
| Portraits | Members who are seeding this item. Hover a portrait to see how many they are seeding and until when. |

The board refreshes every 5 minutes while it is open.

## What counts as "for sale"

The board only counts what EvE Conduit already syncs from members and corporations. Other sellers on the market are not seen.

- **Sell orders**: open sell orders at the location, from members' own market orders and the corporations' market orders. Each order counts for its remaining volume.
- **Item exchange contracts**: outstanding, not expired contracts that start at the location and are available to the public, a corporation or an alliance. Personal contracts (made out to one person) do not count. A fitted ship on contract counts for its hull.

Your own orders and contracts are only counted once EvE Conduit has synced them, so a new order or contract can take a while to show.

## Seeding something

1. Find a row that is short and has unclaimed items left. It shows an **I'll seed** button.
2. Press **I'll seed**.
3. In the dialog, enter **How many** you will put up for sale. The hint shows how many are still unclaimed.
4. Press **Claim**. Your portrait appears on the row, and the button changes to **Seeding N**.
5. Put the items up for sale at that location, as sell orders or as an item exchange contract open to the public, corporation or alliance.

Your claim lasts a set number of days (7 unless your officers changed it; the dialog says how long). It ends by itself once the target is met.

### Changing or dropping a claim

- To change the number, press **Seeding N** on the row, enter the new number and press **Claim**.
- To drop your claim, press the **X** next to **Seeding N** (labelled "Stop seeding").

## Notifications

Members do not get notifications from Doctrine Stock. Shortage alerts go only to the logistics team (people with the `stock.manage_stock` permission), and to any Discord or Slack channel your officers set up.

## FAQ and troubleshooting

**There is no I'll seed button on a row.**
The button only shows while some of the shortage is still unclaimed. If the target is met, or other members have claimed the whole shortage, there is nothing left to claim.

**I put items up for sale but the board did not change.**
The board counts orders and contracts after EvE Conduit syncs them. Check that the order or contract is at the right station or structure, and that a contract is an item exchange open to the public, corporation or alliance. Personal contracts are not counted.

**My claim disappeared.**
Claims end by themselves after the set number of days, or once the target is met. Claims also go away if an officer removes the target or the location.

**The page says "No staging locations yet".**
The logistics team has not set any up yet.

**Why is a market item not counted when I can see it in game?**
Only orders and contracts from members and their corporations are counted. Sell orders from outside sellers are not visible to EvE Conduit.
