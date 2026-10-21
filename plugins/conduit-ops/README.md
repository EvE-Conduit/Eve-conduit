# Ops Calendar

CTAs, stratops, roams, mining ops and everything else on one calendar in EVE time, counting down live, with who's
coming (and in what), reminders before form-up and Discord pings.

- **The calendar** (every member): upcoming ops by EVE day, each with a live countdown (red in the last 15 minutes,
  "Live" while it runs), the form-up time in EVE time and your own time zone, how long it runs, the kind (CTA,
  stratop, roam, home defense, mining, training, social, other), the FC, the doctrine, the form-up location and comms.
  Open a row for the details and who answered. **Calendar** shows a month at a time; **Recent** keeps finished and
  cancelled ops for a while (14 days by default). Ctrl+K search finds upcoming ops by title, form-up, FC or doctrine,
  and a dashboard widget shows the next few with your answer.
- **Answering:** *Going*, *Maybe* or *Can't*, with the character you'll bring (your main unless you pick another) and a
  short note for the FC ("logi if needed"). Everyone sees who's going; the FC and people who can change the op also
  see the characters, the notes and who can't come.
- **Who it's for:** every member, or only people in some states or groups (like announcements). Others don't see it,
  aren't told and can't answer.
- **Scheduling** (permission `ops.schedule_ops`): title, kind, form-up time in EVE time, how long it runs, the FC
  (picked from the site's members, or a name typed for someone who isn't on it), form-up location, comms, doctrine and
  details. FCs change and cancel the ops they made or lead; `ops.manage_ops` changes anyone's. The audience is told
  under the bell when an op is posted (switch it off per op); webhooks always hear about it. An op marked **Everyone
  is expected** notifies and reminds its whole audience, even people who muted ops.
- **Doctrines:** with the Doctrines plugin installed and on, the doctrine is picked from its doctrines and members
  can open it from the op. Without it, the doctrine is a name typed in.
- **Moving and cancelling:** moving an op tells everyone who said going or maybe, and its reminders go out again.
  Cancelling tells them too and leaves the op crossed out on the calendar. Deleting removes it without a word, for
  mistakes.
- **Ping Discord:** switch it on for an op (it's on by default when everyone is expected) and Discord webhooks that
  ping (Administration → Integrations: `@here`, `@everyone` or a role, set to *when the event asks*) mention that when
  the op is posted, moved, reminded and cancelled. With the Discord plugin linked to your server you also pick roles
  per op, with defaults in the settings.
- **Reminders:** at the minute marks in the settings (1 hour and 15 minutes by default; from 1 day down to 5 minutes),
  people who said going or maybe get a notification, and `ops.reminder` goes to webhooks.
- **Settings** (permission `ops.manage_ops`): the reminder marks, the Discord roles new ops ping, and how long finished
  ops stay on the Recent list.

**Events** (Administration → Integrations): `ops.created`, `ops.updated`, `ops.cancelled` and `ops.reminder`, each
with the title, kind, `starts_at`, `duration_minutes`, FC, form-up, comms and doctrine. Ops for some states or groups
only go out as `ops.created_restricted`, `ops.updated_restricted`, `ops.cancelled_restricted` and
`ops.reminder_restricted` (with `audience`), since webhooks often post where anyone can read: send those to a
leadership channel, or nowhere. The notification category is *Ops* (`p.ops`). Needs EvE Conduit 0.5.51.

## Development

```
cd backend && python -m pytest -q -c pyproject.toml --rootdir . ../plugins/conduit-ops/tests
cd plugins/conduit-ops/frontend && npm run build   # writes conduit_ops/static/conduit_ops/plugin.js
```
