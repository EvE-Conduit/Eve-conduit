# Planetary Industry

Every colony across a member's characters in one place, reminders before extractors run out, and a corporation view
for running a PI program.

- **Colonies** come from the character sheet's PI section, which reads each planet's layout from EVE about once an
  hour (scope `esi-planets.manage_planets.v1`, already asked for by the character sheet). The plugin makes no ESI calls
  of its own. Characters that haven't granted the scope are named on the page.
- **Planetary Industry** (every member): each colony with its planet, type, system, command centre level and
  character; every extractor with its product, rate and a live countdown (red when it has stopped); factories by
  schematic and tier, with ones that have nothing routed into them marked idle; storage fill (command centre, storage
  facilities, launchpads); and what the colony makes a day and its ISK value. **Output** totals everything over all
  the member's colonies and lists what has to be hauled in. **Reminders** holds the member's settings.
- **Output is an estimate.** Running extractors give their average quantity every cycle until they expire. A factory
  with a route into it is taken to run every cycle at the standard rate (P1 20 per 30 minutes; P2 5, P3 3 and P4 1
  an hour) using the standard inputs (3000 P0 per P1 run, 40 P1 per P2, 10 P2 per P3, 6 P3 or 40 P1 per P4). What's
  made minus what's used is the output, valued at CCP's average price; anything used but not made is an input. Totals
  net over all of a member's colonies, so Water made on one planet and turned into Coolant on another counts once.
  Tiers come from the static data's item groups.
- **Reminders** (notification category "Planetary Industry reminders"), checked every ten minutes:
  - *before an extractor expires*, 2 hours before by default (1 to 72), not for programs set shorter than that;
  - *when it has expired* (only within 12 hours of it ending, so long-stopped colonies don't all ping at once);
  - once per extractor program: restarting it in game (a new expiry) is reminded again. Several extractors due at the
    same time go in one notification.
  - an optional **daily digest** (11:30 EVE time): what isn't running, what expires in the next 24 hours, ISK a day.

  Members choose these on the Reminders tab; they're kept with the core per-user plugin settings
  (`/api/me/preferences/plugins/pi`). Colonies sync hourly, so an extractor restarted in game can still be reminded
  of until the next sync.
- **Corporation PI** (permission `pi.view_corp_pi`): totals by product with their tier and who makes them, each
  member's colonies, extractors, products and ISK a day, and **idle colonies** (every extractor stopped for more than
  N days, 3 by default). Filter by corporation. It covers exactly the characters the officer's character sheet access
  reaches (`sheet.view_corporation_characters`, `sheet.view_alliance_characters` or `sheet.view_all_characters`), so
  give officers one of those too. Opening it goes in the **snooper log** for every other member's character it
  shows, like opening the Planets tab of their sheet.
- **Dashboard widget:** the member's extractors running out next and how many have stopped.
- **Webhooks:** `pi.extractors_expiring` and `pi.extractors_expired` can be sent to Discord or Slack under
  Administration → Integrations. They name the member and their planets, so they only go to webhooks that pick them
  by name.

Needs EvE Conduit 0.5.52 or newer.
