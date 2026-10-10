# Timers

Structure and sovereignty timers on one board, counting down live, with who's going and reminders before each one
comes out. Timers for your own structures arrive by themselves.

- **The board** (every member): upcoming timers by EVE day, each with a live countdown (red in the last 15 minutes,
  "Out now" for the hour after), the time in EVE time and your own time zone, the structure with its type icon, the
  system with its security and region, the owner, the timer kind (armor, hull, anchoring, unanchoring, sovereignty,
  moon extraction, other) and whose it is (ours, hostile, neutral). Open a row for the notes, who's going and where
  the timer came from. Timers that came out move to **Came out** and drop off after a while (14 days by default).
  Ctrl+K search finds timers by structure, system or owner, and a dashboard widget shows the next few.
- **Going:** press *Going?* on a timer and you're counted (everyone sees the names) and reminded before it comes out.
- **Adding timers** (permission `timers.manage_timers`): start typing the structure's name, its system (`4-HWWF`) or
  its type, and the structures the site knows by name are offered (from members' assets, contracts, mail and
  notifications, and the corporation sheet; the same list Buyback uses), your own corporation's and alliance's first.
  Pick one and its name, type, system and owner are filled in; for your own, the side too, and when the corporation
  sheet has it reinforced, anchoring or unanchoring, the timer kind and time as well. With nothing to pick, just keep
  typing and fill in the rest: its type (the usual Upwell structures,
  customs offices and sovereignty structures are offered; anything can be typed), the system (found by typing),
  owner, kind and side, notes, and when it comes out: either the time left as the game shows it (`1d 4h 23m`,
  `4h23m`, `45m`, `4:23`), counted from the moment it's typed, or an exact time in your own zone. Members are told
  under the bell when a timer is added (switch it off per timer); webhooks always hear about it. A timer marked
  **Everyone is expected** notifies and reminds every member, even those who muted timers.
- **Ping Discord:** switch it on for a timer (it's on by default when everyone is expected) and Discord webhooks
  that ping (Administration → Integrations: `@here`, `@everyone` or a role, set to *when the event asks*) mention
  that when the timer is added, moved and at every reminder. With the Discord plugin linked to your server you also
  pick roles per timer (the capital pilots for a hull timer, say), with defaults in the settings. Deleting a timer
  never pings. Needs EvE Conduit 0.5.36.
- **Reminders:** at the minute marks in the settings (1 hour and 15 minutes by default; pick from 1 day down to 5
  minutes), people who are going get a notification, and the `timers.reminder` event goes to webhooks such as Discord.
  A timer that's moved gets its reminders again.
- **From your structures:** every five minutes, the corporation sheet's structures that are reinforced (armor or
  hull), anchoring or unanchoring get a timer on the board, named and typed from the structure itself and owned by
  the corporation. If a later sync moves the timer, the board follows.
- **From in-game notifications:** characters' notifications (`esi-characters.read_notifications.v1`, synced by the
  character sheet) are read for *structure lost shields* (armor timer), *structure lost armor* (hull timer), skyhooks,
  anchoring and unanchoring, *sovereignty structure reinforced* (TCU, IHub) and *customs office reinforced*. The
  same notification seen by several members makes one timer. Both sources can be switched off in the settings, and
  **Check now** runs them straight away.
- **Settings** (permission `timers.manage_timers`): the reminder marks, the two automatic sources, the Discord roles new
  timers ping, and how long past
  timers stay on the board.

**Events** (Administration → Integrations): `timers.created`, `timers.updated`, `timers.deleted` and
`timers.reminder`, each with the structure, type, system, kind, side, owner and `ends_at`. The notification category
is *Timers* (`p.timers`).

## Development

```
cd backend && python -m pytest -q -c pyproject.toml --rootdir . ../plugins/conduit-timers/tests
cd plugins/conduit-timers/frontend && npm run build   # writes conduit_timers/static/conduit_timers/plugin.js
```
