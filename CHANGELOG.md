# Changelog

Each release's section below becomes its notes on GitHub and in Administration → Updates.
Versions follow `MAJOR.MINOR.PATCH`.

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
