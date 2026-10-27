# Corp Finance

What your corporations earned and spent, month by month and by category, read from the wallet journals the
corporation sheet already syncs. No ESI scopes of its own: a corporation shows up once its Wallets section syncs
(with an Accountant's or Director's login).

- **Overview:** income against spending per month (6, 12 or 24 months) for one corporation or all you may see, the
  month's net marked on each column, a table by category, and this month per corporation. Click a month for its
  report, a category for its entries.
- **Categories:** every journal ref type is in a category from one table in code (`conduit_finance/categories.py`):
  Ratting tax, Mission tax, Other tax, Market, Contracts, Industry, Planetary, Structures, Sovereignty, War, Transfers
  and Other. Under Settings, officers can move a ref type to another category (or a new one), and **tag
  counterparties**: money paid to someone, from someone, or both, goes in a category whatever its ref type ("paid to
  SRP Holder = SRP payouts", "from Buyback Corp = Buyback"), for every corporation or just one. A tag beats a ref
  type, a corporation's own tag beats an every-corporation one, and a one-way tag beats a both-ways one.
- **Internal transfers** are kept apart and left out of income and spending: moves between a corporation's own
  divisions, and donations, payments and withdrawals between your corporations (the alliance's, and every
  corporation whose wallets count here). They're shown on their own in the overview, the report and the journal.
- **Balances:** each wallet division's balance at the end of every day (30 days to everything synced), from the
  balance the journal records after each entry; today's is the last sync's. History goes back as far as the journal
  the site has kept.
- **Monthly report:** a printable page for a chosen month: income, spending and net against the month before, every
  category with its change, the top ten payers and payees, and each corporation with its opening and closing balance.
  **Print** leaves only the report on the page.
- **Month closed:** once a month ends and every corporation's wallets have synced past its end (or two days have gone
  by), the members of a group you pick (those with `finance.view_finance`) are notified with the net for the
  corporations they may see, and `finance.month_closed` goes out for webhooks (Administration → Integrations). It
  carries the corporations' figures, so it only goes to webhooks that pick it by name.
- **Journal:** the month's entries with their category, filtered by corporation, category, internal transfers or text,
  and **CSV** export of the categorised journal.
- **Dashboard widget:** this month's net, per corporation.

**Who sees what:** everything needs `finance.view_finance`, and then shows only corporations whose wallets the person
may see on the corporation sheet (a `corp.view_*_corporation(s)` permission for the corporation and
`corp.view_corporation_wallets`). `finance.manage_finance` changes the settings; changing the categories, an
every-corporation tag or the report settings changes everyone's figures, so it needs access to every counted
corporation's wallets (a tag for one corporation needs only that one). Needs EvE Conduit 0.5.52 or newer.

The core corporation sheet's Wallets tab still has the last 30 days, the raw journal and market transactions; this
plugin is the longer view on top.
