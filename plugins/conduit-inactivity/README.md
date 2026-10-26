# Inactivity

Who has gone quiet, and leave of absence so nobody is chased (or kicked) by mistake.

- **Activity** comes from three signals, each switched on or off under Inactivity members → Settings. A member is
  active while any switched-on one is recent enough (30 days by default), and is never counted from before they
  joined the site:
  - **Signed in to the site:** when they last signed in to EvE Conduit. A sign-in lasts a long time, so this only
    moves when they sign in again; keep another signal on.
  - **Played EVE:** their characters' last login or logout, from the character sheets (online counts as now) and,
    for corporations a Director has added, corporation member tracking.
  - **Flew in a fleet:** their last FAT. **Needs the [Fleets & FATs](../conduit-fleets) plugin** installed and on;
    FATs someone added by hand for their own characters don't count.
- **Who is checked:** every member by default, or only those in some states and some groups. Guests never are.
- **Inactive members** (permission `inactivity.view_inactivity`): everyone checked, with their last activity per
  signal, days inactive and leave; filter inactive, on leave or everyone, search a character, download as CSV. A
  dashboard widget shows the counts.
- **Leave of absence:** every member posts their own leave (from, until, reason) on the Leave of absence page and can
  cancel it. With "Leave needs approval" on (the default), people with `inactivity.manage_leave` are notified and
  approve or reject it with a note; the member is told. While an approved leave runs they aren't flagged. A leave is
  up to 90 days (Settings), can't overlap another and can't be over already.
- **The daily check** (07:20) works everyone out again and sends people with `inactivity.view_inactivity` one
  notification naming who went inactive since the last check. Someone is named once, and again only after they've
  been active in between. Optionally the member gets a "we haven't seen you" notification too. Saving the settings
  or "Check now" checks everyone again without notifying.
- **Group rules:** "Active recently" (active in the last N days, or on leave) and "On leave of absence", for smart
  groups. They read the daily check, so they're up to a day behind.
- **Webhooks:** `inactivity.flagged` and `inactivity.leave_posted` can be sent to Discord or Slack under
  Administration → Integrations. They name members, so they only go to webhooks that pick them by name.

`inactivity.manage_leave` also changes the settings. Give the permissions to your HR group under Administration →
Groups. Needs EvE Conduit 0.5.52 or newer.
