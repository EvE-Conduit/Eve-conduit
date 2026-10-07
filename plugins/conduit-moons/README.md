# Moon Mining Ledger

Who mined what from your corporations' moon drills each month, what it's worth, and moon tax.

- **Ledger** (permission `moons.view_ledger`): every member's mining for a month, with their alts grouped under
  them and characters nobody has registered listed separately. Breakdowns by moon drill and by ore, a daily chart,
  and a CSV export.
- **Moon tax** (permission `moons.manage_ledger`): set a % of the ore's value and how to pay. Once a month is over,
  close it: the ore prices and tax rate are fixed, each member is told what they owe, and you mark payments as
  they come in. A month can be reopened while nobody has paid.
- **My moon mining**: every member sees their own mining and what they owe, plus a dashboard widget.

The data comes from the corporation sheet's mining section, which needs a director's or accountant's login for
the corporation (moon drill observers). Values use CCP's average market prices.

Give the two permissions to a state or group under Administration → Access.
