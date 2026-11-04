# Industry Projects — Admin guide

Industry Projects is a corp build board. Managers post projects with the items they need. Members claim parts, build
them, mark them delivered, and a manager confirms each delivery. Confirming can pay Corp Store points. Members'
industry jobs for a claimed item are shown as a hint, never as proof.

## Requirements

| Requirement | Details |
| --- | --- |
| EvE Conduit | 0.5.55 or newer (`min_conduit = "0.5.55"`). |
| Other plugins | None required. **Corp Store** (`store`) pays the points on confirmed deliveries. The Discord plugin is optional, for picking roles to ping. |
| ESI scopes | None of its own. The industry job hint uses the industry jobs the core already reads for character and corporation sheets (`esi-industry.read_character_jobs.v1`, `esi-industry.read_corporation_jobs.v1`). |
| Corporation roles | None. |
| Static data | Item search and pasted lists use the site's static data (SDE). Blueprints aren't in it, so work out the parts in game. |

## Install and switch on

1. Go to **Administration → Plugins** and open the **Browse** tab.
2. Tick **Industry Projects**. Leave **Switch on after installing** on.
3. Click **Install 1** and confirm. If the site can't install plugins itself, click **How to install** and follow
   the server instructions instead.
4. If the plugin is installed but off, switch it on in the **Installed** tab.

The sidebar then shows **Projects** and **My contributions** to members, and **Deliveries** to managers.

## Permissions

Give the permission to a state (**Administration → States**) or a group (**Administration → Groups**).

| Permission | What it allows | Suggested for |
| --- | --- | --- |
| `projects.manage_projects` | Start, edit, close, reopen and delete projects; add and change items; see every project whatever its audience; confirm or send back deliveries; see the **Deliveries** page; set **Discord pings**. | Directors / industry officers |

Claiming, delivering and **My contributions** need no permission. Who sees a project is set per project.

## Start a project

1. Open **Projects** and click **New project**.
2. Fill in the form and click **Start project**.
3. On the project page, click **Add items** (see below).

| Field | Default | What it does |
| --- | --- | --- |
| Name | (required) | Up to 120 characters. |
| Deliver to | empty | Where members drop what they built, e.g. "Corp hangar, staging Keepstar". Shown to members when they deliver. |
| Deadline (EVE time) | empty | Optional. Shown as "due ..."; open projects are sorted by deadline. Nothing happens automatically when it passes. |
| Details | empty | Free text shown under the title. |
| Who it's for | nothing picked | States and groups. Nothing picked: every member. Otherwise only people in one of them see it and are told. Managers always see every project. |

When a project starts, everyone it is for (except you) gets a notification, and `projects.created` is sent.

## Add items

Click **Add items** on an open project. Choose **One item** or **Paste a list**.

- **One item**: search by name (2+ letters), pick it, enter **How many**.
- **Paste a list**: paste the materials list from the in-game Industry window, an inventory, or lines like
  `Tritanium x 1000`, `1000 x Tritanium`, `1000 Tritanium` or `Tritanium 1000`. Up to 500 lines are read. Lines
  without a number count as 1. Names that aren't recognised are listed in a warning ("Not recognised: ...").

For both:

| Field | Default | What it does |
| --- | --- | --- |
| Points per unit | 0 | Corp Store points for each unit delivered (0 to 1,000,000). One confirmed delivery pays at most 1,000,000 points. |
| ISK per unit | 0 | Only shown. Paying it is up to you. |

Adding an item that is already in the project adds to its quantity. A project holds up to 200 items.

## Change or remove an item

Click the pencil icon next to an item.

- **How many** can't go below what is already claimed or delivered.
- **Points per unit** can't change while a delivery of that item is waiting for a manager. Confirm or send it back
  first.
- **Remove** only works when nobody has ever claimed the item. Otherwise lower what is needed instead.

## Confirm deliveries

When a member marks a claim delivered, every manager except that member gets a notification. To check deliveries:

1. Open **Deliveries** in the sidebar. **Waiting for you** lists deliveries on open projects, oldest first, with the
   member's note and the industry job hint. **Every open claim** lists all open claims.
2. Check in game that the items are where the project says.
3. Click **Confirm**, or **Send back** and give a reason in **Why** (default reason: "Not found where you said").

You can also do this on the project page. Rules:

- Only a delivery the member marked delivered can be confirmed. (The **Confirm** button also shows on claims that
  are still **Building**; the site refuses those.)
- You can't confirm your own delivery: another manager has to, because confirming pays points.
- Deliveries on a closed project can't be confirmed. Reopen it first.

Confirming notifies the member, sends `projects.contribution_delivered` (the Corp Store pays its `points`), and
writes to the audit log. When every item has all it needs confirmed, the project closes as done by itself.

## Close, reopen or delete a project

- **Close as done**: contributors with confirmed deliveries are told. Claims that weren't delivered stay as they are.
  Sends `projects.completed`.
- **Cancel**: nobody can claim anything more. No notification.
- **Reopen**: shown on a closed project.
- **Delete project**: only shown while nobody has claimed anything.

## Webhook events and Discord pings

| Event | When | Payload |
| --- | --- | --- |
| `projects.created` | A project is started. Alert: can ping on Discord. | `project_id`, `project`, `by`, `link` |
| `projects.contribution_delivered` | A manager confirms a delivery. | `user_id`, `user`, `project_id`, `project`, `contribution_id`, `item`, `type_id`, `quantity`, `points`, `link` |
| `projects.completed` | A project gets everything it needs, or is closed as done. | `project_id`, `project`, `contributors`, `link` |

Each event also carries `title`, `summary` and `level` for webhook messages.

- Send events to Discord or elsewhere under **Administration → Integrations**.
- To ping on new projects, open **Deliveries** and switch on the alert under **Discord pings**. This section only
  shows once a Discord webhook exists. With the Discord plugin linked you can also pick roles.

## Privacy and audit log

Everyone who can see a project sees who claimed and delivered what, and the contributors list. The industry job
hint is shown only to the member and to managers.

Written to the audit log (**Administration → Logs → Audit**): `projects.saved` (started or changed),
`projects.items_added` (pasted list), `projects.confirmed`, `projects.rejected`, `projects.completed`,
`projects.cancelled`, `projects.reopened` and `projects.deleted`.

## Background jobs and group rules

The plugin has no background jobs and adds no group rules. The industry job hint reads job data the core keeps up to
date for character and corporation sheets.

## Troubleshooting

**Members don't see a project.** Check **Who it's for** in **Edit**. Members only see projects for their state or
one of their groups, or projects with nothing picked.

**"Points are paid by the Corp Store plugin, which isn't switched on."** Install and switch on Corp Store, or set
points to 0.

**"Another manager has to confirm your own delivery".** Ask another manager.

**"This project is closed; reopen it to confirm deliveries".** Click **Reopen**, confirm, then close it again.

**"Members have claimed parts of this project; close it instead of deleting it".** Use **Cancel** instead.

**No industry job hint.** The member's characters need the industry job scope, and the job must make that exact item
and have started after the claim. Corporation jobs count only when the member installed them.
