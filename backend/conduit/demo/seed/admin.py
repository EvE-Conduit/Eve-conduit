"""The administration pages: a few weeks of audit and snooper history, service warnings, the demo account's
notifications, everyone's compliance, a day of ESI calls, API keys with their request log, and webhooks with
their deliveries."""

from datetime import timedelta

from conduit.access.models import ComplianceStatus
from conduit.audit.models import AuditEvent, ServiceLog, SnoopEvent
from conduit.esi.models import EsiCall
from conduit.events.models import Webhook, WebhookDelivery
from conduit.external.models import ApiArea, ApiKey, ApiRequest, hash_secret
from conduit.notify.models import Notification

# Documentation address ranges (RFC 5737), never anyone's real address.
IPS = tuple(f"203.0.113.{n}" for n in range(10, 60, 7)) + tuple(f"198.51.100.{n}" for n in range(20, 80, 11))
DAYS = 21


def seed(demo):
    keys = _api_keys(demo)
    hooks = _webhooks(demo)
    _audit(demo, keys, hooks)
    _snoops(demo)
    _service_log(demo)
    _notifications(demo)
    _compliance(demo)
    _esi_calls(demo)
    _api_requests(demo, keys)
    _deliveries(demo, hooks)


# --- audit ----------------------------------------------------------------------------


def _event(demo, at, action, summary, actor=None, target=None, target_type="", details=None):
    """``actor`` is a User (None: the system); ``target`` an instance whose type, id and name are copied."""
    name = actor.display_name if actor else "System"
    return AuditEvent(
        at=at, action=action, summary=f"{name} {summary}"[:400], actor_type="user" if actor else "system",
        actor_id=actor.pk if actor else None, actor_name=name, details=details or {},
        target_type=target_type or (target._meta.model_name if target is not None else ""),
        target_id=str(target.pk) if target is not None else "", target_name=str(target) if target is not None else "",
        ip=demo.pick(IPS) if actor else None,
    )


