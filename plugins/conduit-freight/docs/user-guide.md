# Freight — User guide

Freight lets you ship cargo with your corporation's or alliance's hauling services. You pick a route, enter the
volume and the collateral, and the calculator gives you the reward and every value you need for the courier contract
in game. After you make the contract, the site reads it, checks it against the route, and shows it under
**My contracts**.

## Where to find it

- Open **Freight** in the sidebar. The page is called **Ship it with us**.
- If only one service is open to you, its calculator opens straight away. If there are several, pick a service card.
- **My contracts** (button at the top right) lists the courier contracts your characters made to the services.
- A service can also be public. Its calculator is then at `/public/p/freight/<id>` and works without an account.

You only see the services that are open to you. A service may be open to every member, or only to some states or
groups.

## Get a price and make the contract

1. Open **Freight** and pick a service (skip this if the calculator is already showing).
2. In **Route**, pick where the cargo goes. `⇄` means the route runs both ways at the same rates; `→` means one way
   only. The route's rates are listed under the picker (for example "base", "/m³", "/jump", "of collateral",
   "at least", "up to").
3. Enter **Volume (m³)**. You can type `12,500`, `12.5k` and so on.
4. Enter **Collateral (ISK)**: what the cargo is worth. The hauler pays it if they lose the cargo. Short forms work:
   `1.5b`, `250m`, `12k`.
5. Click **Get a price**.
6. The right side shows the **Reward** and the contract to make, step by step:
   1. **Courier contract, private, to**: the corporation or character to make it out to.
   2. **Pick up at**: where the cargo starts.
   3. **Ship to**: where it goes.
   4. **Reward**: the exact ISK amount.
   5. **Collateral**: the exact ISK amount.
   6. **Expiration · Days to complete**: the values to pick in game.
7. Use the **Copy** buttons to copy the name, destination, reward and collateral into the contract window in game.
8. In game, create a private courier contract with exactly these values.

If your cargo is over the route's maximum volume or collateral, a red note appears above the steps, for example
"This route takes up to 300,000 m³." Split the cargo, or ask the haulers first.

The price is never stored. Nothing happens on the site until you make the contract in game.

## How the reward is worked out

Reward = base price + ISK per m³ x volume + ISK per jump x jumps + a percentage of the collateral. It is rounded up to
whole ISK and is never less than the route's minimum reward.

## Follow your contracts

Open **Freight** → **My contracts**. Contracts are read from the game every 15 minutes, so a new contract can take
up to about 15 minutes to show.

| Column | What it shows |
| --- | --- |
| Route | The route it matched, the service and when you made it. |
| Volume, Collateral | What you put in the contract. |
| Reward | What you offered. If it differs from the route's price, "asks ..." shows the route's price. |
| Status | Waiting, In transit, Delivered, Rejected, Deleted, Expired, Failed or Reversed, with the hauler's name once taken. |
| Checks | For open contracts: **Matches its route**, or a badge with the number of problems or notes. Hover it to read them. |

## What the checks mean

Problems (red) usually mean the haulers will not take the contract as it is:

- Made out to the wrong character or corporation.
- Goes between places none of the service's routes cover.
- Pays less than the route asks.
- Volume or collateral over the route's limit.
- Past its delivery deadline (the hauler may fail it and lose the collateral).

Notes (yellow) are for information:

- Pays more than the route asks.
- Gives fewer days to deliver than the service asks for.
- Expired before anyone accepted it.

## Notifications

Members do not get notifications from Freight about their own contracts. Check **My contracts** for the status.

## FAQ and troubleshooting

**I don't see Freight, or I see "No freight services yet".**
No service is open to your state or groups yet, or none exist. Ask an officer.

**My contract isn't in My contracts.**
Wait up to 15 minutes. Only courier contracts made to a service's character or corporation are read. The contract
must come from one of the characters on your account.

**My contract says "Goes between places none of the service's routes cover."**
The pick-up or delivery place is not on any route of that service. Use the places the calculator shows. If the route
names a station or structure, the contract must use that exact station or structure.

**My contract says it pays less than the route asks.**
Use the reward from **Get a price** and copy it with the **Copy** button. The check allows a difference of 1 ISK.

**The calculator says "This service has no routes yet."**
The service has no routes switched on. Ask the people who run it.

**The calculator says "This service has no one to contract to yet".**
The service has no character set to receive contracts. Ask the people who run it.

**A service I used before is gone.**
Closed services are hidden from members. Contracts you made to it still show under **My contracts**.
