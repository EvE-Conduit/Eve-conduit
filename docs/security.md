# Security

What EvE Conduit does to protect an install, and what the operator should set.

## Before going live

| Setting | Why |
|---|---|
| `CONDUIT_SECRET_KEY`: 50+ random characters | Signs sessions and CSRF tokens. |
| `CONDUIT_TOKEN_KEY`: its own Fernet key | Encrypts stored EVE logins (refresh tokens). Without it a key is derived from the secret key, so one leaked value exposes both. The bare-metal installer sets it; for Docker, generate one (`python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"`). |
| No `CONDUIT_DEBUG` | Debug pages show source code and settings to visitors. |
| `CONDUIT_SITE_URL` on `https://` | Session and CSRF cookies are only marked Secure on HTTPS. |
| `CONDUIT_DJANGO_ADMIN=false`, or an IP allow-list in the proxy | The Django back-office is a second admin login surface. The nginx example has a commented allow-list. |

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
  code 5 attempts per 15 minutes, and after 30 failed API-key attempts in 10 minutes that address gets `429`.
  `CONDUIT_RATE_LIMITS=false` switches them off when the proxy already limits these paths.
- **Administrator permissions stay with administrators.** `site.manage_site`, `manage_access`, `manage_plugins`,
  `manage_api` and `impersonate_users` can't be put on a group that has leaders, is open to join, or is a smart
  group. Nobody but an access manager can add members to a group carrying them (not leaders, not self-service,
  not rules), and API keys can't change membership of groups or states carrying them.
- **Signing in as another user** never gives more power than the helper already has (see
  [platform.md](platform.md#signing-in-as-another-user)), and administration is read-only while doing it.
- **Webhooks** only reach public `https://` addresses, re-checked before each delivery; redirects aren't followed
  and replies aren't stored.
- **Notification links** must be site paths or `https://` URLs; bots need the extra `notify:links` scope for
  outside links, and people confirm before leaving the site.
- **Stored settings** (dashboard layout, plugin settings) are limited to 64 KB each.
- **Headers:** `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff` and a strict referrer policy from both
  Django and the bundled proxies.
- **Installing plugins from the website** goes through the same privileged updater as releases; the site itself
  can't change its code. Catalog plugins come from a catalog signed with the release key and are pinned to a
  commit; the updater checks the signature again and refuses a catalog older than one it already used. Plugins
  from other git URLs are only accepted when the server's own config file says `CONDUIT_PLUGIN_URLS=true`, because
  a plugin runs with the site's access to the database and members' tokens. Plugins installed on the server
  (`plugins.txt`, the Docker image) can't be removed or changed from the website.
- **Audit log** for every login, impersonation, membership, permission, key, webhook and plugin change.
- **External API keys** are stored hashed, can be limited to IP ranges and given an expiry, and every call is logged.
