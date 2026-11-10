# Discord Tickets — Admin guide

Discord Tickets lets staff reach a member through a private Discord channel, an EVE mail or both, and lets people open
their own ticket from a panel of buttons in a Discord channel. It uses the Discord plugin's bot, server and linked
accounts. Closed channels are saved as transcripts on the site, with their attached files, before the bot removes them
from Discord. This guide covers requirements, setup, panels, daily use and troubleshooting.

## Requirements

| Item | Requirement |
|---|---|
| EvE Conduit | 0.5.55 or newer |
| Other plugins | **Discord** (`conduit-discord`), installed, switched on and set up (bot token and server id) |
| ESI scopes | `esi-mail.send_mail.v1` on the main character of whoever sends an EVE mail. Sign-in already asks for it. Members don't need it. |
| In-game corp roles | None |
| Discord bot permissions | Manage Channels, View Channels, Send Messages, Embed Links, Attach Files, Read Message History, plus Manage Roles from the Discord plugin |
| Discord application | **Message Content Intent** turned on (Bot page). For panels: the **Interactions Endpoint URL** set, and the site reachable from the internet over `https://` |
| Workers | Celery workers must run: transcripts, and opening and closing from panels, happen in the background |

## Installing and switching it on

1. Set up the Discord plugin first and switch it on.
2. Go to **Administration → Plugins → Browse**.
3. Select **Discord Tickets** and install it. Leave **Switch on after installing** on, or switch it on later.
4. On the **Installed** tab, make sure the switch for Discord Tickets is on.

The plugin is not members-only: recruits and guests can open tickets from panels and read them under **My tickets**.
Every staff page checks its own permission.

## Permissions

| Permission codename | What it allows | Suggested group |
|---|---|---|
| `tickets.open_tickets` | Open tickets with members, see all tickets, close any ticket, read every transcript (audited) | HR / recruiters / officers |
| `tickets.manage_tickets` | **Panels** and **Settings** pages | Directors |

Give them to a group under **Administration → Groups**, or to a state under **Administration → Access**. Nobody needs
a permission to open a ticket from a panel or to see **My tickets**.

Menu entries: **Discord Tickets** (needs `tickets.open_tickets`), **My tickets** (everyone), **Panels** and
**Settings** (need `tickets.manage_tickets`).

## Setting up

1. Make sure the Discord plugin's **Server setup** is complete.
2. Open **Settings** (Ticket settings) and click **Invite the bot with ticket permissions**. Inviting again only adds
   the extra permissions.
3. On the **Bot** page of your Discord application, turn on **Message Content Intent**. Without it Discord blanks the
   text of messages, and the transcript keeps retrying until it's on.
4. Optionally fill in the settings below and click **Save**.
5. Give `tickets.open_tickets` to whoever should open tickets.

If you only want EVE mail tickets, steps 2 to 4 can wait, but the Discord plugin must still be installed and switched
on.

### Settings

| Setting | Default | What it does |
|---|---|---|
| **Category id** | Empty | Discord category for new ticket channels. With Developer Mode on, right-click the category and **Copy Channel ID**. Empty puts channels at the top of the server. If the category has its own permissions, the bot must be allowed to manage channels there. |
| **Default Discord roles** | None | Roles ticked when someone opens a ticket. They can change it for that ticket. |
| **Space for attached files (MB)** | `5000` | How much of attached files the site keeps in its database over all tickets. Once that much is stored, new files are only listed by name; nothing already saved is removed, also when you lower it. `0` is no limit. The field shows how much is in use. |
| **Keep attached files (days)** | `0` | Files are deleted this many days after their ticket closed; the transcript's text and the files' names stay. `0` keeps them for good. Setting it deletes the files of tickets already closed longer ago, within 15 minutes. |

The Settings page lists anything in the way, for example:

- "Transcripts will be blank: turn on Message Content Intent on the Bot page of your Discord application."
- "The bot isn't on the server. Invite it with the link below."
- "The bot's role is missing the <name> permission."
- "A default role no longer exists on the server; it's left off new tickets. Save to clear it."

## Opening a ticket with a member

1. Open **Discord Tickets** and click **Open a ticket**.
2. Under **Member**, search by their main, an alt you can see, or their Discord name. Alts only match if your sheet
   permissions let you see them. Badges show **Open ticket** (you already have one with them) and **Not on server**.
3. Pick **Send by**: **Discord ticket**, **EVE mail** or **Both**. The hint names the character the mail goes from.
4. For a Discord ticket, tick the **Discord roles that can see it** (besides the two of you). Any role except
   @everyone and bots' own roles can be picked. Roles are fixed once the channel exists.
5. Enter a **Subject** (up to 100 characters).
6. Enter the **First message** (optional, posted by the bot in the channel) or, for a mail-only ticket, the
   **Message** (required). Up to 1500 characters.
7. Click **Open ticket**.

What happens:

- **Discord ticket:** the bot makes a channel named `ticket-<number>-<member>`, visible only to you, the member, the
  bot and the chosen roles, and pings the member. Both of you must have linked Discord and be on the server.
- **EVE mail:** sent from your main to the member's main. A mail can't be taken back. A member who charges to be
  mailed (CSPA) can't be mailed from here.
- **Both:** the channel is made first, then the mail links to it. If the mail fails, the channel stays and the
  ticket shows "Mail not sent: <reason>".

