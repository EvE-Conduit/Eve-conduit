# Discord — Admin guide

The Discord plugin links members' Discord accounts and adds them to your server through a bot. The bot keeps each
member's roles and nickname in step with their groups, state and main character on EvE Conduit. Only roles you map
to a group or state are touched; roles given by hand on Discord stay. This guide covers setup, role mapping, the
member list and what to do when syncing fails.

## Requirements

| Item | Requirement |
|---|---|
| EvE Conduit | 0.5.6 or newer. "Must be on the Discord server to be compliant" needs 0.5.20+; following merged accounts needs 0.5.21+. |
| Other plugins | None |
| ESI scopes | None |
| In-game corp roles | None |
| Discord | A Discord application with a bot, and a server where you can invite the bot and manage roles |

Discord OAuth scopes asked of members: `identify` and `guilds.join`. Bot permissions asked on invite: Manage Roles,
Manage Nicknames, Create Invite and Kick Members.

## Installing and switching it on

1. Go to **Administration → Plugins → Browse**.
2. Select **Discord** and install it. Leave **Switch on after installing** on, or switch it on later.
3. On the **Installed** tab, make sure the switch for Discord is on.

The plugin is not members-only: who may link is decided by the `discord.access_discord` permission, so guests can be
let in too (for example to apply).

## Permissions

| Permission codename | What it allows | Suggested group |
|---|---|---|
| `discord.access_discord` | Link a Discord account, join the server and get mapped roles | Every state that should be on Discord (given by default) |
| `discord.manage_discord` | Open **Server setup**: settings, role mapping, member list, sync, unlink and kick | Directors / Discord admins |
| `discord.create_guest_links` | Make temporary access links, see their own links and guests, withdraw them and remove a guest | Fleet commanders, diplomats, recruiters |

Every state gets `discord.access_discord` automatically: existing states when the plugin is installed, and every new
state when it is created. To keep a state off Discord, remove the permission from it under
**Administration → Access**. Members without it lose their mapped roles, or are kicked if
**Remove people who lose access from the server** is on.

## Setting up the server

Open **Discord** and click **Server setup** (`/p/discord/admin`). The **Setup** tab walks you through three steps.

### Step 1: Create a Discord application

1. Go to https://discord.com/developers/applications and press **New Application**.
2. On the application's **OAuth2** page, add the redirect shown under **Redirect** (copy it with the copy button).
   It is `https://<your site>/p/discord/callback`.
3. Copy the client id and client secret into **Client id** and **Client secret**.

### Step 2: Add the bot to your server

1. On the application's **Bot** page, press **Reset Token** and paste the token into **Bot token**.
2. In Discord, turn on Developer Mode (Settings → Advanced), right-click your server and choose **Copy Server ID**.
   Paste it into **Server id**.
3. Click **Save**.
4. Click **Invite the bot to the server** (shown once a client id is saved) and add the bot.
5. In Discord, open Server Settings → Roles and drag the bot's role above every role it should give.

### Step 3: Choose how members appear

| Setting | Default | What it does |
|---|---|---|
| **Nickname** | `[{corp_ticker}] {character}` | Nickname format. Placeholders: `{character}`, `{corp_ticker}`, `{corp}`, `{alliance_ticker}`, `{alliance}`. Uses the main character. Leave empty to let people pick their own. Cut to 32 characters. |
| **Remove people who lose access from the server** | Off | Off: people who lose `discord.access_discord` only lose the roles this site gave them. On: they are kicked and must link again once they have access. |
| **Must be on the Discord server to be compliant** | Off | Members who may link Discord count as not compliant until they have linked it, and while they are not on the server. Shows on **Administration → Compliance**, in their notification and in the Compliant group rule. |

Click **Save**. Ids must be Discord ids (long numbers); an unknown nickname placeholder is refused.

The client secret and bot token are stored encrypted and never sent back to the browser. A saved one shows as
"Saved. Type a new one to replace it."; leave the field empty to keep it.

### Checking the connection

In the **Connection** card, click **Check connection**. It shows the server, whether the bot is on it, and lists
anything to fix, such as:

- The bot isn't on the server.
- The bot's role is missing Manage Roles, Manage Nicknames, Create Invite or Kick Members.
- A mapped role is above the bot's own role.
- A mapped role no longer exists.

It also refreshes the server name and the stored role names. "All good" means the bot can add members, give the
mapped roles and set nicknames.

## Mapping roles

The **Roles** tab is available once setup is complete.

1. Under **Who gets which role**, pick a **Group or state** and a **Discord role**. Roles above the bot are shown as
   "(above the bot)" and can't be picked.
2. Click **Add**. Repeat for every mapping. A person can match several rows.
3. Click **Save and sync**. Everyone's roles are updated in the background. **Discard** drops unsaved rows.

Without mappings, linked members join the server with no roles.

## Temporary access links

