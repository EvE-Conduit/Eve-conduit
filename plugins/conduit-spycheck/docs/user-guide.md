# Spy Check — User guide

Spy Check scans every member character's synced data once a day for dealings with characters, corporations and alliances you do not trust: wallet journal lines, market trades, contracts, mail, contacts and corporation history. Each hit becomes a finding that a reviewer looks at and marks acknowledged or dismissed. **Members do not see this plugin.** It has no menu entry, page or widget for them. This guide is for the HR and counter-intelligence reviewers who work through the findings day to day.

## Who can use it

- You need the `spycheck.view_findings` permission to see Spy Check. People with `spycheck.manage_spycheck` see it too, plus the **Settings** tab and **Scan now**.
- You only see findings on characters your character sheet permissions reach: all characters, your alliance's or your corporation's, as in Member Audit.
- You never see, hear about or review findings on your own characters.

## Where to find it

- **Spy Check** in the main navigation. The page has the tabs **Findings**, **Members**, **Watch list** and, for managers, **Settings**.
- The dashboard **Spy Check** widget shows the number of new findings, how many members they involve and how many entities are watched. It shows **To review** or **All reviewed**. Click it to open Spy Check.
- The page header shows when the last scan ran and how many characters it covered.

## What a finding is

A finding is one member character's dealings of one kind with one watched entity. The kinds are:

| Kind | What counts |
| --- | --- |
| Wallet journal | Journal lines with the entity on either side (ISK moved either way). |
| Market | Market transactions with the entity as the other party. |
| Contracts | Contracts the entity (or its corporation) issued, was assigned or accepted. |
| Mail | Mail from the entity, or to it as a character, corporation or alliance. |
| Contact | A contact for the entity with good standing (above 0 unless your managers changed it). |
| Corporation history | The character is or was in a watched corporation, or in a corporation that is in a watched alliance today. |

Each entity is matched by its own id. Dealings with a corporation's members do not count against the corporation. A member's own alts never count, and guests are never scanned.

## The Findings tab

The table lists findings, most recently flagged first, 50 per page.

| Column | What it shows |
| --- | --- |
| Member | The member who owns the character. Click to open their member page. |
| Character | The character with the dealings. |
| Dealt with | The watched entity. **Blacklist** next to it means it came from the Blacklist plugin. |
| How | The kind of finding. |
| Evidence | How many records and the ISK in them (for contacts, the standing; for corporation history, the number of stints). |
| Seen | The date of the first and last record. Contacts have no date. |
| Status | **New**, **Acknowledged** or **Dismissed**, plus any of: **Reopened: newer evidence**, **Newer evidence**, **No longer found**. |

Filters above the table:

- **New**, **Acknowledged**, **Dismissed**, **All**: the state to show. **New** is the default.
- **Every kind**: limit to one kind.
- Search box: a member, character or the entity they dealt with.

## Reviewing a finding

1. Press **Evidence** on the row.
2. Read the records behind the finding. Up to the latest 200 are shown; the rest are on the character sheet. Press **Character sheet** to open the matching tab of their sheet.
3. At the bottom, choose **New**, **Acknowledged** or **Dismissed**.
4. Add a note. For **Dismissed** the note is required ("Why it's fine (needed)").
5. Press **Save review**.

What the evidence shows per kind:

- **Wallet journal**: date, type, from, to, amount and reason.
- **Market**: date, item, which way the trade went, quantity and total.
- **Contracts**: issued date, type, title, issuer, assignee, acceptor, status and price.
- **Mail**: date, sender, recipients and subject. The mail text is not shown; it stays on the character sheet.
- **Contact**: the standing, and whether it is watched, blocked or labelled.
- **Corporation history**: each stint in the corporation, with from and until dates.

Opening evidence is recorded in the snooper log, like opening that tab of the character sheet, and in the audit log.

### What the states mean

- **New**: not reviewed yet, or brought back by newer evidence.
- **Acknowledged**: seen and noted. It stays acknowledged. If more records turn up later, it shows **Newer evidence**.
- **Dismissed**: judged harmless, with a note. It stays dismissed unless newer evidence turns up than what was there when it was dismissed: a later journal line, mail, contract, trade or stint. For contacts, which have no date, the contact coming back after it was gone, or its standing going up. It then returns as **New** with **Reopened: newer evidence**.
- **No longer found**: the last scan did not find this any more. The entity may have left the watch list, or the data aged out.

## The Members tab

Lists everyone with at least one finding you may see, with counts of new, acknowledged and dismissed findings, how many entities, the latest evidence date and when they were last flagged. Search by character name. Members with new findings come first.

Click a member to open their page. It lists their characters you may see (each with its number of findings, or **Clean**) and every finding across those characters. Press **Evidence** to review as on the Findings tab. Opening a member page is recorded in the snooper log as looking at their intel, and in the audit log.

## The Watch list tab

- **Watch list**: characters, corporations and alliances Spy Check looks for, with the reason, who added them and when, and how many new findings each has.
- **From the blacklist**: active entries of the Blacklist plugin, when that is installed and switched on, marked **Banned** or **Watch**.

Only managers can add or remove entries. See the admin guide.

## Notifications

After each scan that turns up new or reopened findings, you get one notification, "Spy Check: N new findings", naming the members and who they dealt with. It only covers characters you may see, never your own. You get it if you hold `spycheck.view_findings` and, when your managers chose a group, you are in that group. The notification category is **Spy Check findings**.

## FAQ and troubleshooting

**I cannot see a finding a colleague mentioned.**
Your character sheet permissions may not reach that character, or it is one of your own characters.

**Save review fails with "Say why it's dismissed".**
Dismissing needs a note.

**Save review fails with "You can't review findings on your own characters".**
Ask another reviewer to handle it.

**The evidence says "The records aren't in the synced data any more".**
The records have aged out of the synced data. If the character is gone, it says "The character isn't registered here any more, so its data is gone."

**A dismissed finding came back.**
There is newer evidence than when it was dismissed. Look at the latest records.

**Nothing new for days.**
Check the last scan time in the page header. Scans run daily; a manager can press **Scan now**.
