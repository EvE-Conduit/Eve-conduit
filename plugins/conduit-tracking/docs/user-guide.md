# Activity Tracking — User guide

**Members do not see this plugin.** A tracked member gets no notification, no sidebar entry and no API access. This
guide is for the trackers and reviewers (HR, counter-intelligence) who hold `tracking.track_members`. Activity Tracking
follows a member and all their alts for 1 to 60 days and builds a report of the systems they were in, the ships they
flew, what they earned and when they played.

## Who you can track

You can only track members whose characters your character sheet permissions reach (all characters, your alliance's,
or your corporation's). Only those characters are followed: an alt of the member that your permissions don't reach
isn't polled and isn't in your report. You can never track yourself, and you never see a tracking of yourself.

## Where to find it

Open **Activity Tracking** in the sidebar. The page has:

- **New members** at the top: recent joiners you may want to track.
- The list of trackings, with a **Show** filter: **Running**, **Finished** or **All**. Columns are **Member**,
  **Period**, **Reason**, **Started by** and **Status**.

## Tracking a member

1. Click **Track a member**.
2. Under **Member**, type a character name (at least two letters). Search by their main or any alt. The result shows
   which alt matched.
3. Pick the member. Click **Change** to pick someone else.
4. Set **For how many days** (1 to 60; quick buttons `1d`, `7d`, `14d`, `30d`, `60d`; default 7).
5. Optionally enter a **Reason**. Only other trackers and the audit log see it.
6. Click **Start tracking**.

Every character on the member's account is followed, including alts they link while it runs. A character moved to
another account stops being followed. A member can only have one running tracking. If one is running, stop it to
start again.

If the search finds nobody you see one of:

- "That's one of your own characters. Nobody can track themselves."
- "You can't see anyone else's characters. ..." (you need a character sheet permission; see the admin guide)
- "No member you can see has a character called that."

## Tracking new members

The **New members** list shows members (not guests) with a character that joined its current corporation recently.

1. Set **Joined within**: `3 days`, `7 days` (default), `14 days` or `30 days`.
2. Each row shows the member, **Characters that joined** and when they **Joined**. Members already tracked show
   **Being tracked**.
3. To track one member, click **Track** on its row.
4. To track several, tick their boxes (or **Select everyone not tracked yet**), click **Track N selected**, set the
   days and reason (the reason starts as "New member"), and click **Start tracking**. A member that can't be tracked
   does not stop the others; you get an error for that one.

The join date comes from the corporation's member tracking when a Director's login syncs it, otherwise from the
character's corporation history. Only the corporation they are in now counts.

**Not on the site yet** lists characters the corporation's member tracking shows joining that nobody has added to the
site, for corporations whose member list you may see. They cannot be tracked until someone logs in with them.

## Reading a report

Click a tracking in the list to open its report. While the tracking runs, the report refreshes every minute.

At the top: **Time online** (and time docked), **Systems** (with regions and ship types), **ISK earned** (and spent),
and **Kills / losses** (with ISK destroyed and lost).

If some characters cannot be followed, a warning "N characters can't be followed" lists them with why, for example
**Missing ESI scopes**, **Login no longer works** or **ESI error**. Their wallet, mining and kills still count once
their character sheet syncs; where they are and what they fly does not.

Tabs:

| Tab | What it shows |
|---|---|
| **Overview** | **Characters** (each character's time online), **Time online per day**, **When they play** (by hour, EVE time), **Top systems**, **Top ships** |
| **Systems & ships** | **Systems**, **Ships**, **Regions** and **Docked at**, each with time, share and which characters |
| **ISK** | **Income** and **Spending** by kind from the wallet journal, and **Where they made ISK** (payouts tied to a system) |
| **Kills & mining** | **Ships on killmails**, **Mining** (with value at average prices) and **Killmails** (newest first, up to 100) |
| **Timeline** | Every stint, newest first: when, where, docked at and in which ship |

How to read the numbers:

- Each character is checked every minute. Time offline, and gaps of more than five minutes (worker stalled, ESI
  trouble), are not counted.
- A system flown straight through or a quick ship swap can be missed.
- Location data only starts when the tracking does. ESI has no history of where a character was.
- Wallet, mining and killmail data cover the same period, from what Conduit already syncs. The mining ledger is per
  EVE day, so the day the tracking started on is left out.
- A character that moved to another account only counts up to when it left.
- ISK moved between the member's own characters is neither earned nor spent.

## Stopping and deleting

- **Stop** (running trackings only): polling stops now, the report so far is kept.
- **Delete** (only for whoever started the tracking, and administrators): everything this tracking recorded is
  deleted for good. The member's wallet, mining and killmails stay on
  their character sheets.

Reports are kept until whoever started them (or an administrator) deletes them.

## Notifications

When a tracking reaches its end date, whoever started it gets one notification "Tracking of <member> finished" under
the **Activity Tracking** category, linked to the report. There is no notification when someone stopped it by hand.

## Privacy

Starting, stopping and deleting a tracking, and opening a report, are written to the audit log. Opening a report is
also written to the snooper log for each of the member's characters, as when opening their character sheet.
Administrators can read both.

## FAQ and troubleshooting

**The report shows no time online.** Either the member has not played, or their characters can't be followed. Check
the "can't be followed" warning at the top.

**"<member> is already being tracked; stop that first".** Open the running tracking and click **Stop**, then start a
new one.

**"You can't track that member".** Your character sheet permissions do not reach their characters.

**"That member has no main character".** The member must set a main first.

**A report says "Not found".** It was deleted, or it is on a member you can't see.
