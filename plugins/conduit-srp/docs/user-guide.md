# Ship Replacement (SRP) — User guide

Ship Replacement lets you claim ships you lost on fleet. Your losses are found in your characters' synced killmails.
You pick a loss, say which fleet you lost it in, and send the request. A reviewer checks it and approves a payout or
rejects it, and someone then sends the ISK and marks it paid. You get a notification at each step.

## Where to find it

- Open **Ship replacement** in the sidebar. Members land on **My SRP**. Reviewers land on the **SRP queue**; they
  reach their own page with **Mine**.
- The **Ship replacement** dashboard widget shows "Losses you can claim", how many requests are waiting for review,
  and how much approved ISK is coming.

## My SRP

The page shows:

- **How SRP works here**: your site's SRP policy, if the officers wrote one. Read it before claiming.
- Three counters: **Waiting for review**, **Approved, not paid yet** and **Paid to you** (all time).
- **Losses you can claim**: unclaimed losses from the last 30 days (your site may set a different number), with
  **Ship**, **Where**, **When**, **Loss** value (ship and fitted modules) and the **Payout** the rules suggest. Only
  ships are listed: a lost mobile depot or other deployable can't be claimed.
- **My requests**: every request you sent, with **Ship**, **Fleet**, **Sent**, **Payout** and **Status**.

You can only claim ships lost by your own characters, after the character was linked to your account. If a character
changed hands, its new owner can't claim what the previous owner lost.

## Claim a loss

1. Open **My SRP**.
2. Under **Losses you can claim**, press **Claim** on the loss. If **Claim** is greyed out, that ship is not covered.
3. Fill in:
   - **Fleet**: the op name or the fleet ping. Your site may require it.
   - **FC**: optional.
   - **Anything the reviewers should know**: optional, for example "Ordered to hold the gate".
4. Press **Send request**.

## Claim a loss that isn't listed

Some losses don't show up by themselves, for example if the character never granted the killmail scope, or the loss is
older than ESI's recent list.

1. Get the kill link:
   - from zKillboard, for example `https://zkillboard.com/kill/123456789/`; or
   - in game, open the killmail, right-click and choose "Copy external kill link".
2. On **My SRP**, press **Claim from a link**.
3. Paste it into **Kill link**, fill in **Fleet**, **FC** and the note, and press **Send request**.

You can paste up to 10 links in 10 minutes. Links for losses that aren't yours are refused.

## Follow a request

Open a request from **My requests**. It shows:

- **Loss value** (the ship and its fitted modules at average prices; cargo, drones and blueprint copies don't count), **Rules suggest** and **Payout**;
- the full fitting and cargo, red for destroyed and green for dropped;
- the fleet, FC, corporation, final blow and attackers;
- the decision, with the reviewer's note.

| Status | Meaning |
|---|---|
| Pending | Waiting for a reviewer. |
| Approved | A reviewer approved a payout. The ISK is not sent yet. |
| Rejected | A reviewer rejected it. The reason is shown. |
| Paid | The ISK has been sent to the character. |

### Withdraw a request

While a request is **Pending**, open it and press **Withdraw**. The loss goes back to your list, so you can claim it
again later.

## Notifications

You get a notification, in the **Ship replacement** category, when your request is:

- approved: "SRP approved: <ship>", with the amount and any note;
- rejected: "SRP rejected: <ship>", with the reason;
- paid: "SRP paid: <ship>", with the amount.

If a reviewer reopens a decided request, you are not told.

## FAQ and troubleshooting

**My loss isn't listed.**
Your characters' killmails must have synced, which needs `esi-killmails.read_killmails.v1`. Losses older than the
claim period are not listed. Already claimed losses are not listed. Otherwise use **Claim from a link**.

**"That ship isn't covered by ship replacement".**
The site's rules don't pay for that ship.

**"Losses in that corporation aren't covered".**
Only losses in certain corporations count on your site.

**"Losses can be claimed for N days".**
The loss is older than the claim period.

**"That loss happened before the character was linked to your account".**
You can only claim losses from after you added the character.

**"Say which fleet you lost it in".**
Your site requires the **Fleet** field.

**"zKillboard didn't answer".**
Try again, or use the in-game "Copy external kill link" instead.

**"That's a lot of kill links in a short time".**
Wait a few minutes and try again.
