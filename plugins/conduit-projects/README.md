# Industry Projects

A corp build board: "20 Hurricanes for the deployment", split into items members claim, build and deliver.

- **Projects** (permission `projects.manage_projects`): a name, details, where to deliver and an optional deadline.
  Every member sees a project, or only people in chosen states or groups; they're told when it starts. Close it as
  done or cancelled, reopen it, or delete it while nobody has claimed anything.
- **Items:** add them one by one (search by name) or paste a list: the materials list copied from the in-game
  Industry window, an inventory, or lines like `Tritanium x 1000`. The same item twice adds up. The static data
  has no blueprints, so work out the parts in game (with the ME you use) and paste them. Each item can carry
  **points per unit** (paid by the [Corp Store](../conduit-store) plugin, when it's installed) and **ISK per unit**
  (only shown; paying it is up to you). An item can't need fewer than what's already claimed or delivered.
- **Claims:** a member claims part of an item (never more than is left), can change or release it, and marks it
  **delivered** with a note on where it is. Managers are told and confirm it on the **Deliveries** page or on the
  project, or send it back with a reason. Managers can't confirm their own deliveries, since confirming pays Corp Store
  points. A project closes as done by itself once everything is confirmed.
- **Industry jobs as a hint:** next to an open claim, the member and managers see the member's industry jobs
  making that item since they claimed it, their own and corporation jobs they installed ("3 runs in production,
  ends in 2d"). It's only a hint: nothing is confirmed without a manager. Runs aren't always units (ammunition
  makes many per run).
- **My contributions:** each member's claims and deliveries across projects, and the points they earned.
- **Dashboard widget:** open projects with their progress. Progress counts every item the same, whatever its
  quantity.
- **Events and webhooks:** `projects.created`, `projects.contribution_delivered` (when a manager confirms a delivery;
  `user_id, user, project_id, project, contribution_id, item, type_id, quantity, points, summary, link`) and
  `projects.completed`. The Corp Store listens to `projects.contribution_delivered` to pay `points`.

Needs EvE Conduit 0.5.52 or newer. Industry jobs come from the core's character and corporation sheets (the
industry job scopes). Give `projects.manage_projects` to whoever runs projects under Administration → Groups.
