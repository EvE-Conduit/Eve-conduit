"""A stand-in for EsiClient that serves canned responses by path."""

import re

from evecsm.esi.client import EsiResponse
from evecsm.esi.exceptions import EsiError

CID = 90000001
SDE_TYPES = {
    587: ("Rifter", 25, 6),  # (name, group, category)
    3300: ("Gunnery", 255, 16),
    3301: ("Small Hybrid Turret", 255, 16),
    34: ("Tritanium", 18, 4),
    3467: ("Small Secure Container", 340, 2),
    13219: ("Limited Ocular Filter - Beta", 300, 20),
    691: ("Rifter Blueprint", 105, 9),
}

ROUTES = {
    rf"/characters/{CID}": {"name": "Pilot One", "birthday": "2015-03-01T12:00:00Z", "gender": "female", "race_id": 1, "bloodline_id": 1,
                            "corporation_id": 98000001, "security_status": 2.5, "description": "<font size=12>Fly safe</font>"},
    rf"/characters/{CID}/corporationhistory": [
        {"corporation_id": 98000001, "record_id": 2, "start_date": "2020-01-01T00:00:00Z"},
        {"corporation_id": 1000167, "record_id": 1, "start_date": "2015-03-01T12:00:00Z"},
    ],
    rf"/characters/{CID}/location": {"solar_system_id": 30000142, "station_id": 60003760},
    rf"/characters/{CID}/ship": {"ship_item_id": 1, "ship_name": "Zippy", "ship_type_id": 587},
    rf"/characters/{CID}/online": {"online": True, "last_login": "2026-10-06T10:00:00Z", "logins": 120},
    rf"/characters/{CID}/clones": {"home_location": {"location_id": 60003760, "location_type": "station"},
                                   "jump_clones": [{"jump_clone_id": 7, "location_id": 1035466617946, "location_type": "structure", "implants": [13219]}]},
    rf"/characters/{CID}/implants": [13219],
    rf"/characters/{CID}/fatigue": {"jump_fatigue_expire_date": "2026-10-06T20:00:00Z", "last_jump_date": "2026-10-06T10:00:00Z"},
    rf"/characters/{CID}/titles": [{"title_id": 1, "name": "<b>Line Member</b>"}],
    rf"/characters/{CID}/roles": {"roles": ["Hangar_Take_1", "Accountant"]},
    rf"/characters/{CID}/skills": {"skills": [
        {"skill_id": 3300, "active_skill_level": 4, "trained_skill_level": 4, "skillpoints_in_skill": 45255},
        {"skill_id": 3301, "active_skill_level": 3, "trained_skill_level": 3, "skillpoints_in_skill": 8000},
    ], "total_sp": 53255, "unallocated_sp": 1000},
    rf"/characters/{CID}/attributes": {"charisma": 19, "intelligence": 20, "memory": 20, "perception": 27, "willpower": 21, "bonus_remaps": 1},
    rf"/characters/{CID}/skillqueue": [
        {"queue_position": 0, "skill_id": 3300, "finished_level": 5, "start_date": "2026-10-01T00:00:00Z", "finish_date": "2099-01-01T00:00:00Z",
         "level_start_sp": 45255, "level_end_sp": 256000, "training_start_sp": 45255},
    ],
    rf"/characters/{CID}/wallet": 1234567.89,
    rf"/characters/{CID}/wallet/journal": [
        {"id": 11, "date": "2026-10-05T10:00:00Z", "ref_type": "bounty_prizes", "amount": 500000.0, "balance": 1234567.89, "description": "Bounty", "first_party_id": 1000125, "second_party_id": CID},
        {"id": 10, "date": "2026-10-04T10:00:00Z", "ref_type": "market_transaction", "amount": -100000.0, "balance": 734567.89, "description": "Market", "first_party_id": CID, "second_party_id": 2112000000},
    ],
    rf"/characters/{CID}/wallet/transactions": [
        {"transaction_id": 5, "date": "2026-10-04T10:00:00Z", "type_id": 34, "quantity": 1000, "unit_price": 100.0, "is_buy": True, "is_personal": True,
         "client_id": 2112000000, "location_id": 60003760, "journal_ref_id": 10},
    ],
    rf"/characters/{CID}/assets": [
        {"item_id": 1, "type_id": 587, "quantity": 1, "location_id": 60003760, "location_type": "station", "location_flag": "Hangar", "is_singleton": True},
        {"item_id": 2, "type_id": 3467, "quantity": 1, "location_id": 60003760, "location_type": "station", "location_flag": "Hangar", "is_singleton": True},
        {"item_id": 3, "type_id": 34, "quantity": 5000, "location_id": 2, "location_type": "item", "location_flag": "Unlocked", "is_singleton": False},
        {"item_id": 4, "type_id": 34, "quantity": 10, "location_id": 1, "location_type": "item", "location_flag": "Cargo", "is_singleton": False},
    ],
    rf"/characters/{CID}/blueprints": [
        {"item_id": 50, "type_id": 691, "location_id": 2, "location_flag": "Unlocked", "quantity": -1, "runs": -1, "material_efficiency": 10, "time_efficiency": 20},
        {"item_id": 51, "type_id": 691, "location_id": 60003760, "location_flag": "Hangar", "quantity": -2, "runs": 5, "material_efficiency": 8, "time_efficiency": 16},
    ],
    rf"/characters/{CID}/industry/jobs": [
        {"job_id": 1, "activity_id": 1, "status": "active", "blueprint_id": 50, "blueprint_type_id": 691, "product_type_id": 587, "runs": 10,
         "facility_id": 60003760, "station_id": 60003760, "output_location_id": 60003760, "installer_id": CID, "duration": 3600,
         "start_date": "2026-10-01T00:00:00Z", "end_date": "2099-01-01T00:00:00Z", "cost": 12345.0},
        {"job_id": 2, "activity_id": 8, "status": "delivered", "blueprint_id": 51, "blueprint_type_id": 691, "product_type_id": 587, "runs": 1,
         "facility_id": 60003760, "station_id": 60003760, "output_location_id": 60003760, "installer_id": CID, "duration": 3600,
         "start_date": "2026-09-01T00:00:00Z", "end_date": "2026-09-02T00:00:00Z", "successful_runs": 1, "probability": 0.34},
    ],
    rf"/characters/{CID}/agents_research": [
        {"agent_id": 3009358, "skill_type_id": 3300, "started_at": "2026-09-01T00:00:00Z", "points_per_day": 50.0, "remainder_points": 10.0},
    ],
    rf"/characters/{CID}/mining": [
        {"date": "2099-01-01", "solar_system_id": 30000142, "type_id": 34, "quantity": 1000},
    ],
    rf"/characters/{CID}/planets": [
        {"planet_id": 40009081, "planet_type": "barren", "solar_system_id": 30000142, "upgrade_level": 4, "num_pins": 3, "owner_id": CID, "last_update": "2026-10-05T00:00:00Z"},
    ],
    rf"/characters/{CID}/planets/40009081": {
        "pins": [
            {"pin_id": 1, "type_id": 2848, "latitude": 0, "longitude": 0, "expiry_time": "2000-01-01T00:00:00Z",
             "extractor_details": {"product_type_id": 34, "qty_per_cycle": 5000, "cycle_time": 1800, "heads": [{"head_id": 0, "latitude": 0, "longitude": 0}]}},
            {"pin_id": 2, "type_id": 2469, "latitude": 0, "longitude": 0, "schematic_id": 65},
            {"pin_id": 3, "type_id": 2541, "latitude": 0, "longitude": 0, "contents": [{"type_id": 34, "amount": 777}]},
        ],
        "links": [], "routes": [],
    },
    r"/universe/planets/40009081": {"name": "Jita I", "planet_id": 40009081, "system_id": 30000142, "type_id": 2016, "position": {}},
    rf"/characters/{CID}/orders": [
        {"order_id": 100, "type_id": 34, "is_buy_order": False, "is_corporation": False, "price": 5.5, "volume_total": 1000, "volume_remain": 400,
         "issued": "2026-10-01T00:00:00Z", "duration": 90, "location_id": 60003760, "region_id": 10000002, "range": "region"},
        {"order_id": 101, "type_id": 587, "is_buy_order": True, "is_corporation": False, "price": 300000.0, "volume_total": 2, "volume_remain": 2,
         "escrow": 600000.0, "issued": "2026-10-01T00:00:00Z", "duration": 30, "location_id": 60003760, "region_id": 10000002, "range": "station"},
    ],
    rf"/characters/{CID}/orders/history": [
        {"order_id": 90, "type_id": 34, "is_buy_order": False, "is_corporation": False, "price": 5.0, "volume_total": 10, "volume_remain": 10,
         "issued": "2026-08-01T00:00:00Z", "duration": 30, "location_id": 60003760, "region_id": 10000002, "range": "region", "state": "expired"},
    ],
    rf"/characters/{CID}/contracts": [
        {"contract_id": 7, "type": "item_exchange", "status": "outstanding", "availability": "personal", "for_corporation": False, "title": "Rifter kit",
         "issuer_id": CID, "issuer_corporation_id": 98000001, "assignee_id": 2112000000, "acceptor_id": 0, "price": 1500000.0,
         "date_issued": "2026-10-01T00:00:00Z", "date_expired": "2026-10-15T00:00:00Z", "start_location_id": 60003760, "end_location_id": 60003760},
        {"contract_id": 8, "type": "courier", "status": "finished", "availability": "public", "for_corporation": False,
         "issuer_id": 2112000000, "issuer_corporation_id": 98000001, "assignee_id": 0, "acceptor_id": CID, "reward": 5000000.0, "collateral": 1e8,
         "date_issued": "2026-09-01T00:00:00Z", "date_expired": "2026-09-15T00:00:00Z", "date_completed": "2026-09-03T00:00:00Z",
         "start_location_id": 60003760, "end_location_id": 1035466617946, "volume": 12000.0},
    ],
    rf"/characters/{CID}/contracts/7/items": [
        {"record_id": 1, "type_id": 587, "quantity": 1, "is_included": True, "is_singleton": False},
        {"record_id": 2, "type_id": 34, "quantity": 500, "is_included": True, "is_singleton": False},
    ],
    rf"/characters/{CID}/mail/labels": {"labels": [{"label_id": 1, "name": "Inbox", "unread_count": 1}, {"label_id": 2, "name": "Sent"}], "total_unread_count": 1},
    rf"/characters/{CID}/mail/lists": [{"mailing_list_id": 145000001, "name": "Horde Pings"}],
    rf"/characters/{CID}/mail": [
        {"mail_id": 900, "from": 2112000000, "subject": "Fleet tonight", "timestamp": "2026-10-05T18:00:00Z", "is_read": False, "labels": [1],
         "recipients": [{"recipient_id": CID, "recipient_type": "character"}, {"recipient_id": 145000001, "recipient_type": "mailing_list"}]},
        {"mail_id": 899, "from": CID, "subject": "Re: contract", "timestamp": "2026-10-04T18:00:00Z", "is_read": True, "labels": [2],
         "recipients": [{"recipient_id": 2112000000, "recipient_type": "character"}]},
    ],
    rf"/characters/{CID}/mail/900": {"body": "Form up at <b>19:00</b><br>Bring &amp; fit doctrine ships.", "subject": "Fleet tonight"},
    rf"/characters/{CID}/mail/899": {"body": "Sent the contract."},
    rf"/characters/{CID}/notifications": [
        {"notification_id": 1, "type": "StructureUnderAttack", "sender_id": 1000137, "sender_type": "corporation", "timestamp": "2026-10-05T10:00:00Z",
         "text": "allianceID: 99000001\nshieldPercentage: 42.5\nsolarsystemID: 30000142\n"},
        {"notification_id": 2, "type": "CharAppAcceptMsg", "sender_id": 98000001, "sender_type": "corporation", "timestamp": "2026-10-04T10:00:00Z", "text": "charID: 90000001\n"},
    ],
    rf"/characters/{CID}/calendar": [
        {"event_id": 5, "event_date": "2099-01-01T19:00:00Z", "title": "Alliance CTA", "importance": 1, "event_response": "accepted"},
        {"event_id": 4, "event_date": "2000-01-01T19:00:00Z", "title": "Old op", "importance": 0, "event_response": "not_responded"},
    ],
    rf"/characters/{CID}/calendar/5": {"event_id": 5, "date": "2099-01-01T19:00:00Z", "duration": 120, "importance": 1, "owner_id": 99000001,
                                       "owner_name": "Test Alliance", "owner_type": "alliance", "response": "accepted", "text": "Defend <b>Jita</b>", "title": "Alliance CTA"},
    rf"/characters/{CID}/calendar/4": {"event_id": 4, "date": "2000-01-01T19:00:00Z", "duration": 60, "importance": 0, "owner_id": 1, "owner_name": "EVE System",
                                       "owner_type": "eve_server", "response": "not_responded", "text": "", "title": "Old op"},
    rf"/characters/{CID}/contacts": [
        {"contact_id": 2112000000, "contact_type": "character", "standing": 10.0, "is_watched": True, "label_ids": [1]},
        {"contact_id": 1000125, "contact_type": "corporation", "standing": -10.0, "is_blocked": True},
    ],
    rf"/characters/{CID}/contacts/labels": [{"label_id": 1, "label_name": "Friends"}],
    rf"/characters/{CID}/standings": [
        {"from_id": 500001, "from_type": "faction", "standing": 4.2},
        {"from_id": 1000125, "from_type": "npc_corp", "standing": -1.5},
        {"from_id": 3009358, "from_type": "agent", "standing": 6.0},
    ],
    rf"/characters/{CID}/loyalty/points": [{"corporation_id": 1000125, "loyalty_points": 125000}, {"corporation_id": 1000167, "loyalty_points": 0}],
    rf"/characters/{CID}/fittings": [
        {"fitting_id": 1, "name": "Kite", "description": "PvP", "ship_type_id": 587, "items": [
            {"flag": "HiSlot0", "quantity": 1, "type_id": 3301}, {"flag": "LoSlot0", "quantity": 1, "type_id": 13219}, {"flag": "Cargo", "quantity": 100, "type_id": 34}]},
    ],
    rf"/characters/{CID}/killmails/recent": [{"killmail_id": 777, "killmail_hash": "abc"}, {"killmail_id": 778, "killmail_hash": "def"}],
    r"/killmails/777/abc": {"killmail_id": 777, "killmail_time": "2026-10-03T20:00:00Z", "solar_system_id": 30000142,
                            "victim": {"character_id": 2112000000, "corporation_id": 1000125, "ship_type_id": 587, "damage_taken": 3000,
                                       "items": [{"flag": 27, "item_type_id": 34, "quantity_destroyed": 100, "singleton": 0}]},
                            "attackers": [{"character_id": CID, "damage_done": 3000, "final_blow": True, "security_status": 1.0, "ship_type_id": 587}]},
    r"/killmails/778/def": {"killmail_id": 778, "killmail_time": "2026-10-02T20:00:00Z", "solar_system_id": 30000142,
                            "victim": {"character_id": CID, "corporation_id": 98000001, "ship_type_id": 587, "damage_taken": 2500},
                            "attackers": [{"character_id": 2112000000, "damage_done": 2500, "final_blow": True, "security_status": -5.0, "ship_type_id": 587}]},
    r"/universe/stations/60003760": {"name": "Jita IV - Moon 4 - Caldari Navy Assembly Plant", "system_id": 30000142, "type_id": 1531, "owner": 1000035,
                                     "station_id": 60003760, "max_dockable_ship_volume": 1, "office_rental_cost": 1, "position": {}, "reprocessing_efficiency": 0.5,
                                     "reprocessing_stations_take": 0.05, "services": []},
    r"/universe/structures/1035466617946": {"name": "Perimeter - Tranquility Trading Tower", "owner_id": 98000001, "solar_system_id": 30000144, "type_id": 35834},
    r"/markets/prices": [{"type_id": 587, "average_price": 400000.0}, {"type_id": 34, "average_price": 4.0}],
}


