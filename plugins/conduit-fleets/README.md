# Fleets & FATs

Records who flew in each fleet (FATs, also called PAPs) and lets groups require attendance.

- **Fleets** (everyone): recent fleets with their type, FC and pilot count, the fleets you flew in, and your FATs
  over 30 days, 90 days and all time. A dashboard widget shows the last 30 days.
- **Running a fleet** (permission `fleets.run_fleets`): start a fleet with a name, type (CTA, Stratop, Roam, Home
  defense, Mining, or your own) and notes. Pilots get a FAT in either or both of two ways:
  - **Tracking:** pick one of your characters that is fleet boss in game. Everyone in the in-game fleet gets a FAT,
    read from ESI every minute (needs `esi-fleets.read_fleet.v1`). It stops when the in-game fleet ends, the boss
    changes, after 12 hours, or when you end the fleet.
  - **FAT link:** share the link in fleet chat; pilots open it and tick the characters they flew with. It can close
    after 15 minutes to 2 hours, or stay open until the fleet ends.
  FCs can also add or remove pilots by hand, read the fleet right away, and end the fleet. Tracking always uses one
  of your own characters, managers included. Once a fleet has ended, only managers can change its type.
- **Attendance** (permission `fleets.manage_fleets`): fleets per member over 30 days, 90 days or a year, by fleet
  type, with a CSV. Managers can edit and delete any fleet and manage fleet types.
- **Group rule "Fleet attendance (FATs)":** at least N fleets in the last D days, optionally only some fleet types
  and only fleets with at least a number of pilots. Two characters of one member in the same fleet count once, and
  FATs someone added by hand for their own characters don't count (so an FC can't hand themselves attendance). Use it for group requirements or smart groups under
  Administration → Groups.

Events for webhooks: `fleets.created`, `fleets.ended`.
