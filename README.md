# EVECSM

A self-hosted platform for EVE Online corporations and alliances: EVE login, alt management and access control in a small core, with everything else added as modules.

- **Core:** EVE SSO login, linked characters, states (member / blue / guest), groups and permissions, a shared ESI client, EVE static data, a module system and a first-run setup wizard.
- **Groups:** open, request-to-join or managed groups; group leaders who approve requests; requirements; and smart groups whose members are kept up to date by rules (skills, corporation, SP, titles, compliance and more; modules can add rules).
- **Compliance:** who has every character registered with a working login and the scopes the site needs, plus corporation members nobody has registered.
- **Corporation sheet:** members and member tracking, structures (fuel and reinforcement alerts), wallets, assets, industry, contracts, market, mining, starbases and killmails, synced with a director's or role holder's login.
- **For everyone:** notifications with a bell and inbox, personal settings (dark/light theme, text size, high contrast, time zone), and Ctrl+K search across characters, members, corporations, items and systems.
- **For admins:** webhooks to Discord, Slack or any service, a health page, signing in as a member to help them, and maintenance mode. See [docs/platform.md](docs/platform.md) and [docs/security.md](docs/security.md).
- **Character sheet (core):** Overview, Skills, Wallet, Assets, Blueprints, Industry, Research, Mining, PI, Market, Contracts, Mail, Notifications, Calendar, Contacts, Standings, Loyalty Points, Fittings, Killmails and Intel, kept in sync from ESI in the background. Members also get account-wide Wallet and Assets pages.
- **Modules:** installable Python packages with an optional front-end bundle. They add pages, dashboard widgets, character-sheet tabs, API routes, background jobs and ESI scopes.

## Installing

There are two supported ways to run EVECSM:

- **Docker** (below): everything in containers, the same on any OS. Recommended if you're unsure.
- **Bare metal**: installed directly on Ubuntu, Debian or Rocky/Alma/RHEL with PostgreSQL or MariaDB,
  Supervisor and nginx, in the style of the Alliance Auth and SeAT manual installs. See
  [docs/install-baremetal.md](docs/install-baremetal.md). An install script automates it.

Releases are built with `scripts/build-release.sh`, which produces `dist/evecsm-X.Y.Z.tar.gz` with the front end prebuilt.

## Running it (Docker)

You need Docker with Compose and a domain pointing at the server.

1. Create an application at <https://developers.eveonline.com/applications> with the callback URL `https://<your-domain>/sso/callback`.
2. Configure and start the stack:
   ```sh
   cp .env.example .env      # fill in every value under "Required"
   docker compose up -d --build
   ```
3. Get the one-time setup code:
   ```sh
   docker compose logs web | grep "setup code"
   ```
4. Open the site, sign in with your main character and enter the code. The setup wizard then walks you through branding and modules.

Caddy obtains the HTTPS certificate for `EVECSM_DOMAIN` automatically. On first start the worker imports EVE's static data (about a minute). After that it checks daily for new game builds.

### Installing modules

Add the package to `requirements-modules.txt` (a PyPI name, git URL or local path), then run `docker compose up -d --build`. New modules appear switched off under **Administration → Modules**.

## Development

Backend (Python 3.12+):

```sh
cd backend
uv venv && uv pip install -e ".[dev]" -e ../modules/evecsm-example
export EVECSM_DEBUG=1 ESI_CLIENT_ID=... ESI_SECRET_KEY=... EVECSM_SITE_URL=http://localhost:5173
python manage.py migrate && python manage.py evecsm_init
python manage.py sde_update         # EVE static data (runs inline in dev)
python manage.py runserver          # http://127.0.0.1:8000
python -m pytest                    # tests
```

Without `REDIS_URL`, the backend uses an in-memory cache and runs Celery tasks inline, so there is nothing else to start. There's no scheduler in that mode, so run `python manage.py sync_characters [--character ID] [--section skills]` to pull character data on demand. For local EVE login, register a second EVE application with the callback `http://localhost:5173/sso/callback`.

