# Discord

Members link their Discord account and join your server in one click. Their roles and nickname then follow their
groups, state and main character.

- **Discord** (permission `discord.access_discord`): "Link Discord and join" signs them in with Discord and puts
  them on the server with their roles and nickname (`[TCORP] Pilot One` by default). Afterwards the page shows
  their roles, a "Fix my roles" button (once every 30 seconds), and unlinking. Unlinking only forgets the account
  once Discord has taken the roles away; if Discord can't be reached it stays linked and says so. There's also a
  dashboard widget.
- **Server setup** (permission `discord.manage_discord`): step-by-step setup of the Discord application, the bot and
  the server, with a connection check that lists anything in the way (missing bot permissions, roles above the
  bot's own). Map groups and states to Discord roles, and see every linked member with their roles and the last
  sync result, with sync, unlink and kick (an administrator can force an unlink while Discord is unreachable; the
  roles then stay on Discord).

How syncing works:

- Only roles mapped to a group or state are touched. Roles given by hand in Discord stay.
- Roles change straight away when someone joins or leaves a group, their state changes or they pick another
  main. Everyone is checked again every 6 hours, which also catches people who left the server.
- Every state gets `discord.access_discord` by default (existing states when the plugin is installed or updated
  to 1.0.2, and every new state), so guests can link too, e.g. to apply. Take it off a state under
  Administration → Access to keep them out; people without it lose their mapped roles, or are kicked from the
  server if "Remove people who lose access" is on.
- Nicknames take `{character}`, `{corp_ticker}`, `{corp}`, `{alliance_ticker}` and `{alliance}`. Leave the format
  empty to let people choose their own. Discord doesn't let anyone change the server owner's nickname.

Setting up (also shown in Server setup):

1. Create an application at https://discord.com/developers/applications. On **OAuth2**, add the redirect
   `https://<your site>/p/discord/callback` and copy the client id and secret.
2. On **Bot**, press **Reset Token** and copy the token. Paste it with the server id (Developer Mode → right-click
   the server → Copy Server ID), save, and use **Invite the bot to the server**. It asks for Manage Roles, Manage
   Nicknames, Create Invite and Kick Members.
3. In Server Settings → Roles, drag the bot's role above every role it should give.

The client secret and bot token are encrypted in the database like SSO tokens and never sent back to the browser.

Events for webhooks: `discord.linked`, `discord.unlinked`.