class FakeEsi:
    def __init__(self, routes=None, fail=()):
        self.routes = {**ROUTES, **(routes or {})}
        self.fail = set(fail)
        self.calls = []

    def _find(self, path):
        self.calls.append(path)
        if path in self.fail:
            raise EsiError(500, "boom")
        for pattern, data in self.routes.items():
            if re.fullmatch(pattern, path):
                return data
        raise EsiError(404, f"no fake for {path}")

    def get(self, path, *, character=None, params=None):
        return EsiResponse(self._find(path), 200, {})

    def get_all_pages(self, path, *, character=None, params=None):
        return list(self._find(path))

    def post(self, path, body, *, character=None):
        if path == "/universe/names":
            names = {3009358: ("Research Agent", "character"), 500001: ("Caldari State", "faction"), 1000137: ("DED", "corporation"), 1000167: ("State War Academy", "corporation"), 98000001: ("Test Corp", "corporation"),
                     1000125: ("CONCORD", "corporation"), 2112000000: ("Market Buddy", "character"), CID: ("Pilot One", "character")}
            return EsiResponse([{"id": i, "name": names[i][0], "category": names[i][1]} for i in body if i in names], 200, {})
        if path.endswith("/assets/names"):
            return EsiResponse([{"item_id": i, "name": {1: "Zippy", 2: "Loot box"}.get(i, "None")} for i in body], 200, {})
        return EsiResponse(self._find(path), 200, {})


