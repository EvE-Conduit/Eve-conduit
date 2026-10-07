# Announcements

News and orders from leadership, on a page of its own and on the dashboard.

- **Announcements** (everyone): pinned announcements on top, then the newest. Unread ones are marked new until
  the page is opened. Ctrl+K search finds them. A dashboard widget shows the latest three.
- **Writing** (permission `announcements.post_announcements`): title and message (light Markdown: **bold**,
  *italic*, `code`, links, lists, headings and quotes, with a preview), News / Important / Urgent, pinning, and who
  sees it (any mix of states and groups; nothing picked means everyone). Announcements can be scheduled for later
  and taken down at a set time. Writers can switch to "Everything" to see scheduled and ended ones.
- **Telling people:** when an announcement goes out, everyone who can see it gets a notification (urgent ones even
  if they muted announcements), and the `announcements.published` event fires, so a Discord webhook under
  Administration → Integrations can post it to a channel.

To make it the first page people see after signing in, pick **Announcements** under Administration → Settings →
Start page (needs EvE Conduit 0.5.7 or newer; the plugin itself works on 0.5.6).
