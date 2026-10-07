# Doctrines

Your fleet doctrines and their fits, shown like the in-game fitting window, ready to copy into the game, with which
of your characters can fly each fit and what they're missing.

- **Doctrines** (everyone): a card per doctrine with its ships and how many of its fits you can fly. A doctrine
  lists its fits by role (DPS, Logistics, Tackle...), each with your best character's status: **Ready** (required and
  recommended skills), **Can fly** (required skills) or how many skills are missing and how long they take to train.
- **A fit** shows the ship in the middle of a fitting ring like the game's fitting window: high slots across the top,
  mid slots down the right, low slots along the bottom, rigs and subsystems on the left, loaded ammunition on each
  module, turret and launcher hardpoints, offline modules dimmed and empty slots shown. Point at a module for its name.
  Beside it: CPU, powergrid and calibration use (base values, without skills), the drone bay and cargo, and the
  estimated value. There's a plain list view too.
  - **Copy to paste in game** copies the fit in the game's own text format: in the game, open the Fitting window and
    press **Import from clipboard**. It works in Pyfa too.
  - **Save to my fittings in EVE** adds the fit to one of your characters' saved fittings in the game (needs
    `esi-fittings.write_fittings.v1`; loaded ammunition goes in the cargo).
  - **Skills**: what the ship, modules, ammunition and drones need, with prerequisites, plus the FCs' recommended
    skills. Pick one of your characters to see the levels they're missing and the training time with their
    attributes and implants. **Copy skill plan for EVE** copies them for the game's skill plan import or skill queue.
    With the Skill Plans plugin switched on, **Save as skill plan** turns them into a plan there.
- **Managing** (permission `doctrines.manage_doctrines`): paste a fit from the game (Fitting window → Copy to clipboard)
  or Pyfa, or start from one of your characters' saved in-game fittings. Modules go in the right slots whatever order
  they're pasted in, and the fit is checked against the ship's slots, hardpoints (Strategic Cruisers count their
  subsystems) and rig size. Lines nobody recognises are listed and left out. Set the name, role, notes and
  recommended skills, and which doctrines it's in. Doctrines have a description, picture, order, their fits in order,
  and can be retired.
- **Who can fly it** (permission `doctrines.view_readiness`, or managing): every member against every fit of a
  doctrine with their best character for each, and a CSV.
- **Character sheet:** a Doctrines tab lists the fits that character can fly, for anyone who may see the sheet.
- **Group rule** "Can fly doctrine fit": a fit, required or required + recommended skills, on the main, any or every
  character. Use it for group requirements and smart groups (e.g. a Discord role for pilots who can fly the doctrine).
- Ctrl+K finds doctrines and fits by name or ship, and a dashboard widget shows how many doctrine fits you can fly.

Skills come from the character sheet's skills section. The slot layout and skill requirements come from EVE's
static data, which EvE Conduit 0.5.14 and later import (an existing install imports it again by itself after
updating). Event for webhooks: `doctrines.fit_saved`.
