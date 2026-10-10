# Fleets & FATs

Records who flew in each fleet (FATs, also called PAPs) and lets groups require attendance.

- **Fleets** (everyone): recent fleets with their type, FC and pilot count, the fleets you flew in, and your FATs
  over 30 days, 90 days and all time. A dashboard widget shows the last 30 days.
- **Running a fleet** (permission `fleets.run_fleets`): start a fleet with a name, type (CTA, Stratop, Roam, Home
  defense, Mining, or your own) and notes. Pilots get a FAT in either or both of two ways:
  - **Tracking:** pick one of your characters that is fleet boss in game. Everyone in the in-game fleet gets a FAT,
    read from ESI every minute (needs `esi-fleets.read_fleet.v1`). It stops when the in-game fleet ends, the boss
    changes, after 12 hours, or when you end the fleet.
    While tracking, two green FAT lines go at the bottom of the in-game **fleet MOTD**, two empty lines below your text: that everyone in fleet gets a FAT
    automatically, the FAT round and how many pilots have one so far (counts only, never who). They're rewritten
    when the count changes and say "Fleet ended: N pilots got a FAT" when you end it. Whatever is above them in the
    MOTD is kept, so write your own text above the `--- FATs by EvE Conduit ---` line. Needs
    `esi-fleets.write_fleet.v1`; it can be switched off when starting the fleet or on the fleet's page, which takes
    the lines out again.
  - **FAT link:** share the link in fleet chat; pilots open it and tick their characters that flew. It can close
    after 15 minutes to 2 hours, or stay open until the fleet ends. Once a fleet has been tracked, the link only
    takes characters ESI saw in the in-game fleet this round (who already have their FAT), so nobody can register
    characters that weren't there; for fleets that aren't tracked it takes any of the pilot's own characters.
  - **FAT rounds:** start another round on the fleet's page (e.g. every hour of a long op), at least 15 minutes
    after the last. Each round is one more FAT: while tracking, everyone in the in-game fleet gets it straight away
    and anyone joining during the round gets it too. FATs added by hand or from the link go to the current round.
  FCs can also add or remove pilots by hand, read the fleet right away, and end the fleet. Tracking always uses one
  of your own characters, managers included. Once a fleet has ended, only managers can change its type.
- **Attendance** (permission `fleets.manage_fleets`): FATs per member over 30 days, 90 days or a year, by fleet
  type, with a CSV (FATs and fleets). Managers can edit and delete any fleet and manage fleet types.
- **Group rule "Fleet attendance (FATs)":** at least N FATs in the last D days (one per fleet, or per FAT round),
  optionally only some fleet types and only fleets with at least a number of pilots. Two characters of one member in
  the same round count once, and
  FATs someone added by hand for their own characters don't count (so an FC can't hand themselves attendance). Use it for group requirements or smart groups under
  Administration → Groups.

Events for webhooks: `fleets.created`, `fleets.ended`.