Someone without an account here (a diplomat, a guest on a fleet, a recruit) can be given guest access to the server
for a while. A person with `discord.create_guest_links` makes a link under **Discord → Temporary access** and sends
it to them. Whoever opens it signs in with Discord and gets two roles on the server: the **temporary role** (for
example `tempaccess`), which they have while the link runs, and the **guest role**, which they keep. When the link
runs out, the temporary role is taken away and that access ends.

### Switching it on

1. On Discord, make two roles, for example `tempaccess` and `Guest`, both below the bot's role. Let `tempaccess`
   see the channels guests should, and `Guest` none of them. (If you choose the channels on this site, as described
   below, the bot arranges that for you.)
2. In the Discord developer portal, open your application's **OAuth2** page and add the second redirect shown on
   **Server setup → Temporary access** (`https://<your site>/public/p/discord/guest`). Without it Discord refuses
   guests with "Invalid OAuth2 redirect_uri".
3. On **Server setup → Temporary access**, choose the temporary role and the guest role, set the longest a link may last (72 hours by
   default, 720 at most), switch **Temporary access links** on and save.
4. Give `discord.create_guest_links` to the people who may hand out links, under **Administration → Access**.

**Check connection** warns when one of the two roles was deleted or sits above the bot's role.

### Settings

| Setting | Default | What it does |
|---|---|---|
| **Temporary access links** | Off | Lets people with `discord.create_guest_links` make links. Switching it off ends all guest access still running. |
| **Temporary role** | none | The role a guest has while their link runs, and loses when it ends. Without one, the guest role is taken away instead. |
| **Guest role** | none | Guests get it too and keep it afterwards, so it shows who has been a guest. Required while links are on. It can't be the same role as the temporary one. |
| **Longest a link may last (hours)** | 72 | Also the furthest ahead a link can be extended to, counted from now. Up to 720. |
| **When a link ends** | Take the temporary role away | **Take the temporary role away; they stay, with the guest role**, or **Remove them from the server**. |
| **Guests appear as** | `[GUEST] {name}` | The guest's nickname on the server; `{name}` is their Discord name. Empty leaves names alone. Their old name is put back when their access ends. |
| **Channels guests may be let into** | none | See below. |

### When a link ends

By default guests **lose the temporary role and stay on the server with the guest role**. Their nickname goes back
to what it was, and any channels the link opened to them close. They can come back through a new link, which
gives them the temporary role again.

Choose **Remove them from the server** to have people who joined through a link taken off the server when it ends.

Whichever you choose:

- Someone who was **already on the server** when they used a link is never removed from it. They get the roles for
  the time, and lose the temporary one again.
- A temporary role someone **already had**, given by hand, is left with them.
- A Discord account **linked to a member** here can't use a link: members have their own access. A guest, or former
  guest, who links their account as a member keeps their place. Their guest access ends at that moment and the
  guest role is taken away, since it would hide the members' channels from them. They keep either role only if
  their groups give it to them.

> **What a former guest sees.** They keep the guest role, so they see what that role sees. If you limit guests to
> chosen channels (below), the bot hides every channel from the guest role, and a former guest sees nothing. If you
> don't, set the guest role up on Discord so that it sees only what a former guest may.
>
> **With no temporary role chosen** (sites set up before 1.4.0), the guest role is the one taken away, and a
> former guest then sees what `@everyone` sees. With channels limited that can be **more** than they saw as a
> guest; saving the settings and **Check connection** list those channels. Choosing a temporary role closes this.

| Situation | What happens |
|---|---|
| The link runs out | Its guests' access ends within a couple of minutes |
| The link is extended | Nothing changes for its guests; they keep their access for the extra time |
| The link is withdrawn | Its guests' access ends straight away |
| **End access** next to one guest | That guest's access ends; the link keeps working for others |
| The link's maker loses `discord.create_guest_links` | The link stops working and its guests' access ends |
| Temporary access is switched off | Every link stops working and all guest access ends |
| Discord can't be reached | The guest stays listed with the reason, and it is tried again every two minutes |
| A channel can't be hidden from guests, or the link's channels can't be opened | Nobody is given access; what was already given is taken back |
| The link has been used by as many people as it allows | It closes to newcomers; the guests it let in keep their access until it runs out |

### Extending a link

**Extend** on a running link adds time to it. A link can never end later than the longest a new link could last,
counted from now: with the default of 72 hours, a link with 10 hours left can get up to 62 more. A link that has
ended can't be extended; make a new one.

### Choosing which channels guests see

On **Server setup → Temporary access**, pick the channels under **Channels guests may be let into** and save.

- The bot hides every channel from the guest role, by denying it **View Channel** there, and takes away any channel
  setting that lets the temporary role in. It keeps doing so for channels made later, checked every two minutes
  while guests are on the server.
- Whoever makes a link picks which of the chosen channels it opens (all of them unless they say otherwise). Each
  guest is allowed into exactly those, personally, and that access is taken away again when their link ends.
- A private channel can be chosen too: guests of a link that opens it get in although `@everyone` can't.
- Members and other roles are not affected. Only the two roles for guests and the guests themselves get channel
  settings.

