# Blueprint Library

Every blueprint your corporations own in one searchable library, members asking for copies or to borrow an original,
and what still needs research.

- **Library** (permission `blueprint_library.view_library`): corporation originals and copies grouped by blueprint,
  with the item each one makes, how many originals and copies there are (and their runs), and the best ME/TE.
  Open one to see every copy and original, its owner and where it is (station or structure and hangar division).
  Search by blueprint or by what it makes, and filter by category (Ship, Module, Charge...), originals or copies,
  lowest ME, corporation, or corporation vs. members' blueprints. A member sees the corporations their characters
  are in and any whose sheet the core lets them read (`corp.view_*_corporations`); request managers see every one.
- **Members' own originals:** under **Share mine** a member switches on, per character, that its originals show in
  the library, labelled **Personal** with the character's name. Copies always stay private. A share stops counting
  if the character moves to another account.
- **Requests:** from a blueprint, ask for copies (runs per copy, number of copies, ME/TE at least, a note) or to
  borrow the original for some days. A request can say it's for an open [Industry Projects](../conduit-projects)
  project when that plugin is on. Managers (permission `blueprint_library.manage_requests`) are told and work the
  **Request queue**: accept, mark it in progress (linking the corporation copying job making the copies, picked
  from the core's corporation industry jobs), deliver, or decline with a reason. The member is notified at every
  step and can cancel while it isn't delivered.
- **Loans:** a handed-over original is due back after the days asked for (the manager can pick another date, and
  move it later). Once it's overdue the borrower is reminded every day and managers are told once. Managers mark it
  returned.
- **Research:** corporation originals short of ME 10 / TE 20, and the ME/TE research, copying and invention jobs
  running in the corporations (a finished job nobody delivered yet shows as ready).
- **Events and webhooks:** `blueprints.request_created`, `blueprints.request_delivered` and `blueprints.loan_overdue`.

## Where the data comes from

The core reads characters' own blueprints, corporation assets and corporation industry jobs, but not corporation
blueprints, so this plugin reads `/corporations/{id}/blueprints` itself every three hours (managers can press
**Read again**). ESI only answers a **Director**, so it runs as a registered Director whose login grants
`esi-corporations.read_blueprints.v1` (the plugin asks for that scope), picked the way the core picks members for
its corporation sheet sections; the one that worked last time goes first. Where a blueprint sits is worked out from
the corporation's assets (offices and containers), so the Assets section of the corporation sheet should be syncing
too. The static data has no blueprint data, so what a blueprint makes is learned from manufacturing and reaction
jobs seen on the site, then from its name ("Hurricane Blueprint" makes "Hurricane").

Needs EvE Conduit 0.5.52 or newer. Give `blueprint_library.view_library` to members and
`blueprint_library.manage_requests` to whoever runs the library under Administration → Groups.
