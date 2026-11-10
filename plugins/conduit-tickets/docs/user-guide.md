# Discord Tickets — User guide

Discord Tickets gives you a private line to staff. Staff can open a ticket with you, which makes a private channel on
the Discord server, sends you an EVE mail, or both. You can also open your own ticket by clicking a button on a ticket
panel in a Discord channel. When a ticket is closed, its channel is saved as a transcript on this site and removed from
Discord.

## Before you start

- Link your Discord account on this site first (**Discord** in the main menu, then **Link Discord and join**). Without
  a linked account you can't use ticket panels, and staff can only reach you by EVE mail.
- Stay on the Discord server. A Discord ticket needs you to be on it.

## When staff open a ticket with you

You get a notification under the bell:

| Notification | What it means |
|---|---|
| "Discord ticket: <subject>" | A private channel was made for you on Discord. Click the notification to open it. |
| "EVE mail: <subject>" | Staff sent an EVE mail to your main character. Read it in the game. |

In a Discord ticket:

1. Open the channel from the notification, or find it in the server's channel list. Its name starts with `ticket-`.
2. The bot pings you with the subject and, if there is one, a first message.
3. Talk to staff in the channel. Only you, the person who opened it, the bot and the Discord roles they chose can see
   it. You can post messages and attach files.

When the ticket is closed you lose access to the channel straight away, and you get a "Discord ticket closed: <subject>"
notification. A ticket staff opened with you stays with staff: you can't read its transcript on this site.

If a mail ticket includes a channel too (**Both**), the mail contains a link to the channel.

## Opening your own ticket from a panel

Some Discord channels have a ticket panel: a message from the bot with one or more buttons (for example
"Recruitment").

1. Click the button that fits your question.
2. Fill in **Subject** (required, up to 100 characters) and **Message** (optional, up to 1500 characters) and submit.
3. The bot replies, only visible to you, with "Your ticket is open:" and a link to your new private channel.
4. The staff roles for that button are pinged in the channel. Talk to them there.

Limits:

- One open ticket per button. Clicking again tells you where your open ticket is.
- One new ticket per minute from panels.

## Closing a ticket on Discord

Every ticket channel starts with a **Close ticket** button.

1. Click **Close ticket**.
2. Confirm with **Yes, close it**.

The channel is saved as a transcript and then removed from Discord. You can close a ticket you opened from a panel.
Staff with the ticket's roles can close it too.

## My tickets

**My tickets** in the menu (`/p/tickets/mine`) lists the tickets you opened from a panel, with the button you used,
when it opened and when it closed.

- While a ticket is open, click **Open in Discord** to go to its channel.
- Click a subject to open its page. Once the ticket is closed, the page shows the transcript: every message, who wrote
  it, and the files attached. Times are shown in EVE time.

## Notifications

All notifications from this plugin are in the **Discord Tickets** category. You can mute it under
**Settings → Notifications**, but then you may miss a ticket staff opened with you.

## FAQ and troubleshooting

**The bot says "Link your Discord account first".**
Link Discord on this site (the link in the message takes you there) and try the button again.

**"You already have a ticket open for this".**
You already have an open ticket from that button. Use the link in the reply to go to it.

**"You've only just opened a ticket. Try again in a minute."**
Wait a minute between tickets from panels.

**"This button no longer works".**
The panel was changed or removed. Ask staff where the current panel is.

**"The site couldn't take that just now".**
The site is busy or restarting. Try again in a minute.

**I can't see the ticket channel any more.**
The ticket was closed. The channel is removed once its transcript is saved.

**Can I read the transcript of a ticket staff opened with me?**
No. Only tickets you opened yourself from a panel appear under **My tickets**.

**Some files in my transcript say "not kept".**
Files over 25 MB, beyond 200 MB per ticket, or beyond the space the site keeps for files are not copied ("too
large, or no space left for files"). Files already gone from Discord show "no longer on Discord", and files the site
only keeps for a while show "deleted after the keeping time".

**Replies to an EVE mail ticket aren't on the site.**
Replies sent in the game are not saved here.
