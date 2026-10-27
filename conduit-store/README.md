# Corp Store

Members earn points for what they do for the corp and spend them in a store that officers fill by hand.

- **Earning:** points come in by themselves from other plugins, each paid once whatever happens twice. Set how many
  under Corp Store → Manage; 0 switches one off.
  - **Referral** ([Recruitment](../conduit-recruitment)): to the member a recruit named as their referrer, when the
    recruit is accepted.
  - **Fleet** ([Fleets](../conduit-fleets)): to each member with a FAT when the fleet ends, once per fleet however many
    characters they brought. FATs members added by hand for their own characters don't pay, nor do the FC's (or the
    fleet's creator's) own FATs unless the in-game fleet tracking saw them.
  - **Mentee graduated** ([Mentoring](../conduit-mentors)): to the mentor.
  - **Industry projects** ([Industry Projects](../conduit-projects)): each project sets its own points per delivery
    (at most 1,000,000 for one delivery); the store only switches them on or off.
  - **By hand:** managers give or take points with a reason the member sees. Recorded in the audit log. Nobody can
    give themselves points.
- **The store:** items with a price, an optional EVE item for the picture, optional stock and an optional limit per
  member. Members see their balance, buy, and follow their orders under **My points**, with every point they earned
  and spent. A leaderboard shows who earned most this month and of all time (spending doesn't lower it).
- **Orders** (permission `store.fulfil_orders`): buying takes the points at once and notifies the officers. They hand
  the item over in game and mark it done, with an optional note; the member is notified. Nobody marks their own order
  handed over. A member can cancel while
  it's waiting, officers with a reason; either way the points come back and the stock is put back.
- **Managing** (permission `store.manage_store`): items, earning and points by hand.
- **Dashboard widget:** your balance and what you earned in the last 30 days.
- **Webhooks:** `store.order_placed` and `store.order_fulfilled` can be sent to Discord or Slack under
  Administration → Integrations.

Members only. Needs EvE Conduit 0.5.52 or newer. Give the two permissions to your officers' group under
Administration → Groups.