def _audit(demo, keys, hooks):
    admin, members = demo.admin, demo.users[1:]
    events = []
    # Sign-ins: the demo account most days, everyone else now and then.
    for user in demo.users:
        for _ in range(DAYS if user is admin else demo.rng.randint(2, 9)):
            char = demo.pick(demo.characters_of(user))
            events.append(_event(demo, demo.recent(DAYS), "auth.login", f"signed in with {char.name}", user, char))
            if demo.chance(0.15):
                events.append(_event(demo, demo.recent(DAYS), "auth.logout", "signed out", user))

    # New characters and mains.
    for user in demo.sample(members, 8):
        char = demo.pick(demo.characters_of(user))
        events.append(_event(demo, demo.recent(DAYS), "character.added", f"added character {char.name}", user, char,
                             details={"scopes": 74}))
    for user in demo.sample(members, 2):
        main = user.main_character
        events.append(_event(demo, demo.recent(DAYS), "character.main_changed", f"made {main.name} their main", user, main))

    # Groups: people joining open groups, requests and their decisions, admins adding people.
    for name, group in demo.groups.items():
        holders = list(group.user_set.all())
        for user in demo.sample([u for u in holders if u is not admin], 3):
            at = demo.recent(DAYS)
            if group.profile.join_mode == "open":
                events.append(_event(demo, at, "group.joined", f"joined {group.name}", user, group))
            elif group.profile.join_mode == "request":
                events.append(_event(demo, at - timedelta(hours=demo.rng.uniform(2, 30)), "group.request_created",
                                     f"asked to join {group.name}", user, group))
                events.append(_event(demo, at, "group.request_decided", f"approved {user.display_name}'s request to join {group.name}",
                                     admin, group, details={"approved": True, "response": "Welcome aboard, o7"}))
            elif group.profile.auto:
                events.append(_event(demo, at, "group.member_added", f"added {user.display_name} to {group.name} (meets the rules)",
                                     None, group, details={"user_id": user.pk, "user": user.display_name, "via": "auto"}))
            else:
                events.append(_event(demo, at, "group.member_added", f"added {user.display_name} to {group.name}", admin, group,
                                     details={"user_id": user.pk, "user": user.display_name, "via": "admin"}))
    rejected = demo.pick(members)
    events.append(_event(demo, demo.recent(10), "group.request_decided",
                         f"rejected {rejected.display_name}'s request to join Fleet Commanders", admin, demo.groups["Fleet Commanders"],
                         details={"approved": False, "response": "Fly a few more fleets with us first."}))
    capitals = demo.groups["Capital Pilots"]
    events.append(_event(demo, demo.recent(2), "group.evaluated", f"checked the rules of {capitals.name}: 2 added, 1 removed",
                         admin, capitals, details={"added": 2, "removed": 1}))

    # States, settings and the rest of the admin trail.
    blue = demo.states["blue"]
    events += [
        _event(demo, demo.ago(days=19), "state.member_added", f"added corporation {demo.blue_corporation.name} to state {blue.name}",
               admin, blue, details={"type": "corporation", "id": demo.blue_corporation.pk, "name": demo.blue_corporation.name}),
        _event(demo, demo.ago(days=18.5), "state.updated", f"changed state {blue.name} (color, description)", admin, blue),
        _event(demo, demo.ago(days=12), "site.settings_changed", "changed the site settings (site_name, theme)", admin,
               target_type="site", details={"site_name": "Northern Lights Coalition", "theme": "dark"}),
        _event(demo, demo.ago(days=6), "site.settings_changed", "changed the site settings (registration_message)", admin,
               target_type="site", details={"registration_message": "updated"}),
        _event(demo, demo.ago(days=3), "site.landing_changed", "changed the landing page", admin, target_type="site"),
        _event(demo, demo.ago(days=9), "member_audit.search", "searched member mail for \"spy\"", admin, target_type="member_audit",
               details={"q": "spy"}),
    ]
    for key in keys:
        events.append(_event(demo, key.created_at, "api.key_created", f"created API key {key.name} ({key.prefix})", admin, key,
                             details={"scopes": key.scopes, "allowed_ips": key.allowed_ips}))
        if key.revoked_at:
            events.append(_event(demo, key.revoked_at, "api.key_revoked", f"revoked API key {key.name} ({key.prefix})", admin, key))
    for hook in hooks:
        events.append(_event(demo, hook.created_at, "webhook.created", f"created webhook {hook.name}", admin, hook,
                             details={"kind": hook.kind, "events": hook.events}))
    events.sort(key=lambda e: e.at)  # newest last, so the newest has the highest id (the log sorts by id)
    AuditEvent.objects.bulk_create(events)


SECTIONS = ("sheet", "sheet", "wallet", "assets", "skills", "mail", "contacts", "contracts")


def _snoops(demo):
    viewers = [demo.admin] + list(demo.groups["Recruiters"].user_set.exclude(pk=demo.admin.pk)[:2])
    rows = []
    for _ in range(70):
        viewer = demo.pick(viewers)
        char = demo.pick([c for c in demo.characters if c.user_id != viewer.pk])
        rows.append(SnoopEvent(at=demo.recent(DAYS), viewer_id=viewer.pk, viewer_name=viewer.display_name, character_id=char.pk,
                               character_name=char.name, owner_id=char.user_id, owner_name=char.user.display_name,
                               section=demo.pick(SECTIONS), ip=demo.pick(IPS)))
    rows.sort(key=lambda r: r.at)
    SnoopEvent.objects.bulk_create(rows)


SERVICE_LOG = (
    ("WARNING", "conduit.esi.client", "ESI error limit low (18 left), pausing calls for 42s", ""),
    ("WARNING", "conduit.sheet.tasks", "Sync of {char} (mail) failed 3 times in a row: ESI answered 502", ""),
    ("ERROR", "conduit.esi.client", "GET /characters/{id}/assets/ failed after 3 attempts: 504 Gateway Timeout", ""),
    ("WARNING", "conduit.corp.tasks", "Starbases of Aurora Industries: ESI answered 502 Bad Gateway", ""),
    ("WARNING", "conduit.esi.tokens", "Token of {char} was refused (invalid_grant): needs a new login", ""),
    ("ERROR", "conduit.events.webhooks", "Webhook Audit sink: delivery failed (HTTP 500)",
     "Traceback (most recent call last):\n  File \"conduit/events/webhooks.py\", line 88, in deliver\n"
     "    response.raise_for_status()\nhttpx.HTTPStatusError: Server error '500 Internal Server Error'"),
    ("WARNING", "django.request", "Not Found: /wp-login.php", ""),
    ("WARNING", "conduit.eve.tasks", "Market prices: ESI answered 503, keeping yesterday's", ""),
)


