# EvE Conduit

A self-hosted platform for EVE Online corporations and alliances: EVE login, alt management and access control in a small core, with everything else added as plugins.

- **Core:** EVE SSO login, linked characters, states (member / blue / guest), groups and permissions, a shared ESI client, EVE static data, a plugin system and a first-run setup wizard.
- **Groups:** open, request-to-join or managed groups; group leaders who approve requests; requirements; and smart groups whose members are kept up to date by rules (skills, corporation, SP, titles, compliance and more; plugins can add rules).
- **Compliance:** who has every character registered with a working login and the scopes the site needs, plus corporation members nobody has registered.
- **Corporation sheet:** members and member tracking, structures (fuel and reinforcement alerts), wallets, assets, industry, contracts, market, mining, starbases and killmails, synced with a director's or role holder's login.
- **For everyone:** notifications with a bell and inbox, personal settings (dark/light theme, text size, high contrast, time zone), and Ctrl+K search across characters, members, corporations, items and systems.
- **For admins:** webhooks to Discord, Slack or any service, a health page, signing in as a member to help them, and maintenance mode. See [docs/platform.md](docs/platform.md) and [docs/security.md](docs/security.md).
- **Character sheet (core):** Overview, Skills, Wallet, Assets, Blueprints, Industry, Research, Mining, PI, Market, Contracts, Mail, Notifications, Calendar, Contacts, Standings, Loyalty Points, Fittings, Killmails and Intel, kept in sync from ESI in the background. Members also get account-wide Wallet and Assets pages.
- **Plugins:** installable Python packages with an optional front-end bundle. They add pages, dashboard widgets, character-sheet tabs, API routes, background jobs and ESI scopes.

## Installing

Three ways to run EvE Conduit, each with its own step-by-step guide written for someone doing this for the
first time:

| Guide | Best for |
|---|---|
| [Docker](docs/install-docker.md) | Any Linux server, and Windows PCs with Docker Desktop. Everything in containers; the same on every OS. **Recommended if you're unsure.** |
| [Linux without Docker](docs/install-linux.md) | Ubuntu, Debian or Rocky/Alma/RHEL with PostgreSQL or MariaDB, Supervisor and nginx, in the style of the Alliance Auth and SeAT manual installs. An install script does it all. |
| [Windows](docs/install-windows.md) | Windows 10/11 or Windows Server as Windows services, with no Docker or WSL, from a setup wizard. Experimental. |

Whichever you choose, you need a domain name pointing at the machine (or a fixed public IP address; see
[docs/dns.md](docs/dns.md) if you have never set up a DNS record), ports 80 and 443 open, and an EVE application registered at <https://developers.eveonline.com/applications>.
The first person to sign in and enter the one-time setup code becomes the administrator; a wizard then
walks them through branding and plugins.

Plugins are installed from **Administration → Plugins → Browse** on Linux and Windows installs, and by
adding a line to `requirements-plugins.txt` and rebuilding on Docker; see [plugins/README.md](plugins/README.md).

## Updating

