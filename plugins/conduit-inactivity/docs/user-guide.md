# Inactivity — User guide

The Inactivity plugin lets you post a leave of absence when you'll be away from EVE, so nobody chases you (or
removes you) by mistake. Members who show no activity for a set number of days are flagged to HR once a day; while
an approved leave runs, you are not flagged. This guide covers posting and cancelling leave. The second half is for
HR staff who look after the list of inactive members.

## Where to find it

- Sidebar: **Leave of absence**. Every member has this page.
- HR staff with `inactivity.view_inactivity` also get **Inactive members**, nested under it, and an **Inactivity**
  dashboard widget.

## What counts as activity

Your site administrators choose which of these count:

- **Signed in to the site**: when you last signed in to EvE Conduit. A sign-in lasts a long time, so this only
  changes when you sign in again.
- **Played EVE**: when any of your characters last logged in or out of EVE. A character online now counts as now (while its
  data is syncing; a character whose login stopped working counts from its last known login or logout).
- **Flew in a fleet**: your last fleet participation (FAT), from the Fleets & FATs plugin. FATs you added by hand for
  your own characters don't count.

You are active while any of the switched-on kinds is recent enough. Activity is never counted from before you joined
the site, so new members are not flagged straight away.

The Leave of absence page shows how many days without activity get you flagged. Under **Post a leave** it also shows
**Your last activity on record**.

## Posting a leave

1. Open **Leave of absence**.
2. Under **Post a leave**, set **From** and **Until**.
3. Optionally fill in **Reason (optional)**. HR sees it.
4. Click **Post leave**.

What happens next depends on your site's settings:

- If leave needs approval, the card says "HR approves it; you'll get a notification." Your leave shows as
  **Waiting for approval** until someone decides.
- If not, the card says "It counts as soon as you post it." Your leave is approved straight away.

Rules for a leave:

- It can't end before it starts, and it can't be over already.
- It can start up to a year from now.
- It can be up to the number of days shown on the page ("Up to N days at a time").
- It can't overlap another leave of yours that is waiting or approved. Cancel that one first.

## Following and cancelling your leave

- **Your leave** lists leave that is waiting or approved and not over yet. A running leave shows **On leave now**.
- If HR left a note when deciding, it is shown in quotes with their name.
- **Earlier** lists past, rejected and cancelled leave.

To cancel a leave:

1. Under **Your leave**, click **Cancel** next to it.
2. Confirm with **Cancel leave** (or **Keep it** to go back).

You can cancel a leave that is waiting or approved, as long as it isn't over.

## Notifications you may get

| Notification | When |
| --- | --- |
| "Your leave (dates) was approved" | HR approved your leave. Always delivered. |
| "Your leave (dates) wasn't approved" | HR rejected your leave. Always delivered. |
| "We haven't seen you in a while" | You were flagged as inactive, if your site has this switched on. It points to the Leave of absence page. |

These are in the **Inactivity and leave of absence** category (**Settings** → **Notifications**). Leave decisions
arrive even if you turn the category off.

## For HR: the Inactive members page

Needs `inactivity.view_inactivity`. The page has the tabs **Members**, **Leave of absence** and, with
`inactivity.manage_leave`, **Settings** (see the [admin guide](admin-guide.md)).

### Members

1. Pick **Inactive**, **On leave** or **Everyone**. The counts are shown on each button.
2. Use **Find a character** to search by any character name.
3. The table shows **Member** (main character and corporation), **Status** (**Active**, **Inactive N days** or
   **On leave until** a date), **Last active**, **Signed in to the site**, **Played** and **Last fleet**.
4. Click **CSV** to download the current view.
5. With `inactivity.manage_leave`, click **Check now** to work everyone out again. This does not send notifications; anyone it
   flags is still named in the next daily notification.

"Checked" shows when the list was last worked out. The list is updated once a day.

### Leave of absence

1. Pick **Waiting**, **Away now**, **Coming up** or **Past**.
2. Each entry shows the member, the dates, the status, the reason and when it was posted.
3. With `inactivity.manage_leave`, click **Approve** or **Reject** on a waiting leave, add an optional
   **Note for them (optional)**, and confirm. The member is notified.

You can't approve or reject your own leave.

### HR notifications

- "N members went inactive": once a day, to everyone with `inactivity.view_inactivity`, naming who went inactive
  since the last check. Each person is named once, and again only after they've been active in between.
- "<name> asked for leave": to everyone with `inactivity.manage_leave` when a leave needs approval.

## FAQ and troubleshooting

**I posted a leave, but I'm still shown as inactive.**
If your leave is **Waiting for approval**, it doesn't count yet. Once approved and running, you're no longer
flagged.

**"You already have a leave for some of those days; cancel it first."**
Your new dates overlap a leave that is waiting or approved. Cancel the old one, then post again.

**"A leave can be up to N days long; ask HR if you need longer."**
Post a shorter leave, and ask HR about the rest.

**"That leave is already over."**
The **Until** date is in the past.

**I don't see Inactive members.**
It needs `inactivity.view_inactivity`. Members only see their own leave.
