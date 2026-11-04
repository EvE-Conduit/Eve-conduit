# Corp Tax — User guide

Corp Tax shows the tax your corporation took from your characters' bounties, ESS payouts and missions. If leadership
charges an extra tax on top, you get a bill once a month, can see what you owe, and pay it with an in-game donation.
Payments with the right reason are picked up from the corporation wallet by themselves.

## Where to find it

- **Corp tax** in the sidebar opens **My tax**. (Officers with the ledger permission see the full ledger there
  instead, and reach their own page with **Mine**.)
- The **Corp tax** dashboard widget shows what the corporation took from you this month, roughly what you owe on it,
  and either what you still owe or **All paid**. Click it to open **My tax**.

## My tax

1. Open **Corp tax**.
2. Pick a month with the month picker. The current month is marked "so far"; finished, billed months are marked
   "closed".
3. Read the page:
   - **Corporation took in <month>**: the in-game tax your corporation took from you. The hint shows an estimate of
     what you earned.
   - **Owed · N%**: the extra tax at the current rate. Until the month is closed this is an estimate.
   - **Characters**: how many of your characters were taxed that month.
   - **By character**: each character's estimated earnings and what the corporation took.
   - **Bills**: every month you have been billed for, with the amount and **Paid** or **Unpaid**.

"Earned (est.)" is worked out from the corporation's current tax rate, so it can be off for months when the rate was
different. What the corporation took is always exact.

## What you pay and when

Leadership sets the extra tax as a percentage of what the corporation took from you. For example, 100 % means the same
again. Bills smaller than a minimum amount are not sent.

When a month is over, leadership closes it. At that point:

1. The rate for that month is fixed.
2. You get a notification "Corp tax for <month>: X ISK" with the payment instructions and, if set, the reason to use
   (for example `TAX 2026-09`).
3. The bill shows under **Bills**.

## Paying a bill

If you owe something, **My tax** shows a warning "You owe X in corp tax" with leadership's payment instructions (or
"Ask your corporation's leadership how to pay." if there are none).

When payment matching is switched on, the warning also says what to put in the reason, such as `TAX 2026-09`.

1. In the game, give (donate) the ISK from one of your registered characters to the tax corporation named in the
   instructions.
2. Put the reason shown on your bill in the donation's reason, for example `TAX 2026-09`.
3. Wait. Payments are checked once a day, so the bill is marked paid within a day.

How matching works:

- The payment word (`TAX` by default) must appear in the reason as a word of its own, in any case. `TAX 2026-09`,
  `corp tax` and `Sept tax, Pilot Alt` count; `syntax` and `taxi` do not.
- Payments settle your oldest unpaid bill first, and only once they cover that bill in full.
- Anything left over counts towards your next bill.
- Payments made before the bill went out count too.
- The donation must come from a character on your account.

Officers can also mark a bill paid by hand.

## Notifications

All under the **Corp tax** category:

| Notification | When |
|---|---|
| "Corp tax for <month>: X ISK" | Leadership closes a month and you owe something |
| "Reminder: you owe X ISK in corp tax" | You still have unpaid bills. Sent every 7 days by default; leadership can change or switch this off. |

## FAQ and troubleshooting

**I paid but the bill still says Unpaid.** Check that the reason contains the payment word as a separate word, that you
paid the right corporation, and that the paying character is on your account. Wallets are checked once a day, and the
corporation's wallets must have synced. A payment that is less than the bill waits until more is paid. If it still
does not clear, ask an officer to mark it paid.

**My earnings look wrong.** They are estimates from the corporation's current tax rate.

**I see "No tax in <month>".** None of your characters were taxed that month, or the corporation's wallets have not
synced yet.

**Can I mark my own bill paid?** No. Nobody can mark their own bill, managers included.

**A paid bill became Unpaid again.** An officer marked it unpaid. Any wallet payment that settled it is given back to
you as credit for the next bill.
