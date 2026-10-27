# Capital Registry

Who can fly and who owns each capital class, where the hulls are parked, and who is ready to jump.

- **Capital classes:** Carrier, Dreadnought, Lancer Dreadnought, Force Auxiliary, Supercarrier, Titan, Capital
  Industrial (Rorqual) and Jump Freighter. The hulls are every published ship in those static data (SDE) groups, so new
  hulls show up with the next SDE import.
- **Can fly** comes from each character's synced skills against the hull's required skills, like Member Audit's skill
  check and the Doctrines plugin. **Owns** comes from the synced assets, assembled or packaged, with where the hull
  is: the station or structure (or in space), system and region, and whether it's in the hangar, in another ship's
  maintenance bay (a carrier in a titan), in asset safety or in item deliveries.
- **Jump readiness:** Jump Drive Operation, Jump Drive Calibration, Jump Fuel Conservation and Infomorph
  Synchronizing levels, the home station and jump clones (with implant counts), when the next clone jump is
  possible, jump fatigue, and where the character is now (and whether it's sitting in a capital).
- **Stale or missing data is flagged:** a character whose skills, assets or clones haven't synced for two days, whose
  login lacks the scope or stopped working, or whose sync fails, gets a badge, so they aren't quietly counted as
  flying or owning nothing.
- **My capitals** (every member): their own characters, and for each hull they own or can fly, **available for
  ops** / **not available** with a note, which fleet commanders see in the registry.
- **Registry** (permission `capitals.view_registry`): by class (pilots and members who can fly each class and hull,
  how many are owned, and how many are marked available), by location (where the hulls are parked, filterable by
  class) and by member (each member's characters per class, opening all their alts' capitals). Filter by
  corporation, state and group. It only covers the characters the viewer may read through the character sheet
  permissions (`sheet.view_corporation_characters`, `sheet.view_alliance_characters` or `sheet.view_all_characters`),
  and seeing where someone's hulls are goes in the snooper log like opening their assets. A dashboard widget shows the
  counts per class.
- **Group rules:** "Can fly a capital" (a class or any capital, on the main, any or every character) and "Owns a
  capital" (at least N of a class, on the main or any character, optionally leaving out hulls marked not available),
  for smart groups and requirements.

Uses only data the core already syncs for character sheets (skills, assets, and clones from the overview section);
it adds no ESI calls of its own. Needs EvE Conduit 0.5.52 or newer. Give `capitals.view_registry` to your fleet
commanders or directors under Administration → Groups, together with a character sheet permission.
