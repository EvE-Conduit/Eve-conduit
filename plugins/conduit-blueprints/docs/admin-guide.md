# Blueprint Library — Admin guide

The Blueprint Library reads every corporation's blueprints from ESI, shows them with members' shared originals in one library, and runs a request queue for copies and loans of originals, with due dates and overdue reminders. It also lists originals that still need research. This guide covers requirements, installing, permissions, running the request queue, and what happens in the background.

## Requirements

| Requirement | Details |
| --- | --- |
| EvE Conduit | 0.5.55 or newer (`min_conduit`). |
| ESI scope | `esi-corporations.read_blueprints.v1`. The plugin asks for it at login. |
| Corp role | **Director**. ESI only returns corporation blueprints to a Director. At least one registered Director per corporation must have logged in with the scope above. |
| Synced data | The **Assets** section of the corporation sheet (to work out where each blueprint is) and corporation industry jobs (for research and copy jobs). Members' own blueprints come from their character sheets. |
| Other plugins | Optional: [Industry Projects](../../conduit-projects). When it is on, members can say a request is for an open project. |
| Discord pings | Optional: a Discord webhook under Administration → Integrations. With the Discord plugin linked you can also pick roles. |

## Installing and switching it on

1. Go to **Administration → Plugins**.
2. Open the **Browse** tab and find **Blueprint Library** (category Industry).
3. Install it, then enable it.
4. Under **Administration → Groups**, give the permissions below.
5. Have a Director of each corporation log in again so their login grants `esi-corporations.read_blueprints.v1`.
6. Open **Blueprints** and press **Read again**, or wait for the next read (every three hours).

## Permissions

| Permission codename | What it allows | Suggested group |
| --- | --- | --- |
| `blueprint_library.view_library` | See the library, ask for copies or loans, see **My requests**, **Share mine** and **Research**. | All members |
| `blueprint_library.manage_requests` | Work the **Request queue**, press **Read again**, switch on Discord pings, and get notified of new requests and overdue loans. | Whoever runs the library (with `view_library` too, so the other pages show in the menu) |

The permission picker lists `view_library` in the member tier and `manage_requests` in the director tier.

What each person sees:

- A viewer sees the libraries of the corporations their characters are in, plus any whose corporation sheet the core lets them read (`corp.view_*_corporations`). Managing requests does not widen this.
- Where a corporation blueprint is (station or structure and hangar division) is only shown to those who may see that corporation's **Assets** section. Where its research and copying jobs run is only shown to those who may see its **Industry** section.
- Members' shared originals are visible to every viewer.

## Where the data comes from

- The core reads characters' own blueprints, corporation assets and corporation industry jobs, but not corporation blueprints. The plugin reads `/corporations/{id}/blueprints` itself, every three hours, for every corporation with a working login on the site.
- It runs as a registered Director whose login grants the scope, picked the way the core picks members for its corporation sheet sections. The Director that worked last time is tried first. If ESI refuses one (expired login, 401 or 403), the next is tried.
- Where a blueprint sits is worked out from the corporation's assets (offices and containers), including the hangar division.
- What a blueprint makes is learned from manufacturing and reaction jobs seen on the site, then from its name ("Hurricane Blueprint" makes "Hurricane").
- The footer of the library shows when each corporation was last read ("read ... ago" or "never").

## Running the request queue

Open **Request queue**. It has three views:

- **Waiting**: requests that need someone (waiting, accepted, in progress).
- **On loan**: originals handed out, with due dates and how many are overdue.
- **Finished**: delivered, returned, declined and cancelled requests.

The member is notified at every step and can cancel until it is delivered.

### Copies

1. **Accept**: optional note for the member (for example "Copying tonight"). Only on waiting requests.
2. **In progress**: optionally link the **Copy job** from the corporation copying jobs of this blueprint started since the request. Jobs sync every 30 minutes, so a new job may take a while to appear. On a request already in progress the button reads **Copy job** and lets you change the linked job.
3. **Deliver**: optional note (for example "In your hangar at staging"), then **Delivered**.

### Loans

1. **Accept** as above (optional).
2. **Deliver**: set **Due back** (defaults to the number of days the member asked for) and press **Delivered**. The due date must be in the future. The member is told the date.
3. While it is out: **Due date** moves the due date; **Returned** then **It's back** marks it returned.

### Declining

Press **Decline** and add a reason for the member (for example "We don't lend capital blueprints").

### Rules

- A manager cannot accept, start, deliver, mark returned or move the due date of their own request: another manager has to.
- A member can have at most 25 requests waiting.
- Copies: 1 to 5,000 runs per copy, 1 to 100 copies, ME 0 to 10 and TE 0 to 20, never above the best the library has. Loans: 1 to 90 days, and only when the library has an original.

### Discord pings

The **Discord pings** section below the Request queue appears once a Discord webhook exists under **Administration → Integrations**. Switch on **Blueprint requested** and **Blueprint loan overdue** as needed. Each webhook that gets the alert mentions its own @here, @everyone or role; with the Discord plugin linked you can also pick roles here.

## Notifications and webhook events

In-site notifications use the category **Blueprint library**.

| Trigger | In-site notification | Webhook event |
| --- | --- | --- |
| A member sends a request | All managers except the requester | `blueprints.request_created` ("Blueprint requested") |
| Accepted, in progress, declined, due date moved, returned | The member | none |
| Delivered or lent out | The member | `blueprints.request_delivered` ("Blueprint request delivered") |
| A member cancels a request a manager already handled | That manager | none |
| A loan is overdue | The borrower once a day; managers (not the borrower) the first time only | `blueprints.loan_overdue` ("Blueprint loan overdue"), first time only |

Send events to Discord or Slack under **Administration → Integrations**.

## Audit log

Manager actions are recorded in **Administration → Logs → Audit**: `blueprints.accepted`, `blueprints.started`, `blueprints.delivered`, `blueprints.declined`, `blueprints.returned` and `blueprints.extended`. Member requests, cancellations and sharing changes are not audited.

## Background jobs

| Job | Schedule | What it does |
| --- | --- | --- |
| `conduit_blueprints.tasks.sync_libraries` | Every 3 hours | Queues a read of every corporation's blueprints. **Read again** does the same straight away. |
| `conduit_blueprints.tasks.remind_overdue` | Daily at 12:10 (server time) | Reminds borrowers of overdue loans (at most once every 23 hours) and tells managers and emits `blueprints.loan_overdue` the first time. |

Both skip while the plugin is off.

## Troubleshooting

**The library is empty, or a corporation shows "read never".**
No registered Director of that corporation has a login with `esi-corporations.read_blueprints.v1`, or ESI refused every Director tried. Have a Director log in again with the scope, then press **Read again**.

**Blueprints show "Unknown location".**
The viewer may not see the corporation's Assets section, or the corporation's assets are not syncing.

**A blueprint has no "Makes".**
The product is learned from manufacturing or reaction jobs seen on the site, or from the name. It fills in once such a job is seen.

**"That's your own request: another library manager has to handle it".**
Ask another manager.

**The Copy job list is empty.**
Only corporation copying jobs of this blueprint, started from a day before the request on, in corporations you can see, are listed. Corporation jobs sync every 30 minutes.

**"Industry Projects isn't switched on" or "That project is closed".**
The project link needs the Industry Projects plugin enabled and an open project.
