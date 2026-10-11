# Security

What EvE Conduit does to protect an install, and what the operator should set.

## Before going live

| Setting | Why |
|---|---|
| `CONDUIT_SECRET_KEY`: 50+ random characters | Signs sessions and CSRF tokens. |
| `CONDUIT_TOKEN_KEY`: its own Fernet key | Encrypts stored EVE logins (refresh tokens) and the EVE application's Secret Key when it was entered on the website. Without it a key is derived from the secret key, so one leaked value exposes both. The bare-metal installer sets it; for Docker, generate one (`python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"`). |
| No `CONDUIT_DEBUG` | Debug pages show source code and settings to visitors. |
| `CONDUIT_SITE_URL` on `https://` | Session and CSRF cookies are only marked Secure on HTTPS. |
| `CONDUIT_DJANGO_ADMIN=false`, or an IP allow-list in the proxy | The Django back-office is a second admin login surface. The nginx example has a commented allow-list. |
| `CONDUIT_TRUSTED_PROXIES` when your own proxy isn't on loopback | Comma-separated IPs/CIDRs of the reverse proxy whose `X-Forwarded-For` and `X-Forwarded-Proto` are believed; those headers from any other peer are dropped before anything reads them (rate limits, API-key IP allow-lists, the IPs in the audit, snooper and API logs, and whether a request counts as HTTPS). Default `127.0.0.0/8,::1/128`, which fits the bundled nginx and the Windows Caddy. Docker installs (`CONDUIT_INSTALL_KIND=docker`) with the variable unset also trust `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16` and `fd00::/8`, because Caddy is another container on the compose network and `web:8000` isn't published; set it explicitly if you publish the port or put another proxy in front. A set value replaces the default. The client address is the last hop the proxy appended. |

Administration → Health lists a warning for each of these, and so does `manage.py check --deploy`
(`conduit manage check --deploy` on Windows and Linux installs).

### Setting or changing the token key

Old tokens stay readable while you switch: EvE Conduit decrypts with the current key, any keys in
`CONDUIT_TOKEN_KEY_PREVIOUS`, and the key derived from the secret key. After restarting with the new key, run

```sh
python manage.py rotate_token_key          # Docker: docker compose exec web python manage.py rotate_token_key
```

to re-encrypt everything with it. Then the old key can be removed from `CONDUIT_TOKEN_KEY_PREVIOUS`.

## Built-in protections

- **Rate limits** (per IP, shared across processes via Redis): EVE login and callback 40 per 5 minutes, the setup
  code 5 attempts per 15 minutes, the Django back-office login 20 per 10 minutes, and after 30 failed API-key
  attempts in 10 minutes that address gets `429`. `CONDUIT_RATE_LIMITS=false` switches them off when the proxy
  already limits these paths.
- **The setup code is single use.** It is cleared the moment someone claims admin with it, and no new code is
  made once an administrator exists; further administrators are appointed under Administration. Non-ASCII input
  to the setup code or the SSO `state` is refused, not an error page. The Django back-office never shows the EVE
  application's secret or the setup code.
- **Administrator permissions stay with administrators.** `site.manage_site`, `manage_access`, `manage_plugins`,
  `manage_api` and `impersonate_users` can't be put on a group that has leaders, is open to join, or is a smart
  group, and not on a state at all (a state follows whichever character a member picks as their main; use a closed
  group). Nobody but an access manager can add members to a group carrying them (not leaders, not self-service,
  not rules). API keys can neither add to nor remove from groups or states carrying them, and can't change state
  membership in a way that would move an administrator to another state.
