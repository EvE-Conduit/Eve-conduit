# Freight — Admin guide

Freight runs your hauling services. You set up services and their routes with your rates. Members get a calculator
that gives them the exact courier contract to make. Every 15 minutes the site reads the contracts of each service's
owner character and checks every courier contract to the service against its route, so haulers see problems before
they accept anything.

## Requirements

| Requirement | Details |
| --- | --- |
| EvE Conduit | 0.5.55 or newer (`min_conduit = "0.5.55"`). |
| Other plugins | None. The Discord plugin is optional: with it you can pick Discord roles to ping. |
| ESI scopes | `esi-contracts.read_character_contracts.v1` and `esi-contracts.read_corporation_contracts.v1`, on the owner character's login. |
| Corporation roles | None set by the plugin. The owner's login must be able to read the corporation's contracts for a service made out to the corporation. |

The owner character must belong to the officer who creates the service. Its login reads the contracts, so it must
have been added with the contract scopes above.

## Install and switch on

1. Go to **Administration → Plugins** and open the **Browse** tab.
2. Tick **Freight**. Leave **Switch on after installing** on.
3. Click **Install 1** and confirm. If the site can't install plugins itself, click **How to install** and follow
   the server instructions instead.
4. If the plugin is installed but off, switch it on in the **Installed** tab.

**Freight** then appears in the sidebar for members.

## Permissions

Give permissions to a state (**Administration → States**) or a group (**Administration → Groups**).

| Permission | What it allows | Suggested for |
| --- | --- | --- |
| `freight.view_contracts` | See the **Hauling queue**: every courier contract to every service, with problems. Get a notification for each new contract (when the service has **Tell the haulers** on). | Haulers |
| `freight.manage_freight` | Create, change and delete services and routes, see closed services, use **Read contracts now**, and set **Discord pings**. Includes everything `view_contracts` allows. | Directors / logistics officers |

Using the calculator needs no permission. Who can use a service is set on the service itself (**Who may use it**).

## Create a service

1. Open **Freight** and click **Services** (top right), then **New service**.
2. Fill in the form and click **Create service**.
3. On the service page, click **Add a route** for each route (see below).

| Field | Default | What it does |
| --- | --- | --- |
| Name | (required) | Shown to members. Up to 100 characters. |
| Description | empty | Shown to customers above the calculator. |
| Contracts go to | (required) | One of your own characters. Its login reads the contracts. |
| Made out to | The character's corporation | **The character's corporation** or **The character**. This is who customers assign the contract to. |
| Days to complete | 3 | What customers set in the contract (1 to 30). Contracts with fewer days get a note. |
| Expiration (days) | 7 | What customers set as the contract's expiration (1 to 30). |
| Who may use it | nothing ticked | Tick states and groups. Nothing ticked: every member. |
| Open | on | Closed services keep their contracts but give no new prices, are hidden from members and are not read on the 15-minute schedule. |
| Public | off | Anyone can use the calculator at `/public/p/freight/<id>`, without an account. |
| Tell the haulers | on | Haulers and freight managers get a notification for each new contract. |

You can only pick one of your own characters as the owner. Once saved, another manager can edit the service and keep
that owner, but cannot pick a character they don't own.

## Add and change routes

On the service page, click **Add a route**, or the pencil icon on an existing route.

1. **Pick up** and **Deliver to**: search for a system (2+ letters) or a station or structure (3+ letters). Stations
   and structures only show when the site already knows them (from assets, contracts or corporations). Picking a
   system means any place in that system counts.
2. Edit the name customers see under the search field if needed.
3. Set the rates and limits, then click **Save**.

| Field | Default | What it does |
| --- | --- | --- |
| Base price (ISK) | 0 | Fixed part of the reward. |
| ISK per m³ | 0 | Charged per m³ of volume. |
| % of collateral | 0 | Percentage of the collateral (0 to 100). |
| ISK per jump | 0 | Charged per gate jump. Only charged when the jump count is known. |
| Jumps | empty | Empty: counted by ESI's route finder (shortest route) when the route is saved or its systems change. Type a number (0 to 500) to set it by hand. |
| Minimum reward (ISK) | 0 | The reward is never lower than this. |
| Max volume (m³) | 0 | 0: no limit. Larger cargo is flagged. |
| Max collateral (ISK) | 0 | 0: no limit. Higher collateral is flagged. |
| Both ways | on | The same rates from the delivery end back to the pick-up. |
| On | on | Routes that are off aren't offered and don't match contracts. |

