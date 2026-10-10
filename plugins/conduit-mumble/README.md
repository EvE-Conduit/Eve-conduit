# Mumble

Members make a Mumble account here and connect with the Mumble client. Their name and groups in Mumble follow their
main character, groups and state. Guests get in through temporary access links.

- **Mumble** (permission `mumble.access_mumble`, given to every members' state by default): "Create my Mumble
  account" makes the login (`Pilot_One` from the main character by default; a random password, or one they choose, shown
  once). The page then shows the server, port and username, a `mumble://` link that fills them in, their Mumble groups,
  "New password", "Forget my certificate" and "Delete account". There's a dashboard widget too.
- **Temporary access** (permission `mumble.create_temp_links`): make a link for people without an account, with a
  label, how long it lasts (up to the limit from Setup) and optionally how many may use it. Whoever opens the link
  chooses a name and gets a login (`[TEMP] Jane Doe` in Mumble, group `temp`) that stops working when the link runs
  out. The page lists your links, who used them and when they last connected; withdraw a link, or cut off one guest.
  Mumble managers see everyone's links and can give a link's guests other groups.
- **Server setup** (permission `mumble.manage_mumble`): the server address and port, the name and login formats,
  certificate login, the guest settings, the group mapping (group or state → Mumble group), every account (new
  password, delete) and every guest link.

## How it works

The Mumble server holds no passwords. A small **authenticator** runs next to it and asks this site about every
login through the external API (`/api/v1/p/mumble/`, scope `p.mumble:auth`). The answer says whether to let the person
in, what to call them and which Mumble groups they're in, worked out right then from their groups and state, so
changes on the site apply at the next connect. Names the site doesn't know fall through to the server's own users, so
`SuperUser` keeps working.

- Login names are fixed when the account is made (letters, digits, `_`, `.` and `-`; unique across members and
  guests, without regard to case). The name shown in Mumble follows the main character at every login.
- After a member's first login with the password, their Mumble client certificate is remembered and that computer gets
  in without the password (as Mumble normally works). Switch it off under Setup, or members can forget it themselves.
- Ten failed logins for one name refuse that name for ten minutes.
- Mumble groups are just names: create them on the server's root channel ACL (Edit → ACL → Groups) and give them rights
  on channels. Guests get the group from Setup (`temp` by default).
- Guest logins are kept a week after they ended and links a month, so the person who made them can see who used
  them; then they're deleted (hourly task).
- When an administrator merges a member's second account into their main, the Mumble login moves along unless the
  main has one already.

## Setting up the server (also shown under Setup)

1. Administration → API: switch on the **Mumble** API and make a key with the scope `p.mumble:auth`.
2. On the Mumble server, turn on Ice in `murmur.ini` (`ice="tcp -h 127.0.0.1 -p 6502"`, `icesecretwrite=...`),
   restart it, and install Ice for Python 3 (`pip install zeroc-ice`, or `apt install python3-zeroc-ice`).
3. Download the authenticator, its config (with this site filled in) and the systemd unit from Setup; put them in
   one folder, enter the API key and the Ice secret in `authenticator.ini`, and run
   `python conduit_mumble_authenticator.py -i authenticator.ini` (or install the unit). Setup shows when it last
   called the site.
4. Map groups and states to Mumble groups, and give those groups rights in Mumble's ACLs.

The authenticator needs Python 3.9+ and `zeroc-ice`, nothing else; it fetches character portraits from EVE's image
server as Mumble avatars (`avatars = false` in the config turns that off). Audit log entries: accounts made, passwords
changed, links made and withdrawn, settings. Events for webhooks: `mumble.account_created`, `mumble.account_deleted`,
`mumble.temp_link_created`, `mumble.temp_access_used`.
