# Plugins

Everything beyond the core is a **plugin**: an installable Python package (with an optional front-end
bundle) that adds pages, dashboard widgets, character-sheet tabs, API routes, background jobs, search
results, group rules and ESI scopes.

- [`conduit-example`](conduit-example) is a complete working plugin. Copy it to start your own.
- [`conduit-moons`](conduit-moons): the Moon Mining Ledger: monthly moon mining per member, moon tax and payments.
- [`conduit-recruitment`](conduit-recruitment): Recruitment: application forms, a review queue and accepting into groups.
- [`conduit-srp`](conduit-srp): Ship Replacement: members claim losses from their killmails, reviewers approve and pay.
- [`conduit-discord`](conduit-discord): Discord: link accounts and join the server, with roles and nicknames from groups and states.
- [`conduit-announcements`](conduit-announcements): Announcements: news for everyone or chosen states and groups, pinned, scheduled and notified.
- [`conduit-fleets`](conduit-fleets): Fleets & FATs: attendance from the FC's in-game fleet or a FAT link, stats, and a FAT group rule.
- [`conduit-skillplans`](conduit-skillplans): Skill Plans: shared and personal skill plans with each character's progress and training time, copied into the game.
- [`conduit-doctrines`](conduit-doctrines): Doctrines: doctrine fits shown like the in-game fitting window, copied into the game or saved to a character's fittings, and who can fly them.
- [`conduit-mentors`](conduit-mentors): Mentoring: new members get a mentor, with goals that tick themselves from group rules, a thread and graduation.
- [`conduit-buyback`](conduit-buyback): Buyback: programs with taxes and item rules, instant quotes from a paste, and every contract checked against its quote. Programs can be public.
- [`conduit-leaderboard`](conduit-leaderboard): Leaderboard: members ranked by kills, ISK destroyed, fleets, mining, bounties, industry and skillpoints, with a podium per board and monthly medals.
- [`conduit-timers`](conduit-timers): Timers: structure and sovereignty timers with live countdowns, who's going and reminders, read from your corporations' structures and in-game notifications too.
- [`conduit-mumble`](conduit-mumble): Mumble: members make a Mumble account whose name and groups follow their main character, groups and state; temporary access links let guests in for a while.
- [`conduit-teamspeak`](conduit-teamspeak): TeamSpeak: members link their TeamSpeak identity with a one-time privilege key; their server groups follow their groups and state through ServerQuery.
- [`conduit-wiki`](conduit-wiki): Wiki: pages in a tree with Markdown, a table of contents, history with restore, visibility by state or group, and public pages for recruits.
- [`conduit-ops`](conduit-ops): Ops Calendar: CTAs, stratops and roams on one calendar in EVE time with countdowns, RSVPs with your character, reminders and Discord pings.
- [`conduit-tax`](conduit-tax): Corp Tax: bounty, ESS and mission tax per member from the corp wallet, an extra tax billed monthly, payments matched from the wallet, reminders and a paid-up group rule.
- [`conduit-blacklist`](conduit-blacklist): Blacklist: characters, corporations and alliances you don't want, with notes, and a warning when one links a character or applies.
- [`conduit-freight`](conduit-freight): Freight: routes with your rates, a calculator that gives the exact courier contract to make, and every courier contract checked against its route.
- [`conduit-store`](conduit-store): Corp Store: members earn points for referrals, fleets, mentoring and industry projects, and spend them in a store officers fill by hand, with a points leaderboard.
- [`conduit-stock`](conduit-stock): Doctrine Stock: how many of each ship and item should be for sale at each staging location, what's short from members' and corporations' orders and contracts, members claiming shortages to seed, and low-stock alerts.
- [`conduit-inactivity`](conduit-inactivity): Inactivity: members who have gone quiet, from site sign-ins, game logins and fleets, a daily digest for HR, leave of absence with approval, and group rules.
- [`conduit-projects`](conduit-projects): Industry Projects: a corp build board where members claim parts of a project, mark them delivered for a manager to confirm (paying Corp Store points), with their industry jobs shown as a hint.
- [`conduit-structures`](conduit-structures): Structures & Fuel: every corporation's structures on one board with fuel countdowns and burn from their online services, a fuel plan for topping up to N days, warnings at chosen thresholds, refuel claims and a dashboard widget.
- [`conduit-spycheck`](conduit-spycheck): Spy Check: a daily scan of members' wallets, contracts, mail, contacts and corporation history for contact with blacklisted or watched entities, with findings to acknowledge or dismiss and a digest for HR.
- [`conduit-capitals`](conduit-capitals): Capital Registry: who can fly and who owns each capital class, where the hulls are parked, jump skills, clones and fatigue, availability for ops, and group rules.
- [`conduit-finance`](conduit-finance): Corp Finance: corporation income and spending per month by category with internal transfers kept apart, balance history per wallet division, a printable monthly report and a CSV journal.
- [`conduit-blueprints`](conduit-blueprints): Blueprint Library: the corporations' BPOs and BPCs with ME/TE and location, members' shared originals, copy and loan requests with overdue reminders, and research gaps.
- [`conduit-pi`](conduit-pi): Planetary Industry: every colony of a member's characters with extractor countdowns, output and its value, expiry reminders, and a corporation view of products and idle colonies.
- How plugins hook into the core (events, notifications, per-user settings, search, group rules) is in
  [docs/platform.md](../docs/platform.md). The plugin contract is `conduit.plugins.Plugin` in
  `backend/conduit/plugins/base.py`; front ends use `definePlugin` from `@conduit/sdk`.
