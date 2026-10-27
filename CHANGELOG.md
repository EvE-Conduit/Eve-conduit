# Changelog

Each release's section below becomes its notes on GitHub and in Administration → Updates.
Versions follow `MAJOR.MINOR.PATCH`.

## 0.5.54

A security release from a full review of the core and every plugin. Update soon, and update your plugins under
Administration → Plugins.

### Security
- **Plugin catalog signing:** the workflow that signs the plugin catalog no longer runs code from the plugins
  repository while it holds the release signing key. The catalog is built by this repository's own script, and only
  the signing step sees the key. The catalog's serial is now the time it was built.
- **SeAT import:** an alt that was sold and registered here by its new owner no longer pulls the seller's main and
  other alts into the buyer's account (where signing in with them would have opened the buyer's account).
- **Characters imported without an owner hash** now get it from their own EVE token, when the import's token check
  runs or at first sign-in. If no working token vouches for the old account the character is treated as sold, as
  before. If EVE can't be reached, the sign-in is refused for now and nothing changes.
- **Selling a character** now gives the seller's account a new main, a rechecked state and groups, and a "Character
  removed" event and audit entry. Before, an account whose main was sold kept that main's state.
- **Managing access** no longer lets someone grant themselves or anyone else administrator permissions they don't
  hold. Adding to or removing from groups that grant them, editing or deleting such groups, and moving characters
  off (or switching off) the accounts of people holding them now need someone who already holds those permissions.
- **Affiliation updates** no longer stop, leaving members in the wrong state (and with access they should have lost),
  when a character is unlinked during the run or one member's state update fails.
- **Links** in notifications, the landing page, the sidebar and the start page are refused if they contain tabs, line
  breaks or other hidden characters, which browsers could turn into a link to another site.
- **Alts:** character sheets and Intel only list the alts on an account that the viewer may see. Before, alts you
  couldn't open were listed without a link.
- **Hidden groups** can no longer be joined or requested by guessing their id.
- **Webhook addresses** (which hold Discord's and Slack's secret token) no longer appear in the service logs.
- **The SeAT import tool** stops instead of following a redirect, so its API key is never sent to another address.

### Fixes
- Parallel workers no longer refresh the same ESI login twice, which could log a character out.
- Killmail syncs no longer fail when two characters on the same kill sync at once, and a manual refresh no longer
  queues each section twice.
- Mail bodies and contract items that EVE keeps refusing are retried a few times and then given up, and fetching
  stops early when ESI has trouble, which protects the shared ESI error limit.
- Corporation member syncs only write the members whose data changed, which is much faster for large corporations.
- Two sign-ins with the same new character at the same moment no longer fail with a server error.
- Merging accounts with "move records" no longer rewrites who approved, handled or decided things.
- Member search results open the Members page correctly for names with `&`, `#` or `?`.
- Administration pages say "You don't have access to this page" to people without the permission, instead of
  showing a broken page.
- Character portraits load correctly where a list reuses a spot whose earlier picture failed, and solo kills no
  longer show "+0" next to the final blow.

### Plugins
- **TeamSpeak 1.0.1:** someone who used a link key that was later replaced, cancelled, expired or refused loses the
  Registered group again, and the six-hourly sync removes it from any identity the site stamped that isn't linked.
  Registered given by hand stays.
- **Spy Check 1.0.1:** reviewers no longer see, hear about or review findings on their own characters. A member's
  page is only there for someone who may see one of their characters. Only one scan runs at a time.
- **Ops 1.0.1:** ops for some states or groups only (`ops.*_restricted`) no longer go to webhooks set to "every
  event". The FC picker searches main character names only, so it no longer shows who owns which alt.
- **Wiki 1.0.1:** edits to pages for some states or groups go out as the private events
  `wiki.page_created_restricted` / `wiki.page_updated_restricted`. Saving an edit no longer moves the page to the
  top level, and only wiki managers can move pages. Images load without a referrer, and on public pages images from
  other sites show as a link.
- **Recruitment 1.2.2:** two recruiters deciding at once, or a decision and a withdrawal, can no longer both go
  through. "Who referred you?" needs three letters and only answers while someone can apply.
- **Mumble 1.0.1:** a member whose certificate is remembered still gets in after someone else typed ten wrong
  passwords for their name (password logins still wait ten minutes). Temporary access links and their guests stop
  working when the person who made them loses the permission or leaves.
- **Mentoring 1.2.2:** a double click no longer makes two requests, and a second mentor claiming a request is told
  it's taken.
- **Corp Store 1.0.1:** fleet points no longer pay for FATs members added by hand for their own characters, or for
  the FC's own FATs unless in-game fleet tracking saw them. Nobody can mark their own order handed over.
- **Industry Projects 1.0.1:** points per unit are limited to 1,000,000, and so is one delivery's pay. Only
  deliveries marked delivered on an open project can be confirmed, and an item's points can't change while a
  delivery waits.
- **Corp Tax 1.0.1:** marking a wallet-settled bill unpaid gives the payment back as credit (for bills settled from
  this version on). Nobody can mark their own bill paid. The payment word has to be a word of its own in the reason
  ("syntax" no longer counts). The minimum must be a real number.
- **Moon Mining 1.1.2:** nobody can mark their own invoice paid.
- **Buyback 1.2.3:** each program sets how long quotes are good for (7 days by default, 0 for no limit), and
  contracts made from an expired quote are flagged "quote expired". The wallet balance only shows to people who may
  see that corporation's wallets. NaN or infinite numbers are refused.
- **Freight 1.0.1:** two services in one corporation no longer take each other's contracts. Public quotes refuse
  numbers that aren't, instead of failing.
- **Fleets 1.2.2:** a FAT link with no closing time closes 12 hours after the fleet, or its latest FAT round,
  started.
- **Leaderboard 1.0.1:** the Fleets board counts fleets flown per member (alts and rounds count once) and ignores
  FATs members added for themselves.
- **Skill Plans 1.0.3:** the members' progress list and CSV only name a member's best character when it's their main
  or one you may see.
- **Blueprint Library 1.0.1:** request managers only see the libraries of corporations they're in or may view on the
  corporation sheet. Where blueprints are kept needs that corporation's Assets access, and where its jobs run needs
  Industry access. Managers can't handle their own requests.
- **Timers 1.2.1:** notifications that sync late still become timers. Timers read from a corporation's structures
  only show (and are announced) to people who may see that corporation's Structures, and don't go to webhooks,
  until a timer manager edits one or a member's notification reports it. Timers already on the board stay public.
- **Corp Finance 1.0.1:** the settings only list counterparty rules for corporations whose wallets you may see.
- **Structures & Fuel 1.0.1:** fuel warnings no longer name refuel claims that ran out or were finished.
- **Planetary Industry 1.0.1:** opening Corporation PI is recorded in the snooper log.

## 0.5.53

Ten new plugins: Corp Store, Doctrine Stock, Inactivity, Industry Projects, Structures & Fuel, Spy Check, Capital
Registry, Corp Finance, Blueprint Library and Planetary Industry.

