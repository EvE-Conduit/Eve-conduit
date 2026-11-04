# Corp Tax — Admin guide

Corp Tax builds a ledger of the tax your corporations took from each member's bounties, ESS payouts and missions. You
can bill an extra tax on top every month, match payments from the corporation wallet automatically, remind members who
have not paid, and gate groups on paid tax with a group rule.

## Requirements

| Requirement | Detail |
|---|---|
| EvE Conduit | 0.5.51 or newer (`min_conduit`) |
| Other plugins | None |
| ESI scopes | None of its own. It uses the wallet journals synced by the corporation sheet's **Wallets** section. |
| Corp roles | A **Director** or **Accountant** login for each corporation, so the corporation sheet syncs its wallets. |

## Installing and switching it on

1. Go to **Administration → Plugins → Browse**.
2. Find **Corp Tax** and install it.
3. Enable it.
4. Give the permissions below to a state (**Administration → States**) or a group (**Administration → Groups**).

Every member gets **Corp tax** in the sidebar (their own **My tax** page) and the **Corp tax** dashboard widget.

## Permissions

| Permission codename | What it allows | Suggested group |
|---|---|---|
| `tax.view_ledger` | The full **Ledger** for every member, the CSV export, and reading the settings. | Directors, accountants |
| `tax.manage_ledger` | Change settings, close and reopen months, mark bills paid or unpaid, **Check payments**. | Directors, head accountant |

Both appear in the director tier of the Administration permission picker.

The ledger follows the corporation sheet's permissions, including `corp.view_corporation_wallets`: a viewer only sees
tax from corporations whose wallets they may open there. Closing or reopening a month and saving the settings cover
every corporation at once, so they need wallet access to all corporations with tax in it. Marking a bill needs access
to every corporation that member was taxed in.

## Settings

Open **Corp tax**, then click **Settings** on the ledger page. Settings apply to open months; closed months keep the
rate they were closed with.

| Setting | Default | What it does |
|---|---|---|
| **Extra tax (% of what the corporation took)** | 0 | What members owe on top, as a percentage of what the corporation took. 100 means the same again. 0 keeps the ledger without billing. Range 0 to 1000. |
| **Smallest bill (ISK)** | 0 | Bills below this amount are not sent. |
| **How to pay** | Empty | Shown to members with what they owe and sent with the monthly notification. Example: "Give the ISK to Holding Corp with the reason on your bill." |
| **Payment word** | `TAX` | Donations to a tax corporation whose reason contains this word settle bills by themselves. Empty switches matching off. Up to 40 characters. |
| **Remind every (days)** | 7 | How often members with unpaid bills are reminded. 0 never. Range 0 to 365. |
| **What counts** | Bounties, ESS payouts | Which kinds of tax count: Bounties, ESS payouts, Mission rewards, Mission time bonuses. |
| **Corporations** | None ticked | Whose wallets count. None ticked means all of them. |

Click **Save**.

## Day-to-day operation

### Reading the ledger

1. Open **Corp tax** and pick a month.
2. The top cards show **Corporation took**, **Owed · N%**, **Paid** (once the month is closed) and **Unregistered
   characters** (tax from characters nobody has registered).
3. **Tax per day** charts what the corporations took each day.
4. The **Members** tab lists each member with **Earned (est.)**, **Corporation took**, **Owed** and, for closed
   months, **Paid**. Click a member to see their characters. Characters nobody registered are marked
   **not registered** and are never billed.
5. The **By kind** tab splits the tax by kind.
6. **CSV** downloads `corp-tax-YYYY-MM.csv`.

Earnings are estimated from each corporation's current tax rate, so they are off for months when the rate was
different. What the corporation took is exact.

### Closing a month

A month can be closed once it is over. The ledger shows "<month> is over and still open".

1. Pick the month.
2. Click **Close month** and confirm.
3. The rate and smallest bill are fixed for that month. Each registered member whose bill is at least the smallest
   bill gets a bill and a notification. Payments members already made are applied.

### Reopening a month

Click **Reopen** on a closed month and confirm. All of that month's bills are deleted until you close it again. You
can only reopen while nobody has paid; mark paid bills as unpaid first.

### Payments

- Matching looks for player donations to a counted corporation whose reason contains the payment word as a word of
  its own (any case; `syntax` and `taxi` do not count). The donor must be a registered character.
- Payments settle a member's bills oldest first, and only once they cover a bill in full. Leftovers count towards the
  next bill.
- Matching runs once a day. Click **Check payments** to run it now; it reports how many members paid.
- To mark a bill by hand, use the switch in the **Paid** column. "Paid (wallet)" means a wallet payment settled it.
- Marking a wallet-settled bill as unpaid gives that payment back to the member as credit. Bills settled before
  version 1.0.1 do not get this credit back.
- Nobody can mark their own bill.

## Group rule

**Corp tax paid** (category Finance), for group requirements and smart groups.

| Parameter | Default | What it does |
|---|---|---|
| Days to pay | 14 | How long after a month is closed members have before an unpaid bill counts against them. 0 to 365. |

Passes while the member has no unpaid bill older than the days to pay. Members who were never billed pass.

## Notifications

Sent to members under the **Corp tax** category:

| Notification | When |
|---|---|
| "Corp tax for <month>: X ISK" | A month is closed and the member owes something. Includes **How to pay** and the reason, such as `TAX 2026-09`. |
| "Reminder: you owe X ISK in corp tax" | Daily check: bills unpaid for at least **Remind every (days)** since the month closed, and not reminded within that time. |

## Webhooks and Discord

Corp Tax sends no webhook events.

## Audit log

| Action | When |
|---|---|
| `tax.settings` | Settings saved |
| `tax.close_month` | A month closed |
| `tax.reopen_month` | A month reopened |
| `tax.payment` | A bill marked paid or unpaid by hand |

Automatic wallet matches are not in the audit log; they show as "Paid (wallet)".

## Background jobs

| Job | Schedule | What it does |
|---|---|---|
| `conduit_tax.tasks.daily` | Daily at 07:40 | Matches payments from the wallet journals, then sends reminders. Does nothing while the plugin is disabled. |

## Troubleshooting

**The ledger is empty.** Tax shows up once a director's or accountant's login has synced the corporation's wallets.
Also check **Corporations** and **What counts** in the settings.

**"This covers wallets of corporations you can't see on the corporation sheet".** Closing, reopening and settings need
wallet access to every corporation in the ledger. Have someone with full access do it.

**"A month can be closed once it's over".** Wait until the month has ended.

**"Some members have already paid for this month; mark those payments as unpaid first".** Unmark the paid bills, then
reopen.

**"Someone else has to mark your own corp tax".** Ask another manager.

**A member paid but the bill stays unpaid.** Check the donation went to a counted corporation, from a registered
character, with the payment word as a separate word, and that the payment covers the whole oldest bill. Then click
**Check payments**, or mark it by hand.

**Unregistered characters have tax.** They are not billed. Ask their owners to add them to the site.
