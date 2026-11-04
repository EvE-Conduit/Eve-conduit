# Doctrines — Admin guide

Doctrines holds your fleet doctrines and their fits. Managers paste fits from the game or Pyfa, group them into
doctrines, and set roles, notes and recommended skills. Members see each fit like the in-game fitting window, copy
it into the game or save it to their fittings, and see the skills they are missing. Officers can see which members
can fly each fit. A group rule lets you build groups from who can fly a fit.

## Requirements

| Item | Value |
|---|---|
| EvE Conduit version | 0.5.14 or newer (for the static data fitting and skill information) |
| Other plugins | None. With the Skill Plans plugin switched on, members also get **Save as skill plan**. |
| ESI scopes it adds | `esi-fittings.write_fittings.v1` (for **Save to my fittings in EVE**) |
| Data it reads | Skills from the character sheet's skills section; saved in-game fittings from the character sheet (for **Start from one of your in-game fittings**). |
| Corporation roles | None |

Enabling the plugin adds `esi-fittings.write_fittings.v1` to the scopes the site asks for. Members must log in with
their characters again before they can save fits to the game.

## Install and switch it on

1. Go to Administration → Plugins → Browse.
2. Find **Doctrines** (category Military) and install it.
3. Enable the plugin.
4. Give the permissions below to your FCs and officers.

## Permissions

| Permission codename | What it allows | Suggested group |
|---|---|---|
| (none) | See doctrines and fits, copy and save fits, see their own skills. | Everyone |
| `doctrines.manage_doctrines` | Create, edit and delete fits and doctrines; see **All fits**; also see **Who can fly it**. | Doctrine managers, senior FCs |
| `doctrines.view_readiness` | See **Who can fly it** for each doctrine, and download its CSV. | FCs, directors |

Assign permissions under Administration → Groups.

## Add a fit

1. Open **Doctrines** and press **New fit**, or open a doctrine and press **Add fit**.
2. Paste the fit into **Fit**. Copy it in the game from the Fitting window → Copy to clipboard, or from Pyfa.
   Or pick one under **Start from one of your in-game fittings**. That list shows your own characters' saved
   fittings as last synced.
3. Check the preview on the right. Modules go into the right slots whatever order they are in.
   - **This fit can't be fitted** means the fit does not match the ship's slots, hardpoints or rig size (Strategic
     Cruisers count their subsystems). You can't save until it is fixed.
   - **Lines nobody recognised (they'll be left out)** lists lines that will be dropped.
4. Fill in **Name** (defaults to the name in the paste) and **Role** (DPS, Logistics, Tackle, Ewar, Support, Booster,
   Scout, Command, or your own text).
5. Under **Doctrines**, tick the doctrines it belongs to. This is optional. Fits not in a doctrine are listed under
   **Other fits**.
6. Write **Notes**: how to fly it, what to bring. Members see them on the fit.
7. Under **Recommended skills**, search **Add a skill…** and set a level. Pilots who have these too show as **Ready**.
8. Press **Save fit**.

To change a fit, open it and press **Edit**. To delete it, press the bin icon. Deleting removes it from every
doctrine, and group rules that use it stop matching anyone. **All fits** on the Doctrines page lists every fit with
its ship and doctrines.

## Add or edit a doctrine

1. Press **New doctrine** on the Doctrines page, or **Edit** on a doctrine.
2. Set these fields:

| Field | Default | What it does |
|---|---|---|
| Name | (required) | The doctrine's name. |
| Order | 0 | Lower comes first. |
| Description | empty | Shown at the top of the doctrine page. |
| Picture | The first fit's ship | The ship shown on the doctrine card, picked from the doctrine's fits. Shown once the doctrine has fits. |
| Active | On | Off retires the doctrine: it stays for reference, is listed last and doesn't count in the dashboard widget. |
| Fits | none | The doctrine's fits, in the order shown. Use **Add an existing fit…** and the up, down and remove buttons. |

3. Press **Save**.

Deleting a doctrine keeps its fits, so you can put them in another doctrine.

## Who can fly it

Open a doctrine and press **Who can fly it**. It shows every member against every fit of the doctrine, with their
best character's status and how many fits they can fly. Search by **Member**. Press **CSV** to download it.

A character's name is shown only if you may see that character's sheet through the core sheet permissions. This stops
readiness from revealing who owns which alt.

## Group rules

**Can fly doctrine fit** (`doctrine_can_fly`), category **Doctrines**.

| Parameter | Default | What it does |
|---|---|---|
| Fit | (required) | Any fit, in a doctrine or not. |
| Skills | required skills | `required skills`, or `required and recommended`. |
| On | any character | `main character`, `any character` or `every character`. |

It compares synced skills against what the fit's ship, modules, charges and drones need. Use it for group
requirements or smart groups, for example a Discord role for pilots who can fly the doctrine. If the fit is deleted,
the rule matches nobody.

## Webhook events and Discord pings

| Event | When |
|---|---|
| `doctrines.fit_saved` | A fit was added or changed. The message says which doctrines it is in, and links to the fit. |

Send it to a URL or Discord under Administration → Integrations. It is not an alert, so it has no Discord ping switch.

## Audit logging

These actions go in the audit log: `doctrines.fit_created`, `doctrines.fit_changed`, `doctrines.fit_deleted`,
`doctrines.created`, `doctrines.changed`, `doctrines.deleted`.

## Background jobs

None. Statuses are worked out from the latest skill sync each time a page loads.

## Troubleshooting

**Fits show no slots or skills.**
The static data must be imported. EvE Conduit 0.5.14 and later import it; an existing install imports it again by
itself after updating.

**A member can't save to the game.**
Their character needs `esi-fittings.write_fittings.v1`. They log in again under Characters → Add character.

**Everyone shows "Skills not synced".**
Members' skills haven't synced. Check the character sheet sync.
