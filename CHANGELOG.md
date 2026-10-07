# Changelog

Each release's section below becomes its notes on GitHub and in Administration → Updates.
Versions follow `MAJOR.MINOR.PATCH`.

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