- **Signing in as another user** never gives more power than the helper already has (see
  [platform.md](platform.md#signing-in-as-another-user)). While doing it, administration, setup, the back-office,
  the group-leader API, joining and leaving groups, join requests, the account's characters and every plugin's
  admin routes are read-only, because leading a group isn't a permission and could otherwise be spent on the
  helper's behalf. Everything done meanwhile is audited as the helper, shown as "Helper (as Member)". If the
  helper's own account is disabled in the meantime, the session ends on the next request.
- **Webhooks** only reach public `https://` addresses, re-checked before each delivery. The delivery connects to
  the address that passed the check (no second DNS lookup, so a name that changes its answer gets nowhere) while
  the host name stays in the `Host` header and the TLS certificate check; redirects aren't followed and the reply
  body is never read, only its status. JSON webhook signing secrets are shown once, when the webhook is created or
  its secret is renewed; afterwards the site only says whether one exists.
- **Looking at members' data is recorded.** Opening another member's character sheet, and listing their mail,
  wallet, contracts or counterparties in Member Audit, goes in the snooper log; Member Audit searches go in the
  audit log whatever client sent them.
- **SeAT import** never stores EVE tokens: the import program leaves `refresh_token`, `access_token` and `token`
  columns out, the server drops them from any table even if an older program sends them, and the working folder
  (`CONDUIT_SEAT_IMPORT_DIR` or `<tmp>/conduit-seat-history`) and each run's file are readable by the app's user
  only (0700 / 0600) until the run ends and the file is deleted.
- **Accounts:** nobody, administrators included, can move characters into their own account; another
  administrator has to do it, and it is audited.
- **Notification links** must be site paths or `https://` URLs; bots need the extra `notify:links` scope for
  outside links, and people confirm before leaving the site.
- **Stored settings** (dashboard layout, plugin settings) are limited to 64 KB each.
- **Headers:** `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff` and a strict referrer policy from both
  Django and the bundled proxies. The bundled proxies (Docker Caddy, Windows Caddy, bare-metal nginx) also send
  `Strict-Transport-Security: max-age=31536000; includeSubDomains` over HTTPS, `Content-Security-Policy:
  frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'` (no `script-src`: the page
  carries an inline theme script and Vite's import map) and `Permissions-Policy: camera=(), microphone=(),
  geolocation=()`. Installs made before these were added keep their old proxy config until it is re-run or merged
  by hand.
- **Installing plugins from the website** goes through the same privileged updater as releases; the site itself
  can't change its code. Catalog plugins come from a catalog signed with the release key and are pinned to a
  commit; the updater checks the signature again and refuses a catalog older than one it already used. Plugins
  from other git URLs are only accepted when the server's own config file says `CONDUIT_PLUGIN_URLS=true`, because
  a plugin runs with the site's access to the database and members' tokens. Plugins installed on the server
  (`plugins.txt`, the Docker image) can't be removed or changed from the website. A plugin git URL's
  `#subdirectory=` must be a relative path inside the repository and its `@ref` may not start with `-`.
  Every pip run that installs plugins passes a constraints file pinning `conduit` to the installed version
  (Docker image build, the Docker plugins volume, `/opt/conduit/venv/pip-constraints.txt` on Linux,
  `<install root>\tmp\pip-constraints.txt` on Windows): plugins depend on `conduit` by name and PyPI has an
  unrelated package of that name, so a plugin needing a newer EvE Conduit fails with a dependency conflict rather
  than installing a stranger's package.
- **Docker: the plugins volume is checked on every start.** The web, worker and beat containers share the volume,
  so a compromised web container could write to `plugins-site.txt`. On start, a line is installed only when a
  signed plugin catalog pins it exactly (the current `updates/plugin-catalog.json` or a catalog kept under
  `updates/catalogs/` from an earlier install request) or it is a git URL and `CONDUIT_PLUGIN_URLS` is true in the
  container environment; anything else is skipped and noted in `<CONDUIT_PLUGINS_DIR>/updater.log`. Known
  limitation: the catalog's anti-rollback marker (`catalog-serial`) lives on the same volume, so a compromised web
  container could replay an older *signed* catalog (older plugin versions, never unsigned code).
- **The privileged updater never follows symlinks.** On Linux, `conduit apply-update` runs as root but exchanges
  files with the site through folders the service user owns (`/var/lib/conduit/updates`, `/var/log/conduit`).
  Every read and write there goes through `conduit.updates.safeio`: files are opened without following links, in
  a folder opened without following links, accepted only as plain singly-linked files, and replaced by rename. A
  planted link makes the updater refuse that request and note it in `updater.log`. On Windows the updater folder
  is protected by ACLs instead.
- **Releases never go backwards.** Administration → Updates refuses to request a version older than the running
  one, and the Linux and Windows updaters check again before copying anything (the same version is allowed, as a
  reinstall). `conduit rollback` is the way back to the previous release.
- **Audit log** for every login, impersonation, membership, permission, key, webhook and plugin change, including
  group removals caused by a state change or by merging accounts.
- **External API keys** are stored hashed, can be limited to IP ranges and given an expiry, and every call that
  presents a key is logged. Requests to `/api/v1/` with no key header at all are refused without a log row, so
  anonymous traffic can't grow the request log; failed keys are rate-limited per IP instead.