### Plugins
- **New plugins** (Administration → Plugins → Browse):
  - **Corp Store:** members earn points for referrals, fleets, mentoring and industry projects, and spend them in a
    store officers fill by hand, with a points leaderboard.
  - **Doctrine Stock:** how many of each ship and item should be for sale at each staging location, what's short
    from members' and corporations' orders and contracts, members claiming shortages to seed, and low-stock alerts.
  - **Inactivity:** members who have gone quiet, from site sign-ins, game logins and fleets, a daily digest for HR,
    leave of absence with approval, and group rules.
  - **Industry Projects:** a corp build board where members claim parts of a project and mark them delivered for a
    manager to confirm (paying Corp Store points), with their industry jobs shown as a hint.
  - **Structures & Fuel:** every corporation's structures on one board with fuel countdowns and the burn of their
    online services, a fuel plan for topping everything up to a number of days, warnings at chosen thresholds (7, 3
    and 1 days by default) to chosen groups, "I'm refuelling this" claims and a dashboard widget.
  - **Spy Check:** a daily scan of members' wallets, market transactions, contracts, mail, contacts and corporation
    history for dealings with blacklisted (Blacklist plugin) or watched characters, corporations and alliances.
    Findings can be acknowledged or dismissed, and reviewers get a digest. Reviewers only see the characters their
    character sheet permissions reach, and opening evidence is logged like Member Audit.
  - **Capital Registry:** who can fly and who owns each capital class, where the hulls are parked, jump skills,
    jump clones and fatigue, members marking hulls available for ops, and "can fly" / "owns" group rules.
  - **Corp Finance:** corporation income and spending per month by category, with internal transfers kept apart,
    officers' own categories and counterparty tags, balance history per wallet division, a printable monthly report,
    a CSV journal and a dashboard widget.
  - **Blueprint Library:** the corporations' BPOs and BPCs with ME/TE, runs and location, members' shared originals,
    copy and loan requests with overdue reminders, and originals not fully researched. Reads corporation blueprints
    with a Director's login.
  - **Planetary Industry:** every colony of a member's characters with extractor countdowns, factories, storage and
    output with its value, reminders before extractors stop, and a corporation view of products and idle colonies.
- **Recruitment 1.2.1** and **Mentoring 1.2.1:** the `recruit.application_decided` and `mentors.graduated` events
  name the referrer and the mentor, so other plugins (the Corp Store) know whom to credit.

## 0.5.52

Referrals in Recruitment.

### Plugins
- **Recruitment 1.2.0:** applicants can name the member who referred them: they type part of the name and pick from
  the members whose main character matches (alts aren't searched, so nobody learns who owns which alt). Recruiters
  see the referrer on the application. Every member has a **Referrals** page with their own stats: pilots who named
  them, how many were recruited, still in progress and not accepted, and how each application went.

## 0.5.51

zKillboard history on the killmail tabs, and four new plugins: Ops Calendar, Corp Tax, Blacklist and Freight.

### Added
- **zKillboard stats** on the Killmails tab of character and corporation sheets: all-time kills and losses, solo
  kills, ISK destroyed and lost, danger and gang ratios, the last week's kills and the ships with most kills, with a
  link to the zKillboard page. Our own killmails only go back as far as ESI does; zKillboard has the whole history.
  Answers are cached for an hour, and only people who can see the sheet can ask.
- **New plugins** (Administration → Plugins → Browse):
  - **Ops Calendar:** CTAs, stratops and roams on one calendar in EVE time, with countdowns, RSVPs with a
    character, reminders, a dashboard widget and Discord pings through webhooks. Ops can be for chosen states or
    groups, and can name a doctrine from the Doctrines plugin.
  - **Corp Tax:** bounty, ESS and mission tax per member from the corporation wallet journals, an extra tax billed
    each month, payments matched from the wallet by their reason, reminders and a "tax paid up" group rule.
  - **Blacklist:** characters, corporations and alliances you don't want, with a reason, severity, expiry and
    notes. People with the permission are warned when a member links a flagged character or one applies through
    Recruitment. Members never see the list.
  - **Freight:** hauling routes with your rates, a calculator (public if you like) that gives the exact courier
    contract to make, and every courier contract to the service checked against its route.

## 0.5.50

Demo mode is removed.

### Removed
- **Demo mode** (added in 0.5.49) is gone, along with its example data, the `demo` / `demo123` sign-in and
  `Plugin.demo_data`. A migration drops the setting; real data was never touched by it, so nothing else changes.

## 0.5.49

Demo mode: show the site with example data, without touching the real data.

### Added
- **Demo mode** (Administration → Settings): the site shows example data from a database of its own, an alliance
  of three corporations with about thirty members and something on every page, plugins included. Visitors sign in
  with `demo` / `demo123`; administrators who sign in with EVE keep the real site and switch it off again. The demo
  is read-only, starts no background jobs and never calls ESI, and the real data is untouched: switching it off
  brings everything back. Plugins add example data with `Plugin.demo_data`. See docs/platform.md.

## 0.5.48

Security release: the findings of a code review. Update as soon as you can, Linux installs first.

### Security
- **Linux: the root updater could be made to overwrite or chown any file.** `conduit apply-update` runs as root
  and wrote its result, progress and log files by name into folders the service user owns, so a symlink planted
  there (by a compromised site or plugin) would have been followed. Every read and write in those folders now goes
  through `conduit.updates.safeio`, which never follows a symlink, refuses anything but a plain file and replaces
  files by rename. A planted link makes the updater refuse that request and note it in `updater.log`.
- **Releases can't be downgraded.** A signed older release was still installable; Administration → Updates now
  refuses to request a version older than the running one, and the Linux and Windows updaters check again before
  touching anything. `conduit rollback` remains the way back.
- **Plugins can't pull the wrong "conduit" from PyPI.** Plugins depend on `conduit` by name and PyPI has an
  unrelated package of that name; every pip run that installs plugins now passes a constraints file pinning
  `conduit` to the installed version (Docker build, the Docker plugins volume, Linux, Windows). A plugin that needs
  a newer EvE Conduit fails with a dependency conflict instead of installing a stranger's package.
- **Docker: the plugins volume is no longer trusted blindly.** On start, a `plugins-site.txt` line is installed only
  when a signed plugin catalog pins it exactly, or it is a git URL and `CONDUIT_PLUGIN_URLS` is on in the container
  environment; anything else is skipped and logged. Catalogs an install used are kept under `updates/catalogs/`
  so earlier installs stay valid after the catalog moves on. Plugin git URLs must use a relative `#subdirectory=`
  and a `@ref` that doesn't start with `-`.
- **Docker: rate limits and API-key IP allow-lists now see the real client address.** The app only believed
  `X-Forwarded-For` from loopback, but in the Docker install Caddy is another container, so every visitor shared
  one rate-limit bucket (a few dozen anonymous requests blocked all EVE logins for five minutes), IP-limited API
  keys were checked against the proxy's address and the logs recorded it. New setting `CONDUIT_TRUSTED_PROXIES`
  (see docs/security.md); Docker installs trust the compose network by default, nothing to do. Forwarded headers
  from any other peer are dropped, including `X-Forwarded-Proto`.
- **API keys could remove administrators.** `groups:write` and `states:write` keys were stopped from adding to
  groups and states carrying administrator permissions, but not from removing. Both are refused now, and so is a
  state change that would move an administrator to another state. API group adds also check the group's
  requirement rules.
- **Signing in as another user could be used to gain permissions.** The read-only rule only covered
  Administration, so a helper signed in as a group leader could add themselves to the led group. While signed in
  as someone else, the group-leader API, joining and leaving groups, join requests, the account's characters and
  plugins' admin routes are read-only too. Actions taken meanwhile are audited as "Helper (as Member)" instead of
  as the member, and a helper whose own account is disabled is signed out on the next request.
- **Administrator permissions can no longer be granted by a state** (membership follows whichever character a
  member picks as their main). Existing states keeping them can still be edited to drop them.
- **Member Audit's mail list is in the snooper log** for every member whose mail appears (it shows the first lines
  of each mail), and Member Audit searches are recorded whatever client sent them.