Frontend (Node 22+):

```sh
cd frontend
npm install
npm run dev          # http://localhost:5173, proxies /api and /sso to :8000
npm run build        # type-check and production build
```

## How it fits together

```
backend/evecsm/
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
  modules/    module contract, discovery, enable/disable
  site/       branding, setup wizard, bootstrap API, health, impersonation, maintenance
  sso/        EVE login (OAuth2 + PKCE)
frontend/src/
  sdk/        @evecsm/sdk: what module front ends may import
  lib/        API client, module loader, runtime styles
  pages/      core pages and admin
modules/evecsm-example/   a complete module; copy it to start a new one
```

- **API:** Django Ninja under `/api/`. OpenAPI docs are at `/api/docs`.
- **External API:** `/api/v1/` for other services, using API keys with scopes. Admins switch each API (directory, character sheets, group/state membership, logs, module APIs) on and off separately. Every call is logged, and there is an audit log plus a service log under Administration > Logs. See [docs/external-api.md](docs/external-api.md).
- **Auth:** session cookies plus CSRF. The SPA and API share one origin behind Caddy.
- **Background jobs:** Celery with Redis. Beat refreshes affiliations every 30 minutes, queues due character-sheet syncs every 2 minutes, refreshes market prices hourly and checks for new static data daily.
- **Character sheet sections** register a `Section` (scopes, sync interval, `sync(character, esi)` function). The scheduler handles tokens, missing scopes, ESI back-off and retries with exponential delay. Sign-in asks for every scope EVE SSO offers (`evecsm/esi/scopes.py`, or `ESI_SCOPES` to narrow it), so members never have to re-authorise.
- **Who can see what:** owners always see their own characters. Grant `sheet.view_corporation_characters`, `sheet.view_alliance_characters` or `sheet.view_all_characters` (to a state or group) for leadership and recruiters.
- **ESI:** always go through `evecsm.esi.client.esi()`. It honours `Expires`/`ETag`, pauses before the error limit is hit, backs off on `429` per rate-limit group, and sends `X-Compatibility-Date` (`ESI_COMPATIBILITY_DATE`).

## Writing a module

Start from `modules/evecsm-example`. A module has two parts.

**Python:** a `Module` subclass registered under the `evecsm.modules` entry point:

```python
class SkillsModule(Module):
    id = "skills"                              # stable; used in URLs and the DB
    name = "Skills"
    version = "1.0.0"
    app = "evecsm_skills.apps.SkillsConfig"    # models, tasks, permissions
    api = "evecsm_skills.api:router"           # mounted at /api/m/skills/
    frontend = "evecsm_skills/module.js"       # static path of the built bundle
    esi_scopes = ("esi-skills.read_skills.v1",)
    nav = (NavItem("Skills", "", "graduation-cap"),)
    periodic_tasks = {"sync": {"task": "evecsm_skills.tasks.sync", "schedule": 3600}}
```

**Front end:** a bundle whose default export comes from `defineModule`:

```tsx
import { defineModule, Card } from "@evecsm/sdk";

export default defineModule({
  routes: [{ path: "", Component: SkillsPage }],               // /m/skills
  widgets: [{ id: "queue", title: "Skill queue", Component: QueueWidget }],
  characterTabs: [{ id: "skills", label: "Skills", Component: SkillsTab }],
});
```

Build it with the preset in `frontend/vite-module.ts` (see the example's `vite.config.ts`). React, React Router, React Query and `@evecsm/sdk` come from the site at runtime, so the bundle stays small and matches the site's look. Style with the same Tailwind classes the site uses. The bundle exports the classes it uses, and the site compiles one correctly ordered stylesheet covering itself and every module.

Modules also get the core's events, notifications, per-user settings, search providers and group rules: see [docs/platform.md](docs/platform.md).

When an admin disables a module, its menu entries, pages and widgets disappear and `/api/m/<id>/` returns 404.
