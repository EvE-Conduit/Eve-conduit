"""Group rule: can fly a doctrine fit (its required skills, or those plus the recommended ones)."""

from conduit.access.rules import Param, register_rule

SCOPES = (("main", "main character"), ("any", "any character"), ("all", "every character"))
SCOPE_WORDS = {"main": "the main character", "any": "any character", "all": "every character"}


def _fit_choices():
    from conduit.sde.models import ItemType

    from .models import DoctrineFit, Fit

    rows = list(DoctrineFit.objects.select_related("doctrine", "fit").order_by("doctrine__name", "order"))
    loose = list(Fit.objects.filter(entries__isnull=True))
    ships = dict(ItemType.objects.filter(pk__in={e.fit.ship_type_id for e in rows} | {f.ship_type_id for f in loose}).values_list("id", "name"))
    seen, out = set(), []
    for e in rows:
        if e.fit_id not in seen:
            seen.add(e.fit_id)
            out.append((str(e.fit_id), f"{e.doctrine.name} – {e.fit.name} ({ships.get(e.fit.ship_type_id, 'ship')})"))
    # Fits that aren't in a doctrine.
    out += [(str(f.pk), f"{f.name} ({ships.get(f.ship_type_id, 'ship')})") for f in loose]
    return out


def _can_fly(user, p):
    from conduit.sheet.skills import training

    from .models import Fit
    from .services import Skills

    fit = Fit.objects.filter(pk=int(p["fit"])).first()
    if fit is None:
        return False
    chars = [user.main_character_id] if p["scope"] == "main" else list(user.characters.values_list("id", flat=True))
    chars = [c for c in chars if c]
    if not chars:
        return False
    sk = Skills([fit])
    need = sk.all_levels[fit.pk] if p["level"] == "recommended" else sk.required_levels[fit.pk]
    states = training.character_state(chars)
    ok = [training.meets(states[c]["levels"], need) for c in chars]
    return all(ok) if p["scope"] == "all" else any(ok)


def _explain(p):
    from conduit.sde.models import ItemType

    from .models import Fit

    fit = Fit.objects.filter(pk=int(p["fit"])).first()
    if fit is None:
        return "Can fly a doctrine fit that was deleted"
    ship = ItemType.objects.filter(pk=fit.ship_type_id).values_list("name", flat=True).first() or "ship"
    extra = " with the recommended skills" if p["level"] == "recommended" else ""
    return f"Can fly “{fit.name}” ({ship}){extra} on {SCOPE_WORDS[p['scope']]}"


register_rule(
    "doctrine_can_fly", "Can fly doctrine fit", _can_fly, plugin="doctrines", category="Doctrines",
    params=(
        Param("fit", "choice", "Fit", choices=_fit_choices),
        Param("level", "choice", "Skills", choices=(("required", "required skills"), ("recommended", "required and recommended")),
              default="required"),
        Param("scope", "choice", "On", choices=SCOPES, default="any"),
    ),
    description="Uses the synced skills of the character sheet against what the fit's ship, modules, charges and drones need.",
    explain=_explain,
)