- **The SeAT import no longer stages EVE refresh tokens** in its working file; the file and folder are private to
  the app's user. Update the SeAT import program with the release.
- **Webhooks connect to the address that passed the safety check** (no second DNS lookup), never read the reply
  body, and NAT64 / IPv4-translated IPv6 addresses are judged by the IPv4 inside. JSON webhook signing secrets are
  shown once, on creation or **New secret**; lists no longer return them.
- **Unauthenticated requests to `/api/v1/` no longer create request-log rows**, so they can't fill the database;
  calls that present a key are logged as before. Refused calls to plugin APIs are now attributed to the plugin.
- Notification `category` from the external API must be one the site knows (so mutes work); titles and bodies are
  capped at 200 / 4000 characters, for plugins too.
- Nobody can move characters into their own account; another administrator has to.
- Group removals caused by a state change or an account merge are audited like every other removal.
- The intel section only names a counterparty's account when the viewer may see that character; otherwise it
  just says the character is registered here.
- The Django back-office login is rate-limited (20 per 10 minutes per IP) and its site-settings form no longer
  shows the EVE application's secret. The setup code is single use and gone once an administrator exists.
- Non-ASCII input to the setup code or the SSO `state` is refused instead of raising an error page.
- The bundled proxies send `Strict-Transport-Security`, a `Content-Security-Policy` (`frame-ancestors 'none'`,
  `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`) and a `Permissions-Policy`. Existing bare-metal
  and Windows installs keep their old proxy config until it is re-run or merged by hand.
- The corporation sheet's "Website" link only opens `https://` addresses, after the usual leave-site confirmation,
  and `/login?next=` only accepts a path on this site.

## 0.5.47

### Fixed
- **Docker: installing a plugin from the website stalled at "Waiting for the updater".** The site stopped one gunicorn
  worker instead of the server, so the container never restarted and the install never ran. It now stops the gunicorn
  master, the container restarts and installs the plugins on the way up as intended.

## 0.5.46

### Fixed
- **"Claim admin" in the setup wizard did nothing when clicked.** The button wasn't a submit button, so the code
  was only sent when you pressed Enter in the field. Same fix for the save button under Settings → EVE application.

## 0.5.45

### Fixed
- **Docker: the web container restarted forever on a fresh build.** Since 0.5.43 the image handed the static-file
  folder to the app user, but not its subfolders, so collecting static files at start failed with a permission error
  and the container never came up. Rebuild with `docker compose up -d --build`.
- **The Docker install script claimed a container had exited** as soon as it started waiting for the setup code,
  because it took `docker compose ps`'s header line for a container. It now checks properly, and also notices
  containers stuck restarting.

## 0.5.44

### Fixed
- **The Docker install script ended silently after "Continue?"** when nothing was listening on ports 80 and
  443, which is the normal case. It now carries on.
- **The Docker install script's URLs are on their own lines**, so the developer portal and callback URLs no
  longer pick up a trailing comma or `).` when clicked or copied.

## 0.5.43

