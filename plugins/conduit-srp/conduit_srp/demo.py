"""Example data for demo mode (Plugin.demo_data): SRP rules and settings, members' losses on alliance fleets and
their requests in every state, including a couple of losses the demo account hasn't claimed yet."""

from datetime import timedelta
from decimal import Decimal

from conduit.eve.models import EveName
from conduit.sheet.killmails.models import CharacterKillmail, Killmail

from .models import ShipRule, SrpRequest, SrpSettings

# Doctrine hulls with a rough fitted value in ISK.
SHIPS = {621: 45e6, 24698: 95e6, 24702: 110e6, 11985: 260e6, 11987: 255e6, 626: 30e6, 641: 340e6, 29984: 720e6,
         587: 6e6, 627: 28e6}
# A few modules for the fitting window: (type id, slot flags)
MODULES = {621: (3319, 19), 24698: (3319, 19), 24702: (484, 27), 587: (484, 27), 627: (3001, 27), 641: (3001, 27)}
FLEETS = ("Sunday CTA - Hek defence", "Home defence ping", "Strat op: Rens timer", "Roam to Heimatar", "Structure bash in Hek",
          "Mining fleet escort", "Alliance CTA - Fortizar hull timer")
NOTES = ("Doctrine fit, died to the bomber run.", "Tackled on the gate, logi couldn't hold me.", "", "",
         "Got primaried first, as usual.", "Fit was off by one rig, sorry.")
REJECTIONS = ("Not a doctrine fit: no logi links.", "This loss wasn't on an alliance fleet.", "Lost while ratting, SRP is for fleets only.")
HOSTILE_PILOTS = ("Rax Obsidian", "Kerrigan Duskfall", "Velkor Ashborn", "Mira Coldsteel", "Dren Halvard", "Ysolde Grimm")


def _killmail(demo, char, ship, when, attackers):
    value = SHIPS[ship] * demo.rng.uniform(0.85, 1.25)
    module, flag = MODULES.get(ship, (2488, 87))
    items = [{"item_type_id": module, "flag": flag + i, "singleton": 0, "quantity_destroyed" if demo.chance(0.6) else "quantity_dropped": 1}
             for i in range(demo.rng.randint(2, 5))]
    items.append({"item_type_id": 2488, "flag": 87, "singleton": 0, "quantity_destroyed": demo.rng.randint(2, 5)})
    km_id = demo.next_id()
    final = demo.pick(attackers)
    data = {
        "killmail_id": km_id, "killmail_time": when.isoformat().replace("+00:00", "Z"), "solar_system_id": demo.pick(demo.system_ids()),
        "victim": {"character_id": char.pk, "corporation_id": char.corporation_id, "alliance_id": char.alliance_id,
                   "ship_type_id": ship, "damage_taken": demo.rng.randint(4_000, 90_000), "items": items},
        "attackers": [{"character_id": a, "final_blow": a == final, "damage_done": demo.rng.randint(200, 9000)}
                      for a in demo.sample(attackers, demo.rng.randint(3, len(attackers)))],
    }
    if not any(a["final_blow"] for a in data["attackers"]):
        data["attackers"][0]["final_blow"] = True
    return Killmail(
        id=km_id, hash=f"demo{km_id:x}", time=when, solar_system_id=data["solar_system_id"], victim_character_id=char.pk,
        victim_corporation_id=char.corporation_id, victim_alliance_id=char.alliance_id, victim_ship_type_id=ship,
        damage_taken=data["victim"]["damage_taken"], attacker_count=len(data["attackers"]) * demo.rng.randint(1, 6),
        final_blow_character_id=next(a["character_id"] for a in data["attackers"] if a["final_blow"]), value=round(value), data=data,
    )


