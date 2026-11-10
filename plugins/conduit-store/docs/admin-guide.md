# Corp Store — Admin guide

The Corp Store is a points shop for members. Members earn points from other plugins (referrals, fleets, mentoring,
industry projects) and from officers by hand. They spend them on items you add. Officers hand the items over in game
and mark the orders done. This guide covers requirements, permissions, setting up items and earning, and handling
orders.

## Requirements

| Item | Details |
| --- | --- |
| EvE Conduit version | 0.5.55 or later (`min_conduit`) |
| Other plugins | None required. Points come from these when they are installed and switched on: Recruitment (referrals), Fleets (fleets), Mentoring (graduations), Industry Projects (deliveries). |
| ESI scopes | None |
| EVE corporation roles | None. Items are handed over in game by hand. |
| Access | Members only. |

## Install and switch on

1. Go to **Administration → Plugins → Browse**.
2. Find **Corp Store** (category Community) and install it.
3. Switch it on, either with **Switch on after installing** or under the **Installed** tab.
4. Give the permissions below to your officers' group under **Administration → Groups**.

## Permissions

| Permission codename | What it allows | Suggested group |
| --- | --- | --- |
| `store.fulfil_orders` | Open **Orders**, mark orders handed over, cancel any member's order. Get a notification for each new order. | Officers / Directors |
| `store.manage_store` | Open **Manage**: items, how points are earned, giving or taking points by hand, and Discord pings for new orders. | Directors |

Every member can see the store, buy items, see their own points and cancel their own waiting orders. No permission is
needed for that.

## Menu pages

| Page | Who sees it |
| --- | --- |
| **Corp Store** (`/p/store`) | All members |
| **My points** (`/p/store/me`) | All members |
| **Orders** (`/p/store/orders`) | `store.fulfil_orders` |
| **Manage** (`/p/store/manage`) | `store.manage_store` |

## Setting up

Open **Manage**. The page is titled **Manage the store**.

### Earning points

The **Earning points** card sets how many points each automatic source gives. `0` switches a source off. A badge
shows `needs <plugin>` if the source plugin is not installed, or `<plugin> is switched off` if it is installed but off.

| Setting | Default | What it does |
| --- | --- | --- |
| **Referral** | `0` (off) | Points to the member a recruit named as their referrer, when the recruit is accepted. Needs Recruitment. |
| **Fleet** | `0` (off) | Points to each member with a FAT when the fleet ends, once per fleet however many characters they brought. Needs Fleets. |
| **Mentee graduated** | `0` (off) | Points to the mentor when their mentee graduates. Needs Mentoring. |
| **Industry projects** | on | Switch. Each project sets its own points per delivery (at most 1,000,000 per delivery). Needs Industry Projects. |

Each value can be 0 to 1,000,000. Press **Save**.

Each event pays once, even if it is repeated. For fleets, these FATs do not pay: FATs a member added by hand for their
own characters, and the FC's or fleet creator's own FATs unless the in-game fleet tracking saw them.

### Items

1. In the **Items** card, press **Add item**.
2. Fill in the dialog:

| Field | Default | What it does |
| --- | --- | --- |
| **EVE item** | empty | Optional. An EVE item type, used for the picture. Picking one fills **Name** if it is empty. |
| **Name** | empty | Required. Up to 100 characters. |
| **Description** | empty | Shown on the item card. |
| **Price in points** | `100` | Required. 1 to 1,000,000. |
| **Sort order** | `0` | Lower comes first. |
| **In stock** | empty (unlimited) | Goes down with each order and back up when an order is cancelled. Saving the form applies what you changed to the stock as it is now: orders placed while the form was open stay counted. |
| **Limit per member** | empty (no limit) | Most a member may order in total. Cancelled orders do not count. |
| **For sale** / **Hidden** | For sale | Hidden items stay on past orders but cannot be bought. |

3. Press **Save**.

To change an item, press the pencil button. To delete it, press the bin button. Only items nobody has ordered can be
deleted. Hide the others instead.

### Giving or taking points by hand

Use **Give or take points** for anything the automatic sources do not cover.

1. Under **Member**, search by main character name.
2. Enter **Points**. A negative number takes points away. The balance can go below zero.
3. Enter **What for**. This is required, and the member sees it.
4. Press **Give points** (or **Take points**).

You cannot give yourself points. The last 10 awards are listed under the form. Each award is in the audit log.

### Discord pings

The **Discord pings** section on **Manage** shows once a Discord webhook exists. Switch on **Store order placed** to
ping on Discord for new orders. Each Discord webhook that gets the alert mentions its own @here, @everyone or role
(set under **Administration → Integrations**). With the Discord plugin linked, you can also pick roles to ping here.
If no webhook gets the alert, the section says so.

## Day-to-day: handling orders

Open **Orders**. The tabs are **Waiting**, **Handed over** and **Cancelled**, each with a count. The list refreshes
every minute.

To hand an order over:

1. Give the item to the member in game (contract or hangar).
2. Press **Handed over** on the order.
3. Optionally write a **Note to the member**, for example "Contracted to you in Jita 4-4".
4. Press **Mark handed over**. The member gets a notification.

To cancel an order:

1. Press the **X** button on the order.
2. Write **Why (the member sees it)**. This is required.
3. Press **Cancel order**. The member gets the points back and a notification. Stock is put back.

You cannot hand over your own order. Another officer must do it.

## Notifications, webhooks and Discord

Notification category: **Corp Store**.

| Who | Notification |
| --- | --- |
| Everyone with `store.fulfil_orders` (except the buyer) | "Store order from <member>" for each new order. |
| The member | Points earned or taken, order handed over, order cancelled by an officer. |

Webhook events, available under **Administration → Integrations**:

| Event | When | Discord ping |
| --- | --- | --- |
| `store.order_placed` | A member bought something. | Yes, switch it on under **Discord pings** on **Manage**. |
| `store.order_fulfilled` | An order was handed over. | No |

## Group rules

The plugin adds no group rules.

## Privacy and audit log

The store keeps a ledger of every point entry and every order per member. Members see only their own. The leaderboard
shows the top 10 earners by name to all members.

Audit log entries (**Administration → Logs → Audit**):

| Action | Logged when |
| --- | --- |
| `store.points_awarded` | A manager gave or took points by hand. Includes the points and reason. |
| `store.item_saved` | An item was added or changed. |
| `store.item_deleted` | An item was deleted. |
| `store.settings_saved` | The earning settings were changed. |
| `store.order_placed` | A member bought something. |
| `store.order_fulfilled` | An order was handed over. |
| `store.order_cancelled` | An order was cancelled, by the member or an officer. |

## Background jobs

The plugin has no scheduled jobs. Points from other plugins are added when those plugins report the event.

## Troubleshooting

| Message or symptom | What to do |
| --- | --- |
| A source shows `needs <plugin>` or `<plugin> is switched off` | Install or switch on that plugin. Until then the source pays nothing. |
| Members got no fleet points | Check that **Fleet** is above 0. Points are paid when the fleet ends. Self-added FATs and the FC's own untracked FATs do not pay. |
| "People have ordered this item; hide it instead of deleting it" | Edit the item and switch it to **Hidden**. |
| "You can't hand over your own order; another officer does" | Ask another officer with `store.fulfil_orders`. |
| "Tell the member why it's cancelled" | Fill in the reason before cancelling. |
| "You can't give yourself points" | Ask another manager. |
| "This order was already handed over" (or cancelled) | Another officer handled it first. Refresh the page. |
| **Discord pings** does not show on **Manage** | Add a Discord webhook under **Administration → Integrations** first. |
