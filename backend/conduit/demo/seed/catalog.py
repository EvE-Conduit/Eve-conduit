"""EVE static data the example data uses. Copied from the real database when it has the static data; these rows
fill in when it doesn't (a site whose first import hasn't finished), so the demo still has names to show."""

# Categories and groups: id -> (name, category id)
CATEGORIES = {65: "Structure", 4: "Material", 6: "Ship", 7: "Module", 9: "Blueprint", 16: "Skill", 18: "Drone", 25: "Asteroid", 8: "Charge"}
GROUPS = {
    18: ("Mineral", 4), 25: ("Frigate", 6), 26: ("Cruiser", 6), 27: ("Battleship", 6), 28: ("Hauler", 6),
    419: ("Combat Battlecruiser", 6), 463: ("Mining Barge", 6), 543: ("Exhumer", 6), 941: ("Industrial Command Ship", 6),
    547: ("Carrier", 6), 485: ("Dreadnought", 6), 832: ("Logistics", 6), 963: ("Strategic Cruiser", 6), 29: ("Capsule", 6),
    462: ("Veldspar", 25), 460: ("Scordite", 25), 459: ("Pyroxeres", 25), 458: ("Plagioclase", 25), 469: ("Omber", 25),
    255: ("Gunnery", 16), 257: ("Spaceship Command", 16), 268: ("Industry", 16), 1218: ("Resource Processing", 16),
    275: ("Navigation", 16), 273: ("Drones", 16), 1209: ("Shields", 16), 1210: ("Armor", 16), 258: ("Leadership", 16),
    270: ("Science", 16), 274: ("Trade", 16), 278: ("Social", 16), 1216: ("Engineering", 16), 256: ("Missiles", 16),
    105: ("Frigate Blueprint", 9), 106: ("Cruiser Blueprint", 9), 53: ("Energy Weapon", 7), 55: ("Projectile Weapon", 7),
    74: ("Hybrid Weapon", 7), 100: ("Combat Drone", 18), 83: ("Projectile Ammo", 8),
    1657: ("Citadel", 65), 1404: ("Engineering Complex", 65), 1406: ("Refinery", 65),
}
# Types: id -> (name, group id)
TYPES = {
    34: ("Tritanium", 18), 35: ("Pyerite", 18), 36: ("Mexallon", 18), 37: ("Isogen", 18), 38: ("Nocxium", 18),
    39: ("Zydrine", 18), 40: ("Megacyte", 18),
    1230: ("Veldspar", 462), 1228: ("Scordite", 460), 1224: ("Pyroxeres", 459), 18: ("Plagioclase", 458), 1227: ("Omber", 469),
    587: ("Rifter", 25), 603: ("Merlin", 25), 597: ("Punisher", 25), 589: ("Executioner", 25),
    626: ("Vexor", 26), 621: ("Caracal", 26), 622: ("Stabber", 26), 627: ("Thorax", 26),
    24698: ("Drake", 419), 24702: ("Hurricane", 419), 24700: ("Myrmidon", 419),
    638: ("Raven", 27), 641: ("Megathron", 27), 642: ("Apocalypse", 27), 639: ("Tempest", 27), 17738: ("Machariel", 27),
    17480: ("Procurer", 463), 17478: ("Retriever", 463), 22544: ("Hulk", 543), 22546: ("Skiff", 543),
    28606: ("Orca", 941), 23757: ("Archon", 547), 23911: ("Thanatos", 547), 19720: ("Revelation", 485), 19722: ("Naglfar", 485),
    11985: ("Basilisk", 832), 11987: ("Guardian", 832), 29984: ("Tengu", 963), 29990: ("Loki", 963), 670: ("Capsule", 29),
    3300: ("Gunnery", 255), 3327: ("Spaceship Command", 257), 3380: ("Industry", 268), 3386: ("Mining", 1218),
    3449: ("Navigation", 275), 3436: ("Drones", 273), 3413: ("Power Grid Management", 1216), 3426: ("CPU Management", 1216),
    3402: ("Science", 270), 3443: ("Trade", 274), 3355: ("Social", 278), 3348: ("Leadership", 258),
    3319: ("Missile Launcher Operation", 256), 3392: ("Mechanics", 1210), 3416: ("Shield Operation", 1209),
    3329: ("Minmatar Frigate", 257), 3330: ("Caldari Frigate", 257), 3328: ("Gallente Frigate", 257), 3331: ("Amarr Frigate", 257),
    3333: ("Minmatar Cruiser", 257), 3334: ("Caldari Cruiser", 257), 3332: ("Gallente Cruiser", 257), 3335: ("Amarr Cruiser", 257),
    3338: ("Caldari Battleship", 257), 3336: ("Gallente Battleship", 257), 3337: ("Minmatar Battleship", 257), 3339: ("Amarr Battleship", 257),
    22536: ("Mining Foreman", 258), 20533: ("Capital Ships", 257), 3455: ("Warp Drive Operation", 275), 3450: ("Afterburner", 275),
    950: ("Rifter Blueprint", 105), 1178: ("Vexor Blueprint", 106),
    2488: ("Hobgoblin I", 100), 2454: ("Hammerhead I", 100), 2185: ("Hammerhead II", 100),
    484: ("125mm Gatling AutoCannon I", 55), 3001: ("Light Neutron Blaster I", 74), 3057: ("Dual Light Beam Laser I", 53),
    185: ("EMP S", 83),
    35832: ("Astrahus", 1657), 35833: ("Fortizar", 1657), 35825: ("Raitaru", 1404), 35826: ("Azbel", 1404),
    35835: ("Athanor", 1406),
}
SKILL_CATEGORY = 16
SHIP_CATEGORY = 6

# Map: regions -> constellations -> systems (id: (name, constellation id, region id, security))
REGIONS = {10000002: "The Forge", 10000043: "Domain", 10000032: "Sinq Laison", 10000030: "Heimatar", 10000042: "Metropolis"}
CONSTELLATIONS = {20000020: ("Kimotoro", 10000002), 20000322: ("Throne Worlds", 10000043), 20000389: ("Essence", 10000032),
                  20000367: ("Hed", 10000030), 20000304: ("Hek", 10000042)}
SYSTEMS = {
    30000142: ("Jita", 20000020, 10000002, 0.95), 30000144: ("Perimeter", 20000020, 10000002, 0.95),
    30002187: ("Amarr", 20000322, 10000043, 1.0), 30002659: ("Dodixie", 20000389, 10000032, 0.87),
    30002510: ("Rens", 20000367, 10000030, 0.9), 30002053: ("Hek", 20000304, 10000042, 0.5),
}
# NPC stations: id -> (name, system id)
STATIONS = {
    60003760: ("Jita IV - Moon 4 - Caldari Navy Assembly Plant", 30000142),
    60008494: ("Amarr VIII (Oris) - Emperor Family Academy", 30002187),
    60011866: ("Dodixie IX - Moon 20 - Federation Navy Assembly Plant", 30002659),
    60004588: ("Rens VI - Moon 8 - Brutor Tribe Treasury", 30002510),
    60005686: ("Hek VIII - Moon 12 - Boundless Creation Factory", 30002053),
}
