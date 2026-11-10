# TeamSpeak — Admin guide

The TeamSpeak plugin manages a TeamSpeak server through ServerQuery. Members link their TeamSpeak identity with a
one-time privilege key. The site then keeps each member's server groups in step with their groups and state on the
site. This guide covers installing the plugin, connecting the server, mapping groups and looking after linked members.

## Requirements

| Item | Details |
| --- | --- |
| EvE Conduit version | 0.5.22 or later (`min_conduit`) |
| Other plugins | None |
| ESI scopes | None |
| EVE corporation roles | None |
| TeamSpeak server | TeamSpeak 3 or TeamSpeak 6, with raw ServerQuery reachable from the site (port `10011` by default) |
| ServerQuery login | A login that can manage server groups, privilege keys and client database entries (the **Server Admin Query** group has all of it, or use `serveradmin`) |

## Install and switch on

1. Go to **Administration → Plugins → Browse**.
2. Find **TeamSpeak** (category Communication) and install it.
3. Switch it on, either with **Switch on after installing** or under the **Installed** tab.

**TeamSpeak** then shows in the menu. Admins with `teamspeak.manage_teamspeak` see a **Server setup** button on the
TeamSpeak page (`/p/teamspeak/admin`).

## Permissions

| Permission codename | What it allows | Suggested group |
| --- | --- | --- |
| `teamspeak.access_teamspeak` | Link a TeamSpeak identity and get server groups. Without it, a linked member loses all site-managed server groups. | Every members' state (given by default) |
| `teamspeak.manage_teamspeak` | Open **Server setup**: the connection, group mapping and linked members. | Directors |

When the plugin is installed, every non-public state gets `teamspeak.access_teamspeak`. States created later get it
too. Guests (the public state) do not. You can take it away from a state under **Administration → Access**.

Admins with `teamspeak.manage_teamspeak` see each linked member's main character in the **Members** tab. Alts only
show to admins who may open those characters' sheets.

## Setting up the server

**Server setup** has three tabs: **Setup**, **Groups** and **Members**. **Groups** and **Members** stay disabled until
the connection has been checked once.

### 1. Prepare the TeamSpeak server

1. Make a ServerQuery login for the site. As `serveradmin` in the client, use **Tools → ServerQuery Login**, or run
   `serverqueryadd` on the query console. Put it in the **Server Admin Query** group, or use `serveradmin` itself.
