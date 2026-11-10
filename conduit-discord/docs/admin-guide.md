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

Someone without an account here (a diplomat, a guest on a fleet, a recruit) can be let onto the server for a while.
A person with `discord.create_guest_links` makes a link under **Discord → Temporary access** and sends it to them.
Whoever opens it signs in with Discord and is added to the server with the guest role. When the link runs out they
are removed again.

### Switching it on

1. On Discord, make a role for guests (for example `Guest`) and let it see only the channels guests should. Keep it
   below the bot's role.
2. In the Discord developer portal, open your application's **OAuth2** page and add the second redirect shown on
   **Server setup → Temporary access** (`https://<your site>/public/p/discord/guest`). Without it Discord refuses
   guests with "Invalid OAuth2 redirect_uri".
3. On **Server setup → Temporary access**, choose the guest role, set the longest a link may last (72 hours by
   default, 720 at most), switch **Temporary access links** on and save.
4. Give `discord.create_guest_links` to the people who may hand out links, under **Administration → Access**.

**Check connection** warns when the guest role was deleted or sits above the bot's role.

### Choosing which channels guests see

On **Server setup → Temporary access**, pick the channels under **Channels guests may be let into** and save.

- The bot hides every other channel from the guest role, by denying it **View Channel** there. It keeps doing so
  for channels made later, checked every two minutes while guests are on the server.
- Whoever makes a link picks which of the chosen channels it opens (all of them unless they say otherwise). Each
  guest is allowed into exactly those, personally, and that access is taken away again when they leave.
- A private channel can be chosen too: guests of a link that opens it get in although `@everyone` can't.
- Members and other roles are not affected. Only the guest role and the guests themselves get channel settings.

If the bot isn't allowed to hide a channel, saving lists it and **Check connection** reports it. Give the bot's
role **Manage Permissions** in that channel, or hide it from the guest role by hand, and save again. **Nobody is
let in through a link while a channel can't be hidden**: guests are told the server isn't ready.

On a server with many channels the first save can take a minute; it carries on in the background.

With no channels chosen, the plugin changes nothing about channels: guests see what the guest role sees on Discord.
Choosing none later stops the hiding of new channels, but leaves the settings already made on Discord in place.

### What happens to guests

| Situation | What happens |
|---|---|
| The link runs out | Its guests are removed from the server within a couple of minutes |
| The link is withdrawn | Its guests are removed straight away |
| One guest is removed from the link's list | That guest is removed; the link keeps working for others |
| The link's maker loses `discord.create_guest_links` | The link stops working and its guests are removed |
| Temporary access is switched off | Every link stops working and all guests are removed |
| Discord can't be reached | The guest stays listed with the reason, and removing is tried again every two minutes |
| A channel can't be hidden from guests, or the link's channels can't be opened | Nobody is added; a guest who was already added is taken off again |
| The link has been used by as many people as it allows | It closes to newcomers; the guests it let in stay until it runs out |

Three rules keep links from doing harm:

- Someone who is already on the server can't come in as a guest, so nobody who was there before is ever removed
  because a link ended.
- A Discord account linked to a member here is refused: members have their own access.
- A guest who links their Discord account as a member later keeps their place and only loses the guest role.

Guests get the guest role and nothing else: no nickname, no mapped roles. People with only
`discord.create_guest_links` see their own links; Discord managers see everyone's and can withdraw any.

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
| Temporary link made / withdrawn | `discord.guest_link`, `discord.guest_link_revoked` |
| One guest removed by hand | `discord.guest_removed` |
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
