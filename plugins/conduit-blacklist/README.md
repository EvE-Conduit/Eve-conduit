# Blacklist

Characters, corporations and alliances you don't want, with notes, and a warning when one of them shows up.

- **Entries** (permission `blacklist.manage_blacklist`): add a character, corporation or alliance by its exact name
  (looked up in EVE), with a reason, a severity (**Banned** or **Watch**) and an optional expiry. Expired entries
  stop matching but stay listed under *Expired*. Changes and removals are kept in the audit log.
- **Notes:** every entry has a notes thread for everyone who can see the blacklist.
- **Warnings:** a member's or applicant's character matches when it is on the blacklist itself or is in a
  blacklisted corporation or alliance. Characters are checked when they're linked (and again a few minutes later,
  once their corporation is known), when one moves to another account, when someone applies through
  [Recruitment](../conduit-recruitment) and every hour; a new entry looks through registered members straight away.
  Each match is reported once, by notification to everyone with `blacklist.view_blacklist` (Banned ones get
  through even when the category is muted), and listed under *Warnings* until someone marks it as dealt with.
  Applying brings up that applicant's warnings that haven't been dealt with again, so give recruiters the view permission.
- **Check a name:** look up someone who hasn't registered, with their current corporation and alliance.
- **Search:** Ctrl+K finds entries, for people with the view permission.
- **Dashboard widget:** open warnings, for people with the view permission.
- **Webhook:** `blacklist.match` can be sent under Administration → Integrations. It names who was flagged, so it
  only goes to webhooks that picked it by name, never to "every event" ones.

Members never see any of it: without `blacklist.view_blacklist` there's no sidebar entry, no page, no API and no
search results, and nothing is said to the person who matched.

Needs EvE Conduit 0.5.51 or newer. Give the permissions to your HR group under Administration → Groups.
