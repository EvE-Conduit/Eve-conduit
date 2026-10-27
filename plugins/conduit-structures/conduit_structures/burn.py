"""Fuel blocks an Upwell structure burns per hour, from its online service modules.

Sources: the in-game descriptions of the Standup service modules and of the structures' role bonuses, as listed on the
EVE University wiki ("Upwell structures", "Structure service modules") in 2025. CCP changes these now and then, so
check them against the game if a number looks off; they're all in this file.

- A structure burns nothing for itself: only its online service modules use fuel. With none online it sits in low power.
- One module can show as several services in ESI (a Research Lab is "Blueprint Copying", "Material Efficiency Research"
  and "Time Efficiency Research"), so services are mapped to modules and each module is counted once.
- Role bonuses cut the fuel of the modules they cover: citadels the citadel modules (clone bay, market), engineering
  complexes the industry modules, refineries the resource processing modules.
- Flex structures (Ansiblex, Pharolux, Tenebrex) and the Metenox moon drill burn a fixed amount whenever they're fuelled.
  The Metenox also burns magmatic gas, which isn't planned here.
- The game bills whole blocks each hour; bonused rates like 7.5 are kept as they are here and totals are rounded up.
"""

from __future__ import annotations

from dataclasses import dataclass

#: Fuel blocks per hour at full rate, per service module.
MODULES: dict[str, tuple[str, float]] = {
    "clone": ("Standup Cloning Center I", 10),
    "market": ("Standup Market Hub I", 40),
    "manufacturing": ("Standup Manufacturing Plant I", 12),
    "capital": ("Standup Capital Shipyard I", 24),
    "supercapital": ("Standup Supercapital Shipyard I", 36),
    "research": ("Standup Research Lab I", 12),
    "invention": ("Standup Invention Lab I", 12),
    "reprocessing": ("Standup Reprocessing Facility I", 10),
    "moon_drill": ("Standup Moon Drill I", 5),
    "composite": ("Standup Composite Reactor I", 15),
    "hybrid": ("Standup Hybrid Reactor I", 15),
    "biochemical": ("Standup Biochemical Reactor I", 15),
}

#: Which modules each kind of structure's role bonus covers.
CITADEL_MODULES = {"clone", "market"}
ENGINEERING_MODULES = {"manufacturing", "capital", "supercapital", "research", "invention"}
REFINERY_MODULES = {"reprocessing", "moon_drill", "composite", "hybrid", "biochemical"}

#: Structure type ids: (kind, fuel multiplier for the modules its bonus covers).
STRUCTURES: dict[int, tuple[str, float]] = {
    35832: ("citadel", 0.75),   # Astrahus
    35833: ("citadel", 0.75),   # Fortizar
    35834: ("citadel", 0.75),   # Keepstar
    40340: ("citadel", 0.75),   # Upwell Palatine Keepstar
    47512: ("citadel", 0.75),   # 'Moreau' Fortizar
    47513: ("citadel", 0.75),   # 'Draccous' Fortizar
    47514: ("citadel", 0.75),   # 'Horizon' Fortizar
    47515: ("citadel", 0.75),   # 'Marginis' Fortizar
    47516: ("citadel", 0.75),   # 'Prometheus' Fortizar
    35825: ("engineering", 0.75),  # Raitaru
    35826: ("engineering", 0.75),  # Azbel
    35827: ("engineering", 0.75),  # Sotiyo
    35835: ("refinery", 0.8),   # Athanor
    35836: ("refinery", 0.75),  # Tatara
}
#: The same by SDE group, for structure types not listed above (new faction variants).
GROUPS = {1657: ("citadel", 0.75), 1404: ("engineering", 0.75), 1406: ("refinery", 0.8)}
BONUSED = {"citadel": CITADEL_MODULES, "engineering": ENGINEERING_MODULES, "refinery": REFINERY_MODULES}

#: Structures that burn a fixed amount while fuelled: (module, blocks per hour).
FIXED: dict[int, tuple[str, float]] = {
    35841: ("Standup Conduit Generator I", 30),       # Ansiblex Jump Bridge
    35840: ("Standup Cynosural Field Generator I", 15),  # Pharolux Cyno Beacon
    37534: ("Standup Cynosural System Jammer I", 40),  # Tenebrex Cyno Jammer
    81826: ("Metenox moon drill", 5),                  # Metenox Moon Drill (plus magmatic gas, not planned)
}

#: Fuel blocks are 5 m3 each (all four races' blocks work in any Upwell structure).
BLOCK_VOLUME = 5.0
#: Nitrogen, Hydrogen, Helium and Oxygen Fuel Block: the plan prices the cheapest.
FUEL_BLOCK_TYPES = (4051, 4246, 4247, 4312)


def module_of(service_name: str) -> str | None:
    """The module behind one of ESI's service names, or None when it isn't in the table."""
    n = (service_name or "").lower()
    if "clone" in n:
        return "clone"
    if "market" in n:
        return "market"
    if "manufacturing" in n:
        if "super" in n:
            return "supercapital"
        return "capital" if "capital" in n else "manufacturing"
    if "invention" in n:
        return "invention"
    if "research" in n or "copying" in n:
        return "research"
    if "reprocessing" in n:
        return "reprocessing"
    if "moon" in n:
        return "moon_drill"
    if "composite" in n or "polymer" in n:
        return "composite"
    if "hybrid" in n:
        return "hybrid"
    if "biochemical" in n:
        return "biochemical"
    return None


@dataclass
class Burn:
    #: Blocks per hour with the services online now.
    online: float
    #: Blocks per hour if every fitted service were online.
    all: float
    #: Each module counted, once: ``{"module", "name", "online", "rate"}``.
    modules: list[dict]
    #: Services ESI reported that aren't in the table (not counted).
    unknown: list[str]


def structure_kind(type_id: int, group_id: int | None = None) -> tuple[str, float]:
    if type_id in STRUCTURES:
        return STRUCTURES[type_id]
    if group_id in GROUPS:
        return GROUPS[group_id]
    return ("other", 1.0)


def burn(type_id: int, services: list[dict], group_id: int | None = None, fuelled: bool = True) -> Burn:
    """Fuel blocks per hour for a structure of ``type_id`` with ESI's ``services`` (``[{name, state}]``).

    ``fuelled`` says whether it has fuel at all (the core's ``fuel_expires`` is set); fixed-rate structures only burn then.
    """
    if type_id in FIXED:
        name, rate = FIXED[type_id]
        return Burn(rate if fuelled else 0.0, rate, [{"module": "fixed", "name": name, "online": fuelled, "rate": rate}], [])
    kind, multiplier = structure_kind(type_id, group_id)
    covered = BONUSED.get(kind, set())
    seen: dict[str, dict] = {}
    unknown = []
    for s in services or []:
        key = module_of(s.get("name", ""))
        if key is None:
            unknown.append(s.get("name", ""))
            continue
        name, base = MODULES[key]
        rate = base * multiplier if key in covered else base
        row = seen.setdefault(key, {"module": key, "name": name, "online": False, "rate": rate})
        # A module is online when any of its services is (they go on and off together in game).
        row["online"] = row["online"] or s.get("state") == "online"
    modules = list(seen.values())
    return Burn(
        online=sum(m["rate"] for m in modules if m["online"]),
        all=sum(m["rate"] for m in modules),
        modules=modules,
        unknown=unknown,
    )
