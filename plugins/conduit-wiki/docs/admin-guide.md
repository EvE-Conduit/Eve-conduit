# Wiki — Admin guide

The Wiki is a tree of Markdown pages with full history. Managers decide who sees each page (by state and group), lock
pages, move and delete them, and make pages public for people who are not signed in. This guide covers requirements,
permissions, page settings, public pages, webhooks and troubleshooting.

## Requirements

| Item | Details |
| --- | --- |
| EvE Conduit version | 0.5.36 or later (`min_conduit`) |
| Other plugins | None |
| ESI scopes | None |
| EVE corporation roles | None |
| Access | Members only, except pages marked public. |

## Install and switch on

1. Go to **Administration → Plugins → Browse**.
2. Find **Wiki** (category Community) and install it.
3. Switch it on, either with **Switch on after installing** or under the **Installed** tab.

On a fresh EvE Conduit install, the Wiki is switched on automatically if it is installed.

**Wiki** then shows in the menu for members.

## Permissions

| Permission codename | What it allows | Suggested group |
| --- | --- | --- |
| (none) | Read the pages meant for you, see page history, search pages. | All members |
| `wiki.edit_pages` | Write new pages, and edit and restore pages they can read that are not locked. Choose the parent when creating a page. | A writers' group, or every members' state for an open wiki |
| `wiki.manage_wiki` | Everything above on every page, plus: choose who sees a page, lock pages, make pages public, move pages to another parent, delete pages. Managers see every page. | Directors |

Give `wiki.edit_pages` to a group under **Administration → Groups** to let its members write. Give it to every
members' state to run an open wiki.

## Setting up

There are no plugin-wide settings. Everything is set per page.

### Write the home page

1. Open **Wiki**.
2. Press **Write the home page**. The address is set to `home` and the title to `Home`.
3. Write what the wiki is for and where to find things.
4. Press **Create**.

The page at the address `home` opens first when anyone opens the wiki. Until it exists, the wiki shows
**Recently updated**.

### Page settings

Open a page and press **Edit** (or make a new page). Managers see extra settings.

| Setting | Default | Who can set it | What it does |
| --- | --- | --- | --- |
| **Title** | empty | Editors and managers | Required. Up to 200 characters. |
| **Text** | empty | Editors and managers | Markdown, up to 200,000 characters. |
| **What changed** | empty | Editors and managers | A short note for the page's history. Optional. |
| **Address** | made from the title | Editors and managers | The page's address, `/p/wiki/<address>`. Made unique by adding `-2`, `-3` and so on. Changing it breaks links to the old address. |
| **Under** | **Top level** | Editors when creating; managers at any time | The parent page. A page cannot be put inside itself or one of its own sub-pages. |
| **Who sees it** | nothing picked (every member) | Managers | States and groups that may see the page. A member sees it if they are in any picked state or group. |
| **Public** | off | Managers | Anyone can read the page, signed in or not, at `/public/p/wiki/<address>`. |
| **Locked** | off | Managers | Only people who manage the wiki can edit it. |

Below the settings, a line sums up who will see the page.

Managers see a **For <states and groups>** badge on pages with a limited audience.

## Day-to-day

### Moving a page

1. Open the page and press **Edit**.
2. Pick a new parent under **Under**, or **Top level**.
3. Press **Save**.

New pages go to the end of their level. The page tree is sorted by that position, then by title. This version has no
button to reorder sibling pages.

### Deleting a page

1. Open the page.
2. Open **More** (three dots) → **Delete**.
3. Confirm in **Delete "<title>"?**.

Its sub-pages move up a level. The page and its history are gone for good.

### Restoring a revision

Editors and managers can restore an old revision from the page's history with **Restore**. This makes a new
revision, so nothing is lost. Editors cannot restore locked pages.

## Public pages

- Public pages are listed at `/public/p/wiki` and readable at `/public/p/wiki/<address>` without signing in.
- They do not show who wrote or edited them.
- On public pages, only images from the site itself load. Images from other sites become a link, so an outside image
  cannot track who reads the page.
- Guests (the public state) get only the public pages.
- **Public** and **Who sees it** are separate. A page limited to some states and groups but marked public can still be
  read by anyone at its public address.

## Webhooks and Discord

Webhook events, available under **Administration → Integrations**. Each carries the page's title, address, the
editor's note, the author and a link.

| Event | Label | When |
| --- | --- | --- |
| `wiki.page_created` | Wiki page created | A new page for every member was written. |
| `wiki.page_updated` | Wiki page edited | A page for every member was saved, or a revision was restored. |
| `wiki.page_created_restricted` | Wiki page created (for some states or groups only) | A new page with a limited audience was written. |
| `wiki.page_updated_restricted` | Wiki page edited (for some states or groups only) | A page with a limited audience was saved, or a revision was restored. |

The `_restricted` events also carry `audience` (the states and groups). They are private events: a webhook set to
"every event" leaves them out. Only a webhook that picks them by name gets them, for example one that posts to a
leadership channel.

The plugin has no Discord pings and sends no personal notifications.

## Group rules

The plugin adds no group rules.

## Privacy and audit log

Pages a member cannot see are left out of their tree, search results (Ctrl+K) and breadcrumbs. Every revision keeps
the author and time.

Audit log entries (**Administration → Logs → Audit**):

| Action | Logged when |
| --- | --- |
| `wiki.create` | A page was written. |
| `wiki.update` | A page was saved. |
| `wiki.restore` | An old revision was restored. |
| `wiki.delete` | A page was deleted. |

## Background jobs

The plugin has no scheduled jobs.

## Troubleshooting

| Message or symptom | What to do |
| --- | --- |
| "This page is locked" | Only `wiki.manage_wiki` can edit it. Unlock it, or ask a manager. |
| "You can't edit wiki pages" / "You can't write wiki pages" | Give the member `wiki.edit_pages`. |
| "No such page" for a member | The page is limited to states or groups they are not in. Check **Who sees it**. |
| "A page can't be inside itself" | Pick a parent that is not the page itself or one of its sub-pages. |
| "That page is too long" | The text is over 200,000 characters. Split it into sub-pages. |
| The address got `-2` added | Another page already uses that address. Pick a different one. |
| A `[[Page Title]]` link goes nowhere | No page has that title's address yet. Write it, or fix the link. |
| A public page shows no images | Only images from the site itself load on public pages. |
| A restricted page's edits do not reach a webhook | Pick the `_restricted` events for that webhook by name. |
