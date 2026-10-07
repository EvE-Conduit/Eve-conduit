"""Rules that decide group requirements and smart-group membership.

A rule set is stored as JSON::

    {"match": "all", "rules": [
        {"type": "skill", "params": {"skill": 3300, "level": 4, "scope": "any"}},
        {"type": "main_corporation", "params": {"corporations": [98000001]}, "negate": true},
    ]}

An empty rule set always passes. Plugins add rule types with ``register_rule`` (from the files
listed in ``Plugin.group_rules``)::

    from conduit.access.rules import Param, register_rule

    register_rule(
        "fleet_count", "Attended fleets", lambda user, p: fleets_of(user) >= p["count"],
        params=(Param("count", "int", "At least", min=1),),
        explain=lambda p: f"Attended at least {p['count']} fleets",
    )
"""

from __future__ import annotations

import importlib
import logging
from collections.abc import Callable, Iterable
from dataclasses import dataclass, field
from datetime import timedelta

from django.utils import timezone

log = logging.getLogger(__name__)

PARAM_TYPES = {"int", "str", "bool", "choice", "state", "group", "skill", "corporation", "alliance", "ship", "ship_group", "item"}


@dataclass(frozen=True)
class Param:
    name: str
    #: int | str | bool | choice | state | group | skill | corporation | alliance | ship | ship_group | item
    type: str
    label: str
    multiple: bool = False
    #: ``((value, label), ...)``, or a function returning them, for choices that change (e.g. a plugin's skill plans).
    choices: tuple[tuple[str, str], ...] | Callable[[], Iterable[tuple[str, str]]] = ()
    default: object = None
    min: int | None = None
    max: int | None = None
    help: str = ""

    def options(self) -> list[tuple[str, str]]:
        return [(str(v), lbl) for v, lbl in (self.choices() if callable(self.choices) else self.choices)]

    def spec(self) -> dict:
        return {
            "name": self.name,
            "type": self.type,
            "label": self.label,
            "multiple": self.multiple,
            "choices": [{"value": v, "label": lbl} for v, lbl in self.options()],
            "default": self.default,
            "min": self.min,
            "max": self.max,
            "help": self.help,
        }


@dataclass(frozen=True)
class RuleType:
    key: str
    label: str
    evaluate: Callable[[object, dict], bool]
    params: tuple[Param, ...] = ()
    description: str = ""
    #: ``explain(params) -> str``: the requirement in words, e.g. "Gunnery at level 4 or higher".
    explain: Callable[[dict], str] | None = None
    plugin: str | None = None
    category: str = "General"

    def spec(self) -> dict:
        return {
            "key": self.key,
            "label": self.label,
            "description": self.description,
            "category": self.category,
            "plugin": self.plugin,
            "params": [p.spec() for p in self.params],
        }


RULE_TYPES: dict[str, RuleType] = {}


def register_rule(key: str, label: str, evaluate: Callable, *, params=(), description: str = "",
                  explain: Callable | None = None, plugin: str | None = None, category: str = "Plugins") -> RuleType:
    for p in params:
        if p.type not in PARAM_TYPES:
            raise ValueError(f"rule {key}: unknown parameter type {p.type!r}")
    RULE_TYPES[key] = RuleType(key, label, evaluate, tuple(params), description, explain, plugin, category)
    return RULE_TYPES[key]


# --- validating and evaluating -------------------------------------------------------


class RuleError(ValueError):
    pass


def _clean_param(rule: str, p: Param, value):
    if value is None or value == "" or value == []:
        if p.default is not None:
            return p.default
        raise RuleError(f"{rule}: {p.label} is required")
    if p.multiple:
        if not isinstance(value, list):
            value = [value]
        return [_clean_one(rule, p, v) for v in value]
    return _clean_one(rule, p, value)


def _clean_one(rule: str, p: Param, value):
    if p.type in {"int", "state", "group", "skill", "corporation", "alliance", "ship", "ship_group", "item"}:
        try:
            value = int(value)
        except (TypeError, ValueError):
            raise RuleError(f"{rule}: {p.label} must be a number") from None
        if p.min is not None and value < p.min:
            raise RuleError(f"{rule}: {p.label} must be at least {p.min}")
        if p.max is not None and value > p.max:
            raise RuleError(f"{rule}: {p.label} must be at most {p.max}")
        return value
    if p.type == "bool":
        return bool(value)
    if p.type == "choice":
        options = p.options()
        if str(value) not in {c for c, _ in options}:
            raise RuleError(f"{rule}: {p.label} must be one of {', '.join(lbl for _, lbl in options) or 'nothing yet'}")
        return str(value)
    return str(value)[:200]


