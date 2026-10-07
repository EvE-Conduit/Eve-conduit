# Platform services

What the core offers every page and plugin besides login and access control. All of it is available to
plugins; the plugin contract (`conduit.plugins.Plugin`) lists the hooks.

## Events and webhooks

`conduit.events.bus` is an in-process event bus. Core code and plugins announce what happened; anything can
listen. Handlers run after the database transaction commits, and a failing handler is logged without
affecting the code that emitted the event.

```python
from conduit.events import bus

bus.register("fleets.created", "Fleet created", "A fleet was scheduled", plugin="fleets")  # shows in the webhook editor

@bus.on("group.joined")
def give_discord_role(event):
    event.payload["user_id"], event.payload["group"]

bus.emit("fleets.created", title="Sunday roam", summary="FC Pilot One, 19:00 ET", link="/p/fleets/12", level="info")
```

Payload values must be JSON. `title`, `summary`, `level` (`info`/`success`/`warning`/`danger`) and `link` are used
when an event is shown to people, e.g. in a Discord embed.

Core events: `user.created`, `user.state_changed`, `character.added`, `character.removed`,
`character.main_changed`, `token.invalid`, `group.joined`, `group.left` (both with `via`: `self`, `request`,
`admin`, `auto` or `state`), `group.request_created`, `group.request_decided`, `sync.failed`,
`compliance.changed`, `notification.created`. Plugins add their own.

**Administration → Integrations** sends chosen events (or all) to a URL:

- **Discord**: an embed per event, coloured by level.
- **Slack**: a text message.
- **JSON**: `{"event", "at", "data"}` with `X-Conduit-Event` and `X-Conduit-Signature: sha256=<hex>`, the
  HMAC-SHA256 of the raw body keyed with the webhook's secret. Verify it before trusting the body.

Failed deliveries (network errors, 429 and 5xx) are retried four times with growing delays. Every attempt is
listed under the webhook's history, with the status code only: replies are never stored.

Webhook URLs must be `https://` addresses on the public internet. Hosts that resolve to private, loopback,
link-local (cloud metadata) or reserved addresses are refused when the webhook is saved and again before every
delivery, and redirects are not followed. `CONDUIT_WEBHOOK_ALLOW_PRIVATE=true` lifts this for installs that
deliberately post to internal services.

## Notifications

```python
from conduit.notify import notify
from conduit.notify.services import notify_permission, register_category

register_category("p.fleets", "Fleet pings")
notify(user, "Fleet in 15 minutes", "Form up in Jita", link="/p/fleets/12", level="warning", category="p.fleets")
notify_permission("fleets.command", "New fleet scheduled", category="p.fleets")
```

`notify` takes a user, a user id, or a list of either. `link` must be a path on the site or an `https://` URL;
anything else (`javascript:`, `//host`, `http://`) is dropped. People are asked before a link takes them to
another site. People can mute categories in their settings
(`force=True` overrides that for things they must see). Notifications show under the bell in the top bar and
at `/notifications`, and each one also emits `notification.created`, so a webhook can forward them.

The external API offers the same to other services: see [external-api.md](external-api.md#sending-notifications).

## Preferences

Each user's theme (dark, light or system), density, text size, high contrast, reduced motion, time zone,
12/24-hour clock, muted notification categories and dashboard layout live in `accounts.UserPreferences`,
come down with `/api/core/bootstrap` and are applied as attributes on `<html>`.

Plugins get their own per-user settings slot, any JSON value:

```
GET /api/me/preferences/plugins/<plugin id>   -> {"value": ... | null}
PUT /api/me/preferences/plugins/<plugin id>   {"value": ...}
```

## Search

The Ctrl+K palette asks `GET /api/search?q=` and shows groups of results: characters the user may view,
members (with `site.view_members`), groups, corporations, alliances, solar systems and items. A plugin adds
providers by listing dotted paths in `Plugin.search`:

```python
class FleetsModule(Plugin):
    search = ("conduit_fleets.search:find",)

def find(request, q, limit):
    rows = Fleet.objects.visible_to(request.user).filter(name__icontains=q)[:limit]
    return {"key": "fleets", "label": "Fleets",
            "hits": [{"id": f"fleet:{f.pk}", "title": f.name, "subtitle": f.when, "icon": "rocket", "url": f"/p/fleets/{f.pk}"}
                     for f in rows]}
```

Only return what the user may see. A hit has an `image` URL or an `icon` (a Lucide icon name); `url` is a path
on the site or an `https://` URL.

## Members-only plugins

Plugins are for members unless they say otherwise. A member is anyone whose state isn't public (the Guest
fallback), plus administrators. Everyone else doesn't get the plugin's pages or bundle (it's left out of
`/api/core/bootstrap`), its web API answers `403`, its search results and `sheet_access` grants are skipped.
Helpers: `conduit.access.services.is_site_member(user)`, `site_members()` for querysets (e.g. who to notify), and
`conduit.plugins.services.can_use(user, plugin_id)`.

Plugins guests need, like Recruitment (applying) and Discord (gated by its own permission), opt out:

```python
class RecruitmentPlugin(Plugin):
    members_only = False
```

The external API (`/api/v1/p/<id>/`) isn't affected; API keys have their own scopes.

## Character sheet access

The core decides who may read a character's sheet (the owner, and holders of the `sheet.view_*` permissions). A
plugin can let more people in by listing functions in `Plugin.sheet_access`; they're asked only when the core says
no, and only while the plugin is enabled and the user may use it:

```python
class RecruitmentPlugin(Plugin):
    sheet_access = ("conduit_recruitment.services:recruiter_can_view",)

def recruiter_can_view(user, character) -> bool:
    return user.has_perm("recruit.review_applications") and has_open_application(character.user_id)
```

## Health

**Administration → Health** (`site.view_health`) checks the database and cache, asks the Celery workers to
answer, reads the queue length, and checks the scheduler's heartbeat (beat queues `core:heartbeat` every
minute; if no worker has run it for five minutes, something is stopped). It also shows the ESI error budget
and failure rate, character sync results, tokens needing a new login, static-data and price freshness,
errors logged in the last day and failing webhooks. The data is at `GET /api/admin/health`.

## Signing in as another user

Holders of `site.impersonate_users` can press **Sign in as** next to a member (Administration → Members) to
see the site exactly as that person does, for support. Only administrators may sign in as an administrator,
and anyone else may only sign in as people whose permissions they hold themselves, so it can never be used
to gain power. While signed in as someone else, nothing in Administration can be changed, setup and the
back-office are closed, and no characters can be linked.
A banner stays on screen with a button back to your own account; signing out also returns you. Starting and
stopping are both in the audit log.

## Maintenance mode

**Administration → Settings → Maintenance** switches the site into maintenance with an optional message.
People who can change site settings keep full access and see a banner; everyone else sees the message, and
the API answers `503 {"detail": <message>, "maintenance": true}`. Login, bootstrap and setup keep working.