def load_sde_fixture():
    from evecsm.sde.models import ItemCategory, ItemGroup, ItemType, Region, SkillInfo, SolarSystem, Constellation, Station

    for cat, name in {6: "Ship", 16: "Skill", 4: "Material", 2: "Celestial", 20: "Implant", 9: "Blueprint"}.items():
        ItemCategory.objects.create(id=cat, name=name, published=True)
    for gid, (name, cat) in {25: ("Frigate", 6), 255: ("Gunnery", 16), 18: ("Mineral", 4), 340: ("Secure Cargo Container", 2), 300: ("Cyberimplant", 20), 105: ("Frigate Blueprint", 9)}.items():
        ItemGroup.objects.create(id=gid, name=name, category_id=cat, published=True)
    for tid, (name, gid, _cat) in SDE_TYPES.items():
        ItemType.objects.create(id=tid, name=name, group_id=gid, published=True)
    SkillInfo.objects.create(type_id=3300, rank=1, primary_attribute="perception", secondary_attribute="willpower")
    Region.objects.create(id=10000002, name="The Forge")
    Constellation.objects.create(id=20000020, name="Kimotoro", region_id=10000002)
    SolarSystem.objects.create(id=30000142, name="Jita", constellation_id=20000020, region_id=10000002, security_status=0.9459)
    SolarSystem.objects.create(id=30000144, name="Perimeter", constellation_id=20000020, region_id=10000002, security_status=0.9)
    Station.objects.create(id=60003760, solar_system_id=30000142, type_id=1531, owner_id=1000035)
    from evecsm.sde.models import PlanetSchematic

    PlanetSchematic.objects.create(id=65, name="Superconductors", cycle_time=3600)
    ItemType.objects.filter(pk=34).update(volume=0.01)