def validate_ruleset(data) -> dict:
    """Normalise a rule set from the API, raising ``RuleError`` with a readable message."""
    if not data:
        return {}
    if not isinstance(data, dict):
        raise RuleError("a rule set must be an object")
    match = data.get("match", "all")
    if match not in ("all", "any"):
        raise RuleError("match must be all or any")
    rules = []
    for raw in data.get("rules") or []:
        if not isinstance(raw, dict):
            raise RuleError("each rule must be an object")
        rtype = RULE_TYPES.get(raw.get("type"))
        if rtype is None:
            raise RuleError(f"unknown rule type {raw.get('type')!r}")
        given = raw.get("params") or {}
        params = {p.name: _clean_param(rtype.label, p, given.get(p.name)) for p in rtype.params}
        rules.append({"type": rtype.key, "params": params, "negate": bool(raw.get("negate", False))})
    return {"match": match, "rules": rules} if rules else {}


def _evaluate_rule(user, rule: dict) -> bool:
    rtype = RULE_TYPES.get(rule.get("type"))
    if rtype is None:
        log.warning("Unknown group rule type %s (plugin removed?); treating it as failed", rule.get("type"))
        return False
    try:
        result = bool(rtype.evaluate(user, rule.get("params") or {}))
    except Exception:
        log.exception("Group rule %s failed for user %s", rtype.key, user.pk)
        return False
    return not result if rule.get("negate") else result


def evaluate_ruleset(user, ruleset: dict | None) -> bool:
    rules = (ruleset or {}).get("rules") or []
    if not rules:
        return True
    results = (_evaluate_rule(user, r) for r in rules)
    return any(results) if ruleset.get("match") == "any" else all(results)


def explain_rule(rule: dict) -> str:
    rtype = RULE_TYPES.get(rule.get("type"))
    if rtype is None:
        return f"Unknown rule {rule.get('type')}"
    try:
        text = rtype.explain(rule.get("params") or {}) if rtype.explain else rtype.label
    except Exception:
        text = rtype.label
    return f"Not: {text[0].lower()}{text[1:]}" if rule.get("negate") else text


def check_ruleset(user, ruleset: dict | None) -> list[dict]:
    """Each rule in words with whether the user passes it, for checklists in the UI."""
    return [{"text": explain_rule(r), "ok": _evaluate_rule(user, r)} for r in (ruleset or {}).get("rules") or []]


def describe_ruleset(ruleset: dict | None) -> str:
    rules = (ruleset or {}).get("rules") or []
    joiner = " or " if (ruleset or {}).get("match") == "any" else " and "
    return joiner.join(explain_rule(r) for r in rules)


# --- helpers for built-in rules ------------------------------------------------------------


def _characters(user, scope: str):
    if scope == "main":
        return [user.main_character] if user.main_character_id else []
    return list(user.characters.all())


def _names(model, ids, attr="name") -> str:
    ids = list(ids or [])
    found = dict(model.objects.filter(pk__in=ids).values_list("pk", attr))
    return ", ".join(str(found.get(i) or i) for i in ids)


def _state_names(ids):
    from .models import State

    return _names(State, ids)


def _group_names(ids):
    from django.contrib.auth.models import Group

    return _names(Group, ids)


def _corp_names(ids):
    from conduit.eve.models import EveCorporation

    return _names(EveCorporation, ids)


def _alliance_names(ids):
    from conduit.eve.models import EveAlliance

    return _names(EveAlliance, ids)


def _skill_name(skill_id):
    from conduit.sde.models import ItemType

    return ItemType.objects.filter(pk=skill_id).values_list("name", flat=True).first() or f"Skill {skill_id}"


SCOPE_CHOICES = (("main", "Main character"), ("any", "Any character"), ("all", "Every character"))
SCOPE_WORDS = {"main": "on their main", "any": "on any character", "all": "on every character"}
ROMAN = {1: "I", 2: "II", 3: "III", 4: "IV", 5: "V"}


# --- built-in rules ------------------------------------------------------------------------


def _state_in(user, p):
    return user.state_id in p["states"]


def _main_corp(user, p):
    main = user.main_character
    return bool(main and main.corporation_id in p["corporations"])


def _main_alliance(user, p):
    main = user.main_character
    return bool(main and main.alliance_id in p["alliances"])


def _any_corp(user, p):
    return user.characters.filter(corporation_id__in=p["corporations"]).exists()