2. Add the site's address to `query_ip_allowlist.txt` next to the server (older servers: `query_ip_whitelist.txt`).
   This is optional but recommended (see **This site is on the server's query allow list** below).
3. Make the server groups you want to hand out (**Permissions → Server Groups**) and give them channel rights.

### 2. Fill in Setup

Open **Server setup → Setup** and fill in the three steps.

**Step 1: ServerQuery login**

| Setting | Default | What it does |
| --- | --- | --- |
| **Query address** | empty | The server's host name or IP address. No `ts3server://` and no path. |
| **Query port** | `10011` | The raw ServerQuery port. |
| **Server id** | `1` | The virtual server to manage. `1` unless the host runs several. |
| **Query login** | empty | The ServerQuery login name. |
| **Query password** | empty | Stored encrypted. Leave empty to keep the stored password. It has to be entered again whenever the query address, port or login changes: the stored one is never sent anywhere else. |
| **This site is on the server's query allow list** | off | Tick once the site's address is in `query_ip_allowlist.txt`. Off: the site spaces commands out to stay under the server's flood limit, so syncing everyone takes longer. |

Press **Save and check the connection**. This saves the form, connects, and reads the server's name, version and
server groups. If **Linked members' group** is not set, it uses an existing group called `Registered`, or makes one.
The result shows the version, how many are online, the voice port, the number of server groups and the linked
members' group. It also lists problems, such as a mapped server group that no longer exists.

**Step 2: Where members connect**

| Setting | Default | What it does |
| --- | --- | --- |
| **Address** | empty (uses the query address) | The address members connect to. |
| **Voice port** | `9987` | The voice port members connect to. |
| **Shown as** | empty (the server's own name) | A friendly name shown to members, for example "Alliance comms". |

**Step 3: How members appear**

| Setting | Default | What it does |
| --- | --- | --- |
| **Nickname and description** | `[{corp_ticker}] {character}` | The nickname the connect link fills in, and the client description set on the server. Placeholders: `{character}`, `{corp_ticker}`, `{corp}`, `{alliance_ticker}`, `{alliance}`. Cut to 30 characters. |
| **Linked members' group** | **Make one called Registered** | The server group every linked member with access is in. The privilege key hands it out. |
| **Kick people who lose access** | off | Also kick members off the server (if they are on it) when they lose access, at the next sync and when unlinked. |
| **Must be linked to be compliant** | off | Members with `teamspeak.access_teamspeak` count as non-compliant until they have linked. Used by **Administration → Compliance** and the Compliant group rule. |

Press **Save**.

### 3. Map groups

1. Open **Server setup → Groups**.
2. Under **Group or state**, pick a state or a group.
3. Under **Server group**, pick a server group from the server's list. The linked members' group is not offered here,
   because every linked member gets it anyway.
4. Press **Add**. Repeat for each mapping. A member can match several rows.
5. Press **Save** (or **Discard** to drop the changes).

Saving starts a sync for everyone. A server group taken out of the mapping is taken away from everyone it was given
to. If the server group list is out of date, press **Save and check the connection** under **Setup** to refresh it.

## How syncing works

- A linked member with access gets the mapped server groups of every group they are in and of their state, plus the
  linked members' group.
- The site only touches mapped groups, the linked members' group and groups it gave before. Groups given by hand on
  the server stay.
- A member without access loses all of those groups, and is kicked if **Kick people who lose access** is on.
- The site also sets each member's client description from **Nickname and description**.
- The site talks to the server in one session at a time, whoever asked: the server's flood limit counts commands
  per address, and two sessions at once could get the site banned for ten minutes.
- A sync after a group or state change that can't reach the server is tried again after 1, 2, 4, 8 and 15 minutes
  (when the site runs background workers); after that the 6-hourly full sync has it.
- Someone who started linking and lost access before finishing loses their key at once, and the linked members'
  group if they had used it already.

Syncs run:

- when a member joins or leaves a group, changes state or changes main character;
- every six hours for everyone;
- when a member presses **Fix my groups** (once per 30 seconds per member);
- from **Members → Actions → Sync now** and **Sync everyone**;
- after saving the group mapping.

An identity links to one member only. When an administrator merges a member's second account into their main, the
link moves to the main account, unless the main already has one. In that case the old identity is unlinked.

## Day-to-day: the Members tab

The stat cards at the top show the server, how many are linked (and still linking), **Sync problems** and
**Last full sync**.

**Members** lists every linked and pending member with their TeamSpeak nickname, identity, last connection, the
server groups due, and a status: **Linking**, **Linked** or **Problem** (with the error). A **no access** badge marks
linked members who lost access. Search by member, character, nickname or identity.

| Action | What it does |
| --- | --- |
| **Sync everyone** | Starts a full sync in the background. Once per minute. |
| **Actions → Sync now** | Syncs one linked member now. |
| **Actions → Unlink** | Takes the member's site-managed groups away and removes the link. The member gets a notification. |
| **Actions → Cancel link** | For a pending link: deletes the key. The member can start again. |

If the server cannot be reached during **Unlink**, the link is kept so the groups can still be removed later. The
browser then asks "Forget the link anyway?". Confirm only if you accept that the groups stay on the server.

## Notifications, webhooks and Discord

- Notification category: **TeamSpeak**. Members get "Your TeamSpeak identity was unlinked" when an admin unlinks them.
- Webhook events, available under **Administration → Integrations**:

| Event | When |
| --- | --- |
| `teamspeak.linked` | A member linked their TeamSpeak identity. |
| `teamspeak.unlinked` | A member's TeamSpeak identity was unlinked (by the member, an admin or an account merge). |

To get these in Discord, make a Discord webhook under **Administration → Integrations** and pick these events.

## Group rules and compliance

The plugin adds no group rules of its own. With **Must be linked to be compliant** on, members who may use TeamSpeak
but have not linked get the compliance problem "TeamSpeak: not linked (link it on the TeamSpeak page)". This feeds the
core Compliant group rule.

## Privacy and audit log

The site stores each member's TeamSpeak database id, unique id, nickname, last connection time, the groups it gave
and the last sync error. The ServerQuery password is stored encrypted.

Audit log entries (**Administration → Logs → Audit**):

| Action | Logged when |
| --- | --- |
| `teamspeak.link_started` | A member started linking. |
| `teamspeak.linked` | A member finished linking. |
| `teamspeak.unlink` | A member unlinked or gave up, or an admin unlinked a member. |
| `teamspeak.settings` | The settings were changed. |
| `teamspeak.mappings` | The group mapping was saved. |
| `teamspeak.sync` | An admin started **Sync everyone**. |

## Background jobs

| Job | Schedule | What it does |
| --- | --- | --- |
| `conduit_teamspeak.tasks.sync_all` | Every 6 hours | Syncs every linked member. Cancels link attempts older than 24 hours, and those of people who lost access since, and deletes their keys. Removes the linked members' group from identities that used a site key but are not linked. |
| `conduit_teamspeak.tasks.sync_user` | On group, state and main-character changes | Syncs one member. |

Both do nothing while the plugin is switched off.

## Troubleshooting

| Message or symptom | What to do |
| --- | --- |
| "The ServerQuery login or password was refused; check them under TeamSpeak → Setup" | Re-enter **Query login** and **Query password**. |
| "The ServerQuery login isn't allowed to do that (...); give it server admin query rights" | Put the login in the **Server Admin Query** group. |
| "The server has banned this site for sending commands too fast; add its address to query_ip_allowlist.txt and wait ten minutes" | Add the site to the allow list, tick **This site is on the server's query allow list**, wait ten minutes. |
| "There's no virtual server with that id; check the server id under Setup" | Fix **Server id**. |
| **Groups** and **Members** tabs are greyed out | Press **Save and check the connection** once. |
| A mapping shows "(not on the server)" | The server group was deleted. Remove the row and save. |
| "Pick a server group from the server's groups ..." | Refresh the list with **Save and check the connection**. |
| A member shows **Problem** with "The identity is gone from the server's database" | Unlink the member; they link again. |
| "That TeamSpeak identity is already linked to another member" | Unlink the identity from the other member first. |
| "The site is busy talking to the TeamSpeak server; try again in a moment" | The site talks to the server in one session at a time (the server's flood limit counts per address). A full sync is running; try again when it's done. Background syncs wait their turn by themselves. |
| "Couldn't connect to the TeamSpeak server's query port (...)" or "The query address isn't a ServerQuery port" | Check **Query address** and **Query port** under Setup, and that the site can reach them. The messages don't repeat the address because members see them too. |
| Full syncs are slow | Allow-list the site and tick the allow-list switch. |