- Each plugin has its own log (Administration → Plugins → Logs) without any setup. Log with
  `logging.getLogger(__name__)` anywhere in the plugin's package; `INFO` and up are kept
  (`CONDUIT_PLUGIN_LOG_LEVEL`), next to its installs, updates and being switched on and off.

## Installing

- **From the website:** Administration → Plugins → Browse lists the official plugins. Tick the ones you want
  and install them together; each can update itself when a new version is published. On Windows and Linux the
  install's updater (the same one that installs EvE Conduit updates) starts within seconds, takes a backup first
  and puts things back if anything fails. On Docker the containers restart and install them into the `plugins`
  volume on the way up (`backend/conduit/plugins/docker_updater.py`), falling back to the previous plugins if
  pip fails. Plugins from other git repositories can be installed there too once the server owner sets
  `CONDUIT_PLUGIN_URLS=true` in the config file.
- **On the server:** add the package (PyPI name, git URL or path) to `requirements-plugins.txt` and rebuild for
  Docker, or run `conduit plugin install <package>` on bare metal and Windows. Then switch it on under
  Administration → Plugins. Plugins installed this way can't be removed from the website.

## Publishing (maintainers)

This folder is mirrored to [github.com/EvE-Conduit/plugins](https://github.com/EvE-Conduit/plugins), and that
repository is where installs get the catalog from.

1. Change a plugin here and bump its `version` in `pyproject.toml` (installs only update to a higher version).
   If it has a front end, run `npm run build` in its `frontend/` folder and commit the built bundle.
2. Describe it for the catalog in `[tool.conduit]` (name, icon, category, `min_conduit`, ESI scopes); see
   [`scripts/build_catalog.py`](scripts/build_catalog.py). `catalog = false` keeps a plugin out.
3. Commit, then run `scripts/publish-plugins.sh` from the main repository. It pushes this folder to the plugins
   repository and starts the main repository's
   [Plugin catalog workflow](https://github.com/EvE-Conduit/Eve-conduit/actions/workflows/plugin-catalog.yml),
   which builds `catalog.json` with every plugin pinned to that commit, signs it with the release key and
   publishes it on the `plugin-catalog` release. (It also runs hourly, so a missed start catches up.)