def _any_alliance(user, p):
    return user.characters.filter(alliance_id__in=p["alliances"]).exists()


def _skill(user, p):
    from conduit.sheet.skills.models import CharacterSkill

    chars = _characters(user, p["scope"])
    if not chars:
        return False
    have = set(
        CharacterSkill.objects.filter(character__in=chars, skill_id=p["skill"], active_level__gte=p["level"]).values_list(
            "character_id", flat=True
        )
    )
    return len(have) == len(chars) if p["scope"] == "all" else bool(have)


def _total_sp(user, p):
    from conduit.sheet.skills.models import SkillSummary

    chars = _characters(user, p["scope"])
    sps = list(SkillSummary.objects.filter(character__in=chars).values_list("total_sp", flat=True))
    return any(sp >= p["sp"] for sp in sps)


def _compliant(user, p):
    from .compliance import check_user

    return check_user(user)["compliant"]


def _group_member(user, p):
    return user.groups.filter(pk__in=p["groups"]).exists()


def _title(user, p):
    from conduit.sheet.overview.models import CharacterInfo

    wanted = p["title"].strip().lower()
    chars = _characters(user, p["scope"])
    titles = CharacterInfo.objects.filter(character__in=chars).values_list("character_id", "titles")
    holders = {cid for cid, ts in titles if any(t.strip().lower() == wanted for t in ts or [])}
    return len(holders) == len(chars) and bool(chars) if p["scope"] == "all" else bool(holders)


def _character_count(user, p):
    n = user.characters.count()
    return n >= p["count"] if p["op"] == "gte" else n <= p["count"]


def _account_age(user, p):
    return user.date_joined <= timezone.now() - timedelta(days=p["days"])


def _either(model, ids) -> str:
    """'Rifter or Slasher'."""
    ids = list(ids or [])
    found = dict(model.objects.filter(pk__in=ids).values_list("pk", "name"))
    return " or ".join(str(found.get(i) or i) for i in ids)


def _type_names(ids) -> str:
    from conduit.sde.models import ItemType

    return _either(ItemType, ids)


def _type_group_names(ids) -> str:
    from conduit.sde.models import ItemGroup

    return _either(ItemGroup, ids)


def _owned(user, p, **filters) -> int:
    """How many of the matching items the user's characters (main, or any) have in their synced assets."""
    from django.db.models import Sum

    from conduit.sheet.assets.models import Asset

    chars = _characters(user, p["scope"])
    if not chars:
        return 0
    return Asset.objects.filter(character__in=chars, **filters).aggregate(n=Sum("quantity"))["n"] or 0


def _has_ship(user, p):
    return _owned(user, p, type_id__in=p["ships"]) >= p["count"]


def _has_ship_class(user, p):
    from conduit.sde.models import ItemType

    type_ids = ItemType.objects.filter(group_id__in=p["classes"]).values_list("pk", flat=True)
    return _owned(user, p, type_id__in=type_ids) >= p["count"]


def _has_item(user, p):
    return _owned(user, p, type_id__in=p["items"]) >= p["count"]


def _count_words(n: int, things: str) -> str:
    return things if n == 1 else f"{n:,} × {things}"


OWNED_SCOPE = SCOPE_CHOICES[:2]
ASSET_HELP = "Uses the synced assets of the character sheet; characters without the assets scope count as owning nothing."


