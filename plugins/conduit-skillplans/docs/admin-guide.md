# Skill Plans — Admin guide

Skill Plans lets leadership publish shared skill plans and lets every member keep personal ones. Each plan shows every
character's progress and training time and copies into the game. Officers can see every member's progress on a shared
plan, and a group rule lets groups require a finished plan.

## Requirements

| Requirement | Detail |
|---|---|
| EvE Conduit | 0.5.14 or newer (`min_conduit`) |
| Other plugins | None |
| ESI scopes | None of its own. Skills, attributes and the skill queue come from the core character sheet, which uses the skill scopes every character grants at sign-in. |
| Corp roles | None |

## Installing and switching it on

1. Go to **Administration → Plugins → Browse**.
2. Find **Skill Plans** (category Character) and install it.
3. Enable it.

Once enabled, every member gets **Skill Plans** in the sidebar and the **Skill plans** dashboard widget.

## Permissions

Everyone can see shared plans and make personal plans. Two permissions add more:

| Permission codename | What it allows | Suggested group |
|---|---|---|
| `skillplans.manage_plans` | Create, edit and delete shared plans; switch **Shared** on or off for a plan. | Directors, or a doctrine/training team |
| `skillplans.view_progress` | Open **Members** on a shared plan: every member's progress, and the CSV. | Directors, HR, fleet leadership |

Both appear in the director tier of the Administration permission picker.

## Setting up shared plans

There are no settings pages. Setup is making plans.

1. Open **Skill Plans** and click **New plan**.
2. Enter **Name**, and optionally **Category** (free text such as Doctrines, Industry, New players) and
   **Description**.
3. Switch **Shared** on. Shared plans are seen by everyone and can be used by group rules.
4. Add skills with **Paste from EVE**, **Add a skill**, or **Add everything a ship or module needs**. Prerequisites are
   added automatically, in training order.
5. Click **Save plan**.

Limits: names are up to 120 characters, categories up to 50, descriptions up to 4000. A plan can hold at most 1500
skill levels. Levels go from 1 to 5.

To turn a personal plan into a shared one, a manager edits it and switches **Shared** on. Members cannot share plans.

## Members' progress

1. Open a shared plan and click **Members** (needs `skillplans.view_progress`).
2. The page shows **Finished**, **Still training** and **Finished share**, then a table of every member with
   **Best character**, **Progress** and **Time left**.
3. Filter with the search box ("Member or character") and the **Show** switch (All, Training, Finished).
4. Click **CSV** to download `skill-plan-<id>.csv` with Member, Best character, Percent, Complete and Hours left.

Each member's best character is the one closest to finishing. The character is only named when it is the member's
main, or when your own character sheet permissions let you see it. Otherwise it shows as "An alt", so the list does
not reveal who owns which alt.

## Group rule

The plugin adds the rule **Completed skill plan** (category Character) for group requirements and smart groups.

| Parameter | Choices | Default |
|---|---|---|
| Skill plan | Shared plans only | — |
| On | main, any or every character | any |

It passes when every skill of the plan is trained to its level, using the character sheet's synced skills. Example: a
"Ferox ready" smart group that fills itself.

If a shared plan is deleted, rules that use it stop passing. The confirm dialog warns about this.

## Integration with other plugins

`POST /api/p/skillplans/plans` with `{"name", "description", "skills": [[skill_id, level], ...], "shared": false}`
creates a plan (prerequisites added) and returns it with its `id`. Its page is `/p/skillplans/<id>`. Doctrines uses
this for "Save as skill plan".

## Webhooks and Discord

Skill Plans sends no webhook events and no notifications.

## Audit log

Changes to shared plans are recorded in the audit log:

| Action | When |
|---|---|
| `skillplans.create` | A shared plan is created |
| `skillplans.edit` | A shared plan is changed |
| `skillplans.delete` | A shared plan is deleted |

Personal plans are not audited.

## Background jobs

None. Progress is worked out when a page is opened, from the character sheet's synced skills.

## Troubleshooting

**Members' progress is low or characters show "(not synced)".** The character sheet has not synced those characters'
skills yet. Check their logins on the character sheet.

**Members see "Leadership hasn't shared any plans yet."** No plan has **Shared** switched on.

**"Only skill plan managers can share plans".** The user lacks `skillplans.manage_plans`.

**"A plan can have at most 1500 skill levels".** Split the plan.

**Training times differ from the game.** They are estimates from current attributes and implants and do not account
for remaps or boosters.
