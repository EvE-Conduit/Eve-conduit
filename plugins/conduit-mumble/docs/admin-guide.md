# Mumble — Admin guide

The Mumble plugin gives members a Mumble login managed by EvE Conduit, and lets chosen people hand out temporary
access links to guests. The Mumble server holds no passwords: a small authenticator runs next to it and asks the site
about every login through the external API. Names and Mumble groups are worked out at each connect from the member's
main character, groups and state. This guide covers installing, the authenticator, settings, group mapping, accounts
and guest links.

## Requirements

| Item | Requirement |
|---|---|
| EvE Conduit | 0.5.22 or newer |
| Other plugins | None |
| ESI scopes | None |
| In-game corp roles | None |
| Mumble server | Murmur / mumble-server with Ice switched on |
| Authenticator host | Python 3.9+ and `zeroc-ice`, next to the Mumble server |
| External API | The **Mumble** API switched on, and an API key with the scope `p.mumble:auth` |

## Installing and switching it on

1. Go to **Administration → Plugins → Browse**.
2. Select **Mumble** and install it. Leave **Switch on after installing** on, or switch it on later.
3. On the **Installed** tab, make sure the switch for Mumble is on.

Mumble is members-only. Guests get in through temporary links, which open on a public page
(`/public/p/mumble/temp/<token>`) without an account.

## Permissions

| Permission codename | What it allows | Suggested group |
|---|---|---|
| `mumble.access_mumble` | Have a Mumble account and connect with it | Every members' state (given by default) |
| `mumble.create_temp_links` | Make temporary access links, see their own links, withdraw them and cut off guests | Fleet commanders, diplomats, recruiters |
| `mumble.manage_mumble` | **Server setup**: settings, group mapping, all accounts and all guest links; give guests groups other than the guest group | Directors / comms admins |

Every non-public state gets `mumble.access_mumble` automatically: existing states when the plugin is installed, and
new states when they are created. The public (Guest) state does not. To keep a state off Mumble, remove the permission
under **Administration → Access**. Members who lose it are refused at their next connect.

## Setting up

Open **Mumble** and click **Server setup** (`/p/mumble/admin`). The **Setup** tab has the settings and **The
authenticator** card.

### 1. Settings

