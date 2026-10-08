# Ship Replacement (SRP)

Members claim ships they lost on fleet; reviewers check the loss, approve a payout and mark it paid.

- **My SRP** (everyone): the member's losses from the last 30 days (configurable) that haven't been claimed, with
  what the rules would pay. Claiming asks for the fleet, the FC and a note. Losses that haven't synced can be
  claimed by pasting their zKillboard link or the in-game "Copy external kill link" (up to 10 links in 10 minutes).
  Members follow each request and get a notification when it's approved, rejected or paid, and can withdraw a request
  while it's pending.
- **Only your own losses:** the ship must have been lost by one of the member's characters, after that character was
  linked to their account. A character that changes hands is linked afresh, so its new owner can't claim what the
  previous owner lost. Pasted links for anyone else's losses are refused before anything is fetched further or stored.
- **Queue** (permission `srp.review_requests`): pending, approved, rejected and paid requests with the pilot, ship,
  system, fleet, loss value and payout. Each request shows the full fitting and cargo (destroyed or dropped), the
  victim's corporation and the final blow, and how many requests the member had approved or rejected before.
  Approve with the suggested payout or another amount, or reject with a reason. Nobody decides (or reopens) their own
  request, administrators included.
- **Payouts** (permission `srp.pay_requests`): a CSV of everything approved and not paid yet, and marking requests
  paid one by one or in bulk. Payers can't mark their own requests paid; someone else sends that ISK.
- **Rules** (permission `srp.manage_srp`): a payout per ship or per ship group (fixed ISK, a % of the loss, or not
  covered), a default % for everything else (or nothing: "only ships with a rule"), how long losses can be
  claimed, whether the fleet is required, which corporations' losses count, and a text explaining your SRP policy.

Losses come from the character sheet's killmails, so characters need the `esi-killmails.read_killmails.v1` scope.
Loss values use CCP's average market prices, as on the character sheet.

Events for webhooks: `srp.request_created`, `srp.request_decided`, `srp.request_paid`. Give the permissions to a
state (Administration → States) or a group (Administration → Groups).