def _service_log(demo):
    rows = []
    for level, logger, message, traceback in SERVICE_LOG:
        char = demo.pick(demo.characters)
        rows.append(ServiceLog(at=demo.recent(10), level=level, logger=logger, plugin="",
                               message=message.format(char=char.name, id=char.pk), traceback=traceback))
    rows.sort(key=lambda r: r.at)
    ServiceLog.objects.bulk_create(rows)


def _notifications(demo):
    corp = demo.corporations[0]
    forge, waystation = demo.structures[0]["name"], "Dodixie - Aurora Waystation"
    requester = demo.pick(demo.users[1:])
    lost = demo.characters_of(demo.admin)[-1]
    # hours ago, level, category, title, body, link
    items = (
        (0.3, "danger", "corp.structures", f"{waystation} was reinforced", "Now armor reinforce, timer ends in about 31 hours.",
         f"/corporations/{corp.pk}?tab=structures"),
        (2, "warning", "corp.structures", f"{forge} is low on fuel", "About 43 hours of fuel left.", f"/corporations/{corp.pk}?tab=structures"),
        (5, "info", "groups", f"{requester.display_name} asked to join Fleet Commanders", "Ran the Sunday roams in my old corp.", "/groups/manage"),
        (20, "success", "groups", "You've been added to Capital Pilots", "You now meet the rules for this group.", "/groups"),
        (30, "warning", "tokens", f"{lost.name} needs to log in again", "Its ESI login stopped working. Log in with it again to keep it up to date.",
         "/characters"),
        (52, "warning", "admin", "Webhook Audit sink keeps failing", "The last 3 deliveries got HTTP 500. Check the receiving service.",
         "/admin/integrations"),
        (75, "warning", "compliance", "Some of your characters need attention", f"{lost.name}: needs to log in again", "/characters"),
        (96, "info", "system", "Welcome to the Northern Lights Coalition", "Have a look around: every page has example data.", "/"),
        (335, "info", "admin", "New API key: Fleet pings", "Created with the notify:write scope.", "/admin/integrations"),
        (170, "success", "groups", "Your request to join Logistics Wing was approved", "Welcome aboard, o7", "/groups"),
        (240, "info", "system", "Alliance tier-3 roam on Saturday", "Form up in Rens at 19:00 ET. Bring your doctrine Hurricanes.", ""),
        (320, "warning", "corp.structures", f"{forge} is low on fuel", "About 60 hours of fuel left.", f"/corporations/{corp.pk}?tab=structures"),
    )
    rows = [
        Notification(user=demo.admin, created_at=demo.ago(hours=h), level=level, category=category, title=title, body=body, link=link,
                     read_at=None if h < 24 else demo.ago(hours=h - demo.rng.uniform(0.5, 10)))
        for h, level, category, title, body, link in sorted(items, key=lambda i: -i[0])
    ]
    Notification.objects.bulk_create(rows)


def _compliance(demo):
    from conduit.access.compliance import check_user

    rows = []
    for user in demo.users:
        result = check_user(user)
        checked = demo.ago(minutes=demo.rng.uniform(5, 50))
        rows.append(ComplianceStatus(user=user, compliant=result["compliant"], problems=result["problems"], warnings=result["warnings"],
                                     checked_at=checked, changed_at=checked - timedelta(days=demo.rng.uniform(0, 30))))
    ComplianceStatus.objects.bulk_create(rows)


# --- ESI, the API and webhooks --------------------------------------------------------

