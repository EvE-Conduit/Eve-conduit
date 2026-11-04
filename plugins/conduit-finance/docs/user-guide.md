# Corp Finance — User guide

**Regular members do not see this plugin.** It is for the officers and accountants who hold `finance.view_finance`.
Corp Finance shows what your corporations earned and spent, month by month and by category, from the wallet journals
the corporation sheet already syncs. It also shows wallet balance history, a printable monthly report and the
categorised journal.

## What you can see

You see only corporations whose wallets you may open on the corporation sheet. If you can see none, the pages say
"No corporation wallets to show". Every page has a corporation picker ("All corporations" or one corporation).

All dates are EVE time (UTC).

## Where to find it

The sidebar has these entries (all need `finance.view_finance`; **Settings** needs `finance.manage_finance`):

- **Corp finance**: the overview.
- **Monthly report**
- **Balances**
- **Journal**
- **Settings**: see the admin guide.

The **Corp finance** dashboard widget shows this month's net, per corporation.

## Overview

1. Open **Corp finance**.
2. Pick a corporation, or leave all of them.
3. Pick the range under **Months**: `6 mo`, `12 mo` or `24 mo`.

The page shows:

- **Income and spending**: one column per month, with the month's net marked. Internal transfers are left out. Click
  a month to open its monthly report.
- **By category**: income and spending per category. Click a category to see its entries in the journal.
- **This month**: this month so far, per corporation.
- **Internal transfers**: money moved around, not counted as income or spending. A link opens them in the journal.

## Categories

Every journal entry falls into one category: Ratting tax, Mission tax, Other tax, Market, Contracts, Industry,
Planetary, Structures, Sovereignty, War, Transfers or Other. Officers can move entry types to other categories, add new
categories, and tag counterparties (for example "paid to SRP Holder = SRP payouts").

**Internal transfers** are kept apart: moves between a corporation's own wallet divisions, and donations, payments and
withdrawals between your corporations (the alliance's, and every corporation whose wallets count here).

## Monthly report

1. Open **Monthly report** (or click a month on the overview).
2. Pick the month and the corporation.
3. Read the report:
   - **Income**, **Spending** and **Net**, compared with the month before. **Internal transfers** are shown apart.
   - **Categories**: every category with its change.
   - **Top income from** and **Top spending to**: the top ten payers and payees.
   - **Corporations**: each corporation's income, spending, internal in/out, and **Opening** and **Closing** wallet
     balance.
4. Click **Print** to print the report. Only the report is printed, not the site's sidebar or top bar.
5. Click **CSV** to download that month's categorised journal.

## Balances

1. Open **Balances**.
2. Pick a corporation and a **Range**: `30 d`, `90 d`, `6 mo`, `1 y` or `All`.

You see each wallet division's balance at the end of every day, and **All divisions** added up. Balances come from the
running balance the journal records after each entry. Today's comes from the last wallet sync. **History from** shows
the oldest journal entry kept; history cannot go back further than that.

## Journal

1. Open **Journal**.
2. Pick the month and the corporation.
3. Filter by **Category** ("Every category" or one), by **Internal transfers** ("Everything", "Without internal
   transfers", "Only internal transfers"), or search the reason, description or ref type.
4. Click **CSV** to download the filtered entries.

Each entry shows the date, wallet, counterparty, category, amount and balance. The page lists at most 500 entries;
use the filters or the CSV for more.

## Notifications

If you are in the group chosen under Settings, you get one notification when a month closes, under the category
**Corp finance reports**. It reads like "Corp finance for <month>: +X ISK" and gives the income and spending for the
corporations you may see. It links to that month's report.

A month counts as closed once it has ended and every corporation's wallets have synced past its end, or two days have
gone by.

## FAQ and troubleshooting

**A corporation is missing.** Either you may not see its wallets on the corporation sheet, its wallets have not synced
yet (that needs an Accountant's or Director's login), or Settings limits which corporations count.

**This month looks low.** It covers the month so far, up to the last wallet sync.

**Money between our corporations is not in income.** That is on purpose. It is an internal transfer.

**An entry is in the wrong category.** Ask someone with `finance.manage_finance` to move its ref type or tag the
counterparty.

**Balance history stops early.** It only goes back as far as the journal the site has kept.
