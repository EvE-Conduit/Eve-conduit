# Wiki — User guide

The Wiki holds guides, rules and reference pages written by your corporation. Pages sit in a tree, are written in
Markdown, and keep a full history. You see the pages meant for you. If you have the right to write, you can also add
and edit pages.

## Where to find it

- **Wiki** in the site menu opens the wiki (`/p/wiki`).
- The **Wiki** dashboard widget lists the five most recently updated pages, with **Open the wiki →**.
- Wiki pages show up in the site search (Ctrl+K), matched on title first and then on text.

## Reading pages

1. Open **Wiki**. If someone wrote a page at the address `home`, it opens first. Otherwise you see
   **Recently updated**.
2. Use the page tree on the left to open a page. Click the arrow next to a page to expand or collapse its sub-pages.
   With more than six top-level pages, a **Find a page** box filters the tree.
3. On a page, the breadcrumb at the top shows where it sits. **On this page** lists its headings, so you can jump to
   a section.
4. **In this section** at the bottom lists the page's sub-pages.

Badges on a page:

| Badge | Meaning |
| --- | --- |
| **Public** | Anyone can read it, signed in or not. |
| **Locked** | Only wiki managers can edit it. |

Under the title you see who last changed the page, when, and how many revisions it has.

Pages that are not meant for you do not show anywhere: not in the tree, search results or breadcrumbs.

## Page history

Everyone who can read a page can see its history.

1. Open the page.
2. Click the revision count under the title (for example "3 revisions"). Editors can also use the **More** menu
   (three dots) → **History**.
3. Pick a revision on the left. Each shows the editor's note (or "Written" / "Edited"), who made it and when.
4. Switch between **Changes since rN** (the lines added and removed) and **As it looked** (the page at that time).

## Writing pages

You need the `wiki.edit_pages` permission. If you have it, you see **Edit** on pages you can edit, and you can make
new pages.

### Make a new page

1. Do one of these:
   - On an existing page, open **More** → **New page under this one**.
   - Open a link to a page that does not exist yet and press **Write this page**.
   - On an empty wiki, press **Write the home page**.
2. Fill in **Title**.
3. Write the **Text** in Markdown. Use **Write** and **Preview** to switch between the editor and a preview.
4. Optionally fill in **What changed**, a short note for the page's history.
5. Check **Address**. It is made from the title unless you type one. The page will be at `/p/wiki/<address>`.
6. Pick **Under**: the page this one is nested in, or **Top level**.
7. Press **Create**.

### Edit a page

1. Open the page and press **Edit**.
2. Change the title, text or address.
3. Add a note under **What changed**.
4. Press **Save**, or **Cancel** to go back.

Changing the address breaks links to the old address. Only wiki managers can move a page under another page after it
was created.

### Markdown you can use

| You type | You get |
| --- | --- |
| `**bold**`, `*italic*`, `` `code` `` | Bold, italic, inline code |
| `# Heading`, `## Heading` | Headings (also listed in **On this page**) |
| `- item`, `1. item` | Lists. Press Tab to indent and nest. |
| `- [ ] task` | Task list |
| `> quote` | Quote |
| `\| a \| b \|` | Table |
| ```` ``` ```` | Code block |
| `[link](https://...)` | Link |
| `![image](https://...)` | Image. Only `https` addresses. |
| `[[Page Title]]` or `[[Page Title\|label]]` | Link to the wiki page saved under that title, whether it exists yet or not |

Images load lazily and without a referrer. On public pages, only images from the site itself show; others become a
link.

### Restore an old revision

1. Open the page's history.
2. Pick the revision you want.
3. Press **Restore**, then confirm in **Restore revision N?**.

The page's title and text go back to how they were. This makes a new revision, so nothing is lost.

## Public pages

Some pages are public, for example recruitment material and rules. Anyone can read them at
`/public/p/wiki/<address>`, without signing in. The public list is at `/public/p/wiki`. Public pages do not show who
wrote them.

## Notifications

The wiki sends no personal notifications.

## FAQ and troubleshooting

**"No such page".**
There is no page at that address, or it is not meant for you. If you can write pages, you can press
**Write this page** to make it.

**I cannot see the Edit button.**
You do not have `wiki.edit_pages`, or the page is **Locked**. Ask a wiki manager.

**I cannot choose Under when editing.**
Only wiki managers can move an existing page. You choose the parent when you create a page.

**My image does not show.**
Use an `https://` address. On public pages, only images hosted on the site itself show.

**A `[[link]]` goes to an empty page.**
No page has that title yet. The link points to the address made from the title. Write the page, or fix the title in
the link.