### Added
- **Docker installs install plugins from the website too.** Administration → Plugins → Browse works the same as on
  Linux and Windows: tick, install, done. Plugins go into a new `plugins` volume shared by the web, worker and beat
  containers (a virtualenv on top of the image's packages), the containers restart and install them on the way up,
  and the previous plugins are put back if pip fails. No rebuild, no root, no Docker socket. Existing installs get
  the volume on their next `docker compose up -d --build`; plugins baked into the image with
  `requirements-plugins.txt` keep working and stay out of the website's reach, as before.
- **A Docker install script.** `deploy/docker/install.sh`, run from a clone of the repository, asks how members reach
  the site (domain, public IP or plain HTTP on a LAN), your email and optionally the EVE application, then writes
  `.env` with generated secrets, builds and starts the stack and prints the setup code with the next steps. The
  manual steps in the Docker guide stay for people who want to see what happens.

## 0.5.42

### Added
- **`conduit uninstall` on Linux.** Removes a bare-metal install the way the Windows one does: it asks whether to
  keep the configuration, database and backups, offers a final backup first, then stops and unregisters the
  services, the updater and the nginx site, drops the database and deletes the install's folders. It leaves the
  system packages, certificates and firewall rules alone and never deletes a user account. The script is in every
  release as `deploy/baremetal/uninstall.sh`.
- **The setup wizard connects the EVE application.** At first visit the website asks for the application's
  Client ID and Secret Key together with the one-time setup code, checks them with EVE's login server and keeps
  them in the database (the secret encrypted with the token key, like members' logins). Nobody has to edit a
  config file on the server or restart anything, and having entered the code there, the same browser becomes
  administrator after signing in without typing it again. Administrators can see, change or remove the
  application under Settings → EVE application. `ESI_CLIENT_ID` / `ESI_SECRET_KEY` in the config file still
  work and take precedence; `rotate_token_key` re-encrypts the stored secret along with the tokens.

## 0.5.41

### Fixed
- **The Linux install script is executable in the release.** `deploy/baremetal/install.sh` was shipped without
  the executable bit, so `sudo ./deploy/baremetal/install.sh` failed with "Permission denied". (On an older
  release, run it with `sudo bash ./deploy/baremetal/install.sh` instead.)

### Changed
- **Three installation guides, one per way to run EvE Conduit:** [docs/install-docker.md](docs/install-docker.md),
  [docs/install-linux.md](docs/install-linux.md) and [docs/install-windows.md](docs/install-windows.md), each written for a
  first-time operator from DNS to first login, with day-to-day commands, backups, updating and troubleshooting.
  They replace the README's Docker section, `install-baremetal.md` and the Windows Docker and WSL pages; Docker
  Desktop on Windows is a section of the Docker guide. [docs/dns.md](docs/dns.md) explains how to point a domain at
  your server, including home connections and changing IP addresses.
- The manual Linux steps now set up the updater and its folders like the install script does, and
  `conduit.env.example` carries the two update settings. The external API doc lists the `logs:snooper` and
  `import:seat` scopes.

## 0.5.40

### Changed
- **The smallest text size is the default.** New accounts start on the smallest of the five text sizes (13px),
  and everyone still on the old default moves to it on update; a size you picked yourself stays. Pages also
  start at that size before your preferences load, and when signed out.

## 0.5.39

### Changed
- **Text is a little smaller, and can go smaller still.** The normal text size is now 15px instead of 16px,
  and Settings → Appearance → Text size has five steps instead of three: 13, 14, 15, 17 or 19px. Everything on the
  site scales with it, plugins included.

## 0.5.38

### Added
- **New plugin: Wiki** (Administration → Plugins → Browse). Guides, rules and reference pages in a tree, written in
  Markdown with a live preview: headings with an "On this page" list, nested and task lists, tables, code blocks,
  images and `[[Page Title]]` links between pages. Every save keeps a revision; history shows who changed which
  lines and can put an old revision back. Editors (`wiki.edit_pages`) write; managers (`wiki.manage_wiki`) choose
  who sees a page by state or group, lock, reorder and delete pages, and make pages public for anyone at
  `/public/p/wiki/<address>`. Pages turn up in Ctrl+K search and a dashboard widget lists the latest changes.

### Changed
- **Your role tag sits under your name.** In the sidebar footer the Super admin, Admin or member-state tag now
  shows on its own line below your name, above the corporation, instead of being squeezed in to the right.

## 0.5.37

### Changed
- **Administration has its own rail.** On wide screens (1280px and up) the Administration menu moves out of the
  left sidebar into a rail on the right of the page, collapsible to icons on its own (remembered per browser), so
  the main menu stays short for everyone who runs the site. On narrower screens and on phones it stays where it was.

## 0.5.36

### Added
- **Discord webhooks can ping.** A Discord webhook under Administration → Integrations can mention `@here`,
  `@everyone` or a role, either on every message or only on events that ask for a ping. Plugins ask with `ping`
  and may name roles of their own with `mention_roles` (see docs/platform.md). Nothing people typed can ping.
- **Timers 1.2.0: Ping Discord.** A timer with *Ping Discord* on (the default when everyone is expected) makes
  those webhooks ping when it's added, moved and at every reminder. With the Discord plugin linked to your server,
  pick the roles per timer, with defaults in the timer settings. Also, the editor offers every structure the site
  knows by name (no corporation sheet needed), yours first, and fills the form in from it. Update the plugin under
  Administration → Plugins.

## 0.5.35

### Added
- **Fleets & FATs 1.1.0: FATs in the fleet MOTD.** While a fleet is tracked, the in-game fleet MOTD gets the FAT
  lines at the bottom: who has a FAT (newest first) and the FAT link, updated as pilots get one, and "Fleet ended"
  when the FC ends it. The FC's own MOTD text above them is kept. It needs the new `esi-fleets.write_fleet.v1`
  scope (FCs log in with their FC character again) and can be switched off per fleet. Update the plugin under
  Administration → Plugins.
- Plugins can use ESI's PUT routes through `esi().put(path, body, character=...)`.

## 0.5.34

### Fixed
- **A plugin switched on shows its pages straight away.** Its menu entry used to appear at once while its pages
  said "Lost in space" until the browser reloaded. Switching a plugin with pages on or off now reloads the page,
  setup finishes with a full load, and a tab that opened the site before a plugin was switched on reloads by itself
  when it reaches that plugin's pages.

## 0.5.33

### Added
- **Buyback plugin** (Administration → Plugins → Browse). Members paste their items for an instant quote and
  contract them with the tracking number; every contract is checked against its quote (items, price, location,
  who it's made out to, duplicates and imitations) and managers are told about new ones. Programs have their own
  tax, item rules, hauling and low-value costs, ore valued at the best of raw, compressed and refined, and who may
  use them, including people without an account. Prices come straight from ESI by default (or Fuzzwork or Janice)
  at the trade hub you pick, including player structures, and are checked against what items actually traded for,
  so a propped-up order can't make you overpay.
- **Public plugin pages.** Plugins can now offer pages anyone can open without signing in, at `/public/p/<plugin>/`
  (see docs/platform.md).

### Changed
- **The static data import also keeps reprocessing output and compressed ore.** Installs import their current
  static data again once after updating, by themselves.

## 0.5.32

### Added
- **Member Audit: Counterparties.** Name a character, corporation or alliance to see every member who paid, traded,
  mailed or contracted with them, or has them as a contact, with ISK sent and received per member.
- **Member Audit: Wallets.** Every member's wallet journal in one list, filtered by corporation, type, amount
  (100M, 1B or 10B ISK and up), direction, and **with outsiders only** (players and corporations not registered
  here). Search covers the reason, description and either party's name.
- **Member Audit: Contracts.** Every member's contracts, one row per contract with the members holding it, filtered
  by state, type, value and outsiders only. Search finds titles, items and party names; a contract opens with its
  items.
- **Member Audit: Skill check.** Pick ships or items, paste a skill list from the game, or both, to see which
  members are ready, have the rest in their skill queue, or are missing skills, with time to train.
- Seeing a character's wallet, contracts or dealings in Member Audit is recorded in the snooper log, like opening
  that section of their character sheet. Searches and skill checks go in the audit log.

## 0.5.31

### Security
- **Member Audit searches opened from another site are no longer logged.** A link elsewhere could open a search in
  an auditor's browser and put words of the linker's choosing in the audit log under the auditor's name. The
  results were never readable by the other site. Searches are also cut at 200 characters.

### Changed
- **The front end is built with Node 24** (the current LTS) instead of Node 22, in Docker and in the release
  files. Nothing changes for running installs.

## 0.5.30

### Added
- **Member Audit** (Administration → Member Audit): search the mail of every member character you can see in one
  place, by subject, text or sender, filtered by corporation. A mail several members received is one row showing
  who has it and whether they've read it. Access takes the new **Can use Member Audit** permission (HR staff);
  whose mail is included still follows the character-sheet permissions (every member, alliance or corporation).
  Opening a mail goes in the snooper log for each character holding it, and searches go in the audit log.
- **Alts on the character sheet:** the header lists the owner's other characters, main first, with corporation
  and login status. Ones you aren't allowed to open are shown without a link.
- **Why a character needs attention:** hovering "Needs attention" on a character card or in Compliance shows
  each missing ESI scope and which plugin or character-sheet section needs it.

### Updating
- **Database migration** adds the Member Audit permission; it runs on the usual update.

## 0.5.29

### Changed
- **Character and corporation data keeps up on big installs.** Routine syncs now wait in their own queue, which
  the scheduler tops up to `CONDUIT_SYNC_QUEUE_MAX` (20,000) jobs instead of queueing at most 500 every two
  minutes, so thousands of characters stay as fresh as their sections' intervals. **Refresh** and a newly
  linked character's first sync skip that queue and start within seconds.
- **Background jobs run on threads, 16 at once by default** (was 4 processes). Syncs mostly wait on ESI, so this
  is several times faster on the same server. For large alliances raise `WORKER_CONCURRENCY` (about 16 per 1000
  characters); `.env.example` explains the sizing.
- **PostgreSQL:** each process now keeps a connection pool (`CONDUIT_DB_POOL=false` turns it off), and the Docker
  database runs with settings sized for a server instead of Postgres's defaults (`POSTGRES_MAX_CONNECTIONS`,
  `POSTGRES_SHARED_BUFFERS`, `POSTGRES_EFFECTIVE_CACHE_SIZE` in `.env`). Bare-metal installs: see the new
  tuning block in the install guide.
- **Assets, blueprints and skills** are updated in place on each sync instead of deleted and written again, which
  keeps the database much smaller and quieter on busy installs.
- **The ESI log records failed calls only by default** (`CONDUIT_ESI_LOG=all` brings back a row per call). The
  totals in Administration → Logs → ESI and Health still count every call. Old log rows are purged in batches.

### Added
- **Rate limits in Administration → Logs → ESI:** for each ESI rate-limit group, its limit, how many calls used
  it, the fewest tokens any bucket had left (and whose), and how many requests ESI refused.

### Fixed
- **A broken EVE application no longer logs everyone out.** If the application's id or secret is wrong, EVE answers
  token refreshes with `invalid_client`; every character used to be marked as needing a new login. Now only a
  revoked or expired token (`invalid_grant`) does that, and the error is logged for the admin.
- **ESI rate limits are respected everywhere.** A rate-limited answer without rate-limit headers now pauses that
  route; routes are paused with the rest of their group even before their first call (the groups come from
  ESI's own specification); and a nearly empty bucket waits about as long as it takes to refill instead of a
  flat minute.

### Updating
- **Docker:** `docker compose up -d --build` (new Python dependency and database settings).

## 0.5.28

### Added
- **Bring every character's data over from SeAT.** After importing the accounts, **Import character data** in the
  SeAT import program (attached to this release) brings over everything SeAT kept for the ticked users'
  characters: wallet journal and transactions, mining, mail, killmails, contracts, industry jobs, market orders,
  notifications and calendar, plus skills, assets, blueprints, planets, contacts, standings, loyalty points,
  research, fittings, location and clones. History is added to what's here, matched by EVE's ids, so nothing is
  doubled and nothing EVE gave is changed. Current state comes from SeAT only where a character has never synced
  that part from EVE, so characters whose tokens are gone keep SeAT's last copy, and sections filled this way say
  "From SeAT, data as of ...". It needs a full dump of SeAT's database; the program sends Conduit only the tables
  it needs, compressed, and Conduit imports them in the background. For a very large dump, copy it to the server
  and run `conduit manage import_seat_history <dump>` instead. See `tools/seat-import/README.md`.

### Changed
- **Docker:** `docker-compose.yml` adds a `seat_import` volume shared by the web app and the worker, for the
  character data import. `docker compose up -d --build` after updating creates it.

## 0.5.27

### Fixed
- **The SeAT import program reads more kinds of dump.** Exports from phpMyAdmin, HeidiSQL and similar tools (which
  put each row on its own line) stopped it with "substring not found"; so did a dump saved by PowerShell's `>`.
  If a dump still can't be read, it now says at which line. The window's title shows its version.

## 0.5.26

### Added
- **Move from SeAT.** A new SeAT import brings a SeAT install's users, characters, SSO tokens and squads over.
  Take a dump of SeAT's database, then run **EvE-Conduit-SeAT-Import.exe** (attached to this release) on any
  Windows PC: pick the dump, search and tick the users to bring over, preview, import. Squads become closed groups
  with their moderators as leaders, and every imported token is checked with EVE once. Characters already here
  stay on their account, working tokens are never replaced, and importing again skips what's already there.
  Tokens keep working only if this site uses SeAT's EVE application; otherwise import without tokens and members
  log in once to get their characters back. Switch on **SeAT import** under Administration → API and use a key
  with the `import:seat` scope. There's a command-line version too; see `tools/seat-import/README.md`.
- **Two new themes, Sakura and Neo Tokyo**, under Settings → Appearance: their own colours and rounder shapes,
  on a light and a dark base.

## 0.5.25

### Added
- **Upload the landing page's background image.** Administration → Settings → Landing page has an **Upload** button
  next to the hero's background image: a PNG, JPEG, WebP or GIF of up to 5 MB. Pasting an https:// address still
  works. Uploaded images are kept in the database, so they need no extra setup on any kind of install and your
  database backups include them. Images no longer used are removed when the landing page is next saved.

### Changed
- **Sidebar links have their own Save settings button**, next to Add link, so you don't have to scroll back up.

### Plugins
- **Doctrines 1.1.0:** fits that aren't in any doctrine are listed under **Other fits** on the Doctrines page and the
  character sheet tab, and can be picked in the "Can fly doctrine fit" group rule. Managers get a **New fit** button.
  The fitting window looks more like the game's: every rack has a fixed place (a Strategic Cruiser's subsystems no
  longer run into its high slots), module icons sit on one band, and the hardpoints and the CPU, powergrid and
  calibration gauges are inside the ring. Resources count the fitting skills at V, with a toggle for no skills.

## 0.5.24

### Added
- **Your own links in the sidebar.** Administration → Settings → Sidebar links: add up to 20 links to your wiki,
  killboard, Discord invite or anything else, each with a label and an icon, under a heading you choose ("Links" by
  default). They show in everyone's sidebar between Plugins and Administration and in the command palette. Other
  websites open in a new tab; pages on this site open in place. Signed-out visitors don't see them.

### Plugins
- **Discord 1.1.3:** states made in Administration → States can link Discord again. Saving the form took the
  Discord permission away right after it was given, so their members had no access and got none of the mapped
  roles. States made before this need "Can link a Discord account and join the server" ticked by hand.
- **Discord 1.1.4:** removing a role mapping takes the role away from everyone again, instead of it looking like a
  role given by hand and staying. Mappings removed before this update aren't known, so take those roles off by hand.
- **Mentoring 1.1.0:** a goal can be for certain focus areas only (PvP, Industry...): only mentees who asked for help
  with one of them get it, and their progress and the graduation prompt count only their own goals.
- **Mentoring 1.2.0:** Mentoring → Settings has a **Graduates** tab: who graduated, when, with whom and after how
  long. Program managers can **Reopen** a graduated or ended mentorship with its goals and thread, back with its
  mentor if they still mentor, or on the waiting list otherwise.

## 0.5.23

### Added
- **Every plugin has its own log.** Administration → Plugins has a **Logs** button on each plugin, with how many
  errors and warnings it logged in the last day. It lists when the plugin was installed, updated and switched on or
  off, plus everything the plugin logs itself, normal activity included (from `INFO` up; set
  `CONDUIT_PLUGIN_LOG_LEVEL` to change that). New plugins get one automatically: anything they log with
  `logging.getLogger(__name__)` lands there. The service log under Administration → Logs can be filtered by plugin.

## 0.5.22

### Added
- **Merging accounts can bring the person's records along.** When every character of an account moves (Administration
  → Members → Move characters), tick **Also move their records** (on by default): SRP requests, skill plans,
  recruitment applications, mentoring, moon invoices, notifications and whatever else plugins keep for them move to
  the main account. Where only one is allowed per member (a moon invoice for the same month, preferences, a Discord
  link) and the main account already has one, the old one stays behind and you're told which. It works for every
  plugin without changes; the site's owner is never moved.

### Plugins
- **Discord 1.1.2:** gives the main account its roles when its Discord link moved with the records.

## 0.5.21

### Added
- **Move characters to another account.** For someone who signed up twice instead of adding an alt: Administration →
  Members → Move characters (needs "Can manage states and groups"). Pick the characters and the member they belong to;
  their logins and everything synced for them go along. Moving all of them merges the accounts: the old one is
  switched off (it can't sign in), leaves its groups and drops off the member list, and its history stays for the
  record. States, compliance and smart groups are re-checked for both.
  - Whoever owns a character signs in to the account that holds it, so you can only move characters into an account
    whose permissions you hold yourself, and only administrators can move characters to or from an administrator.
  - New webhook events: **Character moved** and **Accounts merged**.

### Plugins
- **Discord 1.1.1:** when accounts are merged, the old account's Discord link moves to the main one (if it has none;
  otherwise the old account's roles are taken away).

## 0.5.20

### Added
- **Plugins can add to compliance.** Besides every character having a working login, enabled plugins can ask for
  more (`Plugin.compliance`). Those problems show on Administration → Compliance (also on a member's detail), in the
  member's notification ("Your account needs attention") and in the Compliant group rule.

### Plugins
- **Discord 1.1.0:**
  - **Mains and alts** in Discord → Members: each linked member's main and the alts you may see (administrators and
    people who can view every character see all), with links to the character sheets. The search also finds a
    Discord account by any of its characters' names.
  - **"Must be on the Discord server to be compliant"** (Setup, off by default): members who may link Discord are not
    compliant until they've linked it, and while they're not on the server. Leaving the server is noticed at the next
    sync, within 6 hours. Members who left are marked "not on the server" in the list.

## 0.5.19

### Changed
- **Permissions are grouped by who they're for.** When editing a state or a group, the permissions are in four
  sections: **Regular users**, **HR staff**, **Directors** and **Admins**, each with a short hint and how many are on.
  Plugins say where theirs belong (`Plugin.permission_tiers`); anything else shows under **Other**.
- Django's automatic add/change/delete/view permissions for plugin tables, which nothing on the site uses, are no
  longer offered. Any that were granted are listed under "Granted, no longer offered" so you can remove them.

### Plugins
- **Announcements 1.1.1, Discord 1.0.4, Doctrines 1.0.3, Fleets 1.0.2, Mentoring 1.0.3, Moons 1.1.1, Recruitment
  1.1.5, Skill Plans 1.0.2, SRP 1.0.3:** say which section their permissions belong in. Nothing else changed; on
  older versions of EvE Conduit their permissions show under Other.

## 0.5.18

### Security
A review of EvE Conduit and every official plugin. Update soon, and update your plugins (Administration → Plugins).
- **Administrator groups:** a group carrying administrator permissions can only be filled by someone who manages
  access, whatever adds the member. Recruitment could otherwise make an accepted applicant an administrator.
- **Private webhook events:** members' own notifications and announcements for some groups only are no longer sent to
  webhooks set to "every event"; pick them by name for a channel only the right people can read.
- **Slack webhooks** escape `< > &`, so text people typed can't ping a channel or hide a link.
- **Pasted text** (skill lists, fits, announcements) is read without patterns a crafted line could stall the server
  with.
- **Linux, IP address installs:** `conduit ip-cert` keeps certbot's working files in root-only folders.

### Added
- **Plugins can add sections to the landing page**, like dashboard widgets. Administration → Settings → Landing
  page → From plugins switches each one off or on.

### Plugins
- **Recruitment 1.1.4:** only people who manage access can put an administrator group on a form or accept anyone into
  one. Closed applications take no more messages, and live character data is only shown while an application is open.
- **Announcements 1.1.0:** a **Bulletin** on the landing page: the newest (or pinned) announcement as the lead story
  and the next three beside it, only what each member may see. Each announcement has a "Post to the landing page"
  switch. Announcements for some states or groups fire a separate, private webhook event. Pinning is audited.
- **Moons 1.1.0:** the ledger only shows corporations whose mining the viewer may open on the corporation sheet (moon
  officers without a corporation permission see an empty ledger until they get one), and closing a month needs every
  corporation in it.
- **SRP 1.0.2:** only the member's own losses, from after the character was linked to their account, can be claimed;
  pasted links for anyone else's loss are refused before anything is stored, 10 per 10 minutes. Nobody, superusers
  included, decides, reopens or pays their own request. The payout CSV can't run spreadsheet formulas.
- **Fleets 1.0.1:** fleets are tracked only with your own character. FATs an FC adds by hand for their own characters
  don't count, the Fleet attendance rule can require a minimum number of pilots, and only managers change an ended
  fleet's type.
- **Discord 1.0.3:** "Fix my roles" has a 30 second cooldown and pages no longer wait on Discord's rate limit.
  Unlinking keeps the link (and says so) when Discord can't take the roles away.
- **Mentoring 1.0.2:** a mentor who loses the mentor permission can't open their mentees' character sheets any more;
  mentors only see the main character of members they don't mentor.
- **Doctrines 1.0.2:** readiness only names a member's character to people who may open its sheet; the CSV can't run
  formulas.
- **Skill Plans 1.0.1:** the members CSV can't run formulas.
- **Example 0.1.2:** errors aren't passed to the browser; the template explains which checks a plugin must do itself.

## 0.5.17

### Added
- **No domain needed: install on the server's IP address.** Let's Encrypt now issues certificates for IP addresses,
  so every install type takes the server's public IPv4 address where it asked for a domain, and the site still gets
  real HTTPS (`https://203.0.113.7`). The certificate is valid six days and renewed automatically. The address must
  not change (the EVE login's callback URL and the certificate are tied to it), and port 80 or 443 must be reachable
  from the internet.
  - **Windows:** enter the IP address in the setup wizard (or `install.ps1 -Domain 203.0.113.7`). Private, IPv6 and
    mistyped addresses are explained before anything is installed.
  - **Linux:** `install.sh --domain 203.0.113.7`. The new `sudo conduit ip-cert` gets and renews the certificate (it
    installs a certbot new enough for IP certificates); run it again if the first request failed.
  - **Docker:** set `CONDUIT_DOMAIN` (and the site URL) to the IP address.

## 0.5.16

### Fixed
- **Static data is imported again reliably after updating.** 0.5.14 reads more of EVE's static data (fitting data
  and the skills items need), and installs import it again after updating. That import could be picked up by a
  background worker still running the old version, which skipped it, so Doctrines said the ship's slot layout
  wasn't known. Workers now check when they start and import it if needed.

### Added
- **Administration → Health** says when the static data needs importing again, and has an **Import again** button
  (for people who can change site settings).

### Plugins
- **Doctrines 1.0.1:** explains what to do when a ship's slot layout is missing.

## 0.5.15

### Changed
- **Plugin settings sit under the plugin in the sidebar.** A plugin with more than one page in the sidebar now has
  one entry, and its other pages (such as Settings) are listed under it while you're on the plugin's pages. Ctrl+K
  finds them as "Recruitment › Settings".

### Plugins
- **Recruitment 1.1.3:** Recruitment settings is now Recruitment → Settings.
- **Mentoring 1.0.1:** the Mentoring program page is now Mentoring → Settings, and Mentoring has its own compass icon
  (Ship Replacement uses the life buoy).

## 0.5.14

### Added
- **Three new plugins** (Administration → Plugins → Browse):
  - **Doctrines:** your fleet doctrines and their fits. A fit is shown like the in-game fitting window (ship in the
    middle, high, mid and low slots, rigs and subsystems around it) or as a list. Fits are pasted straight from the
    game or Pyfa, or taken from a member's saved in-game fittings. **Copy to paste in game** puts the fit on the
    clipboard for the Fitting window's "Import from clipboard", and **Save to my fittings in EVE** saves it to a
    character's fittings directly. Every member sees which of their characters can fly each fit, what's missing and
    how long it takes to train, and can copy the missing skills for the game's skill plan import. Leadership gets a
    readiness table (who can fly what), there's a Doctrines tab on the character sheet and a "Can fly doctrine fit"
    group rule.
  - **Skill Plans:** shared plans from leadership and personal plans for everyone, with each character's progress
    and time left (using their attributes and implants). Plans are pasted from the game, built skill by skill or from
    what a ship needs, and copied back into the game's Skill Plans window or skill queue. Leadership sees every
    member's progress on a shared plan, and the "Completed skill plan" group rule can give roles and access.
  - **Mentoring:** new members ask for a mentor, mentors claim them (or managers assign them), and goals track how
    they're getting on. Goals can tick themselves from any group rule (skill points, fleets, skill plans, doctrine
    ships...) or be ticked by the mentor. With a message thread, private mentor notes, graduation, and group rules
    for "being mentored" and "graduated", e.g. for a New bro role on Discord.
- **More static data:** the static data import now keeps the skills every item needs and the fitting layout of ships
  and modules (slots, hardpoints, CPU, powergrid, calibration). Existing installs import their static data again
  once after updating, by themselves (about a minute).

### For plugin authors
- `conduit.sheet.skills.training`: skill plans, prerequisites, training times and the in-game skill list format.
- Group rule `choice` parameters can take a function, for choices that change. `RuleSetEditor` is in `@conduit/sdk`.
  See [docs/platform.md](docs/platform.md).

## 0.5.13

### Changed
- **Browsers no longer cache the site.** Every page, plugin, file and API answer is sent with
  `Cache-Control: no-cache`: browsers check back on each load (a quick "unchanged" when nothing changed), so updates
  show up at once. **Bare metal and Windows:** updating doesn't rewrite the web server config, so after this update
  run `sudo conduit web-headers` (bare metal) or `conduit web-headers` in an Administrator terminal (Windows) once.
  It only changes the old cache lines and leaves the rest of your config alone; later updates do it for you. Docker
  needs nothing.
- **Refreshing from ESI takes a permission.** Character and corporation data comes from the scheduler (characters
  are checked every 2 minutes, corporations every 5). The Refresh buttons that ask ESI right away are now only for
  people with the new **Can refresh character data from ESI now** (`sheet.refresh_characters`) or **Can refresh
  corporation data from ESI now** (`corp.refresh_corporations`) permissions, and administrators. Owners no longer
  get it automatically: give it to a group or state under Administration → Access if you want them to have it.

### Plugins
- **Discord 1.0.2:** every state may link Discord by default, guests included (Recruitment's Require Discord needs
  that). Existing states get it when the plugin updates, new states when they're made; take it off a state under
  Administration → Access to keep it out.
- **Recruitment 1.1.2:** the Settings page text matches that.
- **Example (Server Status) 0.1.1:** no longer switched on for new sites; it's a template for plugin authors.
  Sites that have it on keep it on.

## 0.5.12

### Fixed
- **Updated plugins show up straight away.** A plugin's page was always loaded from the same address, and browsers
  could keep the old one for up to 7 days after the plugin updated. The address now includes the plugin's version.
  (Already stuck on an old page? Press Ctrl+F5 once.)

### Plugins
- **Recruitment 1.1.0:** a **Require Discord** option under Recruitment → Settings (off by default). When it's on,
  applicants must link their Discord account and be on your Discord server before they can apply; the apply page
  tells them what's missing. Needs the Discord plugin installed, switched on and set up, and your Guest state needs
  "Can link a Discord account" so applicants can link.
- **Recruitment 1.1.1:** a "Recruitment settings" entry in the sidebar for people who manage forms.

## 0.5.11

### Changed
- **Plugins are for members only.** Guests (people in the public "Everyone" state) and anyone without a state no
  longer see members' plugins: they're left out of the sidebar, their pages and API refuse them, and they add
  nothing to search. Members are everyone in another state, plus administrators. **Discord** and **Recruitment**
  stay open, so guests can still apply and link Discord (Discord is still gated by `discord.access_discord`).
- **Update Discord and Recruitment to 1.0.1** (Administration → Plugins) together with this release; older
  versions count as members-only, so guests couldn't apply or link Discord until they're updated.
- Announcements 1.0.1 only notifies members.
- Plugin authors: plugins are members-only unless they set `members_only = False`. See "Members-only plugins" in
  `docs/platform.md`.

### Fixed
- A switched-off plugin's main API route (e.g. `/api/p/announcements`, without a trailing slash) still answered.

## 0.5.10

### New
- **A landing page.** Members now land on **Home** after signing in: a welcome banner with their main character,
  their characters, groups, unread notifications and the EVE clock, tiles linking to the main pages, and a few
  panels of text. Administration → Settings → Landing page lets you change all of it: texts, background image,
  buttons, tiles (icon, title, text, link) and Markdown sections, with a live preview and a reset to the default.
  Texts can use `{name}`, `{corporation}`, `{alliance}` and `{site}`. Home is also first in the sidebar.
- **Snooper log.** Administration → Logs → Snooper lists every time someone opens a character sheet that isn't
  theirs (HR, recruiters, directors, or anyone a plugin lets in): who looked, at which character and whose it is,
  which section, and from where. Looking at your own characters is never recorded, repeat views are listed once per
  10 minutes, and an admin signed in as someone else is named as the viewer. Also available to API keys with the new
  `logs:snooper` scope at `/api/v1/logs/snooper`. Kept for 365 days (`CONDUIT_SNOOP_LOG_DAYS`).

### Changed
- Sites whose start page was the dashboard (the old default) now start on the landing page. To go back, choose
  Dashboard under Administration → Settings → Start page.

## 0.5.9

### New
- **Asset rules for groups.** Group requirements and smart groups can check what people own, from the character
  sheet's synced assets: **Owns ship** (any of the chosen ships), **Owns ship class** (e.g. any Dreadnought or
  Force Auxiliary) and **Has item** (e.g. at least 10 PLEX, quantities added up), each on the main or on any
  character, with a minimum count. Plugins can use the new `ship`, `ship_group` and `item` parameter types.

