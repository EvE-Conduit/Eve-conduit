# Ship Replacement (SRP) — Admin guide

Ship Replacement handles your ship replacement program. Members claim losses from their synced killmails. Reviewers
check each loss, approve a payout or reject it with a reason. Payers export the approved payouts, send the ISK and mark
requests paid. Managers set the payout rules.

Loss values are the hull and what was fitted to it (high, medium and low slots, rigs, subsystems) at CCP's average
market prices. Cargo, drone and fighter bays and other holds don't count, and neither do blueprint copies, so the
value can be lower than the character sheet's or zKillboard's total. Only ships can be claimed. The request page still lists the cargo, so reviewers see everything that was on board.

## Requirements

| Item | Value |
|---|---|
| EvE Conduit version | 0.5.55 or newer |
| Other plugins | None. With the Discord plugin linked, you can pick Discord roles to ping. |
| ESI scopes it adds | `esi-killmails.read_killmails.v1` (losses come from the character sheet's killmails) |
| Corporation roles | None. ISK is sent by hand in game; the plugin does not move ISK. |

Enabling the plugin adds the killmail scope to the scopes the site asks for. Members without it can still claim from a
zKillboard or in-game kill link.

## Install and switch it on

1. Go to Administration → Plugins → Browse.
2. Find **Ship Replacement (SRP)** (category Military) and install it.
3. Enable the plugin.
4. Give the permissions below to your reviewers, payers and SRP managers.
5. Set up the rules (see below).

## Permissions

| Permission codename | What it allows | Suggested group |
|---|---|---|
| (none) | **My SRP**: claim own losses, follow and withdraw own requests. | Everyone |
| `srp.review_requests` | The **SRP queue**; approve, reject and reopen requests; the **SRP queue** dashboard widget; a notification for each new request. | SRP reviewers, FCs |
| `srp.pay_requests` | The **SRP queue** (read); **Payouts CSV**; mark approved requests paid. | Accountants, directors |
| `srp.manage_srp` | The **Rules** button: payout rules and settings, and the Discord ping setting. | Directors |

Give the permissions to a state (Administration → States) or a group (Administration → Groups).

Nobody decides or reopens their own request, administrators included. Payers can't mark their own requests paid;
someone else has to send that ISK.

## Settings

On the **SRP queue**, press **Rules**. The **SRP rules** dialog has three tabs. Changes apply to new requests. Press
**Save settings** when done.

### General

| Setting | Default | What it does |
|---|---|---|
| Default payout (% of the loss's value) | 100 | Paid for ships without a rule of their own or for their group. 0 to 1000. |
| Claims allowed for (days) | 30 | Losses older than this can't be claimed. 1 to 365. |
| Only ships with a rule | Off | Ships without a rule (for themselves or their group) can't be claimed. |
| Ask for the fleet | On | Members must name the fleet or op they lost the ship on. |
| Rules shown to members | empty | Shown on **My SRP** as "How SRP works here". |

The **Discord pings** box is also on this tab (see below).

### Ships

Add a payout rule for a ship or a whole ship group:

1. Search **Add a rule: search a ship or ship group**, for example "Scythe" or "Logistics".
2. Pick **Fixed ISK**, **% of loss** or **Not covered**.
3. Enter the amount in ISK or the percentage (not needed for **Not covered**).
4. Optional: add a note, for example "doctrine fit only".
5. Press **Add**.

A rule for a ship wins over a rule for its group. Use **Not covered** for pods, shuttles and the like. Press the bin
icon to remove a rule. With no rules, every ship pays the default rate.

### Corporations

Tick the corporations whose losses can be claimed. None ticked means every corporation. The list shows corporations
that have registered members.

## Reviewing requests

1. Open **Ship replacement**. The **SRP queue** shows **Waiting for review**, **Approved, to pay** and **Paid in the
   last 30 days**.
2. Use the tabs **Pending**, **Approved**, **Rejected**, **Paid** and **All**. Search by **Pilot, ship, fleet or FC**.
3. Open a request. Check the fitting and cargo, the fleet, the final blow and **Earlier requests** (the member's other
   requests).
4. Press **Approve**. The **Payout (ISK)** field starts with what the rules suggest. Change it if needed, add a
   **Note to the pilot** if you like, and confirm.
5. Or press **Reject**, write **Why** (required) and confirm. The pilot sees the reason.

**Reopen** puts an approved or rejected request back to pending and clears the decision; the pilot is not told. A
rejected request can also be approved directly, and an approved one rejected. Paid requests stay paid.

## Paying out

1. On the **SRP queue**, press **Payouts CSV**. It lists every approved, unpaid request: Request, Member, Pay to, Ship,
   Lost, Fleet, Payout (ISK).
2. Send the ISK in game to the **Pay to** character.
3. Mark them paid:
   - one at a time: open the request and press **Mark paid**; or
   - in bulk: on the **Approved** tab, tick the requests and press **Mark N paid**.
4. Each pilot is told their SRP has been paid, so send the ISK first.

Your own requests are skipped when you mark in bulk, with a warning.

## Notifications

| Who | When |
|---|---|
| Everyone with `srp.review_requests` | A new request is sent. |
| The member | Their request is approved, rejected or paid. |

Notifications use the **Ship replacement** category.

## Webhook events and Discord pings

| Event | When | Alert |
|---|---|---|
| `srp.request_created` | A member asked for a loss to be replaced. | Yes |
| `srp.request_decided` | A request was approved or rejected. | No |
| `srp.request_paid` | An approved request was paid out. | No |

Send them to a URL or Discord under Administration → Integrations.

To ping Discord on new requests:

1. Add a Discord webhook under Administration → Integrations and pick the **SRP requested** event for it.
2. Open **Rules** → **General** → **Discord pings** and switch on **SRP requested**.
3. Give the webhook a mention under Administration → Integrations, or, with the Discord plugin linked, pick roles in
   **Discord pings**.

## Audit logging

These actions go in the audit log: `srp.approve` (with the payout), `srp.reject`, `srp.reopen`, `srp.paid` (with the
request ids and total), `srp.settings` and `srp.rule` (rule added, changed or removed).

## Background jobs

None. Losses come from the character sheet's killmail sync.

## Troubleshooting

**Members say their losses are missing.**
Their characters need `esi-killmails.read_killmails.v1` and a working killmail sync. Losses older than **Claims
allowed for (days)**, from corporations not ticked, or from before the character was linked are not listed. Members
can use **Claim from a link** for losses that never synced.

**"Someone else has to decide your own request".**
Reviewers can't decide their own requests. Another reviewer must do it.

**A ship can't be claimed.**
Check for a **Not covered** rule on the ship or its group, and the **Only ships with a rule** setting.
