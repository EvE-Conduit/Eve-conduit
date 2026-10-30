# Discord Tickets

Open a private Discord channel with a member you pick. Needs the [Discord](../conduit-discord) plugin: tickets use its
bot, its server and its linked accounts.

- **Discord Tickets** (permission `tickets.open_tickets`): search for a member by their main, their Discord name or an
  alt you may see on their character sheet, give a subject and an optional first message. The bot makes a channel
  only the two of you and the staff role can see, and pings the member there. Everyone with the permission sees all
  tickets and can close them.
- **Closing** takes the member out of the channel. It stays on Discord for whoever opened it and the staff role.
  Whoever opened it or a tickets manager can then delete the channel, which can't be undone. EvE Conduit doesn't keep
  what was said in the channel.
- **Settings** (permission `tickets.manage_tickets`): the Discord category for new channels, the staff role, and a check
  of what the bot is missing.

Both people must have linked Discord and be on the server. You can have one open ticket per member; other people can
open their own with the same member. Opening, closing and deleting go in the audit log, and the member gets a
notification linking to the channel.

Setting up:

1. Set up the Discord plugin and switch it on.
2. Under Discord Tickets → Settings, use **Invite the bot with ticket permissions**. It adds Manage Channels, View
   Channels, Send Messages, Embed Links, Attach Files and Read Message History.
3. Optionally pick a category and a staff role. If the category has its own permissions, the bot must be allowed to
   manage channels there.
4. Give `tickets.open_tickets` to whoever should open tickets, under Administration → Access.
