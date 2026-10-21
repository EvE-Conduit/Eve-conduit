# Corp Tax

The tax your corporations took from each member's bounties, ESS payouts and missions, an extra tax billed on it every
month, payments picked up from the corporation wallet, and reminders.

- **Ledger** (permission `tax.view_ledger`): what the corporations took from every member in a month, with their alts
  grouped under them and characters nobody has registered listed separately. Each member's earnings are estimated
  from the corporation's tax rate. A daily chart, a breakdown by kind, and a CSV export.
- **Extra tax** (permission `tax.manage_ledger`): members owe a % of what the corporation took from them (100 % means
  the same again), with a smallest bill, the kinds that count (bounties, ESS payouts, mission rewards and time
  bonuses) and how to pay. Once a month is over, close it: the rate is fixed, each member is told what they owe, and
  payments are marked as they come in. A month can be reopened while nobody has paid.
- **Payments from the wallet:** a donation from one of a member's characters to a tax corporation whose reason
  contains the payment word (`TAX` by default; each bill shows e.g. `TAX 2026-09`) settles their bills, oldest first,
  once it covers one in full. What's left over counts towards the next bill. The wallets are checked once a day, or
  straight away with **Check payments**. Bills can also be marked paid by hand.
- **Reminders:** members with unpaid bills get a notification every 7 days (configurable; 0 switches it off).
- **Group rule** "Corp tax paid": no bill unpaid for longer than N days. Use it as a group requirement or in a smart
  group.
- **My tax**: every member sees their own tax and bills, plus a dashboard widget.

**Which corporations:** the ledger follows the corporation sheet's permissions, including the wallet permission
(`corp.view_corporation_wallets`), since it shows what members earned. Closing or reopening a month and changing the
settings cover every corporation at once, so they need access to all corporations with tax in it.

The data comes from the corporation sheet's Wallets section, which needs a director's or accountant's login for the
corporation. Earnings are estimated with the corporation's current tax rate, so they're off for months when the rate
was different; what the corporation took is always exact.

Marking a bill that a wallet payment settled as unpaid doesn't give that payment back to the member.

Give the two permissions to a state (Administration → States) or a group (Administration → Groups).
