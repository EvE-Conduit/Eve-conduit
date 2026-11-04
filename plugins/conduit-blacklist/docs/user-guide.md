# Blacklist — User guide

This guide is for the recruiters, HR staff and officers who use the blacklist day to day. **Regular members never see
this plugin.** Without the `blacklist.view_blacklist` permission there is no sidebar entry, no page, no search
results, and nobody is told when one of their characters matches. The blacklist holds characters, corporations and
alliances you don't want, with a reason and a notes thread for each. It warns you when a member's or applicant's
character matches one of them.

## Where to find it

- Sidebar: **Blacklist**. The page has three tabs: **Entries**, **Warnings** and **Check a name**.
- Search (Ctrl+K) finds blacklist entries by name.
- Dashboard: the **Blacklist** widget shows the number of open warnings, how many entries are on the list and the
  latest open warnings. Click it to open the blacklist.

What you can do depends on your permissions:

| You have | You can |
| --- | --- |
| `blacklist.view_blacklist` | See entries and warnings, add notes, check a name, mark warnings as dealt with |
| `blacklist.manage_blacklist` | Also add, change and remove entries, and set Discord pings for warnings |

## How matching works

A character matches when:

- the character itself is on the blacklist, or
- the character's corporation is on the blacklist, or
- the character's alliance is on the blacklist.

Only active entries match. An entry with an expiry date stops matching once that date has passed.

Characters are checked:

- when someone links a character, and again 5 minutes later (by then the character's corporation and alliance are
  known);
- when a character moves to another account;
- when someone applies through the Recruitment plugin;
- every hour, for everyone;
- straight away for all registered members when someone adds a new entry.

Each match (one character against one entry) is reported once. It is reported again only if that character moves
to a different account.

## Browsing entries

1. Open **Blacklist** and stay on the **Entries** tab.
2. Narrow the list with:
   - the search box (**Search names and reasons**);
   - the kind filter (**Everything**, **Character**, **Corporation**, **Alliance**);
   - **Active**, **Expired** or **All**.
3. The table shows **Name**, **Severity**, **Reason**, **Added** (date and who added it), **Expires** and
   **Warnings** (open warnings for that entry).
4. Click a name to open the entry.

Severity means:

- **Banned**: they must not join.
- **Watch**: keep an eye on them.

## An entry's page

The entry page shows:

- the kind, name, who added it and when, and the expiry date if there is one;
- the severity badge, and an **Expired** badge once it has run out;
- **Reason**;
- **Warnings**: registered characters this entry covers;
- **Notes**: a thread shared with everyone who can see the blacklist.

To add a note:

1. Type in **Add a note** under **Notes**.
2. Click **Add note**.

## Adding someone (needs `blacklist.manage_blacklist`)

1. On the Blacklist page, click **Add**.
2. Under **Who**, type the exact character, corporation or alliance name (at least 3 characters) and click **Find**.
   The name is looked up in EVE.
3. Pick the right result. A result marked **Already on it** is on the list already and can't be picked.
4. Choose **Severity**: **Banned** (the default) or **Watch**.
5. Write a **Reason**. Only people who can see the blacklist read it.
6. Optionally set **Expires (optional)**. Left empty, the entry never runs out. The date must be in the future.
7. Click **Add**. You go to the new entry's page.

Registered members the new entry covers are looked for straight away. Any matches appear under **Warnings**.

## Changing or removing an entry (needs `blacklist.manage_blacklist`)

To change an entry:

1. Open the entry and click **Change**.
2. Change **Severity**, **Reason** or **Expires (optional)**. You can't change who the entry is for; remove it and
   add a new one instead.
3. Click **Save**.

To remove an entry:

1. Open the entry and click **Remove**.
2. Confirm with **Remove**.

Removing an entry deletes its notes and warnings with it. The removal is kept in the audit log.

## Dealing with warnings

1. Open the **Warnings** tab. The count next to the tab is the number of open warnings.
2. Choose **Open** or **Dealt with**.
3. Each row shows the **Character**, the **Account** it belongs to, what it is **Blacklisted as** (entry name, kind
   and severity), and when and how it was **Found**: **Linked**, **Applied** or **Regular check**.
4. Look into it. Use the entry's notes to record what you found or decided.
5. Click **Dealt with** to close the warning. Your name is shown next to it.
6. To bring a closed warning back, switch to **Dealt with** and click **Reopen**.

When someone applies, any of their open warnings (not yet dealt with) are sent out again, so recruiters see them at
the right time.

## Checking a name

Use this for someone who hasn't registered on the site.

1. Open the **Check a name** tab.
2. Type the exact character, corporation or alliance name (at least 3 characters) and click **Check**.
3. For each result you see **Not blacklisted**, or the entries that cover it. For a character, its current
   corporation and alliance are checked too, shown as "(their corporation)" or "(their alliance)". For a
   corporation, its alliance is checked too.

If EVE knows nobody by that exact name, the page says so.

## Notifications

Everyone with `blacklist.view_blacklist` gets a notification for each new match, titled
"Blacklisted: <character>". It says whose account the character is on, how it was found, the severity and the
reason, and links to the entry.

The notifications are in the **Blacklist warnings** category. You can turn the category off under **Settings** →
**Notifications**, but warnings for **Banned** entries still arrive.

## FAQ and troubleshooting

**I can't see the Blacklist in the sidebar.**
You need `blacklist.view_blacklist`. Ask an administrator.

**I see the blacklist but there's no Add button.**
Adding, changing and removing need `blacklist.manage_blacklist`.

**"EVE knows nobody by that exact name."**
The lookup needs the exact name. Check spelling, spaces and punctuation.

**"ESI lookup failed".**
EVE's API couldn't be reached. Try again in a few minutes.

**I get "The expiry date has to be in the future" when I save an expired entry.**
Clear the expiry date or set a new one in the future.

**A warning I marked as dealt with didn't come back on the hourly check.**
That is expected. A match is reported once. It comes back only if the character moves to another account, or (while
still open) when the person applies.

**The member who matched doesn't know about it.**
That is by design. Nothing is shown or sent to the person who matched.
