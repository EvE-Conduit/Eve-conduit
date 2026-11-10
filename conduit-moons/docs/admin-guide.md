# Moon Mining Ledger — Admin guide

The Moon Mining Ledger shows who mined what from your corporations' moon drills each month, what it is worth, and
the moon tax each member owes. Officers set the tax rate, close each month when it is over (which fixes prices and
bills every member), and mark payments as they come in. The data comes from the core corporation sheet's **Mining**
section.

## Requirements

| Requirement | Details |
| --- | --- |
| EvE Conduit | 0.5.5 or newer (`min_conduit = "0.5.5"`). |
| Other plugins | None. |
| ESI scopes | None of its own. The corporation sheet's **Mining** section uses `esi-industry.read_corporation_mining.v1`. |
| Corporation roles | The **Mining** section needs a login of a character with the **Director**, **Accountant** or **Station_Manager** role in the corporation that owns the moon drills. |
| Prices | CCP's average market prices, as the site already keeps them. |

The ledger only covers mining since the corporation's mining section was first synced.

## Install and switch on

1. Go to **Administration → Plugins** and open the **Browse** tab.
2. Tick **Moon Mining Ledger**. Leave **Switch on after installing** on.
3. Click **Install 1** and confirm. If the site can't install plugins itself, click **How to install** and follow
   the server instructions instead.
4. If the plugin is installed but off, switch it on in the **Installed** tab.
5. Make sure each corporation with moon drills has its **Mining** section synced on its corporation sheet (a login
   with one of the roles above).

**Moon mining** then appears in the sidebar for every member.

## Permissions

Give permissions to a state (**Administration → States**) or a group (**Administration → Groups**).

| Permission | What it allows | Suggested for |
| --- | --- | --- |
| `moons.view_ledger` | See the full **Ledger**: every member's mining, the **Members**, **Moons** and **Ores** tabs, the daily chart and the **CSV** export, for the corporations they may see. | Directors / moon managers |
| `moons.manage_ledger` | Open **Settings**, close and reopen months, and mark bills paid or unpaid. Give it together with `moons.view_ledger`, which the ledger page needs. | Directors / moon tax collectors |

Every member sees **My moon mining** without any permission.

### Which corporations a viewer sees

The ledger follows the corporation sheet's permissions. A viewer only sees mining in corporations whose sheet they may
open: their own with `corp.view_own_corporation`, their alliance's with `corp.view_alliance_corporations`, or all
with `corp.view_all_corporations`.

Closing or reopening a month and saving the settings cover every corporation at once. Only someone who can see every
corporation with mining in the ledger may do these. Otherwise the site says "This covers mining in corporations you
can't see on the corporation sheet (...)". To mark a bill paid, you must be able to see every corporation that member
mined in that month.

## Settings

On the **Ledger**, click **Settings** (needs `moons.manage_ledger`). The dialog is **Moon tax settings**.

| Setting | Default | What it does |
| --- | --- | --- |
| Moon tax (% of the ore's value) | 10 | 0 to 100. 0 keeps the ledger without charging anything. Applies to open months; closed months keep the rate they were closed with. |
| How to pay | empty | Shown to members with what they owe, and sent with the monthly notification. Up to 2,000 characters. |
| Corporations | none ticked | Whose moon drills count. None ticked means all corporations with synced mining. |

Click **Save**. Saving is written to the audit log.

## Read the ledger

1. Open **Moon mining** in the sidebar.
2. Pick a month with the month picker ("so far" for the current month, "closed" for closed months).
3. Read:
   - **Mined**: total value and units.
   - **Moon tax · N%**: total tax from registered members, and how many members.
   - **Paid**: tax paid so far, once the month is closed.
   - **Unregistered miners**: the value mined by characters nobody registered on the site. They are not taxed.
   - **Mined per day**: a bar chart of the value mined each day.
   - **Members**: one row per member (alts grouped under them; click a row to see each character), with
     **Units**, **Value**, **Tax** and, for a closed month, **Paid**. Unregistered characters show a
     **not registered** badge.
   - **Moons**: per moon drill (**Refinery**, **Moon**, **Miners**, **Units**, **Value**).
   - **Ores**: per ore, with **Price now** (or **Price at closing**), **Units** and **Value**.
4. Click **CSV** to download `moon-mining-<YYYY-MM>.csv`: one line per character, plus a "(total owed)" line per
   billed member with whether they paid.

## Close a month

A month can be closed once it is over. The ledger shows "<month> is over and still open".

Bills are fixed when the month is closed, so closing waits until every corporation's mining has synced after the month
ended (what was mined on its last day arrives with that sync). If a corporation has not synced by two days after the
month's end, the month can be closed anyway. The message "The mining of ... hasn't synced since <month> ended" names
the corporations it is waiting for.

If a character that mined was on a member's account and has been taken off it since the month began (removed by the
member, or sold), the ledger says so above the chart: the character, what it mined, when it was removed and whose
account it was on. Its tax is on nobody's bill. Nobody is billed for it automatically (a sold character leaves the same
trace as one removed to avoid the bill): settle it with the member, or ask them to add the character again before you
close the month.

A member who also mined in corporations you cannot see shows **part only** and no bill: the bill covers those
corporations too, so it is hidden from you.

1. Pick the month and click **Close month**.
2. Confirm. The ore prices and the tax rate are fixed as they are now.
3. Every registered member who mined gets a bill. Members with a bill above 0 get a notification "Moon tax for
   <month>: N ISK" with your **How to pay** text.

## Record payments

1. Pick a closed month and open the **Members** tab.
2. When a member has paid, switch their **Paid** switch on. Switch it off to undo.

You can't mark your own bill; someone else has to. Members see the change in their **Moon tax history**.

## Reopen a month

1. Pick the closed month and click **Reopen** in the "<month> is closed" box.
2. Confirm. All bills for the month are deleted, and values go back to today's prices until you close it again.

A month can only be reopened while no bill in it is marked paid. Mark those payments unpaid first.

## Webhook events and Discord pings

The plugin sends no webhook events and has no Discord pings.

## Notifications

| When | Who | Category |
| --- | --- | --- |
| A month is closed | Each member who owes more than 0 ISK | **Moon tax** |

## Privacy and audit log

The ledger shows every member's mining, alts and tax to people with `moons.view_ledger`, limited to the corporations
they may see. Members only see their own.

Written to the audit log (**Administration → Logs → Audit**): `moons.settings` (tax settings saved),
`moons.close_month`, `moons.reopen_month`, and `moons.payment` (a bill marked paid or unpaid, with the member and
amount).

## Background jobs and group rules

The plugin has no background jobs of its own and adds no group rules. The core corporation sheet syncs the **Mining**
section about once an hour.

## Troubleshooting

**The ledger is empty.** No corporation has synced its **Mining** section yet. Open the corporation sheet and check
the section; it needs a login with **Director**, **Accountant** or **Station_Manager** and
`esi-industry.read_corporation_mining.v1`. Check **Settings → Corporations** too: if some are ticked, only those count.

**"No corporation has synced moon mining yet."** in Settings. Same cause as above.

**A big Unregistered miners value.** Characters that mined are not on anyone's account. Ask members to add their alts.
They are not billed.

**"A month can be closed once it's over".** Wait until the month has ended.

**"Some members have already paid for this month; mark those payments as unpaid first".** Switch their **Paid** off,
reopen, then close again and mark them paid again.

**"Someone else has to mark your own moon tax".** Ask another officer with `moons.manage_ledger`.

**I can't see the Settings button.** You need `moons.manage_ledger`.
