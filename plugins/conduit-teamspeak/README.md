# TeamSpeak

Members link their TeamSpeak identity here once; from then on their server groups follow their groups and state on
the site. No passwords, no nickname matching: the site talks to the server through ServerQuery.

- **TeamSpeak** (permission `teamspeak.access_teamspeak`, given to every members' state by default): "Link my
  TeamSpeak" makes a one-time **privilege key** for the member. The page shows the key and a `ts3server://` link that
  connects with the right nickname and uses the key; the page watches for it and, once used, shows the linked
  identity, when it last connected, and the server groups it has. "Fix my groups" re-syncs; "Unlink" takes the
  groups away. There's a dashboard widget too.
- **Server setup** (permission `teamspeak.manage_teamspeak`): the ServerQuery login, where members connect, the
  nickname/description format, the linked members' group, kicking on lost access, compliance, the group mapping
  (group or state → server group, picked from the server's own list) and every linked member (sync now, unlink).

## How it works

1. The site makes a privilege key on the server (`privilegekeyadd`) for the **linked members' group** ("Registered",
   made for you unless you pick one). The key also stamps a secret code on whichever identity uses it (a custom
   client property), so only the member who used their key is found.
2. The member uses the key: the connect link does it, or Permissions → Use Privilege Key in the client. The page asks
   the site every few seconds; the site looks the code up (`customsearch`), remembers the identity (database id and
   unique id), sets its description, gives it its groups and pokes it hello.
3. Syncing: the member gets the mapped server groups of every group they're in and of their state, plus the linked
   members' group, as long as they have access. Only groups that are mapped (or were given by the site before) are
   touched; groups given by hand stay. Without access they lose all of them, and are kicked if the admins chose that.
   Syncs run on group, state and main-character changes, every six hours for everyone (which also forgets link
   attempts older than a day and deletes their keys), on "Fix my groups", and from the members list.
4. An identity links to one member only. When an administrator merges a member's second account into their main,
   the link moves along unless the main has one already.

Works with TeamSpeak 3 and TeamSpeak 6 servers (the raw ServerQuery protocol on port 10011). The ServerQuery password
is stored encrypted. Audit log entries: links started and finished, unlinks, settings, mappings, syncs. Events for
webhooks: `teamspeak.linked`, `teamspeak.unlinked`.

## Setting up the server (also shown under Setup)

1. Make a ServerQuery login for the site: as `serveradmin` in the client, Tools → ServerQuery Login (or
   `serverqueryadd` on the query console), and put it in the **Server Admin Query** group, or use `serveradmin`
   itself. It needs to manage server groups, privilege keys and client database entries.
2. Add the site's address to `query_ip_allowlist.txt` (older servers: `query_ip_whitelist.txt`) next to the server
   and tick "on the allow list" under Setup. Otherwise the site spaces commands out to stay under the server's flood
   limit, and syncing everyone takes longer.
3. Under Setup enter the query address, port and login and press "Save and check the connection". That reads the
   server's name, version and groups, and makes the "Registered" group if you haven't picked one.
4. Make server groups on the server (Permissions → Server Groups) with rights on channels, then map your site groups
   and states to them under Groups. Give the linked members' group whatever every member may do.
