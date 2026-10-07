# Skill Plans

What to train and in what order, with each character's progress and training time, copied straight into the game.

- **Plans** (everyone): shared plans from leadership and your own personal plans. A plan lists every skill level in
  training order, with prerequisites first. Each of your characters shows how far it is (trained, in the skill queue,
  still to train) and how long the rest takes with its current attributes and implants.
- **Copy for EVE:** copies the plan (or only what the chosen character still needs) as one `Skill Name 4` line per
  level. In the game, open **Skill Plans** (or the skill queue) and import from the clipboard.
- **Making plans:** paste a skill plan or skill queue copied from the game (`Gunnery 4` or `Gunnery IV`, one per line;
  lines that aren't skills are listed), add skills one by one, or add everything a ship or module needs. Missing
  prerequisites are added for you. Reorder and remove levels, and copy any plan into your own plans to change it.
- **Shared plans** (permission `skillplans.manage_plans`): plans everyone sees, with an optional category (Doctrines,
  Industry, New players...).
- **Members' progress** (permission `skillplans.view_progress`): for a shared plan, every member's character closest
  to finishing it, with time left, and a CSV.
- **Group rule:** *Completed skill plan* (on the main, any or every character) for group requirements and smart groups,
  e.g. a "Ferox ready" group that fills itself.
- A dashboard widget shows the shared plan you're closest to finishing, and Ctrl+K finds plans by name.

The skills, attributes and skill queue come from the character sheet, which syncs them with the skill scopes every
character already grants when it signs in. Training times are estimates: they use the attributes ESI reports now
(implants included) and don't plan for remaps or boosters.

**For other plugins:** `POST /api/p/skillplans/plans` with `{"name", "description", "skills": [[skill_id, level], ...],
"shared": false}` creates a plan (prerequisites added) and returns it with its `id`; its page is `/p/skillplans/<id>`.
Doctrines uses it for "Save as skill plan".