def seed(demo):
    corp_ids = [c.pk for c in demo.corporations]
    SrpSettings.objects.update_or_create(pk=1, defaults={
        "default_percent": Decimal("100.00"), "covered_only": False, "max_age_days": 30, "require_fleet": True,
        "corporations": corp_ids,
        "rules_text": "Doctrine ships lost on alliance fleets are covered. Payouts go out on the 1st and 15th. "
                      "Pods and ratting losses aren't covered.",
    })
    ShipRule.objects.bulk_create([
        ShipRule(type_id=670, name="Capsule", covered=False, note="Pods aren't covered"),
        ShipRule(group_id=832, name="Logistics", covered=True, percent=Decimal("120.00"), note="Logi gets a bonus"),
        ShipRule(group_id=963, name="Strategic Cruiser", covered=True, percent=Decimal("50.00"), note="Half: T3s are a luxury"),
        ShipRule(type_id=587, name="Rifter", covered=True, payout=Decimal("8000000.00"), note="Flat payout for tackle"),
    ])

    attackers = []
    names = []
    for name in HOSTILE_PILOTS:
        pid = demo.next_id()
        attackers.append(pid)
        names.append(EveName(id=pid, name=name, category="character"))
    EveName.objects.bulk_create(names, ignore_conflicts=True)

    members = [c for c in demo.characters if c.corporation_id in corp_ids]
    admin_chars = demo.characters_of(demo.admin)
    # (character, status, days ago): the demo account's own first, then everyone else's
    plan = [(admin_chars[0], "pending", 1.5), (admin_chars[-1], "pending", 4), (admin_chars[0], "paid", 22),
            (admin_chars[0], "rejected", 12), (admin_chars[1 % len(admin_chars)], None, 2), (admin_chars[0], None, 6)]
    others = [c for c in members if c.user_id != demo.admin.pk]
    for status in ["pending"] * 6 + ["approved"] * 4 + ["rejected"] * 2 + ["paid"] * 6:
        plan.append((demo.pick(others), status, demo.rng.uniform(0.5, 28) if status != "paid" else demo.rng.uniform(10, 55)))

    kms, links = [], []
    for char, status, days in plan:
        when = max(demo.ago(days=days), char.added_at + timedelta(hours=2))
        km = _killmail(demo, char, demo.pick(SHIPS), min(when, demo.ago(hours=1)), attackers)
        kms.append(km)
        links.append(CharacterKillmail(character=char, killmail=km, is_loss=True))
    Killmail.objects.bulk_create(kms)
    CharacterKillmail.objects.bulk_create(links)

    rules = list(ShipRule.objects.all())
    from .services import suggest

    settings = SrpSettings.load()
    reviewers = [demo.admin, *demo.sample([u for u in demo.users[1:] if u.main_character and u.main_character.corporation_id in corp_ids], 2)]
    requests, stamps = [], []
    for (char, status, _), km in zip(plan, kms):
        if status is None:
            continue  # left to claim
        suggested = suggest(km.victim_ship_type_id, km.value, settings, rules)
        created = km.time + timedelta(hours=demo.rng.uniform(1, 30))
        created = min(created, demo.ago(minutes=30))
        req = SrpRequest(killmail=km, user_id=char.user_id, character_id=char.pk, character_name=char.name,
                         fleet=demo.pick(FLEETS), fc=demo.pick([u.main_character.name for u in reviewers]), notes=demo.pick(NOTES),
                         suggested=suggested, status=status)
        if status != "pending":
            req.decided_at = min(created + timedelta(hours=demo.rng.uniform(2, 72)), demo.ago(minutes=10))
            req.decided_by = demo.pick(reviewers)
            if status == "rejected":
                req.decision_note = demo.pick(REJECTIONS)
            else:
                req.payout = suggested if demo.chance(0.7) else (suggested * Decimal("0.8")).quantize(Decimal("1"))
                if req.payout != suggested:
                    req.decision_note = "Paid at 80%: the fit wasn't quite doctrine."
            if status == "paid":
                req.paid_at = min(req.decided_at + timedelta(days=demo.rng.uniform(1, 10)), demo.ago(minutes=5))
                req.paid_by = demo.admin
        requests.append(req)
        stamps.append(created)
    made = SrpRequest.objects.bulk_create(requests)
    for req, created in zip(made, stamps):
        SrpRequest.objects.filter(pk=req.pk).update(created_at=created)
