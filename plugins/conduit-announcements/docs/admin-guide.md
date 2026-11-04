# Announcements — Admin guide

Announcements lets leadership post news to everyone or to chosen states and groups. Posts can be pinned, scheduled
for later and taken down at a set time. When one goes out, the audience gets a notification and an event fires that
a webhook can send to Discord. Announcements also appear on the dashboard and in the Bulletin on the landing page.
This guide covers installing, permissions, writing and the integrations.

## Requirements

| Item | Requirement |
|---|---|
| EvE Conduit | 0.5.55 or newer |
| Other plugins | None. The Discord plugin is optional; with it linked you can pick Discord roles to ping. |
| ESI scopes | None |
| In-game corp roles | None |

## Installing and switching it on

1. Go to **Administration → Plugins → Browse**.
2. Select **Announcements** and install it. Leave **Switch on after installing** on, or switch it on later.
3. On the **Installed** tab, make sure the switch for Announcements is on.

Announcements is switched on by default on a fresh install. It is a members-only plugin: guests (the public state)
don't get the page, the widget, the Bulletin or search results.

To make it the first page people see after signing in, pick **Announcements** under
**Administration → Settings → Start page**.

## Permissions

Reading needs no permission; every member sees the announcements meant for them.

| Permission codename | What it allows | Suggested group |
|---|---|---|
| `announcements.post_announcements` | Write, edit, pin and delete announcements; see scheduled and ended ones; choose the audience; set the Discord pings for both announcement events | Directors / leadership |

The permission is listed under the director tier in the permission picker. Give it to a group under
**Administration → Groups**, in the group's **Permissions**.

## Writing an announcement

1. Open **Announcements** and click **New announcement**.
2. Fill in **Title** (required, up to 200 characters).
3. Write the **Message**. It supports light Markdown: `**bold**`, `*italic*`, `` `code` ``, `[link](https://…)`,
   `-` and `1.` lists, `#` headings and `>` quotes. A blank line starts a new paragraph. Switch to **Preview** to see
   how it will look. Links must be `https://` or a path on this site; other links are not made clickable.
4. Pick the **Kind**: **News**, **Important** or **Urgent**. Urgent ones notify people even if they muted
   announcements.
5. Under **Who sees it**, pick any mix of states and groups. Nothing picked means everyone. A member sees it if they
   are in any one of the picked states or groups.
6. Set the switches:

| Setting | Default | What it does |
|---|---|---|
| **Pin to the top** | Off | Keeps it above the others on the page and makes it the lead story in the Bulletin. |
| **Post to the landing page** | On | Shows it in the Bulletin on `/home`, to the people it is meant for. |
| **Notify people** | On | Sends a notification to the audience when it goes out. Locked once it has been sent. |
| **Publish at** | Empty | Empty means straight away. A future time schedules it. Locked once published. |
| **Take down at** | Empty | Optional. After this time it disappears for members. Must be after the publish time. |

7. Click **Post**, or **Schedule** if the publish time is in the future.

The footer of the dialog tells you who will see it and from when.

## Day-to-day operation

- **Edit, pin or delete:** open the menu (three dots) on an announcement and choose **Edit**, **Pin to the top** /
  **Unpin**, or **Delete**. Deleting removes it for everyone; notifications already sent stay in people's lists.
- **Editing a published announcement** does not notify anyone again and keeps its original date unless you set a new
  **Publish at**.
- **What members see / Everything:** writers get a toggle at the top of the page. **Everything** also shows
  scheduled announcements (badge "Goes out …") and ended ones (badge "Ended …"). Writers also see each post's
  audience ("for everyone" or the list of states and groups) and its end time.
- **Bulletin:** to hide the whole Bulletin from the landing page, switch it off under
  **Administration → Settings → Landing page → From plugins** (listed as "Bulletin (latest announcements)"). To keep
  a single announcement out of it, switch **Post to the landing page** off for that announcement.

## Notifications, webhooks and Discord pings

When an announcement goes out (straight away, or when its scheduled time comes):

- If **Notify people** is on, everyone in the audience gets a notification in the **Announcements** category. Its
  level follows the kind: News = info, Important = warning, Urgent = danger. Urgent ones ignore muting.
- One event fires:

| Event | When | Notes |
|---|---|---|
| `announcements.published` | An announcement for everyone went out | Payload: `announcement_id`, `title`, `summary` (plain text, up to 500 characters), `author`, `audience` (`"everyone"`), `link`, `level` |
| `announcements.published_restricted` | An announcement for some states or groups only went out | Same payload, with `audience` listing the state and group names. Private: it is never sent to webhooks set to "all events", only to ones that pick it. |

The event fires once per announcement, even if **Notify people** is off.

To post announcements to Discord:

1. Under **Administration → Integrations**, add a Discord webhook and select `announcements.published`. Send
   `announcements.published_restricted` only to a channel that the restricted audience alone can read, or nowhere.
2. To make these posts ping, open **Announcements** and click **Discord pings** (shown to writers once a Discord
   webhook exists). In the **Announcement alerts** dialog, switch the ping on per event. With the Discord plugin
   linked to a server you can also pick roles to ping. Changes save straight away.

## Privacy and audit logging

These actions are recorded in the audit log (**Administration → Logs → Audit**), with who did it:

| Action | Recorded as |
|---|---|
| Posting | `announcements.create` |
| Editing | `announcements.update` |
| Pinning or unpinning | `announcements.pin` |
| Deleting | `announcements.delete` |

The plugin stores, per member, which announcements they have read. It does not collect anything from ESI.

## Background jobs

| Job | Schedule | What it does |
|---|---|---|
| `publish-due` | Every 120 seconds | Sends notifications and the webhook event for scheduled announcements whose time has come. |

A scheduled announcement can therefore go out up to about two minutes after its publish time. It only runs while the
plugin is enabled.

## Group rules

Announcements adds no group rules.

## Troubleshooting

**A scheduled announcement didn't notify anyone.**
Check that the Celery beat and worker are running; the `publish-due` job sends it. Also check that **Notify people**
was on.

**Discord pings button is missing.**
It only shows to writers once at least one Discord webhook exists under **Administration → Integrations**.

**A restricted announcement didn't reach Discord.**
`announcements.published_restricted` is private. Select it explicitly on the webhook.

**"It has to end after it's published".**
**Take down at** must be later than **Publish at** (or later than now if publish is empty).

**"Some of those states or groups don't exist".**
A state or group was deleted while the editor was open. Close the dialog and try again.

**Members say the Bulletin is empty.**
Only announcements with **Post to the landing page** on and meant for that member appear. Check the Bulletin is
switched on under **Administration → Settings → Landing page → From plugins**.
