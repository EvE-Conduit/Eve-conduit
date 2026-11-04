# Doctrines — User guide

Doctrines lists the fleet doctrines and ship fits your FCs have set up. Each fit is shown like the in-game fitting
window. You can copy a fit into the game, save it straight to your in-game fittings, and see which of your characters
can fly it and which skills they are missing. Skills come from your characters' synced skills on the character sheet.

## Where to find it

- Open **Doctrines** in the sidebar.
- Press Ctrl+K and type a doctrine name, fit name or ship name.
- The **Doctrines** dashboard widget shows "Doctrine fits you can fly", for example 4 / 9. It counts fits in active
  doctrines only.
- On a character sheet, the **Doctrines** tab lists the fits that character can fly.

## The Doctrines page

There is one card per doctrine, with its ships and how many of its fits you can fly. Retired doctrines are dimmed,
marked **Retired** and listed last. Fits that are not in any doctrine are listed below under **Other fits**.

Open a doctrine to see its fits, grouped by role (DPS, Logistics, Tackle and so on). Each fit shows the status of
your best character:

| Badge | Meaning |
|---|---|
| **Ready** | Has the required skills and the FCs' recommended skills. |
| **Can fly** | Has the required skills. Point at it to see how long the recommended skills take. |
| **N skills · time** | Missing N required skills, and the training time. |
| **Skills not synced** | Your skills haven't synced, so the status can't be worked out. |
| **No characters** | You have no characters. |

## A fit

The fit page shows the ship in a fitting ring, like the game's fitting window:

- high slots across the top, mid slots down the right, low slots along the bottom, rigs lower left, subsystems upper
  left;
- loaded ammunition just outside its module;
- offline modules dimmed and empty slots shown;
- point at a module to see its name.

Switch between **Fitting** and **List** to see the fit as a ring or a plain list. Beside it you see CPU, powergrid and
calibration use, the drone bay, cargo and the estimated value. Switch between **Skills at V** and **No skills** to see
fitting use with CPU Management, Power Grid Management, Weapon Upgrades and Advanced Weapon Upgrades at V, or with no
skills. If the FCs left notes, they are shown under **Notes from the FCs**.

### Copy a fit into the game

1. Open the fit.
2. Press **Copy to paste in game**.
3. In the game, open the Fitting window and press **Import from clipboard**.

The same text works in Pyfa. Press **Show as text** to see the text and copy it yourself.

### Save a fit to your in-game fittings

1. Open the fit.
2. Press **Save to my fittings in EVE**.
3. Pick a **Character** and press **Save**.

Loaded ammunition goes in the cargo. The character's login needs `esi-fittings.write_fittings.v1`. If no character
has it, the dialog says so: log in again under Characters → Add character.

### Check the skills you need

The **Skills** section lists what the ship, modules, ammunition and drones need, with prerequisites, plus the FCs'
recommended skills.

1. Under **Your characters**, pick a character.
2. The list shows the missing skills, each marked **Required** or **Recommended**, with training time. Skills already
   in the training queue are marked **In queue**. Training time uses the character's attributes and implants.
3. Press **Copy skill plan for EVE**. In the game, go to Skills → Skill plans → Import from clipboard, or paste it into
   the skill queue.
4. If the Skill Plans plugin is switched on, you can press **Save as skill plan** to make a plan there instead.

If the character already has everything, the section says so.

## Notifications

Doctrines sends no notifications to members.

## FAQ and troubleshooting

**A fit says "Skills not synced".**
Your character's skills haven't synced yet. Once the character sheet syncs them, the status appears.

**I trained a skill but the status didn't change.**
The status uses the last skill sync. Wait for the next sync of your character sheet.

**"hasn't allowed saving fittings".**
Log in with that character again under Characters → Add character, and allow saving fittings.

**"The game refused the fit (it may already have 500 fittings saved)".**
The character has reached the in-game fitting limit. Delete some fittings in the game and try again.

**"Your browser didn't allow copying".**
Use **Show as text**, select the text and copy it yourself.
