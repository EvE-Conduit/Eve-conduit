# Activity Tracking — Admin guide

Activity Tracking lets HR or counter-intelligence follow a member and all their alts for 1 to 60 days. Every minute
it checks where each character is, whether it is docked and what it flies, and builds a report that also includes
wallet income and spending, mining and killmails for the same period. The member is never told. All access is
audited.

## Requirements

| Requirement | Detail |
|---|---|
| EvE Conduit | 0.5.55 or newer (`min_conduit`) |
| Other plugins | None |
| ESI scopes | `esi-location.read_location.v1`, `esi-location.read_online.v1`, `esi-location.read_ship_type.v1`. EvE Conduit already asks for these. |
| Corp roles | None for tracking. The **New members** list uses the corporation's member tracking when a **Director's** login syncs it; otherwise it falls back to each character's corporation history. |

ESI load: three requests per online character per minute, one per offline character, only for characters in running
trackings.

## Installing and switching it on

1. Go to **Administration → Plugins → Browse**.
2. Find **Activity Tracking** (category HR) and install it.
3. Enable it.
4. Give `tracking.track_members` to your HR or counter-intelligence group under **Administration → Groups**.

Only holders of the permission get **Activity Tracking** in the sidebar.

## Permissions

| Permission codename | What it allows | Suggested group |
|---|---|---|
| `tracking.track_members` | Start, stop and delete trackings; read the reports; see the **New members** list. | HR, counter-intelligence |

It appears in the HR tier of the Administration permission picker.

Like Member Audit, the permission only reaches members whose characters the tracker's character sheet permissions
reach (all characters, their alliance's or their corporation's). A tracker without any character sheet permission sees
"You can't see anyone else's characters" when searching. Nobody can track themselves or see a tracking of themselves.

The **Not on the site yet** part of **New members** only lists corporations whose member list the tracker may see on
the corporation sheet.

## Settings

There are no settings. Each tracking is configured when it is started:

| Field | Default | What it does |
|---|---|---|
| **Member** | — | The member, found by their main or any alt. Every character on their account is followed. |
| **For how many days** | 7 | 1 to 60 days. |
| **Reason** | Empty ("New member" when started from **New members**) | Optional. Only other trackers and the audit log see it. |

Bulk start from **New members** takes 1 to 100 members at once, with the same days and reason.

## Day-to-day operation

See the user guide for starting trackings, reading reports, stopping and deleting. In short:

- One running tracking per member. Stop it to start a new one.
- Alts linked while a tracking runs are added; characters moved to another account are marked **No longer theirs**
  and stop being followed.
- Characters that can't be followed are listed at the top of the report with a reason: **Missing ESI scopes**,
  **Login no longer works** or **ESI error**. Ask the member to log in again with that character if needed.
- Reports are kept until someone deletes them.

## Notifications

When a tracking reaches its end date, whoever started it gets one notification "Tracking of <member> finished" in the
**Activity Tracking** category. No notification is sent when it was stopped by hand. The tracked member is never
notified.

## Webhooks and Discord

Activity Tracking sends no webhook events.

## Privacy and audit logging

The member gets no notification, no sidebar entry and no API. All routes need `tracking.track_members`.

Audit log entries (administrators only):

| Action | When |
|---|---|
| `tracking.started` | A tracking is started (with days and reason) |
| `tracking.stopped` | A tracking is stopped |
| `tracking.deleted` | A tracking and its report are deleted |
| `tracking.report_viewed` | A report is opened |

Opening a report is also written to the snooper log for each of the member's characters, as when opening their
character sheet.

Deleting a tracking removes everything it recorded (stints, character status). The member's wallet, mining and
killmails stay on their character sheets.

## Background jobs

| Job | Schedule | What it does |
|---|---|---|
| `conduit_tracking.tasks.poll` | Every 60 seconds | Finishes trackings past their end date (and notifies whoever started them), then checks every character of every running tracking. Does nothing while the plugin is disabled. |

ESI caches online status for 60 seconds, so polling more often gains nothing. A round that is still running blocks the
next one. If ESI asks to slow down, the remaining characters wait for the next round. Gaps of more than five minutes
between checks are not counted as time.

## Troubleshooting

**A character shows "Missing ESI scopes".** Its login lacks one of the three location scopes. The member has to log in
again with that character.

**A character shows "Login no longer works".** Its token was revoked or expired. The member has to log in again.

**Reports show gaps.** The worker stalled or ESI had trouble for more than five minutes. That time is not counted.
Check that the background worker and scheduler are running.

**New members is empty.** No character on the site joined its current corporation in the chosen window, or the
tracker's character sheet permissions don't reach them. Guests are not listed.

**A tracker can't find a member.** Their character sheet permissions don't reach that member, or the member has no
main character.
