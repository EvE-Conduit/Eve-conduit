# Corp Finance — Admin guide

Corp Finance reads the wallet journals the core corporation sheet already syncs and turns them into income and spending
per month and by category, wallet balance history, a printable monthly report and a categorised journal. Internal
transfers between your own corporations are kept apart. When a month closes, a chosen group is notified and a webhook
event goes out.

## Requirements

| Requirement | Detail |
|---|---|
| EvE Conduit | 0.5.52 or newer (`min_conduit`) |
| Other plugins | None |
| ESI scopes | None of its own. It uses the wallet journals synced by the corporation sheet's **Wallets** section. |
| Corp roles | A character with the **Accountant** or **Director** role must have logged in, so the corporation sheet can sync the corporation's wallets. |

A corporation shows up in Corp Finance once its Wallets section has synced.

## Installing and switching it on

1. Go to **Administration → Plugins → Browse**.
2. Find **Corp Finance** (category Finance) and install it.
3. Enable it.
4. Give `finance.view_finance` (and `finance.manage_finance` to whoever sets it up) to a group or state.

## Permissions

| Permission codename | What it allows | Suggested group |
|---|---|---|
| `finance.view_finance` | All Corp Finance pages and the dashboard widget, for corporations whose wallets the person may see. | Directors, accountants, finance officers |
| `finance.manage_finance` | The **Settings** page: corporations that count, report group, ref type categories, counterparty tags. | Directors, head accountant |

Both appear in the director tier of the Administration permission picker.

`finance.view_finance` alone is not enough. A person only sees a corporation if the corporation sheet lets them open
its wallets: a `corp.view_*_corporation(s)` permission that covers the corporation plus `corp.view_corporation_wallets`.

Changing the corporations that count, the report group, a ref type category, or a tag for **Every corporation**
changes everyone's figures. It needs wallet access to every counted corporation. A tag for one corporation needs access
to that corporation only.

## Settings

Open **Settings** in the sidebar (or the **Settings** button on the overview).

### Corporations and the monthly report

| Setting | Default | What it does |
|---|---|---|
| **Corporations that count** | None picked | Which corporations' wallets count. None picked means every corporation with synced wallets. Transfers between counted corporations are internal. You can only pick corporations whose wallets are synced and that you may see. |
| **Tell this group when a month's report is ready** | Nobody | Group whose members are notified when a month closes. Only members with `finance.view_finance` are told, about the corporations they may see. |

Click **Save** to apply.

### Counterparty tags

A tag puts money to or from someone in a category, whatever its ref type. Examples: "paid to SRP Holder = SRP
payouts", "from Buyback Corp = Buyback".

1. Click **Add tag**.
2. **Who**: search a character, corporation or alliance from the wallet journals by name (at least three letters) or
   id.
3. **Money**: **Paid to them** (the default in the form), **From them**, or **Both ways**.
4. **Category**: pick one or type a new one (up to 60 characters). "Internal transfers" cannot be picked.
5. **In the wallets of**: **Every corporation**, or one corporation.
6. **Note**: optional, up to 200 characters.
7. Click **Save**.

Only one tag per person, direction and corporation scope. Use **Edit** or **Remove** on a row to change or delete a
tag. Removing a tag puts its entries back in the category of their ref type.

Which rule wins:

1. Internal transfers are found first and are never re-categorised.
2. A counterparty tag beats a ref type category.
3. A corporation's own tag beats an every-corporation tag.
4. A one-way tag beats a both-ways tag.

### Ref type categories

Lists every journal ref type with its **Built in** category and what it **Counts as**. By default only ref types found
in your journals are listed; switch on **Show ones not in your journals** to see all. Use **Find a ref type** to
search.

1. Type a category in the **Counts as** box (an existing one or a new name).
2. Click **Save**.
3. Click **Reset** to put it back in its built-in category.

Built-in categories: Ratting tax, Mission tax, Other tax, Market, Contracts, Industry, Planetary, Structures,
Sovereignty, War, Transfers, Other. Ref types not in the built-in table fall into Other.

## Day-to-day operation

- Officers use the overview, **Monthly report**, **Balances** and **Journal**. See the user guide.
- Review the **Journal** filtered to **Other** now and then, and move ref types or tag counterparties so entries land
  in useful categories.
- The core corporation sheet's Wallets tab still has the last 30 days, the raw journal and market transactions.

## Month closed: notifications and webhooks

Once a month has ended and every counted corporation's wallets have synced past its end (or two days have gone by),
the plugin closes the month once:

- Each active member of the report group who may see at least one counted corporation gets a notification in the
  **Corp finance reports** category, with the net, income and spending for the corporations they may see, linked to
  `/p/finance/report?month=YYYY-MM`.
- The `finance.month_closed` event ("Finance month closed") is sent for webhooks. Set those up under
  **Administration → Integrations**.

`finance.month_closed` is private: it carries the corporations' income and spending, so it only goes to webhooks that
pick it by name. Its payload has the month, label, combined `income`, `spending`, `internal_in`, `internal_out` and
`net`, and the same figures per corporation (id, name, ticker).

The event goes out whether or not a report group is set.

## Privacy and audit logging

Settings changes are recorded in the audit log:

| Action | When |
|---|---|
| `finance.settings` | Corporations that count or the report group changed |
| `finance.category` | A ref type moved to another category, or put back |
| `finance.rule` | A counterparty tag added or changed |
| `finance.rule_deleted` | A counterparty tag removed |

Viewing pages is not logged.

## Background jobs

| Job | Schedule | What it does |
|---|---|---|
| `conduit_finance.tasks.check_month` | Every hour at minute 50 | Closes last month once, when the wallets have synced past its end or two days have passed, then notifies and sends `finance.month_closed`. Does nothing while the plugin is disabled. |

## Troubleshooting

**"No corporation wallets to show".** Either no corporation's wallets have synced (needs an Accountant's or
Director's login on the corporation sheet), or the viewer lacks wallet access on the corporation sheet.

**"This changes the figures of corporations whose wallets you can't see".** The change affects every counted
corporation. Someone with wallet access to all of them has to make it, or narrow **Corporations that count**.

**"Pick corporations whose wallets are synced".** A chosen corporation has no synced wallets yet.

**"There's already a tag for them in that direction".** Edit the existing tag instead.

**No month-closed notification arrived.** Check that a group is set under **Tell this group when a month's report is
ready**, that the user is in it and has `finance.view_finance` and wallet access. Each month is announced only once.

**Figures between corporations look missing.** Transfers between counted corporations, and with the alliance, are
internal and left out of income and spending by design.
