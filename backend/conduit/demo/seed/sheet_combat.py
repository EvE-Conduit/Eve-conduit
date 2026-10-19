"""Killmails: the alliance's fleets against made-up hostiles (and the odd neutral hauler), the kill reports and
insurance payouts that come with them. Intel needs nothing of its own: it's built from wallet, mail and contracts.
``hostiles`` is shared with ``sheet_social`` (contacts)."""

from datetime import timedelta

from conduit.eve.models import EveName
from conduit.sheet.killmails.models import CharacterKillmail, Killmail
from conduit.sheet.killmails.sync import _value
from conduit.sheet.notifications.models import Notification

from . import Ids
from .sheet_industry import ensure_prices, neutrals, role, types

HOSTILE_ALLIANCES = (("Ashen Tide Concord", 1), ("Graywater Compact", 2))
# name, alliance number (0: none)
HOSTILE_CORPORATIONS = (("Ashen Tide Marauders", 1), ("Cinderfall Corsairs", 1), ("Graywater Raiders", 2),
                        ("Hollowmere Privateers", 2), ("Blackfen Irregulars", 0))
FIRST = ("Grim", "Veyra", "Korr", "Ashka", "Draeg", "Silas", "Mortan", "Ysolde", "Brakk", "Venn", "Tasha", "Ulgar",
         "Rhoswen", "Kade", "Ozren", "Nalia", "Sevrin", "Thrask")
LAST = ("Tassar", "Kolth", "Vreeland", "Morrow", "Skarn", "Duvaleth", "Ironsoul", "Harrowgate", "Quell", "Zarkov",
        "Blackreed", "Ostravik")
HOSTILE_CHARACTER = Ids.CHARACTER + 150_000
HOSTILE_CORPORATION = Ids.CORPORATION + 150
HOSTILE_ALLIANCE = Ids.ALLIANCE + 150

# Ships each side flies, by doctrine weight.
OUR_SHIPS = {"Hurricane": 8, "Drake": 6, "Caracal": 5, "Vexor": 3, "Basilisk": 2, "Guardian": 2, "Tempest": 2,
             "Loki": 1, "Tengu": 1, "Rifter": 3, "Archon": 1, "Naglfar": 1}
THEIR_SHIPS = {"Rifter": 5, "Merlin": 4, "Punisher": 3, "Executioner": 3, "Thorax": 4, "Stabber": 4, "Caracal": 4,
               "Myrmidon": 3, "Hurricane": 3, "Drake": 3, "Megathron": 2, "Apocalypse": 1, "Machariel": 1, "Loki": 1,
               "Thanatos": 1, "Revelation": 1}
VICTIM_SHIPS = {**THEIR_SHIPS, "Procurer": 2, "Retriever": 2, "Hulk": 1, "Orca": 1, "Skiff": 1}
WEAPONS = ("125mm Gatling AutoCannon I", "Light Neutron Blaster I", "Dual Light Beam Laser I", "Hammerhead II", "Hobgoblin I")
CARGO = ("EMP S", "Hobgoblin I", "Hammerhead I", "Hammerhead II", "125mm Gatling AutoCannon I", "Light Neutron Blaster I")


def hostiles(demo) -> list[tuple[int, int, int | None]]:
    """The hostile pilots, as (character id, corporation id, alliance id); their names are made sure of."""
    alliance_of = {HOSTILE_CORPORATION + i + 1: HOSTILE_ALLIANCE + a if a else None for i, (_, a) in enumerate(HOSTILE_CORPORATIONS)}
    corps = list(alliance_of)
    names = [f"{f} {last}" for f in FIRST for last in LAST]
    names = [names[(i * 37) % len(names)] for i in range(40)]  # a fixed spread, not every first name with every last
    pilots = [(HOSTILE_CHARACTER + i + 1, corps[i % len(corps)]) for i in range(len(names))]
    EveName.objects.bulk_create(
        [EveName(id=cid, name=n, category="character") for (cid, _), n in zip(pilots, names)]
        + [EveName(id=HOSTILE_CORPORATION + i + 1, name=n, category="corporation") for i, (n, _) in enumerate(HOSTILE_CORPORATIONS)]
        + [EveName(id=HOSTILE_ALLIANCE + a, name=n, category="alliance") for n, a in HOSTILE_ALLIANCES],
        ignore_conflicts=True,
    )
    return [(cid, corp, alliance_of[corp]) for cid, corp in pilots]


def _weighted(demo, table: dict[str, int], ids) -> str:
    names = [n for n in table if n in ids]
    return demo.rng.choices(names, weights=[table[n] for n in names])[0]


