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
`character.main_changed`, `character.moved`, `user.merged` (an administrator moved every character of an
account into another; `from_user_id`, `to_user_id`, `records_moved`), `token.invalid`, `group.joined`, `group.left` (both with `via`: `self`, `request`,
`admin`, `auto` or `state`), `group.request_created`, `group.request_decided`, `sync.failed`,
`compliance.changed`, `notification.created`. Plugins add their own.

**Administration → Integrations** sends chosen events (or all) to a URL:

- **Discord**: an embed per event, coloured by level. A webhook can **ping**: `@here`, `@everyone` or a role,
  either on every message or only on events that ask for one (`ping: true` in the payload, e.g. a timer with
  *Ping Discord* on). An event may also name roles to ping itself (`mention_roles`: a list of role ids), used
  when it asks for a ping. Nothing else can ping: text people typed is never a mention.
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

Each user's theme (dark, light, system, or the named Sakura and Neo Tokyo themes), density, text size, high contrast, reduced motion, time zone,
12/24-hour clock, muted notification categories and dashboard layout live in `accounts.UserPreferences`,
come down with `/api/core/bootstrap` and are applied as attributes on `<html>`. A named theme sets
`data-skin` on top of its dark or light base `data-theme`; adding one means a `SKINS` entry in
`frontend/src/lib/preferences.ts` (and the first-paint map in `index.html`), its tokens in `theme.css`, a
`UserPreferences.Theme` choice plus migration, and a card in Settings.

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

## Compliance checks

A member is compliant when every character has a working login with the scopes the site needs. Plugins can ask for
more with `Plugin.compliance`, dotted paths to `fn(user) -> list[str]` (one string per problem, `[]` when all is
well). Problems show on Administration → Compliance, in the member's notification and in the Compliant group rule:

```python
class DiscordPlugin(Plugin):
    compliance = ("conduit_discord.services:compliance_problems",)

def compliance_problems(user):
    return [] if on_the_server(user) else ["Discord: not on the server (join it again on the Discord page)"]
```

Checks run every 30 minutes for every user, so read stored data; never call another service from them. A check that
raises is logged and ignored. To re-check one member straight away, queue `conduit.access.tasks.update_user_groups`.

## Merged accounts

Administrators can merge a member's second account into their main (Administration → Members → Move characters).
With "Also move their records", every row of every app that points at the old account through a foreign key to the
user is pointed at the main account, plugins included, with nothing for plugins to do. Rows that may only exist once
per member stay behind when the main account already has one: declare that with a one-to-one field, `unique=True`,
`unique_together` or a `UniqueConstraint` that includes the user field. Plugins that keep users in other forms
(ids in JSON, external accounts) can listen for `user.merged`.

## Landing page sections

Plugins can add sections to the landing page (`/home`), like dashboard widgets. Admins switch each one off or on
under Administration → Settings → Landing page → From plugins; new ones show until switched off.

```tsx
export default definePlugin({
  landingSections: [{ id: "bulletin", title: "Bulletin", Component: Bulletin, placement: "top", order: 10 }],
});

function Bulletin({ preview }: { preview: boolean }) { ... }
```

`placement` is `"top"` (under the hero and status strip) or `"bottom"` (after the page's own text sections).
`preview` is true in the landing page editor: show a placeholder when there's nothing yet, and don't change anything
(such as marking things read). Return `null` to show nothing. A section that crashes is left out, not the page.

## Group rules with changing choices

A rule parameter of type `choice` takes fixed `choices`, or a function returning them, for lists that change
(a plugin's skill plans or doctrine fits). It's called whenever the rule editor or validation needs the list:

```python
register_rule("skillplan_complete", "Completed skill plan", done, plugin="skillplans",
              params=(Param("plan", "choice", "Skill plan", choices=lambda: [(str(p.pk), p.name) for p in SkillPlan.objects.filter(shared=True)]),))
```

Plugin front ends can embed the rule editor (`RuleSetEditor` from `@conduit/sdk`). It reads rule types from the
admin API, so show it only to people with `site.manage_access`, and check that permission again in the plugin's API.

## Skills, ships and fittings

The static data import keeps, for every item, the skills it needs (`ItemType.required_skills`, direct requirements
as `[[skill_id, level], ...]`), and for ships, modules and subsystems their fitting data (`ItemType.fitting`: slots,
hardpoints, CPU, powergrid and calibration, and which slot a module goes in). See `conduit/sde/models.py`.
Reprocessing output is in `TypeMaterial` (per portion of `ItemType.portion_size` units, at 100 % yield), and ores and
ice point at their compressed variant with `ItemType.compressed_type_id` (one unit compresses into one unit).

`conduit.sheet.skills.training` does the skill maths for everyone:

```python
from conduit.sheet.skills import training

need = training.requirements_of_types([ship_id, *module_ids])     # {skill_id: level}
steps = training.plan(need.items())                                # [(skill_id, level), ...], prerequisites first
state = training.character_state([character.pk])[character.pk]   # trained levels, SP, attributes, skill queue
training.progress(steps, state, training.skill_info(s for s, _ in steps))  # done/queued/missing, SP and time left
training.format_text(steps)                                        # "Gunnery 1\nGunnery 2", for the in-game import
training.parse_text(pasted)                                        # back to steps, plus lines it couldn't read
```

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

## Public pages

A plugin can have pages anyone may open, signed in or not, like the Buyback plugin's public programs:

```python
class BuybackPlugin(Plugin):
    public_api = "conduit_buyback.public_api:router"  # /api/public/p/buyback/, no user check
    public_pages = True                                # its bundle loads for everyone
```

```tsx
export default definePlugin({
  routes: [...],                                        // members, inside the site
  publicRoutes: [{ path: ":id", Component: Program }],  // everyone, at /public/p/buyback/:id
});
```

Public pages sit in a plain frame with the site's name and a sign-in link, without the sidebar. Visitors who may
only use them (signed out, or not members of a members-only plugin) get `public_only: true` in
`/api/core/bootstrap` and only the plugin's `publicRoutes`; its widgets, tabs and other pages aren't loaded for them.
The public API is mounted only while the plugin is enabled, and its routes get no user check at all: decide in
each route what a stranger may see, don't let `request.user` make a stranger's request act in a member's name
(another site can send it from a member's browser), and rate-limit anything that writes.

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
