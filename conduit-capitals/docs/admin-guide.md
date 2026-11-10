# Capital Registry — Admin guide

Capital Registry lists who can fly and who owns each capital class, where the hulls are parked, and each
character's jump skills, clones and jump fatigue. Members mark their hulls available for ops. Fleet commanders and
directors see everyone in the registry. The plugin reads only data the core already syncs for character sheets
(skills, assets, and clones from the overview section). It makes no ESI calls of its own and has no settings or
background jobs.

## Requirements

| Item | Value |
|---|---|
| EvE Conduit version | 0.5.52 or newer |
| Other plugins | None |
| ESI scopes it adds | None. It uses the character sheet's `esi-skills.read_skills.v1`, `esi-assets.read_assets.v1` and `esi-clones.read_clones.v1`. |
| Corporation roles | None |
| Static data | The SDE must be imported. Without it the registry shows "No capital hulls in the static data". |

## Install and switch it on

1. Go to Administration → Plugins → Browse.
2. Find **Capital Registry** (category Military) and install it.
3. Enable the plugin.
4. Give the registry permission to the people who need it (see below).

## Permissions

| Permission codename | What it allows | Suggested group |
|---|---|---|
| (none) | **My capitals**: a member's own characters, and marking their hulls available. Every member has this. | Everyone |
| `capitals.view_registry` | The **Registry** page and the **Capitals** dashboard widget. | Fleet commanders, directors |

`capitals.view_registry` alone shows nothing useful. The registry only covers characters the viewer may read through
a character sheet permission. Give one of these as well:

- `sheet.view_corporation_characters`
- `sheet.view_alliance_characters`
- `sheet.view_all_characters`

Assign permissions under Administration → Groups.

## Using the registry

Open **Registry** in the sidebar. The header says how many characters you may view. Filter with **Every
corporation**, **Every state** and **Every group**. There are three tabs:

- **By class**: a card per class with **Pilots** (characters who can fly it, and how many members), **Owned** (hulls
  owned, and by how many members) and **Available** (hulls marked available, and how many are marked not available).
  Each hull shows "can fly · owned" counts. Press **Pilots →** or the class name to open the class page.
- **Class page**: every character who can fly or owns a hull of the class, owners first, with the hulls they can fly
  and the hulls they own, where they are, and their availability. A warning lists characters without synced skills;
  they may fly the class too.
- **By location**: where hulls are parked, with **Hull**, **Pilot**, **Where** and **For ops** columns. Filter with
  **Every class** or one class.
- **By member**: one row per member with "can fly · owned" counts per class, and a **Data** column (**OK** or
  "N not synced"). Click a member to see all their characters you may view, laid out like **My capitals**.

A **Some characters can't be judged** warning shows how many characters have skills or assets that are missing or
older than two days.

## Group rules

The plugin adds two rules in the **Capitals** category for smart groups and group requirements.

**Can fly a capital** (`capitals_can_fly`)

| Parameter | Default | What it does |
|---|---|---|
| Class | Any capital | One class, or any capital. |
| On | any character | `main character`, `any character` or `every character`. |

It compares synced skills against the required skills of every hull of the class. Characters without synced skills
can't fly anything.

**Owns a capital** (`capitals_owns`)

| Parameter | Default | What it does |
|---|---|---|
| Class | Any capital | One class, or any capital. |
| At least | 1 | Number of hulls (1 to 1000). |
| On | any character | `main character` or `any character`. |
| Leave out hulls marked not available for ops | Off | Hulls the member marked **Not available** don't count. |

It uses synced assets, assembled or packaged, wherever they are. Characters without the assets scope count as owning
nothing.

## Webhook events and Discord pings

None.

## Privacy and audit logging

- What the registry tells about someone else's character goes in the snooper log under the character sheet section
  it came from, the same as opening that tab of their sheet: `assets` for their hulls and where they are parked,
  `skills` for which capitals they can fly, and `overview` for where the character is, its home station, jump clones
  and jump fatigue.
- A class page logs `skills` and `assets` for the characters listed, the **By location** tab `assets`, the
  **By member** list `skills` and `assets` for the characters it counts, and a member's page `skills` and `overview`
  for every character on it (and `assets` for those with a hull).
- The **By class** summary and the dashboard widget show totals only and are not logged.
- Members' availability answers are not audit logged.

## Background jobs

None. The data is as fresh as the character sheet sync. It is flagged as stale after two days without a good sync.

## Troubleshooting

**The registry is empty.**
Check that you have a character sheet permission as well as `capitals.view_registry`, and that the filters are not
too narrow.

**"No capital hulls in the static data".**
Import the SDE. Hulls are every published ship in the capital ship groups, so new hulls appear with the next import.

**Many characters are flagged.**
Point at a flag to see the reason. "Login doesn't allow it" means the member must log in again with the missing scope.
"Login stopped working" means their token is invalid.

**A member says their hull is missing.**
Check their **Assets** flag on the **By member** page. Hulls in asset safety or item deliveries are shown with that
location in a warning colour.