def _register_builtins():
    register_rule(
        "state", "Membership state", _state_in, category="Membership",
        params=(Param("states", "state", "State is one of", multiple=True),),
        description="The user's state (Member, Blue, Guest...) is one of these.",
        explain=lambda p: f"State is {_state_names(p['states'])}",
    )
    register_rule(
        "group_member", "Member of group", _group_member, category="Membership",
        params=(Param("groups", "group", "Member of any of", multiple=True),),
        explain=lambda p: f"Member of {_group_names(p['groups'])}",
    )
    register_rule(
        "main_corporation", "Main in corporation", _main_corp, category="Affiliation",
        params=(Param("corporations", "corporation", "Corporation", multiple=True),),
        explain=lambda p: f"Main character is in {_corp_names(p['corporations'])}",
    )
    register_rule(
        "main_alliance", "Main in alliance", _main_alliance, category="Affiliation",
        params=(Param("alliances", "alliance", "Alliance", multiple=True),),
        explain=lambda p: f"Main character is in {_alliance_names(p['alliances'])}",
    )
    register_rule(
        "any_corporation", "Any character in corporation", _any_corp, category="Affiliation",
        params=(Param("corporations", "corporation", "Corporation", multiple=True),),
        explain=lambda p: f"Has a character in {_corp_names(p['corporations'])}",
    )
    register_rule(
        "any_alliance", "Any character in alliance", _any_alliance, category="Affiliation",
        params=(Param("alliances", "alliance", "Alliance", multiple=True),),
        explain=lambda p: f"Has a character in {_alliance_names(p['alliances'])}",
    )
    register_rule(
        "skill", "Has skill", _skill, category="Character",
        params=(
            Param("skill", "skill", "Skill"),
            Param("level", "int", "At level", default=1, min=1, max=5),
            Param("scope", "choice", "On", choices=SCOPE_CHOICES, default="any"),
        ),
        description="Uses the synced skills of the character sheet.",
        explain=lambda p: f"{_skill_name(p['skill'])} {ROMAN.get(p['level'], p['level'])} {SCOPE_WORDS[p['scope']]}",
    )
    register_rule(
        "total_sp", "Total skill points", _total_sp, category="Character",
        params=(
            Param("sp", "int", "At least (SP)", min=0),
            Param("scope", "choice", "On", choices=SCOPE_CHOICES[:2], default="main"),
        ),
        explain=lambda p: f"At least {p['sp']:,} skill points {SCOPE_WORDS[p['scope']]}",
    )
    register_rule(
        "corp_title", "Has corporation title", _title, category="Character",
        params=(
            Param("title", "str", "Title"),
            Param("scope", "choice", "On", choices=SCOPE_CHOICES, default="any"),
        ),
        explain=lambda p: f"Holds the title “{p['title']}” {SCOPE_WORDS[p['scope']]}",
    )
    register_rule(
        "has_ship", "Owns ship", _has_ship, category="Assets", description=ASSET_HELP,
        params=(
            Param("ships", "ship", "Any of these ships", multiple=True),
            Param("count", "int", "At least", default=1, min=1),
            Param("scope", "choice", "On", choices=OWNED_SCOPE, default="any"),
        ),
        explain=lambda p: f"Owns {_count_words(p['count'], _type_names(p['ships']))} {SCOPE_WORDS[p['scope']]}",
    )
    register_rule(
        "has_ship_class", "Owns ship class", _has_ship_class, category="Assets", description=ASSET_HELP,
        params=(
            Param("classes", "ship_group", "Any ship of these classes", multiple=True, help="e.g. Dreadnought, Force Auxiliary, Logistics"),
            Param("count", "int", "At least", default=1, min=1),
            Param("scope", "choice", "On", choices=OWNED_SCOPE, default="any"),
        ),
        explain=lambda p: f"Owns {_count_words(p['count'], _type_group_names(p['classes']))} {SCOPE_WORDS[p['scope']]}",
    )
    register_rule(
        "has_item", "Has item", _has_item, category="Assets", description=ASSET_HELP,
        params=(
            Param("items", "item", "Any of these items", multiple=True, help="Quantities of all of them are added up."),
            Param("count", "int", "At least (units)", default=1, min=1),
            Param("scope", "choice", "On", choices=OWNED_SCOPE, default="any"),
        ),
        explain=lambda p: f"Has {_count_words(p['count'], _type_names(p['items']))} {SCOPE_WORDS[p['scope']]}",
    )
    register_rule(
        "compliant", "Compliant", _compliant, category="Account",
        description="Every character has a working login with all the ESI scopes the site needs.",
        explain=lambda p: "All characters logged in with every scope the site needs",
    )
    register_rule(
        "character_count", "Number of characters", _character_count, category="Account",
        params=(
            Param("op", "choice", "Has", choices=(("gte", "at least"), ("lte", "at most")), default="gte"),
            Param("count", "int", "Characters", min=0),
        ),
        explain=lambda p: f"{'At least' if p['op'] == 'gte' else 'At most'} {p['count']} characters",
    )
    register_rule(
        "account_age", "Account age", _account_age, category="Account",
        params=(Param("days", "int", "Registered for at least (days)", min=0),),
        explain=lambda p: f"Registered here for at least {p['days']} days",
    )


_register_builtins()


def load_module_rules():
    """Import every enabled-or-not installed plugin's ``group_rules`` files; they register on import."""
    from conduit.plugins import registry

    for mid, mod in registry.installed().items():
        for path in getattr(mod, "group_rules", ()) or ():
            try:
                importlib.import_module(path)
            except Exception:
                log.exception("Could not load group rules %s of plugin %s", path, mid)
