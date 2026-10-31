# Discord Tickets

Reach a member you pick through a private Discord channel, an EVE mail or both, or let people open their own ticket
from a panel of buttons in a Discord channel. Needs the
[Discord](../conduit-discord) plugin: tickets use its bot, its server and its linked accounts.

- **Discord Tickets** (permission `tickets.open_tickets`): search for a member by their main, their Discord name or an
  alt you may see on their character sheet, choose **Discord ticket**, **EVE mail** or **Both**, and give a subject
  and a message (optional unless it's only a mail). Everyone with the permission sees all tickets and can close them.
- **Discord ticket:** the bot makes a channel only the two of you and the Discord roles you tick can see, and pings the member
  there.
- **EVE mail:** goes from your main character to the member's main. Your main's login must allow sending mail
  (`esi-mail.send_mail.v1`, which sign-in asks for). With **Both**, the mail links to the channel; the channel is made
  first, and if the mail then fails the channel stays and the ticket shows why. A mail can't be taken back, and a
  member who charges to be mailed (CSPA) can't be mailed from here.
- **Closing** takes the member out of the channel straight away, saves the transcript, then removes the channel from
  Discord. For a mail-only ticket it just marks it closed. The channel is never removed before its transcript is
  complete: if saving fails, the channel stays and it's tried again every 15 minutes, with the reason on the ticket.
- **Transcripts:** closing saves every message of the channel on the ticket's page here, within a minute or two for all
  but very long channels. Everyone with `tickets.open_tickets` can read them, and each read goes in the audit log. A
  member a ticket was opened with can't; someone who opened their own from a panel can, under **My tickets**. Attached files are copied too, up to 25 MB each and 200 MB per ticket; a file over that is only listed
  by name and is lost with the channel. Files live in the database, so they're in every backup. Plain images (PNG, JPEG,
  GIF, WebP) show in the transcript; anything else downloads. A channel deleted by hand on Discord
  before the ticket closes has no transcript. Mail tickets show the mail that was sent, but not replies in the game.
- **Settings** (permission `tickets.manage_tickets`): the Discord category for new channels, the roles ticked by default, and a check
  of what the bot is missing.

## Panels

**Panels** (permission `tickets.manage_tickets`) posts a message with up to 5 buttons in a channel you pick. Each button
has its own Discord roles and, optionally, its own category.

- **Opening:** clicking a button asks for a subject and a message, then makes a private channel for that person and the
  button's roles, and pings those roles. A role only notifies its members if it allows mentions or the bot has Mention
  Everyone.
- **Who can use one:** anyone who can see the channel, as long as they have linked Discord on this site, whatever their
  state. Everyone else is told to link first. Limit who can see the channel on Discord to limit who can use it.
- **Limits:** one open ticket per person per button, and a minute between tickets from panels.
- **Closing:** every new channel has a **Close ticket** button, with a confirmation. Whoever opened the ticket, anyone
  holding one of its roles and anyone with `tickets.open_tickets` can use it, once they've linked Discord. It does the
  same as closing here.

To make buttons work, copy the address shown under Panels into **Interactions Endpoint URL** on the General Information
page of your Discord application. The site must be reachable from the internet over https. Requests that don't carry
Discord's signature are refused. Opening and closing happen in the background, so they need the site's workers running.
Panels don't work while the site is in maintenance mode.

## Who can have what

A Discord ticket needs both people to have linked Discord and be on the server; a mail doesn't. You can have one open
ticket per member, of any kind; other people can open their own with the same member. Opening, closing and removing a channel go in the audit log, and the member gets a
notification, linking to the channel if there is one.

Setting up:

1. Set up the Discord plugin and switch it on.
2. Under Discord Tickets → Settings, use **Invite the bot with ticket permissions**. It adds Manage Channels, View
   Channels, Send Messages, Embed Links, Attach Files and Read Message History.
3. On the **Bot** page of your Discord application, turn on **Message Content Intent**. Without it Discord blanks
   the text of the messages, and the transcript keeps retrying until it's on. Settings warns you if it's off.
4. Optionally pick a category and the Discord roles ticked by default. If the category has its own permissions, the bot must be allowed to
   manage channels there.
5. Only EVE mail is wanted? Steps 2 to 4 can wait, but the Discord plugin must still be installed and switched on.
6. Give `tickets.open_tickets` to whoever should open tickets, under Administration → Access.

Every ticket shows when it was opened and closed, and by whom, in EVE time. The bot's messages on Discord show those
times in each reader's own time zone, and a mail says when its ticket was opened. Whoever opens a ticket can pick any
role on the server except @everyone and bots' own roles. Roles are fixed once the channel exists.