def seed(demo):
    ids = types({*OUR_SHIPS, *VICTIM_SHIPS, *WEAPONS, *CARGO})
    ensure_prices(ids)
    enemies = hostiles(demo)
    haulers = [(cid, corp, None) for cid, corp in neutrals(demo)]
    ours = [c for c in demo.characters if c.alliance_id == demo.alliance.pk]
    systems = demo.system_ids()
    killmails, links, notes = [], [], []

    def pilot(c):
        return {"character_id": c.pk, "corporation_id": c.corporation_id, "alliance_id": c.alliance_id}

    def them(p):
        out = {"character_id": p[0], "corporation_id": p[1]}
        return out | ({"alliance_id": p[2]} if p[2] else {})

    def fight(focus, loss: bool):
        """One killmail with ``focus`` (a member character) on it: their loss, or a kill they were on."""
        when = demo.recent(60)
        system = demo.pick(systems)
        if loss:
            victim = pilot(focus) | {"ship_type_id": ids[_weighted(demo, OUR_SHIPS, ids)]}
            attackers = [them(p) | {"ship_type_id": ids[_weighted(demo, THEIR_SHIPS, ids)]} for p in demo.sample(enemies, demo.rng.randint(1, 18))]
            members = [focus]
        else:
            fleet = [focus] + demo.sample([c for c in ours if c.user_id != focus.user_id], demo.rng.randint(0, 14))
            target = demo.pick(haulers) if demo.chance(0.12) else demo.pick(enemies)
            victim = them(target) | {"ship_type_id": ids[_weighted(demo, VICTIM_SHIPS, ids)]}
            attackers = [pilot(c) | {"ship_type_id": ids[_weighted(demo, OUR_SHIPS, ids)]} for c in fleet]
            members = fleet
        big = victim["ship_type_id"] in {ids.get(n) for n in ("Orca", "Thanatos", "Revelation")}
        damage = demo.rng.randint(150_000, 900_000) if big else demo.rng.randint(1_500, 60_000)
        shares = [demo.rng.random() + 0.05 for _ in attackers]
        final = demo.rng.randrange(len(attackers))
        for a, share in zip(attackers, shares):
            a.update(damage_done=int(damage * share / sum(shares)), final_blow=False, security_status=round(demo.rng.uniform(-10 if loss else -2, 5), 1),
                     weapon_type_id=ids.get(demo.pick(WEAPONS), a["ship_type_id"]))
        attackers[final]["final_blow"] = True
        attackers.sort(key=lambda a: -a["damage_done"])
        items = [
            {"item_type_id": ids[n], "flag": demo.pick([5, 27, 28, 29, 87]), "singleton": 0,
             "quantity_destroyed" if demo.chance(0.5) else "quantity_dropped": demo.rng.randint(200, 3000) if n == "EMP S" else demo.rng.randint(1, 5)}
            for n in demo.sample([n for n in CARGO if n in ids], demo.rng.randint(1, 4))
        ]
        kid = demo.next_id()
        data = {
            "killmail_id": kid, "killmail_time": when.strftime("%Y-%m-%dT%H:%M:%SZ"), "solar_system_id": system,
            "victim": victim | {"damage_taken": damage, "items": items,
                                "position": {"x": demo.rng.uniform(-1e12, 1e12), "y": demo.rng.uniform(-1e10, 1e10), "z": demo.rng.uniform(-1e12, 1e12)}},
            "attackers": attackers,
        }
        km = Killmail(
            id=kid, hash=f"{demo.rng.getrandbits(160):040x}", time=when.replace(microsecond=0), solar_system_id=system,
            victim_character_id=victim["character_id"], victim_corporation_id=victim["corporation_id"], victim_alliance_id=victim.get("alliance_id"),
            victim_ship_type_id=victim["ship_type_id"], damage_taken=damage, attacker_count=len(attackers),
            final_blow_character_id=next(a["character_id"] for a in attackers if a["final_blow"]), value=_value(data), data=data,
        )
        killmails.append(km)
        for c in members:
            links.append(CharacterKillmail(character=c, killmail=km, is_loss=loss))
        # Kill reports in the notifications of the victim and whoever landed the final blow.
        report = f"killMailHash: {km.hash}\nkillMailID: {kid}\nvictimShipTypeID: {victim['ship_type_id']}\n"
        if loss:
            notes.append(Notification(character=focus, notification_id=demo.next_id(), type="KillReportVictim", sender_id=1000125,
                                      sender_type="corporation", timestamp=when + timedelta(seconds=5), is_read=True, text=report))
            notes.append(Notification(
                character=focus, notification_id=demo.next_id(), type="InsurancePayoutMsg", sender_id=1000132, sender_type="corporation",
                timestamp=when + timedelta(minutes=1), is_read=demo.chance(0.8),
                text=f"amount: {round(km.value * 0.4, 2)}\nitemID: {demo.next_id()}\npayout: 1\n",
            ))
        else:
            killer = next((c for c in members if c.pk == km.final_blow_character_id), None)
            if killer:
                notes.append(Notification(character=killer, notification_id=demo.next_id(), type="KillReportFinalBlow", sender_id=1000125,
                                          sender_type="corporation", timestamp=when + timedelta(seconds=5), is_read=demo.chance(0.7), text=report))

    for character in demo.characters:
        r = role(demo, character)
        kills, losses = {"star": (34, 9), "admin": (8, 3)}.get(r) or (demo.rng.randint(1, 8), demo.rng.randint(0, 3))
        if character.alliance_id != demo.alliance.pk:
            kills, losses = demo.rng.randint(0, 2), demo.rng.randint(1, 2)  # the odd joint op, and a few losses
        for _ in range(kills):
            fight(character, loss=False)
        for _ in range(losses):
            fight(character, loss=True)

    Killmail.objects.bulk_create(killmails, batch_size=500)
    # The same pilot on one killmail twice (picked as focus and as a fleet member) is one link.
    unique = {(link.character.pk, link.killmail.pk): link for link in links}
    CharacterKillmail.objects.bulk_create(unique.values(), batch_size=2000)
    Notification.objects.bulk_create(notes, batch_size=1000)
    EveName.objects.bulk_create([EveName(id=1000125, name="CONCORD", category="corporation"),
                                 EveName(id=1000132, name="Secure Commerce Commission", category="corporation")], ignore_conflicts=True)