If the bot isn't allowed to hide a channel, saving lists it and **Check connection** reports it. Give the bot's
role **Manage Permissions** in that channel, or hide it from the guest and temporary roles by hand, and save again. **Nobody is
let in through a link while a channel can't be hidden**: guests are told the server isn't ready.

On a server with many channels the first save can take a minute; it carries on in the background.

With no channels chosen, the plugin changes nothing about channels: guests see what their two roles see on Discord, and former guests what the guest role sees.
Choosing none later stops the hiding of new channels, but leaves the settings already made on Discord in place.

### History

**Discord → Temporary access → History** lists everyone who came through a link, newest first: their Discord name
and id, the link, who invited them, when they joined and when and why their access ended. Search by Discord name or
id, the link's label, or who made it. People with only `discord.create_guest_links` see the guests of their own
links; Discord managers see everyone's. Links and their guests are kept; nothing is deleted when a link ends.

The site learns a guest's Discord name, id and avatar, and keeps them with the link.

## Day-to-day operation

- **Header stats:** **Server**, **Linked members** (with the time of the last full sync) and **Sync problems**.
- **Sync everyone** (top right) queues a sync of all linked members.
- **Members** tab: every linked member with their main character, alts, Discord name, nickname, roles and when they
  were last checked (or the last error). Search by member, character or Discord name. Alts are only listed if you may
  open those characters' sheets; otherwise you see "No alts you can see".
- **Actions** menu per member:

| Action | What it does |
|---|---|
| **Sync now** | Updates their roles and nickname now. If they no longer have access and kicking is on, they are removed. |
| **Discord profile** | Opens their Discord profile. |
| **Unlink** | Takes away the roles this site gave them and forgets the link. They stay on the server. |
| **Unlink and kick** | Removes them from the server and forgets the link. They can link again while they have access. |

If Discord can't be reached during an unlink, the link is kept and an error appears with **Forget anyway**. That
forgets the link but leaves their roles on Discord; take them off by hand.

When an administrator merges a member's second account into their main (**Administration → Members**), the second
account's Discord link moves to the main. If the main already has a link, the second account is unlinked and loses
its roles.

## Events and notifications

| Event | When |
|---|---|
| `discord.linked` | A member linked their Discord account and joined the server |
| `discord.unlinked` | A member's Discord account was unlinked, kicked, or removed after losing access |
| `discord.guest_link_created` | Someone made a temporary access link |
| `discord.guest_joined` | A guest joined the server through a temporary link |
| `discord.guest_removed` | A guest's temporary access ended |

Send them to a channel under **Administration → Integrations**. The plugin has no Discord ping settings of its own.

Members get a notification in the **Discord** category when a manager unlinks or kicks them.

## Privacy and audit logging

The plugin stores each member's Discord id, Discord name, avatar URL, nickname, mapped roles, whether they were on
the server and the last sync error. It does not read messages.

Audit log entries (**Administration → Logs → Audit**):

| Action | Recorded as |
|---|---|
| A member links or unlinks their account | `discord.link`, `discord.unlink` |
| A manager unlinks or kicks a member | `discord.unlink` (with `kick`) |
| Settings saved (notes when a new secret or token was set) | `discord.settings` |
| Role mappings saved | `discord.mappings` |
| Temporary access switched on or off, or its settings changed | `discord.guest_settings` |
| Temporary link made / extended / withdrawn | `discord.guest_link`, `discord.guest_link_extended`, `discord.guest_link_revoked` |
| One guest's access ended by hand | `discord.guest_removed` |
| **Sync everyone** | `discord.sync` |

## Background jobs

| Job | Schedule | What it does |
|---|---|---|
| `sync-all` | Every 6 hours | Checks every linked member's roles and nickname, notices people who left the server, and applies access changes. |

A member is also synced straight away when they join or leave a group, their state changes or they pick another
main. Jobs only run while the plugin is enabled and setup is complete.

## Group rules

The plugin adds no group rule of its own. With **Must be on the Discord server to be compliant** on, being on the
server counts towards the core Compliant group rule.

## Troubleshooting

**"The bot token was refused; check it under Discord → Setup".**
The token was reset or is wrong. Reset it on the Bot page and paste the new one.

**"The bot isn't allowed to do that".**
The bot's role must be above every role it gives, and it needs Manage Roles and Manage Nicknames. Run
**Check connection**.

**"Roles are up to date, but the bot can't change this member's nickname".**
Discord doesn't let anyone change the server owner's nickname. Nothing to fix.

**"The bot can't see that server".**
Invite the bot with **Invite the bot to the server** and check the server id.

**"Linked, but Discord wouldn't add you to the server".**
Usually the bot lacks Create Invite, or is not on the server. Run **Check connection**.

**A member left the server but still counts as compliant.**
Leaving is noticed at the next sync, at most 6 hours later. Use **Sync now** to check them straight away.

**Roles given by hand disappeared.**
Only roles mapped to a group or state, or given by this site before, are touched. If a hand-given role is also
mapped, the bot manages it.
