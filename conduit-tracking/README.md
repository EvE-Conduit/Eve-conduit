# Activity Tracking

Follow a member and all their alts for 1 to 60 days, with a report of the systems they were in, the ships they flew,
what they earned and when they played. The member is never told.

- **Track a member:** pick them by their main or any alt, choose 1 to 60 days and optionally a reason. Every
  character on their account is followed, including alts they link while it runs; a character moved to another
  account stops being followed. One tracking per member at a time; stop it to start again.
- **Where and in what:** every minute, each of their characters is checked: online or not, and if online, which
  system, docked where, and in which ship. Unchanged, the time since the last check is added to what it's doing;
  changed, a new stint starts. Time offline, and gaps of more than five minutes (the worker stalled, ESI trouble),
  aren't counted. Checks are a minute apart, so time per system and ship is close, but a system flown straight
  through or a quick ship swap can be missed. ESI has no history of where a character was: this only starts when
  the tracking does.
- **The report:** time online, systems, regions, ship types, ISK earned and spent, kills and losses, per character
  and in total; time online per day and by hour of day (EVE time); systems, ships, regions and stations or structures
  docked at, with time, share and which characters; a timeline of stints. From what Conduit already syncs for the
  same period: wallet journal income and spending by kind, the systems bounties and other payouts were earned in,
  the mining ledger with its value at average prices, and killmails with the ships they flew on them. ISK moved
  between the member's own characters is neither earned nor spent. The report refreshes every minute while it runs.
- **Coverage:** characters that can't be followed (no working login, or missing the location, ship or online scopes)
  are listed at the top of the report with why. Their wallet, mining and kills still count.
- **When it ends**, whoever started it gets one notification that the report is complete (not when they stopped it
  themselves). Reports are kept until someone deletes them.

**Privacy:** the member gets no notification, no sidebar entry and no API. Starting, stopping and deleting a tracking
and opening a report are in the **audit log**, and opening a report goes in the **snooper log** for each of their
characters, like opening their character sheet; both are for administrators only.

**Permissions:** `tracking.track_members` starts, stops and deletes trackings and reads the reports. Like Member
Audit, it only reaches members whose characters the tracker's character sheet permissions reach: all, their
alliance's or their corporation's. Nobody can track themselves or see a tracking of themselves. Give it to your HR
or counter-intelligence group under Administration → Groups.

**ESI:** `esi-location.read_location.v1`, `esi-location.read_online.v1` and `esi-location.read_ship_type.v1`, which
EvE Conduit asks for already. Three requests per online character per minute, one per offline character. Needs EvE
Conduit 0.5.55 or newer.