New versions are published as [GitHub releases](https://github.com/EvE-Conduit/Eve-conduit/releases), with
what changed in [CHANGELOG.md](CHANGELOG.md). Each install checks once a day and tells its administrators;
**Administration → Updates** shows the changelog and asks before downloading and again before installing.

- **Windows and Linux installs** install the update themselves: a small updater (a SYSTEM scheduled task on
  Windows, a root systemd path unit on Linux, with a cron job as backup) starts within seconds of the click,
  checks the release's signature, backs up, upgrades and rolls back if anything fails. Nothing happens until an
  administrator clicks Install.
- **Docker installs** show the commands to run (`git pull` and `docker compose up -d --build`).
- Releases are signed: `SHA256SUMS` is signed with the project's Ed25519 key, whose public half is built into
  EvE Conduit (`backend/conduit/updates/keys.py`). A release that doesn't match is refused.

Releases are built with `scripts/build-release.sh` (the Linux tarball, front end prebuilt) and
`windows/build-release.sh` (the Windows zip); pushing a `vX.Y.Z` tag publishes them.

## Development

Backend (Python 3.12+):

```sh
cd backend
uv venv && uv pip install -e ".[dev]" -e ../plugins/conduit-example
export CONDUIT_DEBUG=1 ESI_CLIENT_ID=... ESI_SECRET_KEY=... CONDUIT_SITE_URL=http://localhost:5173
python manage.py migrate && python manage.py conduit_init
python manage.py sde_update         # EVE static data (runs inline in dev)
python manage.py runserver          # http://127.0.0.1:8000
python -m pytest                    # tests
```

Without `REDIS_URL`, the backend uses an in-memory cache and runs Celery tasks inline, so there is nothing else to start. There's no scheduler in that mode, so run `python manage.py sync_characters [--character ID] [--section skills]` to pull character data on demand. For local EVE login, register a second EVE application with the callback `http://localhost:5173/sso/callback`.

Frontend (Node 24+):

```sh
cd frontend
npm install
npm run dev          # http://localhost:5173, proxies /api and /sso to :8000
npm run build        # type-check and production build
```

## How it fits together

```
backend/conduit/
  accounts/   users, characters, encrypted SSO tokens
  access/     states, groups, leaders, requests, rules and smart groups, compliance
  esi/        ESI client (cache, ETag, error and rate limits) and token refresh
  eve/        corporations, alliances, names, market prices, affiliation sync
  sde/        CCP's Static Data Export: items, groups, map, stations, skills
  corp/       corporation sheet (sections synced with role holders' logins)
  events/     event bus and webhooks
  notify/     notifications
  search/     global search and its providers
  sheet/      character sheet framework (sections, scheduler, locations, access)
    <section>/  one app per section: models, sync.py, api.py
  plugins/    plugin contract, discovery, enable/disable
  site/       branding, setup wizard, bootstrap API, health, impersonation, maintenance
  sso/        EVE login (OAuth2 + PKCE)
frontend/src/
  sdk/        @conduit/sdk: what plugin front ends may import
  lib/        API client, plugin loader, runtime styles
  pages/      core pages and admin
plugins/conduit-example/   a complete plugin; copy it to start a new one
```

- **API:** Django Ninja under `/api/`. OpenAPI docs are at `/api/docs`.
- **External API:** `/api/v1/` for other services, using API keys with scopes. Admins switch each API (directory, character sheets, group/state membership, logs, plugin APIs) on and off separately. Every call is logged, and there is an audit log plus a service log under Administration > Logs. See [docs/external-api.md](docs/external-api.md).
- **Auth:** session cookies plus CSRF. The SPA and API share one origin behind Caddy.
- **Background jobs:** Celery with Redis. Beat refreshes affiliations every 30 minutes, queues due character-sheet syncs every 2 minutes, refreshes market prices hourly and checks for new static data daily.
- **Character sheet sections** register a `Section` (scopes, sync interval, `sync(character, esi)` function). The scheduler handles tokens, missing scopes, ESI back-off and retries with exponential delay. Sign-in asks for every scope EVE SSO offers (`conduit/esi/scopes.py`, or `ESI_SCOPES` to narrow it), so members never have to re-authorise.
- **Who can see what:** owners always see their own characters. Grant `sheet.view_corporation_characters`, `sheet.view_alliance_characters` or `sheet.view_all_characters` (to a state or group) for leadership and recruiters.
- **ESI:** always go through `conduit.esi.client.esi()`. It honours `Expires`/`ETag`, pauses before the error limit is hit, backs off on `429` per rate-limit group, and sends `X-Compatibility-Date` (`ESI_COMPATIBILITY_DATE`).

## Writing a plugin

Start from `plugins/conduit-example`. Official plugins live in [`plugins/`](plugins/), which is published to
[github.com/EvE-Conduit/plugins](https://github.com/EvE-Conduit/plugins) with a signed catalog; see
[plugins/README.md](plugins/README.md). A plugin has two parts.

**Python:** a `Plugin` subclass registered under the `conduit.plugins` entry point:

```python
class SkillsModule(Plugin):
    id = "skills"                              # stable; used in URLs and the DB
    name = "Skills"
    version = "1.0.0"
    app = "conduit_skills.apps.SkillsConfig"    # models, tasks, permissions
    api = "conduit_skills.api:router"           # mounted at /api/p/skills/
    frontend = "conduit_skills/plugin.js"       # static path of the built bundle
    esi_scopes = ("esi-skills.read_skills.v1",)
    nav = (NavItem("Skills", "", "graduation-cap"),)
    periodic_tasks = {"sync": {"task": "conduit_skills.tasks.sync", "schedule": 3600}}
```

**Front end:** a bundle whose default export comes from `definePlugin`:

```tsx
import { definePlugin, Card } from "@conduit/sdk";

export default definePlugin({
  routes: [{ path: "", Component: SkillsPage }],               // /p/skills
  widgets: [{ id: "queue", title: "Skill queue", Component: QueueWidget }],
  characterTabs: [{ id: "skills", label: "Skills", Component: SkillsTab }],
});
```

Build it with the preset in `frontend/vite-conduit-plugin.ts` (see the example's `vite.config.ts`). React, React Router, React Query and `@conduit/sdk` come from the site at runtime, so the bundle stays small and matches the site's look. Style with the same Tailwind classes the site uses. The bundle exports the classes it uses, and the site compiles one correctly ordered stylesheet covering itself and every plugin.

Plugins also get the core's events, notifications, per-user settings, search providers and group rules: see [docs/platform.md](docs/platform.md).

When an admin disables a plugin, its menu entries, pages and widgets disappear and `/api/p/<id>/` returns 404.
