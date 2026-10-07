# Changelog

Each release's section below becomes its notes on GitHub and in Administration → Updates.
Versions follow `MAJOR.MINOR.PATCH`.

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
