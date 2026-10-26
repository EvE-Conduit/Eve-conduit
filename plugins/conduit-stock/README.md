# Doctrine Stock

How many of each ship and item should be for sale at each staging location, what's short, and members claiming
shortages to seed them.

- **Staging locations** (permission `stock.manage_stock`): pick a station or structure the site already knows (someone
  has assets, orders or contracts there) and give it a label, e.g. "Main staging".
- **Targets:** for each location, a ship or item and how many should be for sale, with an optional low mark (alert
  below it; empty means the target) and a note. With the [Doctrines](../conduit-doctrines) plugin switched on, a target
  can be a doctrine fit instead: its hull is counted and the board links to the fit.
- **The board** (every member): each target with what's for sale against what should be, a meter, how many are short,
  the cheapest price seen on the market and on contract, and who's seeding. Members press **I'll seed** and say how
  many; the shortage shows what's still unclaimed ("short 6, 4 claimed"). A claim lasts 7 days (Manage → Claims), and
  ends by itself once the target is met. Members can drop theirs at any time.
- **Alerts:** every hour, targets that fell below their low mark notify everyone with `stock.manage_stock` once, and
  again only after they recovered and fell again. The `stock.shortage` event can go to Discord or Slack under
  Administration → Integrations.
- **Dashboard widget:** how many targets are short, and the worst few.

## What counts as stock

Only what EvE Conduit already syncs, so **other sellers on the market aren't seen**: this counts what your members and
corporations put up.

- **Sell orders** that are open, at the location: members' own market orders (which include orders they placed for
  their corporation) and the corporations' market orders. Each order counts once, for its remaining volume.
- **Item exchange contracts** that are outstanding and not expired, starting at the location, available to the
  public, a corporation or an alliance (personal contracts are meant for someone in particular), from members' own
  contracts. Each contract counts once, for the quantity of the type it sells; items the buyer would have to give are
  left out. A fitted ship on contract counts for its hull, and its contract price is shown as the fitted price.
  Contract items appear once the core has fetched them.

Needs EvE Conduit 0.5.52 or newer, with members' market orders and contracts (and, for corporation orders, the
corporations) syncing. Give `stock.manage_stock` to your logistics team under Administration → Groups.
