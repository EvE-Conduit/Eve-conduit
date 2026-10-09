# Changelog

Each release's section below becomes its notes on GitHub and in Administration → Updates.
Versions follow `MAJOR.MINOR.PATCH`.

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