You can have one open ticket per member. Other staff can open their own with the same member. The member gets a
notification ("Discord ticket: <subject>" or "EVE mail: <subject>").

## Closing tickets and transcripts

1. On **Discord Tickets**, filter by **Open**, **Closed** or **All**.
2. Click **Close** on an open ticket and confirm with **Close ticket**.

Closing takes the member out of the channel straight away and posts a closing note. A background task then saves every
message as a transcript and only then removes the channel. If saving fails, the channel stays, the reason shows on the
ticket, and it is tried again every 15 minutes. A mail-only ticket is just marked closed.

Transcripts:

- Click **Transcript** (or the subject) to read one. Every read is recorded in the audit log.
- Attached files are copied into the database (so they are in every backup), up to 25 MB per file and 200 MB per
  ticket, 500 MB over all the tickets one person opened from panels, and the space set under Settings in total. Files
  beyond that are listed by name only. PNG, JPEG, GIF and WebP images show in the page; other files download.
- What is written in a channel after its ticket closed (while it waits to be removed) is in the transcript for staff,
  but isn't shown to the person who opened the ticket from a panel: they were taken out of the channel by then.
- If something in a channel can't be saved, the ticket says so and the others are still saved.
- A channel deleted by hand on Discord before the ticket closes has no transcript.
- Mail tickets show the mail that was sent, but not replies in the game.
- All times are shown in EVE time. Times the bot posts on Discord show in each reader's own time zone.

## Panels

**Panels** (Ticket panels) posts a message with up to 5 buttons in a channel. Each button has its own roles and,
optionally, its own category.

### Making buttons work

1. Copy the address shown on the Panels page. It is `https://<your site>/api/public/p/tickets/interactions`.
2. Paste it into **Interactions Endpoint URL** on the **General Information** page of your Discord application and
   save.

Requests that don't carry Discord's signature, or are older than 5 minutes, are refused.

### Creating a panel

1. Click **New panel**.
2. Pick the **Channel**. Who can see this channel on Discord decides who can use the panel.
3. Enter a **Title** (up to 100 characters) and optional **Text** (up to 2000 characters).
4. For each button (**Button 1**, **Add button**, up to 5):
   - Label (up to 80 characters).
   - **Discord roles that see its tickets** (at least one). They are pinged when a ticket opens. A role only
     notifies its members if it allows mentions or the bot has Mention Everyone.
   - **Category**: where its channels go; **The one from Settings** by default.
5. Click **Post panel**.

**Edit** updates the message on Discord (it is posted again if it was deleted there, or moved if you change the
channel). **Delete** removes the message; tickets already opened from it stay open.

### How panel tickets work

- Anyone who can see the channel and has linked Discord on this site can use it, whatever their state.
- One open ticket per person per button, and one minute between tickets from panels.
- Every channel has a **Close ticket** button with a confirmation. The person who opened it, anyone holding one of its
  roles and anyone with `tickets.open_tickets` can use it, once they have linked Discord.
- The list on **Discord Tickets** shows "Panel: <button>" for these tickets.

## Notifications and events

Members get notifications in the **Discord Tickets** category when a ticket is opened with them and when one of their
tickets is closed by someone else. The plugin fires no webhook events and has no Discord ping settings.

## Privacy and audit logging

Audit log entries (**Administration → Logs → Audit**):

| Action | Recorded as |
|---|---|
| Opening a ticket (staff or panel) | `tickets.opened` |
| Closing a ticket | `tickets.closed` |
| Removing a channel after its transcript is saved | `tickets.channel_deleted` |
| Reading a transcript | `tickets.transcript_read` |
| Saving settings | `tickets.settings` |
| Saving or deleting a panel | `tickets.panel_saved`, `tickets.panel_deleted` |

Transcripts and files are stored in the database. A member a staff ticket was opened with can't read its transcript;
someone who opened their own from a panel can.

## Background jobs

| Job | Schedule | What it does |
|---|---|---|
| `archive-pending` | Every 15 minutes | Saves transcripts that failed or never started, and removes channels whose transcript is complete. |

Closing also queues the transcript straight away. Opening and closing from panels run as background tasks too.

## Group rules

Discord Tickets adds no group rules.

## Troubleshooting

**"Set up the bot and server under Discord → Server setup first".**
The Discord plugin isn't set up. Finish its setup.

**"Buttons won't work yet: set the Interactions Endpoint URL below on your Discord application".**
Paste the address from the Panels page into your Discord application.

**"Discord only sends clicks to a public https address".**
The site's address isn't `https://`. Panels need a public HTTPS address.

**Transcript stuck on "Saving the transcript…" with a warning.**
Read the warning. Most often Message Content Intent is off, or the bot lost permissions. It retries every 15 minutes.

**"The bot isn't allowed to do that".**
Check **Settings** for missing permissions, and that the bot may manage channels in the chosen category.

**"Discord refused the channel".**
Check the **Category id** on Settings.

**"<name> hasn't allowed sending mail; log in with it again".**
The sender's main login lacks `esi-mail.send_mail.v1`. Add the character again (Characters → Add character).

**"The game refused the mail".**
The member may charge to be mailed (CSPA), or too many mails went out recently.

**"The Discord roles of this button no longer exist".**
Edit the panel and pick existing roles.

**Panel roles are not notified.**
Let the role be mentioned on Discord, or give the bot Mention Everyone.