| Setting | Default | What it does |
|---|---|---|
| **Server address** | Empty | Host name members type into Mumble, without `mumble://` or a path. Required: Mumble counts as set up once this is filled in. |
| **Port** | `64738` | Mumble port, 1 to 65535. |
| **Shown as** | Empty | Friendly name, e.g. "Alliance comms". Empty shows the address. |
| **Login name** | `{character}` | Format of the login name. Fixed when the account is made. Spaces become underscores; only letters, digits, `_`, `.` and `-` are kept. Unique across members and guests, ignoring case. |
| **Name in Mumble** | `[{corp_ticker}] {character}` | The name others see. Follows the main character at every login. |
| **Remember client certificates** | On | After a member's first password login, their certificate alone gets them in. Switching it off forgets every stored certificate. |
| **Temporary access links** | On | Lets people with `mumble.create_temp_links` make guest links. |
| **Guests' Mumble group** | `temp` | Group guests get. Lower-case letters, digits, `-` and `_`. Required while links are on. |
| **Guests appear as** | `[TEMP] {name}` | Guest display name. Placeholder: `{name}`. |
| **Longest link (hours)** | `48` | Longest a link (and its guests' logins) may last. 1 hour to 30 days. |

Name formats take `{character}`, `{corp_ticker}`, `{corp}`, `{alliance_ticker}` and `{alliance}`. Click **Save**.

### 2. The authenticator

1. Under **Administration → API**, switch on the **Mumble** API and make a key with the scope shown (`p.mumble:auth`).
   Copy the key; it is shown once.
2. On the Mumble server, turn on Ice in `murmur.ini` (`ice="tcp -h 127.0.0.1 -p 6502"` and an `icesecretwrite`),
   restart it, and install Ice for Python 3 (`pip install zeroc-ice`, or `apt install python3-zeroc-ice`).
3. Download **Authenticator**, **Config** and **systemd unit** from the card and put them in one folder. The config
   already has this site's address.
4. In `authenticator.ini`, fill in `api_key` and, under `[ice]`, `secret` (the Ice write secret).
5. Start it with `python conduit_mumble_authenticator.py -i authenticator.ini`, or install the systemd unit (it
   expects the files in `/opt/conduit-mumble/` with a venv there).

Other options in `authenticator.ini`:

| Option | Default | What it does |
|---|---|---|
| `[conduit] timeout` | `10` | Seconds to wait for the site before refusing a login |
| `[ice] host`, `port` | `127.0.0.1`, `6502` | Where the Ice interface listens |
| `[ice] slice` | Empty | Path to `Murmur.ice`; empty looks in the usual places |
| `[ice] watchdog` | `30` | Seconds between checks that the server is there; also tells the site it is alive |
| `[murmur] servers` | Empty | Virtual server ids to attach to; empty means every running server |
| `[user] avatars` | `true` | Use character portraits from EVE's image server as Mumble avatars |
| `[log] level` | `info` | `debug`, `info`, `warning` or `error` |

The **Authenticator** stat at the top shows **Running** (called within the last 10 minutes), **Silent** or
**Never seen**, with the last call and version. Until it runs, nobody can sign in with an account from this site.

Names the site doesn't know fall through to the server's own users, so `SuperUser` keeps working.

### 3. Mapping groups

On the **Groups** tab (available once the server address is saved):

1. Pick a **Group or state** and type the **Mumble group** (as named in the server's ACLs).
2. Add more rows as needed. A person can match several rows.
3. Click **Save**. It applies at everyone's next connect. **Discard** drops unsaved rows.

Mumble groups are only names. Create them on the server's root channel ACL (Edit → ACL → Groups) and give them rights
on channels, including the guests' group.

## Day-to-day operation

- Header stats: **Server**, **Authenticator**, **Accounts**, **Guests on comms** (with open links).
- **Accounts** tab: every account with member, main and alts, Mumble name, groups and **Last connected**. Search by
  member, character or Mumble name. Alts are only shown if you may open those characters' sheets.
- **Actions** per account:
  - **New password**: makes a new password, shown once to you. Pass it on. The member is notified.
  - **Delete account**: the member can't connect until they make a new one, and is told why.
- **Guest links** tab: every link from everyone, with status, guests and **Withdraw**.
- On **Temporary access**, managers see everyone's links and can choose **Mumble groups for the guests** beyond the
  guest group.

A link and its guests' logins stop working when it expires, is withdrawn, or its maker can no longer hand out links
(lost the permission, deactivated or deleted).

When an administrator merges a member's second account into their main, the Mumble login moves to the main unless the
main has one already; then the second login is deleted.

## Security

- Passwords are stored hashed. The password is only shown once, when made.
- Ten failed logins for one name refuse password logins for that name for ten minutes. A matching remembered
  certificate still gets in.
- A visitor can make at most 5 guest logins per 10 minutes from one IP address.

## Events and notifications

| Event | When |
|---|---|
| `mumble.account_created` | A member created their Mumble account |
| `mumble.account_deleted` | A member's Mumble account was deleted |
| `mumble.temp_link_created` | Someone made a temporary link |
| `mumble.temp_access_used` | A guest got a login through a link |

Send them to a channel under **Administration → Integrations**. The plugin has no Discord ping settings of its own.

Members get notifications in the **Mumble** category when a manager resets their password or deletes their account.

## Privacy and audit logging

Stored per account: login name, display name, password hash, certificate hash, groups and last login. Per guest: name,
password hash, the IP address the login was made from, and last login.

Audit log entries (**Administration → Logs → Audit**):

| Action | Recorded as |
|---|---|
| Account created | `mumble.account_created` |
| Member changed their password | `mumble.password` |
| Manager reset a password | `mumble.password_reset` |
| Account deleted (by the member or a manager) | `mumble.account_deleted` |
| Link made / withdrawn | `mumble.temp_link`, `mumble.temp_link_revoked` |
| Guest cut off | `mumble.temp_user_revoked` |
| Settings / group mapping saved | `mumble.settings`, `mumble.mappings` |

## Background jobs

| Job | Schedule | What it does |
|---|---|---|
| `cleanup` | Hourly | Deletes guest logins a week after they ended, and links a month after they expired. |

## Group rules

Mumble adds no group rules.

## Troubleshooting

**Authenticator shows "Never seen" or "Silent".**
Check the authenticator is running, the API key has `p.mumble:auth`, the Mumble API is switched on, and the `url` in
`authenticator.ini` is right. Raise `[log] level` to `debug`.

**Nobody can log in, but `SuperUser` can.**
The authenticator isn't reaching the site, or Ice isn't on. See above.

**A member is refused with "no access".**
Their state or groups lack `mumble.access_mumble`.

**Groups don't apply.**
Mapping changes apply at the next connect. Check the group name matches the ACL group exactly.

**"The address is a host name or IP address, without mumble:// or a path".**
Enter only the host, e.g. `voice.example.com`, and the port separately.

**"Only Mumble managers can give guests other groups".**
People with only `mumble.create_temp_links` can hand out the guest group only.
