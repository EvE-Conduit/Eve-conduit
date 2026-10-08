# Mentoring

New members get a mentor to show them the ropes, with goals to work through together.

- **Asking for a mentor** (every member): pick what you want help with (PvP, PvE, Industry, Mining... the list is
  configurable), when you play and a note, then ask for one of the mentors with free places by name, or anyone.
  Mentors are told (just the one asked for, or every active mentor), and the `mentors.requested` event fires.
- **Mentors** (permission `mentors.mentor`): a profile new members see (about you, when you play, focus areas, how
  many mentees at most, and a switch to pause), their mentees with goal progress, and the waiting list, those who
  asked for you first, with a "Matching my focus" filter. **Take them on** makes you their mentor
  (`mentors.assigned`). A dashboard widget shows your mentees and how many are waiting.
- **The mentorship** (mentee, mentor, program managers): the goals checklist with progress, a message thread, private
  notes only mentors and managers see, the mentee's characters and, while it's active, their full character sheets
  for the mentor (a setting, on by default; every look is in the snooper log). The mentor **graduates** them (they're
  congratulated, `mentors.graduated`) or **ends** it with a reason. The page suggests graduating once every goal is
  done. Mentees can withdraw while they're still waiting, and ask again after a mentorship is over.
- **Goals** are the same for every mentee. A goal with a group rule set ticks itself as soon as the rules pass:
  skill points, fleets flown (Fleets plugin), a skill plan finished (Skill Plans), a doctrine they can fly
  (Doctrines), Discord linked, or any other rule. The others are ticked by the mentor, or by the mentee if the goal
  allows it. A new site starts with a few: meeting your mentor on comms, setting your home station and clone, your
  first fleet (ticks itself with the Fleets plugin) and 5 million skill points.
- **Settings** (Mentoring → Settings, permission `mentors.manage_program`): every mentorship by status, mentors and their load, average
  wait and time to graduate, assigning or handing a mentee to another mentor (also over their limit), goals and
  focus areas. Setting a goal's rules, or **Who counts as new** (members who match and never had a mentor are invited
  on the dashboard), uses the group rule editor and so needs `site.manage_access` as well.

Group rules for smart groups and Discord roles: **Mentoring status** (being mentored, waiting for a mentor or
graduated), e.g. for a "New bro" role, and **Is an active mentor**. Ctrl+K finds mentees for mentors and program
managers. Notifications use the **Mentoring** category.
