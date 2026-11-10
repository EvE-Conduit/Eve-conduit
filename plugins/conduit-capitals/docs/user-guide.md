# Capital Registry — User guide

Capital Registry shows which capital ships your characters can fly and which ones they own. It also shows where the
hulls are parked and how ready each character is to jump. You can mark each hull as available for ops or not, with a
note. Fleet commanders see that answer in the registry, so they know whom to ask. Everything comes from data EvE
Conduit already syncs for your character sheet. The plugin makes no ESI calls of its own.

## Where to find it

Open **My capitals** in the sidebar. Every member can see this page. It lists only your own characters.

## What the page shows

There is one card per character. Each card has these sections:

- **Owned capitals**: every capital hull in the character's synced assets, assembled or packaged. Each row shows:
  - the hull, its in-game name, and a **Packaged** badge (with a count) if it is packaged;
  - the station, structure or system, with its region;
  - where it sits there: in the ship hangar, in another ship's maintenance bay, in asset safety, in item deliveries,
    inside another item, or in space;
  - **Can't fly it yet** if the character owns the hull but lacks the skills.
- **Can fly**: the capital hulls the character has the required skills for, grouped by class.
- **Jump skills**: the levels of Jump Drive Operation, Jump Drive Calibration, Jump Fuel Conservation and Infomorph
  Synchronizing. Below them:
  - **Now:** where the character is, and the ship if it is sitting in a capital;
  - **Jump fatigue for ...** if the character has jump fatigue;
  - **Next clone jump in ...** or **Clone jump ready**.
- **Clones**: the home station and every jump clone, with its name and how many implants it has.

The capital classes are Carrier, Dreadnought, Lancer Dreadnought, Force Auxiliary, Supercarrier, Titan, Capital
Industrial and Jump Freighter.

## Mark a hull available for ops

You can mark a hull your character owns, or a hull it can fly.

1. Open **My capitals**.
2. Find the hull:
   - for an owned hull, press **Availability** on its row under **Owned capitals**;
   - for a hull you can fly but don't own, click the hull under **Can fly**.
3. Pick **Available for ops**, **Not available** or **Not said**.
4. Optional: write a note (up to 300 characters), for example "weekends only" or "needs a refit".
5. Press **Save**.

Your answer is stored per character and hull. It stays when the hull is repackaged or the assets sync again. Pick
**Not said** to clear it. Owned hulls you marked show an **Available for ops** or **Not available** badge. Point at
the badge to see your note.

## Badges for missing or old data

A character card shows a red or yellow badge for **Skills**, **Assets** or **Clones** when that data can't be trusted.
Point at the badge to see why:

| Badge text | What it means |
|---|---|
| Not synced for two days | No successful sync of this data for two days. |
| Login doesn't allow it | The character's login lacks the scope for this data. |
| Login stopped working | The character's login is no longer valid. |
| Syncing fails | The sync runs but fails. |
| Not synced yet | The data has never synced. |

While a badge is shown, the card may say "Skills not synced, so we can't tell." or "Assets not synced, so we can't
tell." The registry also flags the character, so nobody assumes you fly or own nothing.

## Who can see your capitals

Officers with the Capital Registry permission can see your characters' capitals, but only for characters they may
already view through the character sheet permissions. When they look at what you can fly, where your hulls are, or where your
characters and jump clones are, it is recorded in the snooper log, the same as opening that tab of your character
sheet.

## Notifications

Capital Registry sends no notifications.

## FAQ and troubleshooting

**A capital I own is missing.**
Check the **Assets** badge on the card. If the assets haven't synced, or your login lacks
`esi-assets.read_assets.v1`, log in with the character again under Characters → Add character.

**I can fly a hull but it isn't listed under Can fly.**
Check the **Skills** badge. The plugin needs your synced skills (`esi-skills.read_skills.v1`).

**Clones or jump fatigue are missing.**
Clones come from the overview section of the character sheet and need `esi-clones.read_clones.v1`.

**I get "neither owns nor can fly" when saving availability.**
You can only mark hulls the character owns or can fly.

**A new hull, such as a new faction dreadnought, is not shown.**
Hulls come from EVE's static data. New hulls appear after the site next imports it.