# route, source, rate-limit group, weight
ROUTES = (
    ("/characters/{character_id}/wallet/journal/", "sheet:wallet", "char-wallet", 8),
    ("/characters/{character_id}/assets/", "sheet:assets", "char-asset", 6),
    ("/characters/{character_id}/skills/", "sheet:skills", "char-detail", 8),
    ("/characters/{character_id}/skillqueue/", "sheet:skills", "char-detail", 8),
    ("/characters/{character_id}/mail/", "sheet:mail", "char-social", 5),
    ("/characters/{character_id}/location/", "sheet:location", "char-location", 10),
    ("/characters/{character_id}/killmails/recent/", "sheet:killmails", "char-killmail", 3),
    ("/characters/{character_id}/industry/jobs/", "sheet:industry", "char-industry", 4),
    ("/characters/affiliation/", "eve.update_affiliations", "", 3),
    ("/universe/names/", "eve.ensure_names", "", 2),
    ("/corporations/{corporation_id}/members/", "corp:members", "corp-member", 2),
    ("/corporations/{corporation_id}/structures/", "corp:structures", "corp-structure", 2),
    ("/corporations/{corporation_id}/wallets/{division}/journal/", "corp:wallets", "corp-wallet", 2),
    ("/corporations/{corporation_id}/starbases/", "corp:starbases", "corp-detail", 1),
    ("/markets/prices/", "eve.update_prices", "", 1),
)
ERRORS = ((502, "Bad Gateway"), (504, "Gateway Timeout"), (403, "Forbidden: token is not valid for scope"), (404, "Not found"))


def _esi_calls(demo):
    weights = [r[3] for r in ROUTES]
    corp_ids = [c.pk for c in demo.corporations]
    rows = []
    for _ in range(900):
        route, source, group, _ = demo.rng.choices(ROUTES, weights=weights)[0]
        char = demo.pick(demo.characters)
        path = route.format(character_id=char.pk, corporation_id=demo.pick(corp_ids), division=demo.rng.randint(1, 7))
        roll = demo.rng.random()
        outcome, status, error = ("ok", 200, "") if roll < 0.62 else ("not_modified", 304, "") if roll < 0.93 else (None, None, "")
        if outcome is None:
            if roll < 0.985:
                status, error = demo.pick(ERRORS)
                outcome = "error"
            elif roll < 0.995:
                outcome, status, error = "rate_limited", 429, "Too many requests"
            else:
                outcome, status, error = "paused", None, "Not sent: backing off after errors"
        rows.append(EsiCall(
            at=demo.recent(1), method="POST" if route.endswith(("affiliation/", "names/")) else "GET", route=route, path=path,
            query="page=1" if "assets" in route or "journal" in route else "",
            character_id=None if route.startswith(("/universe", "/markets", "/characters/affiliation")) else char.pk,
            source=source, outcome=outcome, status=status,
            duration_ms=0 if outcome == "paused" else int(demo.rng.lognormvariate(5, 0.6)), error=error,
            error_limit_remain=demo.rng.randint(60, 100) if status and status >= 400 else 100,
            ratelimit_group=group, ratelimit_remaining=demo.rng.randint(0 if outcome == "rate_limited" else 40, 150) if group else None,
        ))
    rows.sort(key=lambda r: r.at)
    EsiCall.objects.bulk_create(rows)


KEYS = (
    # name, description, scopes, allowed ips, days ago, revoked days ago
    ("Discord bot", "Syncs Discord roles from groups and states", ["directory:read"], [], 60, None),
    ("Recruitment tool", "Adds new members to their groups after the interview", ["directory:read", "groups:write"], ["203.0.113.0/24"], 33, None),
    ("Fleet pings", "Sends fleet pings from the formup channel", ["notify:write"], [], 14, None),
    ("Old killboard importer", "Replaced by the corporation sheet", ["sheet:killmails"], [], 120, 40),
)


def _api_keys(demo):
    ApiArea.objects.bulk_create([ApiArea(key=k, enabled=True) for k in ("directory", "groups", "notify")], ignore_conflicts=True)
    keys = []
    for n, (name, description, scopes, ips, days, revoked) in enumerate(KEYS, 1):
        prefix = f"evk_demo{n:04d}"
        keys.append(ApiKey(
            name=name, description=description, prefix=prefix, secret_hash=hash_secret(f"{prefix}_demo-key-not-a-real-secret"),
            scopes=scopes, allowed_ips=ips, created_at=demo.ago(days=days), created_by=demo.admin,
            last_used_at=demo.ago(days=revoked + 1) if revoked else demo.recent(0.05), last_used_ip=demo.pick(IPS),
            revoked_at=demo.ago(days=revoked) if revoked else None,
        ))
    return ApiKey.objects.bulk_create(keys)


