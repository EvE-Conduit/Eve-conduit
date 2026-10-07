"""Corporation sheet sections. Like the character sheet's, but each sync runs as a member
character that holds the in-game roles and ESI scopes the section needs."""

from __future__ import annotations

import importlib
from collections.abc import Callable
from dataclasses import dataclass

DIRECTOR = "Director"


@dataclass(frozen=True)
class CorpSection:
    key: str
    label: str
    #: Dotted path to ``sync(corporation, character, esi)``. ``character`` is None for public-only sections.
    sync: str
    #: ESI scopes the syncing character's token must hold.
    scopes: tuple[str, ...] = ()
    #: In-game corporation roles, any one of which is enough. Directors may do everything.
    roles: tuple[str, ...] = ()
    #: False when the section can run on public data without any member character.
    needs_character: bool = True
    interval: int = 3600
    order: int = 100
    description: str = ""
    #: Shown only to people who may also see corporation finances.
    financial: bool = False

    def sync_function(self) -> Callable:
        path, _, attr = self.sync.rpartition(".")
        return getattr(importlib.import_module(path), attr)

    def role_ok(self, roles) -> bool:
        if not self.roles:
            return True
        held = set(roles or ())
        return DIRECTOR in held or bool(held & set(self.roles))

    def requirement(self) -> str:
        """Human description of who can sync this section."""
        if not self.needs_character:
            return "Public data"
        who = " or ".join(self.roles) if self.roles else "any"
        return f"A member with the {who} role" if self.roles else "Any member"


SECTIONS: dict[str, CorpSection] = {}


def register(section: CorpSection) -> CorpSection:
    SECTIONS[section.key] = section
    return section


def ordered() -> list[CorpSection]:
    return sorted(SECTIONS.values(), key=lambda s: (s.order, s.key))


def all_scopes() -> list[str]:
    return sorted({s for section in SECTIONS.values() for s in section.scopes})


S = "conduit.corp.sections"
register(CorpSection("overview", "Overview", f"{S}.overview.sync", ("esi-corporations.read_divisions.v1",), (DIRECTOR,),
                     needs_character=False, interval=3600 * 6, order=0,
                     description="Public details, CEO, tax rate and division names (names need a Director)"))
register(CorpSection("members", "Members", f"{S}.members.sync",
                     ("esi-corporations.read_corporation_membership.v1", "esi-corporations.track_members.v1"),
                     (DIRECTOR,), interval=3600, order=10,
                     description="Member list, member tracking (logins, location, ship), titles and roles"))
register(CorpSection("structures", "Structures", f"{S}.structures.sync", ("esi-corporations.read_structures.v1",),
                     ("Station_Manager",), interval=1800, order=20, description="Upwell structures, fuel and timers"))
register(CorpSection("wallets", "Wallets", f"{S}.wallets.sync", ("esi-wallet.read_corporation_wallets.v1",),
                     ("Accountant", "Junior_Accountant"), interval=3600, order=30, financial=True,
                     description="Division balances, journal and market transactions"))
register(CorpSection("assets", "Assets", f"{S}.assets.sync", ("esi-assets.read_corporation_assets.v1",), (DIRECTOR,),
                     interval=3600 * 2, order=40, description="Everything the corporation owns"))
register(CorpSection("industry", "Industry", f"{S}.industry.sync", ("esi-industry.read_corporation_jobs.v1",),
                     ("Factory_Manager",), interval=1800, order=50, description="Corporation industry jobs"))
register(CorpSection("contracts", "Contracts", f"{S}.contracts.sync", ("esi-contracts.read_corporation_contracts.v1",),
                     interval=1800, order=60, financial=True, description="Contracts issued to or by the corporation"))
register(CorpSection("market", "Market", f"{S}.market.sync", ("esi-markets.read_corporation_orders.v1",),
                     ("Accountant", "Trader"), interval=1800, order=70, financial=True, description="Corporation market orders"))
register(CorpSection("mining", "Mining", f"{S}.mining.sync", ("esi-industry.read_corporation_mining.v1",),
                     ("Accountant", "Station_Manager"), interval=3600, order=80,
                     description="Moon drills: extractions and what members mined"))
register(CorpSection("starbases", "Starbases", f"{S}.starbases.sync", ("esi-corporations.read_starbases.v1",), (DIRECTOR,),
                     interval=3600, order=90, description="Control towers (POS)"))
register(CorpSection("killmails", "Killmails", f"{S}.killmails.sync", ("esi-killmails.read_corporation_killmails.v1",),
                     (DIRECTOR,), interval=1800, order=100, description="Recent kills and losses of the corporation"))