## 0.5.8

### New
- **Super admin.** Whoever claimed the site with the setup code is its super admin: always an administrator, and
  nobody (themselves included) can remove them. They're marked "Super admin" in the sidebar and under Settings →
  Administrators. Existing sites pick the person who claimed the setup code from the audit log, or else the first
  administrator.

### Changed
- **Updates and plugin installs start within seconds** instead of waiting up to two minutes for the updater. On
  Linux a systemd path unit starts it as soon as you click Install (the cron job stays as a backup, and is all
  there is without systemd); on Windows the updater task now watches for requests every few seconds. This update
  itself still starts the old way: the faster updater is switched on by its first run afterwards.
- Character sheet → Overview: corporation roles and employment history show the first 4, with a button for the rest.

## 0.5.7

### New
- **Choose a start page.** Administration → Settings → Start page picks where people land after signing in: the
  dashboard, or a plugin's page such as the new Announcements plugin. Links to a specific page still go there.
- **Manage administrators.** Administration → Settings → Administrators lists everyone with full access; administrators
  can make other members administrators or remove them (the site always keeps at least one). New administrators are
  told by notification, and both changes are in the audit log.
- **Administration → Groups**, a page of its own: find and filter groups, create, edit and delete them, and look after
  each group's members and join/leave requests in one place. States stay under Administration → States (formerly Access).