The reward is rounded up to whole ISK. If ESI can't count the jumps (for example in wormhole space) and you set a
per-jump price, you get a warning: type the jumps in, or the per-jump price isn't charged.

Adding, changing or removing a route checks the service's open contracts again straight away. So does saving the
service.

## How contracts are matched and checked

- Only courier contracts made out to a service's owner (the character, or its corporation) are read.
- Each contract is matched to a route of the service. A route naming the station or structure beats one naming only
  the system.
- Courier contracts to the owner's other half (the character, for a corporation service) are tracked only when they
  run one of the routes, so the owner's own hauling stays out.

Problems (red): wrong assignee, no route covers it, reward too low, volume over the limit, collateral over the limit,
past its delivery deadline. Notes (yellow): reward higher than asked, fewer days to complete than the service asks,
expired before anyone accepted it. A difference of 1 ISK or less in the reward is ignored.

## Day-to-day operation

**Hauling queue** (Freight → **Hauling queue**): shows **Open rewards**, **Open collateral** and **Open volume**, and
tabs **Waiting**, **In transit**, **Problems** and **Finished**. With more than one service you can filter by service.
The page refreshes every minute.

**Services** (Freight → **Services**): one row per service with **Contracts go to**, **Routes**, **Open** (with a red
count of contracts with problems), **Open rewards** and **Delivered**. "(login can't read contracts)" next to the owner
means its login is missing the scope the service needs. **Nobody** means the service has no owner.

**Read contracts now** on a service page reads the owner's contracts straight away. The queue updates in about a
minute.

**Delete** removes the service, its routes and the contracts it tracked. Contracts in game aren't touched.

## Notifications, webhooks and Discord pings

| Event | When | Notes |
| --- | --- | --- |
| `freight.contract_created` | A new open courier contract to a service is found. | Level `warning` when it has a problem, otherwise `info`. Alert: can ping on Discord. |
| `freight.contract_finished` | A tracked contract was delivered, failed, rejected, deleted, reversed or expired. | Level `success` for delivered, `warning` for rejected, failed or reversed. |

- Send the events to a Discord channel or other webhook under **Administration → Integrations**.
- To ping on new contracts, go to **Freight → Services** and switch on the alert under **Discord pings**. This section
  only shows once a Discord webhook exists. With the Discord plugin linked you can also pick roles to ping.
- In-site notifications (category **Freight**) go to everyone with `freight.view_contracts` or
  `freight.manage_freight`, for services with **Tell the haulers** on. Users can turn the category off under
  **Settings → Notifications**.

## Privacy and audit log

Creating, changing and deleting a service is written to the audit log as `freight.service` (**Administration → Logs
→ Audit**). Route changes are not logged.

The hauling queue shows who made each contract and who accepted it. The public calculator stores nothing and shows
only the service's name, description, routes, rates and the name of the character or corporation to contract to.

## Background jobs

| Job | Schedule | What it does |
| --- | --- | --- |
| `conduit_freight.tasks.sync_all_contracts` | Every 15 minutes | Reads the contracts of the owner of every open service whose login is valid. Retries up to 3 times when ESI asks to back off. |

## Group rules

Freight adds no group rules.

## Troubleshooting

**Contracts don't show up.** Check the **Contracts go to** column on **Services**. If it shows "(login can't read
contracts)", log in again with the owner character and grant the contract scopes. Closed services are not read on schedule.

**Every contract says "Goes between places none of the service's routes cover."** Check that the route is **On** and
that its ends match what customers use. A route naming a station only matches that station; pick the system to accept
any place in it.

**Prices ignore the per-jump rate.** The route has no jump count. Type one in under **Jumps**.

**"Pick one of your own characters" when saving.** You can only make a character you own the owner.

**"That character's corporation isn't known yet".** The site hasn't loaded the character's corporation. Wait for its
next refresh, or choose **The character** under **Made out to**.

**No Discord pings.** Check that a Discord webhook gets `freight.contract_created` under **Administration →
Integrations**, and that it has someone to mention or you picked roles under **Discord pings**.
