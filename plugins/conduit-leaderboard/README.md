# Leaderboard

Who tops the corporation: members ranked by what their characters did, with a podium for every board and medals
for the top three each month.

- **Boards** (everyone): Kills, ISK destroyed, Fleets (FATs, when the Fleets plugin is on), Mining, Bounties,
  Industry, Skillpoints and Losses. Pick a month (or all time) and, with several corporations, one corporation.
  Each board shows the top places and, further down, your own place and score; open a row to see which of a
  member's characters earned it. Alts count for their main.
- **Medals** (everyone): the day after a month ends, the top three of every board get a medal and a notification.
  The hall of fame lists who has the most.
- **Hiding yourself** (everyone): the eye button takes you off every board. You still see your own figures.
- **Settings** (permission `leaderboard.manage_leaderboard`): which boards are shown, which corporations' members
  compete, how many places a board shows, whether characters are shown, and whether medals are handed out. You can
  also award last month's medals right away instead of waiting for the daily job.

Figures come from the data the core already syncs for the character sheet (killmails, mining ledger, wallet journal,
industry jobs, skills), so only characters with a working login count, and the boards follow the sheet's sync
schedule. Only members (people in a members' state) with a main character compete. Boards are cached for five
minutes.

## Development

```
cd backend && .venv/bin/python -m pytest -q -c pyproject.toml --rootdir . ../plugins/conduit-leaderboard/tests
cd plugins/conduit-leaderboard/frontend && npm run build
```