- The Administration section of the sidebar can be folded away; it remembers, and still shows the page you're on.

### Changed
- Administrators show an "Admin" tag in the sidebar instead of their state.

## 0.5.6

### New
- **Plugins can open character sheets to more people** (`Plugin.sheet_access`), for example recruiters looking at an
  applicant's characters while the application is open. Used by the new Recruitment plugin. See
  [docs/platform.md](docs/platform.md#character-sheet-access).
- Plugin front ends can import `react-router`'s types when type-checking.

## 0.5.5

### New
- **An update window.** While an update or plugin install runs, a window in the middle of the screen shows what's
  happening: waiting for the updater, backing up, installing, updating the database, restarting, with the time
  so far. It stays up while the site restarts and reconnects by itself, then says the new version is running
  and reloads the page. Everyone sees it; "Hide" leaves just the banner at the top.

## 0.5.4

### New
- **Search contracts by item.** Character sheet → Contracts has a search box: type part of an item name (or a
  contract title) to find the contracts that hold it. Each match shows the items it found and how many.

## 0.5.3

### Fixed
- **Administration → Plugins → Browse** loads the plugin catalog by itself when it's opened, instead of saying it
  hasn't been loaded until the daily check or a click on "Refresh catalog". If GitHub can't be reached, the page
  says so.

## 0.5.2

### New
- **See an update happen.** While the updater installs a new version or plugins, Administration → Updates and
  → Plugins show each step as it happens (backing up, installing, updating the database, restarting). Everyone
  else sees a banner saying the site is updating, and while it restarts, a "back in a minute" page that reloads
  by itself. When the new version is running, open pages offer a reload.
- **Windows tray panel:** shows "Updating to 0.5.x: installing..." with a blue icon while an update runs, instead
  of reporting the stopped services as a problem, and says when the update has finished.

### Fixed
- **Linux:** the `conduit` command in `/usr/local/bin` now comes from each new release. Before, it stayed as
  installed, so fixes to the updater never arrived. Run this once after updating to 0.5.2 to pick them up:
  `sudo install -m 0755 /opt/conduit/app/deploy/baremetal/conduit /usr/local/bin/conduit`

## 0.5.1

### Fixed
- **Plugin catalog:** Administration → Plugins → Browse couldn't load the catalog. It's now published by the
  main repository (on its `plugin-catalog` release), which holds the signing key.

## 0.5.0

### New
- **Install plugins from the website.** Administration → Plugins → Browse lists the official plugins from
  [github.com/EvE-Conduit/plugins](https://github.com/EvE-Conduit/plugins). Tick the ones you want and install them
  together, switched on straight away if you like. Windows and Linux installs do this through their updater, which
  takes a backup first and puts the previous plugins back if anything fails. Docker installs get the lines to add
  to `requirements-plugins.txt`.
- **Plugin updates.** Each plugin installed this way can update itself when a new version is published, or wait
  for you; administrators are told about new versions once a day either way. Plugins can also be removed again.
- **Plugins from any git repository**, for installs whose server owner allows it with `CONDUIT_PLUGIN_URLS=true`.
- The plugin catalog is signed with the release key, and every plugin in it is pinned to an exact commit.

### Fixed
- **Linux updates from the website:** if a step of the upgrade failed, the updater could still report success and
  skip putting the previous version back. Failures are now caught and rolled back.

## 0.4.3

### Fixed
- **Windows installer:** 0.4.2 stopped while downloading components ("The term ' param($Cab, $OutDir) ...' is not
  recognized"). Unpacking the Visual C++ runtime works again.
- **Uninstalling an install that failed part-way:** the uninstaller now recognises a half-finished install folder
  and removes it.
- Every change is now tested with a complete Windows install on a real Windows machine before it's released.

## 0.4.2

### Fixed
- **Windows installer:** the install stopped right after setting up the database, on a harmless warning
  ("System check identified some issues"). Under the setup wizard, Windows PowerShell treated anything a program
  printed on its error stream as a failure. Programs are now judged by their exit code only.
- The security warnings (for example "the Django back-office is reachable") no longer print before every
  management command. They're on Administration → Health and in `conduit manage check --deploy`.
- If an install fails part-way, the uninstaller can now always remove what was installed.

## 0.4.1

### Fixed
- **Windows installer:** pressing Next on the EVE login page always said "Please fix these before installing" with an
  empty list, even when every answer was fine. Real problems are now listed one per line.

## 0.4.0

The first release under the EvE Conduit name, with a new look, a Windows installer and in-app updates.
**Existing installs need a fresh install**: the internal names changed (see Upgrading below).

### New
- **Updates from inside the site.** Administration → Updates shows every newer version with what changed. You
  choose to download it (it's checked against the project's signing key), then choose to install it. Windows and
  Linux installs install it themselves with a backup first and an automatic rollback if anything fails; Docker
  installs get the commands to run.
- **Windows installer.** `EvE-Conduit-Setup-<version>.exe` asks for the folder, domain, HTTPS, database, ports and
  your EVE application, checks them, installs everything and shows your setup code at the end.
- **Bridge HUD design.** A new look throughout: squared, high-contrast panels with corner brackets, an alert strip
  for urgent things (low fuel, reinforcement timers, lost logins), segmented progress bars, EVE-style skill pips, an
  EVE clock and a Comms log on the dashboard. Dark, light and high-contrast themes, adjustable text size.
- **Corporation sheet.** Members and member tracking, structures with fuel and reinforcement alerts, wallets,
  assets, industry, contracts, market, mining, starbases and killmails, synced with a role holder's login.
- **Groups.** Open, request-to-join or managed groups; group leaders who approve requests; entry requirements; smart
  groups kept up to date by rules (skills, corporation, SP, titles, compliance and more).
- **Compliance.** Who has every character registered with a working login, and corporation members nobody has
  registered.
- **Notifications.** A bell with unread count, a notifications page, muting by category, and an API for bots.
- **Search.** Ctrl+K or `/` finds characters, members, groups, corporations, alliances, systems and items.
- **Integrations.** Webhooks to Discord, Slack or any service, signed, with delivery history.
- **For admins.** A Health page, signing in as a member to help them, and maintenance mode.
- **Plugins.** What used to be called modules are now plugins, in the `plugins/` folder.

### Security
- Signing in as another member can't be used to gain permissions, and administration is read-only while doing it.
- Groups and states that grant administrator permissions can't be handed out by group leaders, self-service joining,
  smart-group rules or API keys.
- Webhooks only reach public addresses; notification links are checked; rate limits on login, the setup code and
  failed API keys; warnings for risky server settings on the Health page.

### Fixed
- Corporation member roles are fetched from the right ESI route.
- Structures a character can't dock at are no longer asked about again every day, which saves ESI error budget.

### Upgrading
Internal names changed from `evecsm` to `conduit`: the `conduit` command, `conduit-*` services, `CONDUIT_*`
settings and `conduit.plugins` for plugins. Uninstall the old version with `evecsm uninstall`, then install 0.4.0.
From 0.4.0 on, updates install from Administration → Updates.
