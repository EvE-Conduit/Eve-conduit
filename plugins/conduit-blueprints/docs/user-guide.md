# Blueprint Library — User guide

The Blueprint Library puts every blueprint your corporations own in one searchable list, together with originals that members choose to share. From the library you can ask for copies or to borrow an original, follow your requests, share your own originals, and see which corporation originals still need research. You need the `blueprint_library.view_library` permission; your officers normally give it to all members.

## Where to find it

The **Blueprints** section in the main navigation has these pages:

| Page | What it is for |
| --- | --- |
| **Blueprints** | The library itself. |
| **My requests** | Your copy and loan requests and where each one is. |
| **Share mine** | Choose which of your characters' originals show in the library. |
| **Research** | Corporation originals that are not fully researched, and research and copy jobs running now. |

## Browsing the library

The library lists blueprints grouped by type:

| Column | What it shows |
| --- | --- |
| Blueprint | The blueprint name. |
| Makes | The item it makes, and its group. A dash means it is not known yet. |
| BPO | How many originals. |
| BPC | How many copies. Hover to see the runs in all. |
| Best original | The best ME / TE among the originals. ME 10 and TE 20 are shown in green. |
| Owner | Corporation tickers, and **N personal** for members' shared originals. |

Filters above the list:

- Search box: a blueprint name or what it makes.
- **All**, **BPO**, **BPC**: originals, copies or both.
- **Every category**: Ship, Module, Charge and so on, with counts.
- **Corporations and members**, **Corporations**, **Members' shared**: whose blueprints to show.
- **Every corporation**: one corporation (only shown when you can see more than one).
- **ME ≥**: lowest ME.

At most 400 blueprints are listed at once; narrow the search to see the rest. The footer shows when each corporation's blueprints were last read.

You see the corporations your characters are in, plus any whose corporation sheet you are allowed to read. Where a corporation blueprint is (station or structure and hangar division) is only shown if you may see that corporation's Assets; otherwise it says "Unknown location".

## Looking at one blueprint

1. Click a row in the library.
2. The dialog lists every copy and original you may see: **Original** or **Copy**, ME/TE, runs (∞ for originals), owner (**Personal** with the character's name for a shared original) and where it is.
3. If others already asked for this blueprint, it says how many requests are waiting.

## Asking for copies

1. Open the blueprint and press **Ask for copies**.
2. Fill in:
   - **Runs per copy**: 1 to 5,000.
   - **Copies**: 1 to 100.
   - **ME at least** and **TE at least**: optional. Empty means whatever the library has. You cannot ask for more than the best the library has.
   - **For an industry project**: optional, only shown when the Industry Projects plugin is on and you can see open projects.
   - **Note**: optional, for example where to drop them or when you need them.
3. Press **Send request**. The library managers are told.

## Borrowing an original

1. Open the blueprint and press **Borrow the original**. The button is greyed out if the library only has copies.
2. Set **For how many days** (1 to 90, default 7). Add a project and note if you want.
3. Press **Send request**.

The due date is set when a manager hands the original over. The manager may pick a different date.

You can have at most 25 requests waiting at once.

## Following your requests

Open **My requests**. Each row shows what you asked for, the status, which manager handled it and what they said, and the linked copy job if there is one.

| Status | Meaning |
| --- | --- |
| Waiting | No manager has picked it up yet. |
| Accepted | A manager is on it. |
| In progress | Copies are being made. May show the copy job and when it is ready. |
| Delivered | Copies delivered. |
| On loan | You have the original. Shows the due date. |
| Overdue | The loan is past its due date. |
| Returned | You brought the original back. |
| Declined | A manager declined it, usually with a reason. |
| Cancelled | You cancelled it. |

To cancel a request, press **Cancel** on its row. You can cancel while it is Waiting, Accepted or In progress.

## Sharing your own originals

1. Open **Share mine**.
2. Each of your characters is listed with how many originals and copies it has.
3. Switch on the characters whose originals should show in the library.

Shared originals show as **Personal** with the character's name. Copies always stay private. Nothing leaves your hangar unless you hand it over. A share stops counting if the character moves to another account. Blueprints come from each character's sheet.

## Research

The **Research** page shows:

- Counts: **Originals**, **Fully researched** (ME 10 and TE 20), **ME below 10**, **TE below 20**.
- **Running jobs**: ME and TE research, copying and invention jobs in the corporations, with who installed them and when they end. A finished job nobody has delivered yet shows as **ready**.
- **Not fully researched**: corporation originals short of ME 10 or TE 20.

## Notifications

You get a notification (category **Blueprint library**) when:

- your request is accepted;
- your copies are being made (with the ready time if a copy job is linked);
- your copies are delivered, or an original is lent to you (with the due date);
- your request is declined;
- the due date of your loan is moved;
- your loan is marked returned;
- your loan is overdue: once a day until it is returned.

## FAQ and troubleshooting

**The library is empty.**
It fills once a Director's login can read the corporation's blueprints. Ask your officers.

**A blueprint has no location.**
You can only see where corporation blueprints are if you may see that corporation's Assets.

**"The best the library has is ME ..." when sending a request.**
Lower **ME at least** or **TE at least**, or leave them empty.

**"The library has only copies of this blueprint; ask for copies instead".**
There is no original to lend. Ask for copies.

**"You have 25 requests waiting already".**
Wait until some are handled, or cancel ones you no longer need.

**My loan is overdue but I need it longer.**
Ask a library manager to move the due date.