# key name -> [(method, path, area)]
CALLS = {
    "Discord bot": [("GET", "/api/v1/users", "directory"), ("GET", "/api/v1/groups", "directory"), ("GET", "/api/v1/states", "directory"),
                    ("GET", "/api/v1/characters", "directory")],
    "Recruitment tool": [("GET", "/api/v1/users", "directory"), ("PUT", "/api/v1/groups/{group}/members/{user}", "groups")],
    "Fleet pings": [("POST", "/api/v1/notifications", "notify")],
}


def _api_requests(demo, keys):
    by_name = {k.name: k for k in keys}
    group_ids = [g.pk for g in demo.groups.values()]
    rows = []
    for _ in range(260):
        name = demo.rng.choices(list(CALLS), weights=[8, 2, 1])[0]
        key = by_name[name]
        method, path, area = demo.pick(CALLS[name])
        status = demo.rng.choices([200, 403, 404, 429], weights=[94, 2, 2, 2])[0]
        rows.append(ApiRequest(
            at=demo.recent(1), key=key, key_prefix=key.prefix, method=method,
            path=path.format(group=demo.pick(group_ids), user=demo.pick(demo.users).pk), query="page=1" if method == "GET" else "",
            status=status, duration_ms=int(demo.rng.lognormvariate(3.5, 0.5)),
            ip=(key.allowed_ips and "203.0.113.24") or demo.pick(IPS[:3]), user_agent=f"{name.lower().replace(' ', '-')}/1.4", area=area,
        ))
    # Someone trying the revoked key.
    old = by_name["Old killboard importer"]
    rows += [ApiRequest(at=demo.recent(1), key=old, key_prefix=old.prefix, method="GET", path="/api/v1/characters/1/sheet/killmails",
                        status=401, duration_ms=3, ip="198.51.100.77", user_agent="python-httpx/0.27", area="sheet") for _ in range(3)]
    rows.sort(key=lambda r: r.at)
    ApiRequest.objects.bulk_create(rows)


HOOKS = (
    # name, kind, url, events, mention, days ago, failing
    ("Discord #structure-alerts", "discord", "https://discord.example/api/webhooks/demo/structures",
     ["corp.structure_fuel_low", "corp.structure_reinforced", "corp.structure_state_changed"], "here", 50, False),
    ("Discord #hr", "discord", "https://discord.example/api/webhooks/demo/hr",
     ["user.created", "user.state_changed", "group.request_created", "compliance.changed", "token.invalid"], "", 45, False),
    ("Audit sink", "json", "https://hooks.example/conduit/demo", [], "", 20, True),
)


def _webhooks(demo):
    hooks = [
        Webhook(name=name, kind=kind, url=url, events=events, secret="demo-webhook-secret-not-real", mention=mention,
                created_at=demo.ago(days=days), last_status=500 if failing else 204,
                last_error="HTTP 500 Internal Server Error" if failing else "", last_delivery_at=demo.recent(0.2),
                failures=3 if failing else 0)
        for name, kind, url, events, mention, days, failing in HOOKS
    ]
    return Webhook.objects.bulk_create(hooks)


DEFAULT_EVENTS = ("user.state_changed", "group.joined", "group.left", "character.added", "token.invalid", "compliance.changed")


def _deliveries(demo, hooks):
    rows = []
    for hook in hooks:
        failing = bool(hook.failures)
        for _ in range(25):
            ok = demo.chance(0.6 if failing else 0.97)
            status = 204 if ok and hook.kind == "discord" else 200 if ok else demo.pick((500, 502, 429))
            rows.append(WebhookDelivery(webhook=hook, at=demo.recent(7), event=demo.pick(hook.events or DEFAULT_EVENTS), status=status,
                                        ok=ok, error="" if ok else f"HTTP {status}", duration_ms=int(demo.rng.uniform(80, 900)),
                                        attempt=1 if ok else demo.rng.randint(1, 3)))
    rows.sort(key=lambda r: r.at)
    WebhookDelivery.objects.bulk_create(rows)
