# Wiki

Guides, rules and reference pages written by your corporation, in a tree, with history.

- **Reading** (every member): the page tree on the left, the page on the right, and an "On this page" list of its
  headings. The page saved at the address `home` opens first; until someone writes it, the wiki shows the recently
  updated pages instead. Pages turn up in Ctrl+K search, and the dashboard widget lists the latest changes.
- **Writing** (permission `wiki.edit_pages`): Markdown with a live preview: headings, lists (indent to nest), task
  lists, quotes, tables, code blocks, images (https only) and `[[Page Title]]` links to other pages, which point at
  the page saved under that title whether it exists yet or not. Each page has an address (made from its title, or
  chosen), sits under another page or at the top level, and takes a short note on what changed.
- **History** (everyone who can read the page): every revision with who wrote it and when, the lines each one added
  and removed, and the page as it looked then. Editors can restore an old revision; that makes a new one, so nothing
  is lost.
- **Managing** (permission `wiki.manage_wiki`): choose who sees a page (states and groups; nothing picked means every
  member), lock a page so only managers edit it, delete pages (their sub-pages move up a level), reorder siblings,
  and make a page **public**: readable by anyone, signed in or not, at `/public/p/wiki/<address>`, for recruitment
  material and rules applicants should read first. Managers see every page, so nothing is ever out of reach.

Guests (the public state) get only the public pages. Pages someone can't see are also left out of their search
results, breadcrumbs and the tree.

## Events

- `wiki.page_created` and `wiki.page_updated` go to webhooks, with the page's title, address, the editor's note and a
  link.

## Permissions

| Permission         | Who it's for | What it allows                                                                      |
|--------------------|--------------|-------------------------------------------------------------------------------------|
| `wiki.edit_pages`  | members      | Write new pages, edit and restore pages they can read that aren't locked             |
| `wiki.manage_wiki` | directors    | Everything above on every page, plus delete, lock, reorder, audiences and public pages |

Hand `wiki.edit_pages` to a group (Administration → Groups) to let its members write, or to everyone's state to run
it as an open wiki.
